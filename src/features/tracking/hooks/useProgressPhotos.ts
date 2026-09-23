import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

// PRIVATE bucket (migration 028). Never make it public; every display URL is a
// short-lived signed URL. We never console.log paths or URLs — these are
// private body photos.
const BUCKET = 'progress-photos'
const SIGNED_URL_TTL_SECONDS = 300 // 5 min — short-lived; re-sign on demand
const MAX_DIMENSION = 1280 // downscale longest edge to keep storage small
const JPEG_QUALITY = 0.8

export type Pose = 'front' | 'side' | 'back'
export const POSES: Pose[] = ['front', 'side', 'back']

export interface ProgressPhoto {
  id: string
  taken_on: string // yyyy-mm-dd
  pose: Pose
  storage_path: string
  created_at: string
}

export interface ProgressPhotosApi {
  photos: ProgressPhoto[]
  loading: boolean
  /** the pose currently uploading (e.g. 'front'), or null */
  uploading: Pose | null
  error: string | null
  refresh: () => Promise<void>
  uploadPhoto: (pose: Pose, file: File, takenOn: string) => Promise<{ error: string | null }>
  /** path → short-lived signed URL. Empty entries omitted. */
  getSignedUrls: (paths: string[]) => Promise<Record<string, string>>
}

// Downscale + re-encode to JPEG on the client so we never upload a 5 MB phone
// photo. Falls back to the original file if the canvas path is unavailable.
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    let { width, height } = bitmap
    const longest = Math.max(width, height)
    if (longest > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / longest
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    return blob ?? file
  } catch {
    return file
  }
}

/**
 * Upload / list / sign progress photos for the current user. All storage paths
 * are `<uid>/<taken_on>/<pose>.jpg` — the exact prefix storage RLS confines the
 * user to, so a broken client can still never touch another user's objects.
 */
export function useProgressPhotos(): ProgressPhotosApi {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<Pose | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setPhotos([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('progress_photos')
      .select('id, taken_on, pose, storage_path, created_at')
      .eq('user_id', user.id)
      .order('taken_on', { ascending: false })
      .order('created_at', { ascending: true })
    setPhotos((data as ProgressPhoto[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const uploadPhoto = useCallback(
    async (pose: Pose, file: File, takenOn: string): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not signed in' }
      setUploading(pose)
      setError(null)

      const path = `${user.id}/${takenOn}/${pose}.jpg`
      const blob = await compressImage(file)

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (upErr) {
        setUploading(null)
        setError('Upload failed — please try again.') // never surface the path/URL
        return { error: 'upload' }
      }

      const { error: dbErr } = await supabase
        .from('progress_photos')
        .upsert(
          { user_id: user.id, taken_on: takenOn, pose, storage_path: path },
          { onConflict: 'user_id,taken_on,pose' },
        )
      if (dbErr) {
        setUploading(null)
        setError('Saved the image but not the entry — please try again.')
        return { error: 'db' }
      }

      await refresh()
      setUploading(null)
      return { error: null }
    },
    [user, refresh],
  )

  const getSignedUrls = useCallback(async (paths: string[]): Promise<Record<string, string>> => {
    if (!paths.length) return {}
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
    const map: Record<string, string> = {}
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) map[item.path] = item.signedUrl
    }
    return map
  }, [])

  return { photos, loading, uploading, error, refresh, uploadPhoto, getSignedUrls }
}

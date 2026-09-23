import { WeightTracker } from '../weight/WeightTracker'
import { CardioTracker } from './CardioTracker'
import { DailyTracker } from './DailyTracker'
import { LiftProgress } from './LiftProgress'
import { PhotoReminder } from './PhotoReminder'
import { PhotoTimeline } from './PhotoTimeline'
import { RecoveryWatch } from './RecoveryWatch'
import { useProgressPhotos } from './hooks/useProgressPhotos'

export function TrackPage() {
  const gallery = useProgressPhotos()

  return (
    <div className="space-y-6 pb-4">
      <RecoveryWatch />
      <PhotoReminder gallery={gallery} />
      <WeightTracker />
      <LiftProgress />
      <PhotoTimeline gallery={gallery} />
      <div className="h-px bg-slate-800" />
      <CardioTracker />
      <div className="h-px bg-slate-800" />
      <DailyTracker />
    </div>
  )
}

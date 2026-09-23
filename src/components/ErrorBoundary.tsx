import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  /** When any value here changes, a latched error is cleared. Pass the active
   *  tab so a crash on one tab doesn't stick across all tabs. */
  resetKeys?: unknown[]
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.state.hasError) return
    const prev = prevProps.resetKeys
    const next = this.props.resetKeys
    const changed =
      !prev || !next || prev.length !== next.length || prev.some((k, i) => !Object.is(k, next[i]))
    if (changed) this.setState({ hasError: false, error: null })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-700 bg-card p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 transition-colors active:bg-slate-700"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

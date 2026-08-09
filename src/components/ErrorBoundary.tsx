import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  sectionName?: string
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.sectionName ? `:${this.props.sectionName}` : ''}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {this.props.sectionName ? `Erreur dans « ${this.props.sectionName} »` : 'Quelque chose a cassé'}
          </p>
          <p className="mt-1 text-xs text-red-500/80 dark:text-red-400/60">
            {this.state.error?.message || 'Une erreur inattendue s\'est produite.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
    // Sentry picks this up automatically via @sentry/nextjs
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="text-center">
            <p className="text-slate-500 text-sm">Ein Fehler ist aufgetreten.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-3 text-sm text-slate-400 hover:text-slate-700 underline"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="text-center">
            <div className="
              w-20 h-20
              bg-error/10
              rounded-3xl
              flex items-center justify-center
              mx-auto mb-5
            ">
              <AlertTriangle className="w-10 h-10 text-error" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-medium text-charcoal mb-2">
              Xatolik yuz berdi
            </h2>
            <p className="text-medium-gray mb-8 max-w-xs mx-auto">
              Iltimos, qaytadan urinib ko'ring
            </p>
            <Button
              onClick={this.handleRetry}
              variant="green"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Qayta yuklash
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
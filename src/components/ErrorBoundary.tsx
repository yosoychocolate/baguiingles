import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { message: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null }

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message || 'Erro inesperado.' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.message) return this.props.children
    return (
      <div className="onboarding">
        <div className="ob-card">
          <h2>Algo travou a tela</h2>
          <p>{this.state.message}</p>
          <div className="row-actions">
            <button
              className="primary"
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('maya.english.v2')
                  localStorage.removeItem('maya.english.v1')
                } catch {
                  /* ignore */
                }
                location.href = '/'
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </div>
    )
  }
}

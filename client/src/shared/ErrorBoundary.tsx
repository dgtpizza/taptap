import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '@/shared/errors'
import { keys, t } from '@/shared/i18n'
import { FullScreenState, RetryButton } from '@/shared/ui/StateMessage'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, { boundary: 'app', componentStack: info.componentStack ?? undefined })
  }

  override render() {
    if (this.state.failed) {
      return (
        <FullScreenState
          title={t(keys.somethingWentWrong)}
          footer={<RetryButton label={t(keys.reload)} onClick={() => window.location.reload()} />}
        />
      )
    }

    return this.props.children
  }
}

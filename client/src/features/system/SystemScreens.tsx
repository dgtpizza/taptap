import { Link } from 'react-router-dom'
import { keys, t } from '@/shared/i18n'
import { FullScreenState, RetryButton } from '@/shared/ui/StateMessage'
import { LockIcon } from '@/shared/ui/icons'

export function NoTelegram() {
  return <FullScreenState title={t(keys.needTelegram)} body={t(keys.openFromTelegram)} />
}

export function SessionExpired() {
  return (
    <FullScreenState
      icon={<LockIcon size={40} />}
      iconClassName="text-danger"
      title={t(keys.sessionExpired)}
      body={t(keys.sessionExpiredBody)}
      footer={<RetryButton label={t(keys.reload)} onClick={() => window.location.reload()} />}
    />
  )
}

export function NotFound() {
  return (
    <FullScreenState
      title={t(keys.notFound)}
      body={t(keys.notFoundBody)}
      footer={
        <Link
          to="/"
          data-testid="not-found-home"
          className="flex h-12 w-[200px] items-center justify-center rounded-button bg-accent text-base font-semibold text-on-accent"
        >
          {t(keys.backToGame)}
        </Link>
      }
    />
  )
}

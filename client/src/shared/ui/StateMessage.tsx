import type { ReactNode } from 'react'

export function StateMessage({
  icon,
  iconClassName = 'text-muted',
  title,
  body,
  gapClassName = 'gap-xl',
  footer,
}: {
  icon?: ReactNode
  iconClassName?: string
  title: string
  body?: string
  gapClassName?: string
  footer?: ReactNode
}) {
  return (
    <div className={`flex h-full flex-col items-center justify-center px-2xl ${gapClassName}`}>
      {icon ? (
        <div className="flex h-[88px] w-[88px] items-center justify-center rounded-pill bg-surface-strong">
          <span className={iconClassName}>{icon}</span>
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-sm">
        <h1 className="text-[20px] font-semibold text-ink" data-testid="state-title">{title}</h1>
        {body ? (
          <p className="max-w-[280px] text-center text-[15px] leading-[1.3] text-muted" data-testid="state-body">
            {body}
          </p>
        ) : null}
      </div>
      {footer}
    </div>
  )
}

export function RetryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="state-action"
      className="h-12 w-[200px] cursor-pointer rounded-button border-0 bg-accent text-base font-semibold text-on-accent"
    >
      {label}
    </button>
  )
}

export function FullScreenState(props: Parameters<typeof StateMessage>[0]) {
  return (
    <div className="h-dvh text-ink">
      <StateMessage {...props} />
    </div>
  )
}

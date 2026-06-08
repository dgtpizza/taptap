type ErrorContext = Record<string, string | number | boolean | undefined>

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export function reportError(err: unknown, context: ErrorContext = {}): void {
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    console.error('[client-error]', context, err)
  }
}

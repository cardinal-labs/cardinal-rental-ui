import type * as Sentry from '@sentry/types'

export type Trace = ReturnType<Sentry.Hub['startTransaction']>

export const withTrace = async <T>(
  fn: () => Promise<T>,
  trace?: Trace,
  ctx?: Pick<
    Sentry.SpanContext,
    Exclude<
      keyof Sentry.SpanContext,
      'spanId' | 'sampled' | 'traceId' | 'parentSpanId'
    >
  >
) => {
  const tokenManagerSpan = trace?.startChild(ctx)
  const r = await fn()
  tokenManagerSpan?.finish()
  return r
}

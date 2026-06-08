export function AppBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute -inset-1/4 [animation:blob-a_22s_ease-in-out_infinite_alternate]"
        style={{
          background:
            'radial-gradient(44% 40% at 25% 18%, rgba(124, 58, 237, 0.42), transparent 72%),' +
            'radial-gradient(48% 42% at 72% 80%, rgba(99, 102, 241, 0.32), transparent 74%)',
        }}
      />
      <div
        className="absolute -inset-1/4 [animation:blob-b_29s_ease-in-out_infinite_alternate]"
        style={{
          background:
            'radial-gradient(46% 40% at 84% 22%, rgba(51, 144, 236, 0.36), transparent 72%),' +
            'radial-gradient(42% 38% at 14% 84%, rgba(124, 58, 237, 0.30), transparent 74%)',
        }}
      />
    </div>
  )
}

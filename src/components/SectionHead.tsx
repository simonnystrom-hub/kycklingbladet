export function SectionHead({children}: {children: React.ReactNode}) {
  return (
    <header className="mb-5 border-t-2 border-b border-[var(--brass)] py-2 sm:mb-6">
      <h2
        className="text-center text-[var(--brass)]"
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          fontVariant: 'small-caps',
        }}
      >
        {children}
      </h2>
    </header>
  )
}

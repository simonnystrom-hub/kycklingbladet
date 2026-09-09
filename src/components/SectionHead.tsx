export function SectionHead({children}: {children: React.ReactNode}) {
  return (
    <header className="mb-3 border-t-2 border-b border-[var(--brass)] py-1.5 sm:mb-4">
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

export function DoomsdayClock() {
  return (
    <div
      aria-hidden
      className="relative shrink-0"
      style={{width: 54, height: 54}}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{border: '1px solid var(--brass)'}}
      />
      {/* Hour ~8° past 11 → 338°; minute near 59 → 354° */}
      <div
        className="absolute left-1/2 top-1/2 bg-[var(--brass)]"
        style={{
          width: 2,
          height: 14,
          marginLeft: -1,
          marginTop: -14,
          transformOrigin: 'bottom center',
          transform: 'rotate(338deg)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 bg-[var(--brass)]"
        style={{
          width: 1.5,
          height: 18,
          marginLeft: -0.75,
          marginTop: -18,
          transformOrigin: 'bottom center',
          transform: 'rotate(354deg)',
        }}
      />
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 uppercase tracking-[0.18em] text-[var(--brass)]"
        style={{fontSize: 8, lineHeight: 1}}
      >
        nästan
      </span>
    </div>
  )
}

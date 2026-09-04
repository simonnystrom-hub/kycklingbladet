function handPoint(degreesFromTwelve: number, length: number) {
  const radians = (degreesFromTwelve * Math.PI) / 180
  return {
    x: 32 + length * Math.sin(radians),
    y: 32 - length * Math.cos(radians),
  }
}

const HOUR = handPoint(338, 11)
const MINUTE = handPoint(354, 16)

const TICKS = Array.from({length: 12}, (_, index) => {
  const degrees = index * 30
  const cardinal = index % 3 === 0
  const inner = handPoint(degrees, cardinal ? 21.5 : 23.5)
  const outer = handPoint(degrees, cardinal ? 27.5 : 26.5)
  return {inner, outer, cardinal}
})

export function DoomsdayClock() {
  return (
    <div aria-hidden className="flex shrink-0 flex-col items-center">
      <svg
        viewBox="0 0 64 64"
        className="h-9 w-9 text-[var(--brass)] sm:h-[58px] sm:w-[58px] lg:h-[72px] lg:w-[72px]"
      >
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
        />
        <circle
          cx="32"
          cy="32"
          r="27.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          opacity="0.55"
        />
        {TICKS.map((tick) => (
          <line
            key={`${tick.outer.x}-${tick.outer.y}`}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke="currentColor"
            strokeWidth={tick.cardinal ? 1.35 : 0.7}
            strokeLinecap="square"
          />
        ))}
        <line
          x1="32"
          y1="32"
          x2={HOUR.x}
          y2={HOUR.y}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="32"
          x2={MINUTE.x}
          y2={MINUTE.y}
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
        <circle cx="32" cy="32" r="2.1" fill="currentColor" />
        <circle cx="32" cy="32" r="0.7" fill="var(--bg)" />
      </svg>
      <span className="mt-1 font-serif text-[10px] italic leading-none tracking-[0.22em] text-[var(--brass)] lg:text-[11px]">
        nästan
      </span>
    </div>
  )
}

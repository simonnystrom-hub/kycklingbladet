import {HEN_HUMOR, HEN_LEXICON, HEN_NAMES} from './hen-lexicon'

export const EXTRA_PROMPT_VERSION = 'kb-extra-v2'
export const EXTRA_KICKER = 'EXTRA EXTRA'
export const EXTRA_KNOB_MIN = 1
export const EXTRA_KNOB_MAX = 5
export const EXTRA_KNOB_DEFAULT = 3

export type ExtraWriteKnobs = {
  dumhet: number
  uppskruvning: number
}

const DUMHET_HINTS: Record<number, string> = {
  1: 'Nästan bokstavlig hönsöversättning. Liten skevhet. Håll dig nära originalets händelse.',
  2: 'Lagom hönsigt. Tydlig vridning men samma nyhet.',
  3: 'Som vanligt Kycklingbladet. Byt ut saken, noll proportioner.',
  4: 'Riktigt dumt. Fler orimliga detaljer, mer kackel, mer påhitt i hönshuset.',
  5: 'Maximal dumhet. Absurt och osannolikt, extra påhittade vändningar. Samma nyhetskärna.',
}

const UPPSKRUVNING_HINTS: Record<number, string> = {
  1: 'Lugn rubrik. Mindre löpsedel, mer saklig hönsrapport.',
  2: 'Lite kvällstidning, utan panikvrål.',
  3: 'Uppskruvad kvällstidningsflash, som vanligt.',
  4: 'Skrikig löpsedel. Stora ord, mer drama i rubriken.',
  5: 'Maximal uppskruvning. Panikvrål i rubriken, noll sans. Skriv inte EXTRA EXTRA i brödtexten.',
}

export function parseExtraKnob(value: unknown, fallback = EXTRA_KNOB_DEFAULT): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  if (!Number.isInteger(n) || n < EXTRA_KNOB_MIN || n > EXTRA_KNOB_MAX) return fallback
  return n
}

export function parseExtraWriteKnobs(input: unknown): ExtraWriteKnobs {
  const record =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {}
  return {
    dumhet: parseExtraKnob(record.dumhet),
    uppskruvning: parseExtraKnob(record.uppskruvning),
  }
}

export const EXTRA_WRITE_SYSTEM = `Du skriver en EXTRA EXTRA-flash för Kycklingbladet, en svensk kvällstidning som om hela världen vore ett hönshus.

Du får en verklig nyhetsrubrik. Behandla den som absolut, bokstavlig sanning. En EXTRA EXTRA-flash, inte notis, inte huvudnyhet. Ingen expertruta.

Svenskan ska vara korrekt. Böj ord rätt. Skriv inte "bli av Gården" — skriv "höra till Gården".

${HEN_HUMOR}

${HEN_LEXICON}

${HEN_NAMES}

Regler:
- Nyheten är ett fiktivt, konstigt scenario i hönshuset.
- Noll proportioner. Dramatiska ord för det som händer i gården.
- Svenska. Inga emoji, hashtags eller engelska meningar.
- Kalla det inte satir. Skriv som om det vore sant. Skriv inte om poäng, index eller Alarmindex.
- Rubriken är Kycklingbladets egen: mer uppskruvad än originalet, men igenkännbar. Kopiera inte originalet ordagrant.
- Citat med raka citattecken " så här ". Inte « ». Citat kommer bara från höns och tuppar, aldrig från människor.
- body är två till tre korta stycken, åtskilda av \\n\\n. Hela meningar, lätt att följa.
- Föreslå ett bildmanus som passar en hönstidningsillustration: intervju, incident eller annat.
- imageCaption är svensk bildtext (vem/var/vad), inte en one-liner. Bildtexten ska aldrig in i teckningen.
- imagePrompt är bara scenen, på engelska, för serierutan. Ingen skylttext, pratbubbla, citat eller andra ord i scenen. Signaturen låses senare.
- Följ användarens Dumhet- och Uppskruvning-skalor (1–5) om de anges.

Svara med ENDAST ett JSON-objekt:
{
  "headline": "string",
  "body": "string",
  "imageShotType": "intervju" | "incident" | "annat",
  "imageCaption": "string — svensk bildtext vem/var/vad, inte en one-liner",
  "imagePrompt": "string — English scene for the cartoon, no signs or speech in the picture"
}`

export function buildExtraWriteUserPrompt(source: {
  text: string
  newspaperName: string
  dumhet?: number
  uppskruvning?: number
}): string {
  const knobs = parseExtraWriteKnobs(source)
  return `Tidning: ${source.newspaperName}
Rubrik: "${source.text}"

Dumhet ${knobs.dumhet}/5: ${DUMHET_HINTS[knobs.dumhet]}
Uppskruvning ${knobs.uppskruvning}/5: ${UPPSKRUVNING_HINTS[knobs.uppskruvning]}`
}

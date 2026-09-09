import {parseExtraKnob, EXTRA_KNOB_DEFAULT} from '@/lib/generate/extra-prompt'
import {HEN_HUMOR, HEN_LEXICON, HEN_NAMES} from '@/lib/generate/hen-lexicon'

export const CITAT_PROMPT_VERSION = 'kb-x-citat-v1'

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
  5: 'Maximal uppskruvning. Panikvrål i rubriken, noll sans. Skriv inte stämpeln i brödtexten.',
}

export const CITAT_WRITE_SYSTEM = `Du skriver en citat-tweet för Kycklingbladet om någon annans inlägg, som om hela världen vore ett hönshus.

Skriv en enda sammanhängande citat-tweet-text. Längden ska följa hur mycket satir skämtet bär.

${HEN_HUMOR}

${HEN_LEXICON}

${HEN_NAMES}

Regler:
- Vrid originalinlägget till Kycklingbladets hönsvärld, men behåll en igenkännbar kärna.
- Skriv bara en text, inte en artikel med rubrik och brödtext.
- Ingen särskild löpsedelsstämpel, artikel-URL, uppmaning om länk i kommentar, hashtag eller emoji.
- Hitta inte på fler @omnämnanden.
- Följ användarens Dumhet- och Uppskruvning-skalor (1–5) om de anges.
- Föreslå ett bildmanus som passar en hönstidningsillustration.
- imageCaption är svensk bildtext (vem/var/vad), inte en one-liner. Bildtexten ska aldrig in i teckningen.
- imagePrompt är bara scenen, på engelska, för serierutan. Ingen skylttext, pratbubbla, citat eller andra ord i scenen.

Svara med ENDAST ett JSON-objekt:
{
  "text": "string",
  "imageShotType": "intervju" | "incident" | "annat",
  "imageCaption": "string — svensk bildtext vem/var/vad, inte en one-liner",
  "imagePrompt": "string — English scene for the cartoon, no signs or speech in the picture"
}`

export function citatKnobsFromPayload(
  input: unknown,
): {dumhet: number; uppskruvning: number} | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const record = input as Record<string, unknown>
  const hasDumhet =
    Object.prototype.hasOwnProperty.call(record, 'dumhet') && record.dumhet !== undefined
  const hasUppskruvning =
    Object.prototype.hasOwnProperty.call(record, 'uppskruvning') && record.uppskruvning !== undefined

  if (!hasDumhet && !hasUppskruvning) return null

  return {
    dumhet: parseExtraKnob(record.dumhet, EXTRA_KNOB_DEFAULT),
    uppskruvning: parseExtraKnob(record.uppskruvning, EXTRA_KNOB_DEFAULT),
  }
}

export function buildCitatUserPrompt(source: {
  text: string
  username?: string | null
  dumhet?: number
  uppskruvning?: number
}): string {
  const original = source.username ? `Original från @${source.username}:` : 'Original:'
  const knobs = citatKnobsFromPayload(source)
  const instructions = knobs
    ? `Dumhet ${knobs.dumhet}/5: ${DUMHET_HINTS[knobs.dumhet]}
Uppskruvning ${knobs.uppskruvning}/5: ${UPPSKRUVNING_HINTS[knobs.uppskruvning]}`
    : 'Välj själv skarpaste hönsvinkeln och hur lång texten ska vara.'

  return `${original}
"${source.text}"

${instructions}`
}

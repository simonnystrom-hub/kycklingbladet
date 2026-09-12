import {parseExtraKnob, EXTRA_KNOB_DEFAULT} from '@/lib/generate/extra-prompt'
import {HEN_HUMOR, henLexiconForLanguage, henNamesForLanguage} from '@/lib/generate/hen-lexicon'
import type {XCopyLanguage} from '@/lib/x/language'

export const CITAT_PROMPT_VERSION = 'kb-x-citat-v4'

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

export function citatWriteSystem(language: XCopyLanguage = 'sv'): string {
  const captionRule =
    language === 'en'
      ? '- imageCaption is an English picture caption (who/where/what), not a one-liner. Never put the caption in the drawing.'
      : '- imageCaption är svensk bildtext (vem/var/vad), inte en one-liner. Bildtexten ska aldrig in i teckningen.'
  const languageRule =
    language === 'en'
      ? '- Write the hen tweet in English. Do not write Swedish except hen-ified names that already mix languages.'
      : '- Skriv citat-tweeten på svenska.'
  const captionJson =
    language === 'en'
      ? '"imageCaption": "string — English caption who/where/what, not a one-liner"'
      : '"imageCaption": "string — svensk bildtext vem/var/vad, inte en one-liner"'

  return `Du skriver en citat-tweet för Kycklingbladet om någon annans inlägg, som om hela världen vore ett hönshus.

Skriv en enda sammanhängande citat-tweet-text. Längden ska följa hur mycket satir skämtet bär.

${HEN_HUMOR}

${henLexiconForLanguage(language)}

${henNamesForLanguage(language)}

Regler:
- Vrid originalinlägget till Kycklingbladets hönsvärld, men behåll en igenkännbar kärna.
- Skriv bara en text, inte en artikel med rubrik och brödtext.
- Sätt hela citat-tweeten inom raka citattecken " så här ". Inte « ». Inte typografiska citattecken.
- Ingen särskild löpsedelsstämpel, artikel-URL, uppmaning om länk i kommentar, hashtag eller emoji i själva citat-tweeten.
- Hitta inte på fler @omnämnanden.
- hashtags i JSON: 1–3 extra X-taggar för den verkliga nyheten (nato, migpol, klimat). Inte hönsord. Inte svpol. Bara a–z och siffror, inga åäö (skriv forsvar inte försvar). Utan #-tecken.
- Följ användarens Dumhet- och Uppskruvning-skalor (1–5) om de anges.
- Föreslå ett bildmanus som passar en hönstidningsillustration.
${captionRule}
- imagePrompt är bara scenen, på engelska, för serierutan. Ingen skylttext, pratbubbla, citat eller andra ord i scenen.
${languageRule}

Svara med ENDAST ett JSON-objekt:
{
  "text": "string",
  "imageShotType": "intervju" | "incident" | "annat",
  ${captionJson},
  "imagePrompt": "string — English scene for the cartoon, no signs or speech in the picture",
  "hashtags": ["nato", "forsvar"]
}`
}

export const CITAT_WRITE_SYSTEM = citatWriteSystem('sv')

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

export function citatSpeechBubbleSystem(language: XCopyLanguage = 'sv'): string {
  const languageRule =
    language === 'en'
      ? '- Funny, short, English. Not the whole quote-tweet. No URL, @, hashtag, or emoji.'
      : '- Rolig, kort, svensk. Inte hela citat-tweeten. Ingen URL, inget @, inget hashtag, ingen emoji.'

  return `Du skriver en enda kort pratbubbla till en Kycklingbladet-serieruta.

${HEN_HUMOR}

${henLexiconForLanguage(language)}

Regler:
- En hönsreplik som en höna eller tupp säger i en pratbubbla, 3–8 ord.
${languageRule}
- JSON only: {"text":"string"}`
}

export const CITAT_SPEECH_BUBBLE_SYSTEM = citatSpeechBubbleSystem('sv')

export function buildCitatSpeechBubbleUserPrompt(source: {text: string}): string {
  return `Citat-tweet att illustrera:
"${source.text.trim()}"

Skriv pratbubblan.`
}

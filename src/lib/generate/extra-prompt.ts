import {HEN_HUMOR, HEN_LEXICON, HEN_NAMES} from './hen-lexicon'

export const EXTRA_PROMPT_VERSION = 'kb-extra-v2'
export const EXTRA_KICKER = 'EXTRA EXTRA'

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

Svara med ENDAST ett JSON-objekt:
{
  "headline": "string",
  "body": "string",
  "imageShotType": "intervju" | "incident" | "annat",
  "imageCaption": "string — svensk bildtext vem/var/vad, inte en one-liner",
  "imagePrompt": "string — English scene for the cartoon, no signs or speech in the picture"
}`

export function buildExtraWriteUserPrompt(source: {text: string; newspaperName: string}): string {
  return `Tidning: ${source.newspaperName}\nRubrik: "${source.text}"`
}

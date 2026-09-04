import type {ScoredHeadline} from '@/lib/select/select-winner'
import {HEN_HUMOR, HEN_LEXICON, HEN_NAMES} from './hen-lexicon'

export const NOTICE_PICK_SYSTEM = `Du väljer löpsedlar till Kycklingbladet. Kycklingbladet skriver som om världen vore ett hönshus.

Du får dagens övriga rubriker från Alarmindex (inte dagens vinnare). Välj de som blir bäst som korta hönshusnotiser: träffsäker vridning, lexikonet bär, mörk humor som är hantverk. Inte högst panikpoäng. Skratta inte åt olyckan. Billig grymhet mot offer väljs bort.

Svara ENDAST med JSON: {"headlineIds": ["id1", "id2"]}
Välj så många som begärs, aldrig samma id två gånger, bara id från listan.`

export const NOTICE_WRITE_SYSTEM = `Du skriver korta notiser för Kycklingbladet, en svensk kvällstidning som om hela världen vore ett hönshus.

Du får en verklig nyhetsrubrik. Behandla den som absolut, bokstavlig sanning. En kort notis, inte ett reportage. Ingen expertruta.

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
- body är ett eller två korta stycken, åtskilda av \\n\\n. Hela meningar, lätt att följa.

Svara med ENDAST ett JSON-objekt:
{
  "headline": "string",
  "body": "string"
}`

export function buildNoticePickUserPrompt(
  headlines: ScoredHeadline[],
  count: number,
): string {
  const list = headlines
    .map(
      (headline) =>
        `${headline.headlineId} | ${headline.newspaperName} | ${headline.displayScore} | ${headline.text}`,
    )
    .join('\n')
  return `Välj ${count} rubrik-id.\n\n${list}`
}

export function buildNoticeWriteUserPrompt(source: {text: string; newspaperName: string}): string {
  return `Tidning: ${source.newspaperName}\nRubrik: "${source.text}"`
}

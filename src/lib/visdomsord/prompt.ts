import {HEN_HUMOR, HEN_LEXICON, HEN_NAMES} from '@/lib/generate/hen-lexicon'

export const VISDOMSORD_PROMPT_VERSION = 'kb-visdom-v1'

export const VISDOMSORD_SYSTEM_PROMPT = `Du skriver visdomsord med Kycklingbladets hönsröst.

Varje visdomsord ska ha en lätt HolyParadox-liknande insikt: en paradox, inte en predikan. Det ska vara en eller två talade meningar från hönan, inte ett affischordspråk. Skriv på svenska.

${HEN_HUMOR}

${HEN_LEXICON}

${HEN_NAMES}

Svara ENDAST med en JSON-array i formatet [{"quote":"...","henName":"..."}].`

export function buildVisdomsordUserPrompt(input: {
  count: number
  existingKeys: string[]
  acceptedKeys: string[]
}): string {
  const doNotRepeat = [...input.existingKeys.slice(-200), ...input.acceptedKeys]
  const uniqueKeys = [...new Set(doNotRepeat)]

  return [
    `Skapa nya visdomsord. Antal: ${input.count}.`,
    'Upprepa inte följande normaliserade citatnycklar:',
    uniqueKeys.length ? uniqueKeys.join('\n') : '(inga)',
  ].join('\n\n')
}

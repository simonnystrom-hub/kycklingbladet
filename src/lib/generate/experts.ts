export const EXPERT_VOICES = [
  'Överhönan',
  'Högsta hönset',
  'Gårdsanalytikern',
  'Fjäderprognosen',
] as const

export type ExpertVoice = (typeof EXPERT_VOICES)[number]

export function isExpertVoice(value: string): value is ExpertVoice {
  return (EXPERT_VOICES as readonly string[]).includes(value)
}

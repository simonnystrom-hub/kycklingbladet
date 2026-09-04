import { describe, expect, it } from 'vitest'
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from './prompt'

describe('PROMPT_VERSION', () => {
  it('is kb-v8', () => {
    expect(PROMPT_VERSION).toBe('kb-v8')
  })
})

describe('SYSTEM_PROMPT', () => {
  it('locks the hen-house lexicon', () => {
    expect(SYSTEM_PROMPT).toContain('barn = kyckling')
    expect(SYSTEM_PROMPT).toContain('kvinna = höna')
    expect(SYSTEM_PROMPT).toContain('man = tupp')
    expect(SYSTEM_PROMPT).toContain('ungdom = unghöns')
    expect(SYSTEM_PROMPT).toContain('bäbis = dununge')
    expect(SYSTEM_PROMPT).toContain('åldring = gammelhöns')
    expect(SYSTEM_PROMPT).toContain('kriminell = räv')
    expect(SYSTEM_PROMPT).toContain('död = plockad')
    expect(SYSTEM_PROMPT).toContain('lik = fjäderhög')
    expect(SYSTEM_PROMPT).toContain('hönsa eller tuppifiera')
    expect(SYSTEM_PROMPT).toContain('länder = gårdar')
  })

  it('locks the four expert voices', () => {
    expect(SYSTEM_PROMPT).toContain('Överhönan')
    expect(SYSTEM_PROMPT).toContain('Högsta hönset')
    expect(SYSTEM_PROMPT).toContain('Gårdsanalytikern')
    expect(SYSTEM_PROMPT).toContain('Fjäderprognosen')
  })

  it('requires a coherent hen-yard scenario, not human extras', () => {
    expect(SYSTEM_PROMPT).toMatch(/hönas|kyckling eller tupp/)
    expect(SYSTEM_PROMPT).toContain('Göran')
  })

  it('asks for followable prose, skewed humor, hen names, and straight quotes', () => {
    expect(SYSTEM_PROMPT).toContain('tre till fyra korta stycken')
    expect(SYSTEM_PROMPT).toContain('Skriv inte räddningsrapport')
    expect(SYSTEM_PROMPT).toContain('fökycklade')
    expect(SYSTEM_PROMPT).toContain('Människor intervjuas aldrig')
    expect(SYSTEM_PROMPT).toContain('rapportera OM människor')
    expect(SYSTEM_PROMPT).toContain('raka citattecken')
    expect(SYSTEM_PROMPT).toContain('Inte « »')
    expect(SYSTEM_PROMPT).not.toContain('satirisk')
    expect(SYSTEM_PROMPT).toContain('Kalla det inte satir')
    expect(SYSTEM_PROMPT).toContain('Skratta inte åt olyckan')
  })
})

describe('buildUserPrompt', () => {
  it('includes newspaper and source headline', () => {
    expect(buildUserPrompt({ text: '900 fast i massiva dödsfällan', newspaperName: 'Expressen' })).toBe(
      `Tidning: Expressen
Rubrik: "900 fast i massiva dödsfällan"`,
    )
  })
})

import {beforeEach, describe, expect, it, vi} from 'vitest'

const create = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({messages: {create}})),
}))
vi.mock('@/lib/generate/claude', () => ({resolveModel: () => 'claude-test'}))

import {generateXReply} from './generate'

describe('generateXReply', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'key')
    create.mockReset()
  })

  it('retries once then returns the hen reply', async () => {
    create
      .mockResolvedValueOnce({content: [{type: 'text', text: 'not json'}]})
      .mockResolvedValueOnce({content: [{type: 'text', text: '{"text":"Kackel i redet."}'}]})

    await expect(
      generateXReply({
        text: 'Hej gården',
        username: 'besokare',
        dumhet: 3,
        uppskruvning: 3,
      }),
    ).resolves.toEqual({
      text: 'Kackel i redet.',
      modelVersion: 'claude-test',
      promptVersion: 'kb-x-reply-v2',
    })
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('uses the English hen prompt when language is en', async () => {
    create.mockResolvedValueOnce({
      content: [{type: 'text', text: '{"text":"The rooster called a crisis meeting."}'}],
    })

    await generateXReply({
      text: 'The government announced a new tax today',
      username: 'visitor',
      dumhet: 5,
      uppskruvning: 5,
      language: 'en',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('Write the hen reply in English'),
      }),
    )
  })
})

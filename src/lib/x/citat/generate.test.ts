import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {CITAT_PROMPT_VERSION, CITAT_WRITE_SYSTEM} from './prompt'
import {generateCitat, generateCitatSpeechBubble} from './generate'

const {createMessage} = vi.hoisted(() => ({
  createMessage: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {create: createMessage}
  },
}))

function response(payload: unknown) {
  return {
    content: [{type: 'text' as const, text: JSON.stringify(payload)}],
  }
}

describe('generateCitat', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY
  const originalModel = process.env.ANTHROPIC_MODEL

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    process.env.ANTHROPIC_MODEL = 'test-model'
    createMessage.mockReset()
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.ANTHROPIC_MODEL
    else process.env.ANTHROPIC_MODEL = originalModel
  })

  it('generates citat copy with an image brief', async () => {
    createMessage.mockResolvedValueOnce(
      response({
        text: 'Tuppen kallade till krismöte.',
        imageShotType: 'incident',
        imageCaption: 'Tuppen Gösta vid foderautomaten.',
        imagePrompt: 'A rooster beside an empty chicken feeder.',
      }),
    )

    await expect(
      generateCitat({
        text: 'Det blir pressträff i dag.',
        username: 'nyheter',
        dumhet: 4,
        uppskruvning: 5,
      }),
    ).resolves.toEqual({
      generated: {
        text: '"Tuppen kallade till krismöte."',
        imageBrief: {
          shotType: 'incident',
          caption: 'Tuppen Gösta vid foderautomaten.',
          scenePrompt: 'A rooster beside an empty chicken feeder.',
        },
        hashtags: [],
      },
      modelVersion: 'test-model',
      promptVersion: CITAT_PROMPT_VERSION,
    })

    expect(CITAT_PROMPT_VERSION).toBe('kb-x-citat-v4')
    expect(createMessage).toHaveBeenCalledWith({
      model: 'test-model',
      max_tokens: 1200,
      temperature: 0.9,
      system: CITAT_WRITE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: expect.stringContaining('Original från @nyheter:'),
        },
      ],
    })
  })

  it('uses the English hen prompt when language is en', async () => {
    createMessage.mockResolvedValueOnce(
      response({
        text: 'The rooster called a crisis meeting.',
        imageShotType: 'incident',
        imageCaption: 'Rooster Gösta by the feeder.',
        imagePrompt: 'A rooster beside an empty chicken feeder.',
      }),
    )

    await generateCitat({
      text: 'The government announced a new tax today.',
      language: 'en',
    })

    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('Write the hen tweet in English'),
      }),
    )
  })

  it('requires an Anthropic API key', async () => {
    delete process.env.ANTHROPIC_API_KEY

    await expect(generateCitat({text: 'Originalet'})).rejects.toThrow(
      'ANTHROPIC_API_KEY saknas',
    )
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('retries once before rejecting an invalid response', async () => {
    createMessage.mockResolvedValue(response({imagePrompt: 'A chicken coop.'}))

    await expect(generateCitat({text: 'Originalet'})).rejects.toThrow(
      'Claude-svaret saknade citat-text',
    )
    expect(createMessage).toHaveBeenCalledTimes(2)
  })
})

describe('generateCitatSpeechBubble', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY
  const originalModel = process.env.ANTHROPIC_MODEL

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    process.env.ANTHROPIC_MODEL = 'test-model'
    createMessage.mockReset()
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.ANTHROPIC_MODEL
    else process.env.ANTHROPIC_MODEL = originalModel
  })

  it('returns a short balloon line', async () => {
    createMessage.mockResolvedValueOnce(response({text: 'Kackel i redet!'}))

    await expect(generateCitatSpeechBubble({text: 'Tuppen kallade till krismöte.'})).resolves.toBe(
      'Kackel i redet!',
    )
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 200,
        system: expect.stringContaining('pratbubbla'),
      }),
    )
  })

  it('asks for an English balloon when language is en', async () => {
    createMessage.mockResolvedValueOnce(response({text: 'Cluck in the nest!'}))

    await expect(
      generateCitatSpeechBubble({text: 'The rooster called a crisis meeting.', language: 'en'}),
    ).resolves.toBe('Cluck in the nest!')
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('Funny, short, English'),
      }),
    )
  })
})

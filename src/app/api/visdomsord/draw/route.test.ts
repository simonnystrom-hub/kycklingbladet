import {describe, expect, it} from 'vitest'
import {maxDuration, OPTIONS, POST} from './route'

describe('visdomsord draw route', () => {
  it('exports HTTP handlers and a 60s duration budget', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
    expect(maxDuration).toBe(60)
  })
})

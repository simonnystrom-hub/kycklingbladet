'use client'

import {useState, type FormEvent} from 'react'

const fieldClass =
  'mt-2 w-full bg-transparent px-3 py-3 text-base text-[var(--ink)] outline-none'
const fieldStyle = {border: '1px solid var(--rule)'}

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setStatus('sending')
    setError('')

    try {
      const response = await fetch('/api/kontakt', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          website: data.get('website'),
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {error?: string} | null
        throw new Error(body?.error || 'Kunde inte skicka')
      }
      form.reset()
      setStatus('sent')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kunde inte skicka')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p className="mt-8 leading-relaxed text-[var(--ink-muted)]">
        Meddelandet är framme. Högsta hönset läser när redet tillåter.
      </p>
    )
  }

  return (
    <form className="relative mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
      <label className="block text-sm text-[var(--ink-muted)]">
        Namn
        <input
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className={fieldClass}
          style={fieldStyle}
        />
      </label>
      <label className="block text-sm text-[var(--ink-muted)]">
        E-post
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
          style={fieldStyle}
        />
      </label>
      <label className="block text-sm text-[var(--ink-muted)]">
        Meddelande
        <textarea
          name="message"
          required
          maxLength={4000}
          rows={7}
          className={fieldClass}
          style={fieldStyle}
        />
      </label>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {status === 'error' ? (
        <p className="text-sm text-[var(--brass)]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="min-h-11 self-start py-2 text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-4 disabled:opacity-50"
      >
        {status === 'sending' ? 'Skickar…' : 'Skicka'}
      </button>
    </form>
  )
}

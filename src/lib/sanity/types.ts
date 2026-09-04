export type Alarm = {
  _id: string
  date: string
  kicker: string
  headline: string
  body: string
  expertVoice: string
  expertHeadline: string
  expertText: string
  sourceHeadline: string
  sourceNewspaper: string
  sourceNewspaperSlug: string
  sourceAlarmindexUrl: string
  sourceScore: number
  promptVersion: string
  modelVersion: string
  humorScore?: number
}

export type AlarmTeaser = {
  _id: string
  date: string
  kicker: string
  headline: string
}

export type SiteSettings = {
  title: string
  tagline: string
  about: string
  alarmindexMention: string
}

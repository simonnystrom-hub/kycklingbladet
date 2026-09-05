export type AlarmNotice = {
  _key?: string
  headline: string
  body: string
  sourceHeadline: string
  sourceNewspaper: string
  sourceNewspaperSlug: string
  sourceAlarmindexUrl: string
  sourceScore: number
  sourceHeadlineId: string
}

export type ExtraExtra = {
  _id: string
  date: string
  kicker: string
  headline: string
  body: string
  sourceUrl: string
  sourceHeadline: string
  sourceNewspaper: string
  sourceNewspaperSlug: string
  promptVersion: string
  modelVersion: string
  createdAt: string
  imageUrl?: string | null
  imageCaption?: string | null
}

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
  notices?: AlarmNotice[] | null
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

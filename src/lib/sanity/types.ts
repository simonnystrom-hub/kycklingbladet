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
  slot?: number | null
  slug?: string | null
  notices?: AlarmNotice[] | null
  imageUrl?: string | null
  imageCaption?: string | null
}

export type AlarmTeaser = {
  _id: string
  date: string
  kicker: string
  headline: string
  slug?: string | null
  slot?: number | null
}

export type ArchiveItem = AlarmTeaser & {
  href: string
  kind: 'alarm' | 'extraExtra'
}

export type SiteSettings = {
  title: string
  tagline: string
  about: string
  alarmindexMention: string
}

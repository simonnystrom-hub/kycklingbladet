export type Alarm = {
  _id: string
  date: string
  kicker: string
  headline: string
  body: string
  survivalTip: string
  sourceHeadline: string
  sourceNewspaper: string
  sourceNewspaperSlug: string
  sourceAlarmindexUrl: string
  sourceScore: number
  promptVersion: string
  modelVersion: string
}

export type SiteSettings = {
  title: string
  tagline: string
  about: string
  alarmindexMention: string
}

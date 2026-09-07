export function extraExtraPath(date: string): string {
  return `/extra-extra/${date}`
}

export function extraExtraItemPath(date: string, id: string): string {
  return `${extraExtraPath(date)}#${id}`
}

import type {Metadata} from 'next'
import {IssueExtra} from '@/components/IssueExtra'
import {canShowExtraExtraPage} from '@/lib/extra-extra/page-guard'
import {extraExtraPath} from '@/lib/extra-extra/path'
import {cartoonImageUrl, shareImages} from '@/lib/og'
import {getExtraByDate} from '@/lib/sanity/queries'
import {formatSwedishDate} from '@/lib/select/stockholm-date'
import {notFound} from 'next/navigation'

export const revalidate = 60

type ExtraExtraPageProps = {
  params: Promise<{date: string}>
}

export async function generateMetadata({
  params,
}: ExtraExtraPageProps): Promise<Metadata> {
  const {date} = await params
  const extra = await getExtraByDate(date)
  if (!canShowExtraExtraPage(date, extra)) return {}
  const canonical = extraExtraPath(date)
  const images = shareImages(cartoonImageUrl(extra))
  return {
    title: extra.headline,
    description: extra.headline,
    alternates: {canonical},
    openGraph: {
      title: extra.headline,
      description: extra.headline,
      url: canonical,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      images,
    },
  }
}

export default async function ExtraExtraPage({params}: ExtraExtraPageProps) {
  const {date} = await params
  const extra = await getExtraByDate(date)
  if (!canShowExtraExtraPage(date, extra)) {
    notFound()
  }

  return (
    <div>
      <p
        className="text-[var(--brass)]"
        style={{
          fontSize: 11,
          letterSpacing: '0.12em',
          fontVariant: 'small-caps',
        }}
      >
        {formatSwedishDate(date)}
      </p>
      <IssueExtra extra={extra} date={date} />
    </div>
  )
}

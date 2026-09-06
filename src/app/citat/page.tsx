import type {Metadata} from 'next'
import {CitatList} from '@/components/CitatList'
import {getVisdomsordWithImages} from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'Citat',
  description: 'Visdomsord från hönsgården, med tecknad bild.',
  alternates: {canonical: '/citat'},
}

export const revalidate = 60

export default async function CitatPage() {
  const quotes = await getVisdomsordWithImages()

  return (
    <div>
      <h1 className="mb-8 font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:mb-10 sm:text-[2rem] lg:mb-12 lg:text-[2.5rem]">
        Citat
      </h1>
      <CitatList quotes={quotes} />
    </div>
  )
}

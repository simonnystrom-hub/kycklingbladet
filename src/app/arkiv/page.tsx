import {ArchiveList} from '@/components/ArchiveList'
import {getAlarmArchive} from '@/lib/sanity/queries'

export const revalidate = 60

export default async function ArchivePage() {
  const archive = await getAlarmArchive()

  return (
    <div>
      <h1 className="mb-10 font-serif text-[2rem] leading-tight text-[var(--ink)]">
        Arkiv
      </h1>
      <ArchiveList items={archive} />
    </div>
  )
}

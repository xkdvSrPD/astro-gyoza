import { getDiffInDays, getFormattedDate } from '@/utils/date'

export function Outdate({ lastMod }: { lastMod: Date }) {
  if (getDiffInDays(lastMod) <= 30) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-300/10 p-4 text-sm">
      <span>
        This article was published on {getFormattedDate(lastMod)}. Some details may be outdated.
      </span>
    </div>
  )
}

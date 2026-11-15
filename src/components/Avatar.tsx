import { getUser } from '../mock/db'
import { cn, initials } from '../lib'

const SIZES = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-24 w-24 text-3xl' }

export function Avatar({ userId, size = 'md', className }: { userId: string; size?: keyof typeof SIZES; className?: string }) {
  const u = getUser(userId)
  return (
    <div
      aria-label={u.name}
      className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white', u.color, SIZES[size], className)}
    >
      {initials(u.name)}
    </div>
  )
}

export function AvatarStack({ userIds, max = 4 }: { userIds: string[]; max?: number }) {
  const shown = userIds.slice(0, max)
  const extra = userIds.length - shown.length
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((id) => (
        <Avatar key={id} userId={id} size="xs" className="ring-2 ring-white" />
      ))}
      {extra > 0 && (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
          +{extra}
        </div>
      )}
    </div>
  )
}

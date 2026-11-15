import { avatarGradient, cn, initials } from '../lib/utils'

const SIZES = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-24 w-24 text-3xl' }

export interface Person {
  id: string
  name: string
}

export function Avatar({ person, size = 'md', className }: { person: Person; size?: keyof typeof SIZES; className?: string }) {
  return (
    <div
      aria-label={person.name}
      className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white', avatarGradient(person.id), SIZES[size], className)}
    >
      {initials(person.name) || '?'}
    </div>
  )
}

export function AvatarStack({ people, total, max = 4 }: { people: Person[]; total: number; max?: number }) {
  const shown = people.slice(0, max)
  const extra = total - shown.length
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size="xs" className="ring-2 ring-white" />
      ))}
      {extra > 0 && (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
          +{extra}
        </div>
      )}
    </div>
  )
}

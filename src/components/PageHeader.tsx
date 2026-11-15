import { NotificationBell } from './NotificationBell'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action}
        <NotificationBell />
      </div>
    </header>
  )
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatShortDate = (iso: string) => {
  const d = parseDate(iso)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'p. m.' : 'a. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${Math.round(diff)} min`
  if (diff < 1440) return `Hace ${Math.round(diff / 60)} h`
  const days = Math.round(diff / 1440)
  return days === 1 ? 'Ayer' : `Hace ${days} días`
}

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

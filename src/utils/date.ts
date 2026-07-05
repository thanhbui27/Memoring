export const nowIso = () => new Date().toISOString()

export const addDaysIso = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export const isToday = (value?: string) => {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

export const isDue = (value?: string) => {
  if (!value) return true
  const due = new Date(value)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  return due <= endOfToday
}

export const formatShortDate = (value?: string) => {
  if (!value) return 'Not reviewed'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

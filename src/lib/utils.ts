export function formatRelativeTime(isoString: string): string {
  if (isNaN(new Date(isoString).getTime())) return ""

  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMinutes = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMs / 1000 / 3600)
  const diffDays = Math.floor(diffMs / 1000 / 3600 / 24)

  if (diffMs < 0 || diffMinutes < 1) return "今"
  if (diffMinutes < 60) return `${diffMinutes}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`

  const date = new Date(isoString)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}/${m}/${d}`
}

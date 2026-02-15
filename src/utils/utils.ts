export function formatDate(isoString: string) {
  const date = new Date(isoString).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  return date
}
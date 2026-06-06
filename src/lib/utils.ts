export const cn = (...c: (string|undefined|false|null)[]) => c.filter(Boolean).join(' ')
export const formatMs = (ms: number) => ms >= 1000 ? `${(ms/1000).toFixed(2)}s` : `${ms}ms`
export const formatPct = (n: number) => `${Math.round(n)}%`
export const formatPercent = formatPct
export const formatCost = (n: number) => n.toLocaleString()
export function truncateSQL(sql: string, max = 100) {
  const s = sql.replace(/\s+/g,' ').trim()
  return s.length <= max ? s : s.slice(0,max) + '…'
}
export function timeAgo(date: string|Date) {
  const d = typeof date==='string' ? new Date(date) : date
  const diff = Math.floor((Date.now()-d.getTime())/1000)
  if (diff<60) return `${diff}s ago`
  if (diff<3600) return `${Math.floor(diff/60)}m ago`
  if (diff<86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
export const getImprovColor = (p: number) => p>=70?'#00E676':p>=40?'#00C6FF':'#7B2FBE'
export const getImprovementColor = getImprovColor
export const getImpactColor = (i:'high'|'medium'|'low') => ({high:'#00E676',medium:'#00C6FF',low:'#7B2FBE'})[i]
export const generateId = () => Math.random().toString(36).slice(2)+Date.now().toString(36)
export const genId = generateId
export const sleep = (ms: number) => new Promise(r=>setTimeout(r,ms))

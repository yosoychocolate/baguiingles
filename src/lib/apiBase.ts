/** URL do backend em produção (Render etc.). Vazio = mesmo host (localhost com Vite). */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
  return `${base}${path}`
}

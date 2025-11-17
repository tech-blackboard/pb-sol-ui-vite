// add near other exports
import { api } from '../lib/api'

const SOURCEDB_BASE = import.meta.env.VITE_SOURCEDB_BASE;

export type SourceWebsite = { id: number | string; name: string }

export async function listWebsites(): Promise<SourceWebsite[]> {
  const { data } = await api.get(`${SOURCEDB_BASE}`)
  const list = Array.isArray(data) ? data : data?.items ?? data?.data ?? []
  return (Array.isArray(list) ? list : []).map((w: any) => ({
    id: w?.id ?? w?._id,
    name: w?.name ?? w?.title ?? '',
    link: w?.link ?? '',
  }))
}
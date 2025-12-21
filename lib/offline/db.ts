import { openDB, type DBSchema } from "idb"

type Json = any

export type SyncActionStatus = "pending" | "inflight" | "error" | "conflict"

export type SyncAction = {
  id?: number
  method: string
  url: string
  baseURL: string
  headers: Record<string, any> | null
  params: any
  data: any
  createdAt: number
  status: SyncActionStatus
  retries: number
  lastError?: string | null
  clientUpdatedAt: number
  clientMutationId: string
}

interface OfflineDBSchema extends DBSchema {
  http_cache: {
    key: string
    value: { key: string; data: Json; updatedAt: number }
  }
  entities: {
    key: string
    value: { key: string; type: string; id: string; data: Json; updatedAt: number }
    indexes: { "by-type": string }
  }
  sync_queue: {
    key: number
    value: SyncAction
    indexes: { "by-status": string; "by-createdAt": number }
  }
}

const DB_NAME = "infinia_pms_offline"
const DB_VERSION = 1

let dbPromise: Promise<ReturnType<typeof openDB<OfflineDBSchema>>> | null = null

async function getDb() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return null
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("http_cache")) {
          db.createObjectStore("http_cache", { keyPath: "key" })
        }
        if (!db.objectStoreNames.contains("entities")) {
          const store = db.createObjectStore("entities", { keyPath: "key" })
          store.createIndex("by-type", "type")
        }
        if (!db.objectStoreNames.contains("sync_queue")) {
          const store = db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true })
          store.createIndex("by-status", "status")
          store.createIndex("by-createdAt", "createdAt")
        }
      },
    }) as any
  }
  return dbPromise
}

export async function getHttpCache(key: string) {
  const db = await getDb()
  if (!db) return null
  return db.get("http_cache", key)
}

export async function setHttpCache(key: string, data: Json) {
  const db = await getDb()
  if (!db) return
  await db.put("http_cache", { key, data, updatedAt: Date.now() })
}

export async function enqueueSyncAction(input: {
  method: string
  url: string
  baseURL: string
  headers?: Record<string, any> | null
  params?: any
  data?: any
}) {
  const db = await getDb()
  if (!db) return null
  const action: SyncAction = {
    method: input.method,
    url: input.url,
    baseURL: input.baseURL,
    headers: input.headers || null,
    params: input.params ?? null,
    data: input.data ?? null,
    createdAt: Date.now(),
    status: "pending",
    retries: 0,
    lastError: null,
    clientUpdatedAt: Date.now(),
    clientMutationId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  }
  const id = await db.add("sync_queue", action)
  return id
}

export async function listSyncActions(limit = 50) {
  const db = await getDb()
  if (!db) return []
  const all = await db.getAll("sync_queue")
  return all
    .filter((a) => a.status === "pending" || a.status === "error")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit)
}

export async function markSyncAction(id: number, patch: Partial<SyncAction>) {
  const db = await getDb()
  if (!db) return
  const existing = await db.get("sync_queue", id)
  if (!existing) return
  await db.put("sync_queue", { ...existing, ...patch, id })
}

export async function deleteSyncAction(id: number) {
  const db = await getDb()
  if (!db) return
  await db.delete("sync_queue", id)
}

export async function countSyncQueue() {
  const db = await getDb()
  if (!db) return 0
  const all = await db.getAll("sync_queue")
  return all.filter((a) => a.status === "pending" || a.status === "error").length
}

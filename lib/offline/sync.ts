import { deleteSyncAction, listSyncActions, markSyncAction, type SyncAction } from "./db"
import { getSession } from "next-auth/react"

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const v = document.cookie.split("; ").find((row) => row.startsWith("csrftoken="))?.split("=")[1]
  return v || null
}

function resolveUrl(action: SyncAction) {
  const base = action.baseURL || ""
  const url = action.url || ""
  if (/^https?:\/\//i.test(url)) return url
  if (!base) return url
  try {
    return new URL(url, base.replace(/\/?$/, "/")).toString()
  } catch {
    return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
  }
}

export async function flushSyncQueue(limit = 25) {
  if (typeof window === "undefined") return
  if (typeof navigator !== "undefined" && navigator.onLine === false) return
  const actions = await listSyncActions(limit)
  if (!actions.length) return
  const session = await getSession().catch(() => null)
  const bearer = (session as any)?.accessToken ? String((session as any).accessToken) : null
  const csrf = getCsrfToken()
  for (const action of actions) {
    if (!action.id) continue
    await markSyncAction(action.id, { status: "inflight" })
    const url = resolveUrl(action)
    const headers = new Headers()
    headers.set("Accept", "application/json")
    if (bearer) headers.set("Authorization", `Bearer ${bearer}`)
    if (csrf && ["POST", "PUT", "PATCH", "DELETE"].includes(action.method)) headers.set("X-CSRFToken", csrf)
    headers.set("X-Offline-Sync", "1")
    headers.set("X-Client-Updated-At", String(action.clientUpdatedAt))
    headers.set("X-Client-Mutation-Id", action.clientMutationId)
    let body: BodyInit | undefined
    if (action.data != null && ["POST", "PUT", "PATCH", "DELETE"].includes(action.method)) {
      body = typeof action.data === "string" ? action.data : JSON.stringify(action.data)
      headers.set("Content-Type", "application/json")
    }
    try {
      const res = await fetch(url, { method: action.method, headers, body, credentials: "include" })
      if (res.ok) {
        await deleteSyncAction(action.id)
        continue
      }
      const text = await res.text().catch(() => "")
      if (res.status === 409) {
        await markSyncAction(action.id, { status: "conflict", lastError: text || "409 Conflict" })
        continue
      }
      await markSyncAction(action.id, { status: "error", retries: action.retries + 1, lastError: text || `HTTP ${res.status}` })
      break
    } catch (e: any) {
      await markSyncAction(action.id, { status: "error", retries: action.retries + 1, lastError: String(e?.message || e || "Network error") })
      break
    }
  }
}


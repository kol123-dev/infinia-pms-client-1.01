"use client"

import { useEffect, useState } from "react"

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") return true
    return navigator.onLine
  })

  const [lastChangedAt, setLastChangedAt] = useState(() => Date.now())

  useEffect(() => {
    const setOnline = () => {
      setIsOnline(true)
      setLastChangedAt(Date.now())
    }
    const setOffline = () => {
      setIsOnline(false)
      setLastChangedAt(Date.now())
    }

    window.addEventListener("online", setOnline)
    window.addEventListener("offline", setOffline)

    let timer: any
    const ping = async () => {
      try {
        const ctrl = new AbortController()
        const id = setTimeout(() => ctrl.abort(), 3000)
        const url = new URL("/manifest.json", window.location.origin).toString()
        const res = await fetch(url, { method: "HEAD", cache: "no-store", credentials: "omit", signal: ctrl.signal })
        clearTimeout(id)
        if (res && res.ok) {
          if (!isOnline) {
            setIsOnline(true)
            setLastChangedAt(Date.now())
          }
          return
        }
        if (!navigator.onLine) {
          if (isOnline) {
            setIsOnline(false)
            setLastChangedAt(Date.now())
          }
        }
      } catch {
        if (!navigator.onLine) {
          if (isOnline) {
            setIsOnline(false)
            setLastChangedAt(Date.now())
          }
        }
      }
    }
    void ping()
    timer = setInterval(ping, 10000)

    return () => {
      window.removeEventListener("online", setOnline)
      window.removeEventListener("offline", setOffline)
      if (timer) clearInterval(timer)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    lastChangedAt,
  }
}

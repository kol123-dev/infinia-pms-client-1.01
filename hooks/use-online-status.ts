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

    const connection = (navigator as any)?.connection
    const onConnectionChange = () => {
      setIsOnline(navigator.onLine)
      setLastChangedAt(Date.now())
    }

    if (connection?.addEventListener) {
      connection.addEventListener("change", onConnectionChange)
    }

    return () => {
      window.removeEventListener("online", setOnline)
      window.removeEventListener("offline", setOffline)
      if (connection?.removeEventListener) {
        connection.removeEventListener("change", onConnectionChange)
      }
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    lastChangedAt,
  }
}


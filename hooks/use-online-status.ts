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

    return () => {
      window.removeEventListener("online", setOnline)
      window.removeEventListener("offline", setOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    lastChangedAt,
  }
}

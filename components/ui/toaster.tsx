"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "next-auth/react"
import { useEffect, useRef } from "react"

export function Toaster() {
  const { toasts } = useToast()
  const redirectedRef = useRef(false)

  useEffect(() => {
    const hasSessionError = toasts.some(t => {
      const titleText = typeof t.title === 'string' ? t.title.trim() : ''
      return titleText === 'Session Error'
    })

    if (hasSessionError && typeof window !== 'undefined' && !redirectedRef.current) {
      const pathname = window.location.pathname || ''
      if (!pathname.startsWith('/signin')) {
        redirectedRef.current = true
        signOut({ callbackUrl: '/signin' }).catch(() => {
          window.location.assign('/signin')
        })
      }
    }
  }, [toasts])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const titleText = typeof title === 'string' ? title.trim() : ''
        const finalDescription =
          titleText === 'Session Error'
            ? 'We could not authenticate your request. Please try signing in again.'
            : description

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {finalDescription && (
                <ToastDescription>{finalDescription}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
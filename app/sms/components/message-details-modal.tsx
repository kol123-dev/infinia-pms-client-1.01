// Top-level imports
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmsMessage, SmsStatus, Recipient } from "../types"
import { useState } from "react"

interface MessageDetailsModalProps {
  message: SmsMessage | null
  onClose: () => void
  onDelete: (id: string) => void
}

type StatusVariant = "default" | "secondary" | "destructive" | "outline"
type StatusMap<T> = { [K in SmsStatus]: T }

const statusVariants: StatusMap<StatusVariant> = {
  delivered: 'default',
  sent: 'secondary',
  failed: 'destructive',
  queued: 'outline'
}

const statusColors: StatusMap<string> = {
  delivered: 'bg-green-500',
  sent: 'bg-blue-500',
  failed: 'bg-red-500',
  queued: 'bg-yellow-500'
}

export function MessageDetailsModal({ message, onClose, onDelete }: MessageDetailsModalProps) {
  // Ensure hooks are called unconditionally
  const [showAllRecipients, setShowAllRecipients] = useState<boolean>(false)

  if (!message) return null

  const tenantRecipients = (message.recipients || []).map(r => ({
    key: `tenant-${r.id}`,
    name: r.user.full_name,
    phone: r.user.phone
  }))
  const manualRecipients = (message.manual_recipients || []).map((num, idx) => ({
    key: `manual-${idx}`,
    name: undefined,
    phone: num
  }))
  const allRecipients = [...tenantRecipients, ...manualRecipients]
  const totalRecipients = allRecipients.length
  const visibleCount = showAllRecipients ? totalRecipients : Math.min(10, totalRecipients)
  const visibleRecipients = allRecipients.slice(0, visibleCount)

  const statusLabel = message.status.charAt(0).toUpperCase() + message.status.slice(1)

  return (
    <Dialog open={!!message} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] md:max-w-[720px] lg:max-w-[800px] p-0">
        <div className="flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              {message.sent_at ? `Sent on ${new Date(message.sent_at).toLocaleString()}` : "Scheduled"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            {/* Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Status</h4>
              <div className="flex items-center gap-2">
                {/* Keep your existing color mapping */}
                <div className={`h-2 w-2 rounded-full ${statusColors[message.status]}`} />
                <Badge variant={statusVariants[message.status]} className="font-medium">
                  {statusLabel}
                </Badge>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h4 className="font-medium">Message</h4>
              <p className="text-sm leading-relaxed">{message.body}</p>
              {message.error_message && (
                <p className="text-xs text-muted-foreground mt-2">
                  Note: {message.error_message}
                </p>
              )}
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Recipients ({totalRecipients})
                </h4>
                {totalRecipients > 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllRecipients((v: boolean) => !v)}
                    className="h-7"
                  >
                    {showAllRecipients ? "Show fewer" : `Show all (${totalRecipients})`}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {visibleRecipients.map(r => (
                  <div key={r.key} className="text-sm flex items-center gap-2 truncate">
                    {r.name ? (
                      <>
                        <span className="truncate">{r.name}</span>
                        <span className="text-muted-foreground truncate">({r.phone})</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground truncate">{r.phone}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(message.id)
                onClose()
              }}
            >
              Delete Message
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
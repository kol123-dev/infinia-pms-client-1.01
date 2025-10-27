import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmsMessage, SmsStatus, Recipient } from "../types"

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
  if (!message) return null

  return (
    <Dialog open={!!message} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Message Details</DialogTitle>
          <DialogDescription>
            Sent on {new Date(message.sent_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Status</h4>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${statusColors[message.status]}`} />
              <Badge
                variant={statusVariants[message.status]}
                className="font-medium"
              >
                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-1">Message</h4>
            <p className="text-sm">{message.body}</p>
            {message.error_message && (
              <p className="text-xs text-muted-foreground mt-2">
                Note: {message.error_message}
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-1">
              Recipients ({(message.recipients?.length || 0) + (message.manual_recipients?.length || 0)})
            </h4>
            <div className="space-y-2">
              {message.recipients?.map((recipient: Recipient) => (
                <div key={recipient.id} className="text-sm flex items-center space-x-2">
                  <span>{recipient.user.full_name}</span>
                  <span className="text-muted-foreground">({recipient.user.phone})</span>
                </div>
              ))}
              {(message.manual_recipients || []).map((number, idx) => (
                <div key={`manual-${idx}`} className="text-sm flex items-center space-x-2">
                  <span className="text-muted-foreground">{number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"

interface EditTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (templateId: number | null, name: string, content: string) => Promise<void>
  template: {
    id: number
    name: string
    content: string
  } | null
}

export function EditTemplateDialog({
  isOpen,
  onClose,
  onSubmit,
  template,
}: EditTemplateDialogProps) {
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (template) {
      setName(template.name)
      setContent(template.content)
    } else {
      setName("")
      setContent("")
    }
  }, [template])

  const handleSubmit = async () => {
    if (!name || !content) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(template?.id || null, name, content)
      onClose()
    } catch (error) {
      console.error("Failed to save template:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{template ? "Edit" : "Create"} SMS Template</DialogTitle>
          <DialogDescription>
            {template ? "Make changes to" : "Create"} your SMS template here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-4"
              placeholder="Template Name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-4"
              placeholder="Template Content"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !name || !content}
          >
            {isSubmitting ? "Saving..." : template ? "Save changes" : "Create template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
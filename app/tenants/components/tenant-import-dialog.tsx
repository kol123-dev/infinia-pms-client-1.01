'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import api from "@/lib/axios"

interface ImportResult {
  created: number
  updated: number
  errors: { row: number; error: string }[]
  total_rows: number
}

export function TenantImportDialog({
  isOpen,
  onClose,
  onImported,
}: {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleUpload = async () => {
    if (!file) {
      toast({ variant: "destructive", description: "Please select a file to upload" })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await api.post('/tenants/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(resp.data as ImportResult)
      toast({ description: "Import completed" })
      onImported()
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Import failed"
      toast({ variant: "destructive", description: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const resp = await api.get('/tenants/import/template/', { responseType: 'blob' })
      const contentType = resp.headers['content-type']
      const isXlsx = contentType?.includes('spreadsheetml')
      const filename = isXlsx ? 'tenants-import-template.xlsx' : 'tenants-import-template.csv'
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: contentType }))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ variant: "destructive", description: "Failed to download template" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Import Tenants</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file. Required columns: <code>email</code>. Optional: <code>first_name</code>, <code>last_name</code>, <code>phone</code>, <code>tenant_id</code>, <code>unit_id</code>, <code>property_id</code>, <code>unit_number</code>, <code>lease_start_date</code>, <code>lease_end_date</code>, <code>payment_due_day</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={loading}>
              Download Template
            </Button>
            <Button onClick={handleUpload} disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={loading}>Close</Button>
          </div>
          {result && (
            <div className="rounded-md border p-3">
              <p>Total rows: {result.total_rows}</p>
              <p>Created: {result.created}</p>
              <p>Updated: {result.updated}</p>
              {result.errors?.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Errors:</p>
                  <ul className="text-sm text-red-600 list-disc pl-5">
                    {result.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  )
}
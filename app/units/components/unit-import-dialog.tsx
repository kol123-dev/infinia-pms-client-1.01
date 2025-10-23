"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type ImportResult = {
  created: number;
  updated: number;
  errors: { row: number; error: string }[];
  total_rows: number;
};

export function UnitImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Please select a file" });
      return;
    }
    setIsUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/units/import/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      toast({ title: "Import completed" });
      onSuccess(); // refresh units/stats
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: err?.response?.data?.detail ?? "Check your file and try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get("/units/import/template/", { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // choose filename from content-disposition if present
      const cd = res.headers["content-disposition"] || "";
      const m = /filename=\"?([^\";]+)\"?/i.exec(cd);
      a.download = m?.[1] || "units-import-template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Failed to download template" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Units (XLSX/CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="file"
            accept=".xlsx,.xlsm,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-sm text-muted-foreground">
            Required columns: property_id, unit_number. Optional: unit_id, unit_type,
            unit_status, floor, size, rent, deposit, amenities, features.
          </div>

          {result && (
            <div className="rounded-md border p-3 text-sm">
              <div>Total rows: {result.total_rows}</div>
              <div>Created: {result.created}</div>
              <div>Updated: {result.updated}</div>
              {result.errors?.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold">Errors:</div>
                  <ul className="list-disc pl-5">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>Row {e.row}: {e.error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>…and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>Download Template</Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
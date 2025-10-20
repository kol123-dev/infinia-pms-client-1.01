import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

const HEADERS = ["Payment ID", "Tenant", "Email", "Property", "Unit", "Amount", "Balance", "Date", "Method", "Status"]

export function exportPaymentsToPDF(rows: (string | number)[][], filename = "payments.pdf") {
  const doc = new jsPDF()
  autoTable(doc, {
    head: [HEADERS],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20 },
  })
  doc.save(filename)
}

export function exportPaymentsToXLSX(rows: (string | number)[][], filename = "payments.xlsx") {
  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payments")
  XLSX.writeFile(workbook, filename)
}
// Top-level imports in export-utils.ts
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { saveAs } from "file-saver"
import { formatCurrency } from "@/lib/utils"
import { FinancialData, OccupancyData, Tenant, UnitForReport } from "../types"
import { Expense } from "@/hooks/useExpenses"
import * as XLSX from "xlsx"

// Add: simple slugify for filenames
const slug = (s?: string) => (s || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "")

export const exportPDF = (
  reportType: string, 
  financialData: FinancialData[], 
  occupancyData: OccupancyData[], 
  expenses: Expense[], 
  tenants: Tenant[],
  units: UnitForReport[] = [],
  options?: { property?: string; propertyNameById?: Record<string, string> }
) => {
  // Create PDF in landscape orientation for tenant reports
  const doc = new jsPDF(reportType === "tenant" ? "landscape" : "portrait")
  
  // Add title with better styling
  doc.setFontSize(22)
  doc.setTextColor(44, 62, 80) // Dark blue color
  doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, reportType === "tenant" ? 20 : 14, 22)
  
  // Add date with better styling
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100) // Gray color
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, reportType === "tenant" ? 20 : 14, 32)
  
  // Add company logo or branding element
  // doc.addImage("logo.png", "PNG", 170, 10, 30, 15) // Uncomment and adjust if you have a logo
  
  // Add table based on report type
  if (reportType === "financial") {
    autoTable(doc, {
      head: [['Month', 'Revenue', 'Expenses', 'Taxable Income', 'Net Profit']],
      body: financialData.map(item => [
        item.month,
        formatCurrency(item.revenue),
        formatCurrency(item.expenses),
        formatCurrency(item.taxable_income ?? (item.revenue - item.expenses)),
        formatCurrency(item.net_profit ?? item.profit)
      ]),
      startY: 45,
      styles: {
        fontSize: 10,
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    })
  } else if (reportType === "occupancy") {
    // Helper to compute counts from units per property
    const countsFor = (propertyName: string) => {
      const unitsForProp = (units || []).filter(u => u.property?.name === propertyName)
      const occupied = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "OCCUPIED").length
      const vacant = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "VACANT").length
      const maintenance = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "MAINTENANCE").length
      const totalFromData = occupancyData.find(d => d.property === propertyName)?.total ?? 0
      const total = unitsForProp.length > 0 ? unitsForProp.length : totalFromData
      const rate = total > 0 ? Math.round((occupied / total) * 100) : (occupancyData.find(d => d.property === propertyName)?.rate ?? 0)
      return { occupied, vacant, maintenance, total, rate }
    }

    autoTable(doc, {
      head: [['Property', 'Occupied Units', 'Vacant Units', 'Maintenance Units', 'Total Units', 'Occupancy Rate']],
      body: occupancyData.map(item => {
        const c = countsFor(item.property)
        return [
          item.property,
          c.occupied,
          c.vacant,
          c.maintenance,
          c.total,
          `${c.rate}%`
        ]
      }),
      startY: 45,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { left: 5, right: 5 },
    })
    // Add Unit Directory below the summary
    autoTable(doc, {
      head: [['Unit', 'Property', 'Type', 'Status', 'Rent', 'Current Tenant', 'Past Tenant']],
      body: (units || []).map(u => {
        const past = (u.tenant_history || [])
          .filter(h => h.end_date)
          .sort((a, b) => new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime())[0]
        const rentVal = typeof u.rent === 'number' ? formatCurrency(u.rent) : (u.rent || '')
        return [
          u.unit_number,
          u.property?.name || '',
          u.unit_type,
          u.unit_status,
          rentVal,
          u.current_tenant?.user?.full_name || 'None',
          past?.tenant?.user?.full_name || 'None'
        ]
      }),
      startY: (doc as any).lastAutoTable ? ((doc as any).lastAutoTable.finalY + 10) : 45,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    })
  } else if (reportType === "expense") {
    autoTable(doc, {
      head: [['Date', 'Name', 'Type', 'Property', 'Amount', 'Recurring']],
      body: expenses.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.name,
        item.expense_type,
        options?.propertyNameById?.[String(item.property ?? "")] || options?.property || String(item.property ?? "") || "",
        formatCurrency(item.amount),
        item.is_recurring ? 'Yes' : 'No'
      ]),
      startY: 45,
      styles: {
        fontSize: 10,
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    })
  } else if (reportType === "tenant") {
    autoTable(doc, {
      head: [['Name', 'Email', 'Phone', 'Status', 'Unit', 'Property', 'Lease Start', 'Lease End', 'Rent', 'Balance']],
      body: tenants.map(item => [
        item.user?.full_name || '',
        item.user?.email || '',
        item.user?.phone || '',
        // Status: prefer 'status', fallback to 'tenant_status'
        item.status || item.tenant_status || '',
        item.current_unit?.unit_number || 'None',
        item.property_name || item.current_unit?.property?.name || 'None',
        item.lease_start_date ? new Date(item.lease_start_date).toLocaleDateString() : 
          item.move_in_date ? new Date(item.move_in_date).toLocaleDateString() : 'N/A',
        item.lease_end_date ? new Date(item.lease_end_date).toLocaleDateString() : 'N/A',
        item.rent_amount ? formatCurrency(item.rent_amount) : 
          item.current_unit?.rent ? formatCurrency(parseFloat(item.current_unit.rent)) : 'N/A',
        item.balance ? formatCurrency(item.balance) : 'N/A'
      ]),
      startY: 45,
      styles: {
        fontSize: 9,
        cellPadding: 3, // Reduced padding to save space
        overflow: 'linebreak', // Changed from 'ellipsize' to 'linebreak' to show all text
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.1, // Thinner lines
        lineColor: [200, 200, 200] // Lighter lines
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      columnStyles: {
        0: { cellWidth: 30, overflow: 'linebreak' }, // Name - increased width
        1: { cellWidth: 40, overflow: 'linebreak' }, // Email - increased width
        2: { cellWidth: 30, overflow: 'linebreak' }, // Phone - increased width
        3: { cellWidth: 20, overflow: 'linebreak' }, // Status - increased width
        4: { cellWidth: 16, overflow: 'linebreak' }, // Unit - increased width
        5: { cellWidth: 35, overflow: 'linebreak' }, // Property - increased width
        6: { cellWidth: 25, overflow: 'linebreak' }, // Lease Start - increased width
        7: { cellWidth: 25, overflow: 'linebreak' }, // Lease End - increased width
        8: { cellWidth: 20, overflow: 'linebreak' }, // Rent - increased width
        9: { cellWidth: 20, overflow: 'linebreak' }, // Balance - increased width
      },
      margin: { left: 5, right: 5 }, // Further reduced margins to fit more content
      didDrawPage: (data) => {
        // Add header and footer on each page if needed
      }
    })
  }
  
  // Add page numbers
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10)
  }
  
  // Add footer with company info
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(" © 2025 Infinia Sync Properties", 14, doc.internal.pageSize.getHeight() - 10)
  
  // Save the PDF (append property tag if provided)
  const tag = options?.property ? `-${slug(options.property)}` : ""
  doc.save(`${reportType}-report${tag}.pdf`)
}

export const exportCSV = (
  reportType: string, 
  financialData: FinancialData[], 
  occupancyData: OccupancyData[], 
  expenses: Expense[], 
  tenants: Tenant[],
  units: UnitForReport[] = [],
  options?: { property?: string; propertyNameById?: Record<string, string> }
) => {
  const sheetName =
    reportType === "financial" ? "Financial" :
    reportType === "occupancy" ? "Occupancy" :
    reportType === "expense" ? "Expenses" : "Tenants"

  let rows: any[] = []
  let headers: string[] = []

  // Occupancy: build two sheets and return early
  if (reportType === "occupancy") {
    const wb = XLSX.utils.book_new()

    // Helper to compute counts for a property
    const countsFor = (propertyName: string) => {
      const unitsForProp = (units || []).filter(u => u.property?.name === propertyName)
      const occupied = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "OCCUPIED").length
      const vacant = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "VACANT").length
      const maintenance = unitsForProp.filter(u => String(u.unit_status).toUpperCase() === "MAINTENANCE").length
      const totalFromData = occupancyData.find(d => d.property === propertyName)?.total ?? 0
      const total = unitsForProp.length > 0 ? unitsForProp.length : totalFromData
      const rate = total > 0 ? Math.round((occupied / total) * 100) : (occupancyData.find(d => d.property === propertyName)?.rate ?? 0)
      return { occupied, vacant, maintenance, total, rate }
    }

    // Summary sheet with statuses
    const summaryRows = occupancyData.map(item => {
      const c = countsFor(item.property)
      return {
        Property: item.property,
        "Occupied Units": c.occupied,
        "Vacant Units": c.vacant,
        "Maintenance Units": c.maintenance,
        "Total Units": c.total,
        "Occupancy Rate": `${c.rate}%`,
      }
    })
    const summaryWs = XLSX.utils.json_to_sheet(summaryRows, { skipHeader: false })
    summaryWs["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 18 }]
    ;["Property","Occupied Units","Vacant Units","Maintenance Units","Total Units","Occupancy Rate"].forEach((_, c) => {
      const addr = XLSX.utils.encode_cell({ r: 0, c })
      if (summaryWs[addr]) summaryWs[addr].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2A7FBF" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    })
    summaryWs["!rows"] = [{ hpt: 22 }]
    summaryWs["!autofilter"] = { ref: "A1:F1" }
    XLSX.utils.book_append_sheet(wb, summaryWs, "Occupancy")

    const unitRows = (units || []).map(u => {
      const past = (u.tenant_history || [])
        .filter(h => h.end_date)
        .sort((a, b) => new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime())[0]
      const rentNum = typeof u.rent === 'number' ? u.rent : parseFloat(String(u.rent ?? 0))
      return {
        Unit: u.unit_number,
        Property: u.property?.name || "",
        Type: u.unit_type,
        Status: u.unit_status,
        Rent: isNaN(rentNum) ? null : rentNum,
        "Current Tenant": u.current_tenant?.user?.full_name || "None",
        "Past Tenant": past?.tenant?.user?.full_name || "None",
      }
    })
    const unitWs = XLSX.utils.json_to_sheet(unitRows, { skipHeader: false })
    unitWs["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 24 }]
    ;["Unit","Property","Type","Status","Rent","Current Tenant","Past Tenant"].forEach((_, c) => {
      const addr = XLSX.utils.encode_cell({ r: 0, c })
      if (unitWs[addr]) unitWs[addr].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2A7FBF" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    })
    unitWs["!rows"] = [{ hpt: 22 }]
    unitWs["!autofilter"] = { ref: "A1:G1" }
    const rentColIdx = 4
    for (let r = 1; r <= unitRows.length; r++) {
      const addr = XLSX.utils.encode_cell({ r, c: rentColIdx })
      const cell = unitWs[addr]
      if (cell && typeof cell.v === "number") {
        cell.z = "#,##0.00"
        cell.s = { alignment: { horizontal: "right" } }
      }
    }
    XLSX.utils.book_append_sheet(wb, unitWs, "Unit Directory")
    // Append property tag to occupancy filename
    const tag = options?.property ? `-${slug(options.property)}` : ""
    XLSX.writeFile(wb, `occupancy-report${tag}.xlsx`)
    return
  }

  // Non-occupancy reports: single sheet
  if (reportType === "financial") {
    rows = financialData.map(item => ({
      Month: item.month,
      Revenue: item.revenue,
      Expenses: item.expenses,
      "Taxable Income": item.taxable_income ?? (item.revenue - item.expenses),
      "Net Profit": item.net_profit ?? item.profit,
    }))
    headers = ["Month", "Revenue", "Expenses", "Taxable Income", "Net Profit"]
  } else if (reportType === "expense") {
    rows = expenses.map(item => ({
      Date: new Date(item.date).toLocaleDateString(),
      Name: item.name,
      Type: item.expense_type,
      Property: options?.propertyNameById?.[String(item.property ?? "")] || options?.property || String(item.property ?? "") || "",
      Amount: item.amount,
      Recurring: item.is_recurring ? "Yes" : "No",
    }))
    headers = ["Date", "Name", "Type", "Property", "Amount", "Recurring"]
  } else if (reportType === "tenant") {
    rows = tenants.map(item => ({
      Name: item.user?.full_name || "",
      Email: item.user?.email || "",
      Phone: item.user?.phone || "",
      Status: item.status || item.tenant_status || "",
      Unit: item.current_unit?.unit_number || "None",
      Property: item.property_name || item.current_unit?.property?.name || "None",
      "Lease Start": item.lease_start_date
        ? new Date(item.lease_start_date).toLocaleDateString()
        : item.move_in_date
        ? new Date(item.move_in_date).toLocaleDateString()
        : "N/A",
      "Lease End": item.lease_end_date
        ? new Date(item.lease_end_date).toLocaleDateString()
        : "N/A",
      Rent: item.rent_amount
        ? item.rent_amount
        : item.current_unit?.rent
        ? parseFloat(item.current_unit.rent as any)
        : null,
      Balance: item.balance ?? null,
    }))
    headers = ["Name","Email","Phone","Status","Unit","Property","Lease Start","Lease End","Rent","Balance"]
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false })

  // Widen columns per report type
  const widthMap: Record<string, number[]> = {
    financial: [12, 12, 12, 16, 14],
    occupancy: [20, 16, 12, 16],
    expense: [14, 24, 16, 20, 12, 12],
    tenant:  [20, 28, 18, 12, 10, 22, 14, 14, 10, 12],
  }
  ws["!cols"] = (widthMap[reportType] || headers.map(() => 16)).map(wch => ({ wch }))

  // Bold + shaded headers
  headers.forEach((_, c) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c })
    const cell = ws[addr]
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2A7FBF" } }, // blue header
        alignment: { horizontal: "center", vertical: "center" }
      }
    }
  })
  // Slightly taller header row
  ws["!rows"] = [{ hpt: 22 }]

  // Auto filter on header row
  const lastCol = XLSX.utils.encode_col(headers.length - 1)
  ws["!autofilter"] = { ref: `A1:${lastCol}1` }

  // Number formats for currency columns (where applicable)
  const currencyColsByReport: Record<string, string[]> = {
    financial: ["Revenue","Expenses","Taxable Income","Net Profit"],
    expense: ["Amount"],
    tenant: ["Rent","Balance"],
  }
  const currencyCols = currencyColsByReport[reportType] || []
  currencyCols.forEach(colName => {
    const cIdx = headers.indexOf(colName)
    if (cIdx >= 0) {
      for (let r = 1; r <= rows.length; r++) {
        const addr = XLSX.utils.encode_cell({ r, c: cIdx })
        const cell = ws[addr]
        if (cell && typeof cell.v === "number") {
          cell.z = "#,##0.00"
          cell.s = { alignment: { horizontal: "right" } }
        }
      }
    }
  })

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  // Add: property tag to filename, consistent with exportPDF
  const tag = options?.property ? `-${slug(options.property)}` : ""
  XLSX.writeFile(wb, `${reportType}-report${tag}.xlsx`)}
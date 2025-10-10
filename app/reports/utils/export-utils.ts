import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { saveAs } from "file-saver"
import { formatCurrency } from "@/lib/utils"
import { FinancialData, OccupancyData, Tenant } from "../types"
import { Expense } from "@/hooks/useExpenses"

export const exportPDF = (
  reportType: string, 
  financialData: FinancialData[], 
  occupancyData: OccupancyData[], 
  expenses: Expense[], 
  tenants: Tenant[]
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
      head: [['Month', 'Revenue', 'Expenses', 'Profit']],
      body: financialData.map(item => [
        item.month,
        formatCurrency(item.revenue),
        formatCurrency(item.expenses),
        formatCurrency(item.profit)
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
    autoTable(doc, {
      head: [['Property', 'Occupied Units', 'Total Units', 'Occupancy Rate']],
      body: occupancyData.map(item => [
        item.property,
        item.occupied,
        item.total,
        `${item.rate}%`
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
  } else if (reportType === "expense") {
    autoTable(doc, {
      head: [['Date', 'Name', 'Type', 'Amount', 'Recurring']],
      body: expenses.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.name,
        item.expense_type,
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
        item.tenant_status || '',
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
  
  // Save the PDF
  doc.save(`${reportType}-report.pdf`)
}

export const exportCSV = (
  reportType: string, 
  financialData: FinancialData[], 
  occupancyData: OccupancyData[], 
  expenses: Expense[], 
  tenants: Tenant[]
) => {
  let csvContent = "";
  let fileName = "";
  
  if (reportType === "financial") {
    csvContent = "Month,Revenue,Expenses,Profit\n";
    csvContent += financialData.map(item => 
      `${item.month},${item.revenue},${item.expenses},${item.profit}`
    ).join("\n");
    fileName = "financial-report.csv";
  } else if (reportType === "occupancy") {
    csvContent = "Property,Occupied Units,Total Units,Occupancy Rate\n";
    csvContent += occupancyData.map(item => 
      `${item.property},${item.occupied},${item.total},${item.rate}%`
    ).join("\n");
    fileName = "occupancy-report.csv";
  } else if (reportType === "expense") {
    csvContent = "Date,Name,Type,Amount,Recurring\n";
    csvContent += expenses.map(item => 
      `${new Date(item.date).toLocaleDateString()},${item.name},${item.expense_type},${item.amount},${item.is_recurring ? 'Yes' : 'No'}`
    ).join("\n");
    fileName = "expense-report.csv";
  } else if (reportType === "tenant") {
    csvContent = "Name,Email,Phone,Status,Unit,Property,Lease Start,Lease End,Rent,Balance\n";
    csvContent += tenants.map(item => 
      `${item.user?.full_name || ''},${item.user?.email || ''},${item.user?.phone || ''},${item.tenant_status || ''},${item.current_unit?.unit_number || 'None'},${item.property_name || item.current_unit?.property?.name || 'None'},${item.lease_start_date ? new Date(item.lease_start_date).toLocaleDateString() : item.move_in_date ? new Date(item.move_in_date).toLocaleDateString() : 'N/A'},${item.lease_end_date ? new Date(item.lease_end_date).toLocaleDateString() : 'N/A'},${item.rent_amount ? formatCurrency(item.rent_amount) : item.current_unit?.rent ? formatCurrency(parseFloat(item.current_unit.rent)) : 'N/A'},${item.balance ? formatCurrency(item.balance) : 'N/A'}`
    ).join("\n");
    fileName = "tenant-report.csv";
  }
  
  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  saveAs(blob, fileName);
}
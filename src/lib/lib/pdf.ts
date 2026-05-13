'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, calculateTotals, formatMoney } from '../lib/types';

export async function generatePDF(invoice: Invoice): Promise<Blob> {
  const doc = new jsPDF();
  const { subtotal, tax, total } = calculateTotals(invoice.items, invoice.taxRate);
  const { template, from, to, items, number, date, dueDate, notes, terms, currency } = invoice;

  // Page dimensions
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  if (template === 'modern') {
    // Modern: gradient-like colored header bar
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(0, 0, pageW, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', margin, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${number}`, pageW - margin - 40, 25);

    y = 45;
  } else if (template === 'classic') {
    // Classic: professional, centered title
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageW / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${number}`, pageW / 2, y, { align: 'center' });
    y += 8;
  } else {
    // Minimal: clean, left-aligned
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${number} | ${date}`, margin, y);
    y += 12;
  }

  // From / To section
  const col1 = margin;
  const col2 = pageW / 2 + 10;

  if (template !== 'minimal') {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('FROM', col1, y);
    doc.text('BILL TO', col2, y);
    y += 5;
  }

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(from.name || 'Your Company', col1, y);
  doc.text(to.name || 'Client Name', col2, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const fromLines = [from.email, from.address, from.phone].filter(Boolean);
  const toLines = [to.email, to.address, to.phone].filter(Boolean);
  const maxLines = Math.max(fromLines.length, toLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (fromLines[i]) doc.text(fromLines[i], col1, y);
    if (toLines[i]) doc.text(toLines[i], col2, y);
    y += 4;
  }
  y += 6;

  // Logo
  if (from.logo) {
    try {
      doc.addImage(from.logo, 'JPEG', pageW - margin - 40, y - 15, 30, 15);
    } catch {
      // ignore logo errors
    }
  }

  // Dates
  if (template !== 'minimal') {
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${date}`, margin, y);
    doc.text(`Due: ${dueDate}`, col2, y);
    y += 8;
  }

  // Table
  const tableData = items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatMoney(item.rate, currency),
    formatMoney(item.quantity * item.rate, currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: template === 'modern' ? 'grid' : template === 'classic' ? 'striped' : 'plain',
    headStyles: {
      fillColor: template === 'modern' ? [59, 130, 246] : template === 'classic' ? [50, 50, 50] : [200, 200, 200],
      textColor: template === 'minimal' ? [50, 50, 50] : 255,
      fontSize: 10,
    },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable?.finalY || y + 30;
  const rightX = pageW - margin - 50;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', rightX - 20, finalY + 8, { align: 'right' });
  doc.text(formatMoney(subtotal, currency), pageW - margin, finalY + 8, { align: 'right' });

  if (tax > 0) {
    doc.text(`Tax (${invoice.taxRate}%):`, rightX - 20, finalY + 15, { align: 'right' });
    doc.text(formatMoney(tax, currency), pageW - margin, finalY + 15, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Total:', rightX - 20, finalY + 24, { align: 'right' });
  doc.text(formatMoney(total, currency), pageW - margin, finalY + 24, { align: 'right' });

  // Notes & Terms
  let bottomY = finalY + 35;
  if (notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', margin, bottomY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(notes, pageW - margin * 2);
    doc.text(noteLines, margin, bottomY + 5);
    bottomY += 10 + noteLines.length * 4;
  }
  if (terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text('Terms:', margin, bottomY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const termLines = doc.splitTextToSize(terms, pageW - margin * 2);
    doc.text(termLines, margin, bottomY + 5);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by InvoicePro — invoicepro.app', pageW / 2, doc.internal.pageSize.getHeight() - 10, {
    align: 'center',
  });

  return doc.output('blob');
}

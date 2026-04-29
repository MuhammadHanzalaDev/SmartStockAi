import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { Product } from '../types';

export const reportService = {
  exportToCSV: (products: Product[], shopName: string) => {
    const data = products.map(p => ({
      'Product Name': p.name,
      'SKU': p.sku,
      'Price (Rs.)': p.price,
      'Current Stock': p.stockQuantity,
      'Low Stock Threshold': p.thresholdLevel,
      'Status': p.stockQuantity <= 0 ? 'Out of Stock' : (p.stockQuantity <= p.thresholdLevel ? 'Low Stock' : 'Good'),
      'Inventory Value': p.price * p.stockQuantity
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${shopName.replace(/\s+/g, '_')}_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToPDF: (products: Product[], shopName: string) => {
    const doc = new jsPDF() as any;
    const date = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text(shopName, 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Inventory Status Report - ${date}`, 14, 28);
    
    // Summary Stats
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stockQuantity <= p.thresholdLevel).length;
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(`Total Products: ${totalProducts}`, 14, 45);
    doc.text(`Low Stock Items: ${lowStockCount}`, 80, 45);
    doc.text(`Est. Inventory Value: Rs. ${totalValue.toLocaleString()}`, 140, 45);
    
    const tableData = products.map(p => [
      p.name,
      p.sku,
      `Rs. ${p.price.toLocaleString()}`,
      p.stockQuantity.toString(),
      p.stockQuantity <= p.thresholdLevel ? 'LOW' : 'OK'
    ]);
    
    autoTable(doc, {
      startY: 55,
      head: [['Product Name', 'SKU', 'Price', 'Stock', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    });
    
    doc.save(`${shopName.replace(/\s+/g, '_')}_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};

import React, { useState, useRef } from 'react';
import { X, Upload, FileDown, AlertCircle, CheckCircle2, Loader2, Table } from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { productService } from '../services/productService';
import { Product } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface ImportData {
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  thresholdLevel: number;
  description: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, userId }) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [data, setData] = useState<ImportData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['name', 'sku', 'price', 'stockQuantity', 'thresholdLevel', 'description'];
    const sampleData = [
      ['Intel Core i9', 'CPU-001', '155000', '10', '2', 'High-end gaming processor'],
      ['RTX 4090 GPU', 'GPU-001', '450000', '5', '1', 'Flagship graphics card']
    ];
    
    const csvContent = [headers, ...sampleData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "inventory_template.csv";
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        const validData: ImportData[] = [];
        const validationErrors: string[] = [];

        parsedData.forEach((row, index) => {
          const rowNum = index + 2;
          const name = row.name?.trim();
          const sku = row.sku?.trim();
          const price = parseFloat(row.price);
          const stock = parseInt(row.stockQuantity);
          const threshold = parseInt(row.thresholdLevel) || 5;

          if (!name) validationErrors.push(`Row ${rowNum}: Name is required`);
          if (!sku) validationErrors.push(`Row ${rowNum}: SKU is required`);
          if (isNaN(price) || price < 0) validationErrors.push(`Row ${rowNum}: Invalid price`);
          if (isNaN(stock) || stock < 0) validationErrors.push(`Row ${rowNum}: Invalid stock quantity`);

          if (name && sku && !isNaN(price) && !isNaN(stock)) {
            validData.push({
              name,
              sku,
              price,
              stockQuantity: stock,
              thresholdLevel: threshold,
              description: row.description || ''
            });
          }
        });

        setData(validData);
        setErrors(validationErrors);
        setStep('preview');
      },
      error: (error) => {
        setErrors([`Error parsing CSV: ${error.message}`]);
      }
    });
  };

  const handleImport = async () => {
    if (data.length === 0) return;
    setLoading(true);
    try {
      await productService.bulkAddProducts(data, userId);
      onClose();
      // Reset state for next time
      setStep('upload');
      setData([]);
    } catch (error) {
      setErrors(['Failed to upload products. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Bulk Import Products</h3>
            <p className="text-sm text-slate-500 mt-0.5">Upload your inventory via CSV file</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' ? (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <FileDown size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Need a starting point?</p>
                    <p className="text-xs text-indigo-700">Download our CSV template with sample data.</p>
                  </div>
                </div>
                <button 
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  Download Template
                </button>
              </div>

              {/* Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700">Click to upload CSV</p>
                  <p className="text-sm text-slate-400 mt-1">or drag and drop your file here</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-0.5 opacity-80">
                    <li>Required columns: name, sku, price, stockQuantity</li>
                    <li>Optional columns: thresholdLevel, description</li>
                    <li>Prices and stock must be positive numbers</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table size={18} className="text-indigo-600" />
                  <h4 className="font-bold text-slate-900">Data Preview</h4>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                    {data.length} Products Found
                  </span>
                </div>
                <button 
                  onClick={() => setStep('upload')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Upload Different File
                </button>
              </div>

              {/* Errors Section */}
              {errors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <div className="flex items-center gap-2 text-rose-800 mb-2">
                    <AlertCircle size={16} />
                    <p className="text-xs font-bold">Found {errors.length} issues:</p>
                  </div>
                  <ul className="text-[11px] text-rose-700 space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">Product</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">SKU</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-right">Price</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.slice(0, 10).map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-slate-800 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{item.sku}</td>
                        <td className="px-4 py-3 text-slate-800 text-right">Rs. {item.price}</td>
                        <td className="px-4 py-3 text-slate-800 text-right">{item.stockQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 10 && (
                  <div className="p-3 bg-slate-50 text-center text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    + {data.length - 10} more items...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          {step === 'preview' && (
            <button 
              onClick={handleImport}
              disabled={loading || data.length === 0}
              className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {loading ? 'Importing...' : `Confirm Import (${data.length} items)`}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

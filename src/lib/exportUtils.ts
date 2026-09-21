/**
 * @file exportUtils.ts
 * @description Utilidades para la generación y descarga de respaldos en JSON y exportaciones en formato CSV compatible con Excel.
 */

import type { AppDatabase, Product, Category, Brand, Sale } from '../models/types';

/**
 * Descarga en el navegador un archivo de texto con el nombre y tipo MIME especificado.
 */
function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formatea una fecha actual como 'YYYY-MM-DD_HH-mm'.
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}`;
}

/**
 * Escapa un campo para formato CSV (entrecomilla y duplica comillas internas si es necesario).
 */
function escapeCSV(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Genera y descarga un archivo JSON íntegro con todas las tablas del sistema para respaldo a USB.
 */
export function exportCompleteBackup(db: AppDatabase) {
  const dataToExport = {
    backupDate: new Date().toISOString(),
    system: 'Optima POS Cloud v1.0',
    data: db,
  };
  const json = JSON.stringify(dataToExport, null, 2);
  const filename = `OptimaPOS_Backup_${getTimestamp()}.json`;
  triggerDownload(json, filename, 'application/json;charset=utf-8');
}

/**
 * Exporta el catálogo completo de productos en formato CSV compatible con Microsoft Excel (UTF-8 con BOM).
 */
export function exportProductsToCSV(
  products: Product[],
  categories: Category[],
  brands: Brand[]
) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const brandMap = new Map(brands.map((b) => [b.id, b.name]));

  const headers = [
    'ID',
    'SKU',
    'Código de Barras',
    'Nombre del Producto',
    'Descripción',
    'Categoría',
    'Marca',
    'Costo',
    'Precio Venta',
    'Stock Actual',
    'Stock Mínimo',
    'Unidad',
    'Activo',
    'Fecha de Creación',
  ];

  const rows = products.map((p) => [
    escapeCSV(p.id),
    escapeCSV(p.sku),
    escapeCSV(p.barcode),
    escapeCSV(p.name),
    escapeCSV(p.description),
    escapeCSV(catMap.get(p.categoryId) || 'Sin Categoría'),
    escapeCSV(brandMap.get(p.brandId) || 'Sin Marca'),
    p.cost,
    p.price,
    p.stock,
    p.minStock,
    escapeCSV(p.unit),
    p.active ? 'SÍ' : 'NO',
    escapeCSV(p.createdAt),
  ]);

  // \uFEFF es el Byte Order Mark (BOM) para que Excel reconozca automáticamente tildes y caracteres en español
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const filename = `OptimaPOS_Productos_${getTimestamp()}.csv`;
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8');
}

/**
 * Exporta el historial de ventas en formato CSV compatible con Microsoft Excel (UTF-8 con BOM).
 */
export function exportSalesToCSV(sales: Sale[]) {
  const headers = [
    'Folio / Referencia',
    'Fecha y Hora',
    'Cliente',
    'Método de Pago',
    'Subtotal',
    'Descuento',
    'Impuesto / IVA',
    'Total Venta',
    'Estado',
    'Cajero / Usuario',
    'URL Comprobante',
  ];

  const rows = sales.map((s) => [
    escapeCSV(s.reference),
    escapeCSV(s.createdAt),
    escapeCSV(s.customerName),
    escapeCSV(s.paymentMethod.toUpperCase()),
    s.subtotal,
    s.discount,
    s.tax,
    s.total,
    escapeCSV(s.status.toUpperCase()),
    escapeCSV(s.userName || 'Caja'),
    escapeCSV(s.receiptUrl || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const filename = `OptimaPOS_Ventas_${getTimestamp()}.csv`;
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8');
}

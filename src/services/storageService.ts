import type { Sale, CompanySettings } from '../models/types';
import { formatCurrency, formatDateTime } from '../lib/utils';

/**
 * Configuración para el Almacenamiento de Objetos en Cloudflare R2 (API S3-Compatible)
 * Se puede sobreescribir mediante variables de entorno en el servidor o cliente.
 */
export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

const DEFAULT_R2_CONFIG: R2Config = {
  accountId: import.meta.env.VITE_R2_ACCOUNT_ID || 'demo_account_id',
  accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || 'demo_access_key',
  secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || 'demo_secret_key',
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME || 'storeflow-receipts',
  publicDomain: import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://r2.storeflow.pos.dev',
};

/**
 * Renderiza el HTML oficial formateado del Comprobante Fiscal / Ticket de Venta
 */
export function buildReceiptHtml(sale: Sale, settings: CompanySettings): string {
  const sym = settings.currencySymbol || '$';
  
  const itemsHtml = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px; color: #1e293b;">
          <strong>${item.quantity}x</strong> ${item.productName}
          <div style="font-size: 10px; color: #64748b;">@ ${formatCurrency(item.price, sym)}</div>
        </td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px; font-weight: bold; text-align: right; color: #0f172a;">
          ${formatCurrency(item.subtotal, sym)}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Venta - ${sale.reference}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
    .ticket-card { max-width: 380px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
    .company-name { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: -0.5px; }
    .company-details { font-size: 11px; color: #64748b; margin: 2px 0; }
    .title-tag { display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 20px; margin-top: 10px; text-transform: uppercase; }
    .info-grid { font-size: 11px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f1f5f9; padding: 12px; border-radius: 10px; }
    .info-label { color: #64748b; display: block; font-size: 10px; text-transform: uppercase; }
    .info-val { font-weight: 600; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .totals { border-top: 2px dashed #cbd5e1; padding-top: 12px; font-size: 12px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .total-row { font-size: 16px; font-weight: 800; color: #0284c7; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 6px; }
    .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
    .cloud-badge { display: inline-flex; items-center; gap: 4px; font-size: 9px; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <h1 class="company-name">${settings.name || 'Optima POS'}</h1>
      <p class="company-details">${settings.legalName || ''}</p>
      <p class="company-details">NIT / Tax ID: ${settings.taxId || 'N/A'}</p>
      <p class="company-details">${settings.address || ''} • Tel: ${settings.phone || ''}</p>
      <div class="title-tag">Comprobante Digital de Venta</div>
    </div>

    <div class="info-grid">
      <div>
        <span class="info-label">Folio:</span>
        <span class="info-val">${sale.reference}</span>
      </div>
      <div>
        <span class="info-label">Fecha:</span>
        <span class="info-val">${formatDateTime(sale.createdAt)}</span>
      </div>
      <div>
        <span class="info-label">Cliente:</span>
        <span class="info-val">${sale.customerName}</span>
      </div>
      <div>
        <span class="info-label">Atendido por:</span>
        <span class="info-val">${sale.userName}</span>
      </div>
      <div>
        <span class="info-label">Método Pago:</span>
        <span class="info-val" style="text-transform: capitalize;">${sale.paymentMethod}</span>
      </div>
      <div>
        <span class="info-label">Estado:</span>
        <span class="info-val" style="color: #16a34a;">${sale.status.toUpperCase()}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr style="text-align: left; font-size: 10px; color: #64748b; border-bottom: 1px solid #cbd5e1;">
          <th style="padding-bottom: 6px;">PRODUCTO / CANT.</th>
          <th style="padding-bottom: 6px; text-align: right;">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="row">
        <span>Subtotal:</span>
        <span>${formatCurrency(sale.subtotal, sym)}</span>
      </div>
      <div class="row">
        <span>IVA (${settings.taxRate || 0}%):</span>
        <span>${formatCurrency(sale.tax, sym)}</span>
      </div>
      ${
        sale.discount > 0
          ? `<div class="row" style="color: #16a34a;"><span>Descuento Promocional:</span><span>-${formatCurrency(sale.discount, sym)}</span></div>`
          : ''
      }
      <div class="row total-row">
        <span>TOTAL PAGADO:</span>
        <span>${formatCurrency(sale.total, sym)}</span>
      </div>
      ${
        sale.paymentMethod === 'efectivo'
          ? `
          <div class="row" style="margin-top: 8px; color: #64748b; font-size: 11px;">
            <span>Efectivo Recibido:</span>
            <span>${formatCurrency(sale.cashReceived, sym)}</span>
          </div>
          <div class="row" style="color: #16a34a; font-size: 11px; font-weight: 600;">
            <span>Cambio Devuelto:</span>
            <span>${formatCurrency(sale.change, sym)}</span>
          </div>`
          : ''
      }
    </div>

    <div class="footer">
      <p style="margin: 0; font-weight: 600; color: #475569;">¡GRACIAS POR SU COMPRA!</p>
      <p style="margin: 2px 0 0 0;">Conserve este comprobante digital oficial</p>
      <div class="cloud-badge">☁️ Almacenado de forma segura en Cloudflare R2</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Servicio de Almacenamiento R2 para Comprobantes y Documentos
 */
export const storageService = {
  /**
   * Genera el Comprobante Digital de Venta y lo sube al bucket de Cloudflare R2.
   * Si el sistema está offline o en modo cliente local, genera una URL Data-URI / ObjectURL.
   */
  async generateAndSaveSaleReceipt(
    sale: Sale,
    settings: CompanySettings
  ): Promise<string> {
    const htmlContent = buildReceiptHtml(sale, settings);
    const fileName = `ticket_${sale.reference}.html`;

    try {
      // Intentar envío al endpoint backend de Cloudflare R2 si está activo
      const response = await fetch('/api/upload/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          folder: 'receipts/sales',
          contentType: 'text/html',
          content: htmlContent,
          saleId: sale.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch {
      // Silencioso: fallback a almacenamiento Blob local
    }

    // Fallback local en memoria Data-URI / Blob URL para visualización inmediata e imprimible
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const localUrl = URL.createObjectURL(blob);
    return localUrl;
  },

  /**
   * Subida de comprobantes de compras a proveedores a Cloudflare R2
   */
  async uploadPurchaseReceipt(file: File, reference: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'receipts/purchases');
      formData.append('reference', reference);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (e) {
      console.warn('Falló la subida remota R2, generando URL local', e);
    }

    return URL.createObjectURL(file);
  },

  /**
   * Subida de comprobantes/fotos de transferencias bancarias y abonos a Cloudflare R2
   */
  async uploadTransferReceipt(file: File, reference: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'receipts/transfers');
      formData.append('reference', reference);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (e) {
      console.warn('Falló la subida remota R2, generando URL local', e);
    }

    return URL.createObjectURL(file);
  },
};

/**
 * @file purchaseService.ts
 * @description Capa de Servicio / Lógica de Negocio para Proveedores y Ordenes de Compra.
 * 
 * REGLA DE ARQUITECTURA:
 * - `purchaseService` gestiona las compras e ingresos a almacén.
 * - Consume ÚNICAMENTE el modelo `purchaseModel` (sin llamadas directas a Supabase).
 * - Es invocado por `PurchaseController.ts` y `StoreController.tsx`.
 */

import type { Supplier, Purchase, Product } from '../models/types';
import { purchaseModel } from '../models/purchaseModel';
import { productModel } from '../models/productModel';

export const purchaseService = {
  /**
   * Obtiene y procesa proveedores y compras desde purchaseModel.
   */
  async fetchPurchasesData(): Promise<{ suppliers: Supplier[]; purchases: Purchase[] }> {
    const { suppliers, purchases, purchaseItems } = await purchaseModel.findAllPurchasesData();

    const mappedSuppliers: Supplier[] = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contact: s.contact || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      taxId: s.tax_id || '',
      balance: Number(s.balance) || 0,
      createdAt: s.created_at,
    }));

    const mappedPurchases: Purchase[] = purchases.map((p) => ({
      id: p.id,
      reference: p.reference,
      supplierId: p.supplier_id || '',
      supplierName: p.supplier_name || '',
      invoiceNumber: p.invoice_number || '',
      total: Number(p.total) || 0,
      status: p.status,
      invoiceFileUrl: p.invoice_file_url || undefined,
      createdAt: p.created_at,
      items: purchaseItems
        .filter((pi) => pi.purchase_id === p.id)
        .map((pi) => ({
          productId: pi.product_id,
          productName: pi.product_name,
          quantity: Number(pi.quantity),
          cost: Number(pi.cost),
          subtotal: Number(pi.subtotal),
        })),
    }));

    return { suppliers: mappedSuppliers, purchases: mappedPurchases };
  },

  /**
   * Inserta o actualiza un proveedor mediante purchaseModel.
   */
  async upsertSupplier(s: Supplier): Promise<void> {
    await purchaseModel.upsertSupplier(s);
  },

  /**
   * Elimina un proveedor mediante purchaseModel.
   */
  async deleteSupplier(id: string): Promise<void> {
    await purchaseModel.deleteSupplier(id);
  },

  /**
   * Registra una compra mediante purchaseModel.
   */
  async insertPurchase(p: Purchase): Promise<void> {
    await purchaseModel.insertPurchaseWithItems(p);
  },

  /**
   * Cambia el estado de la compra a recibida mediante purchaseModel e incrementa el stock en Supabase.
   */
  async receivePurchase(
    id: string,
    purchase?: Purchase,
    products?: Product[],
    currentUser?: { id: string; name: string } | null
  ): Promise<void> {
    await purchaseModel.updatePurchaseStatus(id, 'recibida');

    // Incrementar stock en Supabase y registrar ajuste de entrada
    if (purchase && products) {
      for (const item of purchase.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const newStock = prod.stock + item.quantity;
          await productModel.updateStock(prod.id, newStock);
          await productModel.insertAdjustment({
            id: `adj_rec_${Date.now()}_${item.productId.slice(-4)}`,
            productId: prod.id,
            productName: prod.name,
            previousStock: prod.stock,
            newStock,
            reason: `Recepción de compra orden ${purchase.reference}`,
            type: 'entrada',
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Sistema',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  },

  /**
   * Cancela una orden de compra pendiente en Supabase.
   */
  async cancelPurchase(id: string): Promise<void> {
    await purchaseModel.updatePurchaseStatus(id, 'cancelada');
  },

  /**
   * Actualiza la URL del comprobante de factura adjunto a la compra.
   */
  async updateInvoiceFileUrl(id: string, invoiceFileUrl: string): Promise<void> {
    await purchaseModel.updateInvoiceFileUrl(id, invoiceFileUrl);
  },
};

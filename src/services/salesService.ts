/**
 * @file salesService.ts
 * @description Capa de Servicio / Lógica de Negocio para Ventas, Ítems de Venta y Anulaciones.
 * 
 * REGLA DE ARQUITECTURA:
 * - `salesService` procesa las reglas de negocio de ventas, transacciones y cola offline.
 * - Consume ÚNICAMENTE los modelos `salesModel`, `productModel`, `customerModel` (sin llamadas directas a Supabase).
 * - Es invocado por `SalesController.ts` y `StoreController.tsx`.
 */

import type { Sale, Product, Customer } from '../models/types';
import { salesModel } from '../models/salesModel';
import { productModel } from '../models/productModel';
import { customerModel } from '../models/customerModel';
import { isSupabaseConfigured } from '../models/supabase';
import { syncService } from './syncService';

export const salesService = {
  /**
   * Obtiene y transforma la lista de ventas desde salesModel.
   */
  async fetchSalesData(): Promise<Sale[]> {
    const { sales, items } = await salesModel.findAllSalesWithItems();

    return sales.map((s) => ({
      id: s.id,
      reference: s.reference,
      customerId: s.customer_id,
      customerName: s.customer_name,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      total: Number(s.total),
      paymentMethod: s.payment_method,
      cashReceived: Number(s.cash_received),
      change: Number(s.change),
      status: s.status,
      receiptUrl: s.receipt_url || undefined,
      userId: s.user_id,
      userName: s.user_name,
      createdAt: s.created_at,
      items: items
        .filter((si) => si.sale_id === s.id)
        .map((si) => ({
          productId: si.product_id,
          productName: si.product_name,
          quantity: Number(si.quantity),
          price: Number(si.price),
          discount: Number(si.discount),
          subtotal: Number(si.subtotal),
        })),
    }));
  },

  /**
   * Actualiza la URL del comprobante de venta en Supabase.
   */
  async updateReceiptUrl(saleId: string, receiptUrl: string): Promise<void> {
    await salesModel.updateReceiptUrl(saleId, receiptUrl);
  },

  /**
   * Procesa las reglas de negocio de la venta:
   * 1. Inserta la cabecera e ítems en la BD a través de salesModel.
   * 2. Descuenta el inventario mediante productModel.
   * 3. Si es a crédito, incrementa el saldo del cliente con customerModel.
   * En caso de fallo de red, encola en syncService.
   */
  async insertSale(sale: Sale, products: Product[], customer?: Customer): Promise<void> {
    if (!isSupabaseConfigured) {
      syncService.addToPendingQueue({ id: sale.id, type: 'sale', payload: sale });
      return;
    }

    try {
      // 1. Insertar cabecera e ítems vía salesModel
      await salesModel.insertSaleHeader(sale);

      const items = sale.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        subtotal: item.subtotal,
      }));
      await salesModel.insertSaleItems(items);

      // 2. Descontar stock vía productModel
      for (const item of sale.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          await productModel.updateStock(prod.id, Math.max(0, prod.stock - item.quantity));
        }
      }

      // 3. Actualizar saldo a crédito vía customerModel
      if (sale.paymentMethod === 'credito' && customer) {
        await customerModel.updateBalance(customer.id, (customer.balance || 0) + sale.total);
      }
    } catch (err) {
      console.warn('Sales insert failed, enqueuing for offline sync:', err);
      syncService.addToPendingQueue({ id: sale.id, type: 'sale', payload: sale });
    }
  },

  /**
   * Anula una venta a través de salesModel y restaura el inventario y cartera en Supabase.
   */
  async voidSale(id: string, sale?: Sale, products?: Product[], currentCustomerBalance?: number): Promise<void> {
    try {
      // 1. Marcar venta como anulada en Supabase
      await salesModel.updateSaleStatus(id, 'anulada');

      // 2. Restaurar stock en Supabase
      if (sale && products) {
        for (const item of sale.items) {
          const prod = products.find((p) => p.id === item.productId);
          if (prod) {
            const restoredStock = prod.stock + item.quantity;
            await productModel.updateStock(prod.id, restoredStock);
            await productModel.insertAdjustment({
              id: `adj_void_${Date.now()}_${item.productId.slice(-4)}`,
              productId: prod.id,
              productName: prod.name,
              previousStock: prod.stock,
              newStock: restoredStock,
              reason: `Reversión por anulación de venta ${sale.reference}`,
              type: 'entrada',
              userId: sale.userId,
              userName: sale.userName,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      // 3. Revertir saldo a crédito si la venta fue a crédito
      if (sale && sale.paymentMethod === 'credito' && sale.customerId && currentCustomerBalance !== undefined) {
        const newBalance = Math.max(0, currentCustomerBalance - sale.total);
        await customerModel.updateBalance(sale.customerId, newBalance);
      }
    } catch (err) {
      console.error('Error voiding sale:', err);
    }
  },
};

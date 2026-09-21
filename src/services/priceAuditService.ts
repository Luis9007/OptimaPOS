/**
 * @file priceAuditService.ts
 * @description Capa de Servicio / Lógica de Negocio para Auditoría de Cambios en Precios y Costos.
 * 
 * REGLA DE ARQUITECTURA:
 * - `priceAuditService` gestiona la consulta y registro de eventos de alteración de precios/costos.
 * - Consume ÚNICAMENTE el modelo `priceAuditModel` (sin llamadas directas a Supabase).
 * - Es invocado por `ProductController.ts` y `StoreController.tsx`.
 */

import type { PriceCostAuditLog } from '../models/types';
import { priceAuditModel } from '../models/priceAuditModel';

export const priceAuditService = {
  /**
   * Obtiene la lista de registros de auditoría de precio/costo transformados.
   */
  async fetchPriceAuditLogs(): Promise<PriceCostAuditLog[]> {
    const data = await priceAuditModel.findAll();
    return data.map((l) => ({
      id: l.id,
      productId: l.product_id || '',
      productName: l.product_name,
      sku: l.sku || '',
      oldPrice: Number(l.old_price) || 0,
      newPrice: Number(l.new_price) || 0,
      oldCost: Number(l.old_cost) || 0,
      newCost: Number(l.new_cost) || 0,
      userId: l.user_id || '',
      userName: l.user_name || 'Sistema',
      createdAt: l.created_at,
    }));
  },

  /**
   * Registra un nuevo evento de cambio de precio/costo vía priceAuditModel.
   */
  async insertPriceAuditLog(log: PriceCostAuditLog): Promise<void> {
    await priceAuditModel.insert(log);
  },
};

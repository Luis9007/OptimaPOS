/**
 * @file priceAuditModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para la Bitácora de Auditoría de Precios y Costos.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`price_cost_audit_logs`).
 * - Es invocado ÚNICAMENTE por `priceAuditService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { PriceCostAuditLog } from './types';

export const priceAuditModel = {
  /**
   * Obtiene todos los registros de auditoría de precio/costo ordenados descendentemente.
   */
  async findAll(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('price_cost_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data) return [];
    return data;
  },

  /**
   * Inserta un nuevo registro de auditoría de cambio de precio/costo.
   */
  async insert(log: PriceCostAuditLog): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('price_cost_audit_logs').insert({
      id: log.id,
      product_id: log.productId || null,
      product_name: log.productName,
      sku: log.sku || null,
      old_price: log.oldPrice,
      new_price: log.newPrice,
      old_cost: log.oldCost,
      new_cost: log.newCost,
      user_id: log.userId || null,
      user_name: log.userName,
      created_at: log.createdAt,
    });
    if (error) throw error;
  },
};

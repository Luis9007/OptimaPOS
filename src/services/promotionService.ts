/**
 * @file promotionService.ts
 * @description Capa de Servicio / Lógica de Negocio para Promociones, Descuentos y Cupones.
 * 
 * REGLA DE ARQUITECTURA:
 * - `promotionService` contiene las transformaciones y validaciones de promociones.
 * - Consume ÚNICAMENTE el modelo `promotionModel` (sin llamadas directas a Supabase).
 * - Es invocado por `StoreController.tsx`.
 */

import type { Promotion } from '../models/types';
import { promotionModel } from '../models/promotionModel';

export const promotionService = {
  /**
   * Obtiene y mapea todas las promociones desde promotionModel.
   */
  async fetchPromotions(): Promise<Promotion[]> {
    const data = await promotionModel.findAll();
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code || undefined,
      type: p.type,
      target: p.target,
      targetId: p.target_id || undefined,
      value: Number(p.value) || 0,
      minPurchaseAmount: p.min_purchase_amount ? Number(p.min_purchase_amount) : undefined,
      startDate: p.start_date || undefined,
      endDate: p.end_date || undefined,
      requiresRegisteredCustomer: Boolean(p.requires_registered_customer),
      maxRedemptionsPerCustomer: p.max_redemptions_per_customer ? Number(p.max_redemptions_per_customer) : undefined,
      isWelcomePromo: Boolean(p.is_welcome_promo),
      active: p.active ?? true,
      usageCount: Number(p.usage_count) || 0,
      createdAt: p.created_at,
    }));
  },

  /**
   * Guarda o actualiza una promoción mediante promotionModel.
   */
  async upsertPromotion(p: Promotion): Promise<void> {
    await promotionModel.upsert(p);
  },

  /**
   * Elimina una promoción mediante promotionModel.
   */
  async deletePromotion(id: string): Promise<void> {
    await promotionModel.deleteById(id);
  },

  /**
   * Alterna el estado activo/inactivo de una promoción.
   */
  async togglePromotionActive(id: string, active: boolean): Promise<void> {
    await promotionModel.toggleActive(id, active);
  },
};

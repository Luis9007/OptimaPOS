/**
 * @file promotionModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Reglas de Promoción y Cupones.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`promotions`).
 * - Es invocado ÚNICAMENTE por `promotionService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Promotion } from './types';

export const promotionModel = {
  /**
   * Obtiene todas las promociones registradas en la base de datos.
   */
  async findAll(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  /**
   * Inserta o actualiza una promoción en Supabase.
   */
  async upsert(p: Promotion): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('promotions').upsert({
      id: p.id,
      name: p.name,
      code: p.code || null,
      type: p.type,
      target: p.target,
      target_id: p.targetId || null,
      value: p.value,
      min_purchase_amount: p.minPurchaseAmount || 0,
      start_date: p.startDate || null,
      end_date: p.endDate || null,
      requires_registered_customer: p.requiresRegisteredCustomer ?? false,
      max_redemptions_per_customer: p.maxRedemptionsPerCustomer || null,
      is_welcome_promo: p.isWelcomePromo ?? false,
      active: p.active ?? true,
      usage_count: p.usageCount || 0,
    });
    if (error) throw error;
  },

  /**
   * Elimina una promoción por su identificador.
   */
  async deleteById(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Alterna el estado activo de una promoción.
   */
  async toggleActive(id: string, active: boolean): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('promotions')
      .update({ active })
      .eq('id', id);
    if (error) throw error;
  },
};

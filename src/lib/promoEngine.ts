/**
 * @file promoEngine.ts
 * @description Motor de Evaluación y Cálculo de Promociones Automáticas, Reglas 2x1 y Cupones para StoreFlow.
 */

import type { Promotion, Product, Customer } from '@/models/types';

export interface CartItemForPromo {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  discount: number; // Descuento manual previo en %
  categoryId?: string;
  brandId?: string;
}

export interface AppliedPromotionInfo {
  promotionId: string;
  promotionName: string;
  discountAmount: number;
  type: Promotion['type'];
  code?: string;
}

export interface PromoEvaluationResult {
  appliedPromotions: AppliedPromotionInfo[];
  totalPromoDiscount: number;
  itemDiscounts: Record<string, { totalDiscount: number; percentEffective: number; promoBadge?: string }>;
  couponError?: string;
  couponSuccess?: string;
}

/**
 * Evalúa las promociones activas y códigos de cupón sobre los artículos del carrito.
 */
export function evaluatePromotions(
  cartItems: CartItemForPromo[],
  promotions: Promotion[],
  productsMap: Map<string, Product>,
  couponCode?: string,
  customer?: Customer | null,
  customerWelcomeRedemptionsCount: number = 0
): PromoEvaluationResult {
  const result: PromoEvaluationResult = {
    appliedPromotions: [],
    totalPromoDiscount: 0,
    itemDiscounts: {},
  };

  if (!cartItems.length) return result;

  const nowISO = new Date().toISOString();

  // Filtrar promociones activas y vigentes
  const activePromos = (promotions || []).filter((p) => {
    if (!p.active) return false;
    if (p.startDate && p.startDate > nowISO) return false;
    if (p.endDate && p.endDate < nowISO) return false;
    return true;
  });

  // Calcular subtotal bruto del carrito
  const grossSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // 1. Evaluar Promociones por Producto, Categoría o Marca (2x1, % OFF, etc.)
  for (const item of cartItems) {
    const product = productsMap.get(item.productId);
    const catId = item.categoryId || product?.categoryId;
    const brandId = item.brandId || product?.brandId;

    let itemDiscountAmount = 0;
    let promoBadge = '';

    for (const promo of activePromos) {
      if (promo.code) continue; // Los cupones / promociones globales se evalúan en la sección 2

      let applies = false;
      if (promo.target === 'all') applies = true;
      else if (promo.target === 'product' && promo.targetId === item.productId) applies = true;
      else if (promo.target === 'category' && promo.targetId === catId) applies = true;
      else if (promo.target === 'brand' && promo.targetId === brandId) applies = true;

      if (!applies) continue;

      if (promo.type === 'buy_x_get_y' && promo.value >= 2) {
        const freeUnits = Math.floor(item.quantity / promo.value);
        if (freeUnits > 0) {
          const discountForThisPromo = freeUnits * item.price;
          if (discountForThisPromo > itemDiscountAmount) {
            itemDiscountAmount = discountForThisPromo;
            promoBadge = `🎁 ${promo.name}`;
            
            const existing = result.appliedPromotions.find((ap) => ap.promotionId === promo.id);
            if (existing) {
              existing.discountAmount += discountForThisPromo;
            } else {
              result.appliedPromotions.push({
                promotionId: promo.id,
                promotionName: promo.name,
                discountAmount: discountForThisPromo,
                type: promo.type,
              });
            }
          }
        }
      } else if (promo.type === 'percentage') {
        const discountForThisPromo = item.price * item.quantity * (promo.value / 100);
        if (discountForThisPromo > itemDiscountAmount) {
          itemDiscountAmount = discountForThisPromo;
          promoBadge = `🔥 -${promo.value}%`;

          const existing = result.appliedPromotions.find((ap) => ap.promotionId === promo.id);
          if (existing) {
            existing.discountAmount += discountForThisPromo;
          } else {
            result.appliedPromotions.push({
              promotionId: promo.id,
              promotionName: promo.name,
              discountAmount: discountForThisPromo,
              type: promo.type,
            });
          }
        }
      } else if (promo.type === 'fixed') {
        const discountForThisPromo = Math.min(item.price * item.quantity, promo.value);
        if (discountForThisPromo > itemDiscountAmount) {
          itemDiscountAmount = discountForThisPromo;
          promoBadge = `🏷️ -$${promo.value}`;

          const existing = result.appliedPromotions.find((ap) => ap.promotionId === promo.id);
          if (existing) {
            existing.discountAmount += discountForThisPromo;
          } else {
            result.appliedPromotions.push({
              promotionId: promo.id,
              promotionName: promo.name,
              discountAmount: discountForThisPromo,
              type: promo.type,
            });
          }
        }
      }
    }

    const manualDiscountAmount = item.price * item.quantity * (item.discount / 100);
    const finalItemDiscount = Math.max(itemDiscountAmount, manualDiscountAmount);

    result.itemDiscounts[item.productId] = {
      totalDiscount: finalItemDiscount,
      percentEffective: item.price * item.quantity > 0 ? (finalItemDiscount / (item.price * item.quantity)) * 100 : 0,
      promoBadge: promoBadge || (item.discount > 0 ? `-${item.discount}%` : undefined),
    };

    result.totalPromoDiscount += finalItemDiscount;
  }

  // 2. Evaluar Promociones de Venta Global / Cupones Automáticos (BIENVENIDA5K, etc.)
  for (const promo of activePromos) {
    if (!promo.code && promo.target !== 'all' && promo.type !== 'fixed') continue;

    // Verificar si es un cupón manual ingresado o una promoción global de aplicación automática
    let isCouponMatch = false;
    if (couponCode && couponCode.trim() && promo.code) {
      isCouponMatch = promo.code.toUpperCase() === couponCode.trim().toUpperCase();
    } else if (promo.code) {
      // Auto-aplicación automática siempre que se cumplan las condiciones
      isCouponMatch = true;
    }

    if (!isCouponMatch && promo.code) continue;

    // Validación 1: Cliente registrado obligatorio
    if ((promo.requiresRegisteredCustomer || promo.isWelcomePromo) && !customer) {
      if (couponCode && promo.code && couponCode.trim().toUpperCase() === promo.code.toUpperCase()) {
        result.couponError = `La promoción "${promo.name}" es exclusiva para clientes registrados (no aplica a Público general).`;
      }
      continue;
    }

    // Validación 2: Máximo de canjes por cliente registrado
    if (
      promo.maxRedemptionsPerCustomer &&
      customerWelcomeRedemptionsCount >= promo.maxRedemptionsPerCustomer
    ) {
      if (couponCode && promo.code && couponCode.trim().toUpperCase() === promo.code.toUpperCase()) {
        result.couponError = `El cliente "${customer?.name}" ya alcanzó el límite máximo de ${promo.maxRedemptionsPerCustomer} canjes para esta promoción.`;
      }
      continue;
    }

    // Validación 3: Compra mínima requerida
    if (promo.minPurchaseAmount && grossSubtotal < promo.minPurchaseAmount) {
      if (couponCode && promo.code && couponCode.trim().toUpperCase() === promo.code.toUpperCase()) {
        result.couponError = `El cupón requiere una compra mínima de $${promo.minPurchaseAmount.toLocaleString()}`;
      }
      continue;
    }

    // Si cumple todas las condiciones, aplicar el descuento a la compra completa
    let couponDiscount = 0;
    if (promo.type === 'fixed') {
      couponDiscount = Math.min(grossSubtotal, promo.value);
    } else if (promo.type === 'percentage') {
      couponDiscount = grossSubtotal * (promo.value / 100);
    }

    if (couponDiscount > 0) {
      const existing = result.appliedPromotions.find((ap) => ap.promotionId === promo.id);
      if (!existing) {
        result.totalPromoDiscount += couponDiscount;
        result.couponSuccess = `¡Promoción "${promo.name}" aplicada a la compra completa! (-$${couponDiscount.toLocaleString()})`;
        result.appliedPromotions.push({
          promotionId: promo.id,
          promotionName: promo.name,
          discountAmount: couponDiscount,
          type: promo.type,
          code: promo.code,
        });
      }
    }
  }

  return result;
}

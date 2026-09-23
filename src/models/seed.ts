/**
 * @file seed.ts
 * @description Datos Semilla / Iniciales de Prueba para la Base de Datos Local.
 * 
 * RELACIÓN CON OTROS MÓDULOS:
 * - Utilizado por `StoreController.tsx` y `loadDbFromStorage` cuando no hay datos en la API de Supabase
 *   o cuando la aplicación se ejecuta en modo standalone (sin backend en la nube).
 * - Proveído por `SettingsController.resetData()` para restaurar el sistema a su estado inicial.
 */

import type { AppDatabase, Product, Sale, SaleItem, CashSession, Purchase, Promotion, PriceCostAuditLog } from './types';
import { generateId } from '../lib/utils';

const iso = (d: Date) => d.toISOString();

/**
 * Función auxiliar para generar fechas relativas hacia atrás en días.
 */
function daysBack(n: number, hour = 10, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return iso(d);
}

/** Categorías iniciales de productos */
const categories = [
  { id: 'cat_bebidas', name: 'Bebidas', color: '#0ea5e9', icon: 'CupSoda' },
  { id: 'cat_lacteos', name: 'Lácteos', color: '#14b8a6', icon: 'Milk' },
  { id: 'cat_abarrotes', name: 'Abarrotes', color: '#f59e0b', icon: 'Wheat' },
  { id: 'cat_snacks', name: 'Snacks', color: '#ef4444', icon: 'Cookie' },
  { id: 'cat_limpieza', name: 'Limpieza', color: '#8b5cf6', icon: 'SprayCan' },
  { id: 'cat_cuidado', name: 'Cuidado Personal', color: '#ec4899', icon: 'HeartPulse' },
];

/** Marcas comerciales iniciales */
const brands = [
  { id: 'br_coca', name: 'Coca-Cola' },
  { id: 'br_pepsi', name: 'Pepsi' },
  { id: 'br_nestle', name: 'Nestlé' },
  { id: 'br_lala', name: 'Lala' },
  { id: 'br_gamesa', name: 'Gamesa' },
  { id: 'br_sabritas', name: 'Sabritas' },
  { id: 'br_p&g', name: 'Procter & Gamble' },
  { id: 'br_colgate', name: 'Colgate' },
  { id: 'br_unilever', name: 'Unilever' },
  { id: 'br_bimbo', name: 'Bimbo' },
  { id: 'brand-1785344683802', name: 'Familia / Dersa' },
  { id: 'brand_member_s_selection', name: "Member's Selection" },
  { id: 'brand_medalla_de_oro', name: 'Medalla de Oro' },
  { id: 'brand_refisal', name: 'Refisal' },
  { id: 'brand_meel', name: 'Meel' },
  { id: 'brand_al_fresco', name: 'Al Fresco' },
  { id: 'brand_bonaropa', name: 'Bonaropa' },
  { id: 'brand_aromatel', name: 'Aromatel' },
  { id: 'brand_baygon', name: 'Baygon' },
  { id: 'brand_alma_de_romero', name: 'Alma de Romero' },
  { id: 'brand_ego', name: 'Ego' },
  { id: 'brand_pan', name: 'Harina P.A.N.' },
  { id: 'brand_colcafe', name: 'Colcafé' },
  { id: 'brand_dona_pepa', name: 'Doña Pepa' },
];

/** Productos del catálogo inicial */
const products: Product[] = [
  { id: 'prod_015', sku: 'L', barcode: '7706303714097', name: 'LAVAPLATOS LIMÓN', description: 'LAVAPLATOS LIMÓN 500ml', categoryId: 'cat_limpieza', brandId: 'brand-1785344683802', cost: 1500, price: 2500, stock: 20, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T17:04:51.549Z' },
  { id: 'prod_002', sku: 'CAF-INS', barcode: '607766665865', name: 'CAFÉ INSTANTÁNEO', description: 'CAFÉ INSTANTÁNEO 320g', categoryId: 'cat_abarrotes', brandId: 'brand_member_s_selection', cost: 20000, price: 35000, stock: 35, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:02:33.782Z' },
  { id: 'prod_001', sku: 'ALI-VIN-ESP-ACE', barcode: '7701008626997', name: 'ACEITE DE OLIVA', description: 'Aceite de oliva 500ml', categoryId: 'cat_abarrotes', brandId: 'brand_medalla_de_oro', cost: 3500, price: 5000, stock: 19, minStock: 5, unit: 'pza', active: true, favorite: true, createdAt: '2026-07-29T15:54:39.429Z' },
  { id: 'prod_004', sku: 'SAL-MAR', barcode: '7703812411646', name: 'SAL MARINA', description: 'SAL MARINA 500g', categoryId: 'cat_abarrotes', brandId: 'brand_refisal', cost: 1500, price: 2600, stock: 35, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:06:55.430Z' },
  { id: 'prod_006', sku: 'MIE-ABE', barcode: '7700304110445', name: 'MIEL DE ABEJAS', description: 'MIEL DE ABEJAS 350g', categoryId: 'cat_abarrotes', brandId: 'brand_meel', cost: 2500, price: 4000, stock: 17, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:11:11.035Z' },
  { id: 'prod_005', sku: 'PAS-TOM', barcode: '9107291262504', name: 'PASTA DE TOMATE', description: 'PASTA DE TOMATE 250g', categoryId: 'cat_abarrotes', brandId: 'brand_al_fresco', cost: 5000, price: 8000, stock: 28, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:08:56.637Z' },
  { id: 'prod_007', sku: 'DET-LIQ', barcode: '7700304587636', name: 'DETERGENTE LÍQUIDO', description: 'DETERGENTE LÍQUIDO 3L', categoryId: 'cat_limpieza', brandId: 'brand_bonaropa', cost: 6000, price: 10000, stock: 20, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:19:12.717Z' },
  { id: 'prod_008', sku: 'SUA-ROP', barcode: '7702191522066', name: 'SUAVIZANTE PARA ROPA', description: 'SUAVIZANTE PARA ROPA 1,3L', categoryId: 'cat_limpieza', brandId: 'brand_aromatel', cost: 5000, price: 8900, stock: 22, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:21:46.244Z' },
  { id: 'prod_009', sku: 'BAY-MAT-CUC', barcode: '7501032926069', name: 'BAYGON MATA CUCARACHAS', description: 'BAYGON MATA CUCARACHAS Y CHIRIPAS 241g', categoryId: 'cat_limpieza', brandId: 'brand_baygon', cost: 11000, price: 18000, stock: 25, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:24:14.974Z' },
  { id: 'prod_010', sku: 'SHA-ANT-CRE', barcode: '7702354961411', name: 'SHAMPOO ANTICAÍDA Y CRECIMIENTO', description: 'SHAMPOO ANTICAÍDA Y CRECIMIENTO 500ml', categoryId: 'cat_cuidado', brandId: 'brand_alma_de_romero', cost: 9000, price: 13000, stock: 18, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:27:44.988Z' },
  { id: 'prod_011', sku: 'GEL-EGO', barcode: '5707406653117', name: 'GEL EGO', description: 'GEL EGO 200ml', categoryId: 'cat_cuidado', brandId: 'brand_ego', cost: 5000, price: 8000, stock: 19, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:29:24.721Z' },
  { id: 'prod_012', sku: 'CRE-DEN', barcode: '7891150083899', name: 'CREMA DENTAL', description: 'CREMA DENTAL 80g', categoryId: 'cat_cuidado', brandId: 'br_colgate', cost: 10000, price: 15000, stock: 30, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:30:55.843Z' },
  { id: 'prod_014', sku: 'HAR-MAI-BLA', barcode: '7702084137520', name: 'HARINA DE  MAÍZ BLANCO', description: 'HARINA DE  MAÍZ BLANCO 250g', categoryId: 'cat_abarrotes', brandId: 'brand_pan', cost: 1500, price: 3000, stock: 25, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:35:45.851Z' },
  { id: 'prod_003', sku: 'CAF-LIO', barcode: '7702032119639', name: 'CAFÉ LIOFILIZADO', description: 'CAFÉ INSTANTÁNEO LIOFILIZADO 170g', categoryId: 'cat_abarrotes', brandId: 'brand_colcafe', cost: 15000, price: 25000, stock: 21, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:05:10.634Z' },
  { id: 'prod_013', sku: 'ARR-PAR', barcode: '7702231300036', name: 'ARROZ PARBORIZADO', description: 'ARROZ PARBORIZADO 3000G', categoryId: 'cat_abarrotes', brandId: 'brand_dona_pepa', cost: 18000, price: 31500, stock: 25, minStock: 5, unit: 'pza', active: true, favorite: false, createdAt: '2026-07-29T16:34:10.898Z' },
];

/** Clientes iniciales */
const customers = [
  { id: 'cus_001', name: 'María González', document: 'GOAM850412', phone: '5512345678', email: 'maria.g@email.com', address: 'Calle Reforma 123, CDMX', balance: 0, notes: 'Cliente frecuente', createdAt: daysBack(20) },
  { id: 'cus_002', name: 'Juan Pérez', document: 'PEMJ900315', phone: '5598765432', email: 'juan.p@email.com', address: 'Av. Insurgentes 456, CDMX', balance: 120, notes: 'Crédito pendiente', createdAt: daysBack(15) },
  { id: 'cus_003', name: 'Ana Martínez', document: 'MAAN920628', phone: '5544556677', email: 'ana.m@email.com', address: 'Calle Juárez 789, CDMX', balance: 0, notes: '', createdAt: daysBack(10) },
  { id: 'cus_004', name: 'Carlos Ruiz', document: 'RUCM880102', phone: '5522334455', email: 'carlos.r@email.com', address: 'Col. Centro, CDMX', balance: 0, notes: 'Paga siempre en efectivo', createdAt: daysBack(5) },
  { id: 'cus_005', name: 'Laura Sánchez', document: 'SACL950714', phone: '5566778899', email: 'laura.s@email.com', address: 'Polanco, CDMX', balance: 0, notes: '', createdAt: daysBack(2) },
];

/** Proveedores iniciales */
const suppliers = [
  { id: 'sup_001', name: 'Distribuidora del Centro', contact: 'Roberto Díaz', phone: '5511223344', email: 'ventas@distcentro.com', address: 'Av. Industrial 100, CDMX', taxId: 'DC850101AB1', balance: 0, createdAt: daysBack(25) },
  { id: 'sup_002', name: 'Coca-Cola FEMSA', contact: 'Patricia Luna', phone: '5533445566', email: 'pedidos@cocafemsa.com', address: 'Av. Tláhuac 200, CDMX', taxId: 'CF900202XY2', balance: 0, createdAt: daysBack(25) },
  { id: 'sup_003', name: 'Grupo Bimbo', contact: 'Miguel Torres', phone: '5555667788', email: 'comercial@bimbo.com', address: 'Calz. Ticomán 500, CDMX', taxId: 'GB780303CD3', balance: 0, createdAt: daysBack(20) },
  { id: 'sup_004', name: 'Nestlé México', contact: 'Sofía Vega', phone: '5577889900', email: 'contacto@nestle.mx', address: 'Av. Cuauhtémoc 800, CDMX', taxId: 'NM900404EF4', balance: 0, createdAt: daysBack(18) },
];

/** Función constructora de ventas sintéticas para demostración */
function buildSale(daysBackN: number, hour: number, items: Array<{ product: Product; qty: number }>, paymentMethod: Sale['paymentMethod'], customerIdx: number | null, userId: string, userName: string, seq: number): Sale {
  const saleItems: SaleItem[] = items.map(({ product, qty }) => ({
    productId: product.id,
    productName: product.name,
    quantity: qty,
    price: product.price,
    discount: 0,
    subtotal: product.price * qty,
  }));
  const subtotal = saleItems.reduce((s, i) => s + i.subtotal, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  const cashReceived = paymentMethod === 'efectivo' ? Math.ceil(total / 50) * 50 : total;
  return {
    id: generateId('sale'),
    reference: `V-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
    customerId: customerIdx !== null ? customers[customerIdx].id : null,
    customerName: customerIdx !== null ? customers[customerIdx].name : 'Público general',
    items: saleItems,
    subtotal,
    discount: 0,
    tax,
    total,
    paymentMethod,
    cashReceived,
    change: cashReceived - total,
    userId,
    userName,
    status: 'completada',
    createdAt: daysBack(daysBackN, hour, Math.floor(Math.random() * 50)),
  };
}

let saleSeq = 1;
const sales: Sale[] = [
  buildSale(6, 9, [{ product: products[0], qty: 2 }, { product: products[12], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(6, 11, [{ product: products[1], qty: 1 }, { product: products[8], qty: 1 }], 'tarjeta', 0, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(5, 10, [{ product: products[5], qty: 2 }, { product: products[4], qty: 3 }], 'efectivo', 1, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(5, 14, [{ product: products[13], qty: 2 }, { product: products[14], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(4, 9, [{ product: products[0], qty: 5 }, { product: products[2], qty: 3 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(4, 13, [{ product: products[10], qty: 1 }, { product: products[9], qty: 2 }], 'tarjeta', 2, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(3, 10, [{ product: products[3], qty: 2 }, { product: products[7], qty: 1 }], 'efectivo', 3, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(3, 16, [{ product: products[6], qty: 1 }, { product: products[7], qty: 1 }], 'credito', 1, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(2, 9, [{ product: products[0], qty: 3 }, { product: products[12], qty: 2 }, { product: products[13], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(2, 12, [{ product: products[1], qty: 2 }, { product: products[11], qty: 1 }], 'efectivo', 4, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(1, 10, [{ product: products[5], qty: 1 }, { product: products[4], qty: 2 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(1, 11, [{ product: products[9], qty: 1 }, { product: products[10], qty: 1 }], 'tarjeta', 0, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(1, 15, [{ product: products[0], qty: 4 }, { product: products[12], qty: 3 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 9, [{ product: products[1], qty: 1 }, { product: products[8], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 10, [{ product: products[0], qty: 2 }, { product: products[13], qty: 2 }], 'efectivo', 2, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 11, [{ product: products[5], qty: 2 }, { product: products[6], qty: 1 }], 'tarjeta', 0, 'user_cajero', 'Carlos Vendedor', saleSeq++),
  buildSale(0, 13, [{ product: products[10], qty: 1 }, { product: products[9], qty: 1 }, { product: products[11], qty: 1 }], 'efectivo', null, 'user_cajero', 'Carlos Vendedor', saleSeq++),
];

/** Compras iniciales de prueba */
const purchases: Purchase[] = [
  {
    id: generateId('pur'),
    reference: 'C-2026-00001',
    supplierId: 'sup_002',
    supplierName: 'Distribuidora de Alimentos',
    invoiceNumber: 'FAC-001',
    items: [
      { productId: 'prod_001', productName: 'ACEITE DE OLIVA', quantity: 10, cost: 3500, subtotal: 35000 },
      { productId: 'prod_002', productName: 'CAFÉ INSTANTÁNEO', quantity: 15, cost: 20000, subtotal: 300000 },
      { productId: 'prod_004', productName: 'SAL MARINA', quantity: 20, cost: 1500, subtotal: 30000 },
    ],
    total: 365000,
    status: 'recibida',
    createdAt: daysBack(7),
  },
  {
    id: generateId('pur'),
    reference: 'C-2026-00002',
    supplierId: 'sup_003',
    supplierName: 'Productos de Limpieza S.A.',
    invoiceNumber: 'FAC-002',
    items: [
      { productId: 'prod_007', productName: 'DETERGENTE LÍQUIDO', quantity: 15, cost: 6000, subtotal: 90000 },
      { productId: 'prod_008', productName: 'SUAVIZANTE PARA ROPA', quantity: 12, cost: 5000, subtotal: 60000 },
    ],
    total: 150000,
    status: 'recibida',
    createdAt: daysBack(5),
  },
  {
    id: generateId('pur'),
    reference: 'C-2026-00003',
    supplierId: 'sup_004',
    supplierName: 'Importaciones y Cuidado Personal',
    invoiceNumber: 'FAC-003',
    items: [
      { productId: 'prod_010', productName: 'SHAMPOO ANTICAÍDA Y CRECIMIENTO', quantity: 10, cost: 9000, subtotal: 90000 },
      { productId: 'prod_012', productName: 'CREMA DENTAL', quantity: 20, cost: 10000, subtotal: 200000 },
    ],
    total: 290000,
    status: 'pendiente',
    createdAt: daysBack(2),
  },
];

/** Sesiones de caja registradora iniciales */
const cashSessions: CashSession[] = [
  {
    id: generateId('cash'),
    openingAmount: 500,
    closingAmount: 3250,
    status: 'cerrada',
    openedAt: daysBack(1, 8, 0),
    closedAt: daysBack(0, 20, 30),
    userId: 'user_cajero',
    userName: 'Carlos Vendedor',
    movements: [
      { id: generateId('mov'), type: 'apertura', amount: 500, concept: 'Apertura de caja', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(1, 8, 0) },
      { id: generateId('mov'), type: 'venta', amount: 1850, concept: 'Ventas del día', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(0, 20, 0) },
      { id: generateId('mov'), type: 'egreso', amount: 100, concept: 'Compra de bolsas', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(0, 15, 0) },
      { id: generateId('mov'), type: 'cierre', amount: 3250, concept: 'Cierre de caja', reference: '', userId: 'user_cajero', userName: 'Carlos Vendedor', createdAt: daysBack(0, 20, 30) },
    ],
  },
];

/** Configuración por defecto de la tienda cliente */
const settings = {
  name: 'Minimarket Don Pedro',
  legalName: 'Don Pedro Abarrotes & Comercio S.A.S.',
  taxId: '901.234.567-8',
  address: 'Calle 100 # 15-20, Bogotá, Colombia',
  phone: '+57 601 555 1234',
  email: 'contacto@donpedromarket.com',
  currency: 'COP',
  currencySymbol: '$',
  taxRate: 19,
  logoText: 'Don Pedro',
  logoUrl: '',
  theme: 'dark' as const,
};

/** Usuarios de demostración */
const users = [
  { id: 'user_super', name: 'Sofía Supervisor', email: 'supervisor@optimapos.com', password: 'super123', role: 'supervisor' as const, active: true, createdAt: daysBack(28) },
  { id: 'user_cajero', name: 'Carlos Vendedor', email: 'cajero@optimapos.com', password: 'cajero123', role: 'cajero' as const, active: true, createdAt: daysBack(25) },
];

/** Promociones de prueba iniciales */
const promotions: Promotion[] = [
  {
    id: 'promo_2x1_aceite',
    name: '2x1 en Aceite de Oliva 500ml',
    type: 'buy_x_get_y',
    target: 'product',
    targetId: 'prod_001',
    value: 2, // Compra 2, el segundo es gratis (2x1)
    active: true,
    usageCount: 14,
    createdAt: daysBack(10),
  },
  {
    id: 'promo_15_lacteos',
    name: '15% de Descuento en Lácteos',
    type: 'percentage',
    target: 'category',
    targetId: 'cat_lacteos',
    value: 15,
    active: true,
    usageCount: 8,
    createdAt: daysBack(5),
  },
  {
    id: 'promo_cupon_bienvenida',
    name: 'Cupón Bienvenida -$5.000',
    code: 'BIENVENIDA5K',
    type: 'fixed',
    target: 'all',
    value: 5000,
    minPurchaseAmount: 30000,
    requiresRegisteredCustomer: true,
    maxRedemptionsPerCustomer: 3,
    active: true,
    usageCount: 3,
    createdAt: daysBack(3),
  },
];

const priceCostLogs: PriceCostAuditLog[] = [
  {
    id: generateId('pclog'),
    productId: 'prod_cocacola_600',
    productName: 'Coca-Cola 600ml',
    sku: 'BEB-CC-600',
    oldPrice: 4000,
    newPrice: 4500,
    oldCost: 2800,
    newCost: 3100,
    userId: 'user_admin',
    userName: 'Luis Administrador',
    createdAt: daysBack(2),
  },
  {
    id: generateId('pclog'),
    productId: 'prod_leche_alpina',
    productName: 'Leche Entera Alpina 1L',
    sku: 'LAC-LE-1L',
    oldPrice: 4800,
    newPrice: 5200,
    oldCost: 3600,
    newCost: 3900,
    userId: 'user_admin',
    userName: 'Luis Administrador',
    createdAt: daysBack(1),
  },
];

/** Exportación del objeto completo de la base de datos de semilla */
export const seedDatabase: AppDatabase = {
  users,
  categories,
  brands,
  products,
  customers,
  suppliers,
  purchases,
  sales,
  cashSessions,
  adjustments: [],
  promotions,
  priceCostLogs,
  settings,
  logs: [
    { id: generateId('log'), action: 'system', detail: 'Catálogo e historial restablecido a estado limpio', userId: 'user_super', userName: 'Sofía Supervisor', createdAt: new Date().toISOString() },
  ],
};

# 🏛️ Documentación Arquitectónica — Optima POS v2.0
## Backend Node.js + Express.js & Cliente React (MVC + Service Layer + Cloudflare R2 Storage)

Este documento describe la arquitectura completa de **Optima POS v2.0** (anteriormente conocido como StoreFlow), que implementa un **Servidor Backend Node.js con Express.js** en `src/server/`, una aplicación **Frontend en React** en `src/`, y un servicio de **Almacenamiento de Objetos en la Nube (Cloudflare R2)** para comprobantes digitales, cumpliendo **al 100% las 4 reglas arquitectónicas estrictas** del patrón MVC + Service Layer.

---

## 1. 🎯 Flujo Completo de una Petición e Infraestructura

```
Cliente (React SPA - Optima POS)
      │
      ├───────────────────────────────────┐
      │ HTTP REST (fetch/axios)           │ Direct API / Cloud S3 Protocol
      ▼                                   ▼
src/server/routes/                 src/services/storageService.ts
      │                                   │
      ▼                                   ▼
src/server/controllers/            Cloudflare R2 Object Storage
      │                            (Comprobantes / Tickets Digitales / Adjuntos)
      ▼
src/server/services/
      │
      ▼
src/server/models/
      │
      ▼
Supabase (PostgreSQL)     ←── Base de datos en la nube con Auth + Row Level Security
```

---

## 2. 📋 Confirmación de Cumplimiento de las 4 Reglas Estrictas

| Capa | Regla Estricta | Implementación en `src/server/` |
|---|---|---|
| **Routes** | Solo definen las rutas de los endpoints y mapean hacia los métodos del controlador Express. Sin lógica alguna. | `src/server/routes/` (`authRoutes.ts`, `productRoutes.ts`, `salesRoutes.ts`, `cashRoutes.ts`, `customerRoutes.ts`, `purchaseRoutes.ts`, `settingsRoutes.ts`) utilizan exclusivamente `router.get`, `router.post`, `router.patch`, `router.delete` para enlazar endpoints HTTP con los controladores. |
| **Controllers** | Solo leen `req`, extraen parámetros/body, llaman a la capa de servicios y responden con `res`. **Cero lógica de negocio y cero consultas a BD.** | `src/server/controllers/` (`authController.ts`, `productController.ts`, `salesController.ts`, `cashController.ts`, `customerController.ts`, `purchaseController.ts`, `settingsController.ts`) reciben firmas `(req: Request, res: Response)`, extraen `req.body` y `req.params`, llaman a servicios y responden con `res.status(...).json(...)`. |
| **Services** | Contienen **toda** la lógica de negocio, validaciones del dominio y orquestación. Llaman exclusivamente a los modelos. | `src/server/services/` (`authService.ts`, `productService.ts`, `salesService.ts`, `cashService.ts`, `customerService.ts`, `purchaseService.ts`, `settingsService.ts`) procesan cálculos, validaciones, reglas de inventario, saldos de cartera y transformaciones. Consumen **exclusivamente** a los modelos. |
| **Models** | **Única** capa responsable del acceso a datos. Ninguna otra capa toca la BD directamente. | `src/server/models/` (`authModel.ts`, `productModel.ts`, `salesModel.ts`, `cashModel.ts`, `customerModel.ts`, `purchaseModel.ts`, `settingsModel.ts`) encapsulan **todas** las consultas a Supabase/SQL. Son los **únicos** archivos autorizados para consultar o mutar datos en la BD. |

---

## 3. 🏛️ Estructura Completa del Proyecto

```
Optima POS/
├── src/
│   │
│   ├── server/                         # ── BACKEND NODE.JS + EXPRESS ──
│   │   ├── routes/
│   │   │   ├── authRoutes.ts           # POST /api/auth/login, /api/auth/logout
│   │   │   ├── productRoutes.ts        # GET/POST/PUT/DELETE /api/products
│   │   │   ├── salesRoutes.ts          # GET/POST /api/sales
│   │   │   ├── cashRoutes.ts           # GET/POST /api/cash-sessions
│   │   │   ├── customerRoutes.ts       # GET/POST/PUT /api/customers
│   │   │   ├── purchaseRoutes.ts       # GET/POST/PATCH /api/purchases
│   │   │   └── settingsRoutes.ts       # GET/PUT /api/settings
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── productController.ts
│   │   │   ├── salesController.ts
│   │   │   ├── cashController.ts
│   │   │   ├── customerController.ts
│   │   │   ├── purchaseController.ts
│   │   │   └── settingsController.ts
│   │   │
│   │   ├── services/
│   │   │   ├── authService.ts          # Validación de credenciales, generación de sesión
│   │   │   ├── productService.ts       # Lógica de inventario, SKU, stock mínimo, auditoría precios
│   │   │   ├── salesService.ts         # Cálculo de totales, descuentos, IVA, anulaciones
│   │   │   ├── cashService.ts          # Reglas de apertura/cierre, arqueo
│   │   │   ├── customerService.ts      # Cartera, abonos, saldo pendiente
│   │   │   ├── purchaseService.ts      # Recepción de mercancía, actualización de costos
│   │   │   └── settingsService.ts      # Configuración de empresa e impuestos
│   │   │
│   │   ├── models/
│   │   │   ├── authModel.ts            # supabase.from('users').select(...)
│   │   │   ├── productModel.ts         # supabase.from('products')...
│   │   │   ├── salesModel.ts           # supabase.from('sales')...
│   │   │   ├── cashModel.ts            # supabase.from('cash_sessions')...
│   │   │   ├── customerModel.ts        # supabase.from('customers')...
│   │   │   ├── purchaseModel.ts        # supabase.from('purchases')...
│   │   │   └── settingsModel.ts        # supabase.from('settings')...
│   │   │
│   │   ├── app.ts                      # Express app: CORS, JSON, rutas montadas
│   │   └── index.ts                    # Servidor Node.js en puerto 3001
│   │
│   ├── controllers/                    # ── CLIENTE REACT — Estado Global ──
│   │   ├── StoreController.tsx         # Context API: db state + todas las acciones
│   │   ├── ProductController.ts        # upsertProduct, upsertBrand, upsertCategory, auditoría
│   │   ├── PurchaseController.ts       # addPurchase, receivePurchase, upsertSupplier
│   │   ├── SalesController.ts          # addSale, voidSale (anulaciones)
│   │   ├── CashController.ts           # openCash, closeCash, addMovement
│   │   ├── CustomerController.ts       # upsertCustomer, addPayment
│   │   ├── AuthController.ts           # login, logout, currentUser
│   │   ├── permissions.ts              # canPerformAction(role, action): boolean
│   │   ├── types.ts                    # Tipos de acciones del store (discriminated union)
│   │   └── index.ts                    # Re-exports
│   │
│   ├── services/                       # ── CLIENTE REACT — Adaptadores API y Nube ──
│   │   ├── productService.ts           # fetch('/api/products', ...)
│   │   ├── purchaseService.ts          # fetch('/api/purchases', ...)
│   │   ├── salesService.ts             # fetch('/api/sales', ...)
│   │   ├── cashService.ts              # fetch('/api/cash-sessions', ...)
│   │   ├── storageService.ts           # Integración Cloudflare R2 (S3 API Client, comprobantes)
│   │   └── ...
│   │
│   ├── models/
│   │   ├── types.ts                    # Interfaces: Product, Sale, Purchase, Supplier, PriceCostAuditLog...
│   │   ├── seed.ts                     # Datos iniciales (categorías, marcas, catálogo real)
│   │   └── supabaseClient.ts           # createClient(SUPABASE_URL, ANON_KEY)
│   │
│   ├── lib/
│   │   ├── promoEngine.ts              # Motor de cálculo de Promociones y Descuentos
│   │   └── utils.ts                    # formatCurrency, formatDate, generateSequentialId,
│   │                                   # generateSkuFromName, cn (classnames)
│   │
│   └── views/
│       ├── components/
│       │   └── ui/
│       │       ├── Input.tsx           # Input, CurrencyInput, NumberInput, Select, Textarea
│       │       ├── Button.tsx          # Variantes: primary, outline, ghost, danger
│       │       ├── Card.tsx            # Card, CardContent, Badge, EmptyState
│       │       ├── Dialog.tsx          # Modal reutilizable con size y footer
│       │       ├── DataTable.tsx       # Tabla genérica con Column<T>[]
│       │       ├── Toast.tsx           # Notificaciones: success, error, warning, info
│       │       ├── Breadcrumb.tsx      # Navegación de migas de pan
│       │       └── PageHeader.tsx      # Encabezado estándar de página
│       │
│       └── pages/
│           ├── POSPage.tsx             # Punto de Venta (CurrencyInput, escáner preview, promociones)
│           ├── ProductsPage.tsx        # Catálogo, CurrencyInput, gestión de marcas
│           ├── PurchasesPage.tsx       # Compras: creación rápida proveedor/producto/marca
│           ├── CashPage.tsx            # Sesiones de caja, egresos y arqueo
│           ├── SuppliersPage.tsx       # CRUD de proveedores
│           ├── CustomersPage.tsx       # Clientes y cartera de crédito
│           ├── ReportsPage.tsx         # Reportes, rotación de stock, comprobantes R2, export Excel
│           ├── DashboardPage.tsx       # Panel de control con KPIs
│           ├── PromotionsPage.tsx      # Gestión de Reglas de Promoción y Descuentos
│           ├── SettingsPage.tsx        # Configuración de empresa e impuestos
│           ├── InventoryPage.tsx       # Ajustes manuales de inventario
│           └── LogsPage.tsx            # Bitácora de auditoría (Auditoría de precios y eventos)
│
├── supabase/                           # Migraciones SQL y esquema de BD
├── ARCHITECTURE.md                     # Este documento
├── DOCUMENTO_TECNICO.md                # Documento técnico completo v2.0
├── README.md                           # Guía de instalación y uso
├── package.json
├── vite.config.ts
└── tsconfig.app.json
```

---

## 4. 🔐 Sistema de Permisos (RBAC)

```typescript
// src/controllers/permissions.ts
export function canPerformAction(role: UserRole, action: string): boolean
```

Cada acción del sistema es evaluada por esta función antes de ejecutarse. Los componentes de la UI también la consumen para mostrar u ocultar elementos según el rol.

---

## 5. ☁️ Servicio de Almacenamiento Cloudflare R2 (`storageService.ts`)

Optima POS utiliza **Cloudflare R2** para el almacenamiento duradero de comprobantes digitales de venta, recibos de compra y facturas adjuntas sin costo de egreso de datos.

**Variables de Configuración en `.env`:**
```env
VITE_R2_ACCOUNT_ID=tu_account_id
VITE_R2_ACCESS_KEY_ID=tu_access_key_id
VITE_R2_SECRET_ACCESS_KEY=tu_secret_access_key
VITE_R2_BUCKET_NAME=optimapos-comprobantes
VITE_R2_PUBLIC_DOMAIN=https://pub-xxxxxx.r2.dev
```

---

## 6. 💱 Componente `CurrencyInput` — Diseño Técnico

El componente `CurrencyInput` en `src/views/components/ui/Input.tsx` gestiona montos monetarios formateados en tiempo real con separador de miles (`1.500.000`) y 2 decimales (`,00`).

---

## 7. 📡 Motor Offline-First

```
Venta registrada en POS
         │
         ▼
 ¿Supabase disponible?
    /          \
  SÍ           NO
   │             │
   ▼             ▼
Guardar      Guardar en
en Supabase  localStorage
             (PENDING)
                 │
                 ▼
         Health Check cada 30s
                 │
         ¿Conexión restaurada?
                 │
                 ▼
         Drenar cola → Supabase
```

---

## 8. 🚀 Ejecución del Servidor Backend Node.js

```bash
# Solo backend:
npm run server

# Frontend + Backend simultáneo (recomendado):
npm run dev
```

| Servicio | URL | Descripción |
|---|---|---|
| Frontend React | http://localhost:5173 | SPA con Vite HMR (Optima POS UI) |
| Backend Express | http://localhost:3001 | API REST completa en `/api/*` |

---

## 9. 🗄️ Esquema de Base de Datos

| Tabla | Columnas Principales |
|---|---|
| `users` | `id`, `email`, `role`, `name`, `password_hash` |
| `products` | `id`, `sku`, `barcode`, `name`, `category_id`, `brand_id`, `cost`, `price`, `stock`, `min_stock` |
| `categories` | `id`, `name`, `color` |
| `brands` | `id`, `name` |
| `sales` | `id`, `reference`, `customer_id`, `total`, `payment_method`, `user_id`, `receipt_url`, `status`, `created_at` |
| `sale_items` | `id`, `sale_id`, `product_id`, `quantity`, `price`, `discount`, `subtotal` |
| `purchases` | `id`, `reference`, `supplier_id`, `invoice_number`, `total`, `status` |
| `purchase_items` | `id`, `purchase_id`, `product_id`, `quantity`, `cost`, `subtotal` |
| `suppliers` | `id`, `name`, `contact`, `phone`, `email`, `tax_id`, `balance` |
| `customers` | `id`, `name`, `id_number`, `phone`, `balance` |
| `cash_sessions` | `id`, `opening_amount`, `closing_amount`, `opened_at`, `closed_at`, `status` |
| `cash_movements` | `id`, `session_id`, `type`, `amount`, `concept` |
| `inventory_adjustments` | `id`, `product_id`, `quantity`, `type`, `reason` |
| `promotions` | `id`, `name`, `type`, `discount_percent`, `min_quantity`, `active` |
| `price_cost_audit_logs` | `id`, `product_id`, `old_cost`, `new_cost`, `old_price`, `new_price`, `changed_by`, `timestamp` |
| `activity_logs` | `id`, `user_id`, `action`, `entity`, `entity_id`, `timestamp` |

---

*Optima POS v2.0 — ARCHITECTURE.md — Agosto 2026*

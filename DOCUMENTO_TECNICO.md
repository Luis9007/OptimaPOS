# 📘 Documento Técnico — Optima POS v2.0
**Sistema de Punto de Venta, Inventario, Comprobantes en Nube y Gestión Empresarial para Comercios Minoristas**

---

> **Versión:** 2.0 — Agosto 2026  
> **Repositorio:** https://github.com/Luis9007/OptimaPOS  
> **Stack:** React 18 + TypeScript + Vite + Supabase + Node.js + Express.js + Cloudflare R2 Object Storage  

---

## 1. Resumen Ejecutivo

**Optima POS** es una plataforma web empresarial de código abierto diseñada para digitalizar y modernizar la gestión operativa de comercios minoristas (tiendas de abarrotes, minimarkets, boutiques, ferreterías). Opera bajo una **arquitectura desacoplada de 4 capas MVC + Service Layer** respaldada por un servidor **Backend Node.js / Express.js**, almacenamiento de archivos en la nube **Cloudflare R2** para comprobantes digitales y un **Motor Offline-First** que garantiza continuidad operativa sin conexión a internet.

La versión 2.0 incorpora la distinción entre la marca **Optima POS** y el comercio cliente activo, integración de comprobantes digitales en Cloudflare R2, motor de promociones y descuentos, auditoría automática de costos/precios, flujo completo de anulaciones con ajuste de inventario y cartera, además de mejoras en UX (formato de moneda con miles).

---

## 2. Planteamiento del Problema

Los comercios minoristas de pequeño y mediano tamaño enfrentan retos críticos:

| Problema | Impacto | Solución en Optima POS |
|---|---|---|
| Dependencia de cuadernos y hojas de cálculo | Errores frecuentes, pérdidas de mercancía | Control centralizado de catálogo, inventario y stock mínimo |
| Ausencia de sistema POS rápido | Cobros lentos y errores de digitación | POS con lectura por escáner/cámara + preview en tiempo real |
| Caída del servicio de internet | Pérdida de ventas e inoperatividad | Motor Offline-First con cola local y sincronización auto |
| Pérdida de comprobantes y tickets físicos | Falta de respaldo y auditoría contable | Generación y carga automática de comprobantes a Cloudflare R2 |
| Variaciones sin control en costos y precios | Pérdida de margen de ganancia | Registro automático en la bitácora de auditoría de precios |
| Sin control de promociones ni anulaciones | Pérdida de inventario y descuadres | Motor de promociones y flujo controlado de anulaciones |

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama de Capas e Infraestructura

```
+-------------------------------------------------------------------+
|                  CLIENTE REACT (SPA — Vite)                        |
|  Views → Controllers → Services → Models (Supabase)               |
|  + Motor Offline-First (LocalStorage Queue)                       |
+---------------------+-------------------+-------------------------+
                      | HTTP REST         | S3 API Protocol (HTTPS)
                      v                   v
+---------------------+-----+   +---------+-----------------------+
|  BACKEND EXPRESS (:3001)  |   |    CLOUDFLARE R2 BUCKET       |
|  Routes→Control.→Service  |   | (Comprobantes / Tickets PDF)  |
+---------------------+-----+   +-----------------------------------+
                      | SQL (Supabase Client)
                      v
+-------------------------------------------------------------------+
|               SUPABASE (PostgreSQL + Auth + RLS)                  |
+-------------------------------------------------------------------+
```

### 3.2 Estratificación de Capas (MVC + Service Layer)

| Capa | Archivo | Responsabilidad Exclusiva |
|---|---|---|
| **Routes** | `src/server/routes/*.ts` | Definir endpoints HTTP, mapear a controladores. Sin lógica. |
| **Controllers** | `src/server/controllers/*.ts` | Leer `req`, llamar al servicio, responder con `res.json()`. |
| **Services** | `src/server/services/*.ts` | Toda la lógica de negocio, validaciones, cálculos, reglas. |
| **Models** | `src/server/models/*.ts` | **Única capa** con acceso directo a la base de datos. |
| **Storage Service** | `src/services/storageService.ts` | Gestión de archivos y comprobantes digitales en Cloudflare R2. |

---

## 4. Módulos Funcionales

### 4.1 Módulo POS (Punto de Venta) — `POSPage.tsx`
- **Cobro Rápido**: Búsqueda por nombre, SKU o lectura por código de barras mediante cámara/escáner (`Html5Qrcode`).
- **Vista Previa de Producto**: Al escanear, muestra ficha rápida con imagen, stock y precio.
- **Motor de Promociones**: Aplicación automática de descuentos por reglas configuradas (`promoEngine.ts`).
- **Formato Monetario**: `CurrencyInput` en apertura de caja y efectivo recibido con puntuación de miles.

### 4.2 Almacenamiento en Nube & Personalización de Marca — Cloudflare R2 (`storageService.ts`)
- **Comprobantes Digitales**: Generación y carga automática de comprobantes de ventas, compras y notas de crédito hacia buckets de Cloudflare R2 mediante el cliente S3 SDK.
- **Logotipos Personalizados de Comercio**: Subida de imágenes de marca en múltiples formatos (`PNG`, `JPG`, `JPEG`, `WEBP`, `SVG`, `GIF`, `ICO`, `BMP`) hacia Cloudflare R2 (`/store-logos/`) con respaldo Data-URL local.
- **Visualización Dinámica de Marca**: Pantalla de Login con logotipo de la plataforma vs. Menú Lateral (`Sidebar`) y Barra Superior (`Topbar`) con el logotipo propio de la tienda cliente activa.
- **Manual de Identidad de Marca**: Documento [`MANUAL_IDENTIDAD_MARCA.md`](MANUAL_IDENTIDAD_MARCA.md) oficial con estándares gráficos, colores corporativos y muestras.

### 4.3 Módulo de Productos y Auditoría de Precios — `ProductsPage.tsx` & `LogsPage.tsx`
- **CRUD e Inventario**: Control de costo, precio, stock actual y stock mínimo.
- **Auditoría `PriceCostAuditLog`**: Cada modificación de precio o costo genera automáticamente un registro auditado con fecha, valor previo, valor nuevo y usuario responsable.

### 4.4 Módulo de Promociones — `PromotionsPage.tsx`
- **Reglas de Descuento**: Configuración de promociones por porcentaje, volumen mínimo o categorías específicas.

### 4.5 Flujo de Anulaciones y Devoluciones — `SalesController.ts` & `ReportsPage.tsx`
- **Restablecimiento de Stock**: La anulación de una venta incrementa automáticamente el inventario de los productos devueltos.
- **Ajuste de Cartera y Caja**: Si la venta fue a crédito o en efectivo, revierte el saldo del cliente y registra el egreso correspondiente en la caja activa.

---

## 5. Esquema de Base de Datos (Supabase / PostgreSQL)

| Tabla | Descripción |
|---|---|
| `users` | Usuarios del sistema con rol (Supervisor/Cajero) |
| `products` | Catálogo de productos (SKU, barcode, cost, price, stock) |
| `categories` | Categorías con identificador y color |
| `brands` | Marcas de productos |
| `sales` | Cabecera de ventas (total, método de pago, receipt_url R2, status) |
| `sale_items` | Ítems individuales de cada venta |
| `purchases` | Órdenes de compra a proveedores |
| `purchase_items` | Detalle de costo y cantidad por compra |
| `suppliers` | Proveedores (NIT, contacto, balance) |
| `customers` | Clientes (cédula/NIT, balance de cartera) |
| `cash_sessions` | Sesiones de caja (apertura, cierre, arqueo) |
| `cash_movements` | Movimientos individuales de caja |
| `promotions` | Reglas de promociones y descuentos |
| `price_cost_audit_logs` | Histórico auditado de cambios de precios/costos |
| `activity_logs` | Bitácora de eventos del sistema |

---

## 6. Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 18 | Interfaz declarativa SPA |
| **TypeScript** | 5+ | Tipado estático estricto |
| **Vite** | 5+ | Compilador y servidor HMR |
| **Node.js / Express** | 18 / 4 | Servidor backend API REST |
| **Supabase** | — | PostgreSQL + Auth + Row Level Security |
| **Cloudflare R2** | — | Almacenamiento de objetos S3 para comprobantes |
| **AWS S3 SDK** | 3+ | Cliente de conexión a Cloudflare R2 |
| **Html5Qrcode** | — | Escaneo de código de barras por cámara |
| **Tailwind CSS** | 3 | Estilos e interfaz adaptativa |

---

## 7. Historial de Cambios — Versión 2.0 (Agosto 2026)

| Fecha | Cambio | Módulo |
|---|---|---|
| Ago 2026 | Rebranding a **Optima POS v2.0** en toda la plataforma | Global |
| Ago 2026 | Manual de Identidad de Marca oficial (`MANUAL_IDENTIDAD_MARCA.md`) | Raíz del proyecto |
| Ago 2026 | Sistema de Carga Multiformato de Logotipos con Cloudflare R2 | `SettingsPage.tsx` / `storageService.ts` |
| Ago 2026 | Visualización Dinámica de Marca (Login vs Tienda Activa en Sidebar/Topbar) | `Sidebar.tsx` / `Topbar.tsx` |
| Ago 2026 | Regla global `whitespace-nowrap` y ajuste responsivo en botones de modales | `Button.tsx` / `ReportsPage.tsx` |
| Ago 2026 | Integración de Cloudflare R2 para comprobantes digitales | `storageService.ts` |
| Ago 2026 | Botón "Ver Comprobante Digital" en historial | `ReportsPage.tsx` |
| Ago 2026 | Motor de Promociones y Descuentos | `promoEngine.ts` / `PromotionsPage.tsx` |
| Ago 2026 | Auditoría de Precios y Costos (`PriceCostAuditLog`) | `ProductsPage.tsx` / `LogsPage.tsx` |
| Ago 2026 | Flujo de Anulación y Devolución con reversión de stock | `SalesController.ts` |
| Ago 2026 | Reporte Consolidado de Inventario valorizado con export a Excel | `ReportsPage.tsx` |

---

*Optima POS v2.0 — Documento Técnico. Todos los derechos reservados.*

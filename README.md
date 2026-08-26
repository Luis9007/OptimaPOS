# 🛒 Optima POS v2.0 — Sistema de Punto de Venta, Inventarios & Gestión Empresarial

**Optima POS** (anteriormente StoreFlow) es una plataforma web moderna, modular y de alto rendimiento de Punto de Venta (POS), control de inventarios, almacenamiento de comprobantes en la nube, gestión de caja y auditoría en tiempo real diseñada para comercios minoristas y de consumo masivo (minimarkets, tiendas de abarrotes, boutiques, ferreterías).

Ofrece una **arquitectura desacoplada en 4 capas (MVC + Service Layer)** respaldada por un **Servidor Backend Node.js con Express.js**, integración con **Cloudflare R2 Object Storage** y un **Motor de Sincronización Resiliente Offline-First**, garantizando que el negocio siga vendiendo sin interrupción aunque se corte el internet.

---

## 📄 Documentación

| Documento | Descripción |
|---|---|
| [`MANUAL_IDENTIDAD_MARCA.md`](MANUAL_IDENTIDAD_MARCA.md) | Manual de Identidad de Marca y Estándares Gráficos v2.0 |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arquitectura MVC + Service Layer + Cloudflare R2 |
| [`DOCUMENTO_TECNICO.md`](DOCUMENTO_TECNICO.md) | Documento técnico detallado v2.0 |
| [`GUIA_PRESENTACION.md`](GUIA_PRESENTACION.md) | Guía para demostraciones técnicas |

---

## 🚀 Características Principales

### 🛒 1. Punto de Venta (POS) & Resiliencia
- **Cobro Dinámico Rápido**: Búsqueda instantánea de productos por nombre, código de barras o SKU.
- **Escáner de Código de Barras por Cámara**: Detección en tiempo real con vista previa del producto (nombre, precio, stock).
- **Múltiples Métodos de Pago**: Efectivo (con calculadora automática de cambio), Tarjeta, Transferencia bancaria y Crédito a clientes.
- **Campos de Moneda con Formato Inteligente**: Todos los campos numéricos usan puntuación de miles (`.`) y dos cifras decimales (`,00`) con borrado automático del `0` al enfocar.
- **Control Estricto de Caja**: Bloqueo automático si la caja está cerrada, con modal de apertura rápida.
- **Operatividad Ininterrumpida Offline**: Las ventas se encolan en `localStorage` y se sincronizan automáticamente al recuperar conexión.

### ☁️ 2. Comprobantes Digitales en Nube (Cloudflare R2)
- **Generación y Carga Directa**: Subida automática de tickets, facturas y comprobantes a buckets de Cloudflare R2 mediante protocolo S3.
- **Acceso Público / Enlace de Verificación**: Integración del botón "Ver Comprobante Digital" en la vista de reportes e historial.

### 🏷️ 3. Motor de Promociones y Descuentos
- **Reglas Configurables**: Descuentos automáticos por volumen de compra, porcentaje o categorías (`promoEngine.ts`).

### 📦 4. Inventario & Catálogo Inteligente
- **Auto-Generación de SKU**: Algoritmo que abrevia palabras conservando unidades.
- **Gestión de Marcas Inline**: Crear y editar marcas directamente desde el formulario de producto.
- **Open Food Facts API**: Autocompletado de datos para productos empacados desde API pública.
- **Alertas de Stock Mínimo**: Resaltado visual de productos en umbral crítico.

### 📈 5. Auditoría de Precios y Anulaciones
- **Bitácora `PriceCostAuditLog`**: Trazabilidad completa de variaciones en costos y precios de venta.
- **Flujo de Anulaciones y Devoluciones**: Reintegro automático de inventarios y reversión de saldos de caja y cartera.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript |
| Compilador | Vite 5 |
| Backend | Node.js 18 + Express.js |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) |
| Object Storage | Cloudflare R2 (S3 Protocol) |
| Escaneo | Html5Qrcode |
| Estilos | Vanilla CSS + Tailwind CSS |

---

## ⚙️ Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** v18+
- **npm** v9+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Luis9007/OptimaPOS.git
cd Optima\ POS

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase y Cloudflare R2:
# VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
# VITE_R2_ACCOUNT_ID=tu_account_id
# VITE_R2_ACCESS_KEY_ID=tu_access_key_id
# VITE_R2_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
# VITE_R2_BUCKET_NAME=optimapos-comprobantes
# VITE_R2_PUBLIC_DOMAIN=https://pub-xxxxxx.r2.dev

# 4. Ejecutar (Frontend + Backend simultáneamente)
npm run dev
```

| Servicio | URL |
|---|---|
| Frontend React (Vite) | http://localhost:5173 |
| Backend Node.js (Express) | http://localhost:3001 |

---

*Optima POS v2.0 — Agosto 2026*

-- ==========================================
-- Optima POS Database Schema for Supabase (PostgreSQL)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. App Users Table
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'cajero')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#0ea5e9',
    icon VARCHAR(50) DEFAULT 'Package'
);

-- 3. Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE SET NULL,
    cost NUMERIC(12, 2) DEFAULT 0,
    price NUMERIC(12, 2) DEFAULT 0,
    stock NUMERIC(12, 2) DEFAULT 0,
    min_stock NUMERIC(12, 2) DEFAULT 5,
    unit VARCHAR(20) DEFAULT 'pza',
    active BOOLEAN DEFAULT true,
    favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    document VARCHAR(50),
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    balance NUMERIC(12, 2) DEFAULT 0,
    welcome_redemptions INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    tax_id VARCHAR(50),
    balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Purchases & Items Table
CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(50) PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(50) REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(150),
    invoice_number VARCHAR(50),
    total NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'recibida', 'cancelada')),
    invoice_file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id VARCHAR(50) REFERENCES purchases(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    quantity NUMERIC(12, 2) DEFAULT 1,
    cost NUMERIC(12, 2) DEFAULT 0,
    subtotal NUMERIC(12, 2) DEFAULT 0
);

-- 8. Sales & Items Table
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) DEFAULT 'Público general',
    subtotal NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    tax NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia', 'credito')),
    cash_received NUMERIC(12, 2) DEFAULT 0,
    change NUMERIC(12, 2) DEFAULT 0,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completada' CHECK (status IN ('completada', 'anulada')),
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id VARCHAR(50) REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    quantity NUMERIC(12, 2) DEFAULT 1,
    price NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    subtotal NUMERIC(12, 2) DEFAULT 0
);

-- 9. Cash Sessions & Movements Table
CREATE TABLE IF NOT EXISTS cash_sessions (
    id VARCHAR(50) PRIMARY KEY,
    opening_amount NUMERIC(12, 2) DEFAULT 0,
    closing_amount NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'abierta' CHECK (status IN ('abierta', 'cerrada')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS cash_movements (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) REFERENCES cash_sessions(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    concept TEXT,
    reference VARCHAR(50),
    details JSONB,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Inventory Adjustments Table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    previous_stock NUMERIC(12, 2) DEFAULT 0,
    new_stock NUMERIC(12, 2) DEFAULT 0,
    reason TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(150),
    tax_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'COP',
    currency_symbol VARCHAR(5) DEFAULT '$',
    tax_rate NUMERIC(5, 2) DEFAULT 19,
    logo_text VARCHAR(50) DEFAULT 'Optima POS',
    logo_url TEXT,
    theme VARCHAR(10) DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 12. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    detail TEXT,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    type VARCHAR(30) NOT NULL CHECK (type IN ('percentage', 'fixed', 'buy_x_get_y')),
    target VARCHAR(30) NOT NULL CHECK (target IN ('all', 'product', 'category', 'brand')),
    target_id VARCHAR(50),
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_purchase_amount NUMERIC(12, 2) DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    requires_registered_customer BOOLEAN DEFAULT false,
    max_redemptions_per_customer INT,
    is_welcome_promo BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Price and Cost Audit Logs Table
CREATE TABLE IF NOT EXISTS price_cost_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(50),
    old_price NUMERIC(12, 2) DEFAULT 0,
    new_price NUMERIC(12, 2) DEFAULT 0,
    old_cost NUMERIC(12, 2) DEFAULT 0,
    new_cost NUMERIC(12, 2) DEFAULT 0,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cost_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public access via anon key for client-side app
CREATE POLICY "Public Read/Write for app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for purchase_items" ON purchase_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for cash_sessions" ON cash_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for cash_movements" ON cash_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for inventory_adjustments" ON inventory_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for price_cost_audit_logs" ON price_cost_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Permisos sobre el esquema y tablas para roles de Supabase (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==========================================
-- SEED INITIAL DATA
-- ==========================================

-- Insert Users
INSERT INTO app_users (id, name, email, password, role, active) VALUES
('user_super', 'Sofía Supervisor', 'supervisor@optimapos.com', 'super123', 'supervisor', true),
('user_cajero', 'Carlos Cajero', 'cajero@optimapos.com', 'cajero123', 'cajero', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, name, color, icon) VALUES
('cat_bebidas', 'Bebidas', '#0ea5e9', 'CupSoda'),
('cat_lacteos', 'Lácteos', '#14b8a6', 'Milk'),
('cat_abarrotes', 'Abarrotes', '#f59e0b', 'Wheat'),
('cat_snacks', 'Snacks', '#ef4444', 'Cookie'),
('cat_limpieza', 'Limpieza', '#8b5cf6', 'SprayCan'),
('cat_cuidado', 'Cuidado Personal', '#ec4899', 'HeartPulse')
ON CONFLICT (id) DO NOTHING;

-- Insert Brands
INSERT INTO brands (id, name) VALUES
('br_coca', 'Coca-Cola'),
('br_pepsi', 'Pepsi'),
('br_nestle', 'Nestlé'),
('br_lala', 'Lala'),
('br_gamesa', 'Gamesa'),
('br_sabritas', 'Sabritas'),
('br_p&g', 'Procter & Gamble'),
('br_colgate', 'Colgate'),
('br_unilever', 'Unilever'),
('br_bimbo', 'Bimbo'),
('brand-1785344683802', 'Familia / Dersa'),
('brand_member_s_selection', 'Member''s Selection'),
('brand_medalla_de_oro', 'Medalla de Oro'),
('brand_refisal', 'Refisal'),
('brand_meel', 'Meel'),
('brand_al_fresco', 'Al Fresco'),
('brand_bonaropa', 'Bonaropa'),
('brand_aromatel', 'Aromatel'),
('brand_baygon', 'Baygon'),
('brand_alma_de_romero', 'Alma de Romero'),
('brand_ego', 'Ego'),
('brand_pan', 'Harina P.A.N.'),
('brand_colcafe', 'Colcafé'),
('brand_dona_pepa', 'Doña Pepa')
ON CONFLICT (id) DO NOTHING;

-- Insert Products (Catálogo Oficial)
INSERT INTO products (id, sku, barcode, name, description, category_id, brand_id, cost, price, stock, min_stock, unit, active, favorite, created_at) VALUES
('prod_015', 'L', '7706303714097', 'LAVAPLATOS LIMÓN', 'LAVAPLATOS LIMÓN 500ml', 'cat_limpieza', 'brand-1785344683802', 1500.00, 2500.00, 20.00, 5.00, 'pza', true, false, '2026-07-29T17:04:51.549Z'),
('prod_002', 'CAF-INS', '607766665865', 'CAFÉ INSTANTÁNEO', 'CAFÉ INSTANTÁNEO 320g', 'cat_abarrotes', 'brand_member_s_selection', 20000.00, 35000.00, 35.00, 5.00, 'pza', true, false, '2026-07-29T16:02:33.782Z'),
('prod_001', 'ALI-VIN-ESP-ACE', '7701008626997', 'ACEITE DE OLIVA', 'Aceite de oliva 500ml', 'cat_abarrotes', 'brand_medalla_de_oro', 3500.00, 5000.00, 19.00, 5.00, 'pza', true, true, '2026-07-29T15:54:39.429Z'),
('prod_004', 'SAL-MAR', '7703812411646', 'SAL MARINA', 'SAL MARINA 500g', 'cat_abarrotes', 'brand_refisal', 1500.00, 2600.00, 35.00, 5.00, 'pza', true, false, '2026-07-29T16:06:55.430Z'),
('prod_006', 'MIE-AVE', '7700304110445', 'MIEL DE AVEJAS', 'MIEL DE AVEJAS 350g', 'cat_abarrotes', 'brand_meel', 2500.00, 4000.00, 17.00, 5.00, 'pza', true, false, '2026-07-29T16:11:11.035Z'),
('prod_005', 'PAS-TOM', '9107291262504', 'PASTA DE TOMATE', 'PASTA DE TOMATE 250g', 'cat_abarrotes', 'brand_al_fresco', 5000.00, 8000.00, 28.00, 5.00, 'pza', true, false, '2026-07-29T16:08:56.637Z'),
('prod_007', 'DET-LIQ', '7700304587636', 'DETERGENTE LÍQUIDO', 'DETERGENTE LÍQUIDO 3L', 'cat_limpieza', 'brand_bonaropa', 6000.00, 10000.00, 20.00, 5.00, 'pza', true, false, '2026-07-29T16:19:12.717Z'),
('prod_008', 'SUA-ROP', '7702191522066', 'SUAVIZANTE PARA ROPA', 'SUAVIZANTE PARA ROPA 1,3L', 'cat_limpieza', 'brand_aromatel', 5000.00, 8900.00, 22.00, 5.00, 'pza', true, false, '2026-07-29T16:21:46.244Z'),
('prod_009', 'BAY-MAT-CUC', '7501032926069', 'BAYGON MATA CUCARACHAS', 'BAYGON MATA CUCARACHAS Y CHIRIPAS 241g', 'cat_limpieza', 'brand_baygon', 11000.00, 18000.00, 25.00, 5.00, 'pza', true, false, '2026-07-29T16:24:14.974Z'),
('prod_010', 'SHA-ANT-CRE', '7702354961411', 'SHAMPOO ANTICAÍDA Y CRECIMIENTO', 'SHAMPOO ANTICAÍDA Y CRECIMIENTO 500ml', 'cat_cuidado', 'brand_alma_de_romero', 9000.00, 13000.00, 18.00, 5.00, 'pza', true, false, '2026-07-29T16:27:44.988Z'),
('prod_011', 'GEL-EGO', '5707406653117', 'GEL EGO', 'GEL EGO 200ml', 'cat_cuidado', 'brand_ego', 5000.00, 8000.00, 19.00, 5.00, 'pza', true, false, '2026-07-29T16:29:24.721Z'),
('prod_012', 'CRE-DEN', '7891150083899', 'CREMA DENTAL', 'CREMA DENTAL 80g', 'cat_cuidado', 'br_colgate', 10000.00, 15000.00, 30.00, 5.00, 'pza', true, false, '2026-07-29T16:30:55.843Z'),
('prod_014', 'HAR-MAI-BLA', '7702084137520', 'HARINA DE  MAÍZ BLANCO', 'HARINA DE  MAÍZ BLANCO 250g', 'cat_abarrotes', 'brand_pan', 1500.00, 3000.00, 25.00, 5.00, 'pza', true, false, '2026-07-29T16:35:45.851Z'),
('prod_003', 'CAF-LIO', '7702032119639', 'CAFÉ LIOFILIZADO', 'CAFÉ INSTANTÁNEO LIOFILIZADO 170g', 'cat_abarrotes', 'brand_colcafe', 15000.00, 25000.00, 21.00, 5.00, 'pza', true, false, '2026-07-29T16:05:10.634Z'),
('prod_013', 'ARR-PAR', '7702231300036', 'ARROZ PARBORIZADO', 'ARROZ PARBORIZADO 3000G', 'cat_abarrotes', 'brand_dona_pepa', 18000.00, 31500.00, 25.00, 5.00, 'pza', true, false, '2026-07-29T16:34:10.898Z')
ON CONFLICT (id) DO NOTHING;

-- Insert Customers
INSERT INTO customers (id, name, document, phone, email, address, balance, welcome_redemptions, notes) VALUES
('cus_001', 'María González', '1.012.345.678', '3101234567', 'maria.g@email.com', 'Calle 100 # 15-20, Bogotá', 0.00, 0, 'Cliente frecuente'),
('cus_002', 'Juan Pérez', '1.098.765.432', '3159876543', 'juan.p@email.com', 'Av. El Dorado # 68-90, Bogotá', 120000.00, 0, 'Crédito pendiente'),
('cus_003', 'Ana Martínez', '1.044.556.677', '3004455667', 'ana.m@email.com', 'Carrera 7 # 45-12, Bogotá', 0.00, 0, ''),
('cus_004', 'Carlos Ruiz', '1.022.334.455', '3202233445', 'carlos.r@email.com', 'Cl. 53 # 13-24, Bogotá', 0.00, 0, 'Paga siempre en efectivo'),
('cus_005', 'Laura Sánchez', '1.066.778.899', '3186677889', 'laura.s@email.com', 'Cra. 15 # 93-60, Bogotá', 0.00, 0, '')
ON CONFLICT (id) DO NOTHING;

-- Insert Suppliers
INSERT INTO suppliers (id, name, contact, phone, email, address, tax_id, balance) VALUES
('sup_001', 'Distribuidora Central Colombia', 'Roberto Díaz', '6015551122', 'ventas@distcentro.co', 'Zona Industrial Calle 13, Bogotá', '800.101.001-1', 0.00),
('sup_002', 'Coca-Cola FEMSA Colombia', 'Patricia Luna', '6015553344', 'pedidos@cocafemsa.co', 'Av. 68 # 12-40, Bogotá', '860.002.002-2', 0.00),
('sup_003', 'Grupo Bimbo de Colombia', 'Miguel Torres', '6015555566', 'comercial@bimbo.co', 'Autopista Norte Km 18, Chía', '860.780.303-3', 0.00),
('sup_004', 'Nestlé de Colombia S.A.', 'Sofía Vega', '6015557788', 'contacto@nestle.co', 'Carrera 7 # 123-55, Bogotá', '860.900.404-4', 0.00)
ON CONFLICT (id) DO NOTHING;

-- Insert Company Settings
INSERT INTO company_settings (id, name, legal_name, tax_id, address, phone, email, currency, currency_symbol, tax_rate, logo_text, logo_url, theme) VALUES
(1, 'Supermercado Optima POS', 'Optima POS Colombia S.A.S.', '901.234.567-8', 'Calle 100 # 15-20, Bogotá, Colombia', '+57 601 555 1234', 'contacto@optimapos.co', 'COP', '$', 19.00, 'Optima POS', '', 'dark')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    legal_name = EXCLUDED.legal_name,
    tax_id = EXCLUDED.tax_id,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    currency = EXCLUDED.currency,
    tax_rate = EXCLUDED.tax_rate,
    logo_text = EXCLUDED.logo_text;

-- Insert Promotions
INSERT INTO promotions (id, name, code, type, target, target_id, value, min_purchase_amount, requires_registered_customer, max_redemptions_per_customer, is_welcome_promo, active, usage_count) VALUES
('promo_2x1_aceite', '2x1 en Aceite de Oliva 500ml', NULL, 'buy_x_get_y', 'product', 'prod_001', 2.00, 0.00, false, NULL, false, true, 14),
('promo_15_lacteos', '15% de Descuento en Lácteos', NULL, 'percentage', 'category', 'cat_lacteos', 15.00, 0.00, false, NULL, false, true, 8),
('promo_cupon_bienvenida', 'Cupón Bienvenida -$5.000', 'BIENVENIDA5K', 'fixed', 'all', NULL, 5000.00, 30000.00, true, 3, true, true, 3)
ON CONFLICT (id) DO NOTHING;

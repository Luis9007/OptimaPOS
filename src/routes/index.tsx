/**
 * @file index.tsx (src/routes)
 * @description Capa de Enrutamiento / Definición de Endpoints de la Aplicación.
 * 
 * REGLA DE ARQUITECTURA:
 * - Rutas (`routes/`): Escuchan la petición de navegación/endpoint y conectan las rutas con los controladores y vistas.
 * - Incluye los guardias de autenticación (`ProtectedRoute`) y permisos de rol (`ModuleGuard`).
 */

import { type ReactNode, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../controllers/StoreController';
import { canAccessModule, type ModuleKey } from '../controllers/permissions';

import { AppLayout } from '../views/components/layout/AppLayout';
import { LoginPage } from '../views/pages/LoginPage';

// Carga perezosa (Code Splitting) para que la pantalla de Login no cargue librerías pesadas como Recharts o Html5Qrcode
const DashboardPage = lazy(() => import('../views/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const POSPage = lazy(() => import('../views/pages/POSPage').then(m => ({ default: m.POSPage })));
const ProductsPage = lazy(() => import('../views/pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const InventoryPage = lazy(() => import('../views/pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const PurchasesPage = lazy(() => import('../views/pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const CustomersPage = lazy(() => import('../views/pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const SuppliersPage = lazy(() => import('../views/pages/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const CashPage = lazy(() => import('../views/pages/CashPage').then(m => ({ default: m.CashPage })));
const ReportsPage = lazy(() => import('../views/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const PromotionsPage = lazy(() => import('../views/pages/PromotionsPage').then(m => ({ default: m.PromotionsPage })));
const LogsPage = lazy(() => import('../views/pages/LogsPage').then(m => ({ default: m.LogsPage })));
const SettingsPage = lazy(() => import('../views/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

function RouteLoader() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function ModuleGuard({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { currentUser } = useStore();
  if (!canAccessModule(currentUser?.role, module)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/**
 * Definición centralizada de todas las rutas de la aplicación (Módulo Routes).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<ModuleGuard module="pos"><POSPage /></ModuleGuard>} />
        <Route path="products" element={<ModuleGuard module="products"><ProductsPage /></ModuleGuard>} />
        <Route path="inventory" element={<ModuleGuard module="inventory"><InventoryPage /></ModuleGuard>} />
        <Route path="purchases" element={<ModuleGuard module="purchases"><PurchasesPage /></ModuleGuard>} />
        <Route path="customers" element={<ModuleGuard module="customers"><CustomersPage /></ModuleGuard>} />
        <Route path="suppliers" element={<ModuleGuard module="suppliers"><SuppliersPage /></ModuleGuard>} />
        <Route path="cash" element={<ModuleGuard module="cash"><CashPage /></ModuleGuard>} />
        <Route path="reports" element={<ModuleGuard module="reports"><ReportsPage /></ModuleGuard>} />
        <Route path="promotions" element={<ModuleGuard module="promotions"><PromotionsPage /></ModuleGuard>} />
        <Route path="logs" element={<ModuleGuard module="logs"><LogsPage /></ModuleGuard>} />
        <Route path="settings" element={<ModuleGuard module="settings"><SettingsPage /></ModuleGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

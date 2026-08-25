import { useState, useMemo } from 'react';
import { Shield, Search, Download, User, DollarSign, TrendingUp, TrendingDown, Tag, ArrowRight } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { Button } from '@/views/components/ui/Button';
import { Input } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, formatDateTime, exportToExcel, cn } from '@/lib/utils';
import type { ActivityLog, PriceCostAuditLog } from '@/models/types';

export function LogsPage() {
  const { db } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;

  const [activeTab, setActiveTab] = useState<'activity' | 'price_cost'>('activity');
  const [search, setSearch] = useState('');

  // Logs de actividad general
  const logs = useMemo(() => {
    return [...(db.logs || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [db.logs]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q)
    );
  }, [logs, search]);

  // Logs de auditoría de precios y costos
  const priceCostLogs = useMemo(() => {
    return [...(db.priceCostLogs || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [db.priceCostLogs]);

  const filteredPriceCostLogs = useMemo(() => {
    if (!search.trim()) return priceCostLogs;
    const q = search.toLowerCase();
    return priceCostLogs.filter(
      (pcl) =>
        pcl.productName.toLowerCase().includes(q) ||
        pcl.sku.toLowerCase().includes(q) ||
        pcl.userName.toLowerCase().includes(q)
    );
  }, [priceCostLogs, search]);

  // Exportar Bitácora General
  const handleExportActivityLogs = () => {
    if (filteredLogs.length === 0) {
      toast.warning('Sin registros', 'No hay datos en la bitácora para exportar');
      return;
    }
    const headers = ['ID Registro', 'Fecha y Hora', 'Acción Realizada', 'Detalle de la Actividad', 'Usuario'];
    const rows = filteredLogs.map((l) => [
      l.id,
      formatDateTime(l.createdAt),
      l.action,
      l.detail,
      l.userName,
    ]);

    const filename = `bitacora_actividad_${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportToExcel(filename, headers, rows, 'Bitacora_Actividad');
    toast.success('Bitácora exportada', 'El archivo de Excel (.xlsx) se descargó correctamente');
  };

  // Exportar Auditoría de Precios y Costos
  const handleExportPriceCostLogs = () => {
    if (filteredPriceCostLogs.length === 0) {
      toast.warning('Sin registros', 'No hay datos en la auditoría de precios para exportar');
      return;
    }
    const headers = [
      'ID Registro',
      'Fecha y Hora',
      'Producto',
      'SKU',
      'Precio Anterior',
      'Precio Nuevo',
      'Variación Precio $',
      'Costo Anterior',
      'Costo Nuevo',
      'Variación Costo $',
      'Margen Anterior %',
      'Margen Nuevo %',
      'Usuario Responsable',
    ];
    const rows = filteredPriceCostLogs.map((pcl) => {
      const priceDiff = pcl.newPrice - pcl.oldPrice;
      const costDiff = pcl.newCost - pcl.oldCost;
      const oldMargin = pcl.oldPrice > 0 ? ((pcl.oldPrice - pcl.oldCost) / pcl.oldPrice) * 100 : 0;
      const newMargin = pcl.newPrice > 0 ? ((pcl.newPrice - pcl.newCost) / pcl.newPrice) * 100 : 0;

      return [
        pcl.id,
        formatDateTime(pcl.createdAt),
        pcl.productName,
        pcl.sku,
        pcl.oldPrice,
        pcl.newPrice,
        priceDiff,
        pcl.oldCost,
        pcl.newCost,
        costDiff,
        `${oldMargin.toFixed(1)}%`,
        `${newMargin.toFixed(1)}%`,
        pcl.userName,
      ];
    });

    const filename = `auditoria_precios_costos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportToExcel(filename, headers, rows, 'Auditoria_Precios_Costos');
    toast.success('Auditoría exportada', 'El reporte de auditoría de precios (.xlsx) se descargó correctamente');
  };

  const activityColumns: Column<ActivityLog>[] = [
    {
      key: 'createdAt',
      header: 'Fecha y Hora',
      render: (l: ActivityLog) => (
        <span className="text-xs text-muted font-medium font-mono whitespace-nowrap">
          {formatDateTime(l.createdAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Acción',
      render: (l: ActivityLog) => (
        <Badge variant="info" className="font-semibold whitespace-nowrap">
          {l.action}
        </Badge>
      ),
    },
    {
      key: 'detail',
      header: 'Detalle / Descripción',
      render: (l: ActivityLog) => (
        <p className="text-sm text-text max-w-md line-clamp-2" title={l.detail}>
          {l.detail}
        </p>
      ),
    },
    {
      key: 'userName',
      header: 'Usuario',
      render: (l: ActivityLog) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-text">
          <User className="h-3.5 w-3.5 text-primary" />
          <span>{l.userName}</span>
        </div>
      ),
    },
  ];

  const priceCostColumns: Column<PriceCostAuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Fecha y Hora',
      render: (pcl) => (
        <span className="text-xs text-muted font-medium font-mono whitespace-nowrap">
          {formatDateTime(pcl.createdAt)}
        </span>
      ),
    },
    {
      key: 'productName',
      header: 'Producto / SKU',
      render: (pcl) => (
        <div>
          <span className="font-semibold text-text block">{pcl.productName}</span>
          <span className="text-[11px] text-muted font-mono">{pcl.sku}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio Venta',
      align: 'right',
      render: (pcl) => {
        const priceDiff = pcl.newPrice - pcl.oldPrice;
        const percentChange = pcl.oldPrice > 0 ? (priceDiff / pcl.oldPrice) * 100 : 0;
        return (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs">
              <span className="line-through text-muted">{formatCurrency(pcl.oldPrice, sym)}</span>
              <ArrowRight className="h-3 w-3 text-muted" />
              <span className="font-bold text-text">{formatCurrency(pcl.newPrice, sym)}</span>
            </div>
            {priceDiff !== 0 && (
              <span className={cn('text-[10px] font-bold inline-flex items-center gap-0.5 mt-0.5', priceDiff > 0 ? 'text-emerald-500' : 'text-rose-500')}>
                {priceDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {priceDiff > 0 ? '+' : ''}{percentChange.toFixed(1)}% ({formatCurrency(priceDiff, sym)})
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'cost',
      header: 'Costo Compra',
      align: 'right',
      render: (pcl) => {
        const costDiff = pcl.newCost - pcl.oldCost;
        const percentChange = pcl.oldCost > 0 ? (costDiff / pcl.oldCost) * 100 : 0;
        return (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs">
              <span className="line-through text-muted">{formatCurrency(pcl.oldCost, sym)}</span>
              <ArrowRight className="h-3 w-3 text-muted" />
              <span className="font-semibold text-text">{formatCurrency(pcl.newCost, sym)}</span>
            </div>
            {costDiff !== 0 && (
              <span className={cn('text-[10px] font-medium inline-flex items-center gap-0.5 mt-0.5', costDiff > 0 ? 'text-amber-500' : 'text-info')}>
                {costDiff > 0 ? '+' : ''}{percentChange.toFixed(1)}% ({formatCurrency(costDiff, sym)})
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'margin',
      header: 'Margen Resultante',
      align: 'center',
      render: (pcl) => {
        const oldMargin = pcl.oldPrice > 0 ? ((pcl.oldPrice - pcl.oldCost) / pcl.oldPrice) * 100 : 0;
        const newMargin = pcl.newPrice > 0 ? ((pcl.newPrice - pcl.newCost) / pcl.newPrice) * 100 : 0;
        return (
          <div className="text-center">
            <span className="text-xs font-bold text-primary">{newMargin.toFixed(1)}%</span>
            <span className="text-[10px] text-muted block">(Antes: {oldMargin.toFixed(1)}%)</span>
          </div>
        );
      },
    },
    {
      key: 'userName',
      header: 'Responsable',
      render: (pcl) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <User className="h-3.5 w-3.5 text-primary" />
          <span>{pcl.userName}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Bitácora & Auditoría' }]} />

      <PageHeader
        title="Bitácora & Auditoría del Sistema"
        description="Histórico inalterable de operaciones, seguridad y auditoría de precios/costos"
        icon={<Shield className="h-5 w-5 text-primary" />}
        actions={
          <Button
            onClick={activeTab === 'activity' ? handleExportActivityLogs : handleExportPriceCostLogs}
            className="shadow-sm"
          >
            <Download className="h-4 w-4" /> Exportar {activeTab === 'activity' ? 'Bitácora' : 'Auditoría'}
          </Button>
        }
      />

      {/* Pestañas de Navegación */}
      <div className="flex border-b border-border gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={cn(
            'py-2.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2',
            activeTab === 'activity'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          )}
        >
          <Shield className="h-4 w-4" />
          Bitácora General ({filteredLogs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('price_cost')}
          className={cn(
            'py-2.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2',
            activeTab === 'price_cost'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          )}
        >
          <DollarSign className="h-4 w-4" />
          Auditoría de Precios y Costos ({filteredPriceCostLogs.length})
        </button>
      </div>

      {activeTab === 'activity' ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por acción, detalle o usuario..."
                className="pl-10"
              />
            </div>

            <DataTable<ActivityLog>
              data={filteredLogs}
              columns={activityColumns}
              rowKey={(l) => l.id}
              empty={
                <EmptyState
                  icon={<Shield className="h-10 w-10 text-muted" />}
                  title="Sin registros de actividad"
                  description="Las acciones de los usuarios aparecerán registradas aquí automáticamente"
                />
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Tarjetas KPI de Auditoría de Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted">Total Modificaciones de Precio</p>
                  <p className="font-display font-bold text-lg text-text">{priceCostLogs.length} cambios</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted font-medium">Incrementos de Precio</p>
                  <p className="font-display font-bold text-lg text-emerald-500">
                    {priceCostLogs.filter((p) => p.newPrice > p.oldPrice).length} registros
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted font-medium">Ajustes de Costo Compra</p>
                  <p className="font-display font-bold text-lg text-amber-500">
                    {priceCostLogs.filter((p) => p.newCost !== p.oldCost).length} registros
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por producto, SKU o usuario responsable..."
                  className="pl-10"
                />
              </div>

              <DataTable<PriceCostAuditLog>
                data={filteredPriceCostLogs}
                columns={priceCostColumns}
                rowKey={(pcl) => pcl.id}
                empty={
                  <EmptyState
                    icon={<DollarSign className="h-10 w-10 text-muted" />}
                    title="Sin historial de modificaciones de precio"
                    description="Cualquier cambio de precio o costo realizado a un producto quedará registrado aquí automáticamente con la información del responsable y fecha"
                  />
                }
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

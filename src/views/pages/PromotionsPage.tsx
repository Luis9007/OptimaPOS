import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, Search, Pencil, Trash2, CheckCircle2, XCircle, Percent, Gift, DollarSign, Calendar, Layers, Power,
} from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Select, CurrencyInput, NumberInput } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, formatDateTime, generateSequentialId, cn } from '@/lib/utils';
import type { Promotion } from '@/models/types';

const emptyPromo = (existingPromos: Promotion[] = []): Promotion => ({
  id: generateSequentialId('promo', existingPromos.map((p) => p.id)),
  name: '',
  code: '',
  type: 'percentage',
  target: 'all',
  value: 10,
  minPurchaseAmount: 0,
  active: true,
  usageCount: 0,
  createdAt: new Date().toISOString(),
});

export function PromotionsPage() {
  const { db, currentUser, upsertPromotion, deletePromotion, togglePromotionActive } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;

  const canCreate = canPerformAction(currentUser?.role, 'promotion.create');
  const canEdit = canPerformAction(currentUser?.role, 'promotion.edit');
  const canDelete = canPerformAction(currentUser?.role, 'promotion.delete');

  const promotions = useMemo(() => db.promotions || [], [db.promotions]);
  const products = useMemo(() => db.products || [], [db.products]);
  const categories = useMemo(() => db.categories || [], [db.categories]);
  const brands = useMemo(() => db.brands || [], [db.brands]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState<Promotion>(() => emptyPromo(promotions));

  // Métricas
  const activeCount = useMemo(() => promotions.filter((p) => p.active).length, [promotions]);
  const buyXGetYCount = useMemo(() => promotions.filter((p) => p.type === 'buy_x_get_y' && p.active).length, [promotions]);
  const couponCount = useMemo(() => promotions.filter((p) => Boolean(p.code) && p.active).length, [promotions]);
  const totalUsages = useMemo(() => promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0), [promotions]);

  // Filtrado de promociones
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase()));
      const matchType = typeFilter === 'todos' || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [promotions, search, typeFilter]);

  const handleOpenCreate = () => {
    setForm(emptyPromo(promotions));
    setEditingPromo(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Promotion) => {
    setForm({ ...p });
    setEditingPromo(p);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre de la promoción es obligatorio');
      return;
    }
    if (form.value <= 0) {
      toast.error('El valor del descuento debe ser mayor a 0');
      return;
    }

    const promoToSave: Promotion = {
      ...form,
      name: form.name.trim(),
      code: form.code ? form.code.trim().toUpperCase() : undefined,
    };

    upsertPromotion(promoToSave);
    toast.success(editingPromo ? 'Promoción actualizada con éxito' : 'Promoción creada con éxito');
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingPromo) return;
    deletePromotion(deletingPromo.id);
    toast.success('Promoción eliminada');
    setDeletingPromo(null);
  };

  const columns: Column<Promotion>[] = [
    {
      key: 'name',
      header: 'Promoción',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {p.type === 'buy_x_get_y' ? <Gift className="h-4 w-4" /> : p.type === 'percentage' ? <Percent className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-semibold text-text text-sm leading-snug">{p.name}</p>
            {p.code && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded mt-0.5">
                🏷️ {p.code}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo de Oferta',
      render: (p) => (
        <Badge variant={p.type === 'buy_x_get_y' ? 'primary' : p.type === 'percentage' ? 'accent' : 'info'}>
          {p.type === 'buy_x_get_y' ? 'Regla 2x1 / Volumétrica' : p.type === 'percentage' ? 'Porcentual (%)' : 'Monto Fijo ($)'}
        </Badge>
      ),
    },
    {
      key: 'target',
      header: 'Alcance / Destino',
      render: (p) => {
        if (p.target === 'all') return <span className="text-xs text-muted font-medium">Todo el catálogo</span>;
        if (p.target === 'product') {
          const prod = products.find((pr) => pr.id === p.targetId);
          return <span className="text-xs text-text font-medium truncate max-w-[150px] inline-block">📦 {prod?.name || 'Producto'}</span>;
        }
        if (p.target === 'category') {
          const cat = categories.find((c) => c.id === p.targetId);
          return <span className="text-xs text-text font-medium">📁 {cat?.name || 'Categoría'}</span>;
        }
        if (p.target === 'brand') {
          const br = brands.find((b) => b.id === p.targetId);
          return <span className="text-xs text-text font-medium">🏷️ {br?.name || 'Marca'}</span>;
        }
        return null;
      },
    },
    {
      key: 'value',
      header: 'Valor Oferta',
      render: (p) => (
        <span className="font-bold text-emerald-500 text-sm">
          {p.type === 'buy_x_get_y' ? `${p.value}x1 (Paga 1)` : p.type === 'percentage' ? `${p.value}% OFF` : `-${formatCurrency(p.value, sym)}`}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Estado',
      render: (p) => (
        <button
          onClick={() => {
            togglePromotionActive(p.id);
            toast.info(`Promoción "${p.name}" ${!p.active ? 'activada' : 'desactivada'}`);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border',
            p.active
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-surface-2 text-muted border-border hover:bg-surface-3'
          )}
        >
          <Power className="h-3 w-3" />
          {p.active ? 'Activa' : 'Inactiva'}
        </button>
      ),
    },
    {
      key: 'usageCount',
      header: 'Canjes',
      render: (p) => <span className="text-xs font-medium text-muted">{p.usageCount || 0} veces</span>,
    },
    {
      key: 'id',
      header: 'Acciones',
      render: (p) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)} title="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setDeletingPromo(p)} className="text-danger hover:text-danger" title="Eliminar">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Promociones y Cupones' }]} />

      <PageHeader
        title="Promociones y Cupones de Descuento"
        description="Configura ofertas automáticas 2x1, descuentos por categoría y códigos promocionales para la caja POS."
        actions={
          canCreate && (
            <Button onClick={handleOpenCreate} className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              Nueva Promoción
            </Button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Promociones Activas</p>
            <p className="text-2xl font-bold text-text mt-0.5">{activeCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Reglas 2x1 Activas</p>
            <p className="text-2xl font-bold text-text mt-0.5">{buyXGetYCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Cupones de Venta</p>
            <p className="text-2xl font-bold text-text mt-0.5">{couponCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-info/10 text-info flex items-center justify-center shrink-0">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Total Canjes</p>
            <p className="text-2xl font-bold text-text mt-0.5">{totalUsages}</p>
          </div>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre o cupón..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="todos">Todos los tipos de oferta</option>
              <option value="buy_x_get_y">Reglas 2x1 / Volumétricas</option>
              <option value="percentage">Porcentual (%)</option>
              <option value="fixed">Monto Fijo ($)</option>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPromotions}
          rowKey={(row) => row.id}
          empty={<EmptyState icon={<Tag className="h-10 w-10" />} title="Sin promociones" description="No se encontraron promociones registradas." />}
        />
      </Card>

      {/* Modal Modal Formulario */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPromo ? 'Editar Promoción' : 'Nueva Promoción u Oferta'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre de la Promoción *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej. 2x1 en Coca-Cola o 15% OFF en Lácteos"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">Tipo de Oferta *</label>
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Promotion['type'] })}
              >
                <option value="percentage">Porcentual (% de Descuento)</option>
                <option value="buy_x_get_y">2x1 / Volumétrica (Lleva X Paga 1)</option>
                <option value="fixed">Monto Fijo (-$ Descuento directo)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">Alcance / Objetivo *</label>
              <Select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value as Promotion['target'], targetId: undefined })}
              >
                <option value="all">Todo el Catálogo</option>
                <option value="product">Producto Específico</option>
                <option value="category">Categoría Específica</option>
                <option value="brand">Marca Específica</option>
              </Select>
            </div>
          </div>

          {/* Selector dinámico según target */}
          {form.target === 'product' && (
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">Seleccionar Producto *</label>
              <Select
                value={form.targetId || ''}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
              >
                <option value="">-- Elige un producto --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {form.target === 'category' && (
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">Seleccionar Categoría *</label>
              <Select
                value={form.targetId || ''}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
              >
                <option value="">-- Elige una categoría --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {form.target === 'brand' && (
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">Seleccionar Marca *</label>
              <Select
                value={form.targetId || ''}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
              >
                <option value="">-- Elige una marca --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">
                {form.type === 'buy_x_get_y' ? 'Cantidad para Oferta (Ej: 2 para 2x1)' : form.type === 'percentage' ? 'Porcentaje %' : 'Monto Fijo ($)'} *
              </label>
              <NumberInput
                value={form.value}
                onChange={(v) => setForm({ ...form, value: v })}
                min={1}
                step={form.type === 'percentage' ? 1 : 100}
              />
            </div>

            <Input
              label="Código de Cupón (Opcional)"
              value={form.code || ''}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="Ej. PROMO10, BIENVENIDA"
            />
          </div>

          <CurrencyInput
            label="Monto Mínimo de Compra Requerido (Opcional)"
            value={form.minPurchaseAmount || 0}
            onChange={(v) => setForm({ ...form, minPurchaseAmount: v })}
            currencySymbol={sym}
          />

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input
              type="checkbox"
              id="promo-active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="promo-active" className="text-sm font-medium text-text cursor-pointer">
              Promoción activa en el Punto de Venta
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingPromo ? 'Guardar Cambios' : 'Crear Promoción'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <Dialog
        open={Boolean(deletingPromo)}
        onClose={() => setDeletingPromo(null)}
        title="Confirmar Eliminación"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            ¿Estás seguro de que deseas eliminar la promoción <strong>"{deletingPromo?.name}"</strong>?
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingPromo(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

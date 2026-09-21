import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, Receipt, TrendingUp,
  ChevronDown, ChevronUp, User, DollarSign, Package, Truck, Layers, FileText, Calendar, UserCheck, Eye, Printer, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Textarea } from '@/views/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import type { CashSession, CashMovementType } from '@/models/types';

export function CashPage() {
  const { db, currentUser, activeCashSession, openCash, closeCash, addCashMovement } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;
  const canOpen = canPerformAction(currentUser?.role, 'cash.open');
  const canClose = canPerformAction(currentUser?.role, 'cash.close');
  const canMove = canPerformAction(currentUser?.role, 'cash.movement');

  const [openAmount, setOpenAmount] = useState('50000');
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [closeAmount, setCloseAmount] = useState('');
  const [showMovement, setShowMovement] = useState(false);
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementConcept, setMovementConcept] = useState('');
  const [expandedMovIds, setExpandedMovIds] = useState<Record<string, boolean>>({});

  // Cierre de caja pasado seleccionado para auditoría
  const [selectedPastSession, setSelectedPastSession] = useState<CashSession | null>(null);

  const sessionMovements = useMemo(() => activeCashSession?.movements ?? [], [activeCashSession]);

  const cashSales = sessionMovements.filter((m) => m.type === 'venta' && m.amount > 0).reduce((s, m) => s + m.amount, 0);
  const cashAbonos = sessionMovements.filter((m) => m.type === 'abono' && m.amount > 0).reduce((s, m) => s + m.amount, 0);
  const ingresos = sessionMovements.filter((m) => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const egresos = sessionMovements.filter((m) => m.type === 'egreso').reduce((s, m) => s + m.amount, 0);
  const expectedBalance = (activeCashSession?.openingAmount ?? 0) + cashSales + cashAbonos + ingresos - egresos;

  const pastSessionCalculations = useMemo(() => {
    if (!selectedPastSession) return null;
    const movs = selectedPastSession.movements || [];
    const sales = movs.filter((m) => m.type === 'venta' && m.amount > 0).reduce((acc, m) => acc + m.amount, 0);
    const abonos = movs.filter((m) => m.type === 'abono' && m.amount > 0).reduce((acc, m) => acc + m.amount, 0);
    const ingresos = movs.filter((m) => m.type === 'ingreso').reduce((acc, m) => acc + m.amount, 0);
    const egresos = movs.filter((m) => m.type === 'egreso').reduce((acc, m) => acc + m.amount, 0);
    const expected = selectedPastSession.openingAmount + sales + abonos + ingresos - egresos;
    const actual = selectedPastSession.closingAmount !== null ? selectedPastSession.closingAmount : expected;
    const diff = selectedPastSession.closingAmount !== null ? actual - expected : 0;

    return {
      sales,
      abonos,
      ingresos,
      egresos,
      expected,
      actual,
      diff,
      movs,
    };
  }, [selectedPastSession]);

  const toggleExpand = (id: string) => {
    setExpandedMovIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpen = () => {
    const amt = parseFloat(openAmount) || 0;
    openCash(amt);
    toast.success('Caja abierta', `Apertura: ${formatCurrency(amt, sym)}`);
    setShowOpen(false);
  };

  const handleClose = () => {
    const amt = parseFloat(closeAmount) || 0;
    closeCash(amt);
    toast.success('Caja cerrada', `Cierre: ${formatCurrency(amt, sym)}`);
    setShowClose(false);
    setCloseAmount('');
  };

  const handleMovement = () => {
    const amt = parseFloat(movementAmount) || 0;
    if (amt <= 0) { toast.error('Monto inválido'); return; }
    if (!movementConcept) { toast.error('Concepto requerido'); return; }
    addCashMovement({ type: movementType, amount: amt, concept: movementConcept });
    toast.success(movementType === 'ingreso' ? 'Ingreso registrado' : 'Egreso registrado', formatCurrency(amt, sym));
    setShowMovement(false);
    setMovementAmount(''); setMovementConcept('');
  };

  const getMovementTypeBadge = (type: CashMovementType) => {
    switch (type) {
      case 'apertura': return { label: 'Apertura', icon: Unlock, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'cierre': return { label: 'Cierre', icon: Lock, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'venta': return { label: 'Venta', icon: Receipt, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'abono': return { label: 'Abono Cartera', icon: DollarSign, color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' };
      case 'cliente': return { label: 'Nuevo Cliente', icon: User, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' };
      case 'producto': return { label: 'Producto', icon: Package, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'inventario': return { label: 'Inventario', icon: Layers, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
      case 'compra': return { label: 'Compra Prov.', icon: Truck, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' };
      case 'ingreso': return { label: 'Ingreso Manual', icon: ArrowDownCircle, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'egreso': return { label: 'Egreso Manual', icon: ArrowUpCircle, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
      default: return { label: type, icon: FileText, color: 'bg-surface-2 text-text' };
    }
  };

  const sessionColumns: Column<CashSession>[] = [
    { key: 'openedAt', header: 'Apertura', render: (s) => <span className="text-muted font-medium">{formatDateTime(s.openedAt)}</span> },
    { key: 'openingAmount', header: 'Monto inicial', align: 'right', render: (s) => <span className="text-text font-semibold">{formatCurrency(s.openingAmount, sym)}</span> },
    { key: 'closingAmount', header: 'Monto cierre', align: 'right', render: (s) => s.closingAmount !== null ? <span className="text-emerald-500 font-bold">{formatCurrency(s.closingAmount, sym)}</span> : <span className="text-muted">—</span> },
    { key: 'status', header: 'Estado', align: 'center', render: (s) => <Badge variant={s.status === 'abierta' ? 'success' : 'default'}>{s.status}</Badge> },
    { key: 'userName', header: 'Responsable', render: (s) => <span className="text-muted">{s.userName}</span> },
    { key: 'closedAt', header: 'Cierre', render: (s) => s.closedAt ? <span className="text-muted">{formatDateTime(s.closedAt)}</span> : <span className="text-muted">—</span> },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (s) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedPastSession(s)}
          className="gap-1 text-xs h-7 px-2.5"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver Arqueo
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Caja' }]} className="mb-3" />
      <PageHeader
        title="Caja & Movimientos de Sesión"
        description={activeCashSession ? 'Sesión de caja activa — Auditoría en tiempo real' : 'No hay sesión activa de caja'}
        icon={<Wallet className="h-5 w-5" />}
        actions={
          activeCashSession ? (
            <>
              {canMove && <Button variant="secondary" onClick={() => setShowMovement(true)}><ArrowDownCircle className="h-4 w-4" /> Movimiento Manual</Button>}
              {canClose && <Button variant="danger" onClick={() => { setCloseAmount(String(expectedBalance.toFixed(2))); setShowClose(true); }}><Lock className="h-4 w-4" /> Cerrar caja</Button>}
            </>
          ) : (
            canOpen ? <Button onClick={() => setShowOpen(true)}><Unlock className="h-4 w-4" /> Abrir caja</Button> : undefined
          )
        }
      />

      {activeCashSession ? (
        <>
          {/* Active session stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Apertura', value: formatCurrency(activeCashSession.openingAmount, sym), icon: Unlock, color: 'bg-info' },
              { label: 'Ventas en efectivo', value: formatCurrency(cashSales, sym), icon: Receipt, color: 'bg-primary' },
              { label: 'Abonos en efectivo', value: formatCurrency(cashAbonos, sym), icon: DollarSign, color: 'bg-teal-600' },
              { label: 'Ingresos / Egresos', value: `${formatCurrency(ingresos, sym)} / -${formatCurrency(egresos, sym)}`, icon: TrendingUp, color: 'bg-purple-600' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', s.color)}><s.icon className="h-5 w-5 text-white" /></div>
                  <div><p className="text-xs text-muted">{s.label}</p><p className="font-display font-bold text-base sm:text-lg text-text truncate">{s.value}</p></div>
                </CardContent></Card>
              </motion.div>
            ))}
          </div>

          {/* Expected balance summary */}
          <Card className="mb-5 border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><TrendingUp className="h-6 w-6 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted font-medium">Saldo esperado en efectivo (Efectivo en Caja)</p>
                  <p className="font-display font-bold text-2xl text-primary">{formatCurrency(expectedBalance, sym)}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <p className="text-muted">Total de eventos en sesión</p>
                  <p className="font-bold text-text text-sm">{sessionMovements.length} movimientos</p>
                </div>
                <div className="text-right border-l border-border pl-4">
                  <p className="text-muted">Sesión iniciada</p>
                  <p className="font-medium text-text">{formatDateTime(activeCashSession.openedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movements Expandable Accordion List */}
          <Card className="mb-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
              <div>
                <CardTitle className="text-base">Movimientos y Auditoría de la Sesión Activa</CardTitle>
                <p className="text-xs text-muted mt-0.5">Toca cualquier registro para ver el desglose y detalle completo de la acción</p>
              </div>
              <Badge variant="primary">{sessionMovements.length} registro{sessionMovements.length !== 1 ? 's' : ''}</Badge>
            </CardHeader>
            <CardContent className="p-3">
              {sessionMovements.length === 0 ? (
                <EmptyState icon={<Wallet className="h-10 w-10" />} title="Sin movimientos registrados" description="Las ventas, clientes, abonos e inventario aparecerán aquí automáticamente." />
              ) : (
                <div className="space-y-2.5">
                  {sessionMovements.map((mov) => {
                    const isExpanded = Boolean(expandedMovIds[mov.id]);
                    const badge = getMovementTypeBadge(mov.type);
                    const IconComp = badge.icon;

                    return (
                      <div
                        key={mov.id}
                        className="rounded-xl border border-border bg-surface overflow-hidden transition-all shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpand(mov.id)}
                          className="w-full p-3 flex items-center justify-between bg-surface-2/40 hover:bg-surface-2 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", badge.color)}>
                              <IconComp className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-semibold border", badge.color)}>
                                  {badge.label}
                                </span>
                                <span className="text-xs text-muted flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {formatDateTime(mov.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-text mt-0.5 truncate">{mov.concept}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <div className="text-right">
                              {mov.amount > 0 ? (
                                <p className={cn("font-display font-bold text-sm", mov.type === 'egreso' ? 'text-danger' : 'text-success')}>
                                  {mov.type === 'egreso' ? '-' : '+'}{formatCurrency(mov.amount, sym)}
                                </p>
                              ) : (
                                <p className="text-xs font-medium text-muted">Sin flujo caja</p>
                              )}
                              <p className="text-[11px] text-muted flex items-center justify-end gap-1">
                                <UserCheck className="h-3 w-3" /> {mov.userName}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted shrink-0" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-border p-4 bg-surface"
                            >
                              {mov.details ? (
                                <div className="space-y-3">
                                  {mov.type === 'venta' && (
                                    <div className="space-y-3 text-xs">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-surface-2 border border-border">
                                        <div><span className="text-muted">Folio:</span> <strong className="text-text">{mov.details.reference}</strong></div>
                                        <div><span className="text-muted">Cliente:</span> <strong className="text-text">{mov.details.customerName}</strong></div>
                                        <div><span className="text-muted">Método Pago:</span> <strong className="text-text capitalize">{mov.details.paymentMethod}</strong></div>
                                        <div><span className="text-muted">Total:</span> <strong className="text-primary font-bold">{formatCurrency(mov.details.total, sym)}</strong></div>
                                      </div>

                                      {mov.details.items && Array.isArray(mov.details.items) && (
                                        <div className="overflow-x-auto rounded-lg border border-border">
                                          <table className="w-full text-left text-xs">
                                            <thead className="bg-surface-2 text-muted font-semibold">
                                              <tr>
                                                <th className="p-2">Producto</th>
                                                <th className="p-2 text-center">Cant.</th>
                                                <th className="p-2 text-right">Precio Unit.</th>
                                                <th className="p-2 text-right">Subtotal</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                              {mov.details.items.map((it: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-surface-2/30">
                                                  <td className="p-2 font-medium text-text">{it.productName}</td>
                                                  <td className="p-2 text-center text-text">{it.quantity}</td>
                                                  <td className="p-2 text-right text-muted">{formatCurrency(it.price, sym)}</td>
                                                  <td className="p-2 text-right font-semibold text-text">{formatCurrency(it.subtotal, sym)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {mov.type === 'cliente' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-lg bg-surface-2 border border-border">
                                      <div><span className="text-muted">Nombre:</span> <strong className="text-text block">{mov.details.name}</strong></div>
                                      <div><span className="text-muted">Documento:</span> <span className="text-text block">{mov.details.document || '—'}</span></div>
                                      <div><span className="text-muted">Teléfono:</span> <span className="text-text block">{mov.details.phone || '—'}</span></div>
                                      <div><span className="text-muted">Correo:</span> <span className="text-text block truncate">{mov.details.email || '—'}</span></div>
                                    </div>
                                  )}

                                  {mov.type === 'abono' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-lg bg-surface-2 border border-border">
                                      <div><span className="text-muted">Cliente:</span> <strong className="text-text block">{mov.details.customerName}</strong></div>
                                      <div><span className="text-muted">Monto Abonado:</span> <strong className="text-success block">{formatCurrency(mov.details.amount, sym)}</strong></div>
                                      <div><span className="text-muted">Forma de Pago:</span> <span className="text-text capitalize block">{mov.details.paymentMethod}</span></div>
                                      <div><span className="text-muted">Nuevo Saldo:</span> <span className="text-text font-bold block">{formatCurrency(mov.details.newBalance, sym)}</span></div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-muted flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-border">
                                  <span>ID Movimiento: {mov.id}</span>
                                  <span>Referencia: {mov.reference || '—'}</span>
                                  <span>Atendido por: <strong className="text-text">{mov.userName}</strong></span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState icon={<Wallet className="h-10 w-10" />} title="Caja cerrada" description="Abre una sesión de caja para registrar ventas en efectivo y auditar movimientos" action={canOpen ? <Button onClick={() => setShowOpen(true)}><Unlock className="h-4 w-4" /> Abrir caja</Button> : undefined} />
          </CardContent>
        </Card>
      )}

      {/* Tabla del Historial de Sesiones */}
      <Card className="mt-5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <div>
            <CardTitle className="text-base">Historial de sesiones de caja</CardTitle>
            <p className="text-xs text-muted mt-0.5">Haz clic en "Ver Arqueo" en cualquier sesión para auditar la diferencia de saldo e historial de eventos</p>
          </div>
          <Badge variant="primary">{db.cashSessions.length} sesion{db.cashSessions.length !== 1 ? 'es' : ''}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {db.cashSessions.length === 0 ? (
            <EmptyState title="Sin historial de sesiones" />
          ) : (
            <DataTable columns={sessionColumns} data={db.cashSessions} rowKey={(s) => s.id} />
          )}
        </CardContent>
      </Card>

      {/* Modal Modal Arqueo y Cierre Pasado */}
      <Dialog
        open={Boolean(selectedPastSession)}
        onClose={() => setSelectedPastSession(null)}
        title={`Reporte de Arqueo y Cierre de Caja (Sesión #${selectedPastSession?.id.slice(-6).toUpperCase() || ''})`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir Comprobante de Arqueo
            </Button>
            <Button onClick={() => setSelectedPastSession(null)}>
              Cerrar Vista
            </Button>
          </div>
        }
      >
        {selectedPastSession && pastSessionCalculations && (
          <div className="space-y-5 text-text">
            {/* Header Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-2 border border-border text-xs">
              <div>
                <span className="text-muted block font-medium">Responsable Turno</span>
                <span className="font-bold text-text">{selectedPastSession.userName}</span>
              </div>
              <div>
                <span className="text-muted block font-medium">Estado Sesión</span>
                <Badge variant={selectedPastSession.status === 'abierta' ? 'success' : 'default'} className="mt-0.5">
                  {selectedPastSession.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-muted block font-medium">Apertura</span>
                <span className="font-medium text-text">{formatDateTime(selectedPastSession.openedAt)}</span>
              </div>
              <div>
                <span className="text-muted block font-medium">Cierre</span>
                <span className="font-medium text-text">
                  {selectedPastSession.closedAt ? formatDateTime(selectedPastSession.closedAt) : 'Sesión en curso'}
                </span>
              </div>
            </div>

            {/* Financial breakdown stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-surface-2/40">
                <span className="text-muted block">Monto Inicial</span>
                <span className="text-sm font-bold text-text">{formatCurrency(selectedPastSession.openingAmount, sym)}</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-2/40">
                <span className="text-muted block">Ventas Efectivo</span>
                <span className="text-sm font-bold text-emerald-500">+{formatCurrency(pastSessionCalculations.sales, sym)}</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-2/40">
                <span className="text-muted block">Abonos Efectivo</span>
                <span className="text-sm font-bold text-teal-500">+{formatCurrency(pastSessionCalculations.abonos, sym)}</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-2/40">
                <span className="text-muted block">Ingresos / Egresos</span>
                <span className="text-sm font-bold text-purple-500">
                  +{formatCurrency(pastSessionCalculations.ingresos, sym)} / -{formatCurrency(pastSessionCalculations.egresos, sym)}
                </span>
              </div>
            </div>

            {/* Closing Balance Comparison & Discrepancy */}
            <div className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <span className="text-xs text-muted font-medium block">Efectivo Esperado</span>
                  <span className="font-display font-bold text-lg text-primary">
                    {formatCurrency(pastSessionCalculations.expected, sym)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted font-medium block">Efectivo Físico Contado</span>
                  <span className="font-display font-bold text-lg text-text">
                    {selectedPastSession.closingAmount !== null
                      ? formatCurrency(selectedPastSession.closingAmount, sym)
                      : 'Sin cierre'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted font-medium block">Diferencia / Descuadre</span>
                  {selectedPastSession.closingAmount !== null ? (
                    pastSessionCalculations.diff === 0 ? (
                      <span className="font-display font-bold text-lg text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> $0 (Cuadre Exacto)
                      </span>
                    ) : pastSessionCalculations.diff > 0 ? (
                      <span className="font-display font-bold text-lg text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> +{formatCurrency(pastSessionCalculations.diff, sym)} (Sobrante)
                      </span>
                    ) : (
                      <span className="font-display font-bold text-lg text-rose-500 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> {formatCurrency(pastSessionCalculations.diff, sym)} (Faltante)
                      </span>
                    )
                  ) : (
                    <span className="text-muted text-sm">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* List of movements inside selected past session */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text uppercase tracking-wider">
                Auditoría de Eventos de la Sesión ({pastSessionCalculations.movs.length})
              </h4>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-border divide-y divide-border bg-surface text-xs">
                {pastSessionCalculations.movs.length === 0 ? (
                  <div className="p-4 text-center text-muted">Sin movimientos registrados durante esta sesión.</div>
                ) : (
                  pastSessionCalculations.movs.map((mov) => {
                    const badge = getMovementTypeBadge(mov.type);
                    return (
                      <div key={mov.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border', badge.color)}>
                              {badge.label}
                            </span>
                            <span className="text-muted text-[11px]">{formatDateTime(mov.createdAt)}</span>
                          </div>
                          <p className="font-medium text-text mt-0.5 truncate">{mov.concept}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {mov.amount > 0 ? (
                            <span className={cn('font-bold', mov.type === 'egreso' ? 'text-rose-500' : 'text-emerald-500')}>
                              {mov.type === 'egreso' ? '-' : '+'}{formatCurrency(mov.amount, sym)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Open dialog */}
      <Dialog open={showOpen} onClose={() => setShowOpen(false)} title="Abrir caja" size="sm" footer={<><Button variant="outline" onClick={() => setShowOpen(false)}>Cancelar</Button><Button onClick={handleOpen}>Abrir</Button></>}>
        <Input type="number" step="0.01" label="Monto de apertura en efectivo" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} autoFocus />
      </Dialog>

      {/* Close dialog */}
      <Dialog open={showClose} onClose={() => setShowClose(false)} title="Cerrar caja" size="sm" footer={<><Button variant="outline" onClick={() => setShowClose(false)}>Cancelar</Button><Button variant="danger" onClick={handleClose}>Cerrar caja</Button></>}>
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-surface-2 flex justify-between items-center text-sm">
            <span className="text-muted">Saldo esperado en efectivo</span>
            <span className="font-bold text-primary">{formatCurrency(expectedBalance, sym)}</span>
          </div>
          <Input type="number" step="0.01" label="Monto contado físicamente en caja" value={closeAmount} onChange={(e) => setCloseAmount(e.target.value)} autoFocus />
          {closeAmount && (
            <div className={cn('p-3 rounded-xl flex justify-between items-center text-sm', parseFloat(closeAmount) === expectedBalance ? 'bg-success/10' : 'bg-warning/10')}>
              <span className="text-muted">Diferencia</span>
              <span className={cn('font-bold', parseFloat(closeAmount) === expectedBalance ? 'text-success' : 'text-warning')}>{formatCurrency(parseFloat(closeAmount) - expectedBalance, sym)}</span>
            </div>
          )}
        </div>
      </Dialog>

      {/* Movement dialog */}
      <Dialog open={showMovement} onClose={() => setShowMovement(false)} title="Registrar movimiento manual de caja" size="sm" footer={<><Button variant="outline" onClick={() => setShowMovement(false)}>Cancelar</Button><Button onClick={handleMovement}>Registrar</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMovementType('ingreso')} className={cn('p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 justify-center', movementType === 'ingreso' ? 'border-success bg-success/10 text-success' : 'border-border text-muted')}><ArrowDownCircle className="h-4 w-4" /> Ingreso</button>
            <button onClick={() => setMovementType('egreso')} className={cn('p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 justify-center', movementType === 'egreso' ? 'border-danger bg-danger/10 text-danger' : 'border-border text-muted')}><ArrowUpCircle className="h-4 w-4" /> Egreso</button>
          </div>
          <Input type="number" step="0.01" label="Monto" value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} />
          <Textarea label="Concepto u observaciones" value={movementConcept} onChange={(e) => setMovementConcept(e.target.value)} placeholder="Motivo del movimiento..." />
        </div>
      </Dialog>
    </div>
  );
}

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Building2, Palette, Database, Moon, Sun, RotateCcw, Save, Users, Plus, Edit2, Trash2, UserCheck, UserX, Search, Shield, Upload, Image } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { Button } from '@/views/components/ui/Button';
import { Input, Select } from '@/views/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { cn, generateId } from '@/lib/utils';
import { storageService } from '@/services/storageService';

export function SettingsPage() {
  const { db, updateSettings, setTheme, resetData, currentUser, upsertUser, deleteUser } = useStore();
  const toast = useToast();

  const [form, setForm] = useState(db.settings);
  const [showReset, setShowReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Archivo muy grande', 'La imagen no debe superar los 5MB');
      return;
    }

    try {
      const url = await storageService.uploadStoreLogo(file);
      if (url) {
        setForm((prev) => ({ ...prev, logoUrl: url }));
        toast.success('Imagen cargada', `Logotipo "${file.name}" procesado. Haz clic en "Guardar Cambios".`);
      }
    } catch {
      toast.error('Error de lectura', 'No se pudo procesar la imagen seleccionada');
    }
  };

  // User management states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'todos' | Role>('todos');

  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: Role;
    active: boolean;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'cajero',
    active: true,
  });

  const handleSave = () => {
    updateSettings(form);
    toast.success('Configuración guardada', 'Los cambios se aplicaron correctamente');
  };

  const handleReset = () => {
    resetData();
    toast.success('Datos restablecidos', 'El sistema volvió a los datos de demostración');
    setShowReset(false);
  };

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'usuarios', label: 'Usuarios / Cajeros', icon: Users },
    { id: 'apariencia', label: 'Apariencia', icon: Palette },
    { id: 'datos', label: 'Datos', icon: Database },
  ];
  const [tab, setTab] = useState('empresa');

  // User management handlers
  const openNewUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'cajero',
      active: true,
    });
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      active: user.active,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      toast.error('Campos incompletos', 'Por favor llena todos los campos obligatorios');
      return;
    }

    // Check duplicate email
    const exists = db.users.some(
      (u) => u.email.toLowerCase() === userForm.email.toLowerCase() && u.id !== editingUser?.id
    );
    if (exists) {
      toast.error('Correo duplicado', 'Ya existe un usuario con este correo electrónico');
      return;
    }

    const newUser: User = {
      id: editingUser ? editingUser.id : generateId('usr'),
      name: userForm.name.trim(),
      email: userForm.email.trim().toLowerCase(),
      password: userForm.password.trim(),
      role: userForm.role,
      active: userForm.active,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
    };

    upsertUser(newUser);
    toast.success(
      editingUser ? 'Usuario actualizado' : 'Usuario creado',
      `El ${newUser.role} "${newUser.name}" fue guardado correctamente`
    );
    setUserModalOpen(false);
  };

  const handleDeleteUserConfirm = () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id) {
      toast.error('Operación no permitida', 'No puedes eliminar tu propio usuario en uso');
      setDeletingUser(null);
      return;
    }

    deleteUser(deletingUser.id);
    toast.success('Usuario eliminado', `Se eliminó al usuario ${deletingUser.name}`);
    setDeletingUser(null);
  };

  const toggleUserActive = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('Operación no permitida', 'No puedes desactivar tu propio usuario activo');
      return;
    }

    const updated = { ...user, active: !user.active };
    upsertUser(updated);
    toast.success(
      updated.active ? 'Usuario activado' : 'Usuario desactivado',
      `El usuario "${user.name}" ahora está ${updated.active ? 'activo' : 'inactivo'}`
    );
  };

  const filteredUsers = db.users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'todos' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Configuración' }]} className="mb-3" />
      <PageHeader title="Configuración" description="Personaliza tu sistema Optima POS y gestiona el personal" icon={<Settings className="h-5 w-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Tabs sidebar */}
        <div className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                tab === t.id ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {tab === 'empresa' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Datos de la Empresa y Personalización de Marca</CardTitle>
                  <p className="text-xs text-muted mt-1">Configura la información legal y la imagen gráfica de tu comercio</p>
                </div>
                <Button onClick={handleSave}><Save className="h-4 w-4" /> Guardar Cambios</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Store Logo Section */}
                <div className="p-4 rounded-2xl bg-surface-2/60 border border-border/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" /> Logotipo Personalizado de la Tienda
                    </p>
                    <Badge variant="primary" className="text-[11px]">Carga Multiformato</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    Sube una imagen desde tu equipo o ingresa una URL. Formatos aceptados: <strong>PNG, JPG, JPEG, WEBP, SVG, GIF, ICO, BMP</strong> (Máx. 5MB).
                  </p>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif, image/x-icon, image/bmp, image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
                    <div className="relative group h-20 w-20 rounded-2xl bg-surface border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      {form.logoUrl ? (
                        <img 
                          src={form.logoUrl} 
                          alt="Logo de la Tienda" 
                          className="w-full h-full object-contain p-1.5" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-primary font-bold text-2xl">
                          {form.name ? form.name.charAt(0).toUpperCase() : 'T'}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-semibold"
                        title="Cambiar imagen"
                      >
                        Cambiar
                      </button>
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4 text-primary" /> Subir Imagen desde Equipo
                        </Button>

                        {form.logoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setForm({ ...form, logoUrl: '' })}
                            className="text-danger hover:text-danger hover:bg-danger/10 text-xs"
                          >
                            Quitar Logotipo
                          </Button>
                        )}
                      </div>

                      <div className="pt-1">
                        <Input
                          label="O ingresa la URL directa de la imagen"
                          placeholder="https://ejemplo.com/logo-tienda.png"
                          value={form.logoUrl || ''}
                          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                        <span className="text-muted">Probar demos:</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logoUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=150&q=80' })}
                          className="text-primary hover:underline font-medium"
                        >
                          [Minimarket]
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logoUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=150&q=80' })}
                          className="text-primary hover:underline font-medium"
                        >
                          [Boutique]
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nombre comercial" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input label="Razón social" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
                  <Input label="RFC / Tax ID" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
                  <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  <Select label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value, currencySymbol: e.target.value === 'EUR' ? '€' : '$' })}>
                    <option value="COP">Peso Colombiano (COP)</option>
                    <option value="MXN">Peso Mexicano (MXN)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </Select>
                  <Input type="number" label="Tasa de IVA (%)" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} />
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'usuarios' && (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Gestión de Usuarios y Cajeros</CardTitle>
                  <p className="text-xs text-muted mt-1">Agrega, edita o elimina cajeros y supervisores del sistema</p>
                </div>
                <Button onClick={openNewUserModal}>
                  <Plus className="h-4 w-4" /> Nuevo Usuario
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o correo..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    >
                      <option value="todos">Todos los roles</option>
                      <option value="supervisor">Supervisores</option>
                      <option value="cajero">Cajeros</option>
                    </Select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-2 text-xs font-semibold text-muted uppercase">
                      <tr>
                        <th className="p-3">Usuario</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3">Rol</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted">
                            No se encontraron usuarios
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-surface-2/50 transition-colors">
                            <td className="p-3 font-medium text-text">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-text">{u.name}</p>
                                  {u.id === currentUser?.id && (
                                    <span className="text-[10px] text-primary font-semibold">(Sesión actual)</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-muted">{u.email}</td>
                            <td className="p-3">
                              <Badge variant={u.role === 'supervisor' ? 'primary' : 'default'} className="capitalize">
                                <Shield className="h-3 w-3 mr-1 inline" />
                                {u.role}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => toggleUserActive(u)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                                  u.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                                )}
                              >
                                {u.active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                                {u.active ? 'Activo' : 'Inactivo'}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditUserModal(u)}
                                  title="Editar usuario"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingUser(u)}
                                  disabled={u.id === currentUser?.id}
                                  className="text-danger hover:text-danger hover:bg-danger/10"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

{tab === 'apariencia' && (
            <Card>
              <CardHeader><CardTitle>Tema y apariencia</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-text mb-3">Tema</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setTheme('light'); setForm({ ...form, theme: 'light' }); }}
                      className={cn('p-4 rounded-xl border-2 transition-all flex items-center gap-3', form.theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-2')}
                    >
                      <Sun className="h-6 w-6 text-accent" />
                      <div className="text-left"><p className="text-sm font-medium text-text">Claro</p><p className="text-xs text-muted">Tema diurno</p></div>
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); setForm({ ...form, theme: 'dark' }); }}
                      className={cn('p-4 rounded-xl border-2 transition-all flex items-center gap-3', form.theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-2')}
                    >
                      <Moon className="h-6 w-6 text-primary" />
                      <div className="text-left"><p className="text-sm font-medium text-text">Oscuro</p><p className="text-xs text-muted">Tema nocturno</p></div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'datos' && (
            <Card>
              <CardHeader><CardTitle>Gestión de datos</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Usuarios', value: db.users.length },
                    { label: 'Productos', value: db.products.length },
                    { label: 'Ventas', value: db.sales.length },
                    { label: 'Clientes', value: db.customers.length },
                    { label: 'Compras', value: db.purchases.length },
                  ].map((s) => (
                    <div key={s.label} className="p-4 rounded-xl bg-surface-2 text-center">
                      <p className="font-display font-bold text-2xl text-text">{s.value}</p>
                      <p className="text-xs text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl border border-danger/20 bg-danger/5">
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Restablecer datos</p>
                      <p className="text-xs text-muted mt-1">Vuelve a los datos de demostración. Se perderán todos los cambios.</p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => setShowReset(true)}>Restablecer</Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-2">
                  <p className="text-sm font-medium text-text mb-2">Sesión actual</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">{currentUser?.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-text">{currentUser?.name}</p>
                      <p className="text-xs text-muted">{currentUser?.email}</p>
                    </div>
                    <Badge variant="primary" className="ml-auto capitalize">{currentUser?.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* User Create/Edit Modal */}
      <Dialog
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? 'Editar Usuario / Cajero' : 'Nuevo Usuario / Cajero'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <Input
            label="Nombre completo *"
            placeholder="Ej. Juan Pérez"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            required
          />
          <Input
            label="Correo electrónico *"
            type="email"
            placeholder="ejemplo@storeflow.com"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            required
          />
          <Input
            label="Contraseña *"
            type="text"
            placeholder="Contraseña de acceso"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Rol *"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as Role })}
            >
              <option value="cajero">Cajero</option>
              <option value="supervisor">Supervisor</option>
            </Select>

            <Select
              label="Estado"
              value={userForm.active ? 'true' : 'false'}
              onChange={(e) => setUserForm({ ...userForm, active: e.target.value === 'true' })}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Eliminar usuario"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteUserConfirm}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          ¿Estás seguro de que deseas eliminar al usuario <strong className="text-text">{deletingUser?.name}</strong> ({deletingUser?.email})? Esta acción no se puede deshacer.
        </p>
      </Dialog>

      {/* Reset Data Confirmation Dialog */}
      <Dialog open={showReset} onClose={() => setShowReset(false)} title="Restablecer datos" size="sm" footer={<><Button variant="outline" onClick={() => setShowReset(false)}>Cancelar</Button><Button variant="danger" onClick={handleReset}>Restablecer</Button></>}>
        <p className="text-sm text-muted">¿Estás seguro? Se eliminarán todos los datos actuales y se restaurarán los datos de demostración.</p>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Activity, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete, App, CreateAppRequest, HealthStatus } from '@/utils/api';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/hooks/useTranslation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Loader } from '@/components/ui/Loader';

interface AppWithHealth extends App {
  health?: HealthStatus;
}

export function Apps() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<AppWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [showLogs, setShowLogs] = useState<{ [key: number]: boolean }>({});
  const { success, error } = useToast();
  
  // États pour les modales de confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const [formData, setFormData] = useState<CreateAppRequest>({
    name: '',
    protocol: 'http',
    host: '',
    port: 80,
    path: '/',
    tag: '',
    icon: 'activity',
    health_path: '/health',
    health_type: 'http',
  });

  const protocolOptions = [
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'tcp', label: 'TCP' },
  ];

  const healthTypeOptions = [
    { value: 'http', label: 'HTTP' },
    { value: 'tcp', label: 'TCP' },
  ];

  const iconOptions = [
    { value: 'activity', label: 'Activity' },
    { value: 'server', label: 'Server' },
    { value: 'database', label: 'Database' },
    { value: 'globe', label: 'Globe' },
    { value: 'monitor', label: 'Monitor' },
  ];

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const appsData = await apiGet<App[]>('/api/v1/apps');

      // Charger le statut de santé pour chaque app
      const appsWithHealth = await Promise.all(
        appsData.map(async (app) => {
          try {
            const url = `${app.protocol}://${app.host}:${app.port}${app.health_path}`;
            const health = await apiGet<HealthStatus>(`/api/v1/health/http?url=${encodeURIComponent(url)}`);
            return { ...app, health };
          } catch {
            return { ...app, health: { status: 'unknown' as const, last_check: new Date().toISOString() } };
          }
        })
      );

      setApps(appsWithHealth);
    } catch (err) {
      error(t('common.error'), t('apps.load_error') || 'Impossible de charger les applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingApp) {
        await apiPut(`/api/v1/apps/${editingApp.id}`, formData);
        success(t('common.success'), t('apps.updated') || 'Application mise à jour');
      } else {
        await apiPost('/api/v1/apps', formData);
        success(t('common.success'), t('apps.created') || 'Application créée');
      }

      setShowModal(false);
      resetForm();
      loadApps();
    } catch (err) {
      error(t('common.error'), t('apps.save_error') || 'Impossible de sauvegarder l\'application');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: t('apps.delete_confirm') || 'Êtes-vous sûr de vouloir supprimer cette application ?',
      variant: 'danger',
      onConfirm: async () => {
    try {
          await apiDelete(`/api/v1/apps/${id}`);
          success(t('common.success'), t('apps.deleted') || 'Application supprimée');
      loadApps();
    } catch (err) {
          error(t('common.error'), t('apps.delete_error') || 'Impossible de supprimer l\'application');
        }
    }
    });
  };

  const handleEdit = (app: App) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      protocol: app.protocol,
      host: app.host,
      port: app.port,
      path: app.path || '/',
      tag: app.tag || '',
      icon: app.icon || 'activity',
      health_path: app.health_path || '/health',
      health_type: app.health_type || 'http',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingApp(null);
    setFormData({
      name: '',
      protocol: 'http',
      host: '',
      port: 80,
      path: '/',
      tag: '',
      icon: 'activity',
      health_path: '/health',
      health_type: 'http',
    });
  };

  const getStatusBadge = (health?: HealthStatus) => {
    if (!health) {
      return <Badge variant="default" size="sm">{t('common.unknown') || 'Inconnu'}</Badge>;
    }

    switch (health.status) {
      case 'online':
        return <Badge variant="success" size="sm">{t('nodes.online')}</Badge>;
      case 'offline':
        return <Badge variant="error" size="sm">{t('nodes.offline')}</Badge>;
      default:
        return <Badge variant="default" size="sm">{t('common.unknown') || 'Inconnu'}</Badge>;
    }
  };

  const toggleLogs = (appId: number) => {
    setShowLogs(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" variant="spinner" text={t('common.loading') || 'Chargement...'} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('navigation.apps')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('apps.description')}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('apps.add_app')}
        </Button>
      </div>

      {/* Grille des applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Card key={app.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{app.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(app.health)}
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLogs(app.id)}
                      className="p-1"
                    >
                      {showLogs[app.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(app)}
                      className="p-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(app.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {app.protocol}://{app.host}:{app.port}{app.path}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`${app.protocol}://${app.host}:${app.port}${app.path}`, '_blank')}
                  className="p-1"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>

              {app.tag && (
                <Badge variant="default" size="sm">
                  {app.tag}
                </Badge>
              )}

              {app.health && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {app.health.latency && (
                    <span>Latence: {app.health.latency}ms</span>
                  )}
                  {app.health.status_code && (
                    <span className="ml-2">Code: {app.health.status_code}</span>
                  )}
                </div>
              )}

              {/* Panneau des logs */}
              {showLogs[app.id] && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">{t('apps.logs.title') || 'Logs récents'}</h4>
                  {app.health ? (
                  <div className="space-y-1 text-xs font-mono">
                      <div className={`${
                        app.health.status === 'online' 
                          ? 'text-green-600 dark:text-green-400' 
                          : app.health.status === 'offline'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        [{new Date(app.health.last_check).toLocaleString('fr-FR')}] Health check - {app.health.status.toUpperCase()}
                        {app.health.latency && ` (${app.health.latency}ms)`}
                        {app.health.status_code && ` - ${app.health.status_code}`}
                        {app.health.error && ` - ${app.health.error}`}
                    </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('apps.no_logs') || 'Aucun log disponible'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {apps.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {t('apps.no_apps') || 'Aucune application'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t('apps.no_apps_description') || 'Commencez par ajouter votre première application à monitorer.'}
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('apps.add_app') || 'Ajouter une application'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de création/édition */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingApp ? (t('apps.edit_app') || 'Modifier l\'application') : (t('apps.add_app') || 'Ajouter une application')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('apps.form.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Select
              label={t('apps.form.protocol')}
              value={formData.protocol}
              onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
              options={protocolOptions}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('apps.form.host')}
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              placeholder="localhost"
              required
            />
            <Input
              label={t('apps.form.port')}
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              required
            />
          </div>

          <Input
            label={t('apps.form.path')}
            value={formData.path}
            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
            placeholder="/"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('apps.form.tag')}
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              placeholder="production, dev, etc."
            />
            <Select
              label={t('apps.form.icon')}
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              options={iconOptions}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('apps.form.health_path')}
              value={formData.health_path}
              onChange={(e) => setFormData({ ...formData, health_path: e.target.value })}
              placeholder="/health"
            />
            <Select
              label={t('apps.form.health_type')}
              value={formData.health_type}
              onChange={(e) => setFormData({ ...formData, health_type: e.target.value })}
              options={healthTypeOptions}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              {t('apps.form.cancel') || t('common.cancel')}
            </Button>
            <Button type="submit">
              {editingApp ? (t('apps.form.update') || 'Mettre à jour') : (t('apps.form.create') || 'Créer')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modale de confirmation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant || 'warning'}
        confirmText="Confirmer"
        cancelText="Annuler"
      />
    </div>
  );
}

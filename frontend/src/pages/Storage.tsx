import { useState, useEffect } from 'react';
import {
  HardDrive,
  Server,
  Activity,
  CheckCircle,
  MoreVertical,
  Eye,
  Edit,
  Download,
  Upload,
  Settings,
  Database,
  Archive,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface StoragePool {
  id: string;
  name: string;
  type: 'local' | 'nfs' | 'ceph' | 'iscsi' | 'lvm';
  status: 'online' | 'offline' | 'maintenance';
  node: string;
  total_space: number; // GB
  used_space: number; // GB
  free_space: number; // GB
  usage_percent: number;
  vms_count: number;
  lxc_count: number;
  last_backup?: string;
  created_at: string;
  mount_point?: string;
  protocol?: string;
}

export function Storage() {
  const [pools, setPools] = useState<StoragePool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { success, error, warning } = useToast();

  // Charger les données Storage depuis localStorage
  const loadStorageData = () => {
    try {
      // Pour l'instant, Storage n'est pas intégré avec Proxmox
      // Charger les données mockées
    const mockPools: StoragePool[] = [
      {
        id: 'local-lvm',
        name: 'local-lvm',
        type: 'lvm',
        status: 'online',
        node: 'pve-01',
        total_space: 1000,
        used_space: 650,
        free_space: 350,
        usage_percent: 65,
        vms_count: 8,
        lxc_count: 12,
        last_backup: '2024-01-15T02:00:00Z',
        created_at: '2023-12-01T00:00:00Z',
        mount_point: '/dev/pve/data'
      },
      {
        id: 'nfs-shared',
        name: 'nfs-shared',
        type: 'nfs',
        status: 'online',
        node: 'pve-01',
        total_space: 2000,
        used_space: 1200,
        free_space: 800,
        usage_percent: 60,
        vms_count: 15,
        lxc_count: 8,
        last_backup: '2024-01-15T03:00:00Z',
        created_at: '2023-11-15T00:00:00Z',
        mount_point: '/mnt/nfs-shared',
        protocol: 'NFSv4'
      },
      {
        id: 'ceph-cluster',
        name: 'ceph-cluster',
        type: 'ceph',
        status: 'online',
        node: 'pve-01',
        total_space: 5000,
        used_space: 3200,
        free_space: 1800,
        usage_percent: 64,
        vms_count: 25,
        lxc_count: 20,
        last_backup: '2024-01-15T04:00:00Z',
        created_at: '2023-10-01T00:00:00Z'
      },
      {
        id: 'iscsi-san',
        name: 'iscsi-san',
        type: 'iscsi',
        status: 'maintenance',
        node: 'pve-02',
        total_space: 3000,
        used_space: 1800,
        free_space: 1200,
        usage_percent: 60,
        vms_count: 0,
        lxc_count: 0,
        created_at: '2023-12-20T00:00:00Z',
        protocol: 'iSCSI'
      }
    ];

      setPools(mockPools);
      setLoading(false);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données Storage:', err);
      setLoading(false);
    }
  };

  // Message d'information pour Storage
  useEffect(() => {
    warning('Information', 'Les données de stockage ne sont pas encore intégrées avec Proxmox. Cette section affiche des données de démonstration.');
  }, []);

  useEffect(() => {
    loadStorageData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'local':
      case 'lvm':
        return <HardDrive className="h-4 w-4 text-blue-500" />;
      case 'nfs':
        return <Server className="h-4 w-4 text-green-500" />;
      case 'ceph':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'iscsi':
        return <Archive className="h-4 w-4 text-orange-500" />;
      default:
        return <HardDrive className="h-4 w-4 text-gray-500" />;
    }
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'success',
      offline: 'error',
      maintenance: 'warning'
    } as const;

    const labels = {
      online: 'En ligne',
      offline: 'Hors ligne',
      maintenance: 'Maintenance'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      local: 'Local',
      lvm: 'LVM',
      nfs: 'NFS',
      ceph: 'Ceph',
      iscsi: 'iSCSI'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatSize = (gb: number) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredPools = pools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.node.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || pool.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || pool.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Actions pour le stockage
  const handleStorageMount = async (pool: StoragePool) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPools(prevPools =>
        prevPools.map(p =>
          p.id === pool.id
            ? { ...p, status: 'online' as const }
            : p
        )
      );

      success('Succès', `Stockage ${pool.name} monté avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de monter le stockage ${pool.name}`);
    }
  };

  const handleStorageUnmount = async (pool: StoragePool) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPools(prevPools =>
        prevPools.map(p =>
          p.id === pool.id
            ? { ...p, status: 'offline' as const }
            : p
        )
      );

      success('Succès', `Stockage ${pool.name} démonté avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de démonter le stockage ${pool.name}`);
    }
  };

  const handleStorageRefresh = async (pool: StoragePool) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      success('Succès', `Stockage ${pool.name} actualisé avec succès`);
    } catch (err) {
      error('Erreur', `Impossible d'actualiser le stockage ${pool.name}`);
    }
  };

  const handleStorageDelete = async (pool: StoragePool) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPools(prevPools =>
        prevPools.filter(p => p.id !== pool.id)
      );

      success('Succès', `Stockage ${pool.name} supprimé avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de supprimer le stockage ${pool.name}`);
    }
  };

  const handleStorageConfig = (pool: StoragePool) => {
    warning('Fonctionnalité', `Configuration du stockage ${pool.name} - À implémenter`);
  };

  const uniqueTypes = [...new Set(pools.map(pool => pool.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Stockage
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestion des pools de stockage et volumes
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Pools
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {pools.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                En ligne
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {pools.filter(p => p.status === 'online').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                VMs + LXC
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {pools.reduce((sum, p) => sum + p.vms_count + p.lxc_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Capacité totale
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatSize(pools.reduce((sum, p) => sum + p.total_space, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Rechercher un pool de stockage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les types' },
            ...uniqueTypes.map(type => ({ value: type, label: getTypeLabel(type) }))
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les statuts' },
            { value: 'online', label: 'En ligne' },
            { value: 'offline', label: 'Hors ligne' },
            { value: 'maintenance', label: 'Maintenance' }
          ]}
        />
      </div>

      {/* Liste des pools de stockage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPools.map((pool) => (
          <Card key={pool.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(pool.type)}
                  <div>
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {getTypeLabel(pool.type)} • {pool.node}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(pool.status)}
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => success('Information', `Affichage des détails du stockage ${pool.name}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => warning('Fonctionnalité', `Édition du stockage ${pool.name} - À implémenter`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informations de base */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Nœud:</span>
                  <span>{pool.node}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">VMs:</span>
                  <span>{pool.vms_count}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">LXC:</span>
                  <span>{pool.lxc_count}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Total:</span>
                  <span>{formatSize(pool.total_space)}</span>
                </div>
              </div>

              {/* Montage */}
              {pool.mount_point && (
                <div className="text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Point de montage:</span>
                  <span className="ml-2 font-mono text-xs">{pool.mount_point}</span>
                </div>
              )}

              {pool.protocol && (
                <div className="text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Protocole:</span>
                  <span className="ml-2">{pool.protocol}</span>
                </div>
              )}

              {/* Utilisation de l'espace */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Utilisation</span>
                  <span className={`font-medium ${getUsageColor(pool.usage_percent)}`}>
                    {pool.usage_percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-700">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      pool.usage_percent >= 90 ? 'bg-red-600' :
                      pool.usage_percent >= 75 ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${pool.usage_percent}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <span>Utilisé:</span>
                    <span className="ml-1 font-medium">{formatSize(pool.used_space)}</span>
                  </div>
                  <div>
                    <span>Libre:</span>
                    <span className="ml-1 font-medium">{formatSize(pool.free_space)}</span>
                  </div>
                  <div>
                    <span>Total:</span>
                    <span className="ml-1 font-medium">{formatSize(pool.total_space)}</span>
                  </div>
                </div>
              </div>

              {/* Dernière sauvegarde */}
              {pool.last_backup && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Dernière sauvegarde: {formatDate(pool.last_backup)}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                {pool.status === 'online' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStorageUnmount(pool)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Démonter
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStorageMount(pool)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Monter
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStorageRefresh(pool)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Actualiser
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStorageConfig(pool)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Config
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStorageDelete(pool)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPools.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <HardDrive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Aucun pool de stockage trouvé
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Aucun pool de stockage ne correspond aux critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

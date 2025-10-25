import { useState, useEffect } from 'react';
import {
  Archive,
  Download,
  Play,
  Square,
  RotateCcw,
  Clock,
  HardDrive,
  Server,
  Activity,
  CheckCircle,
  MoreVertical,
  Eye,
  Edit,
  Settings,
  Calendar,
  Database,
  Monitor,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface Backup {
  id: string;
  name: string;
  type: 'vm' | 'lxc' | 'host' | 'storage';
  status: 'completed' | 'running' | 'failed' | 'scheduled';
  size: number; // GB
  duration: number; // minutes
  started_at: string;
  completed_at?: string;
  next_run?: string;
  node: string;
  target: string;
  retention: number; // days
  compression: boolean;
  encryption: boolean;
  created_at: string;
  vmid?: number;
  lxc_id?: number;
}

export function Backups() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { success, error, warning } = useToast();

  // Charger les données Backups depuis localStorage
  const loadBackupsData = () => {
    try {
      // Pour l'instant, Backups n'est pas intégré avec Proxmox
      // Charger les données mockées
    const mockBackups: Backup[] = [
      {
        id: 'backup-vm-101-20240115',
        name: 'VM-101 Daily Backup',
        type: 'vm',
        status: 'completed',
        size: 12.5,
        duration: 15,
        started_at: '2024-01-15T02:00:00Z',
        completed_at: '2024-01-15T02:15:00Z',
        next_run: '2024-01-16T02:00:00Z',
        node: 'pve-01',
        target: 'local-lvm',
        retention: 7,
        compression: true,
        encryption: false,
        created_at: '2024-01-01T00:00:00Z',
        vmid: 101
      },
      {
        id: 'backup-lxc-201-20240115',
        name: 'LXC-201 Weekly Backup',
        type: 'lxc',
        status: 'running',
        size: 0,
        duration: 0,
        started_at: '2024-01-15T03:00:00Z',
        node: 'pve-01',
        target: 'nfs-shared',
        retention: 30,
        compression: true,
        encryption: true,
        created_at: '2024-01-01T00:00:00Z',
        lxc_id: 201
      },
      {
        id: 'backup-host-20240114',
        name: 'Host Configuration Backup',
        type: 'host',
        status: 'completed',
        size: 0.5,
        duration: 2,
        started_at: '2024-01-14T01:00:00Z',
        completed_at: '2024-01-14T01:02:00Z',
        next_run: '2024-01-21T01:00:00Z',
        node: 'pve-01',
        target: 'local-lvm',
        retention: 90,
        compression: true,
        encryption: true,
        created_at: '2023-12-01T00:00:00Z'
      },
      {
        id: 'backup-storage-20240113',
        name: 'Storage Pool Backup',
        type: 'storage',
        status: 'failed',
        size: 0,
        duration: 0,
        started_at: '2024-01-13T04:00:00Z',
        node: 'pve-02',
        target: 'ceph-cluster',
        retention: 14,
        compression: false,
        encryption: false,
        created_at: '2024-01-10T00:00:00Z'
      },
      {
        id: 'backup-vm-102-20240112',
        name: 'VM-102 Monthly Backup',
        type: 'vm',
        status: 'scheduled',
        size: 0,
        duration: 0,
        started_at: '2024-01-12T00:00:00Z',
        next_run: '2024-02-12T00:00:00Z',
        node: 'pve-02',
        target: 'nfs-shared',
        retention: 365,
        compression: true,
        encryption: true,
        created_at: '2023-12-12T00:00:00Z',
        vmid: 102
      }
    ];

      setBackups(mockBackups);
      setLoading(false);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données Backups:', err);
      setLoading(false);
    }
  };

  // Message d'information pour Backups
  useEffect(() => {
    warning('Information', 'Les données de sauvegarde ne sont pas encore intégrées avec Proxmox. Cette section affiche des données de démonstration.');
  }, []);

  useEffect(() => {
    loadBackupsData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vm':
        return <Monitor className="h-4 w-4 text-blue-500" />;
      case 'lxc':
        return <Server className="h-4 w-4 text-green-500" />;
      case 'host':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'storage':
        return <HardDrive className="h-4 w-4 text-orange-500" />;
      default:
        return <Archive className="h-4 w-4 text-gray-500" />;
    }
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success',
      running: 'info',
      failed: 'error',
      scheduled: 'warning'
    } as const;

    const labels = {
      completed: 'Terminé',
      running: 'En cours',
      failed: 'Échoué',
      scheduled: 'Programmé'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      vm: 'Machine virtuelle',
      lxc: 'Conteneur LXC',
      host: 'Hôte',
      storage: 'Stockage'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatSize = (gb: number) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return 'N/A';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? `${mins}min` : ''}`;
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

  const filteredBackups = backups.filter(backup => {
    const matchesSearch = backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         backup.node.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || backup.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Actions pour les sauvegardes
  const handleBackupStart = async (backup: Backup) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setBackups(prevBackups =>
        prevBackups.map(b =>
          b.id === backup.id
            ? { ...b, status: 'running' as const, progress: 0 }
            : b
        )
      );

      success('Succès', `Sauvegarde ${backup.name} démarrée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de démarrer la sauvegarde ${backup.name}`);
    }
  };

  const handleBackupStop = async (backup: Backup) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBackups(prevBackups =>
        prevBackups.map(b =>
          b.id === backup.id
            ? { ...b, status: 'failed' as const, progress: 0 }
            : b
        )
      );

      success('Succès', `Sauvegarde ${backup.name} arrêtée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible d'arrêter la sauvegarde ${backup.name}`);
    }
  };

  const handleBackupDelete = async (backup: Backup) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBackups(prevBackups =>
        prevBackups.filter(b => b.id !== backup.id)
      );

      success('Succès', `Sauvegarde ${backup.name} supprimée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de supprimer la sauvegarde ${backup.name}`);
    }
  };

  const handleBackupRestore = async (backup: Backup) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      success('Succès', `Restauration de la sauvegarde ${backup.name} terminée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de restaurer la sauvegarde ${backup.name}`);
    }
  };

  const handleBackupDownload = async (backup: Backup) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      success('Succès', `Téléchargement de la sauvegarde ${backup.name} terminé`);
    } catch (err) {
      error('Erreur', `Impossible de télécharger la sauvegarde ${backup.name}`);
    }
  };

  const handleBackupConfig = (backup: Backup) => {
    warning('Fonctionnalité', `Configuration de la sauvegarde ${backup.name} - À implémenter`);
  };

  const uniqueTypes = [...new Set(backups.map(backup => backup.type))];

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
          Sauvegardes
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestion des sauvegardes et stratégies de rétention
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Archive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {backups.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Terminées
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {backups.filter(b => b.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                En cours
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {backups.filter(b => b.status === 'running').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Taille totale
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatSize(backups.reduce((sum, b) => sum + b.size, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Rechercher une sauvegarde..."
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
            { value: 'completed', label: 'Terminées' },
            { value: 'running', label: 'En cours' },
            { value: 'failed', label: 'Échouées' },
            { value: 'scheduled', label: 'Programmées' }
          ]}
        />
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Liste des sauvegardes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBackups.map((backup) => (
          <Card key={backup.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(backup.type)}
                  <div>
                    <CardTitle className="text-lg">{backup.name}</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {getTypeLabel(backup.type)} • {backup.node}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(backup.status)}
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => success('Information', `Affichage des détails de la sauvegarde ${backup.name}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => warning('Fonctionnalité', `Édition de la sauvegarde ${backup.name} - À implémenter`)}
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
                  <HardDrive className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Cible:</span>
                  <span>{backup.target}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Durée:</span>
                  <span>{formatDuration(backup.duration)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Archive className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Taille:</span>
                  <span>{formatSize(backup.size)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Rétention:</span>
                  <span>{backup.retention}j</span>
                </div>
              </div>

              {/* ID de la ressource */}
              {(backup.vmid || backup.lxc_id) && (
                <div className="text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {backup.type === 'vm' ? 'VM ID:' : 'LXC ID:'}
                  </span>
                  <span className="ml-2 font-mono">{backup.vmid || backup.lxc_id}</span>
                </div>
              )}

              {/* Options de sauvegarde */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Archive className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Compression:</span>
                  <Badge variant={backup.compression ? 'success' : 'default'} size="sm">
                    {backup.compression ? 'Activée' : 'Désactivée'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Chiffrement:</span>
                  <Badge variant={backup.encryption ? 'success' : 'default'} size="sm">
                    {backup.encryption ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Démarré:</span>
                  <span className="ml-2">{formatDate(backup.started_at)}</span>
                </div>
                {backup.completed_at && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Terminé:</span>
                    <span className="ml-2">{formatDate(backup.completed_at)}</span>
                  </div>
                )}
                {backup.next_run && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Prochaine:</span>
                    <span className="ml-2">{formatDate(backup.next_run)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                {backup.status === 'running' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBackupStop(backup)}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Arrêter
                  </Button>
                ) : backup.status === 'scheduled' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBackupStart(backup)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Démarrer
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBackupRestore(backup)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restaurer
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBackupDownload(backup)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBackupConfig(backup)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Config
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBackupDelete(backup)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBackups.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Aucune sauvegarde trouvée
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Aucune sauvegarde ne correspond aux critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

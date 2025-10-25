import { useState, useEffect } from 'react';
import {
  Monitor,
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  HardDrive,
  MemoryStick,
  Cpu,
  Clock,
  MoreVertical,
  Eye,
  Edit
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface VM {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'suspended';
  vmid: number;
  node: string;
  cpu_cores: number;
  memory: number; // MB
  disk: number; // GB
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: number;
  os: string;
  owner: string;
  created_at: string;
  last_backup?: string;
  tags?: string[];
}

export function VMs() {
  const [vms, setVMs] = useState<VM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const { success, error, warning } = useToast();

  // Charger les VMs depuis localStorage
  const loadVMs = () => {
    try {
      const savedVMs = localStorage.getItem('proxmoxVMs');
      if (savedVMs) {
        const proxmoxVMs = JSON.parse(savedVMs);
        console.log('📊 VMs chargées depuis localStorage:', proxmoxVMs);

        // Convertir les données Proxmox vers le format VM
        const convertedVMs: VM[] = proxmoxVMs.map((vm: any, index: number) => ({
          id: index + 1,
          name: vm.name || `VM-${vm.id}`,
          status: vm.status === 'running' ? 'running' : 'stopped',
          vmid: vm.id,
          node: vm.node || 'unknown',
          cpu_cores: 2, // Valeur par défaut
          memory: 2048, // Valeur par défaut
          disk: 50, // Valeur par défaut
          cpu_usage: vm.cpu_usage || 0,
          memory_usage: vm.memory_usage || 0,
          disk_usage: 0, // Non disponible dans les données Proxmox
          uptime: vm.uptime || 0,
          os: 'Linux', // Valeur par défaut
          owner: 'admin', // Valeur par défaut
          created_at: vm.last_update || new Date().toISOString(),
          tags: ['proxmox']
        }));

        setVMs(convertedVMs);
        console.log('✅ VMs converties:', convertedVMs);
        setLoading(false);
      } else {
        console.log('⚠️ Aucune donnée VMs trouvée dans localStorage - chargement des données mockées');
        loadMockData();
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des VMs:', err);
      loadMockData();
    }
  };

  // Charger les données mockées
  const loadMockData = () => {
    const mockVMs: VM[] = [
      {
        id: 1,
        name: 'web-server-01',
        status: 'running',
        vmid: 101,
        node: 'pve-01',
        cpu_cores: 2,
        memory: 4096,
        disk: 50,
        cpu_usage: 25,
        memory_usage: 68,
        disk_usage: 45,
        uptime: 86400 * 7, // 7 jours
        os: 'Ubuntu 22.04 LTS',
        owner: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        last_backup: '2024-01-14T02:00:00Z',
        tags: ['production', 'web']
      },
      {
        id: 2,
        name: 'db-server-01',
        status: 'running',
        vmid: 102,
        node: 'pve-01',
        cpu_cores: 4,
        memory: 8192,
        disk: 100,
        cpu_usage: 45,
        memory_usage: 78,
        disk_usage: 62,
        uptime: 86400 * 15, // 15 jours
        os: 'Ubuntu 22.04 LTS',
        owner: 'admin',
        created_at: '2023-12-15T00:00:00Z',
        last_backup: '2024-01-14T02:30:00Z',
        tags: ['production', 'database']
      }
    ];

    setVMs(mockVMs);
    setLoading(false);
  };

  useEffect(() => {
    loadVMs();
  }, []);

  // Écouter les mises à jour des données Proxmox
  useEffect(() => {
    const handleProxmoxDataUpdate = () => {
      console.log('🔄 Mise à jour des données Proxmox détectée pour VMs');
      loadVMs();
    };

    window.addEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);
    return () => window.removeEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'suspended':
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'success',
      stopped: 'error',
      paused: 'warning',
      suspended: 'default'
    } as const;

    const labels = {
      running: 'En cours',
      stopped: 'Arrêtée',
      paused: 'En pause',
      suspended: 'Suspendue'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);

    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const formatDisk = (gb: number) => {
    return `${gb} GB`;
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredVMs = vms.filter(vm => {
    const matchesSearch = vm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vm.os.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
    const matchesNode = nodeFilter === 'all' || vm.node === nodeFilter;
    return matchesSearch && matchesStatus && matchesNode;
  });

  // Actions pour les VMs
  const handleVMStart = async (vm: VM) => {
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setVMs(prevVMs =>
        prevVMs.map(v =>
          v.id === vm.id
            ? { ...v, status: 'running' as const, uptime: 0 }
            : v
        )
      );

      success('Succès', `VM ${vm.name} démarrée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de démarrer la VM ${vm.name}`);
    }
  };

  const handleVMStop = async (vm: VM) => {
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setVMs(prevVMs =>
        prevVMs.map(v =>
          v.id === vm.id
            ? { ...v, status: 'stopped' as const, uptime: 0, cpu_usage: 0, memory_usage: 0 }
            : v
        )
      );

      success('Succès', `VM ${vm.name} arrêtée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible d'arrêter la VM ${vm.name}`);
    }
  };

  const handleVMPause = async (vm: VM) => {
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setVMs(prevVMs =>
        prevVMs.map(v =>
          v.id === vm.id
            ? { ...v, status: 'paused' as const }
            : v
        )
      );

      success('Succès', `VM ${vm.name} mise en pause`);
    } catch (err) {
      error('Erreur', `Impossible de mettre en pause la VM ${vm.name}`);
    }
  };

  const handleVMRestart = async (vm: VM) => {
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000));

      setVMs(prevVMs =>
        prevVMs.map(v =>
          v.id === vm.id
            ? { ...v, status: 'running' as const, uptime: 0 }
            : v
        )
      );

      success('Succès', `VM ${vm.name} redémarrée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de redémarrer la VM ${vm.name}`);
    }
  };

  const handleVMConfig = (vm: VM) => {
    warning('Fonctionnalité', `Configuration de la VM ${vm.name} - À implémenter`);
  };

  const handleVMView = (vm: VM) => {
    success('Information', `Affichage des détails de la VM ${vm.name}`);
  };

  const handleVMEdit = (vm: VM) => {
    warning('Fonctionnalité', `Édition de la VM ${vm.name} - À implémenter`);
  };

  const uniqueNodes = [...new Set(vms.map(vm => vm.node))];

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
          Machines virtuelles
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestion et monitoring des VMs
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {vms.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                En cours
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {vms.filter(vm => vm.status === 'running').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Square className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Arrêtées
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {vms.filter(vm => vm.status === 'stopped').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pause className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Autres
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {vms.filter(vm => vm.status !== 'running' && vm.status !== 'stopped').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Rechercher une VM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les statuts' },
            { value: 'running', label: 'En cours' },
            { value: 'stopped', label: 'Arrêtées' },
            { value: 'paused', label: 'En pause' },
            { value: 'suspended', label: 'Suspendues' }
          ]}
        />
        <Select
          value={nodeFilter}
          onChange={(e) => setNodeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les nœuds' },
            ...uniqueNodes.map(node => ({ value: node, label: node }))
          ]}
        />
      </div>

      {/* Liste des VMs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVMs.map((vm) => (
          <Card key={vm.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(vm.status)}
                  <div>
                    <CardTitle className="text-lg">{vm.name}</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      VM ID: {vm.vmid} • {vm.node}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(vm.status)}
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => handleVMView(vm)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => handleVMEdit(vm)}
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
              {/* Informations système */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">CPU:</span>
                  <span>{vm.cpu_cores} cœurs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">RAM:</span>
                  <span>{formatMemory(vm.memory)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Disque:</span>
                  <span>{formatDisk(vm.disk)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Uptime:</span>
                  <span>{formatUptime(vm.uptime)}</span>
                </div>
              </div>

              {/* Utilisation des ressources (seulement si en cours) */}
              {vm.status === 'running' && (
                <div className="space-y-3">
                  {/* CPU */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">CPU</span>
                      </div>
                      <span className={`font-medium ${getUsageColor(vm.cpu_usage)}`}>
                        {vm.cpu_usage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${vm.cpu_usage}%` }}
                      />
                    </div>
                  </div>

                  {/* Mémoire */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center space-x-2">
                        <MemoryStick className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">Mémoire</span>
                      </div>
                      <span className={`font-medium ${getUsageColor(vm.memory_usage)}`}>
                        {vm.memory_usage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${vm.memory_usage}%` }}
                      />
                    </div>
                  </div>

                  {/* Disque */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">Disque</span>
                      </div>
                      <span className={`font-medium ${getUsageColor(vm.disk_usage)}`}>
                        {vm.disk_usage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                      <div
                        className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${vm.disk_usage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {vm.tags && vm.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {vm.tags.map((tag, index) => (
                    <Badge key={index} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                {vm.status === 'running' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVMPause(vm)}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVMStop(vm)}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Arrêter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVMRestart(vm)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Redémarrer
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVMStart(vm)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Démarrer
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVMConfig(vm)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Config
                </Button>
              </div>

              {/* Dernière sauvegarde */}
              {vm.last_backup && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Dernière sauvegarde: {formatDate(vm.last_backup)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVMs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Monitor className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Aucune VM trouvée
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Aucune machine virtuelle ne correspond aux critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

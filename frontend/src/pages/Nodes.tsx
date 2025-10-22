import { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Power
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Node {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: number;
  temperature?: number;
  vms_count: number;
  lxc_count: number;
  last_update: string;
  version: string;
  ip_address: string;
}

export function Nodes() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  // Données mockées
  useEffect(() => {
    const mockNodes: Node[] = [
      {
        id: 'pve-01',
        name: 'pve-01',
        status: 'online',
        cpu_usage: 45,
        memory_usage: 68,
        disk_usage: 72,
        uptime: 86400 * 15, // 15 jours
        temperature: 42,
        vms_count: 8,
        lxc_count: 12,
        last_update: '2024-01-15T14:30:00Z',
        version: '8.1.4',
        ip_address: '192.168.1.10'
      },
      {
        id: 'pve-02',
        name: 'pve-02',
        status: 'online',
        cpu_usage: 23,
        memory_usage: 45,
        disk_usage: 58,
        uptime: 86400 * 12, // 12 jours
        temperature: 38,
        vms_count: 5,
        lxc_count: 8,
        last_update: '2024-01-15T14:30:00Z',
        version: '8.1.4',
        ip_address: '192.168.1.11'
      },
      {
        id: 'pve-03',
        name: 'pve-03',
        status: 'maintenance',
        cpu_usage: 0,
        memory_usage: 12,
        disk_usage: 35,
        uptime: 0,
        temperature: 25,
        vms_count: 0,
        lxc_count: 0,
        last_update: '2024-01-15T10:00:00Z',
        version: '8.1.4',
        ip_address: '192.168.1.12'
      }
    ];

    setNodes(mockNodes);
    setLoading(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
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

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
          Nœuds du cluster
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestion et monitoring des nœuds Proxmox
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {nodes.length}
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
              {nodes.filter(n => n.status === 'online').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Hors ligne
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {nodes.filter(n => n.status === 'offline').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Maintenance
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {nodes.filter(n => n.status === 'maintenance').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des nœuds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(node.status)}
                  <CardTitle className="text-lg">{node.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(node.status)}
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="p-1">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informations de base */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">IP:</span>
                  <span className="ml-2 font-mono">{node.ip_address}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Version:</span>
                  <span className="ml-2">{node.version}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Uptime:</span>
                  <span className="ml-2">{formatUptime(node.uptime)}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Température:</span>
                  <span className="ml-2">{node.temperature}°C</span>
                </div>
              </div>

              {/* Utilisation des ressources */}
              <div className="space-y-3">
                {/* CPU */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">CPU</span>
                    </div>
                    <span className={`font-medium ${getUsageColor(node.cpu_usage)}`}>
                      {node.cpu_usage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${node.cpu_usage}%` }}
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
                    <span className={`font-medium ${getUsageColor(node.memory_usage)}`}>
                      {node.memory_usage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${node.memory_usage}%` }}
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
                    <span className={`font-medium ${getUsageColor(node.disk_usage)}`}>
                      {node.disk_usage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${node.disk_usage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Compteurs */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">VMs:</span>
                  <span className="font-medium">{node.vms_count}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">LXC:</span>
                  <span className="font-medium">{node.lxc_count}</span>
                </div>
              </div>

              {/* Dernière mise à jour */}
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                Dernière mise à jour: {formatDate(node.last_update)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {nodes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Server className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Aucun nœud
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Aucun nœud Proxmox n'est configuré ou accessible.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

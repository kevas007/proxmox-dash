import { useState, useEffect } from 'react';
import {
  Network,
  Server,
  Activity,
  Wifi,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  Settings,
  Download,
  Upload,
  Globe,
  Shield,
  Router,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface NetworkInterface {
  id: string;
  name: string;
  type: 'bridge' | 'bond' | 'vlan' | 'physical';
  status: 'up' | 'down' | 'unknown';
  node: string;
  ip_address?: string;
  netmask?: string;
  gateway?: string;
  mtu: number;
  speed: number; // Mbps
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  rx_errors: number;
  tx_errors: number;
  created_at: string;
  vms_count: number;
  lxc_count: number;
}

export function NetworkPage() {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { success, error, warning } = useToast();

  // Données mockées
  useEffect(() => {
    const mockInterfaces: NetworkInterface[] = [
      {
        id: 'vmbr0',
        name: 'vmbr0',
        type: 'bridge',
        status: 'up',
        node: 'pve-01',
        ip_address: '192.168.1.10',
        netmask: '255.255.255.0',
        gateway: '192.168.1.1',
        mtu: 1500,
        speed: 1000,
        rx_bytes: 1024000000,
        tx_bytes: 512000000,
        rx_packets: 1500000,
        tx_packets: 750000,
        rx_errors: 0,
        tx_errors: 0,
        created_at: '2023-12-01T00:00:00Z',
        vms_count: 8,
        lxc_count: 12
      },
      {
        id: 'vmbr1',
        name: 'vmbr1',
        type: 'bridge',
        status: 'up',
        node: 'pve-01',
        ip_address: '10.0.0.10',
        netmask: '255.255.0.0',
        mtu: 1500,
        speed: 1000,
        rx_bytes: 512000000,
        tx_bytes: 256000000,
        rx_packets: 750000,
        tx_packets: 375000,
        rx_errors: 0,
        tx_errors: 0,
        created_at: '2023-12-15T00:00:00Z',
        vms_count: 5,
        lxc_count: 8
      },
      {
        id: 'bond0',
        name: 'bond0',
        type: 'bond',
        status: 'up',
        node: 'pve-02',
        ip_address: '192.168.2.10',
        netmask: '255.255.255.0',
        gateway: '192.168.2.1',
        mtu: 1500,
        speed: 2000,
        rx_bytes: 2048000000,
        tx_bytes: 1024000000,
        rx_packets: 3000000,
        tx_packets: 1500000,
        rx_errors: 0,
        tx_errors: 0,
        created_at: '2023-11-20T00:00:00Z',
        vms_count: 12,
        lxc_count: 15
      },
      {
        id: 'vlan100',
        name: 'vlan100',
        type: 'vlan',
        status: 'down',
        node: 'pve-03',
        mtu: 1500,
        speed: 1000,
        rx_bytes: 0,
        tx_bytes: 0,
        rx_packets: 0,
        tx_packets: 0,
        rx_errors: 0,
        tx_errors: 0,
        created_at: '2024-01-10T00:00:00Z',
        vms_count: 0,
        lxc_count: 0
      }
    ];

    setInterfaces(mockInterfaces);
    setLoading(false);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bridge':
        return <Network className="h-4 w-4 text-blue-500" />;
      case 'bond':
        return <Router className="h-4 w-4 text-green-500" />;
      case 'vlan':
        return <Globe className="h-4 w-4 text-purple-500" />;
      case 'physical':
        return <Server className="h-4 w-4 text-orange-500" />;
      default:
        return <Network className="h-4 w-4 text-gray-500" />;
    }
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      up: 'success',
      down: 'error',
      unknown: 'warning'
    } as const;

    const labels = {
      up: 'Actif',
      down: 'Inactif',
      unknown: 'Inconnu'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      bridge: 'Bridge',
      bond: 'Bond',
      vlan: 'VLAN',
      physical: 'Physique'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const formatSpeed = (mbps: number) => {
    if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
    return `${mbps} Mbps`;
  };


  const filteredInterfaces = interfaces.filter(iface => {
    const matchesSearch = iface.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         iface.node.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         iface.ip_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || iface.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || iface.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Actions pour le réseau
  const handleInterfaceUp = async (iface: NetworkInterface) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setInterfaces(prevInterfaces =>
        prevInterfaces.map(i =>
          i.id === iface.id
            ? { ...i, status: 'up' as const }
            : i
        )
      );

      success('Succès', `Interface ${iface.name} activée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible d'activer l'interface ${iface.name}`);
    }
  };

  const handleInterfaceDown = async (iface: NetworkInterface) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setInterfaces(prevInterfaces =>
        prevInterfaces.map(i =>
          i.id === iface.id
            ? { ...i, status: 'down' as const }
            : i
        )
      );

      success('Succès', `Interface ${iface.name} désactivée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de désactiver l'interface ${iface.name}`);
    }
  };

  const handleInterfaceRestart = async (iface: NetworkInterface) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      success('Succès', `Interface ${iface.name} redémarrée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de redémarrer l'interface ${iface.name}`);
    }
  };

  const handleInterfaceConfig = (iface: NetworkInterface) => {
    warning('Fonctionnalité', `Configuration de l'interface ${iface.name} - À implémenter`);
  };

  const handleInterfaceDelete = async (iface: NetworkInterface) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setInterfaces(prevInterfaces =>
        prevInterfaces.filter(i => i.id !== iface.id)
      );

      success('Succès', `Interface ${iface.name} supprimée avec succès`);
    } catch (err) {
      error('Erreur', `Impossible de supprimer l'interface ${iface.name}`);
    }
  };

  const uniqueTypes = [...new Set(interfaces.map(iface => iface.type))];

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
          Réseau
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestion des interfaces réseau et connectivité
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Interfaces
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {interfaces.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Actives
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {interfaces.filter(i => i.status === 'up').length}
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
              {interfaces.reduce((sum, i) => sum + i.vms_count + i.lxc_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Erreurs
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {interfaces.reduce((sum, i) => sum + i.rx_errors + i.tx_errors, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Rechercher une interface..."
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
            { value: 'up', label: 'Actives' },
            { value: 'down', label: 'Inactives' },
            { value: 'unknown', label: 'Inconnues' }
          ]}
        />
      </div>

      {/* Liste des interfaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInterfaces.map((iface) => (
          <Card key={iface.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(iface.type)}
                  <div>
                    <CardTitle className="text-lg">{iface.name}</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {getTypeLabel(iface.type)} • {iface.node}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(iface.status)}
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => success('Information', `Affichage des détails de l'interface ${iface.name}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => warning('Fonctionnalité', `Édition de l'interface ${iface.name} - À implémenter`)}
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
              {/* Configuration réseau */}
              {iface.ip_address && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">IP:</span>
                    <span className="font-mono">{iface.ip_address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Masque:</span>
                    <span className="font-mono">{iface.netmask}</span>
                  </div>
                  {iface.gateway && (
                    <div className="flex items-center space-x-2">
                      <Router className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Gateway:</span>
                      <span className="font-mono">{iface.gateway}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Network className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">MTU:</span>
                    <span>{iface.mtu}</span>
                  </div>
                </div>
              )}

              {/* Statistiques de trafic */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Vitesse:</span>
                  <span className="font-medium">{formatSpeed(iface.speed)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">RX:</span>
                    <span className="ml-2 font-medium">{formatBytes(iface.rx_bytes)}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {iface.rx_packets.toLocaleString()} paquets
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">TX:</span>
                    <span className="ml-2 font-medium">{formatBytes(iface.tx_bytes)}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {iface.tx_packets.toLocaleString()} paquets
                    </div>
                  </div>
                </div>

                {/* Erreurs */}
                {(iface.rx_errors > 0 || iface.tx_errors > 0) && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">RX Erreurs: {iface.rx_errors}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">TX Erreurs: {iface.tx_errors}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Compteurs */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">VMs:</span>
                  <span className="font-medium">{iface.vms_count}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">LXC:</span>
                  <span className="font-medium">{iface.lxc_count}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                {iface.status === 'up' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInterfaceDown(iface)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInterfaceUp(iface)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Activer
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInterfaceRestart(iface)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Redémarrer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInterfaceConfig(iface)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Config
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInterfaceDelete(iface)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInterfaces.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Network className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Aucune interface trouvée
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Aucune interface réseau ne correspond aux critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

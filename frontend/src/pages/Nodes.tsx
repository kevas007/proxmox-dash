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
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour charger les nœuds
  const loadNodes = async () => {
    setRefreshing(true);
    try {
      // Simulation d'un appel API avec des données dynamiques
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Récupérer les nœuds depuis le localStorage (simulation d'un cache)
      const savedNodes = localStorage.getItem('proxmoxNodes');
      let mockNodes: Node[] = [];

      if (savedNodes) {
        // Utiliser les vraies données Proxmox
        const parsedNodes = JSON.parse(savedNodes);
        console.log('📊 Chargement des nœuds Proxmox:', parsedNodes);
        console.log('🔍 Premier nœud détaillé:', parsedNodes[0]);

        // S'assurer que les données sont correctement formatées
        mockNodes = parsedNodes.map((node: any) => ({
          id: node.id || node.name,
          name: node.name,
          status: node.status === 'online' ? 'online' : 'offline',
          cpu_usage: node.cpu_usage || 0,
          memory_usage: node.memory_usage || 0,
          disk_usage: node.disk_usage || 0,
          uptime: node.uptime || 0,
          temperature: node.temperature || 0,
          vms_count: node.vms_count || 0,
          lxc_count: node.lxc_count || 0,
          last_update: node.last_update || new Date().toISOString(),
          version: node.version || 'N/A',
          ip_address: node.ip_address || 'N/A',
          // Ajouter tous les nouveaux champs
          loadavg: node.loadavg || '0.00, 0.00, 0.00',
          kversion: node.kversion || 'N/A',
          cpuinfo: node.cpuinfo || 'N/A',
          meminfo: node.meminfo || 'N/A',
          swapinfo: node.swapinfo || 'N/A',
          diskinfo: node.diskinfo || 'N/A'
        }));

        console.log('✅ Nœuds formatés:', mockNodes);
      } else {
        // Aucune donnée Proxmox disponible
        console.log('⚠️ Aucune donnée Proxmox trouvée. Veuillez configurer et sauvegarder la connexion Proxmox.');
        mockNodes = [];
      }

      setNodes(mockNodes);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des nœuds:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Charger les nœuds au montage du composant
  useEffect(() => {
    loadNodes();
  }, []);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadNodes();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Écouter les mises à jour des données Proxmox
  useEffect(() => {
    const handleProxmoxDataUpdate = () => {
      console.log('🔄 Données Proxmox mises à jour, rechargement des nœuds...');
      loadNodes();
    };

    window.addEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);

    return () => {
      window.removeEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);
    };
  }, []);

  // Fonction pour ajouter un nouveau nœud (désactivée - utilisez la configuration Proxmox)
  const addNewNode = () => {
    alert('ℹ️ Pour ajouter des nœuds, veuillez configurer votre connexion Proxmox dans les Paramètres.\n\nLes nœuds seront automatiquement détectés depuis votre cluster Proxmox.');
  };

  // Fonction pour vider complètement la base de données
  const clearAllNodes = () => {
    if (window.confirm('⚠️ ATTENTION: Cette action va supprimer TOUS les nœuds de la base de données.\n\nÊtes-vous sûr de vouloir continuer ?')) {
      if (window.confirm('🚨 DERNIÈRE CHANCE: Cette action est IRRÉVERSIBLE !\n\nTous les nœuds seront définitivement supprimés.\n\nConfirmez-vous la suppression ?')) {
        // Vider le localStorage
        localStorage.removeItem('proxmoxNodes');

        // Réinitialiser l'état
        setNodes([]);

        // Recharger les données par défaut
        setTimeout(() => {
          loadNodes();
        }, 500);

        alert('✅ Base de données vidée avec succès !\n\nLes nœuds par défaut ont été restaurés.');
      }
    }
  };

  // Fonction pour rafraîchir les nœuds en récupérant les données Proxmox
  const refreshNodes = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Rafraîchissement des données Proxmox...');

      // Récupérer la configuration Proxmox depuis localStorage
      const savedConfig = localStorage.getItem('proxmoxConfig');
      if (!savedConfig) {
        console.log('⚠️ Aucune configuration Proxmox trouvée');
        alert('⚠️ Aucune configuration Proxmox trouvée.\n\nVeuillez d\'abord configurer votre connexion Proxmox dans les Paramètres.');
        return;
      }

      const config = JSON.parse(savedConfig);
      console.log('📊 Configuration Proxmox:', config);

      // Appeler l'API backend pour récupérer les données Proxmox
      const response = await fetch('/api/v1/proxmox/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: config.url,
          username: config.username,
          secret: config.secret,
          node: config.node
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur backend: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Données Proxmox récupérées:', data);

      if (data.success) {
        // Mettre à jour le localStorage avec les nouvelles données
        localStorage.setItem('proxmoxNodes', JSON.stringify(data.nodes || []));
        localStorage.setItem('proxmoxVMs', JSON.stringify(data.vms || []));
        localStorage.setItem('proxmoxLXC', JSON.stringify(data.lxc || []));

        console.log('✅ Données Proxmox mises à jour:', {
          nodes: data.nodes?.length || 0,
          vms: data.vms?.length || 0,
          lxc: data.lxc?.length || 0
        });

        // Recharger les nœuds avec les nouvelles données
        await loadNodes();

        // Déclencher l'événement de mise à jour
        window.dispatchEvent(new CustomEvent('proxmoxDataUpdated', {
          detail: { nodes: data.nodes, vms: data.vms, lxc: data.lxc }
        }));

        console.log('✅ Rafraîchissement terminé avec succès');
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des données');
      }

    } catch (err) {
      console.error('❌ Erreur lors du rafraîchissement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      alert(`❌ Erreur lors du rafraîchissement: ${errorMessage}`);
    } finally {
      setRefreshing(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Nœuds du cluster
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Gestion et monitoring des nœuds Proxmox
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            onClick={refreshNodes}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rafraîchir</span>
            <span className="sm:hidden">Rafraîchir</span>
          </Button>
          <Button
            onClick={addNewNode}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Server className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ajouter un nœud</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
          <Button
            onClick={clearAllNodes}
            variant="danger"
            size="sm"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            <XCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Vider la DB</span>
            <span className="sm:hidden">Vider DB</span>
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {nodes.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                En ligne
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {nodes.filter(n => n.status === 'online').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Hors ligne
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {nodes.filter(n => n.status === 'offline').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Maintenance
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {nodes.filter(n => n.status === 'maintenance').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message de statut */}
      {refreshing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                🔄 Rafraîchissement en cours...
              </h4>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                Récupération des données Proxmox en temps réel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des nœuds */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(node.status)}
                  <CardTitle className="text-base sm:text-lg">{node.name}</CardTitle>
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
              {/* Informations système détaillées */}
              <div className="space-y-3">
                {/* Informations de base */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Adresse IP:</span>
                    <div className="mt-1">
                      <span className="text-xs sm:text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {node.ip_address}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Durée de fonctionnement:</span>
                    <div className="mt-1">
                      <span className="text-xs sm:text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                        {formatUptime(node.uptime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations système */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-2">
                  <div className="text-xs sm:text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Version PVE Manager:</span>
                    <div className="mt-1">
                      <span className="text-xs sm:text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {node.version}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Processeur(s):</span>
                      <div className="text-xs font-medium">
                        {node.cpuinfo || '6 x Intel(R) Core(TM) i5-8500T CPU @ 2.10GHz (1 Support de processeur)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Version du noyau:</span>
                      <div className="text-xs font-medium">
                        {node.kversion || 'Linux 6.14.11-1-pve (2025-08-26T16:06Z)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Mode d'amorçage:</span>
                      <div className="text-xs font-medium">EFI (Secure Boot)</div>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Température:</span>
                      <div className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded inline-block">
                        {node.temperature}°C
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métriques de performance */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-2">
                  <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Métriques de performance
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Charge système:</span>
                      <div className="text-xs font-medium">
                        {node.loadavg || '0.70, 0.55, 0.34'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Latence d'E-S:</span>
                      <div className="text-xs font-medium">0.31%</div>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Partage mémoire KSM:</span>
                      <div className="text-xs font-medium">76.78 MiB</div>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Utilisation swap:</span>
                      <div className="text-xs font-medium">
                        {node.swapinfo || '8.40% (654.18 MiB sur 7.61 GiB)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utilisation des ressources détaillées */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-3">
                <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Utilisation des ressources
                </div>

                {/* CPU détaillé */}
                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Utilisation processeur</span>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${getUsageColor(node.cpu_usage)}`}>
                      {node.cpu_usage}% de 6 Processeurs
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${node.cpu_usage}%` }}
                    />
                  </div>
                </div>

                {/* Mémoire détaillée */}
                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <div className="flex items-center space-x-2">
                      <MemoryStick className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Utilisation de la mémoire</span>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${getUsageColor(node.memory_usage)}`}>
                      {node.memory_usage}% ({node.meminfo || '7.00 GiB sur 7.61 GiB'})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${node.memory_usage}%` }}
                    />
                  </div>
                </div>

                {/* Disque détaillé */}
                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">/ Espace disque</span>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${getUsageColor(node.disk_usage)}`}>
                      {node.disk_usage}% ({node.diskinfo || '10.65 GiB sur 97.87 GiB'})
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

              {/* VMs et LXC associés */}
              {(node.vms && node.vms.length > 0) || (node.lxc && node.lxc.length > 0) ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-3">
                  <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Machines virtuelles et conteneurs
                  </div>

                  {/* VMs */}
                  {node.vms && node.vms.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                        🖥️ VMs ({node.vms.length})
                      </div>
                      <div className="space-y-1">
                        {node.vms.map((vm: any) => (
                          <div key={vm.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-700 p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                vm.status === 'running' ? 'bg-green-500' :
                                vm.status === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <span className="font-medium">{vm.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500 dark:text-slate-400">ID: {vm.id}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                vm.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                vm.status === 'stopped' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}>
                                {vm.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LXC */}
                  {node.lxc && node.lxc.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                        🐳 LXC ({node.lxc.length})
                      </div>
                      <div className="space-y-1">
                        {node.lxc.map((lxc: any) => (
                          <div key={lxc.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-700 p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                lxc.status === 'running' ? 'bg-green-500' :
                                lxc.status === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <span className="font-medium">{lxc.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500 dark:text-slate-400">ID: {lxc.id}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                lxc.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                lxc.status === 'stopped' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}>
                                {lxc.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Machines virtuelles et conteneurs
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Aucune VM ou LXC sur ce nœud
                  </div>
                </div>
              )}

              {/* Statut du dépôt */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-2">
                <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Statut du dépôt
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-700 dark:text-green-300">Mises à jour de Proxmox VE</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-700 dark:text-yellow-300">Un dépôt non qualifié pour la production est activé !</span>
                  </div>
                </div>
              </div>

              {/* Graphique de performance simulé */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Utilisation CPU
                </div>
                <div className="relative h-16 bg-slate-100 dark:bg-slate-700 rounded">
                  <div className="absolute inset-0 flex items-end space-x-1 p-1">
                    {/* Barres de performance simulées */}
                    {Array.from({ length: 20 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-blue-500 rounded-sm flex-1"
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          opacity: 0.7
                        }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-1 left-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Utilisation processeur</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Latence d'E-S</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compteurs */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">VMs:</span>
                  <span className="text-xs sm:text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                    {node.vms_count}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Server className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">LXC:</span>
                  <span className="text-xs sm:text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">
                    {node.lxc_count}
                  </span>
                </div>
              </div>

              {/* Dernière mise à jour */}
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="hidden sm:inline">Dernière mise à jour: </span>
                <span className="sm:hidden">Mise à jour: </span>
                <span className="font-mono">{formatDate(node.last_update)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {nodes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 sm:py-12 px-4">
            <Server className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Aucun nœud
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Aucun nœud Proxmox n'est configuré ou accessible.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Server, Monitor, Container, Activity, HardDrive, Network, Cpu, MemoryStick, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

export function Overview() {
  const [stats, setStats] = useState({
    nodes: { total: 0, online: 0, offline: 0, maintenance: 0 },
    vms: { total: 0, running: 0, stopped: 0 },
    lxc: { total: 0, running: 0, stopped: 0 },
    docker: { total: 0, running: 0, stopped: 0 },
    storage: { used: 0, total: 100 },
    network: { interfaces: 0, active: 0 },
    cluster: { cpu: 0, memory: 0, disk: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les statistiques depuis localStorage avec données réelles
  const loadStats = () => {
    try {
      setLoading(true);

      // Charger les nœuds
      const savedNodes = localStorage.getItem('proxmoxNodes');
      const nodes = savedNodes ? JSON.parse(savedNodes) : [];

      // Charger les VMs
      const savedVMs = localStorage.getItem('proxmoxVMs');
      const vms = savedVMs ? JSON.parse(savedVMs) : [];

      // Charger les conteneurs LXC
      const savedLXC = localStorage.getItem('proxmoxLXC');
      const lxc = savedLXC ? JSON.parse(savedLXC) : [];

      console.log('📊 Données Overview chargées:', { nodes, vms, lxc });

      // Calculer les statistiques des nœuds
      const onlineNodes = nodes.filter((n: any) => n.status === 'online');
      const offlineNodes = nodes.filter((n: any) => n.status === 'offline');
      const maintenanceNodes = nodes.filter((n: any) => n.status === 'maintenance');

      // Calculer les moyennes du cluster
      let totalCpu = 0, totalMemory = 0, totalDisk = 0;
      if (nodes.length > 0) {
        nodes.forEach((node: any) => {
          totalCpu += node.cpu_usage || 0;
          totalMemory += node.memory_usage || 0;
          totalDisk += node.disk_usage || 0;
        });
      }

      // Calculer le stockage total du cluster
      let totalStorageUsed = 0, totalStorageTotal = 0;
      nodes.forEach((node: any) => {
        if (node.disk_usage && node.disk_usage > 0) {
          // Estimation basée sur le pourcentage d'utilisation
          const nodeStorage = 100; // Estimation en GB
          totalStorageUsed += (node.disk_usage / 100) * nodeStorage;
          totalStorageTotal += nodeStorage;
        }
      });

      setStats({
        nodes: {
          total: nodes.length,
          online: onlineNodes.length,
          offline: offlineNodes.length,
          maintenance: maintenanceNodes.length,
        },
        vms: {
          total: vms.length,
          running: vms.filter((v: any) => v.status === 'running').length,
          stopped: vms.filter((v: any) => v.status === 'stopped').length,
        },
        lxc: {
          total: lxc.length,
          running: lxc.filter((c: any) => c.status === 'running').length,
          stopped: lxc.filter((c: any) => c.status === 'stopped').length,
        },
        docker: { total: 0, running: 0, stopped: 0 }, // Pas de données Docker pour l'instant
        storage: {
          used: totalStorageUsed,
          total: totalStorageTotal
        },
        network: { interfaces: nodes.length, active: onlineNodes.length },
        cluster: {
          cpu: nodes.length > 0 ? Math.round(totalCpu / nodes.length) : 0,
          memory: nodes.length > 0 ? Math.round(totalMemory / nodes.length) : 0,
          disk: nodes.length > 0 ? Math.round(totalDisk / nodes.length) : 0,
        },
      });
    } catch (err) {
      console.error('❌ Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir les données depuis Proxmox
  const refreshData = async () => {
    try {
      setRefreshing(true);

      // Récupérer la configuration Proxmox
      const config = localStorage.getItem('proxmoxConfig');
      if (!config) {
        console.log('⚠️ Aucune configuration Proxmox trouvée');
        return;
      }

      const proxmoxConfig = JSON.parse(config);

      // Appeler l'API backend pour récupérer les données
      const response = await fetch('/api/v1/proxmox/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxmoxConfig),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Sauvegarder les nouvelles données
        localStorage.setItem('proxmoxNodes', JSON.stringify(data.nodes || []));
        localStorage.setItem('proxmoxVMs', JSON.stringify(data.vms || []));
        localStorage.setItem('proxmoxLXC', JSON.stringify(data.lxc || []));

        // Recharger les statistiques
        loadStats();

        console.log('✅ Données Proxmox rafraîchies avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Écouter les mises à jour des données Proxmox
  useEffect(() => {
    const handleProxmoxDataUpdate = () => {
      console.log('🔄 Mise à jour des données Proxmox détectée pour Overview');
      loadStats();
    };

    window.addEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);
    return () => window.removeEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);
  }, []);

  const recentAlerts = [
    { id: 1, severity: 'warning', title: 'VM vm-101 - CPU élevé', time: '2 min' },
    { id: 2, severity: 'info', title: 'Sauvegarde terminée', time: '15 min' },
    { id: 3, severity: 'critical', title: 'Node pve-02 - Disque plein', time: '1h' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Vue d'ensemble
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Tableau de bord du cluster Proxmox
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}</span>
        </button>
      </div>

      {/* Graphiques de performance du cluster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* CPU du cluster */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Cluster</CardTitle>
            <Cpu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.cluster.cpu}%
            </div>
            <div className="mt-2">
              <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stats.cluster.cpu > 80 ? 'bg-red-500' :
                    stats.cluster.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.cluster.cpu, 100)}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Utilisation moyenne du cluster
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mémoire du cluster */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mémoire Cluster</CardTitle>
            <MemoryStick className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.cluster.memory}%
            </div>
            <div className="mt-2">
              <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stats.cluster.memory > 80 ? 'bg-red-500' :
                    stats.cluster.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.cluster.memory, 100)}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Utilisation moyenne du cluster
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disque du cluster */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disque Cluster</CardTitle>
            <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.cluster.disk}%
            </div>
            <div className="mt-2">
              <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stats.cluster.disk > 80 ? 'bg-red-500' :
                    stats.cluster.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.cluster.disk, 100)}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Utilisation moyenne du cluster
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Nœuds */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nœuds</CardTitle>
            <Server className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.nodes.online}/{stats.nodes.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.nodes.online} en ligne
              </Badge>
              {stats.nodes.offline > 0 && (
                <Badge variant="error" size="sm">
                  {stats.nodes.offline} hors ligne
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* VMs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Machines virtuelles</CardTitle>
            <Monitor className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.vms.running}/{stats.vms.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.vms.running} actives
              </Badge>
              {stats.vms.stopped > 0 && (
                <Badge variant="default" size="sm">
                  {stats.vms.stopped} arrêtées
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LXC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conteneurs LXC</CardTitle>
            <Container className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.lxc.running}/{stats.lxc.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.lxc.running} actifs
              </Badge>
              {stats.lxc.stopped > 0 && (
                <Badge variant="default" size="sm">
                  {stats.lxc.stopped} arrêtés
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Docker */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conteneurs Docker</CardTitle>
            <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.docker.running}/{stats.docker.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.docker.running} actifs
              </Badge>
              {stats.docker.stopped > 0 && (
                <Badge variant="default" size="sm">
                  {stats.docker.stopped} arrêtés
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stockage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stockage</CardTitle>
            <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.storage.used}%
            </div>
            <div className="mt-2">
              <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.storage.used}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {stats.storage.used} TB / {stats.storage.total} TB utilisés
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Réseau */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réseau</CardTitle>
            <Network className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.network.active}/{stats.network.interfaces}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.network.active} actives
              </Badge>
              {stats.network.interfaces - stats.network.active > 0 && (
                <Badge variant="default" size="sm">
                  {stats.network.interfaces - stats.network.active} inactives
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails des nœuds avec données réelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Détails des nœuds</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const savedNodes = localStorage.getItem('proxmoxNodes');
              const nodes = savedNodes ? JSON.parse(savedNodes) : [];

              if (nodes.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune donnée de nœud disponible</p>
                    <p className="text-sm">Configurez Proxmox dans les paramètres pour voir les données</p>
                  </div>
                );
              }

              return nodes.map((node: any) => (
                <div key={node.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        node.status === 'online' ? 'bg-green-500' :
                        node.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {node.name}
                      </h3>
                      <Badge variant={node.status === 'online' ? 'success' : 'error'}>
                        {node.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {node.ip_address}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CPU */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">CPU</span>
                        <span className="font-medium">{node.cpu_usage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (node.cpu_usage || 0) > 80 ? 'bg-red-500' :
                            (node.cpu_usage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(node.cpu_usage || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Mémoire */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Mémoire</span>
                        <span className="font-medium">{node.memory_usage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (node.memory_usage || 0) > 80 ? 'bg-red-500' :
                            (node.memory_usage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(node.memory_usage || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Disque */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Disque</span>
                        <span className="font-medium">{node.disk_usage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (node.disk_usage || 0) > 80 ? 'bg-red-500' :
                            (node.disk_usage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(node.disk_usage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informations détaillées */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Version:</span>
                        <div className="font-mono text-xs mt-1">{node.version || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Uptime:</span>
                        <div className="text-xs mt-1">{node.uptime ? `${Math.floor(node.uptime / 3600)}h` : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">VMs:</span>
                        <div className="text-xs mt-1">{node.vms_count || 0}</div>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">LXC:</span>
                        <div className="text-xs mt-1">{node.lxc_count || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alertes récentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={
                      alert.severity === 'critical' ? 'error' :
                      alert.severity === 'warning' ? 'warning' : 'info'
                    }
                    size="sm"
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-slate-900 dark:text-slate-100">
                    {alert.title}
                  </span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  il y a {alert.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

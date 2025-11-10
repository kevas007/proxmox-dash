import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Server, Monitor, Container, Activity, HardDrive, Network, Cpu, MemoryStick, AlertTriangle, RefreshCw, Archive, Zap, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function Overview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    nodes: { total: 0, online: 0, offline: 0, maintenance: 0 },
    vms: { total: 0, running: 0, stopped: 0 },
    lxc: { total: 0, running: 0, stopped: 0 },
    docker: { total: 0, running: 0, stopped: 0 },
    storage: { used: 0, total: 100 },
    network: { interfaces: 0, active: 0 },
    cluster: { cpu: 0, memory: 0, disk: 0 },
  });

  const [refreshing, setRefreshing] = useState(false);
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string;
    type: 'vm_started' | 'vm_stopped' | 'lxc_started' | 'lxc_stopped' | 'node_online' | 'node_offline' | 'backup_completed' | 'backup_failed';
    title: string;
    message: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'critical';
  }>>([]);

  // Charger les événements récents depuis localStorage
  const loadRecentEvents = () => {
    try {
      const savedEvents = localStorage.getItem('proxmoxEvents');
      if (savedEvents) {
        const events = JSON.parse(savedEvents);
        // Convertir les timestamps en Date et trier par date décroissante
        const parsedEvents = events
          .map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp)
          }))
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, 10); // Garder seulement les 10 derniers
        setRecentEvents(parsedEvents);
      } else {
        // Générer des événements basés sur les données actuelles
        generateEventsFromData();
      }
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
    }
  };

  // Générer des événements à partir des données Proxmox
  const generateEventsFromData = () => {
    const events: Array<{
      id: string;
      type: 'vm_started' | 'vm_stopped' | 'lxc_started' | 'lxc_stopped' | 'node_online' | 'node_offline' | 'backup_completed' | 'backup_failed';
      title: string;
      message: string;
      timestamp: Date;
      severity: 'info' | 'warning' | 'critical';
    }> = [];

    try {
      const savedVMs = localStorage.getItem('proxmoxVMs');
      const savedLXC = localStorage.getItem('proxmoxLXC');
      const savedNodes = localStorage.getItem('proxmoxNodes');

      if (savedVMs) {
        const vms = JSON.parse(savedVMs);
        vms.forEach((vm: any) => {
          if (vm.status === 'running') {
            events.push({
              id: `vm-${vm.id}-started`,
              type: 'vm_started',
              title: `VM ${vm.name || vm.id} démarrée`,
              message: `La VM ${vm.name || vm.id} est en cours d'exécution sur ${vm.node || 'N/A'}`,
              timestamp: new Date(vm.last_update || Date.now()),
              severity: 'info'
            });
          } else {
            events.push({
              id: `vm-${vm.id}-stopped`,
              type: 'vm_stopped',
              title: `VM ${vm.name || vm.id} arrêtée`,
              message: `La VM ${vm.name || vm.id} est arrêtée`,
              timestamp: new Date(vm.last_update || Date.now()),
              severity: 'warning'
            });
          }
        });
      }

      if (savedLXC) {
        const lxc = JSON.parse(savedLXC);
        lxc.forEach((container: any) => {
          if (container.status === 'running') {
            events.push({
              id: `lxc-${container.id}-started`,
              type: 'lxc_started',
              title: `LXC ${container.name || container.id} démarré`,
              message: `Le conteneur LXC ${container.name || container.id} est en cours d'exécution`,
              timestamp: new Date(container.last_update || Date.now()),
              severity: 'info'
            });
          }
        });
      }

      if (savedNodes) {
        const nodes = JSON.parse(savedNodes);
        nodes.forEach((node: any) => {
          if (node.status === 'online') {
            events.push({
              id: `node-${node.name}-online`,
              type: 'node_online',
              title: `Nœud ${node.name} en ligne`,
              message: `Le nœud ${node.name} est opérationnel`,
              timestamp: new Date(node.last_update || Date.now()),
              severity: 'info'
            });
          } else {
            events.push({
              id: `node-${node.name}-offline`,
              type: 'node_offline',
              title: `Nœud ${node.name} hors ligne`,
              message: `Le nœud ${node.name} est hors ligne`,
              timestamp: new Date(node.last_update || Date.now()),
              severity: 'critical'
            });
          }
        });
      }

      // Trier par date décroissante et garder les 10 derniers
      const sortedEvents = events
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      setRecentEvents(sortedEvents);
      localStorage.setItem('proxmoxEvents', JSON.stringify(sortedEvents));
    } catch (err) {
      console.error('Erreur lors de la génération des événements:', err);
    }
  };

  // Charger les statistiques depuis localStorage avec données réelles
  const loadStats = () => {
    try {

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
    loadRecentEvents();
  }, []);

  // Écouter les mises à jour des données Proxmox
  useEffect(() => {
    const handleProxmoxDataUpdate = () => {
      console.log('🔄 Mise à jour des données Proxmox détectée pour Overview');
      loadStats();
      generateEventsFromData();
    };

    window.addEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);
    return () => window.removeEventListener('proxmoxDataUpdated', handleProxmoxDataUpdate);
  }, []);

  // Formater le temps relatif
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${days}j`;
  };

  // Navigation rapide
  const navigateToSection = (section: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: section }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('navigation.overview')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('dashboard.title')}
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? t('common.loading') : t('common.refresh')}</span>
        </button>
      </div>

      {/* Graphiques de performance du cluster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* CPU du cluster */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.performance')} - CPU</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('dashboard.performance')} - {t('nodes.memory_usage')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('dashboard.performance')} - {t('nodes.disk_usage')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('navigation.nodes')}</CardTitle>
            <Server className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.nodes.online}/{stats.nodes.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.nodes.online} {t('nodes.online')}
              </Badge>
              {stats.nodes.offline > 0 && (
                <Badge variant="error" size="sm">
                  {stats.nodes.offline} {t('nodes.offline')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* VMs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('navigation.vms')}</CardTitle>
            <Monitor className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.vms.running}/{stats.vms.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.vms.running} {t('vms.running')}
              </Badge>
              {stats.vms.stopped > 0 && (
                <Badge variant="default" size="sm">
                  {stats.vms.stopped} {t('vms.stopped')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LXC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('navigation.lxc')}</CardTitle>
            <Container className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.lxc.running}/{stats.lxc.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.lxc.running} {t('lxc.running')}
              </Badge>
              {stats.lxc.stopped > 0 && (
                <Badge variant="default" size="sm">
                  {stats.lxc.stopped} {t('lxc.stopped')}
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
            <CardTitle className="text-sm font-medium">{t('navigation.storage')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('navigation.network')}</CardTitle>
            <Network className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.network.active}/{stats.network.interfaces}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="success" size="sm">
                {stats.network.active} {t('common.active') || 'actives'}
              </Badge>
              {stats.network.interfaces - stats.network.active > 0 && (
                <Badge variant="default" size="sm">
                  {stats.network.interfaces - stats.network.active} {t('common.inactive') || 'inactives'}
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
            <span>{t('nodes.title')}</span>
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
                    <p>{t('common.no_data') || 'Aucune donnée disponible'}</p>
                    <p className="text-sm">{t('settings.proxmox')} {t('common.configuration') || 'configuration'}</p>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>{t('overview.quick_actions') || 'Actions rapides'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button
              onClick={() => navigateToSection('vms')}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Monitor className="h-6 w-6" />
              <span className="text-sm">{t('overview.view_vms') || 'Voir les VMs'}</span>
            </Button>
            <Button
              onClick={() => navigateToSection('lxc')}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Container className="h-6 w-6" />
              <span className="text-sm">{t('overview.view_lxc') || 'Voir les LXC'}</span>
            </Button>
            <Button
              onClick={() => {
                navigateToSection('vms');
                // TODO: Ouvrir modal de création VM
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('createVM'));
                }, 100);
              }}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Monitor className="h-6 w-6 text-primary-600" />
              <span className="text-sm">{t('overview.create_vm') || 'Créer une VM'}</span>
            </Button>
            <Button
              onClick={() => {
                navigateToSection('lxc');
                // TODO: Ouvrir modal de création LXC
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('createLXC'));
                }, 100);
              }}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Container className="h-6 w-6 text-primary-600" />
              <span className="text-sm">{t('overview.create_lxc') || 'Créer un LXC'}</span>
            </Button>
            <Button
              onClick={() => navigateToSection('nodes')}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Server className="h-6 w-6" />
              <span className="text-sm">{t('overview.cluster') || 'Cluster'}</span>
            </Button>
            <Button
              onClick={() => {
                navigateToSection('backups');
                // TODO: Ouvrir modal de lancement backup
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('launchBackup'));
                }, 100);
              }}
              variant="outline"
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Archive className="h-6 w-6 text-primary-600" />
              <span className="text-sm">{t('overview.launch_backup') || 'Lancer un backup'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Événements récents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{t('overview.recent_events') || 'Événements récents'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge
                      variant={
                        event.severity === 'critical' ? 'error' :
                        event.severity === 'warning' ? 'warning' : 'info'
                      }
                      size="sm"
                    >
                      {event.type.includes('started') || event.type.includes('online') ? '✓' :
                       event.type.includes('stopped') || event.type.includes('offline') ? '✗' :
                       event.type.includes('completed') ? '✓' : '⚠'}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {event.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {event.message}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap ml-4">
                    {formatTimeAgo(event.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('overview.no_recent_events') || 'Aucun événement récent'}</p>
                <p className="text-sm">{t('overview.events_will_appear') || 'Les événements apparaîtront ici après les actions sur le cluster'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{t('alerts.critical') || 'Alertes critiques'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.filter(e => e.severity === 'critical').length > 0 ? (
              recentEvents
                .filter(e => e.severity === 'critical')
                .slice(0, 5)
                .map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-3">
                      <Badge variant="error" size="sm">
                        {t('alerts.critical')}
                      </Badge>
                      <span className="text-slate-900 dark:text-slate-100">
                        {alert.title}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatTimeAgo(alert.timestamp)}
                    </span>
                  </div>
                ))
            ) : (
              <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                <p className="text-sm">{t('alerts.no_alerts') || 'Aucune alerte'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

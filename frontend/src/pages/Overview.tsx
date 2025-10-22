import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Server, Monitor, Container, Activity, HardDrive, Network } from 'lucide-react';

export function Overview() {
  // Données mockées pour l'exemple
  const stats = {
    nodes: { total: 3, online: 3, offline: 0 },
    vms: { total: 12, running: 10, stopped: 2 },
    lxc: { total: 8, running: 7, stopped: 1 },
    docker: { total: 24, running: 22, stopped: 2 },
    storage: { used: 65, total: 100 },
    network: { interfaces: 12, active: 11 },
  };

  const recentAlerts = [
    { id: 1, severity: 'warning', title: 'VM vm-101 - CPU élevé', time: '2 min' },
    { id: 2, severity: 'info', title: 'Sauvegarde terminée', time: '15 min' },
    { id: 3, severity: 'critical', title: 'Node pve-02 - Disque plein', time: '1h' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Vue d'ensemble
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Tableau de bord du cluster Proxmox
        </p>
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

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes récentes</CardTitle>
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

import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ToastContainer, useToast } from './components/ui/Toast';
import { Overview } from './pages/Overview';
import { Apps } from './pages/Apps';
import { Settings } from './pages/Settings';
import { UsersPage } from './pages/Users';
import { TasksLogs } from './pages/TasksLogs';
import { Nodes } from './pages/Nodes';
import { VMs } from './pages/VMs';
import { LXC } from './pages/LXC';
import { Docker } from './pages/Docker';
import { Databases } from './pages/Databases';
import { Storage } from './pages/Storage';
import { NetworkPage } from './pages/Network';
import { Backups } from './pages/Backups';
import { useSSE } from './hooks/useSSE';
import { useAuth } from './utils/auth';
import { apiGet, Alert } from './utils/api';


function App() {
  const [currentSection, setCurrentSection] = useState('overview');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toasts, removeToast, warning, error, info } = useToast();
  const { isAuthenticated } = useAuth();

  // Configuration SSE
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const sseUrl = `${apiUrl}/api/v1/alerts/stream`;

  // Hook SSE pour les notifications temps réel (seulement si authentifié)
  useSSE(isAuthenticated ? sseUrl : '', {
    onAlert: (alert: Alert) => {
      // Ajouter l'alerte à la liste
      setAlerts(prev => [alert, ...(prev || []).slice(0, 19)]); // Garder seulement les 20 dernières

      // Afficher un toast selon la sévérité
      const message = `${alert.source}: ${alert.message}`;
      switch (alert.severity) {
        case 'critical':
          error(alert.title, message);
          break;
        case 'warning':
          warning(alert.title, message);
          break;
        case 'info':
          info(alert.title, message);
          break;
        default:
          info(alert.title, message);
      }
    },
    onAck: (data: { alert_id: number }) => {
      // Marquer l'alerte comme acquittée
      setAlerts(prev =>
        (prev || []).map(alert =>
          alert.id === data.alert_id
            ? { ...alert, acknowledged: true }
            : alert
        )
      );
    },
    onConnected: () => {
      // Connexion SSE établie - pas de notification
    },
    onError: () => {
      // Erreur SSE - pas de notification
    },
  });

  // Charger les alertes au démarrage
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const alertsData = await apiGet<Alert[]>('/api/v1/alerts?limit=20');
        setAlerts(alertsData);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      }
    };

    loadAlerts();
  }, []);

  // Gestion du thème
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Calculer le nombre d'alertes non acquittées
  const unacknowledgedCount = (alerts || []).filter(alert => !alert.acknowledged).length;

  // Rendu des sections
  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return <Overview />;
      case 'apps':
        return <Apps />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <Settings />;
      case 'nodes':
        return <Nodes />;
      case 'vms':
        return <VMs />;
      case 'lxc':
        return <LXC />;
      case 'docker':
        return <Docker />;
      case 'databases':
        return <Databases />;
      case 'storage':
        return <Storage />;
      case 'network':
        return <NetworkPage />;
      case 'backups':
        return <Backups />;
      case 'tasks':
        return <TasksLogs />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen">
      <Layout
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        alertCount={unacknowledgedCount}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      >
        {renderSection()}
      </Layout>

      {/* Container des toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Indicateur de connexion SSE supprimé */}
    </div>
  );
}

export default App;

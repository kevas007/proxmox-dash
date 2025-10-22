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
import { useSSE } from './hooks/useSSE';
import { useAuth } from './utils/auth';
import { apiGet, Alert } from './utils/api';

// Pages placeholder pour les autres sections
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Cette section sera implémentée dans une version future.
        </p>
      </div>
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          Contenu à venir...
        </p>
      </div>
    </div>
  );
}

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
  const { toasts, removeToast, success, warning, error, info } = useToast();
  const { isAuthenticated } = useAuth();

  // Configuration SSE
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const sseUrl = `${apiUrl}/api/alerts/stream`;

  // Hook SSE pour les notifications temps réel (seulement si authentifié)
  const { isConnected } = useSSE(isAuthenticated ? sseUrl : '', {
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
      success('Connexion établie', 'Notifications temps réel activées');
    },
    onError: () => {
      error('Erreur de connexion', 'Impossible de se connecter aux notifications temps réel');
    },
  });

  // Charger les alertes au démarrage
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const alertsData = await apiGet<Alert[]>('/api/alerts?limit=20');
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
        return <PlaceholderPage title="Conteneurs Docker" />;
      case 'databases':
        return <PlaceholderPage title="Bases de données" />;
      case 'storage':
        return <PlaceholderPage title="Stockage" />;
      case 'network':
        return <PlaceholderPage title="Réseau" />;
      case 'backups':
        return <PlaceholderPage title="Sauvegardes" />;
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

      {/* Indicateur de connexion SSE (dev) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            SSE: {isConnected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

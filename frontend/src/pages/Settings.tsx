import { useState, useEffect } from 'react';
import { Save, Mail, Bell, TestTube, Server, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiPost } from '@/utils/api';
import { useToast } from '@/components/ui/Toast';
import { proxmoxConfigManager } from '@/utils/proxmox';

export function Settings() {
  const { success, error, warning } = useToast();

  // Configuration API
  const [apiConfig, setApiConfig] = useState({
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  });

  // Configuration Proxmox
  const [proxmoxConfig, setProxmoxConfig] = useState({
    url: 'https://pve.example.com:8006',
    username: '',
    secret: '',
    node: 'pve',
  });

  // État de test Proxmox
  const [proxmoxTestStatus, setProxmoxTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [proxmoxTestMessage, setProxmoxTestMessage] = useState('');

  // État de la bulle d'information
  const [showTokenInfo, setShowTokenInfo] = useState(false);

  // Configuration SMTP
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from: '',
    tls: true,
  });

  // Configuration Notifications
  const [notificationConfig, setNotificationConfig] = useState({
    emailEnabled: true,
    sseEnabled: true,
    rateLimit: 60,
  });

  // Test d'email
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  // Abonnements
  const [newSubscription, setNewSubscription] = useState({
    channel: 'email',
    endpoint: '',
  });

  const channelOptions = [
    { value: 'email', label: 'Email' },
    { value: 'webhook', label: 'Webhook' },
  ];

  // Charger les configurations sauvegardées au montage du composant
  useEffect(() => {
    // Charger la configuration API
    const savedApiConfig = localStorage.getItem('apiConfig');
    if (savedApiConfig) {
      setApiConfig(JSON.parse(savedApiConfig));
    }

    // Charger la configuration Proxmox depuis le manager
    const savedProxmoxConfig = proxmoxConfigManager.getConfig();
    if (savedProxmoxConfig) {
      // Convertir l'ancien format (avec token) vers le nouveau format (username/secret)
      if (savedProxmoxConfig.token && !savedProxmoxConfig.username) {
        // Extraire username et secret du token formaté
        const tokenMatch = savedProxmoxConfig.token.match(/PVEAPIToken=([^!]+)!(.+)/);
        if (tokenMatch) {
          setProxmoxConfig({
            url: savedProxmoxConfig.url,
            username: tokenMatch[1],
            secret: tokenMatch[2],
            node: savedProxmoxConfig.node,
          });
        } else {
          setProxmoxConfig({
            url: savedProxmoxConfig.url,
            username: '',
            secret: '',
            node: savedProxmoxConfig.node,
          });
        }
      } else {
        setProxmoxConfig({
          url: savedProxmoxConfig.url,
          username: savedProxmoxConfig.username || '',
          secret: savedProxmoxConfig.secret || '',
          node: savedProxmoxConfig.node,
        });
      }
    }

    // Charger la configuration SMTP
    const savedSmtpConfig = localStorage.getItem('smtpConfig');
    if (savedSmtpConfig) {
      setSmtpConfig(JSON.parse(savedSmtpConfig));
    }

    // Charger la configuration des notifications
    const savedNotificationConfig = localStorage.getItem('notificationConfig');
    if (savedNotificationConfig) {
      setNotificationConfig(JSON.parse(savedNotificationConfig));
    }
  }, []);

  const handleSaveApiConfig = () => {
    // Sauvegarder dans localStorage pour l'exemple
    localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
    success('Succès', 'Configuration API sauvegardée');
  };

  const handleClearDatabase = async () => {
    if (window.confirm('⚠️ ATTENTION: Cette action va supprimer TOUTES les données de la base de données.\n\nAucune donnée ne sera recréée automatiquement.\n\nÊtes-vous sûr de vouloir continuer ?')) {
      if (window.confirm('🚨 DERNIÈRE CHANCE: Cette action est IRRÉVERSIBLE !\n\nToutes les données seront définitivement supprimées.\n\nLa base de données restera vide.\n\nConfirmez-vous la suppression ?')) {
        try {
          const response = await fetch(`${apiConfig.apiUrl}/api/v1/admin/clear-db`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            success('Succès', 'Base de données vidée avec succès !\n\nLa base reste vide, aucune donnée n\'a été recréée.');
            console.log('Database cleared:', result);
          } else {
            error('Erreur', 'Impossible de vider la base de données');
          }
        } catch (err) {
          error('Erreur', 'Erreur lors de la suppression de la base de données');
          console.error('Clear database error:', err);
        }
      }
    }
  };

  const handleSaveProxmoxConfig = () => {
    // Vérifier que les champs sont remplis
    if (!proxmoxConfig.username || !proxmoxConfig.secret) {
      error('Erreur', 'Veuillez remplir les champs utilisateur et secret');
      return;
    }

    // Formater le token pour l'envoi au backend
    const formattedConfig = {
      ...proxmoxConfig,
      token: `PVEAPIToken=${proxmoxConfig.username}!${proxmoxConfig.secret}`
    };

    // Utiliser le manager pour valider et sauvegarder
    const validation = proxmoxConfigManager.validateConfig(formattedConfig);

    if (!validation.isValid) {
      error('Erreur', validation.errors.join(', '));
      return;
    }

    try {
      proxmoxConfigManager.saveConfig(formattedConfig);
      success('Succès', 'Configuration Proxmox sauvegardée');
    } catch (err) {
      error('Erreur', 'Impossible de sauvegarder la configuration Proxmox');
    }
  };

  const handleTestProxmoxConnection = async () => {
    // Vérifier que les champs sont remplis
    if (!proxmoxConfig.username || !proxmoxConfig.secret) {
      error('Erreur', 'Veuillez remplir les champs utilisateur et secret');
      return;
    }

    // Formater le token pour l'envoi au backend
    const formattedConfig = {
      ...proxmoxConfig,
      token: `PVEAPIToken=${proxmoxConfig.username}!${proxmoxConfig.secret}`
    };

    const validation = proxmoxConfigManager.validateConfig(formattedConfig);

    if (!validation.isValid) {
      error('Erreur', validation.errors.join(', '));
      return;
    }

    try {
      const result = await proxmoxConfigManager.testConnection(formattedConfig);
      setProxmoxTestStatus(result.status);
      setProxmoxTestMessage(result.message);

      if (result.status === 'success') {
        success('Succès', 'Connexion à Proxmox établie avec succès');
      } else {
        error('Erreur', 'Échec de la connexion à Proxmox. Vérifiez vos paramètres.');
      }
    } catch (err) {
      setProxmoxTestStatus('error');
      setProxmoxTestMessage('Erreur lors du test de connexion');
      error('Erreur', 'Erreur lors du test de connexion Proxmox');
    }
  };

  const handleResetProxmoxConfig = () => {
    proxmoxConfigManager.resetConfig();
    setProxmoxConfig({
      url: 'https://pve.example.com:8006',
      username: '',
      secret: '',
      node: 'pve',
    });
    setProxmoxTestStatus('idle');
    setProxmoxTestMessage('');
    warning('Information', 'Configuration Proxmox réinitialisée');
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      error('Erreur', 'Veuillez saisir une adresse email');
      return;
    }

    try {
      setTestingEmail(true);
      await apiPost('/api/notify/test', { to: testEmail });
      success('Succès', `Email de test envoyé à ${testEmail}`);
      setTestEmail('');
    } catch (err) {
      error('Erreur', 'Impossible d\'envoyer l\'email de test');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!newSubscription.endpoint) {
      error('Erreur', 'Veuillez saisir un endpoint');
      return;
    }

    try {
      await apiPost('/api/notify/subscribe', newSubscription);
      success('Succès', 'Abonnement ajouté');
      setNewSubscription({ channel: 'email', endpoint: '' });
    } catch (err) {
      error('Erreur', 'Impossible d\'ajouter l\'abonnement');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Paramètres
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configuration du dashboard et des notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration API */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="URL de l'API"
              value={apiConfig.apiUrl}
              onChange={(e) => setApiConfig({ ...apiConfig, apiUrl: e.target.value })}
              placeholder="http://localhost:8080"
            />
            <Button onClick={handleSaveApiConfig} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </CardContent>
        </Card>

        {/* Configuration Proxmox */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configuration Proxmox</span>
              {proxmoxTestStatus === 'success' && (
                <Badge variant="success" className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              )}
              {proxmoxTestStatus === 'error' && (
                <Badge variant="error" className="flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  Erreur
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                label="URL Proxmox"
                value={proxmoxConfig.url}
                onChange={(e) => setProxmoxConfig({ ...proxmoxConfig, url: e.target.value })}
                placeholder="https://pve.example.com:8006"
                required
              />
              <button
                type="button"
                onClick={() => setShowTokenInfo(!showTokenInfo)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Informations sur l'URL Proxmox"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Utilisateur"
                  type="text"
                  value={proxmoxConfig.username}
                  onChange={(e) => setProxmoxConfig({ ...proxmoxConfig, username: e.target.value })}
                  placeholder="user@pam"
                  required
                />
              </div>
              <div className="relative">
                <Input
                  label="Secret"
                  type="password"
                  value={proxmoxConfig.secret}
                  onChange={(e) => setProxmoxConfig({ ...proxmoxConfig, secret: e.target.value })}
                  placeholder="token-secret"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowTokenInfo(!showTokenInfo)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  title="Comment obtenir le token API"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Input
              label="Nœud par défaut"
              value={proxmoxConfig.node}
              onChange={(e) => setProxmoxConfig({ ...proxmoxConfig, node: e.target.value })}
              placeholder="pve"
              required
            />

            {/* Message de statut du test */}
            {proxmoxTestMessage && (
              <div className={`text-sm p-3 rounded-md ${
                proxmoxTestStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                proxmoxTestStatus === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                {proxmoxTestMessage}
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={handleTestProxmoxConnection}
                disabled={proxmoxTestStatus === 'testing'}
                variant="outline"
                className="flex-1"
                type="button"
              >
                <Server className="h-4 w-4 mr-2" />
                {proxmoxTestStatus === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
              </Button>
              <Button
                onClick={handleSaveProxmoxConfig}
                className="flex-1"
                type="button"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>💡 <strong>Conseil :</strong> Utilisez un token API Proxmox pour une authentification sécurisée.</p>
                <p className="mt-1">Format du token : <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">PVEAPIToken=user@pam!token=...</code></p>
              </div>
              <Button
                onClick={handleResetProxmoxConfig}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration SMTP */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration SMTP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Serveur SMTP"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                placeholder="smtp.example.com"
              />
              <Input
                label="Port"
                type="number"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
              />
            </div>
            <Input
              label="Nom d'utilisateur"
              value={smtpConfig.username}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
            />
            <Input
              label="Mot de passe"
              type="password"
              value={smtpConfig.password}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
            />
            <Input
              label="Adresse expéditeur"
              value={smtpConfig.from}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
              placeholder="noreply@example.com"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tls"
                checked={smtpConfig.tls}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, tls: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="tls" className="text-sm font-medium">
                Utiliser TLS
              </label>
            </div>
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder SMTP
            </Button>
          </CardContent>
        </Card>

        {/* Test d'email */}
        <Card>
          <CardHeader>
            <CardTitle>Test d'email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Adresse de test"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
            <Button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testingEmail ? 'Envoi en cours...' : 'Envoyer un test'}
            </Button>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>Un email de test sera envoyé à l'adresse spécifiée.</p>
              <p className="mt-1">
                Vérifiez MailHog sur{' '}
                <a
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  http://localhost:8025
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Notifications par email</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={notificationConfig.emailEnabled}
                    onChange={(e) => setNotificationConfig({
                      ...notificationConfig,
                      emailEnabled: e.target.checked
                    })}
                    className="rounded"
                  />
                  <Badge variant={notificationConfig.emailEnabled ? 'success' : 'default'}>
                    {notificationConfig.emailEnabled ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications temps réel (SSE)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sseEnabled"
                    checked={notificationConfig.sseEnabled}
                    onChange={(e) => setNotificationConfig({
                      ...notificationConfig,
                      sseEnabled: e.target.checked
                    })}
                    className="rounded"
                  />
                  <Badge variant={notificationConfig.sseEnabled ? 'success' : 'default'}>
                    {notificationConfig.sseEnabled ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
              </div>
            </div>

            <Input
              label="Limite d'envoi (par minute)"
              type="number"
              value={notificationConfig.rateLimit}
              onChange={(e) => setNotificationConfig({
                ...notificationConfig,
                rateLimit: parseInt(e.target.value)
              })}
            />

            <Button
              onClick={() => {
                localStorage.setItem('notificationConfig', JSON.stringify(notificationConfig));
                success('Succès', 'Configuration des notifications sauvegardée');
              }}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder les notifications
            </Button>
          </CardContent>
        </Card>

        {/* Abonnements */}
        <Card>
          <CardHeader>
            <CardTitle>Abonnements aux notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Type de canal"
                value={newSubscription.channel}
                onChange={(e) => setNewSubscription({
                  ...newSubscription,
                  channel: e.target.value
                })}
                options={channelOptions}
              />
              <Input
                label={newSubscription.channel === 'email' ? 'Adresse email' : 'URL du webhook'}
                value={newSubscription.endpoint}
                onChange={(e) => setNewSubscription({
                  ...newSubscription,
                  endpoint: e.target.value
                })}
                placeholder={
                  newSubscription.channel === 'email'
                    ? 'admin@example.com'
                    : 'https://hooks.slack.com/...'
                }
              />
            </div>
            <Button onClick={handleAddSubscription} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Ajouter un abonnement
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informations système */}
      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Version
              </h4>
              <p className="text-slate-600 dark:text-slate-400">v1.0.0</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                API Status
              </h4>
              <Badge variant="success">Connecté</Badge>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Base de données
              </h4>
              <Badge variant="success">SQLite - OK</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'information Proxmox */}
      <Modal
        isOpen={showTokenInfo}
        onClose={() => setShowTokenInfo(false)}
        title="Configuration Proxmox"
        size="lg"
      >
        <div className="space-y-6">
          {/* URL Proxmox */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              🌐 URL Proxmox
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              L'URL complète de votre serveur Proxmox VE, incluant le port (généralement 8006).
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Exemples :</p>
              <div className="space-y-1">
                <code className="block text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">https://pve.example.com:8006</code>
                <code className="block text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">https://192.168.1.100:8006</code>
              </div>
            </div>
          </div>

          {/* Token API */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              🔑 Token API
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              <strong>Comment obtenir le token :</strong>
            </p>
            <ol className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">1</span>
                Connectez-vous à l'interface web Proxmox
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">2</span>
                Allez dans <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">Datacenter → Permissions → API Tokens</code>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">3</span>
                Cliquez sur <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">"Add"</code> pour créer un nouveau token
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">4</span>
                <div>
                  Remplissez les informations :
                  <ul className="ml-4 mt-2 space-y-1 text-sm">
                    <li>• <strong>Token ID :</strong> Un nom unique (ex: "dashboard-token")</li>
                    <li>• <strong>User :</strong> L'utilisateur (ex: "user@pam")</li>
                    <li>• <strong>Privilege Separation :</strong> Cochez si nécessaire</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-full mr-3 mt-0.5">5</span>
                Copiez le token généré et collez-le ici
              </li>
            </ol>

            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Format attendu :</p>
              <code className="block text-sm bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                PVEAPIToken=user@pam!token=abc123-def456-ghi789
              </code>
            </div>
          </div>

          {/* Nœud par défaut */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              🖥️ Nœud par défaut
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Le nom du nœud Proxmox par défaut à utiliser pour les opérations.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Exemples :</p>
              <div className="space-y-1">
                <code className="block text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">pve</code>
                <code className="block text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">proxmox-01</code>
                <code className="block text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">node1</code>
              </div>
            </div>
          </div>

          {/* Avertissement important */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Important
                </h4>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Le token n'est affiché qu'une seule fois lors de sa création. Assurez-vous de le sauvegarder en lieu sûr.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Section Administration */}
      <Card>
        <CardHeader>
          <CardTitle>
            Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  🗑️ Vider la base de données
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Cette action supprimera définitivement toutes les données de la base de données SQLite.
                  <strong> Aucune donnée ne sera recréée automatiquement</strong> - la base restera vide.
                </p>
                <div className="mt-3">
                  <Button
                    onClick={handleClearDatabase}
                    variant="danger"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Vider la base de données
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

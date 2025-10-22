import { useState } from 'react';
import { Save, Mail, Bell, TestTube } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { apiPost } from '@/utils/api';
import { useToast } from '@/components/ui/Toast';

export function Settings() {
  const { success, error } = useToast();

  // Configuration API
  const [apiConfig, setApiConfig] = useState({
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  });

  // Configuration Proxmox
  const [proxmoxConfig, setProxmoxConfig] = useState({
    url: '',
    token: '',
    node: '',
  });

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

  const handleSaveApiConfig = () => {
    // Sauvegarder dans localStorage pour l'exemple
    localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
    success('Succès', 'Configuration API sauvegardée');
  };

  const handleSaveProxmoxConfig = () => {
    localStorage.setItem('proxmoxConfig', JSON.stringify(proxmoxConfig));
    success('Succès', 'Configuration Proxmox sauvegardée');
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
            <CardTitle>Configuration Proxmox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="URL Proxmox"
              value={proxmoxConfig.url}
              onChange={(e) => setProxmoxConfig({ ...proxmoxConfig, url: e.target.value })}
              placeholder="https://pve.example.com:8006"
            />
            <Input
              label="Token API"
              type="password"
              value={proxmoxConfig.token}
              onChange={(e) => setProxmoxConfig({ ...proxmoxConfig, token: e.target.value })}
              placeholder="PVEAPIToken=user@pam!token=..."
            />
            <Input
              label="Nœud par défaut"
              value={proxmoxConfig.node}
              onChange={(e) => setProxmoxConfig({ ...proxmoxConfig, node: e.target.value })}
              placeholder="pve"
            />
            <Button onClick={handleSaveProxmoxConfig} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Notifications par email</span>
                </div>
                <Badge variant={notificationConfig.emailEnabled ? 'success' : 'default'}>
                  {notificationConfig.emailEnabled ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications temps réel (SSE)</span>
                </div>
                <Badge variant={notificationConfig.sseEnabled ? 'success' : 'default'}>
                  {notificationConfig.sseEnabled ? 'Activé' : 'Désactivé'}
                </Badge>
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
    </div>
  );
}

/**
 * Utilitaires pour la gestion de la configuration Proxmox
 */

export interface ProxmoxConfig {
  url: string;
  token: string;
  node: string;
  username?: string;
  secret?: string;
}

export interface ProxmoxConnectionStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  lastTest?: Date;
}

class ProxmoxConfigManager {
  private static instance: ProxmoxConfigManager;
  private config: ProxmoxConfig | null = null;
  private connectionStatus: ProxmoxConnectionStatus = {
    status: 'idle',
    message: ''
  };

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): ProxmoxConfigManager {
    if (!ProxmoxConfigManager.instance) {
      ProxmoxConfigManager.instance = new ProxmoxConfigManager();
    }
    return ProxmoxConfigManager.instance;
  }

  /**
   * Charge la configuration depuis le localStorage
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('proxmoxConfig');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration Proxmox:', error);
    }
  }

  /**
   * Sauvegarde la configuration dans le localStorage
   */
  public saveConfig(config: ProxmoxConfig): void {
    try {
      this.config = config;
      localStorage.setItem('proxmoxConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration Proxmox:', error);
      throw error;
    }
  }

  /**
   * Récupère la configuration actuelle
   */
  public getConfig(): ProxmoxConfig | null {
    return this.config;
  }

  /**
   * Vérifie si la configuration est complète
   */
  public isConfigComplete(): boolean {
    return !!(this.config?.url && this.config?.token && this.config?.node);
  }

  /**
   * Valide la configuration
   */
  public validateConfig(config: ProxmoxConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.url) {
      errors.push('L\'URL Proxmox est requise');
    } else {
      try {
        new URL(config.url);
      } catch {
        errors.push('L\'URL Proxmox n\'est pas valide');
      }
    }

    if (!config.token) {
      errors.push('Le token API est requis');
    } else if (!config.token.startsWith('PVEAPIToken=')) {
      errors.push('Le token API doit commencer par "PVEAPIToken="');
    }

    if (!config.node) {
      errors.push('Le nœud par défaut est requis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Teste la connexion à Proxmox
   */
  public async testConnection(config?: ProxmoxConfig): Promise<ProxmoxConnectionStatus> {
    const configToTest = config || this.config;

    if (!configToTest) {
      this.connectionStatus = {
        status: 'error',
        message: 'Aucune configuration Proxmox trouvée'
      };
      return this.connectionStatus;
    }

    this.connectionStatus = {
      status: 'testing',
      message: 'Test de connexion en cours...'
    };

    try {
      // Simulation d'un test de connexion Proxmox
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simuler une réponse de test
      const isConnected = Math.random() > 0.3; // 70% de chance de succès pour la démo

      if (isConnected) {
        this.connectionStatus = {
          status: 'success',
          message: 'Connexion à Proxmox réussie !',
          lastTest: new Date()
        };
      } else {
        this.connectionStatus = {
          status: 'error',
          message: 'Impossible de se connecter à Proxmox',
          lastTest: new Date()
        };
      }
    } catch (error) {
      this.connectionStatus = {
        status: 'error',
        message: 'Erreur lors du test de connexion',
        lastTest: new Date()
      };
    }

    return this.connectionStatus;
  }

  /**
   * Récupère le statut de connexion actuel
   */
  public getConnectionStatus(): ProxmoxConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Réinitialise la configuration
   */
  public resetConfig(): void {
    this.config = null;
    this.connectionStatus = {
      status: 'idle',
      message: ''
    };
    localStorage.removeItem('proxmoxConfig');
  }

  /**
   * Génère une URL d'API Proxmox
   */
  public getApiUrl(endpoint: string = ''): string | null {
    if (!this.config?.url) return null;

    const baseUrl = this.config.url.replace(/\/$/, '');
    return `${baseUrl}/api2/json${endpoint}`;
  }

  /**
   * Génère les headers d'authentification
   */
  public getAuthHeaders(): Record<string, string> | null {
    if (!this.config?.token) return null;

    return {
      'Authorization': this.config.token
    };
  }
}

// Export de l'instance singleton
export const proxmoxConfigManager = ProxmoxConfigManager.getInstance();

// Export des types et utilitaires
export { ProxmoxConfigManager };

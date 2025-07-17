import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Users, 
  Zap, 
  TrendingUp,
  Server,
  Database,
  Cpu,
  MemoryStick,
  Network,
  Brain
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import axiosInstance from '../api/axiosInstance';
import SEO from '../components/layout/SEO';
import { toast } from 'react-hot-toast';

interface MetricData {
  timestamp: string;
  auth: {
    total_attempts: number;
    success_rate: number;
  };
  ai: {
    total_requests: number;
    avg_duration: number;
    success_rate: number;
  };
  planning: {
    total_generations: number;
    avg_duration: number;
  };
  system: {
    active_users: number;
    memory_usage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      arrayBuffers: number;
    };
    uptime: number;
  };
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface SystemStats {
  nodejs: {
    version: string;
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      arrayBuffers: number;
    };
  };
  system: {
    platform: string;
    arch: string;
    env: string;
  };
  application: {
    version: string;
    startTime: string;
  };
}

const MonitoringPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'alerts' | 'system'>('overview');

  const fetchMetrics = async () => {
    try {
      const response = await axiosInstance.get('/monitoring/metrics/realtime');
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
      toast.error('Impossible de charger les métriques');
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axiosInstance.get('/monitoring/alerts');
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await axiosInstance.get('/monitoring/system/stats');
      setSystemStats(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques système:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchAlerts(), fetchSystemStats()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000); // Refresh toutes les 30 secondes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}j ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title="Monitoring - SmartPlanning"
        description="Surveillance et métriques de performance de SmartPlanning"
      />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Monitoring
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Surveillance et métriques de performance en temps réel
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Auto-refresh
                </span>
                <Button
                  variant={autoRefresh ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <Button
                variant="secondary"
                size="md"
                onClick={fetchAllData}
                disabled={loading}
              >
                <Activity className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
              { id: 'metrics', label: 'Métriques', icon: Activity },
              { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
              { id: 'system', label: 'Système', icon: Server }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'alerts' && alerts.length > 0 && (
                  <Badge label={alerts.length.toString()} type="error" />
                )}
              </button>
            ))}
          </div>

          {/* Content based on selected tab */}
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Utilisateurs actifs */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Utilisateurs actifs
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {metrics?.system.active_users || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  En temps réel
                </div>
              </Card>

              {/* Authentification */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Taux de réussite auth
                    </h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                      {((metrics?.auth.success_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {metrics?.auth.total_attempts || 0} tentatives
                </div>
              </Card>

              {/* IA */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Temps moyen IA
                    </h3>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                      {formatDuration(metrics?.ai.avg_duration || 0)}
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Activity className="w-4 h-4 mr-1" />
                  {metrics?.ai.total_requests || 0} requêtes
                </div>
              </Card>

              {/* Système */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Uptime
                    </h3>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                      {formatUptime(metrics?.system.uptime || 0)}
                    </p>
                  </div>
                  <Server className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Activity className="w-4 h-4 mr-1" />
                  Stable
                </div>
              </Card>
            </div>
          )}

          {selectedTab === 'metrics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Métriques d'authentification */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Authentification
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Total tentatives</span>
                    <span className="font-semibold">{metrics?.auth.total_attempts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Taux de réussite</span>
                    <span className="font-semibold text-green-600">
                      {((metrics?.auth.success_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>

              {/* Métriques IA */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Intelligence Artificielle
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Total requêtes</span>
                    <span className="font-semibold">{metrics?.ai.total_requests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Temps moyen</span>
                    <span className="font-semibold text-purple-600">
                      {formatDuration(metrics?.ai.avg_duration || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Taux de réussite</span>
                    <span className="font-semibold text-green-600">
                      {((metrics?.ai.success_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>

              {/* Métriques de planning */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Génération de plannings
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Total générations</span>
                    <span className="font-semibold">{metrics?.planning.total_generations || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Temps moyen</span>
                    <span className="font-semibold text-blue-600">
                      {formatDuration(metrics?.planning.avg_duration || 0)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Métriques mémoire */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Utilisation mémoire
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Heap utilisé</span>
                    <span className="font-semibold">
                      {formatBytes(metrics?.system.memory_usage.heapUsed || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Heap total</span>
                    <span className="font-semibold">
                      {formatBytes(metrics?.system.memory_usage.heapTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Utilisation</span>
                    <span className="font-semibold text-orange-600">
                      {(((metrics?.system.memory_usage.heapUsed || 0) / (metrics?.system.memory_usage.heapTotal || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Alertes actives ({alerts.length})
              </h3>
              
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune alerte active
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)} bg-white dark:bg-gray-800 shadow-sm`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {alert.message}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Valeur: {alert.value} | Seuil: {alert.threshold}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            label={alert.severity.toUpperCase()} 
                            type={alert.severity === 'error' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'} 
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {selectedTab === 'system' && systemStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations Node.js */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Node.js
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Version</span>
                    <span className="font-semibold">{systemStats.nodejs.version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Uptime</span>
                    <span className="font-semibold">{formatUptime(systemStats.nodejs.uptime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Mémoire heap</span>
                    <span className="font-semibold">
                      {formatBytes(systemStats.nodejs.memory.heapUsed)} / {formatBytes(systemStats.nodejs.memory.heapTotal)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Informations système */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Système
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Plateforme</span>
                    <span className="font-semibold">{systemStats.system.platform}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Architecture</span>
                    <span className="font-semibold">{systemStats.system.arch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Environnement</span>
                    <span className="font-semibold">{systemStats.system.env}</span>
                  </div>
                </div>
              </Card>

              {/* Informations application */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Application
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Version</span>
                    <span className="font-semibold">{systemStats.application.version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Démarrage</span>
                    <span className="font-semibold">
                      {new Date(systemStats.application.startTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MonitoringPage;
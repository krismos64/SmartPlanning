import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search,
  Clock,
  Route,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-hot-toast';

interface ValidationMetrics {
  total_errors: number;
  body_errors: number;
  params_errors: number;
  query_errors: number;
  by_route: {
    [route: string]: {
      body: number;
      params: number;
      query: number;
      total: number;
    };
  };
}

interface ValidationError {
  id: string;
  timestamp: string;
  route: string;
  type: 'body' | 'params' | 'query';
  schema: string;
  count: number;
}

interface ZodValidationDashboardProps {
  className?: string;
}

const ZodValidationDashboard: React.FC<ZodValidationDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'body' | 'params' | 'query'>('all');
  const [sortBy, setSortBy] = useState<'route' | 'total' | 'body' | 'params' | 'query'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchValidationMetrics = async () => {
    try {
      const response = await axiosInstance.get('/monitoring/metrics/realtime');
      setMetrics(response.data.validation);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques de validation:', error);
      toast.error('Impossible de charger les métriques de validation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationMetrics();
    const interval = setInterval(fetchValidationMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Préparer les données pour le graphique à barres
  const prepareChartData = () => {
    if (!metrics || !metrics.by_route) return [];
    
    return Object.entries(metrics.by_route)
      .map(([route, data]) => ({
        route: route.replace('/api/', ''),
        body: data.body,
        params: data.params,
        query: data.query,
        total: data.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 routes avec le plus d'erreurs
  };

  // Préparer les données pour le tableau
  const prepareTableData = () => {
    if (!metrics || !metrics.by_route) return [];
    
    const data = Object.entries(metrics.by_route)
      .map(([route, routeData]) => ({
        route,
        body: routeData.body,
        params: routeData.params,
        query: routeData.query,
        total: routeData.total
      }))
      .filter(item => {
        // Filtrer par terme de recherche
        const matchesSearch = item.route.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtrer par type
        const matchesType = selectedType === 'all' || 
          (selectedType === 'body' && item.body > 0) ||
          (selectedType === 'params' && item.params > 0) ||
          (selectedType === 'query' && item.query > 0);
        
        return matchesSearch && matchesType && item.total > 0;
      })
      .sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        
        if (sortBy === 'route') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    
    return data;
  };

  const chartData = prepareChartData();
  const tableData = prepareTableData();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'body': return '#3B82F6'; // Blue
      case 'params': return '#10B981'; // Green  
      case 'query': return '#F59E0B'; // Yellow
      default: return '#6B7280'; // Gray
    }
  };

  const getSeverityBadge = (total: number) => {
    if (total >= 50) return <Badge label="Critique" type="error" />;
    if (total >= 20) return <Badge label="Élevé" type="warning" />;
    if (total >= 5) return <Badge label="Modéré" type="warning" />;
    return <Badge label="Faible" type="info" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const showAlert = metrics && metrics.total_errors > 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alerte contextuelle */}
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Seuil d'erreurs dépassé
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Le nombre d'erreurs de validation a dépassé le seuil de 100 ({metrics?.total_errors}). 
                Vérifiez vos formulaires côté client.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total erreurs</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {metrics?.total_errors || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Erreurs Body</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics?.body_errors || 0}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Erreurs Params</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics?.params_errors || 0}
              </p>
            </div>
            <Route className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Erreurs Query</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {metrics?.query_errors || 0}
              </p>
            </div>
            <Search className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Graphique à barres */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top 10 des routes avec erreurs
          </h3>
          <BarChart3 className="w-5 h-5 text-gray-500" />
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="route" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="body" fill="#3B82F6" name="Body" />
              <Bar dataKey="params" fill="#10B981" name="Params" />
              <Bar dataKey="query" fill="#F59E0B" name="Query" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune erreur de validation détectée
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Tableau détaillé */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Erreurs par route
          </h3>
          <div className="flex items-center space-x-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une route..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtre par type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="body">Body</option>
              <option value="params">Params</option>
              <option value="query">Query</option>
            </select>

            {/* Actualiser */}
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={fetchValidationMetrics}
              disabled={loading}
            >
              <Clock className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {tableData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (sortBy === 'route') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('route');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    Route
                    {sortBy === 'route' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (sortBy === 'total') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('total');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Total
                    {sortBy === 'total' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (sortBy === 'body') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('body');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Body
                    {sortBy === 'body' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (sortBy === 'params') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('params');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Params
                    {sortBy === 'params' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (sortBy === 'query') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('query');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Query
                    {sortBy === 'query' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Sévérité
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <motion.tr
                    key={item.route}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {item.route}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.total}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-blue-600 dark:text-blue-400">
                        {item.body}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-green-600 dark:text-green-400">
                        {item.params}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-yellow-600 dark:text-yellow-400">
                        {item.query}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div data-testid="severity-badge">
                        {getSeverityBadge(item.total)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || selectedType !== 'all' 
                ? 'Aucune erreur trouvée avec les filtres actuels' 
                : 'Aucune erreur de validation détectée'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ZodValidationDashboard;
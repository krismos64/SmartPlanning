import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { stripeService, PaymentData } from '../../services/stripe.service';
import toast from 'react-hot-toast';

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    limit: 20,
    offset: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
  });

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await stripeService.getPaymentHistory(filter);
      
      if (filter.offset === 0) {
        setPayments(response.payments);
      } else {
        setPayments(prev => [...prev, ...response.payments]);
      }
      
      setPagination({
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
      });
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
      toast.error('Impossible de charger l\'historique des paiements');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: Partial<typeof filter>) => {
    setFilter(prev => ({
      ...prev,
      ...newFilter,
      offset: 0, // Reset offset when changing filters
    }));
  };

  const loadMore = () => {
    setFilter(prev => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const getStatusIcon = (status: PaymentData['status']) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
      case 'canceled':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'refunded':
      case 'partially_refunded':
        return <RefreshCw size={16} className="text-blue-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusText = (status: PaymentData['status']) => {
    const statusMap = {
      pending: 'En attente',
      succeeded: 'Réussi',
      failed: 'Échoué',
      canceled: 'Annulé',
      refunded: 'Remboursé',
      partially_refunded: 'Partiellement remboursé',
    };
    return statusMap[status] || status;
  };

  const getTypeText = (type: PaymentData['type']) => {
    const typeMap = {
      subscription: 'Abonnement',
      setup: 'Configuration',
      invoice: 'Facture',
      one_time: 'Paiement unique',
    };
    return typeMap[type] || type;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Historique des paiements
        </h3>
        
        <div className="flex items-center gap-3">
          <select
            value={filter.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="succeeded">Réussi</option>
            <option value="failed">Échoué</option>
            <option value="pending">En attente</option>
            <option value="refunded">Remboursé</option>
          </select>
          
          <select
            value={filter.type}
            onChange={(e) => handleFilterChange({ type: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="subscription">Abonnement</option>
            <option value="invoice">Facture</option>
            <option value="one_time">Paiement unique</option>
          </select>
        </div>
      </div>

      {loading && payments.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Chargement des paiements...</p>
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-3">
            <Download size={48} className="mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucun paiement trouvé
          </h4>
          <p className="text-gray-600">
            Il n'y a aucun paiement correspondant à vos critères de recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(payment.status)}
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {formatAmount(payment.amount, payment.currency)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {getTypeText(payment.type)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{getStatusText(payment.status)}</span>
                    <span>{formatDate(payment.createdAt)}</span>
                  </div>
                  
                  {payment.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {payment.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {payment.receiptUrl && (
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Voir le reçu"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </motion.div>
          ))}

          {/* Bouton "Charger plus" */}
          {pagination.hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Charger plus
                  </>
                )}
              </button>
            </div>
          )}

          {/* Résumé */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <p className="text-sm text-gray-600 text-center">
              {payments.length} paiement{payments.length > 1 ? 's' : ''} affiché{payments.length > 1 ? 's' : ''} 
              {pagination.total > payments.length && ` sur ${pagination.total} au total`}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentHistory;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import PricingCard from './PricingCard';
import PaymentHistory from './PaymentHistory';
import { PricingPlan, PRICING_PLANS } from '../../config/stripe.config';
import { stripeService, BillingInfo, SubscriptionData } from '../../services/stripe.service';
import { getStripe } from '../../config/stripe.config';
import toast from 'react-hot-toast';

const BillingDashboard: React.FC = () => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  useEffect(() => {
    loadBillingInfo();
    
    // Vérifier les paramètres URL pour les redirections Stripe
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success('Paiement réussi ! Votre plan a été mis à jour.');
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast.error('Paiement annulé.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadBillingInfo = async () => {
    try {
      setLoading(true);
      const info = await stripeService.getBillingInfo();
      setBillingInfo(info);
    } catch (error) {
      console.error('Erreur chargement facturation:', error);
      toast.error('Impossible de charger les informations de facturation');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan === 'free') {
      // Downgrade vers le plan gratuit
      if (confirm('Êtes-vous sûr de vouloir passer au plan gratuit ? Vous perdrez l\'accès aux fonctionnalités premium.')) {
        await handlePlanChange(plan);
      }
      return;
    }

    try {
      setActionLoading(plan);
      
      // Créer une session de checkout
      const session = await stripeService.createCheckoutSession(plan);
      
      // Rediriger vers Stripe Checkout
      const stripe = await getStripe();
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: session.sessionId,
        });
        
        if (error) {
          console.error('Erreur redirection Stripe:', error);
          toast.error('Erreur lors de la redirection vers le paiement');
        }
      }
    } catch (error) {
      console.error('Erreur sélection plan:', error);
      toast.error('Impossible de créer la session de paiement');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlanChange = async (plan: PricingPlan) => {
    try {
      setActionLoading(plan);
      await stripeService.updateSubscription(plan);
      await loadBillingInfo();
      toast.success('Plan mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur changement plan:', error);
      toast.error('Impossible de mettre à jour le plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Il restera actif jusqu\'à la fin de la période de facturation.')) {
      return;
    }

    try {
      setActionLoading('cancel');
      await stripeService.cancelSubscription(true);
      await loadBillingInfo();
      toast.success('Abonnement annulé. Il restera actif jusqu\'à la fin de la période.');
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error('Impossible d\'annuler l\'abonnement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncSubscription = async () => {
    try {
      setActionLoading('sync');
      await stripeService.syncSubscription();
      await loadBillingInfo();
      toast.success('Données synchronisées !');
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      toast.error('Impossible de synchroniser les données');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des informations de facturation...</p>
        </div>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 mb-4">
          Impossible de charger les informations de facturation
        </p>
        <button
          onClick={loadBillingInfo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturation</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre abonnement et consultez votre historique de paiements
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncSubscription}
            disabled={actionLoading === 'sync'}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={actionLoading === 'sync' ? 'animate-spin' : ''} />
            Synchroniser
          </button>
        </div>
      </div>

      {/* Informations actuelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan actuel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings size={24} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Plan actuel</h3>
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-bold text-blue-600">
              {PRICING_PLANS[billingInfo.company.plan].name}
            </p>
            <p className="text-gray-600">
              {PRICING_PLANS[billingInfo.company.plan].description}
            </p>
            
            {billingInfo.subscription?.status && (
              <div className="mt-3">
                <span className={`
                  inline-block px-2 py-1 rounded-full text-xs font-medium
                  ${billingInfo.subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : billingInfo.subscription.status === 'canceled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }
                `}>
                  {billingInfo.subscription.status === 'active' && 'Actif'}
                  {billingInfo.subscription.status === 'canceled' && 'Annulé'}
                  {billingInfo.subscription.status === 'past_due' && 'Paiement en retard'}
                  {billingInfo.subscription.status === 'trialing' && 'Période d\'essai'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Prochain paiement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={24} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Prochain paiement</h3>
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatDate(billingInfo.nextPayment)}
            </p>
            <p className="text-gray-600">
              {billingInfo.nextPayment 
                ? `${PRICING_PLANS[billingInfo.company.plan].price}€`
                : 'Aucun paiement prévu'
              }
            </p>
            
            {billingInfo.subscription?.cancelAtPeriodEnd && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Abonnement annulé - se terminera le {formatDate(billingInfo.subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={24} className="text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total dépensé</p>
              <p className="text-xl font-bold text-gray-900">
                {billingInfo.paymentStats.totalRevenue.toFixed(2)}€
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nombre de paiements</p>
              <p className="text-lg font-semibold text-gray-900">
                {billingInfo.paymentStats.totalPayments}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      {billingInfo.subscription && billingInfo.company.plan !== 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPaymentHistory(!showPaymentHistory)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <CreditCard size={16} />
              Historique des paiements
            </button>
            
            {!billingInfo.subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'cancel' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AlertCircle size={16} />
                )}
                Annuler l'abonnement
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Historique des paiements */}
      {showPaymentHistory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <PaymentHistory />
        </motion.div>
      )}

      {/* Plans disponibles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Changer de plan
          </h2>
          <p className="text-gray-600">
            Mettez à niveau ou modifiez votre plan selon vos besoins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(PRICING_PLANS) as PricingPlan[]).map((plan) => (
            <PricingCard
              key={plan}
              plan={plan}
              currentPlan={billingInfo.company.plan}
              onSelectPlan={handleSelectPlan}
              loading={actionLoading === plan}
              disabled={!!actionLoading}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default BillingDashboard;
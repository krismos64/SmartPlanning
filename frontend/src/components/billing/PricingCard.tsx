import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { PricingPlan, PRICING_PLANS, formatPlanPrice } from '../../config/stripe.config';

interface PricingCardProps {
  plan: PricingPlan;
  currentPlan?: PricingPlan;
  onSelectPlan: (plan: PricingPlan) => void;
  loading?: boolean;
  disabled?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  currentPlan,
  onSelectPlan,
  loading = false,
  disabled = false,
}) => {
  const planInfo = PRICING_PLANS[plan];
  const isCurrentPlan = currentPlan === plan;
  const isPopular = planInfo.popular;

  const handleSelectPlan = () => {
    if (!disabled && !loading && !isCurrentPlan) {
      onSelectPlan(plan);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) {
      return 'Plan actuel';
    }
    if (plan === 'free') {
      return 'Plan gratuit';
    }
    return 'Choisir ce plan';
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) {
      return 'bg-gray-100 text-gray-600 cursor-not-allowed';
    }
    if (isPopular) {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
    return 'bg-gray-900 hover:bg-gray-800 text-white';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300
        ${isPopular ? 'border-blue-500 scale-105' : 'border-gray-200'}
        ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
        hover:shadow-xl
      `}
    >
      {/* Badge populaire */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1">
            <Star size={16} className="fill-current" />
            Populaire
          </div>
        </div>
      )}

      {/* Badge plan actuel */}
      {isCurrentPlan && (
        <div className="absolute -top-4 right-4">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Plan actuel
          </div>
        </div>
      )}

      <div className="p-6">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {planInfo.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {planInfo.description}
          </p>
          
          {/* Prix */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold text-gray-900">
                {planInfo.price}
              </span>
              <span className="text-xl text-gray-600 ml-1">
                {planInfo.currency}
              </span>
              {planInfo.price > 0 && (
                <span className="text-gray-500 ml-1">
                  /{planInfo.interval}
                </span>
              )}
            </div>
            {planInfo.price === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Aucun engagement
              </p>
            )}
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="mb-6">
          <ul className="space-y-3">
            {planInfo.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check 
                  size={20} 
                  className="text-green-500 mt-0.5 flex-shrink-0" 
                />
                <span className="text-gray-700 text-sm">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bouton d'action */}
        <button
          onClick={handleSelectPlan}
          disabled={disabled || loading || isCurrentPlan}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${getButtonVariant()}
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : (
            getButtonText()
          )}
        </button>

        {/* Message d'information */}
        <div className="text-center mt-3 space-y-1">
          {plan !== 'free' && (
            <p className="text-xs text-gray-500">
              Paiement sécurisé via Stripe
            </p>
          )}
          <p className="text-xs text-green-600 font-medium">
            ✓ Sans engagement • Annulation en 1 clic
          </p>
          {plan !== 'free' && (
            <p className="text-xs text-blue-600">
              📅 Prélèvement mensuel le {new Date().getDate()} de chaque mois
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PricingCard;
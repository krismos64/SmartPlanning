import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Check, ArrowRight, Shield, Star, Moon, Sun } from 'lucide-react';
import PricingCard from '../components/billing/PricingCard';
import { PricingPlan, PRICING_PLANS } from '../config/stripe.config';
import { stripeService } from '../services/stripe.service';
import { getStripe } from '../config/stripe.config';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const ChoosePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PricingPlan>('free');

  useEffect(() => {
    // Vérifier le plan actuel de l'utilisateur
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const subscription = await stripeService.getCurrentSubscription();
      if (subscription) {
        setCurrentPlan(subscription.plan);
      }
    } catch (error) {
      console.error('Erreur chargement plan:', error);
    }
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan === 'free') {
      // Rediriger vers le dashboard pour le plan gratuit
      navigate('/dashboard');
      return;
    }

    try {
      setLoading(plan);
      
      // Créer une session de checkout
      const session = await stripeService.createCheckoutSession(
        plan,
        `${window.location.origin}/dashboard/billing?success=true&plan=${plan}`,
        `${window.location.origin}/choose-plan?canceled=true`
      );
      
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
      setLoading(null);
    }
  };

  const handleContinueWithCurrent = () => {
    navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Header avec navigation similaire à la page d'inscription */}
      <nav className={`${theme === 'dark' ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-lg opacity-50 animate-pulse"></div>
                <div className={`relative ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-2 rounded-lg shadow-lg`}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2L2 9V23L16 30L30 23V9L16 2Z" className="fill-blue-600" />
                    <path d="M16 2V30" stroke="white" strokeWidth="2" />
                    <path d="M2 9L16 16L30 9" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
              </div>
              <span className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                SmartPlanning
              </span>
            </Link>
            
            {/* Navigation centrale - vide pour cette page */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Espace réservé pour cohérence visuelle */}
            </div>
            
            {/* Actions à droite */}
            <div className="flex items-center space-x-4">
              {/* Bouton toggle thème */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {/* Bouton connexion */}
              <Link
                to="/login"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Connexion
              </Link>
              
              {/* Bouton continuer avec plan actuel */}
              <button
                onClick={handleContinueWithCurrent}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                } shadow-lg transform hover:scale-105`}
              >
                Continuer avec le plan actuel →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className={`text-4xl md:text-6xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
              Choisissez votre{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                plan parfait
              </span>
            </h1>
            
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-3xl mx-auto`}>
              Commencez gratuitement et évoluez selon vos besoins. 
              Tous nos plans incluent une période d'essai de 14 jours.
            </p>

            <div className={`flex items-center justify-center gap-6 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-green-500" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                <span>Annulation en 1 clic</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-green-500" />
                <span>Support 7j/7</span>
              </div>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {(Object.keys(PRICING_PLANS) as PricingPlan[]).map((plan, index) => (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <PricingCard
                  plan={plan}
                  currentPlan={currentPlan}
                  onSelectPlan={handleSelectPlan}
                  loading={loading === plan}
                  disabled={!!loading}
                />
              </motion.div>
            ))}
          </div>

          {/* Garanties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={`${theme === 'dark' ? 'bg-gray-800/60 border-gray-700' : 'bg-white/60 border-gray-200'} backdrop-blur-sm rounded-2xl p-8 border`}
          >
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 text-center`}>
              Nos garanties
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-green-600" size={24} />
                </div>
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Sans engagement
                </h4>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  Résiliez votre abonnement à tout moment en un clic. 
                  Aucune pénalité ni frais cachés.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-blue-600" size={24} />
                </div>
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Paiement sécurisé
                </h4>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  Tous les paiements sont sécurisés par Stripe. 
                  Vos données bancaires ne sont jamais stockées.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="text-purple-600" size={24} />
                </div>
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Support premium
                </h4>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  Notre équipe est disponible 7j/7 pour vous accompagner 
                  dans votre utilisation de SmartPlanning.
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Final */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-16"
          >
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Vous hésitez encore ? Commencez par notre plan gratuit !
            </p>
            
            <button
              onClick={() => handleSelectPlan('free')}
              disabled={currentPlan === 'free' || !!loading}
              className={`${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gray-900 hover:bg-gray-800'} text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg`}
            >
              {currentPlan === 'free' ? 'Plan actuel' : 'Commencer gratuitement'}
              {currentPlan !== 'free' && <ArrowRight size={16} />}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChoosePlanPage;
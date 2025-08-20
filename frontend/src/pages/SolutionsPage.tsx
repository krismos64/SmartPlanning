import React from "react";
import SEO from "../components/layout/SEO";
import { Link } from "react-router-dom";
import { 
  Brain, 
  Clock, 
  Users, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Star,
  Trophy
} from "lucide-react";

/**
 * Page Solutions - Hub principal pour le SEO
 * Optimisée pour les mots-clés "logiciel planning RH" et dérivés
 */
const SolutionsPage: React.FC = () => {
  return (
    <>
      <SEO
        title="🥇 Solutions Planning RH | Logiciel N°1 Gestion Équipe France - SmartPlanning"
        description="Découvrez SmartPlanning, le logiciel de planning RH révolutionnaire français. AdvancedSchedulingEngine 99.97% plus rapide. Planning équipe IA, gestion congés automatique, conformité légale. Solution SaaS planning entreprise."
        keywords="solutions logiciel planning RH, logiciel gestion équipe france, planning RH français, SaaS planning entreprise, AdvancedSchedulingEngine, logiciel planning révolutionnaire"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section Optimisée SEO */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Trophy className="w-4 h-4 mr-2" />
              Solution N°1 en France
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Solutions Planning RH
              <span className="block text-3xl md:text-4xl mt-4">Révolutionnaires</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              <strong>SmartPlanning</strong> transforme la gestion de vos équipes avec l'<strong>AdvancedSchedulingEngine</strong>, 
              notre moteur de planification personnalisé <strong>99.97% plus rapide</strong> que toute solution concurrente. 
              Génération de planning en <strong>2-5ms</strong> avec conformité légale intégrée.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="bg-white rounded-lg px-6 py-3 shadow-lg border border-green-200">
                <div className="flex items-center text-green-600">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Génération 2-5ms</span>
                </div>
              </div>
              <div className="bg-white rounded-lg px-6 py-3 shadow-lg border border-blue-200">
                <div className="flex items-center text-blue-600">
                  <Brain className="w-5 h-5 mr-2" />
                  <span className="font-semibold">IA Française</span>
                </div>
              </div>
              <div className="bg-white rounded-lg px-6 py-3 shadow-lg border border-purple-200">
                <div className="flex items-center text-purple-600">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="font-semibold">RGPD Natif</span>
                </div>
              </div>
            </div>
            
            <Link 
              to="/inscription"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Démarrer Gratuitement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        {/* Solutions Cards */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">
              Nos Solutions Logiciel Planning RH
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Solution 1: Planning IA */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Planning Équipe IA
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  <strong>AdvancedSchedulingEngine</strong> révolutionnaire pour générer automatiquement 
                  les plannings d'équipe en 2-5ms. Intelligence artificielle française avec 
                  conformité légale intégrée.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Génération ultra-rapide 2-5ms
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    3 stratégies intelligentes
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Conformité légale automatique
                  </li>
                </ul>
                <Link 
                  to="/solutions/planning-equipe-ia"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  En savoir plus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              {/* Solution 2: Gestion Congés */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Gestion Congés Automatique
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Système complet de gestion des <strong>congés et absences</strong> avec validation 
                  automatique, planification anticipée et respect du droit du travail français.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    5 types d'absences gérés
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Validation workflow automatisé
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Conformité Code du Travail
                  </li>
                </ul>
                <Link 
                  to="/solutions/gestion-conges-automatique"
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  En savoir plus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              {/* Solution 3: SaaS Entreprise */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  SaaS Planning Entreprise
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  <strong>Logiciel planning entreprise</strong> multi-secteurs (commerce, restauration, 
                  bureau) avec monitoring temps réel, analytics avancés et sécurité RGPD native.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Multi-entreprises sécurisé
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Analytics & monitoring
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    API intégration complète
                  </li>
                </ul>
                <Link 
                  to="/contact"
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
                >
                  Démonstration
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">
              Performance Révolutionnaire Mesurée
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="bg-white/20 rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">99.97%</div>
                <p className="text-blue-100">Plus rapide que concurrence</p>
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">2-5ms</div>
                <p className="text-blue-100">Génération planning</p>
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">15/15</div>
                <p className="text-blue-100">Tests sécurité réussis</p>
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">100%</div>
                <p className="text-blue-100">Conformité légale</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">
              Prêt à Révolutionner Votre Gestion RH ?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Rejoignez les entreprises françaises qui font confiance à SmartPlanning 
              pour optimiser leurs plannings avec notre AdvancedSchedulingEngine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/inscription"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                Commencer Maintenant
              </Link>
              <Link
                to="/contact"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              >
                Demander une Démo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SolutionsPage;
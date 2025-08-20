import React from "react";
import SEO from "../../components/layout/SEO";
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
  Trophy,
  Target,
  Settings,
  BarChart3,
  Calendar,
  UserCheck,
  Award
} from "lucide-react";

/**
 * Page Logiciel Planning RH - Page pilier SEO
 * Optimisée pour "logiciel planning rh", "logiciel gestion planning", etc.
 */
const LogicielPlanningRHPage: React.FC = () => {
  return (
    <>
      <SEO
        title="🥇 Logiciel Planning RH N°1 France | Gestion Planning Équipe IA - SmartPlanning"
        description="Logiciel planning RH révolutionnaire français. AdvancedSchedulingEngine 99.97% plus rapide. Planning équipe automatique 2-5ms, gestion congés, conformité légale. Solution RH innovante Made in France."
        keywords="logiciel planning rh, logiciel gestion planning, planning rh automatique, logiciel planning équipe, gestion planning entreprise, planning rh français, logiciel rh planning, solution planning rh"
        canonicalUrl="https://smartplanning.fr/solutions/logiciel-planning-rh"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section SEO Optimisée */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-8">
                <Trophy className="w-5 h-5 mr-2" />
                Logiciel Planning RH N°1 en France
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
                Logiciel Planning RH
                <span className="block text-4xl md:text-5xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                  Révolutionnaire
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
                <strong>SmartPlanning</strong> est le <strong>logiciel de planning RH</strong> français le plus avancé. 
                Notre <strong>AdvancedSchedulingEngine</strong> génère vos plannings d'équipe en <strong>2-5 millisecondes</strong>, 
                soit <strong>99.97% plus rapide</strong> que toute solution concurrente. Conformité légale française intégrée.
              </p>

              <div className="grid md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
                  <Zap className="w-8 h-8 text-blue-600 mb-3" />
                  <div className="text-2xl font-bold text-gray-800">2-5ms</div>
                  <p className="text-gray-600">Génération Planning</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
                  <Target className="w-8 h-8 text-green-600 mb-3" />
                  <div className="text-2xl font-bold text-gray-800">99.97%</div>
                  <p className="text-gray-600">Plus Rapide</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                  <Shield className="w-8 h-8 text-purple-600 mb-3" />
                  <div className="text-2xl font-bold text-gray-800">15/15</div>
                  <p className="text-gray-600">Tests Sécurité</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
                  <Award className="w-8 h-8 text-orange-600 mb-3" />
                  <div className="text-2xl font-bold text-gray-800">100%</div>
                  <p className="text-gray-600">Conformité</p>
                </div>
              </div>

              <Link 
                to="/inscription"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Essayer Gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pourquoi Choisir Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
              Pourquoi Choisir Notre Logiciel Planning RH ?
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-gray-800">
                  AdvancedSchedulingEngine : La Révolution Française
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Notre <strong>moteur de planification personnalisé</strong> développé en France 
                  révolutionne la <strong>gestion planning RH</strong>. Fini les attentes de 15-30 secondes 
                  des solutions IA externes : générez vos plannings en <strong>2-5 millisecondes</strong>.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Performance Native</h4>
                      <p className="text-gray-600">Aucune dépendance API externe, fiabilité 100%</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">3 Stratégies Intelligentes</h4>
                      <p className="text-gray-600">Distribution, préférences, concentration optimisée</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Conformité Légale Intégrée</h4>
                      <p className="text-gray-600">11h repos, pauses déjeuner, Code du Travail</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                <h4 className="text-2xl font-bold mb-6">Performance Mesurée</h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span>Solutions IA concurrentes</span>
                    <span className="bg-red-500 px-3 py-1 rounded-full text-sm">15-30s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SmartPlanning AdvancedEngine</span>
                    <span className="bg-green-500 px-3 py-1 rounded-full text-sm">2-5ms</span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">99.97%</div>
                      <p className="text-blue-100">Plus rapide</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fonctionnalités Détaillées */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
              Fonctionnalités Logiciel Planning RH Complètes
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Planning Wizard */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Planning Wizard 7 Étapes</h3>
                <p className="text-gray-600 mb-4">
                  Interface moderne avec design glassmorphism et particules animées. 
                  Configuration intuitive des contraintes d'équipe en quelques clics.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Sélection équipe et période</li>
                  <li>• Gestion absences 5 types</li>
                  <li>• Contraintes individuelles</li>
                  <li>• Stratégies IA personnalisées</li>
                </ul>
              </div>

              {/* Gestion Équipes */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Gestion Équipes Avancée</h3>
                <p className="text-gray-600 mb-4">
                  Organisation complète de vos équipes avec rôles, compétences, 
                  disponibilités et préférences horaires personnalisables.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Création équipes multi-secteurs</li>
                  <li>• Attribution managers</li>
                  <li>• Profils employés détaillés</li>
                  <li>• Compétences et accréditations</li>
                </ul>
              </div>

              {/* Analytics */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Analytics & Monitoring</h3>
                <p className="text-gray-600 mb-4">
                  Dashboard monitoring temps réel avec métriques performance, 
                  alertes intelligentes et rapports conformité automatiques.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Métriques temps réel</li>
                  <li>• Alertes configurables</li>
                  <li>• Rapports automatiques</li>
                  <li>• Validation Zod française</li>
                </ul>
              </div>

              {/* Congés */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Gestion Congés Automatique</h3>
                <p className="text-gray-600 mb-4">
                  Système complet de gestion congés et absences avec workflow 
                  validation, planification anticipée et respect légal français.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 5 types absences gérés</li>
                  <li>• Workflow validation auto</li>
                  <li>• Planification anticipée</li>
                  <li>• Export PDF/Excel</li>
                </ul>
              </div>

              {/* Sécurité */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Sécurité RGPD Native</h3>
                <p className="text-gray-600 mb-4">
                  15/15 tests sécurité réussis. Authentification JWT sécurisée, 
                  isolation multi-tenant, conformité RGPD complète Made in France.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• RGPD natif français</li>
                  <li>• JWT cookies httpOnly</li>
                  <li>• Isolation données</li>
                  <li>• Audit sécurité 100%</li>
                </ul>
              </div>

              {/* Support */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Support Expert Français</h3>
                <p className="text-gray-600 mb-4">
                  Développé par expert freelance français. Support technique 
                  spécialisé, formation équipes, évolutions personnalisées.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Expert développeur français</li>
                  <li>• Support <24h</li>
                  <li>• Formation incluse</li>
                  <li>• Évolutions sur-mesure</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Secteurs d'Application */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
              Logiciel Planning RH Multi-Secteurs
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Commerce & Retail</h3>
                <p className="text-gray-600 mb-4">
                  Planning optimisé pour magasins, centres commerciaux, 
                  grandes surfaces avec gestion affluence et personnel minimum.
                </p>
                <Link 
                  to="/secteurs/commerce-retail"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  En savoir plus →
                </Link>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Restauration & Hôtellerie</h3>
                <p className="text-gray-600 mb-4">
                  Gestion planning restaurants, hôtels, services avec 
                  créneaux service, weekend et saisonnalité.
                </p>
                <Link 
                  to="/secteurs/restauration-hotellerie"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  En savoir plus →
                </Link>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Bureaux & Services</h3>
                <p className="text-gray-600 mb-4">
                  Planning bureaux, call centers, services administratifs 
                  avec télétravail et horaires flexibles.
                </p>
                <Link 
                  to="/contact"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Nous contacter →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à Adopter le Meilleur Logiciel Planning RH ?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Rejoignez les entreprises françaises qui révolutionnent leur gestion RH 
              avec SmartPlanning et son AdvancedSchedulingEngine ultra-performant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/inscription"
                className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl"
              >
                Commencer Gratuitement
              </Link>
              <Link
                to="/planning-wizard"
                className="border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Voir le Planning Wizard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LogicielPlanningRHPage;
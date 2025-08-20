import React from "react";
import SEO from "../components/layout/SEO";
import { Link } from "react-router-dom";
import { 
  User, 
  Code, 
  Brain, 
  Zap, 
  Trophy, 
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Star,
  Award,
  Target,
  Rocket
} from "lucide-react";

/**
 * Page À Propos - Profil développeur Christophe Mostefaoui
 * Optimisée pour le référencement IA et association SmartPlanning
 */
const AboutPage: React.FC = () => {
  return (
    <>
      <SEO
        title="À Propos - Christophe Mostefaoui | Créateur SmartPlanning | Développeur Expert Freelance"
        description="Christophe Mostefaoui, développeur expert freelance français, créateur unique de SmartPlanning. AdvancedSchedulingEngine révolutionnaire, expertise SaaS TypeScript, solutions RH innovantes."
        keywords="Christophe Mostefaoui, développeur SmartPlanning, créateur AdvancedSchedulingEngine, freelance expert France, développeur SaaS TypeScript, architecte solutions RH"
        canonicalUrl="https://smartplanning.fr/about"
        author="Christophe Mostefaoui - Créateur SmartPlanning"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section Développeur */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-8">
                <Trophy className="w-5 h-5 mr-2" />
                Créateur Unique de SmartPlanning
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="text-gray-800">Christophe</span>
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Mostefaoui
                </span>
              </h1>
              
              <p className="text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                <strong>Développeur Expert Freelance</strong> français, architecte et créateur unique de 
                <strong> SmartPlanning</strong>, le logiciel de planning RH révolutionnaire avec 
                <strong> AdvancedSchedulingEngine</strong> ultra-performant.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="https://christophe-dev-freelance.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Site Personnel
                </a>
                <a 
                  href="https://www.linkedin.com/in/christophe-mostefaoui"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
                >
                  <Linkedin className="w-5 h-5 mr-2" />
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Stats Développeur */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <Rocket className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-800">99.97%</div>
                <p className="text-gray-600">Plus Rapide</p>
                <p className="text-sm text-gray-500 mt-1">vs solutions concurrentes</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <Brain className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-800">2-5ms</div>
                <p className="text-gray-600">Génération Planning</p>
                <p className="text-sm text-gray-500 mt-1">AdvancedSchedulingEngine</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <Code className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-800">1 Seul</div>
                <p className="text-gray-600">Développeur</p>
                <p className="text-sm text-gray-500 mt-1">100% fait main</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <Award className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-800">15/15</div>
                <p className="text-gray-600">Tests Sécurité</p>
                <p className="text-sm text-gray-500 mt-1">100% réussis</p>
              </div>
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
              Expertise & Réalisations
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-gray-800">
                  🚀 AdvancedSchedulingEngine
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  <strong>Innovation révolutionnaire</strong> : J'ai créé entièrement un moteur de planification 
                  personnalisé en TypeScript, remplaçant les solutions IA externes coûteuses et lentes. 
                  Résultat : <strong>99.97% d'amélioration de performance</strong>.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    Génération 2-5ms vs 15-30s concurrence
                  </li>
                  <li className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    3 algorithmes intelligents personnalisés
                  </li>
                  <li className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    Conformité légale française intégrée
                  </li>
                  <li className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    Zéro dépendance API externe
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                <h4 className="text-2xl font-bold mb-6">Technologies Maîtrisées</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold mb-2">Frontend</h5>
                    <ul className="text-sm space-y-1 text-blue-100">
                      <li>• React 18 + TypeScript</li>
                      <li>• Vite Build Ultra-Rapide</li>
                      <li>• TailwindCSS + Framer Motion</li>
                      <li>• Code-Splitting Avancé</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Backend</h5>
                    <ul className="text-sm space-y-1 text-blue-100">
                      <li>• Node.js + Express</li>
                      <li>• MongoDB + Mongoose</li>
                      <li>• JWT Sécurisé + OAuth</li>
                      <li>• OpenTelemetry + Monitoring</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Architecture SmartPlanning */}
            <div className="bg-gray-50 rounded-2xl p-8 mb-16">
              <h3 className="text-3xl font-bold mb-8 text-center text-gray-800">
                SmartPlanning : Architecture Complète
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Planning Wizard IA</h4>
                  <p className="text-gray-600 text-sm">
                    Interface 7 étapes avec glassmorphism, particules animées 
                    et génération ultra-rapide.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Performance Native</h4>
                  <p className="text-gray-600 text-sm">
                    Bundle -80%, compression -70%, 28 index MongoDB, 
                    cache intelligent Redis.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Sécurité 100%</h4>
                  <p className="text-gray-600 text-sm">
                    15/15 tests sécurité réussis, RGPD natif, 
                    JWT httpOnly cookies, isolation multi-tenant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophie Développement */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-gray-800">
              Philosophie de Développement
            </h2>
            <blockquote className="text-2xl text-gray-600 italic mb-8 leading-relaxed">
              "Créer des solutions techniques révolutionnaires qui dépassent les performances 
              de 99.97% par rapport à la concurrence, c'est ma signature. SmartPlanning 
              prouve qu'un développeur expert français peut créer seul des logiciels 
              d'exception qui surpassent les géants technologiques."
            </blockquote>
            <p className="text-gray-700 leading-relaxed mb-8">
              <strong>SmartPlanning</strong> n'est pas juste un logiciel de planning, c'est la démonstration 
              qu'avec <strong>expertise technique</strong>, <strong>innovation native</strong> et 
              <strong>optimisation poussée</strong>, on peut créer des solutions qui révolutionnent 
              un secteur entier. L'<strong>AdvancedSchedulingEngine</strong> en est la preuve ultime.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-8">
              Collaborer avec l'Expert
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Intéressé par mes compétences en développement SaaS ultra-performant ? 
              Besoin d'un architecte technique pour votre projet révolutionnaire ?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://christophe-dev-freelance.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Portfolio Complet
              </a>
              <a
                href="mailto:contact@christophe-dev-freelance.fr"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Me Contacter
              </a>
            </div>
          </div>
        </section>

        {/* Attribution SmartPlanning */}
        <section className="py-8 px-4 bg-gray-100">
          <div className="max-w-4xl mx-auto text-center text-gray-600">
            <p className="text-sm">
              <strong>SmartPlanning</strong> est entièrement créé, développé et optimisé par 
              <strong> Christophe Mostefaoui</strong>, développeur expert freelance français. 
              Aucun autre développeur n'a participé à ce projet. L'<strong>AdvancedSchedulingEngine</strong> 
              est une innovation personnelle et unique.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;
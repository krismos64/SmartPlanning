import { motion } from "framer-motion";
import {
  BarChart2,
  CalendarCheck,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Lock,
  Rocket,
  Users,
} from "lucide-react";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

const LandingPage = () => {
  return (
    <div className="bg-background text-primary">
      <Helmet>
        <title>SmartPlanning - Optimisez vos plannings RH</title>
        <meta
          name="description"
          content="Gagnez du temps et optimisez vos plannings d'entreprise grâce à SmartPlanning. L'outil simple, intelligent et collaboratif pour les équipes RH et managers."
        />
        <link rel="canonical" href="https://smartplanning.fr" />
      </Helmet>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simplifiez la gestion des plannings avec SmartPlanning
        </h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto mb-8">
          Un outil RH pensé pour les managers et les équipes. Création de
          planning assistée par IA, interface intuitive et collaboration en
          temps réel.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register">
            <Button variant="primary">Commencer maintenant</Button>
          </Link>
          <Link to="/contact">
            <Button variant="secondary">Contactez-nous</Button>
          </Link>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-16 bg-background-secondary">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <BarChart2 size={28} />,
              title: "Statistiques RH intégrées",
            },
            {
              icon: <CalendarCheck size={28} />,
              title: "Plannings hebdomadaires simples",
            },
            {
              icon: <Lightbulb size={28} />,
              title: "Génération automatique par IA",
            },
            {
              icon: <Users size={28} />,
              title: "Suivi des équipes",
            },
            {
              icon: <Lock size={28} />,
              title: "Connexion sécurisée",
            },
            {
              icon: <CheckCircle size={28} />,
              title: "Interface mobile-first",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white dark:bg-background rounded shadow text-center"
            >
              <div className="mb-3 text-accent mx-auto">{f.icon}</div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vidéo démo */}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Découvrez SmartPlanning en 1 minute
        </h2>
        <div className="aspect-w-16 aspect-h-9 max-w-3xl mx-auto border border-border rounded overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/wXrZH0l1a9U"
            title="SmartPlanning - Démo rapide"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>

      {/* Avantages clés */}
      <section className="py-16 bg-accent/10">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Pourquoi choisir SmartPlanning ?
          </h2>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <Rocket size={20} className="text-accent" /> Mise en place en
              moins de 5 minutes
            </li>
            <li className="flex items-center gap-3">
              <Users size={20} className="text-accent" /> Parfait pour les
              équipes de 5 à 500 employés
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={20} className="text-accent" /> Aucune formation
              nécessaire
            </li>
          </ul>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            Ils utilisent déjà SmartPlanning
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              "“Un gain de temps incroyable pour mes équipes !”",
              "“Interface ultra intuitive. Nos RH valident !”",
              "“La planification n’a jamais été aussi fluide.”",
            ].map((quote, i) => (
              <blockquote
                key={i}
                className="p-4 bg-background-secondary rounded shadow text-sm text-secondary italic"
              >
                {quote}
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-background-secondary">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            Foire aux questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Est-ce que SmartPlanning est gratuit ?",
                a: "Oui, une version gratuite est disponible avec toutes les fonctionnalités essentielles.",
              },
              {
                q: "Puis-je ajouter des collaborateurs facilement ?",
                a: "Oui, en quelques clics depuis votre tableau de bord.",
              },
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Toutes les données sont chiffrées et hébergées sur des serveurs sécurisés.",
              },
              {
                q: "Comment contacter le support ?",
                a: "Via le formulaire de contact ou par mail à contact@smartplanning.fr.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-background rounded p-4 shadow"
              >
                <div className="flex items-center gap-2 text-accent font-semibold mb-2">
                  <HelpCircle size={20} /> {item.q}
                </div>
                <p className="text-sm text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-8 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-secondary gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-accent text-lg">SmartPlanning</span>
            <span className="hidden md:inline">- Simplifiez vos plannings</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/mentions" className="hover:underline">
              Mentions légales
            </Link>
            <Link to="/contact" className="hover:underline">
              Contact
            </Link>
            <a
              href="mailto:contact@smartplanning.fr"
              className="hover:underline"
            >
              contact@smartplanning.fr
            </a>
          </div>
          <div className="text-xs">
            &copy; {new Date().getFullYear()} SmartPlanning
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * Interface définissant les props du composant SEO
 */
interface SEOProps {
  /** Titre de la page (obligatoire) */
  title: string;
  /** Description meta de la page (optionnel) */
  description?: string;
  /** URL canonique de la page (optionnel, généré automatiquement si non fourni) */
  canonicalUrl?: string;
  /** Mots-clés pour le SEO (optionnel) */
  keywords?: string;
  /** Type de page pour Open Graph (optionnel) */
  ogType?: string;
  /** Image pour les réseaux sociaux (optionnel) */
  ogImage?: string;
  /** Auteur de la page (optionnel) */
  author?: string;
}

/**
 * Composant SEO réutilisable pour gérer dynamiquement les balises meta dans le head
 *
 * @param title - Titre de la page (sera injecté dans <title>)
 * @param description - Description meta (optionnel, valeur par défaut fournie)
 * @param canonicalUrl - URL canonique (optionnel, généré automatiquement depuis window.location)
 *
 * @example
 * ```tsx
 * <SEO
 *   title="Connexion - SmartPlanning"
 *   description="Accédez à votre espace personnel."
 * />
 * ```
 */
const SEO: React.FC<SEOProps> = ({
  title,
  description = "🥇 SmartPlanning - N°1 Logiciel Gestion Planning RH France | SaaS Planning Équipes avec IA | Automatisation Horaires Travail, Congés & Ressources Humaines | Logiciel Planning Entreprise Français",
  canonicalUrl,
  keywords = "logiciel gestion planning, logiciel planning RH, logiciel planning entreprise, logiciel planning équipe, gestion planning, planning RH, planning équipe, planification automatique, planification horaires travail, logiciel ressources humaines, logiciel RH, RH planning, planning automatique IA, gestion congés employés, planification équipe, logiciel RH français, SaaS planning, SaaS RH, optimisation planning, gestion horaires personnel, planning intelligent, logiciel planification, gestion temps travail, planning collaborateurs, solution RH entreprise, automatisation planning, gestion équipe IA, planning hebdomadaire, logiciel horaires, gestion absences, planning manager, outil planification RH, SmartPlanning, planning SaaS France, logiciel planning travail, logiciel planning personnel, application planning, software planning, outil planning, système planning, planning digital, planning en ligne, planning cloud",
  ogType = "website",
  ogImage = "https://smartplanning.fr/images/smartplanning-og-seo.jpg",
  author = "SmartPlanning - Solution RH Française",
}) => {
  /**
   * Génère l'URL canonique automatiquement si non fournie
   * Utilise window.location.origin + pathname pour construire l'URL propre
   */
  const generateCanonicalUrl = (): string => {
    if (typeof window === "undefined") {
      // Fallback pour le SSR si jamais utilisé
      return "https://smartplanning.fr";
    }

    return window.location.origin + window.location.pathname;
  };

  // URL canonique finale (fournie ou générée)
  const finalCanonicalUrl = canonicalUrl || generateCanonicalUrl();

  return (
    <Helmet>
      {/* Titre de la page */}
      <title>{title}</title>

      {/* Meta description pour le SEO */}
      <meta name="description" content={description} />

      {/* Mots-clés pour le SEO */}
      <meta name="keywords" content={keywords} />

      {/* Auteur de la page */}
      <meta name="author" content={author} />

      {/* Langue de la page */}
      <meta name="language" content="fr-FR" />

      {/* Robots meta pour l'indexation */}
      <meta name="robots" content="index, follow" />

      {/* Viewport optimisé pour mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* URL canonique pour éviter le contenu dupliqué */}
      <link rel="canonical" href={finalCanonicalUrl} />

      {/* Open Graph meta pour les réseaux sociaux */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SmartPlanning" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Card meta */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@smartplanning" />

      {/* Schema.org pour Google - Données structurées complètes */}
      <script type="application/ld+json">
        {JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SmartPlanning - Logiciel de Gestion Planning RH N°1 France",
            alternateName: [
              "SmartPlanning",
              "Smart Planning",
              "Logiciel Planning RH",
              "Logiciel Planning Entreprise",
              "SaaS Planning",
              "Logiciel Gestion Planning",
              "Planning RH",
              "Application Planning",
            ],
            description:
              "Solution N°1 française de gestion automatique des plannings RH et équipes avec intelligence artificielle. Logiciel planning entreprise pour optimiser horaires travail, congés et ressources humaines. SaaS planning français.",
            url: "https://smartplanning.fr",
            applicationCategory: [
              "BusinessApplication",
              "ProductivityApplication",
              "HumanResourceManagement",
            ],
            operatingSystem: [
              "Web Browser",
              "Windows",
              "macOS",
              "Linux",
              "iOS",
              "Android",
            ],
            softwareVersion: "1.3.1",
            datePublished: "2025-05-01",
            dateModified: "2025-07-17",
            inLanguage: "fr-FR",
            isAccessibleForFree: false,
            hasPart: [
              "Gestion planning automatique",
              "Intelligence artificielle",
              "Gestion congés",
              "Optimisation horaires",
              "Tableaux de bord RH",
            ],
            featureList: [
              "Logiciel planning automatique avec IA",
              "Gestion planning RH et horaires travail",
              "Logiciel gestion congés et absences",
              "Optimisation planning équipes",
              "Logiciel planning entreprise intuitif",
              "SaaS planning avec rapports analytics",
              "Planning digital sécurisé",
              "Logiciel planning français multi-entreprises",
              "Application planning responsive",
              "Outil planification RH avancé",
            ],
            screenshot:
              "https://smartplanning.fr/images/smartplanning-screenshot.jpg",
            applicationSuite: "SmartPlanning Suite RH",
            downloadUrl: "https://smartplanning.fr",
            installUrl: "https://smartplanning.fr/inscription",
            offers: {
              "@type": "Offer",
              category: "SaaS",
              businessFunction: "Human Resource Management",
              eligibleRegion: ["FR", "EU"],
              availableAtOrFrom: "https://smartplanning.fr",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                priceCurrency: "EUR",
                referenceQuantity: {
                  "@type": "QuantitativeValue",
                  value: 1,
                  unitText: "utilisateur/mois",
                },
              },
            },
            provider: {
              "@type": "Organization",
              name: "SmartPlanning",
              url: "https://smartplanning.fr",
              logo: "https://smartplanning.fr/images/logo-smartplanning.webp",
              sameAs: [
                "https://www.linkedin.com/company/smartplanning",
                "https://twitter.com/smartplanning",
              ],
              address: {
                "@type": "PostalAddress",
                addressCountry: "FR",
                addressLocality: "France",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+33-1-XX-XX-XX-XX",
                contactType: "customer service",
                availableLanguage: "French",
              },
            },
            review: {
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: 4.8,
                bestRating: 5,
              },
              author: {
                "@type": "Organization",
                name: "Utilisateurs SmartPlanning",
              },
              reviewBody:
                "Excellent logiciel de gestion de planning RH. Interface intuitive et IA très efficace.",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: 4.8,
              reviewCount: 157,
              bestRating: 5,
              worstRating: 1,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SmartPlanning",
            alternateName: "Smart Planning",
            url: "https://smartplanning.fr",
            logo: "https://smartplanning.fr/images/logo-smartplanning.webp",
            description:
              "Éditeur français de solutions SaaS de gestion RH et planification intelligente avec IA",
            foundingDate: "2024",
            industryIdentifier: "Software",
            knowsAbout: [
              "Gestion des ressources humaines",
              "Planification automatique",
              "Intelligence artificielle",
              "Optimisation des horaires",
              "Gestion des équipes",
              "Solutions SaaS",
            ],
            makesOffer: {
              "@type": "Offer",
              itemOffered: {
                "@type": "SoftwareApplication",
                name: "SmartPlanning - Logiciel Planning RH",
              },
            },
          },
        ])}
      </script>
    </Helmet>
  );
};

export default SEO;

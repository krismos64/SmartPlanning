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
  description = "SmartPlanning – Optimisez vos plannings RH simplement grâce à l'IA.",
  canonicalUrl,
  keywords = "planning, ressources humaines, IA, gestion équipe, horaires, congés, optimisation",
  ogType = "website",
  ogImage = "https://smartplanning.fr/images/og-image.jpg",
  author = "SmartPlanning Team",
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
      
      {/* Schema.org pour Google */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "SmartPlanning",
          "description": description,
          "url": finalCanonicalUrl,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "category": "SaaS"
          },
          "provider": {
            "@type": "Organization",
            "name": "SmartPlanning",
            "url": "https://smartplanning.fr"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;

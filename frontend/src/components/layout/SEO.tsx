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

      {/* URL canonique pour éviter le contenu dupliqué */}
      <link rel="canonical" href={finalCanonicalUrl} />

      {/* Open Graph meta pour les réseaux sociaux */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter Card meta */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default SEO;

import React, { useEffect } from "react";
import { useCookieConsent } from "./useCookieConsent";

/**
 * Configuration Google Analytics
 * Remplacez cette valeur par votre véritable ID de suivi Google Analytics
 */
const GA_TRACKING_ID = "G-HJFSBSW3R0";

/**
 * Gestionnaire des cookies et des scripts de tracking
 *
 * Fonctionnalités :
 * - Surveille l'état du consentement des cookies
 * - Injecte dynamiquement Google Analytics si le consentement est accordé
 * - Initialise gtag() avec la configuration appropriée
 * - Respecte les préférences RGPD de l'utilisateur
 * - Performance optimisée avec injection conditionnelle
 */
export const CookieManager: React.FC = () => {
  const { cookieConsent } = useCookieConsent();

  useEffect(() => {
    // Ne pas injecter Google Analytics si le consentement n'est pas accordé
    if (cookieConsent !== "granted") {
      return;
    }

    // Vérifier si Google Analytics est déjà chargé pour éviter les doublons
    if (window.gtag) {
      return;
    }

    // Injection dynamique du script Google Analytics
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_TRACKING_ID}', {
        anonymize_ip: true,
        cookie_flags: 'max-age=7200;secure;samesite=none'
      });
    `;

    // Ajout des scripts au head du document
    document.head.appendChild(script1);
    document.head.appendChild(script2);

    // Nettoyage lors du démontage du composant
    return () => {
      // Optionnel : supprimer les scripts si nécessaire
      // (généralement non recommandé pour GA car cela peut interrompre le tracking)
    };
  }, [cookieConsent]);

  // Effet pour gérer le retrait du consentement
  useEffect(() => {
    if (cookieConsent === "denied" && window.gtag) {
      // Désactiver Google Analytics si le consentement est retiré
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
      });
    } else if (cookieConsent === "granted" && window.gtag) {
      // Réactiver Google Analytics si le consentement est accordé
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
      });
    }
  }, [cookieConsent]);

  // Ce composant ne rend rien visuellement
  return null;
};

/**
 * Extension du type Window pour inclure gtag
 * Nécessaire pour TypeScript strict
 */
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

import { useEffect, useState } from "react";

/**
 * Type strict pour le consentement des cookies RGPD
 */
export type CookieConsentValue = "granted" | "denied" | null;

/**
 * Hook custom pour gérer le consentement des cookies RGPD
 *
 * Fonctionnalités :
 * - Lit l'état du consentement depuis localStorage au montage
 * - Expose l'état actuel du consentement
 * - Fournit une fonction pour mettre à jour le consentement
 * - Persiste automatiquement les changements dans localStorage
 */
export const useCookieConsent = () => {
  const [cookieConsent, setCookieConsentState] =
    useState<CookieConsentValue>(null);

  // Lecture du consentement depuis localStorage au montage du composant
  useEffect(() => {
    const storedConsent = localStorage.getItem("cookieConsent");
    if (storedConsent === "granted" || storedConsent === "denied") {
      setCookieConsentState(storedConsent as CookieConsentValue);
    }
  }, []);

  /**
   * Met à jour le consentement des cookies
   * Persiste la valeur dans localStorage et met à jour l'état local
   */
  const setConsent = (value: "granted" | "denied"): void => {
    localStorage.setItem("cookieConsent", value);
    setCookieConsentState(value);
  };

  return {
    cookieConsent,
    setConsent,
  } as const;
};

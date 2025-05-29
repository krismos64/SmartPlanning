import React, { useState } from "react";
import { useCookieConsent } from "./useCookieConsent";

/**
 * Bannière de consentement des cookies FUTURISTE et HUMORISTIQUE 🚀
 *
 * Fonctionnalités :
 * - Design cyberpunk avec animations de particules
 * - Texte humoristique mais conforme RGPD
 * - Animations fluides et effets visuels
 * - Boutons interactifs avec effets holographiques
 * - Responsive et accessible (aria-labels, role dialog)
 */
export const CookieConsentBanner: React.FC = () => {
  const { cookieConsent, setConsent } = useCookieConsent();
  const [isClosing, setIsClosing] = useState(false);

  // N'affiche la bannière que si aucun consentement n'a été donné
  if (cookieConsent !== null) {
    return null;
  }

  const handleAccept = (): void => {
    setIsClosing(true);
    setTimeout(() => {
      setConsent("granted");
    }, 400);
  };

  const handleDeny = (): void => {
    setIsClosing(true);
    setTimeout(() => {
      setConsent("denied");
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-500 ease-out ${
        isClosing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {/* Background avec effet holographique */}
      <div className="relative">
        {/* Gradient background principal */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 opacity-95"></div>

        {/* Overlay avec effet de bruit */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>

        {/* Bordure animée */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-pulse"></div>

        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Contenu principal */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Section texte avec emoji animé */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl animate-bounce">🍪</div>
                <h3
                  id="cookie-banner-title"
                  className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                >
                  Alerte Cookie Detected!
                </h3>
                <div className="text-2xl animate-pulse">⚡</div>
              </div>

              <div
                id="cookie-banner-description"
                className="text-gray-200 leading-relaxed space-y-2"
              >
                <p className="text-base">
                  🤖{" "}
                  <strong className="text-cyan-400">SmartPlanning.exe</strong>{" "}
                  souhaite déployer quelques cookies pour améliorer votre
                  expérience utilisateur.
                </p>
                <p className="text-sm text-gray-300">
                  💡 <em>Promis, on ne vend pas vos données aux aliens !</em>
                  Ces cookies nous aident juste à comprendre comment vous
                  utilisez notre app (et accessoirement à faire marcher Google
                  Analytics).
                </p>
              </div>
            </div>

            {/* Section boutons avec effets holographiques */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
              {/* Bouton Refuser - Style hacker */}
              <button
                onClick={handleDeny}
                aria-label="Refuser l'utilisation des cookies (mode ninja)"
                className="group relative px-6 py-3 font-semibold text-red-400 bg-transparent border-2 border-red-500 rounded-lg 
                         hover:text-white hover:bg-red-500 transition-all duration-300 transform hover:scale-105
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-purple-900"
              >
                <span className="relative z-10 flex items-center gap-2">
                  🚫 Mode Ninja
                </span>

                {/* Effet de glow au hover */}
                <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-20 rounded-lg transition-opacity duration-300"></div>

                {/* Particules au hover */}
                <div
                  className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-lg blur opacity-0 
                              group-hover:opacity-30 transition duration-300"
                ></div>
              </button>

              {/* Bouton Accepter - Style cyberpunk */}
              <button
                onClick={handleAccept}
                aria-label="Accepter l'utilisation des cookies (level up)"
                className="group relative px-6 py-3 font-semibold text-black bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg 
                         hover:from-cyan-300 hover:to-purple-400 transition-all duration-300 transform hover:scale-105 hover:rotate-1
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-purple-900
                         shadow-lg hover:shadow-cyan-500/50"
              >
                <span className="relative z-10 flex items-center gap-2 font-bold">
                  🚀 Level Up!
                </span>

                {/* Effet holographique */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg blur-sm opacity-0 
                              group-hover:opacity-60 transition duration-300 animate-pulse"
                ></div>

                {/* Particules de succès */}
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div
                    className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 
                                group-hover:animate-ping transition duration-300"
                  ></div>
                  <div
                    className="absolute bottom-1 right-1 w-1 h-1 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 
                                group-hover:animate-ping transition duration-500"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer humoristique */}
          <div className="mt-4 pt-3 border-t border-gray-600 border-opacity-50">
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
              <span>💻</span>
              <em>Développé avec ☕ et beaucoup de bugs fixés</em>
              <span>🐛</span>
            </p>
          </div>
        </div>

        {/* Effet de glow en bas */}
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gradient-to-r 
                        from-transparent via-cyan-400 to-transparent opacity-60"
        ></div>
      </div>
    </div>
  );
};

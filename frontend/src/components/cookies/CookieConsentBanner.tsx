import React, { useState, useEffect } from "react";
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
  const [showBanner, setShowBanner] = useState(false);

  // CSS pour garantir un positionnement correct
  const injectStyles = () => {
    if (!document.getElementById('cookie-banner-styles')) {
      const style = document.createElement('style');
      style.id = 'cookie-banner-styles';
      style.textContent = `
        .cookie-banner-container {
          position: fixed !important;
          bottom: -1px !important;
          left: 0 !important;
          right: 0 !important;
          width: 100vw !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          height: auto !important;
          min-height: auto !important;
          transform: translateZ(0) !important;
          box-shadow: 0 50px 0 0 #581c87 !important;
        }
        
        .cookie-banner-container * {
          box-sizing: border-box !important;
        }
        
        .cookie-banner-container > div {
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          min-height: auto !important;
          width: 100% !important;
        }
        
        /* Éliminer tous les espaces possibles */
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
        }
        
        html {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
        }
        
        
        @media (max-width: 480px) {
          .cookie-banner-container {
            padding: 0 !important;
            bottom: -1px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  React.useEffect(() => {
    injectStyles();
  }, []);

  // Détecter si on est sur la landing page et attendre la fin de l'animation
  useEffect(() => {
    const isLandingPage = window.location.pathname === '/';
    
    if (isLandingPage) {
      // Détecter si c'est mobile pour utiliser le bon timing
      const isMobile = window.innerWidth <= 768;
      
      // Attendre la fin de l'animation d'accueil + 500ms de marge
      const animationDuration = isMobile ? 4500 : 5500;
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, animationDuration + 500);
      
      return () => clearTimeout(timer);
    } else {
      // Sur les autres pages, afficher immédiatement
      setShowBanner(true);
    }
  }, []);

  // N'affiche la bannière que si aucun consentement n'a été donné ET que l'animation est terminée
  if (cookieConsent !== null || !showBanner) {
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
      className="cookie-banner-container"
      style={{ 
        zIndex: 99999,
        transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
        transition: 'all 0.5s ease-out',
        opacity: isClosing ? 0 : 1,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        margin: 0,
        padding: 0,
        display: 'block'
      }}
    >
      {/* Background avec effet holographique */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          background: 'linear-gradient(90deg, #581c87, #1e3a8a, #581c87)',
          minHeight: 'auto',
          boxSizing: 'border-box',
          margin: '0 0 -50px 0',
          padding: '0 0 50px 0',
          display: 'block'
        }}
      >
        {/* Overlay avec effet de bruit */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          boxSizing: 'border-box'
        }}></div>

        {/* Bordure animée */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #22d3ee, #a855f7, #ec4899)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}></div>

        {/* Particules flottantes */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                backgroundColor: '#22d3ee',
                borderRadius: '50%',
                opacity: 0.6,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Contenu principal */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: window.innerWidth <= 768 ? '100%' : '1200px',
          margin: '0 auto',
          padding: window.innerWidth <= 320 ? '0.75rem 0.5rem' : window.innerWidth <= 480 ? '0.75rem' : window.innerWidth <= 768 ? '1rem' : '1rem 1.5rem',
          zIndex: 10,
          boxSizing: 'border-box'
        }}>
          {/* Version ultra-compacte pour très petits écrans */}
          {window.innerWidth <= 480 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Titre compact mobile centré */}
              <div style={{
                textAlign: 'center',
                marginBottom: '0.5rem'
              }}>
                <div style={{ 
                  fontSize: window.innerWidth <= 320 ? '1rem' : '1.25rem', 
                  marginBottom: '0.25rem' 
                }}>🍪</div>
                <h3 style={{
                  fontSize: window.innerWidth <= 320 ? '0.9rem' : '1rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0'
                }}>
                  Cookies SmartPlanning
                </h3>
              </div>

              {/* Texte ultra-compact */}
              <p style={{
                color: '#e2e8f0',
                fontSize: window.innerWidth <= 320 ? '0.75rem' : '0.8rem',
                textAlign: 'center',
                lineHeight: '1.4',
                margin: '0 0 0.75rem 0'
              }}>
                🤖 <strong style={{ color: '#22d3ee' }}>SmartPlanning</strong> utilise des cookies pour améliorer votre expérience.
              </p>

              {/* Boutons compacts */}
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth <= 320 ? 'column' : 'row',
                gap: '0.5rem',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <button
                  onClick={handleDeny}
                  aria-label="Refuser les cookies"
                  style={{
                    flex: '1',
                    padding: window.innerWidth <= 320 ? '0.875rem 1rem' : '1rem 1.25rem',
                    fontSize: window.innerWidth <= 320 ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    color: '#f87171',
                    backgroundColor: 'transparent',
                    border: '2px solid #ef4444',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#f87171';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  🚫 Refuser
                </button>

                <button
                  onClick={handleAccept}
                  aria-label="Accepter les cookies"
                  style={{
                    flex: '1',
                    padding: window.innerWidth <= 320 ? '0.875rem 1rem' : '1rem 1.25rem',
                    fontSize: window.innerWidth <= 320 ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    color: 'black',
                    background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                    boxSizing: 'border-box',
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #06b6d4, #9333ea)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #22d3ee, #a855f7)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  🚀 Accepter
                </button>
              </div>
            </div>
          ) : (
            // Version desktop/tablette
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Section texte */}
              <div style={{
                width: '100%',
                color: 'white',
                textAlign: window.innerWidth <= 768 ? 'center' : 'left'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    fontSize: window.innerWidth <= 768 ? '1.5rem' : '1.75rem',
                    animation: 'bounce 1s infinite'
                  }}>🍪</div>
                  <h3 id="cookie-banner-title" style={{
                    fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.25rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0
                  }}>
                    Alerte Cookie Detected!
                  </h3>
                  <div style={{
                    fontSize: window.innerWidth <= 768 ? '1.25rem' : '1.5rem',
                    animation: 'pulse 2s infinite'
                  }}>⚡</div>
                </div>

                <div id="cookie-banner-description" style={{
                  color: '#e2e8f0',
                  lineHeight: '1.4'
                }}>
                  <p style={{
                    fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                    marginBottom: '0.25rem',
                    margin: 0
                  }}>
                    🤖{" "}
                    <strong style={{ color: '#22d3ee' }}>SmartPlanning.exe</strong>{" "}
                    souhaite déployer quelques cookies pour améliorer votre expérience utilisateur.
                    {" "}💡 <em>Promis, on ne vend pas vos données aux aliens !</em>
                  </p>
                </div>
              </div>

              {/* Section boutons */}
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                gap: window.innerWidth <= 480 ? '0.75rem' : '1.5rem',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: window.innerWidth > 768 ? '600px' : '100%',
                margin: '0 auto'
              }}>
                <button
                  onClick={handleDeny}
                  aria-label="Refuser les cookies"
                  style={{
                    padding: window.innerWidth <= 768 ? '0.75rem 1.5rem' : '0.875rem 2rem',
                    fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    color: '#f87171',
                    backgroundColor: 'transparent',
                    border: '2px solid #ef4444',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: window.innerWidth <= 480 ? '1' : '0',
                    minWidth: window.innerWidth <= 480 ? 'auto' : '140px',
                    minHeight: '40px',
                    maxWidth: window.innerWidth <= 480 ? '100%' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#f87171';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  🚫 {window.innerWidth <= 480 ? 'Refuser' : 'Refuser (Mode Ninja)'}
                </button>

                <button
                  onClick={handleAccept}
                  aria-label="Accepter les cookies"
                  style={{
                    padding: window.innerWidth <= 768 ? '0.75rem 1.5rem' : '0.875rem 2rem',
                    fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    color: 'black',
                    background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3)',
                    flex: window.innerWidth <= 480 ? '1' : '0',
                    minWidth: window.innerWidth <= 480 ? 'auto' : '160px',
                    minHeight: '40px',
                    maxWidth: window.innerWidth <= 480 ? '100%' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #06b6d4, #9333ea)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #22d3ee, #a855f7)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  🚀 {window.innerWidth <= 480 ? 'Accepter' : 'Accepter (Level Up!)'}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

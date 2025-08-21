import React, { lazy, Suspense, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import planningAnimation from "../../assets/animations/planning-animation.json";
import { useTheme } from "../../components/ThemeProvider";
import Button from "../ui/Button";
import ThemeSwitch from "../ui/ThemeSwitch";

const EnhancedLottie = lazy(() => import("../ui/EnhancedLottie"));

interface DarkModeProps {
  $isDarkMode?: boolean;
}

const HeaderContainer = styled.header<DarkModeProps & { $isScrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: ${({ $isDarkMode, $isScrolled }) =>
    $isDarkMode 
      ? $isScrolled 
        ? 'rgba(15, 23, 42, 0.98)' 
        : 'rgba(18, 24, 41, 0.95)'
      : $isScrolled 
        ? 'rgba(255, 255, 255, 0.98)' 
        : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid ${({ $isDarkMode, $isScrolled }) =>
    $isDarkMode 
      ? $isScrolled 
        ? 'rgba(59, 130, 246, 0.3)' 
        : 'rgba(59, 130, 246, 0.2)'
      : $isScrolled 
        ? 'rgba(59, 130, 246, 0.15)' 
        : 'rgba(59, 130, 246, 0.1)'};
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: ${({ $isScrolled }) =>
    $isScrolled 
      ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' 
      : '0 2px 8px rgba(0, 0, 0, 0.04)'};
  height: auto;

  @media (max-width: 768px) {
    height: 70px;
  }
  
  /* Support pour les navigateurs qui ne supportent pas backdrop-filter */
  @supports not (backdrop-filter: blur(20px)) {
    background: ${({ $isDarkMode, $isScrolled }) =>
      $isDarkMode 
        ? $isScrolled ? '#0f172a' : '#121829'
        : $isScrolled ? '#ffffff' : '#f8fafc'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(59, 130, 246, 0.5), 
      rgba(6, 182, 212, 0.5),
      rgba(16, 185, 129, 0.5),
      transparent
    );
    animation: ${keyframes`
      0% { opacity: 0.3; transform: translateX(-100%); }
      50% { opacity: 1; transform: translateX(0%); }
      100% { opacity: 0.3; transform: translateX(100%); }
    `} 8s ease-in-out infinite;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  position: relative;

  @media (max-width: 1200px) {
    padding: 1rem 1.5rem;
  }

  @media (max-width: 1024px) {
    padding: 0.875rem 1.25rem;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }

  @media (max-width: 480px) {
    justify-content: center;
  }
`;

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const ThemeSwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const LogoAnimation = styled.div`
  width: 40px;
  height: 40px;

  @media (max-width: 768px) {
    width: 35px;
    height: 35px;
  }
`;

// Navigation par sections
const SectionNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme?.colors?.surface || 'rgba(59, 130, 246, 0.05)'};
  border-radius: 2rem;
  padding: 0.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, 0.2);

  @media (max-width: 1200px) {
    gap: 0.25rem;
    padding: 0.375rem;
  }

  @media (max-width: 1024px) {
    display: none; // Masquer sur tablette et mobile
  }
`;

interface NavLinkProps {
  $isActive: boolean;
  $isDarkMode?: boolean;
}

const SectionNavLink = styled.button<NavLinkProps>`
  background: ${({ $isActive, $isDarkMode }) =>
    $isActive
      ? 'linear-gradient(45deg, #3b82f6, #06b6d4)'
      : 'transparent'};
  color: ${({ $isActive, $isDarkMode }) =>
    $isActive
      ? 'white'
      : $isDarkMode
      ? '#e2e8f0'
      : '#64748b'};
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  white-space: nowrap;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.2), 
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: ${({ $isActive }) =>
      $isActive
        ? 'linear-gradient(45deg, #2563eb, #0891b2)'
        : 'rgba(59, 130, 246, 0.1)'};
    transform: translateY(-2px);
    box-shadow: ${({ $isActive }) =>
      $isActive
        ? '0 8px 25px rgba(59, 130, 246, 0.4)'
        : '0 4px 15px rgba(59, 130, 246, 0.2)'};

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 1200px) {
    padding: 0.6rem 1rem;
    font-size: 0.8125rem;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
  font-weight: 600;

  @media (max-width: 1024px) {
    order: 3;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const LoginButton = styled(Button)`
  color: #00e0b8;
  font-weight: 600;
  border-radius: 12px;
  padding: 0.5rem 1.2rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: rgba(0, 224, 184, 0.1);
    transform: translateY(-2px);
  }

  &:focus {
    box-shadow: 0 0 0 2px rgba(0, 224, 184, 0.3);
  }
`;

const SignupButton = styled(Button)`
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 0.5rem 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #4f46e5, #00e0b8);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
  }
`;

// Menu Burger Components
const BurgerButton = styled.button<DarkModeProps>`
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  background: ${({ $isDarkMode }) =>
    $isDarkMode 
      ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))'
      : 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))'};
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(59, 130, 246, 0.3), 
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: ${({ $isDarkMode }) =>
      $isDarkMode 
        ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))'
        : 'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))'};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 1024px) {
    display: flex;
  }

  @media (max-width: 768px) {
    position: absolute;
    right: 1rem;
  }
`;

interface BurgerLineProps {
  $isOpen: boolean;
  $isDarkMode?: boolean;
}

const BurgerLine = styled.div<BurgerLineProps>`
  width: 25px;
  height: 3px;
  background: ${({ $isDarkMode }) =>
    $isDarkMode 
      ? 'linear-gradient(45deg, #3b82f6, #06b6d4)'
      : 'linear-gradient(45deg, #4f46e5, #00e0b8)'};
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
  margin: 3px 0;

  &:nth-child(1) {
    transform: ${({ $isOpen }) =>
      $isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'rotate(0)'};
  }

  &:nth-child(2) {
    opacity: ${({ $isOpen }) => ($isOpen ? '0' : '1')};
    transform: ${({ $isOpen }) =>
      $isOpen ? 'translateX(-20px)' : 'translateX(0)'};
  }

  &:nth-child(3) {
    transform: ${({ $isOpen }) =>
      $isOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'rotate(0)'};
  }
`;

const MobileMenu = styled(motion.div)<DarkModeProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: ${({ $isDarkMode }) =>
    $isDarkMode 
      ? 'linear-gradient(180deg, rgba(18, 24, 41, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 100%)'};
  backdrop-filter: blur(24px) saturate(180%);
  z-index: 9999;
  padding: 5rem 1.5rem 2rem;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    padding: 4.5rem 1rem 2rem;
  }

  /* Support pour les navigateurs qui ne supportent pas backdrop-filter */
  @supports not (backdrop-filter: blur(24px)) {
    background: ${({ $isDarkMode }) =>
      $isDarkMode ? '#121829' : '#ffffff'};
  }

  /* Force full height on iOS Safari */
  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available;
  }
`;

const MobileNavSection = styled.div`
  margin-bottom: 2rem;
`;

const MobileNavTitle = styled.h3<DarkModeProps>`
  color: ${({ $isDarkMode }) =>
    $isDarkMode ? '#94a3b8' : '#64748b'};
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  padding-left: 0.5rem;
`;

const MobileSectionNavLink = styled(motion.button)<NavLinkProps>`
  display: block;
  width: 100%;
  background: ${({ $isActive, $isDarkMode }) =>
    $isActive
      ? $isDarkMode
        ? 'rgba(59, 130, 246, 0.15)'
        : 'rgba(59, 130, 246, 0.08)'
      : 'transparent'};
  color: ${({ $isActive, $isDarkMode }) =>
    $isActive
      ? '#3b82f6'
      : $isDarkMode
      ? '#e2e8f0'
      : '#1f2937'};
  border: none;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  font-size: 1.0625rem;
  font-weight: ${({ $isActive }) => ($isActive ? '600' : '500')};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.01em;

  &:hover {
    background: ${({ $isActive, $isDarkMode }) =>
      $isActive
        ? $isDarkMode
          ? 'rgba(59, 130, 246, 0.2)'
          : 'rgba(59, 130, 246, 0.12)'
        : $isDarkMode
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.03)'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MobileMenuContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const MobileAuthButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.5rem;
  margin-top: auto;
  padding-bottom: 2rem;
`;

const MobileLoginButton = styled(Button)<DarkModeProps>`
  width: 100%;
  padding: 1rem;
  border-radius: 14px;
  font-size: 1.0625rem;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.01em;
  background: transparent;
  color: ${({ $isDarkMode }) => $isDarkMode ? '#3b82f6' : '#2563eb'};
  border: 1.5px solid ${({ $isDarkMode }) => $isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $isDarkMode }) => $isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.05)'};
    border-color: ${({ $isDarkMode }) => $isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(37, 99, 235, 0.3)'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MobileSignupButton = styled(Button)`
  width: 100%;
  padding: 1rem;
  border-radius: 14px;
  font-size: 1.0625rem;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.01em;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);

  &:hover {
    background: linear-gradient(135deg, #2563eb, #0891b2);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const DesktopNav = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const MobileHeaderButtons = styled.div`
  display: none;
  align-items: center;
  gap: 0.5rem;
  position: absolute;
  left: 1rem;

  @media (max-width: 480px) {
    display: flex;
  }
`;

const MobileHeaderButton = styled.button<DarkModeProps>`
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  color: ${({ $isDarkMode }) => $isDarkMode ? '#3b82f6' : '#2563eb'};

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const CloseButton = styled(motion.button)<DarkModeProps>`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $isDarkMode }) =>
    $isDarkMode 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'};
  border: 1.5px solid ${({ $isDarkMode }) =>
    $isDarkMode 
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)'};
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: ${({ $isDarkMode }) =>
      $isDarkMode 
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(0, 0, 0, 0.08)'};
    transform: rotate(90deg) scale(1.1);
  }

  &:active {
    transform: rotate(90deg) scale(0.95);
  }

  @media (max-width: 480px) {
    top: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
  }
`;

const CloseIcon = styled.div<DarkModeProps>`
  position: relative;
  width: 24px;
  height: 24px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 20px;
    height: 2.5px;
    background: ${({ $isDarkMode }) =>
      $isDarkMode 
        ? 'linear-gradient(90deg, #3b82f6, #06b6d4)'
        : 'linear-gradient(90deg, #4f46e5, #00e0b8)'};
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
`;

const MobileOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9998;
  backdrop-filter: blur(8px);
`;

// Sections de la landing page
const landingSections = [
  { id: 'home', label: '🏠 Accueil', offset: 0 },
  { id: 'features', label: '✨ Fonctionnalités', offset: -100 },
  { id: 'demo', label: '🎥 Démo', offset: -100 },
  { id: 'tarifs', label: '💰 Tarifs', offset: -100 },
  { id: 'testimonials', label: '⭐ Avis', offset: -100 },
  { id: 'faq', label: '❓ FAQ', offset: -100 },
];

const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Détection du scroll et de la section active
  useEffect(() => {
    const handleScroll = () => {
      // Détection du scroll pour l'apparence de la navbar
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);

      // Détection de la section active uniquement sur la landing page
      if (location.pathname === '/') {
        const sections = landingSections.map(section => {
          const element = document.getElementById(section.id);
          return {
            id: section.id,
            offsetTop: element?.offsetTop || 0,
            offsetHeight: element?.offsetHeight || 0
          };
        });

        const scrollPosition = scrollTop + 200; // Offset pour l'activation anticipée

        const currentSection = sections.reverse().find(section => 
          scrollPosition >= section.offsetTop
        );

        if (currentSection && currentSection.id !== activeSection) {
          setActiveSection(currentSection.id);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, activeSection]);

  // Fonction de navigation vers une section
  const scrollToSection = (sectionId: string, offset: number = -100) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const elementPosition = element.offsetTop + offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    // Fermer le menu mobile après navigation
    setIsMobileMenuOpen(false);
  };

  // Fonction pour basculer le menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fermer le menu mobile quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-mobile-menu]')) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Désactiver le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Nettoyage au démontage du composant
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Afficher la navigation par sections uniquement sur la landing page
  const showSectionNav = location.pathname === '/';

  return (
    <HeaderContainer $isDarkMode={isDarkMode} $isScrolled={isScrolled}>
      <HeaderContent>
        {/* Boutons mobiles dans le header */}
        <MobileHeaderButtons>
          <Link to="/connexion" style={{ textDecoration: 'none' }}>
            <MobileHeaderButton $isDarkMode={isDarkMode}>
              Connexion
            </MobileHeaderButton>
          </Link>
        </MobileHeaderButtons>

        <Link to="/" onClick={scrollToTop} style={{ textDecoration: "none" }}>
          <Logo>
            <LogoAnimation>
              <Suspense fallback={<div style={{ width: 40, height: 40 }} />}>
                <EnhancedLottie animationData={planningAnimation} loop={true} />
              </Suspense>
            </LogoAnimation>
            SmartPlanning
          </Logo>
        </Link>

        {showSectionNav && (
          <SectionNav>
            {landingSections.map((section) => (
              <SectionNavLink
                key={section.id}
                $isActive={activeSection === section.id}
                $isDarkMode={isDarkMode}
                onClick={() => scrollToSection(section.id, section.offset)}
              >
                {section.label}
              </SectionNavLink>
            ))}
          </SectionNav>
        )}

        {/* Menu Burger pour mobile */}
        <BurgerButton
          $isDarkMode={isDarkMode}
          onClick={toggleMobileMenu}
          data-mobile-menu
          aria-label="Menu de navigation"
        >
          <BurgerLine $isOpen={isMobileMenuOpen} $isDarkMode={isDarkMode} />
          <BurgerLine $isOpen={isMobileMenuOpen} $isDarkMode={isDarkMode} />
          <BurgerLine $isOpen={isMobileMenuOpen} $isDarkMode={isDarkMode} />
        </BurgerButton>

        {/* Navigation desktop */}
        <DesktopNav>
          <ThemeSwitchWrapper>
            <ThemeSwitch onChange={toggleTheme} checked={isDarkMode} />
          </ThemeSwitchWrapper>
          <Link to="/connexion">
            <LoginButton variant="ghost">🔐 Connexion</LoginButton>
          </Link>
          <Link to="/inscription">
            <SignupButton variant="primary">✨ S'inscrire</SignupButton>
          </Link>
        </DesktopNav>
      </HeaderContent>

      {/* Overlay Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Mobile */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <MobileMenu
            $isDarkMode={isDarkMode}
            data-mobile-menu
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4
            }}
          >
            {/* Bouton de fermeture */}
            <CloseButton
              $isDarkMode={isDarkMode}
              onClick={() => setIsMobileMenuOpen(false)}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <CloseIcon $isDarkMode={isDarkMode} />
            </CloseButton>

            {/* Contenu du menu */}
            <MobileMenuContent>
              {/* Navigation par sections */}
              <MobileNavSection>
                <MobileNavTitle $isDarkMode={isDarkMode}>
                  Navigation
                </MobileNavTitle>
              {landingSections.map((section, index) => (
                <MobileSectionNavLink
                  key={section.id}
                  $isActive={activeSection === section.id}
                  $isDarkMode={isDarkMode}
                  onClick={() => scrollToSection(section.id, section.offset)}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.05 + index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {section.label}
                </MobileSectionNavLink>
              ))}
            </MobileNavSection>

            {/* Contrôles */}
            <MobileNavSection>
              <MobileNavTitle $isDarkMode={isDarkMode}>
                Préférences
              </MobileNavTitle>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem 1.25rem', 
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', 
                borderRadius: '14px',
                marginBottom: '0.5rem'
              }}>
                <span style={{ 
                  color: isDarkMode ? '#e2e8f0' : '#1f2937', 
                  fontWeight: '500',
                  fontSize: '1.0625rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}>
                  {isDarkMode ? 'Mode sombre' : 'Mode clair'}
                </span>
                <ThemeSwitch onChange={toggleTheme} checked={isDarkMode} />
              </div>
            </MobileNavSection>

            {/* Boutons d'authentification */}
            <MobileAuthButtons>
              <Link to="/connexion" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                <MobileLoginButton $isDarkMode={isDarkMode} variant="ghost">
                  Connexion
                </MobileLoginButton>
              </Link>
              <Link to="/inscription" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                <MobileSignupButton variant="primary">
                  Commencer gratuitement
                </MobileSignupButton>
              </Link>
            </MobileAuthButtons>
            </MobileMenuContent>
          </MobileMenu>
        )}
      </AnimatePresence>
    </HeaderContainer>
  );
};

export default Header;

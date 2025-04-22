import React, { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import planningAnimation from "../../assets/animations/planning-animation.json";
import { useTheme } from "../../components/ThemeProvider";

const EnhancedLottie = lazy(() => import("../ui/EnhancedLottie"));

interface DarkModeProps {
  isDarkMode?: boolean;
}

const FooterContainer = styled.footer<DarkModeProps>`
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#0A0F1A" : "#F8F9FA")};
  padding: 1.5rem 1rem;
  border-top: 1px solid
    ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
`;

const FooterLogo = styled(Link)`
  font-size: 1.25rem;
  font-weight: 700;
  color: #4f46e5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
`;

const LogoAnimation = styled.div`
  width: 30px;
  height: 30px;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const FooterLink = styled(Link)<DarkModeProps>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #4f46e5;
    text-decoration: underline;
  }
`;

const FooterCopyright = styled.div<DarkModeProps>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  font-size: 0.875rem;
  text-align: center;
  width: 100%;
  margin-top: 1rem;
`;

const Footer: React.FC<{ scrollToTop?: () => void }> = ({ scrollToTop }) => {
  const { isDarkMode } = useTheme();

  return (
    <FooterContainer isDarkMode={isDarkMode}>
      <FooterContent>
        <FooterLogo to="/" onClick={scrollToTop}>
          <LogoAnimation>
            <Suspense fallback={<div style={{ width: 30, height: 30 }} />}>
              <EnhancedLottie
                animationData={planningAnimation}
                loop={true}
                style={{ width: "30px", height: "30px" }}
              />
            </Suspense>
          </LogoAnimation>
          SmartPlanning
        </FooterLogo>

        <FooterLinks>
          <FooterLink to="/conditions-utilisation" isDarkMode={isDarkMode}>
            Conditions d'utilisation
          </FooterLink>
          <FooterLink to="/confidentialite" isDarkMode={isDarkMode}>
            Politique de confidentialité
          </FooterLink>
          <FooterLink to="/contact" isDarkMode={isDarkMode}>
            Contact
          </FooterLink>
        </FooterLinks>
      </FooterContent>
      <FooterCopyright isDarkMode={isDarkMode}>
        &copy; 2025 SmartPlanning. Tous droits réservés.
      </FooterCopyright>
    </FooterContainer>
  );
};

export default Footer;

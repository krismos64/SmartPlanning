import { Linkedin } from "lucide-react";
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
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? "linear-gradient(135deg, #0A0F1A, #121829)"
      : "linear-gradient(135deg, #F0F4F8, #FFFFFF)"};
  padding: 3rem 1.5rem;
  border-top: 1px solid
    ${({ isDarkMode }) => (isDarkMode ? "#2D3748" : "#E2E8F0")};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
`;

const FooterLogo = styled(Link)`
  font-size: 1.6rem;
  font-weight: 700;
  color: #4f46e5;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
`;

const LogoAnimation = styled.div`
  width: 50px;
  height: 50px;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const FooterLink = styled(Link)<DarkModeProps>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: #4f46e5;
    text-decoration: underline;
  }
`;

const Socials = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: #4f46e5;
    color: white;
  }
`;

const FooterCopyright = styled.div<DarkModeProps>`
  color: ${({ isDarkMode }) => (isDarkMode ? "#94A3B8" : "#6b7280")};
  font-size: 0.9rem;
  text-align: center;
  margin-top: 2rem;
`;

const Footer: React.FC<{ scrollToTop?: () => void }> = ({ scrollToTop }) => {
  const { isDarkMode } = useTheme();

  return (
    <FooterContainer isDarkMode={isDarkMode}>
      <FooterContent>
        <FooterLogo to="/" onClick={scrollToTop}>
          <LogoAnimation>
            <Suspense fallback={<div style={{ width: 50, height: 50 }} />}>
              <EnhancedLottie
                animationData={planningAnimation}
                loop={true}
                style={{ width: "50px", height: "50px" }}
              />
            </Suspense>
          </LogoAnimation>
          SmartPlanning
        </FooterLogo>

        <FooterLinks>
          <FooterLink to="/terms" isDarkMode={isDarkMode}>
            Conditions d'utilisation
          </FooterLink>
          <FooterLink to="/privacy" isDarkMode={isDarkMode}>
            Politique de confidentialité
          </FooterLink>
          <FooterLink to="/contact" isDarkMode={isDarkMode}>
            Contact
          </FooterLink>
        </FooterLinks>

        <Socials>
          <SocialLink
            href="https://www.linkedin.com/company/smartplanning-fr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SmartPlanning sur LinkedIn"
          >
            <Linkedin size={20} />
          </SocialLink>
        </Socials>
      </FooterContent>

      <FooterCopyright isDarkMode={isDarkMode}>
        &copy; 2025 SmartPlanning. Tous droits réservés.
      </FooterCopyright>
    </FooterContainer>
  );
};

export default Footer;

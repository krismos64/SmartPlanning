import { Instagram, Linkedin, Youtube } from "lucide-react";
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

const TikTokIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.849-1.302-1.991-1.302-3.338V1h-3.015v14.886c0 2.088-1.699 3.786-3.787 3.786s-3.786-1.698-3.786-3.786c0-2.088 1.698-3.786 3.786-3.786.209 0 .412.018.611.051V8.089a7.865 7.865 0 0 0-.611-.024C5.516 8.065 2 11.58 2 15.886S5.516 23.708 9.822 23.708s7.823-3.515 7.823-7.822V9.813c1.14.86 2.54 1.403 4.077 1.403V8.2c-1.047 0-2.06-.439-2.787-1.204-.298-.313-.553-.66-.767-1.034-.205-.359-.357-.748-.451-1.146-.047-.2-.076-.404-.076-.612V5.562h-.39z" />
  </svg>
);

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
          <FooterLink to="/mentions-legales" isDarkMode={isDarkMode}>
            Conditions d'utilisation
          </FooterLink>
          <FooterLink
            to="/politique-de-confidentialite"
            isDarkMode={isDarkMode}
          >
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

          <SocialLink
            href="https://www.youtube.com/@SmartPlanning-x2c"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SmartPlanning sur YouTube"
          >
            <Youtube size={20} />
          </SocialLink>

          <SocialLink
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SmartPlanning sur Instagram (bientôt disponible)"
            style={{ opacity: 0.6, cursor: "not-allowed" }}
            onClick={(e) => e.preventDefault()}
          >
            <Instagram size={20} />
          </SocialLink>

          <SocialLink
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SmartPlanning sur TikTok (bientôt disponible)"
            style={{ opacity: 0.6, cursor: "not-allowed" }}
            onClick={(e) => e.preventDefault()}
          >
            <TikTokIcon />
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

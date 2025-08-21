import { Instagram, Linkedin, Youtube } from "lucide-react";
import React, { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import planningAnimation from "../../assets/animations/planning-animation.json";
import { useTheme } from "../../components/ThemeProvider";

const EnhancedLottie = lazy(() => import("../ui/EnhancedLottie"));

interface DarkModeProps {
  $isDarkMode?: boolean;
}

const FooterContainer = styled.footer<DarkModeProps>`
  background: ${({ $isDarkMode }) =>
    $isDarkMode
      ? "linear-gradient(135deg, #0A0F1A, #121829)"
      : "linear-gradient(135deg, #F0F4F8, #FFFFFF)"};
  padding: 3rem 1.5rem;
  border-top: 1px solid
    ${({ $isDarkMode }) => ($isDarkMode ? "#2D3748" : "#E2E8F0")};
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

const FooterBrand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  
  @media (min-width: 768px) {
    align-items: flex-start;
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

const PromoText = styled.p<DarkModeProps>`
  font-size: 0.85rem;
  color: ${({ $isDarkMode }) => ($isDarkMode ? "#94A3B8" : "#6b7280")};
  margin: 0;
  max-width: 250px;
  line-height: 1.4;
  text-align: center;
  
  @media (min-width: 768px) {
    text-align: left;
  }
`;

const PaymentBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (min-width: 768px) {
    justify-content: flex-start;
  }
`;

const PaymentBadge = styled.div<DarkModeProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: ${({ $isDarkMode }) => ($isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(79, 70, 229, 0.05)')};
  border: 1px solid ${({ $isDarkMode }) => ($isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(79, 70, 229, 0.1)')};
  border-radius: 8px;
  font-size: 0.75rem;
  color: ${({ $isDarkMode }) => ($isDarkMode ? "#94A3B8" : "#6b7280")};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ $isDarkMode }) => ($isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(79, 70, 229, 0.08)')};
    border-color: #4f46e5;
  }
`;

const SecureText = styled.div<DarkModeProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${({ $isDarkMode }) => ($isDarkMode ? "#10B981" : "#059669")};
  margin-top: 0.5rem;
  justify-content: center;
  
  @media (min-width: 768px) {
    justify-content: flex-start;
  }
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
  color: ${({ $isDarkMode }) => ($isDarkMode ? "#94A3B8" : "#6b7280")};
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
  color: ${({ $isDarkMode }) => ($isDarkMode ? "#94A3B8" : "#6b7280")};
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
    <FooterContainer $isDarkMode={isDarkMode}>
      <FooterContent>
        <FooterBrand>
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
          
          <PromoText $isDarkMode={isDarkMode}>
            La solution SaaS intelligente pour optimiser vos plannings d'équipe et révolutionner votre gestion RH.
          </PromoText>
          
          <PaymentBadges>
            <PaymentBadge $isDarkMode={isDarkMode}>
              <svg width="24" height="15" viewBox="0 0 24 15" fill="none">
                <rect width="24" height="15" rx="2" fill="#1434CB"/>
                <text x="12" y="10" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">VISA</text>
              </svg>
              Visa
            </PaymentBadge>
            
            <PaymentBadge $isDarkMode={isDarkMode}>
              <svg width="24" height="15" viewBox="0 0 24 15" fill="none">
                <rect width="24" height="15" rx="2" fill="#EB001B"/>
                <circle cx="8" cy="7.5" r="5" fill="#EB001B" opacity="0.8"/>
                <circle cx="16" cy="7.5" r="5" fill="#FF5F00" opacity="0.8"/>
              </svg>
              Mastercard
            </PaymentBadge>
            
            <PaymentBadge $isDarkMode={isDarkMode}>
              <svg width="24" height="15" viewBox="0 0 24 15" fill="none">
                <rect width="24" height="15" rx="2" fill="#0070BA"/>
                <text x="12" y="6" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold">PayPal</text>
                <text x="12" y="11" textAnchor="middle" fill="white" fontSize="3">SECURE</text>
              </svg>
              PayPal
            </PaymentBadge>
          </PaymentBadges>
          
          <SecureText $isDarkMode={isDarkMode}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
            </svg>
            Paiements 100% sécurisés
          </SecureText>
        </FooterBrand>

        <FooterLinks>
          <FooterLink to="/mentions-legales" $isDarkMode={isDarkMode}>
            Conditions d'utilisation
          </FooterLink>
          <FooterLink
            to="/politique-de-confidentialite"
            $isDarkMode={isDarkMode}
          >
            Politique de confidentialité
          </FooterLink>
          <FooterLink to="/contact" $isDarkMode={isDarkMode}>
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

      <FooterCopyright $isDarkMode={isDarkMode}>
        &copy; 2025 SmartPlanning. Tous droits réservés.
      </FooterCopyright>
    </FooterContainer>
  );
};

export default Footer;

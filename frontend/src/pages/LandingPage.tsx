import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import planningAnimation from "../assets/animations/planning-animation.json";
import { useTheme } from "../components/ThemeProvider";
import Button from "../components/ui/Button";
import EnhancedLottie from "../components/ui/EnhancedLottie";
import { ThemeSwitch } from "../components/ui/ThemeSwitch";

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideInLeft = keyframes`
  from {
    transform: translateX(-50px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideInRight = keyframes`
  from {
    transform: translateX(50px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

// Composants stylisés
const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text.primary};
  animation: ${fadeIn} 0.5s ease-in-out;
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow-x: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.small};
  background-color: ${({ theme }) => theme.colors.surface};
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const Logo = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes["2xl"]};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LogoAnimation = styled.div`
  width: 40px;
  height: 40px;
  animation: ${float} 3s ease-in-out infinite;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    gap: 1rem;
  }
`;

const ThemeSwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeroSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;

  @media (max-width: 992px) {
    flex-direction: column;
    text-align: center;
    padding: 4rem 1rem;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  animation: ${slideInLeft} 0.7s ease-in-out;
  position: relative;
  z-index: 2;

  @media (max-width: 992px) {
    order: 2;
    margin-top: 2rem;
    animation: ${slideUp} 0.7s ease-in-out;
  }
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1.2;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 100px;
    height: 5px;
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.primary},
      ${({ theme }) => theme.colors.secondary || theme.colors.primary + "99"}
    );
    border-radius: 5px;
  }

  @media (max-width: 992px) {
    &::after {
      left: 50%;
      transform: translateX(-50%);
    }
  }

  @media (max-width: 768px) {
    font-size: 2.8rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.3rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;

  @media (max-width: 992px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 992px) {
    justify-content: center;
  }

  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const AnimationContainer = styled.div`
  flex: 1;
  max-width: 550px;
  animation: ${slideInRight} 1s ease-in-out, ${float} 6s ease-in-out infinite;
  position: relative;
  z-index: 2;

  @media (max-width: 992px) {
    order: 1;
    max-width: 400px;
    animation: ${fadeIn} 1s ease-in-out, ${float} 6s ease-in-out infinite;
  }
`;

const BackgroundDecoration = styled.div`
  position: absolute;
  background: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.primary}15,
    transparent 70%
  );
  border-radius: 50%;
  z-index: 1;

  &.top-right {
    width: 500px;
    height: 500px;
    top: -200px;
    right: -200px;
  }

  &.bottom-left {
    width: 300px;
    height: 300px;
    bottom: -100px;
    left: -100px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const SectionSubtitle = styled.p`
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 3rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FeaturesSection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.surface};
  position: relative;
  z-index: 1;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureCard = styled(motion.div).attrs({
  whileHover: { translateY: -10 },
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
})`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

const DemoSection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  position: relative;
`;

const DemoContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const DemoVideoContainer = styled.div`
  aspect-ratio: 16/9;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.large};

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const CTASection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const CircleDecoration = styled.div`
  position: absolute;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;

  &.small {
    width: 100px;
    height: 100px;
    top: 10%;
    left: 10%;
  }

  &.medium {
    width: 200px;
    height: 200px;
    bottom: 10%;
    right: 5%;
  }

  &.large {
    width: 300px;
    height: 300px;
    top: -100px;
    right: -100px;
  }
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: white;
  position: relative;
  z-index: 2;
`;

const CTADescription = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 2;
`;

// Composants pour la section Bénéfices
const BenefitsSection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.surface};
  position: relative;
`;

const BenefitItem = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all 0.5s ease;
  opacity: 0;
  transform: translateY(20px);

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

const BenefitIcon = styled.div`
  font-size: 2rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary}15;
  border-radius: 50%;
  flex-shrink: 0;
`;

const BenefitContent = styled.div`
  flex: 1;
`;

const BenefitTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const BenefitDescription = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

const TestimonialImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  margin-bottom: 2rem;
`;

// Composant Footer
const Footer = styled.footer`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border || "#e2e8f0"};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const FooterLogo = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FooterLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;

const FooterCopyright = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

interface LandingPageProps {}

const LandingPage: React.FC<LandingPageProps> = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const demoRef = useRef<HTMLElement | null>(null);
  const [visibleBenefits, setVisibleBenefits] = useState<number[]>([]);
  const benefitsRef = useRef<HTMLDivElement | null>(null);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const benefits = Array.from(entry.target.children);
            benefits.forEach((benefit, index) => {
              setTimeout(() => {
                setVisibleBenefits((prev) => [...prev, index]);
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentBenefitsRef = benefitsRef.current;

    if (currentBenefitsRef) {
      observer.observe(currentBenefitsRef);
    }

    return () => {
      if (currentBenefitsRef) {
        observer.unobserve(currentBenefitsRef);
      }
    };
  }, []);

  // Données structurées JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SmartPlanning",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    description:
      "Optimisez la gestion de vos plannings avec SmartPlanning. Version bêta gratuite, intuitive et assistée par IA.",
    featureList: [
      "Planification intelligente",
      "Gestion des employés",
      "Optimisation des plannings",
      "Interface intuitive",
    ],
    url: "https://smartplanning.fr",
    author: {
      "@type": "Organization",
      name: "SmartPlanning",
      url: "https://smartplanning.fr",
    },
  };

  // Données structurées pour organisation
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SmartPlanning",
    url: "https://smartplanning.fr",
    logo: "https://smartplanning.fr/images/logo-smartplanning.png",
    description:
      "SmartPlanning offre une solution de planification intelligente pour les entreprises de toutes tailles.",
  };

  // Données structurées pour FAQ
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que SmartPlanning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SmartPlanning est une solution de planification intelligente pour entreprises, qui utilise l'intelligence artificielle pour optimiser vos plannings d'employés. Notre plateforme est disponible sur smartplanning.fr et propose une version bêta gratuite.",
        },
      },
      {
        "@type": "Question",
        name: "Comment fonctionne l'optimisation des plannings avec l'IA ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Notre algorithme d'IA analyse les contraintes de votre entreprise (disponibilités des employés, compétences requises, règles de travail) pour générer automatiquement des plannings optimisés qui maximisent l'efficacité tout en respectant les préférences de chacun.",
        },
      },
      {
        "@type": "Question",
        name: "SmartPlanning est-il vraiment gratuit ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, SmartPlanning est actuellement disponible gratuitement pendant sa phase bêta. Après le lancement officiel, nous proposerons différentes formules tarifaires, mais les utilisateurs de la bêta bénéficieront d'un mois gratuit supplémentaire.",
        },
      },
      {
        "@type": "Question",
        name: "Quels types d'entreprises peuvent utiliser SmartPlanning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SmartPlanning s'adapte à tous types d'entreprises : restaurants, commerces, hôpitaux, cliniques, usines, centres d'appels, etc. Notre solution est particulièrement efficace pour les entreprises avec des horaires variables ou complexes.",
        },
      },
      {
        "@type": "Question",
        name: "Comment puis-je accéder à SmartPlanning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SmartPlanning est accessible directement depuis votre navigateur sur smartplanning.fr. Il suffit de créer un compte gratuit pour commencer à utiliser toutes les fonctionnalités. Notre application est responsive et fonctionne sur ordinateurs, tablettes et smartphones.",
        },
      },
      {
        "@type": "Question",
        name: "Mes données sont-elles sécurisées avec SmartPlanning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolument. La sécurité est notre priorité. Toutes les données sont cryptées et nous respectons strictement le RGPD. Nous n'utilisons jamais vos données à des fins commerciales et vous restez propriétaire de toutes vos informations.",
        },
      },
    ],
  };

  return (
    <Container>
      <Helmet>
        <title>
          SmartPlanning - Logiciel de planification intelligent et gratuit pour
          les entreprises
        </title>
        <meta
          name="description"
          content="SmartPlanning.fr - Optimisez la gestion de vos plannings d'entreprise avec notre solution intelligente assistée par IA. Version bêta gratuite, intuitive et efficace. Essayez-la dès maintenant !"
        />
        <meta
          name="keywords"
          content="planification, planning, IA, intelligence artificielle, gestion d'entreprise, optimisation, bêta gratuite, smartplanning.fr, logiciel planning, planning entreprise, planning employés"
        />
        <meta property="og:url" content="https://smartplanning.fr" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://smartplanning.fr" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">
          {JSON.stringify(organizationLd)}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <Header>
        <Logo>
          <LogoAnimation>
            <EnhancedLottie animationData={planningAnimation} loop={true} />
          </LogoAnimation>
          SmartPlanning
        </Logo>
        <Nav>
          <ThemeSwitchWrapper>
            <ThemeSwitch onChange={toggleTheme} checked={isDarkMode} />
          </ThemeSwitchWrapper>
          <Link to="/login">
            <Button variant="ghost">Connexion</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary">S'inscrire</Button>
          </Link>
        </Nav>
      </Header>

      <HeroSection>
        <BackgroundDecoration className="top-right" />
        <BackgroundDecoration className="bottom-left" />

        <HeroContent>
          <HeroTitle>Plannings intelligents pour votre entreprise</HeroTitle>
          <HeroSubtitle>
            Optimisez vos plannings d'entreprise avec notre solution assistée
            par IA. Facile, intuitive et accessible à tous.
          </HeroSubtitle>
          <CTAButtons>
            <Link to="/register">
              <Button size="lg">Commencer gratuitement</Button>
            </Link>
            <Button variant="secondary" size="lg" onClick={scrollToDemo}>
              Voir la démo
            </Button>
          </CTAButtons>
        </HeroContent>
        <AnimationContainer>
          <EnhancedLottie
            animationData={planningAnimation}
            loop={true}
            alt="Animation de planification intelligente avec SmartPlanning"
          />
        </AnimationContainer>
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>Fonctionnalités principales</SectionTitle>
        <SectionSubtitle>
          Découvrez comment SmartPlanning simplifie la gestion de vos équipes
        </SectionSubtitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>🧠</FeatureIcon>
            <FeatureTitle>Planification intelligente par IA</FeatureTitle>
            <FeatureDescription>
              Notre algorithme génère automatiquement des plannings optimisés en
              tenant compte des contraintes et préférences.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>💰</FeatureIcon>
            <FeatureTitle>Version bêta 100% gratuite</FeatureTitle>
            <FeatureDescription>
              Profitez de toutes les fonctionnalités gratuitement pendant notre
              phase bêta et aidez-nous à améliorer SmartPlanning.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>📱</FeatureIcon>
            <FeatureTitle>Compatible tous appareils</FeatureTitle>
            <FeatureDescription>
              Consultez et modifiez vos plannings depuis votre ordinateur,
              tablette ou smartphone, où que vous soyez.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>📄</FeatureIcon>
            <FeatureTitle>Export en PDF</FeatureTitle>
            <FeatureDescription>
              Exportez vos plannings en PDF pour les imprimer ou les partager
              facilement avec vos équipes.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>Sécurité maximale</FeatureTitle>
            <FeatureDescription>
              Vos données sont cryptées et protégées. Nous respectons
              strictement le RGPD et la confidentialité.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>📊</FeatureIcon>
            <FeatureTitle>Statistiques avancées</FeatureTitle>
            <FeatureDescription>
              Suivez et analysez les heures travaillées, les coûts et
              l'efficacité de vos plannings.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      <DemoSection ref={demoRef} id="demo-section">
        <DemoContainer>
          <SectionTitle>Votre nouvel outil de planification RH</SectionTitle>
          <SectionSubtitle>
            Un aperçu de l'interface simple et intuitive de SmartPlanning
          </SectionSubtitle>
          <DemoVideoContainer>
            <iframe
              src="https://www.youtube.com/embed/wXrZH0l1a9U"
              title="SmartPlanning - Démonstration vidéo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </DemoVideoContainer>
        </DemoContainer>
      </DemoSection>

      <BenefitsSection>
        <SectionTitle>Pourquoi choisir SmartPlanning ?</SectionTitle>
        <SectionSubtitle>
          Les avantages concrets pour votre entreprise
        </SectionSubtitle>

        <div
          style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}
        >
          <TestimonialImage
            src="/src/assets/images/comic-smartplanning.png"
            alt="Témoignages clients SmartPlanning - Bénéfices de la planification intelligente"
          />
        </div>

        <div ref={benefitsRef} style={{ maxWidth: "900px", margin: "0 auto" }}>
          <BenefitItem className={visibleBenefits.includes(0) ? "visible" : ""}>
            <BenefitIcon>⏱️</BenefitIcon>
            <BenefitContent>
              <BenefitTitle>Gain de temps considérable</BenefitTitle>
              <BenefitDescription>
                Réduisez jusqu'à 80% le temps consacré à la création et gestion
                de vos plannings d'équipe.
              </BenefitDescription>
            </BenefitContent>
          </BenefitItem>

          <BenefitItem className={visibleBenefits.includes(1) ? "visible" : ""}>
            <BenefitIcon>💼</BenefitIcon>
            <BenefitContent>
              <BenefitTitle>Réduction des coûts</BenefitTitle>
              <BenefitDescription>
                Optimisez vos ressources humaines et évitez le sureffectif ou
                les périodes creuses.
              </BenefitDescription>
            </BenefitContent>
          </BenefitItem>

          <BenefitItem className={visibleBenefits.includes(2) ? "visible" : ""}>
            <BenefitIcon>🔄</BenefitIcon>
            <BenefitContent>
              <BenefitTitle>Flexibilité maximale</BenefitTitle>
              <BenefitDescription>
                Ajustez vos plannings en temps réel et adaptez-vous rapidement
                aux imprévus.
              </BenefitDescription>
            </BenefitContent>
          </BenefitItem>

          <BenefitItem className={visibleBenefits.includes(3) ? "visible" : ""}>
            <BenefitIcon>📊</BenefitIcon>
            <BenefitContent>
              <BenefitTitle>Données exploitables</BenefitTitle>
              <BenefitDescription>
                Prenez des décisions basées sur des données précises et des
                analyses automatisées.
              </BenefitDescription>
            </BenefitContent>
          </BenefitItem>
        </div>
      </BenefitsSection>

      <CTASection>
        <CircleDecoration className="small" />
        <CircleDecoration className="medium" />
        <CircleDecoration className="large" />

        <CTATitle>Prêt à optimiser vos plannings ?</CTATitle>
        <CTADescription>
          Rejoignez les entreprises qui gagnent du temps et améliorent leur
          efficacité avec SmartPlanning.
        </CTADescription>
        <Link to="/register">
          <Button
            variant="primary"
            size="lg"
            className="z-10 relative bg-white text-primary hover:transform-translateY-5 py-4 px-8 text-lg font-semibold"
          >
            Commencer gratuitement
          </Button>
        </Link>
      </CTASection>

      <Footer>
        <FooterContent>
          <FooterLogo>
            <LogoAnimation>
              <EnhancedLottie
                animationData={planningAnimation}
                loop={true}
                style={{ width: "30px", height: "30px" }}
              />
            </LogoAnimation>
            SmartPlanning
          </FooterLogo>

          <FooterLinks>
            <FooterLink to="/mentions-legales">Mentions légales</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/support">Support</FooterLink>
          </FooterLinks>

          <FooterCopyright>
            &copy; {new Date().getFullYear()} SmartPlanning
          </FooterCopyright>
        </FooterContent>
      </Footer>
    </Container>
  );
};

export default LandingPage;

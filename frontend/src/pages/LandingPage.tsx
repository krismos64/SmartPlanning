import { AnimatePresence, motion } from "framer-motion";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import planningAnimation from "../assets/animations/planning-animation.json";
import FooterComponent from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { Theme, useTheme } from "../components/ThemeProvider";
import Button from "../components/ui/Button";
// Import différé d'EnhancedLottie pour optimiser le chargement
const EnhancedLottie = lazy(() => import("../components/ui/EnhancedLottie"));

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

const FeatureCard = styled(motion.div).attrs(({ theme }) => ({
  whileHover: { translateY: -10 },
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}))`
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

// Nouvelle version statique de FeatureCard pour mobile (optimisation performance)
const FeatureCardStatic = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  /* Conserve l'effet hover même sur mobile mais sans framer-motion */
  &:hover {
    transform: translateY(-10px);
  }
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

// Nouveaux composants pour la section vidéo
const AnimatedVideoWrapper = styled(motion.div)`
  position: relative;
  margin: 2rem auto;
  overflow: hidden;
  border-radius: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.large};

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border: 3px solid ${({ theme }) => theme.colors.primary};
    border-radius: 1rem;
    opacity: 0.7;
    z-index: 1;
    pointer-events: none;
  }
`;

const VideoTitle = styled(motion.h3)`
  font-size: 1.8rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const VideoPreviewContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 1rem;
  cursor: pointer;
`;

const VideoPreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
`;

const PlayButton = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  z-index: 10;

  &::before {
    content: "";
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const ImageCarouselCard = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 3rem auto;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.shadows.large};
  transition: transform 0.4s ease;
  overflow: hidden;
  position: relative;

  &:hover {
    transform: translateY(-10px);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      ${({ theme }) => theme.colors.primary},
      ${({ theme }) => theme.colors.secondary || theme.colors.primary}
    );
  }
`;

const CarouselTitle = styled.h3`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
`;

const ImagesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 1rem;
`;

const ImageWrapper = styled(motion.div)`
  width: calc(33% - 1rem);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 100%;
  }

  &:hover {
    transform: scale(1.03);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

const CarouselImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  &:hover {
    transform: scale(1.05);
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
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  text-align: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
`;

const FooterLogo = styled(Link)`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
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
  text-align: center;
  width: 100%;
  margin-top: 1rem;
`;

const HeroBrandImage = styled.img`
  height: 300px;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    height: auto;
    width: 100%;
    max-width: 200px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const BenefitsSection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.background};
`;

const TestimonialImage = styled.img`
  max-width: 100%;
  border-radius: 1rem;
  margin-bottom: 3rem;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.medium};
    transform: translateY(-5px);
  }
`;

const BenefitIcon = styled.div`
  font-size: 2rem;
  margin-right: 1.5rem;
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

const UserReviewsSection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.surface};
  position: relative;
  overflow: hidden;
`;

const UserReviewsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const UserReviewCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-8px);
  }
`;

const UserAvatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 3px solid ${({ theme }) => theme.colors.primary};
`;

const UserName = styled.h3`
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const UserRole = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 1rem;
`;

const UserComment = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 1rem;
`;

const UserRating = styled.div`
  color: #ffd700;
  font-size: 1.2rem;
  font-weight: 600;
`;

const BetaSection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.surface};
  text-align: center;
`;

const BetaContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const BetaTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const BetaDescription = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const BetaFeatures = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

// Améliorations des features bêta
const BetaFeature = styled(motion.div)`
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 1.5rem;
  border-radius: 0.8rem;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const BetaFeatureIcon = styled.div`
  font-size: 1.8rem;
  margin-right: 1rem;
`;

const BetaFeatureText = styled.p`
  font-size: 1rem;
`;

const BetaButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
`;

const FAQSection = styled.section`
  padding: 5rem 2rem;
  background-color: ${({ theme }) => theme.colors.background};
`;

const FAQContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FAQCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const FAQQuestion = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 0.8rem;

  span {
    font-size: 1.5rem;
  }
`;

const FAQAnswer = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

// Amélioration du CTA
const CTAButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  position: relative;
  z-index: 10;
  width: 100%;
`;

const CTAButton = styled(motion.button)`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.secondary || theme.colors.primary + "aa"}
  );
  color: white;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 0.8rem;
  border: none;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 320px;
  margin: 0 auto;

  &:hover {
    transform: scale(1.1);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }

  @media (max-width: 576px) {
    width: 100%;
    padding: 1rem 1.5rem;
  }
`;

// Nouveaux composants pour le modal de bienvenue
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContainer = styled(motion.div)`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  max-width: 650px;
  width: 100%;
  max-height: 85vh;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &::before {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      45deg,
      #3b82f6,
      #06b6d4,
      #10b981,
      #f59e0b,
      #ef4444,
      #8b5cf6,
      #3b82f6
    );
    background-size: 400% 400%;
    border-radius: 1.5rem;
    z-index: -1;
    animation: ${keyframes`
      0% { 
        background-position: 0% 50%;
        filter: hue-rotate(0deg) brightness(1);
      }
      25% { 
        background-position: 100% 50%;
        filter: hue-rotate(90deg) brightness(1.2);
      }
      50% { 
        background-position: 100% 100%;
        filter: hue-rotate(180deg) brightness(1);
      }
      75% { 
        background-position: 0% 100%;
        filter: hue-rotate(270deg) brightness(1.2);
      }
      100% { 
        background-position: 0% 50%;
        filter: hue-rotate(360deg) brightness(1);
      }
    `} 4s ease-in-out infinite;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    border-radius: 1.5rem;
    z-index: -1;
  }

  @media (max-width: 576px) {
    padding: 2rem 1.5rem;
    margin: 1rem;
    max-height: 90vh;
  }
`;

const ScrollableContent = styled.div`
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #3b82f6, #06b6d4);
    border-radius: 3px;
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #2563eb, #0891b2);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
  }

  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #3b82f6 rgba(255, 255, 255, 0.05);

  @media (max-width: 576px) {
    max-height: 75vh;
  }
`;

const ModalContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
`;

const WelcomeTitle = styled(motion.h1)`
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #3b82f6, #06b6d4);
  background-size: 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);

  @media (max-width: 576px) {
    font-size: 1.8rem;
  }
`;

const WelcomeSubtitle = styled(motion.p)`
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  color: #cbd5e1;
`;

const CardsContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const ModalCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: left;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.2);

    &::before {
      left: 100%;
    }
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardIcon = styled.div`
  font-size: 1.8rem;
  margin-right: 0.8rem;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
`;

const CardDescription = styled.p`
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
`;

const ContactSection = styled(motion.div)`
  background: rgba(6, 182, 212, 0.05);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0 1.5rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      transparent,
      rgba(6, 182, 212, 0.1),
      transparent
    );
    animation: ${keyframes`
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    `} 8s linear infinite;
    z-index: -1;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 2px;
    background: rgba(6, 182, 212, 0.05);
    border-radius: 1rem;
    z-index: -1;
  }
`;

const ContactEmail = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #06b6d4;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
`;

const ContactText = styled.p`
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const ModalButton = styled(motion.button)`
  padding: 0.8rem 1.8rem;
  border: none;
  border-radius: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &.primary {
    background: linear-gradient(45deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);

      &::before {
        left: 100%;
      }
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.08);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
      box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);

      &::before {
        left: 100%;
      }
    }
  }

  @media (max-width: 576px) {
    width: 100%;
    margin-bottom: 0.5rem;
  }
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: white;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

// Composant bouton "retour en haut" moderne et futuriste
const ScrollToTopButton = styled(motion.button)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;

  /* Gradient futuriste */
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.secondary || theme.colors.primary + "aa"} 50%,
    #00d4ff 100%
  );

  /* Effet de bordure animée */
  &::before {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: linear-gradient(
      45deg,
      #00d4ff,
      ${({ theme }) => theme.colors.primary},
      #ff6b6b,
      #4ecdc4,
      #45b7d1,
      #00d4ff
    );
    background-size: 400% 400%;
    z-index: -1;
    animation: ${keyframes`
      0% { 
        background-position: 0% 50%;
        transform: rotate(0deg);
      }
      50% { 
        background-position: 100% 50%;
        transform: rotate(180deg);
      }
      100% { 
        background-position: 0% 50%;
        transform: rotate(360deg);
      }
    `} 3s ease-in-out infinite;
  }

  /* Effet de glow */
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.3);

  /* Animations au hover */
  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.3),
      0 12px 40px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }

  /* Responsive */
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    bottom: 1.5rem;
    right: 1.5rem;
    font-size: 1.2rem;
  }

  /* Animation de l'icône */
  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateY(-2px);
  }
`;

const ScrollToTopIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  /* Effet de particules */
  &::after {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    animation: ${keyframes`
      0% { 
        opacity: 0;
        transform: translateX(-50%) translateY(0);
      }
      50% { 
        opacity: 1;
        transform: translateX(-50%) translateY(-8px);
      }
      100% { 
        opacity: 0;
        transform: translateX(-50%) translateY(-16px);
      }
    `} 2s ease-in-out infinite;
  }

  &::before {
    content: "";
    position: absolute;
    width: 3px;
    height: 3px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    top: -6px;
    right: -6px;
    animation: ${keyframes`
      0% { 
        opacity: 0;
        transform: translateY(0);
      }
      50% { 
        opacity: 1;
        transform: translateY(-6px);
      }
      100% { 
        opacity: 0;
        transform: translateY(-12px);
      }
    `} 2.5s ease-in-out infinite 0.5s;
  }
`;

interface LandingPageProps {}

// Données FAQ pour corriger les placeholders
const faqData = [
  {
    icon: "🔒",
    question: "Comment mes données sont-elles protégées ?",
    answer:
      "Toutes vos données sont cryptées et sécurisées. Nous respectons strictement le RGPD et vous restez propriétaire de vos informations.",
  },
  {
    icon: "🧠",
    question:
      "L'intelligence artificielle de SmartPlanning est-elle réellement utile ?",
    answer:
      "Oui ! L'IA de SmartPlanning permet de générer automatiquement des plannings hebdomadaires optimisés en quelques secondes. Les managers gardent toujours le contrôle final via une validation manuelle simple.",
  },
  {
    icon: "📅",
    question: "Puis-je modifier un planning généré par l'IA ?",
    answer:
      "Absolument. Chaque planning généré peut être ajusté manuellement avant validation. Vous gardez une flexibilité totale tout en gagnant un temps précieux.",
  },
  {
    icon: "🔁",
    question:
      "Combien de temps faut-il pour mettre en place SmartPlanning dans mon entreprise ?",
    answer:
      "La mise en place est quasi-instantanée. Vous créez votre compte, invitez vos équipes, et commencez à générer vos premiers plannings en moins d'une heure.",
  },
  {
    icon: "📱",
    question: "Est-ce que SmartPlanning fonctionne sur mobile ?",
    answer:
      "Absolument ! SmartPlanning est entièrement responsive et fonctionne parfaitement sur tous les appareils : ordinateurs, tablettes et smartphones.",
  },
];

// Données pour les avis utilisateurs
const userReviews = [
  {
    id: 1,
    name: "Camille D.",
    role: "Responsable RH",
    avatar: "/images/user-camille.webp",
    comment:
      "L'IA de SmartPlanning m'a fait gagner 5h par semaine ! La génération automatique de plannings est bluffante et prend en compte toutes nos contraintes.",
    rating: "4.9 ⭐",
  },
  {
    id: 2,
    name: "Sofiane K.",
    role: "Manager équipe terrain",
    avatar: "/images/user-sofiane.webp",
    comment:
      "Super intuitif, je recommande ! Même mes collaborateurs les moins à l'aise avec la technologie ont adopté l'outil en quelques minutes.",
    rating: "4.7 ⭐",
  },
  {
    id: 3,
    name: "Lisa M.",
    role: "Fondatrice startup",
    avatar: "/images/user-lisa.webp",
    comment:
      "SmartPlanning a complètement changé ma gestion RH ! Facile à utiliser, adaptable et l'équipe support est réactive. Un must pour les petites structures.",
    rating: "5.0 ⭐",
  },
];

const LandingPage: React.FC<LandingPageProps> = () => {
  const { isDarkMode, theme }: { isDarkMode: boolean; theme: Theme } =
    useTheme();
  const demoRef = useRef<HTMLElement | null>(null);
  const [visibleBenefits, setVisibleBenefits] = useState<number[]>([]);
  const benefitsRef = useRef<HTMLDivElement | null>(null);
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // ✨ OPTIMISATION MOBILE : Détection du type d'appareil pour optimiser les performances
  // Désactive les animations framer-motion coûteuses sur mobile lors du premier rendu
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Détection mobile basée sur la largeur d'écran et le user agent
    const checkIsMobile = () => {
      const screenWidth = window.innerWidth;
      const isMobileScreen = screenWidth <= 768;

      // Double vérification avec user agent pour une détection plus précise
      const isMobileUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      return isMobileScreen || isMobileUA;
    };

    setIsMobile(checkIsMobile());

    // Mise à jour lors du redimensionnement (orientation mobile)
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * ✨ OPTIMISATION PERFORMANCE : Fonction qui retourne le bon composant FeatureCard
   * Sur mobile : div statique sans animations pour améliorer le rendu initial
   * Sur desktop : motion.div avec animations framer-motion complètes
   */
  const getResponsiveFeatureCard = (
    children: React.ReactNode,
    key?: string | number
  ) => {
    if (isMobile) {
      // Version optimisée mobile : pas d'animations coûteuses au premier rendu
      return <FeatureCardStatic key={key}>{children}</FeatureCardStatic>;
    }

    // Version desktop : animations complètes pour une expérience riche
    return <FeatureCard key={key}>{children}</FeatureCard>;
  };

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleVideoPlay = () => {
    setVideoPlayed(true);
  };

  const closeModal = () => {
    setShowWelcomeModal(false);
  };

  const handleContactRedirect = () => {
    setShowWelcomeModal(false);
    setTimeout(() => {
      window.location.href = "/contact";
    }, 300);
  };

  const sectionRef = useRef(null);

  // Données pour l'animation des particules
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
  }));

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

  // Gestion de l'affichage du bouton "retour en haut"
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Référence pour le haut de la page
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Données structurées JSON-LD optimisées pour le SEO
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
      description: "Version bêta gratuite",
    },
    description:
      "SmartPlanning est un SaaS de gestion de plannings et d'équipes pour entreprises. Solution intelligente avec IA pour optimiser vos plannings, gérer vos employés et automatiser vos ressources humaines.",
    featureList: [
      "Gestion de plannings intelligente",
      "Automatisation des RH",
      "Gestion d'équipes",
      "Export PDF des plannings",
      "Interface responsive",
      "IA pour optimisation",
      "Gestion des congés",
      "Liste des employés",
    ],
    url: "https://smartplanning.fr",
    author: {
      "@type": "Organization",
      name: "SmartPlanning",
      url: "https://smartplanning.fr",
    },
    keywords:
      "smartplanning, gestion plannings, saas planning, IA RH, planning manager, gestion équipe, automatisation plannings, smart planning, gestion des congés, liste des équipes, liste d'employés, export PDF, planning PDF",
  };

  // Données structurées pour organisation optimisées
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SmartPlanning",
    url: "https://smartplanning.fr",
    logo: "https://smartplanning.fr/images/logo-smartplanning.png",
    description:
      "SmartPlanning est un SaaS français de gestion de plannings et d'équipes pour entreprises. Notre solution intelligente avec IA permet d'optimiser vos plannings, gérer vos employés et automatiser vos ressources humaines.",
    sameAs: ["https://smartplanning.fr"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@smartplanning.fr",
      contactType: "customer service",
    },
  };

  // Données structurées pour FAQ optimisées
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que SmartPlanning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SmartPlanning est un SaaS de gestion de plannings et d'équipes pour entreprises. Notre solution intelligente utilise l'IA pour optimiser vos plannings d'employés, gérer vos équipes et automatiser vos ressources humaines. Disponible sur smartplanning.fr avec une version bêta gratuite.",
        },
      },
      {
        "@type": "Question",
        name: "Comment fonctionne la gestion de plannings avec l'IA ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Notre algorithme d'IA analyse les contraintes de votre entreprise (disponibilités des employés, compétences requises, règles de travail) pour générer automatiquement des plannings optimisés. Le manager garde le contrôle avec validation manuelle et peut exporter en PDF.",
        },
      },
      {
        "@type": "Question",
        name: "SmartPlanning est-il vraiment gratuit ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, SmartPlanning est actuellement gratuit pendant sa phase bêta. Toutes les fonctionnalités de gestion de plannings, d'équipes et d'export PDF sont incluses. Après le lancement officiel, les utilisateurs bêta bénéficieront d'un mois gratuit supplémentaire.",
        },
      },
      {
        "@type": "Question",
        name: "Quels types d'entreprises peuvent utiliser ce SaaS de planning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SmartPlanning s'adapte à tous types d'entreprises : restaurants, commerces, hôpitaux, cliniques, usines, centres d'appels, etc. Notre SaaS de gestion de plannings est particulièrement efficace pour les entreprises avec des horaires variables ou complexes.",
        },
      },
      {
        "@type": "Question",
        name: "Comment accéder à SmartPlanning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SmartPlanning est accessible directement depuis votre navigateur sur smartplanning.fr. Il suffit de créer un compte gratuit pour commencer à gérer vos plannings et équipes. Notre application est responsive et fonctionne sur ordinateurs, tablettes et smartphones.",
        },
      },
      {
        "@type": "Question",
        name: "Mes données RH sont-elles sécurisées ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolument. La sécurité de vos données RH est notre priorité. Toutes les données de plannings et d'employés sont cryptées et nous respectons strictement le RGPD. Nous n'utilisons jamais vos données à des fins commerciales.",
        },
      },
    ],
  };

  return (
    <Container ref={topRef} id="top">
      <Helmet>
        {/* SEO optimisé pour SmartPlanning */}
        <title>
          🥇 SmartPlanning - N°1 Logiciel Planning RH France | SaaS Gestion Équipes IA | Automatisation Horaires
        </title>
        <meta
          name="description"
          content="🚀 Solution N°1 française de gestion automatique plannings RH avec IA. Logiciel planning entreprise pour optimiser horaires travail, congés et ressources humaines. SaaS planning français gratuit."
        />
        <meta
          name="keywords"
          content="logiciel gestion planning, logiciel planning RH, logiciel planning entreprise, logiciel planning équipe, gestion planning, planning RH, planning équipe, planification automatique, planification horaires travail, logiciel ressources humaines, logiciel RH, RH planning, planning automatique IA, gestion congés employés, planification équipe, logiciel RH français, SaaS planning, SaaS RH, optimisation planning, gestion horaires personnel, planning intelligent, logiciel planification, gestion temps travail, planning collaborateurs, solution RH entreprise, automatisation planning, gestion équipe IA, planning hebdomadaire, logiciel horaires, gestion absences, planning manager, outil planification RH, SmartPlanning France"
        />

        {/* Open Graph optimisé */}
        <meta
          property="og:title"
          content="🥇 SmartPlanning - N°1 Logiciel Planning RH France | SaaS Gestion Équipes IA"
        />
        <meta
          property="og:description"
          content="🚀 Solution N°1 française de gestion automatique plannings RH avec IA. Logiciel planning entreprise pour optimiser horaires travail, congés et ressources humaines. SaaS planning français."
        />
        <meta
          property="og:image"
          content="https://smartplanning.fr/images/logo-smartplanning.png"
        />
        <meta property="og:url" content="https://smartplanning.fr" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SmartPlanning" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="🥇 SmartPlanning - N°1 Logiciel Planning RH France | SaaS IA"
        />
        <meta
          name="twitter:description"
          content="🚀 Solution française de gestion automatique plannings RH avec IA. Logiciel planning entreprise gratuit."
        />
        <meta
          name="twitter:image"
          content="https://smartplanning.fr/images/logo-smartplanning.png"
        />

        {/* Balises techniques SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="language" content="fr-FR" />
        <meta name="geo.region" content="FR" />
        <meta name="geo.country" content="France" />

        {/* Canonical et hreflang */}
        <link rel="canonical" href="https://smartplanning.fr" />
        <link rel="alternate" hrefLang="fr" href="https://smartplanning.fr" />

        {/* Données structurées JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">
          {JSON.stringify(organizationLd)}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      {/* Modal de bienvenue */}
      {showWelcomeModal && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ModalContainer
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <CloseButton
              onClick={closeModal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Fermer la modal de bienvenue"
            >
              ✕
            </CloseButton>

            <ScrollableContent>
              <ModalContent>
                <WelcomeTitle
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Bienvenue dans l'aventure SmartPlanning ! 🚀
                </WelcomeTitle>

                <WelcomeSubtitle
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  On a quelques petites choses sympas à vous dire avant de
                  commencer ! 😊
                </WelcomeSubtitle>

                <CardsContainer
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <ModalCard
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardHeader>
                      <CardIcon>🎁</CardIcon>
                      <CardTitle>Version Béta</CardTitle>
                    </CardHeader>
                    <CardDescription>
                      Notre version bêta est 100% gratuite. Profitez-en pour
                      tester toutes les fonctionnalités sans contrainte.
                    </CardDescription>
                  </ModalCard>

                  <ModalCard
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardHeader>
                      <CardIcon>🔒</CardIcon>
                      <CardTitle>Sécurité maximum</CardTitle>
                    </CardHeader>
                    <CardDescription>
                      Vos données sont cryptées, sécurisées et conformes RGPD.
                      Jamais partagées, toujours protégées.
                    </CardDescription>
                  </ModalCard>

                  <ModalCard
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardHeader>
                      <CardIcon>⚡</CardIcon>
                      <CardTitle>Lancement imminent</CardTitle>
                    </CardHeader>
                    <CardDescription>
                      Vous êtes en avant-première ! La version officielle arrive
                      très bientôt avec encore plus de features.
                    </CardDescription>
                  </ModalCard>

                  <ModalCard
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardHeader>
                      <CardIcon>💎</CardIcon>
                      <CardTitle>Vos avis comptent</CardTitle>
                    </CardHeader>
                    <CardDescription>
                      On bosse dur pour vous offrir le meilleur outil possible.
                      Vos retours nous aident à nous améliorer !
                    </CardDescription>
                  </ModalCard>
                </CardsContainer>

                <ContactSection
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <ContactEmail>📧 contact@smartplanning.fr</ContactEmail>
                  <ContactText>
                    Pour vos retours, questions, suggestions ou juste pour nous
                    dire bonjour ! 👋
                  </ContactText>
                </ContactSection>

                <ModalButtons>
                  <ModalButton
                    className="primary"
                    onClick={handleContactRedirect}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.3 }}
                  >
                    💬 Donner mon avis
                  </ModalButton>
                  <ModalButton
                    className="secondary"
                    onClick={closeModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.3 }}
                  >
                    🚀 Découvrir SmartPlanning
                  </ModalButton>
                </ModalButtons>
              </ModalContent>
            </ScrollableContent>
          </ModalContainer>
        </ModalOverlay>
      )}

      <Header />

      <main>
        <HeroSection as="section" role="banner">
          <BackgroundDecoration className="top-right" />
          <BackgroundDecoration className="bottom-left" />

          <HeroContent>
            {/* ✨ OPTIMISATION MOBILE : loading="eager" pour l'image principale visible immédiatement */}
            <HeroBrandImage
              src="/images/logo-smartplanning.webp"
              alt="SmartPlanning - SaaS de gestion de plannings et d'équipes pour entreprises"
              loading="eager"
            />
            <HeroTitle as="h1">
              SmartPlanning : la solution SaaS intelligente pour gérer vos
              plannings, équipes et ressources humaines
            </HeroTitle>
            <HeroSubtitle>
              Optimisez vos plannings d'entreprise avec notre SaaS assisté par
              IA. Gérez vos équipes, automatisez vos RH et exportez vos
              plannings en PDF. Solution intuitive et accessible à tous les
              managers.
            </HeroSubtitle>
            <CTAButtons>
              <CTAButtonContainer>
                <Link
                  to="/inscription"
                  aria-label="S'inscrire gratuitement à SmartPlanning"
                >
                  <CTAButton
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    🚀 Essayer gratuitement
                  </CTAButton>
                </Link>
              </CTAButtonContainer>
              <CTAButtonContainer>
                <button
                  onClick={scrollToDemo}
                  style={{
                    background: "transparent",
                    border: `2px solid ${theme?.colors?.primary || "#3b82f6"}`,
                    color: theme?.colors?.primary || "#3b82f6",
                    padding: "1rem 2rem",
                    borderRadius: "0.8rem",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                  }}
                  aria-label="Voir la démo vidéo de SmartPlanning"
                >
                  🎥 Découvrir la démo
                </button>
              </CTAButtonContainer>
            </CTAButtons>
          </HeroContent>
          <AnimationContainer>
            <Suspense
              fallback={
                <div
                  style={{
                    width: 550,
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Chargement...
                </div>
              }
            >
              <EnhancedLottie
                animationData={planningAnimation}
                loop={true}
                alt="Animation de planification intelligente avec SmartPlanning - SaaS de gestion d'équipes"
              />
            </Suspense>
          </AnimationContainer>
        </HeroSection>

        {/* Section Avantages par profil - SEO optimisée */}
        <section aria-labelledby="avantages-profils-title">
          <FeaturesSection>
            <SectionTitle id="avantages-profils-title" as="h2">
              SmartPlanning s'adapte à votre profil
            </SectionTitle>
            <SectionSubtitle>
              Découvrez comment notre SaaS de gestion de plannings répond aux
              besoins spécifiques de chaque utilisateur
            </SectionSubtitle>
            <FeaturesGrid>
              {/* ✨ OPTIMISATION MOBILE : Utilisation du composant responsive optimisé */}
              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>👨‍💼</FeatureIcon>
                  <FeatureTitle as="h3">Pour les Managers</FeatureTitle>
                  <FeatureDescription>
                    Créez et optimisez vos plannings d'équipe en quelques clics.
                    Gérez les congés, les incidents, visualisez la charge de
                    travail et exportez vos données en PDF. L'IA vous aide à
                    équilibrer automatiquement les ressources humaines.
                  </FeatureDescription>
                </>,
                "managers"
              )}

              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>👥</FeatureIcon>
                  <FeatureTitle as="h3">Pour les Employés</FeatureTitle>
                  <FeatureDescription>
                    Consultez vos plannings en temps réel, posez vos congés et
                    échangez vos créneaux facilement. Interface mobile
                    responsive pour accéder à vos horaires et celles de votre
                    équipe partout.
                  </FeatureDescription>
                </>,
                "employees"
              )}

              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>🏢</FeatureIcon>
                  <FeatureTitle as="h3">Pour les Directeurs</FeatureTitle>
                  <FeatureDescription>
                    Pilotez vos équipes avec des tableaux de bord analytiques.
                    Optimisez vos coûts RH, suivez la productivité et prenez des
                    décisions éclairées. Gestion multi-sites et reporting avancé
                    inclus.
                  </FeatureDescription>
                </>,
                "directors"
              )}
            </FeaturesGrid>
          </FeaturesSection>
        </section>

        {/* Section Fonctionnalités principales - SEO optimisée */}
        <section aria-labelledby="fonctionnalites-title">
          <FeaturesSection>
            <SectionTitle id="fonctionnalites-title" as="h2">
              Fonctionnalités de notre SaaS de gestion de plannings
            </SectionTitle>
            <SectionSubtitle>
              Découvrez comment SmartPlanning révolutionne la gestion d'équipes
              et l'automatisation des RH
            </SectionSubtitle>
            <FeaturesGrid>
              {/* ✨ OPTIMISATION MOBILE : Application de l'optimisation à toutes les FeatureCard */}
              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>🧠</FeatureIcon>
                  <FeatureTitle as="h3">
                    Planification intelligente par IA
                  </FeatureTitle>
                  <FeatureDescription>
                    Notre algorithme d'IA génère automatiquement des plannings
                    optimisés en tenant compte des contraintes RH,
                    disponibilités des employés et préférences. Gestion
                    intelligente des équipes pour maximiser l'efficacité.
                  </FeatureDescription>
                </>,
                "ai-planning"
              )}

              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>💰</FeatureIcon>
                  <FeatureTitle as="h3">
                    SaaS gratuit en version bêta
                  </FeatureTitle>
                  <FeatureDescription>
                    Profitez de toutes les fonctionnalités de gestion de
                    plannings gratuitement pendant notre phase bêta. Export PDF,
                    gestion d'équipes, automatisation RH : tout est inclus sans
                    limitation.
                  </FeatureDescription>
                </>,
                "free-beta"
              )}

              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>📱</FeatureIcon>
                  <FeatureTitle as="h3">
                    Interface responsive multi-appareils
                  </FeatureTitle>
                  <FeatureDescription>
                    Gérez vos plannings depuis votre ordinateur, tablette ou
                    smartphone. Interface optimisée pour managers et employés,
                    accessible partout. Synchronisation en temps réel sur tous
                    vos appareils.
                  </FeatureDescription>
                </>,
                "responsive"
              )}

              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>📄</FeatureIcon>
                  <FeatureTitle as="h3">Export PDF des plannings</FeatureTitle>
                  <FeatureDescription>
                    Exportez vos plannings d'équipe en PDF haute qualité pour
                    impression ou partage. Formats personnalisés et mise en page
                    professionnelle. Idéal pour affichage en entreprise.
                  </FeatureDescription>
                </>,
                "pdf-export"
              )}

              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>🔒</FeatureIcon>
                  <FeatureTitle as="h3">Sécurité des données RH</FeatureTitle>
                  <FeatureDescription>
                    Vos données de plannings et informations RH sont cryptées et
                    protégées. Conformité RGPD stricte, hébergement sécurisé en
                    France. Confidentialité garantie pour toutes vos données
                    d'entreprise.
                  </FeatureDescription>
                </>,
                "security"
              )}

              {getResponsiveFeatureCard(
                <>
                  <FeatureIcon>📊</FeatureIcon>
                  <FeatureTitle as="h3">
                    Analytiques et reporting RH
                  </FeatureTitle>
                  <FeatureDescription>
                    Suivez et analysez les heures travaillées, coûts RH et
                    efficacité des plannings. Tableaux de bord interactifs, KPI
                    personnalisés et rapports automatisés. Optimisez vos
                    ressources humaines avec des données précises.
                  </FeatureDescription>
                </>,
                "analytics"
              )}
            </FeaturesGrid>
          </FeaturesSection>
        </section>

        {/* Section Vidéo Démo - SEO optimisée */}
        <section id="video-demo" aria-labelledby="demo-title">
          <DemoSection ref={demoRef}>
            <DemoContainer>
              <SectionTitle id="demo-title" as="h2">
                Démo SmartPlanning : votre SaaS de gestion de plannings en
                action
              </SectionTitle>
              <SectionSubtitle>
                Découvrez en vidéo comment SmartPlanning simplifie la gestion
                d'équipes et l'automatisation des RH
              </SectionSubtitle>

              <figure>
                <VideoTitle
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  as="h3"
                >
                  🎥 Regardez vidéo promotionnelle de SmartPlanning
                </VideoTitle>

                <AnimatedVideoWrapper
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {!videoPlayed ? (
                    <VideoPreviewContainer
                      onClick={handleVideoPlay}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      role="button"
                      tabIndex={0}
                      aria-label="Lancer la vidéo de démonstration SmartPlanning"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleVideoPlay();
                        }
                      }}
                    >
                      {/* ✨ OPTIMISATION MOBILE : loading="eager" pour l'aperçu vidéo visible */}
                      <VideoPreviewImage
                        src="/images/preview-video-youtube.webp"
                        alt="Aperçu vidéo démo SmartPlanning - SaaS de gestion de plannings"
                        loading="eager"
                      />
                      <PlayButton
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-hidden="true"
                      >
                        ▶️
                      </PlayButton>
                    </VideoPreviewContainer>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <DemoVideoContainer>
                        <iframe
                          src="https://www.youtube.com/embed/jSdnkoMc8gU?autoplay=1"
                          title="SmartPlanning - Démonstration complète du SaaS de gestion de plannings et d'équipes"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        ></iframe>
                      </DemoVideoContainer>
                    </motion.div>
                  )}
                </AnimatedVideoWrapper>

                <figcaption
                  style={{
                    textAlign: "center",
                    marginTop: "1rem",
                    color: "#6b7280",
                  }}
                >
                  Démonstration complète de SmartPlanning : gestion de
                  plannings, automatisation RH et export PDF
                </figcaption>
              </figure>

              <ImageCarouselCard>
                <CarouselTitle as="h3">Profitez de SmartPlanning</CarouselTitle>
                <ImagesContainer>
                  <ImageWrapper
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <CarouselImage
                      src="/images/business-smartplanning.webp"
                      alt="SmartPlanning interface - Gestion de plannings d'entreprise avec IA"
                      loading="lazy"
                    />
                  </ImageWrapper>

                  <ImageWrapper
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <CarouselImage
                      src="/images/bd.webp"
                      alt="SmartPlanning tableau de bord - Analytiques RH et gestion d'équipes"
                      loading="lazy"
                    />
                  </ImageWrapper>

                  <ImageWrapper
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <CarouselImage
                      src="/images/bd1.webp"
                      alt="SmartPlanning gestion avancée - Export PDF et automatisation des plannings"
                      loading="lazy"
                    />
                  </ImageWrapper>
                </ImagesContainer>
              </ImageCarouselCard>
            </DemoContainer>
          </DemoSection>
        </section>

        <BenefitsSection>
          <SectionTitle>Pourquoi choisir SmartPlanning ?</SectionTitle>
          <SectionSubtitle>
            Les avantages concrets pour votre entreprise
          </SectionSubtitle>

          <div
            style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}
          >
            <TestimonialImage
              src="/images/comic-smartplanning.webp"
              alt="Témoignages clients SmartPlanning - Bénéfices de la planification intelligente"
              loading="lazy"
            />
          </div>

          <div
            ref={benefitsRef}
            style={{ maxWidth: "900px", margin: "0 auto" }}
          >
            <BenefitItem
              className={visibleBenefits.includes(0) ? "visible" : ""}
            >
              <BenefitIcon>⏱️</BenefitIcon>
              <BenefitContent>
                <BenefitTitle>Gain de temps considérable</BenefitTitle>
                <BenefitDescription>
                  Réduisez jusqu'à 80% le temps consacré à la création et
                  gestion de vos plannings d'équipe.
                </BenefitDescription>
              </BenefitContent>
            </BenefitItem>

            <BenefitItem
              className={visibleBenefits.includes(1) ? "visible" : ""}
            >
              <BenefitIcon>💼</BenefitIcon>
              <BenefitContent>
                <BenefitTitle>Réduction des coûts</BenefitTitle>
                <BenefitDescription>
                  Optimisez vos ressources humaines et évitez le sureffectif ou
                  les périodes creuses.
                </BenefitDescription>
              </BenefitContent>
            </BenefitItem>

            <BenefitItem
              className={visibleBenefits.includes(2) ? "visible" : ""}
            >
              <BenefitIcon>🔄</BenefitIcon>
              <BenefitContent>
                <BenefitTitle>Flexibilité maximale</BenefitTitle>
                <BenefitDescription>
                  Ajustez vos plannings en temps réel et adaptez-vous rapidement
                  aux imprévus.
                </BenefitDescription>
              </BenefitContent>
            </BenefitItem>

            <BenefitItem
              className={visibleBenefits.includes(3) ? "visible" : ""}
            >
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

        <UserReviewsSection>
          <SectionTitle>Ils parlent de SmartPlanning</SectionTitle>
          <SectionSubtitle>
            Découvrez ce que pensent nos premiers utilisateurs
          </SectionSubtitle>

          <UserReviewsGrid>
            {userReviews.map((review, index) => (
              <UserReviewCard
                key={review.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <UserAvatar
                  src={review.avatar}
                  alt={`Photo de ${review.name}`}
                  loading="lazy"
                />
                <UserName>{review.name}</UserName>
                <UserRole>{review.role}</UserRole>
                <UserComment>{review.comment}</UserComment>
                <UserRating>{review.rating}</UserRating>
              </UserReviewCard>
            ))}
          </UserReviewsGrid>
        </UserReviewsSection>

        <BetaSection ref={sectionRef}>
          <BetaContent>
            <BetaTitle>🎉 SmartPlanning est en bêta gratuite ! 🎁</BetaTitle>
            <BetaDescription>
              Profitez de notre version bêta gratuite et contribuez à
              l'amélioration de SmartPlanning !
            </BetaDescription>
            <BetaFeatures>
              <BetaFeature
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                <BetaFeatureIcon>🎁</BetaFeatureIcon>
                <BetaFeatureText>
                  Accès complet gratuit pendant la phase bêta
                </BetaFeatureText>
              </BetaFeature>
              <BetaFeature
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <BetaFeatureIcon>💡</BetaFeatureIcon>
                <BetaFeatureText>
                  1 mois gratuit à partir du lancement du plan tarifaire
                </BetaFeatureText>
              </BetaFeature>
              <BetaFeature
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <BetaFeatureIcon>🤝</BetaFeatureIcon>
                <BetaFeatureText>
                  Contribuez à l'amélioration du produit
                </BetaFeatureText>
              </BetaFeature>
              <BetaFeature
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <BetaFeatureIcon>✉️</BetaFeatureIcon>
                <BetaFeatureText>
                  Donnez votre avis et signalez les bugs
                </BetaFeatureText>
              </BetaFeature>
            </BetaFeatures>
            <BetaButtonContainer>
              <Link to="/contact">
                <Button
                  variant="primary"
                  size="lg"
                  className="beta-feedback-button"
                >
                  🗣️ Donner votre avis
                </Button>
              </Link>
            </BetaButtonContainer>
          </BetaContent>
        </BetaSection>

        <FAQSection>
          <SectionTitle>Foire aux questions</SectionTitle>
          <SectionSubtitle>
            Tout ce que vous devez savoir sur SmartPlanning
          </SectionSubtitle>
          <FAQContainer>
            {faqData.map((faq, index) => (
              <FAQCard
                key={index}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FAQQuestion>
                  <span>{faq.icon}</span>
                  {faq.question}
                </FAQQuestion>
                <FAQAnswer>{faq.answer}</FAQAnswer>
              </FAQCard>
            ))}
          </FAQContainer>
        </FAQSection>

        <CTASection>
          <CircleDecoration className="small" />
          <CircleDecoration className="medium" />
          <CircleDecoration className="large" />

          <CTATitle>Prêt à optimiser vos plannings ?</CTATitle>
          <CTADescription>
            Rejoignez les entreprises qui gagnent du temps et améliorent leur
            efficacité avec SmartPlanning.
          </CTADescription>
          <CTAButtonContainer>
            <Link to="/inscription">
              <CTAButton
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                🚀 Commencer gratuitement
              </CTAButton>
            </Link>
          </CTAButtonContainer>
        </CTASection>
      </main>

      <FooterComponent scrollToTop={scrollToTop} />

      {/* Bouton "retour en haut" avec animations fluides */}
      <AnimatePresence>
        {showScrollToTop && (
          <ScrollToTopButton
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.3,
            }}
            whileHover={{
              scale: 1.1,
              rotate: 5,
              transition: { duration: 0.2 },
            }}
            whileTap={{
              scale: 0.9,
              rotate: -5,
              transition: { duration: 0.1 },
            }}
            aria-label="Retour en haut de la page SmartPlanning"
          >
            <ScrollToTopIcon>
              <svg
                xmlns="https://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </ScrollToTopIcon>
          </ScrollToTopButton>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default LandingPage;

import { motion } from "framer-motion";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import planningAnimation from "../assets/animations/planning-animation.json";
import FooterComponent from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { useTheme } from "../components/ThemeProvider";
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
    avatar: "/src/assets/images/user-camille.webp",
    comment:
      "L'IA de SmartPlanning m'a fait gagner 5h par semaine ! La génération automatique de plannings est bluffante et prend en compte toutes nos contraintes.",
    rating: "4.9 ⭐",
  },
  {
    id: 2,
    name: "Sofiane K.",
    role: "Manager équipe terrain",
    avatar: "/src/assets/images/user-sofiane.webp",
    comment:
      "Super intuitif, je recommande ! Même mes collaborateurs les moins à l'aise avec la technologie ont adopté l'outil en quelques minutes.",
    rating: "4.7 ⭐",
  },
  {
    id: 3,
    name: "Lisa M.",
    role: "Fondatrice startup",
    avatar: "/src/assets/images/user-lisa.webp",
    comment:
      "SmartPlanning a complètement changé ma gestion RH ! Facile à utiliser, adaptable et l'équipe support est réactive. Un must pour les petites structures.",
    rating: "5.0 ⭐",
  },
];

const LandingPage: React.FC<LandingPageProps> = () => {
  const { isDarkMode } = useTheme();
  const demoRef = useRef<HTMLElement | null>(null);
  const [visibleBenefits, setVisibleBenefits] = useState<number[]>([]);
  const benefitsRef = useRef<HTMLDivElement | null>(null);
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

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

  // Référence pour le haut de la page
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    <Container ref={topRef} id="top">
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
                      <CardTitle>Totalement gratuit !</CardTitle>
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

      <HeroSection>
        <BackgroundDecoration className="top-right" />
        <BackgroundDecoration className="bottom-left" />

        <HeroContent>
          <HeroBrandImage
            src="/src/assets/images/logo-smartplanning.webp"
            alt="SmartPlanningAI - Logiciel de planification intelligente pour entreprises"
            loading="lazy"
          />
          <HeroTitle>Plannings intelligents pour votre entreprise</HeroTitle>
          <HeroSubtitle>
            Optimisez vos plannings d'entreprise avec notre solution assistée
            par IA. Facile, intuitive et accessible à tous.
          </HeroSubtitle>
          <CTAButtons>
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
              alt="Animation de planification intelligente avec SmartPlanning"
            />
          </Suspense>
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

          <ImageCarouselCard>
            <CarouselTitle>Découvrez SmartPlanning en action</CarouselTitle>
            <ImagesContainer>
              <ImageWrapper
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <CarouselImage
                  src="/src/assets/images/business-smartplanning.webp"
                  alt="SmartPlanning en action - Interface de planification pour entreprises"
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
                  src="/src/assets/images/bd.webp"
                  alt="SmartPlanning - Tableau de bord analytique"
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
                  src="/src/assets/images/bd1.webp"
                  alt="SmartPlanning - Gestion avancée des plannings"
                  loading="lazy"
                />
              </ImageWrapper>
            </ImagesContainer>
          </ImageCarouselCard>

          <VideoTitle
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            🎥 Regardez la démo SmartPlanning !
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
              >
                <VideoPreviewImage
                  src="/src/assets/images/preview-video.webp"
                  alt="Aperçu de la vidéo SmartPlanning"
                  loading="lazy"
                />
                <PlayButton
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
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
                    src="https://www.youtube.com/embed/W4UWkI4S2Qg?autoplay=1"
                    title="SmartPlanning - Démonstration vidéo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </DemoVideoContainer>
              </motion.div>
            )}
          </AnimatedVideoWrapper>
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
            src="/src/assets/images/comic-smartplanning.webp"
            alt="Témoignages clients SmartPlanning - Bénéfices de la planification intelligente"
            loading="lazy"
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

      <FooterComponent scrollToTop={scrollToTop} />
    </Container>
  );
};

export default LandingPage;

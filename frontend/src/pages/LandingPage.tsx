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

// Nouveau bouton CTA discret pour contact
const ContactCTAButton = styled(motion.button)`
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  padding: 0.8rem 1.5rem;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

// Bouton CTA flottant moderne
const FloatingContactCTA = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 1000;
  
  @media (max-width: 768px) {
    bottom: 1rem;
    left: 1rem;
  }
`;

const FloatingButton = styled(motion.button)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary || theme.colors.primary} 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 0.8rem 1.2rem;
    font-size: 0.85rem;
  }
`;

// Bouton CTA subtle en fin de section
const SectionContactCTA = styled(motion.div)`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border || '#e2e8f0'};
`;

const SubtleContactButton = styled(motion.a)`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surface};
    transform: translateY(-1px);
  }
`;

// Bouton CTA urgence/démo
const UrgentCTAButton = styled(motion.button)`
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
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
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }
  
  &:hover::before {
    left: 100%;
  }
`;

// Container pour organiser les CTA
const CTAGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.8rem;
  }
`;

// Composants pour la section de tarifs modernes
const PricingContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 3rem auto;
  padding: 0 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2.5rem;
  }
`;

const PricingCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  box-shadow: ${({ theme }) => theme.shadows.large};
  position: relative;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${({ theme }) => theme.colors.primary}15 0%, 
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }

  &:hover::before {
    opacity: 1;
  }

  &.popular {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.02);
    box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2), ${({ theme }) => theme.shadows.large};
    
    &::before {
      background: linear-gradient(135deg, 
        ${({ theme }) => theme.colors.primary}10 0%, 
        rgba(59, 130, 246, 0.05) 100%
      );
      opacity: 1;
    }
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

const PricingBadge = styled.div`
  position: relative;
  margin-top: 1rem;
  background: linear-gradient(45deg, #ef4444, #f59e0b, #ef4444);
  background-size: 200% 200%;
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 1.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  box-shadow: 
    0 6px 20px rgba(239, 68, 68, 0.4),
    0 0 25px rgba(245, 158, 11, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.9);
  animation: ${keyframes`
    0% { 
      background-position: 0% 50%;
      transform: scale(1);
      box-shadow: 
        0 6px 20px rgba(239, 68, 68, 0.4),
        0 0 25px rgba(245, 158, 11, 0.3);
    }
    50% { 
      background-position: 100% 50%;
      transform: scale(1.02);
      box-shadow: 
        0 8px 25px rgba(239, 68, 68, 0.6),
        0 0 35px rgba(245, 158, 11, 0.5);
    }
    100% { 
      background-position: 0% 50%;
      transform: scale(1);
      box-shadow: 
        0 6px 20px rgba(239, 68, 68, 0.4),
        0 0 25px rgba(245, 158, 11, 0.3);
    }
  `} 2.5s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
    padding: 0.4rem 1rem;
  }
`;

const PricingHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const PricingTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const PricingPrice = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  position: relative;

  .currency {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    position: relative;
    top: -0.5rem;
  }

  .price {
    font-size: 3.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, #06b6d4, #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    
    @media (max-width: 768px) {
      font-size: 2.8rem;
    }
  }
`;

const PricingPeriod = styled.span`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
`;

const PricingSubtext = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;

const PricingFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 2rem 0;
`;

const PricingFeature = styled.li`
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border || 'rgba(0,0,0,0.05)'};
  
  &:last-child {
    border-bottom: none;
  }

  &.bonus {
    background: linear-gradient(90deg, 
      rgba(59, 130, 246, 0.1) 0%, 
      transparent 100%
    );
    margin: 0 -2rem;
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
  }

  &.exclusive {
    background: linear-gradient(90deg, 
      rgba(16, 185, 129, 0.1) 0%, 
      transparent 100%
    );
    margin: 0 -2rem;
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    color: #10b981;
  }
`;

const FeatureCheck = styled.span`
  font-size: 1.1rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const PricingButton = styled(motion.a)`
  display: block;
  text-align: center;
  padding: 1rem 2rem;
  border-radius: 0.8rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  margin-top: auto;

  &.primary {
    background: linear-gradient(45deg, ${({ theme }) => theme.colors.primary}, #06b6d4);
    color: white;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
    
    &:hover {
      box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
    }
  }

  &.secondary {
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border: 2px solid ${({ theme }) => theme.colors.primary};
    
    &:hover {
      background: ${({ theme }) => theme.colors.primary};
      color: white;
      transform: translateY(-1px);
    }
  }
`;

const PricingGuarantees = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 900px;
  margin: 4rem auto 2rem;
  padding: 0 1rem;
`;

const GuaranteeItem = styled(motion.div)`
  display: flex;
  align-items: center;
  text-align: center;
  flex-direction: column;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }

  @media (min-width: 768px) {
    flex-direction: row;
    text-align: left;
  }
`;

const GuaranteeIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
    margin-right: 1rem;
  }
`;

const GuaranteeText = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  
  strong {
    color: ${({ theme }) => theme.colors.primary};
    display: block;
    margin-bottom: 0.25rem;
  }
`;

const PricingFooter = styled.div`
  text-align: center;
  margin-top: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary}08 0%, 
    rgba(6, 182, 212, 0.05) 100%
  );
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.primary}20;
`;

const PricingFooterText = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  
  strong {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

// Composants pour l'écran de bienvenue futuriste
const WelcomeScreenOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: linear-gradient(
    135deg,
    #0a0e27 0%,
    #162447 15%,
    #1f4788 30%,
    #0f3460 45%,
    #1e1b4b 60%,
    #312e81 75%,
    #1e1b4b 90%,
    #0f172a 100%
  );
  animation: ${keyframes`
    0% { background-position: 0% 50%; }
    25% { background-position: 25% 75%; }
    50% { background-position: 100% 50%; }
    75% { background-position: 75% 25%; }
    100% { background-position: 0% 50%; }
  `} 12s ease-in-out infinite;
  background-size: 400% 400%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const FuturisticGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: ${keyframes`
    0% { 
      transform: translate(0, 0);
      opacity: 0.3;
    }
    50% { 
      opacity: 0.6;
    }
    100% { 
      transform: translate(60px, 60px);
      opacity: 0.3;
    }
  `} 8s linear infinite;
`;

const FloatingParticles = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`;

const Particle = styled(motion.div)<{ delay: number; duration: number; x: number; y: number }>`
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #3b82f6, #06b6d4, #10b981);
  border-radius: 50%;
  box-shadow: 
    0 0 10px rgba(59, 130, 246, 0.8),
    0 0 20px rgba(6, 182, 212, 0.6),
    0 0 30px rgba(16, 185, 129, 0.4);
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: inherit;
    border-radius: 50%;
    filter: blur(2px);
    opacity: 0.7;
    z-index: -1;
  }
`;

const WelcomeContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 10;
  position: relative;
  max-width: 800px;
  padding: 2rem;
`;

const FuturisticLogo = styled(motion.div)`
  position: relative;
  margin-bottom: 3rem;
  
  &::before {
    content: '';
    position: absolute;
    top: -30px;
    left: -30px;
    right: -30px;
    bottom: -30px;
    background: conic-gradient(
      from 0deg,
      #3b82f6,
      #06b6d4,
      #10b981,
      #f59e0b,
      #ef4444,
      #8b5cf6,
      #06b6d4,
      #3b82f6
    );
    border-radius: 25px;
    animation: ${keyframes`
      0% { transform: rotate(0deg) scale(1) skew(0deg); }
      25% { transform: rotate(90deg) scale(1.02) skew(1deg); }
      50% { transform: rotate(180deg) scale(1.05) skew(0deg); }
      75% { transform: rotate(270deg) scale(1.02) skew(-1deg); }
      100% { transform: rotate(360deg) scale(1) skew(0deg); }
    `} 6s linear infinite;
    filter: blur(15px);
    opacity: 0.8;
    z-index: -1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
    background: linear-gradient(45deg, 
      rgba(59, 130, 246, 0.3), 
      rgba(6, 182, 212, 0.3), 
      rgba(16, 185, 129, 0.3),
      rgba(168, 85, 247, 0.3)
    );
    border-radius: 25px;
    animation: ${keyframes`
      0% { 
        transform: rotate(360deg) scale(0.9); 
        opacity: 0.4;
      }
      50% { 
        transform: rotate(180deg) scale(1.1); 
        opacity: 0.7;
      }
      100% { 
        transform: rotate(0deg) scale(0.9); 
        opacity: 0.4;
      }
    `} 4s ease-in-out infinite;
    z-index: -1;
  }
`;

const LottieContainer = styled(motion.div)`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, 
    rgba(59, 130, 246, 0.2) 0%, 
    rgba(6, 182, 212, 0.15) 30%,
    rgba(16, 185, 129, 0.1) 60%,
    transparent 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 0 50px rgba(59, 130, 246, 0.4),
    0 0 100px rgba(6, 182, 212, 0.3),
    0 0 150px rgba(16, 185, 129, 0.2),
    inset 0 0 40px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    width: 160px;
    height: 160px;
  }
  
  @media (max-width: 480px) {
    width: 140px;
    height: 140px;
  }
`;

const WelcomeTitle = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  background: linear-gradient(
    135deg,
    #3b82f6 0%,
    #06b6d4 25%,
    #10b981 50%,
    #f59e0b 75%,
    #ef4444 100%
  );
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(59, 130, 246, 0.5);
  animation: ${keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `} 4s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const WelcomeSubtitle = styled(motion.p)`
  font-size: 1.5rem;
  color: #94a3b8;
  margin-bottom: 3rem;
  line-height: 1.6;
  text-shadow: 0 0 20px rgba(148, 163, 184, 0.3);
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const HologramEffect = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border: 1px solid rgba(6, 182, 212, 0.4);
    border-radius: 50%;
  }
  
  &::before {
    transform: scale(1.2);
    animation: ${keyframes`
      0% { opacity: 0.2; transform: scale(1.2) rotate(0deg); }
      50% { opacity: 0.5; }
      100% { opacity: 0.2; transform: scale(1.2) rotate(360deg); }
    `} 3s linear infinite;
  }
  
  &::after {
    transform: scale(1.4);
    animation: ${keyframes`
      0% { opacity: 0.1; transform: scale(1.4) rotate(360deg); }
      50% { opacity: 0.3; }
      100% { opacity: 0.1; transform: scale(1.4) rotate(0deg); }
    `} 4s linear infinite;
  }
`;

const LoadingBar = styled(motion.div)`
  width: 300px;
  height: 4px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  margin-top: 2rem;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(59, 130, 246, 0.8), 
      rgba(6, 182, 212, 0.8), 
      transparent
    );
    animation: ${keyframes`
      0% { left: -100%; }
      100% { left: 100%; }
    `} 1.5s ease-in-out infinite;
  }
  
  @media (max-width: 768px) {
    width: 250px;
  }
`;

const TechLines = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(59, 130, 246, 0.8), 
      rgba(6, 182, 212, 0.6),
      rgba(16, 185, 129, 0.8),
      transparent
    );
    height: 2px;
    width: 100%;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }
  
  &::before {
    top: 25%;
    animation: ${keyframes`
      0% { 
        transform: translateX(-120%) scaleX(0.5); 
        opacity: 0;
      }
      50% { 
        transform: translateX(0%) scaleX(1); 
        opacity: 1;
      }
      100% { 
        transform: translateX(120%) scaleX(0.5); 
        opacity: 0;
      }
    `} 4s ease-in-out infinite;
  }
  
  &::after {
    bottom: 25%;
    animation: ${keyframes`
      0% { 
        transform: translateX(120%) scaleX(0.5); 
        opacity: 0;
      }
      50% { 
        transform: translateX(0%) scaleX(1); 
        opacity: 1;
      }
      100% { 
        transform: translateX(-120%) scaleX(0.5); 
        opacity: 0;
      }
    `} 5s ease-in-out infinite 1s;
  }
`;

// Nouveaux composants pour plus d'animations
const FloatingOrbs = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`;

const Orb = styled(motion.div)<{ size: number; color: string }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: radial-gradient(circle, ${props => props.color}, transparent);
  filter: blur(2px);
  opacity: 0.6;
`;

const ScanLines = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(59, 130, 246, 0.03) 2px,
    rgba(59, 130, 246, 0.03) 4px
  );
  animation: ${keyframes`
    0% { transform: translateY(0px); }
    100% { transform: translateY(4px); }
  `} 0.1s linear infinite;
  pointer-events: none;
`;

const LightBeams = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(59, 130, 246, 0.3),
      transparent
    );
    width: 2px;
    height: 100%;
    transform-origin: center;
  }
  
  &::before {
    left: 20%;
    animation: ${keyframes`
      0% { 
        transform: rotate(0deg) scaleY(0);
        opacity: 0;
      }
      50% { 
        transform: rotate(45deg) scaleY(1);
        opacity: 1;
      }
      100% { 
        transform: rotate(90deg) scaleY(0);
        opacity: 0;
      }
    `} 8s ease-in-out infinite;
  }
  
  &::after {
    right: 20%;
    animation: ${keyframes`
      0% { 
        transform: rotate(90deg) scaleY(0);
        opacity: 0;
      }
      50% { 
        transform: rotate(45deg) scaleY(1);
        opacity: 1;
      }
      100% { 
        transform: rotate(0deg) scaleY(0);
        opacity: 0;
      }
    `} 8s ease-in-out infinite 2s;
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
  {
    icon: "💰",
    question: "Quels sont les tarifs de SmartPlanning ?",
    answer:
      "SmartPlanning propose 3 offres adaptées à tous types d'entreprises : Starter (39€/mois, jusqu'à 25 employés), Professional (89€/mois, jusqu'à 100 employés + chatbot IA), et Enterprise (179€/mois, employés illimités + Machine Learning). Toutes nos offres incluent 30 jours d'essai gratuit et la formation de vos équipes.",
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
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);

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

  const [particles, setParticles] = useState<Array<{id: number; x: number; y: number; delay: number; duration: number}>>([]);
  const [orbs, setOrbs] = useState<Array<{id: number; x: number; y: number; size: number; color: string; duration: number; delay: number}>>([]);
  const [chatbotAnimation, setChatbotAnimation] = useState<any>(null);

  // Régénérer les particules et orbes quand isMobile change
  useEffect(() => {
    const count = isMobile ? 8 : 20; // Moins de particules sur mobile pour optimiser les performances
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }));
    setParticles(newParticles);

    // Génération des orbes flottants
    const orbCount = isMobile ? 4 : 8;
    const colors = [
      'rgba(59, 130, 246, 0.4)',
      'rgba(6, 182, 212, 0.4)', 
      'rgba(16, 185, 129, 0.4)',
      'rgba(168, 85, 247, 0.4)',
      'rgba(245, 158, 11, 0.4)'
    ];
    
    const newOrbs = Array.from({ length: orbCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 30 + Math.random() * 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 8 + Math.random() * 4,
      delay: Math.random() * 3,
    }));
    setOrbs(newOrbs);
  }, [isMobile]);

  // Chargement de l'animation chatbot
  useEffect(() => {
    const loadChatbotAnimation = async () => {
      try {
        const response = await fetch('/animations/chatbot.json');
        const animationData = await response.json();
        setChatbotAnimation(animationData);
      } catch (error) {
        console.warn('Impossible de charger l\'animation chatbot:', error);
        // Fallback vers l'animation de planning
        setChatbotAnimation(planningAnimation);
      }
    };

    loadChatbotAnimation();
  }, []);

  // Gestion de l'écran de bienvenue - Animation plus longue avec transition fluide
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeScreen(false);
    }, isMobile ? 4500 : 5500); // Animation plus longue pour une meilleure immersion

    return () => clearTimeout(timer);
  }, [isMobile]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const benefits = Array.from(entry.target.children);
            benefits.forEach((_, index) => {
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

  // Données structurées JSON-LD optimisées pour le SEO avec tarification
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SmartPlanning",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "39",
        priceCurrency: "EUR",
        description: "Solution idéale pour petites équipes jusqu'à 25 employés avec IA basique",
        availability: "https://schema.org/InStock",
        validFrom: "2024-01-01"
      },
      {
        "@type": "Offer",
        name: "Professional",
        price: "89",
        priceCurrency: "EUR",
        description: "Pour entreprises moyennes jusqu'à 100 employés avec IA avancée et chatbot inclus",
        availability: "https://schema.org/InStock",
        validFrom: "2024-01-01"
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: "179",
        priceCurrency: "EUR",
        description: "Solution complète pour grandes entreprises avec IA + ML et employés illimités",
        availability: "https://schema.org/InStock",
        validFrom: "2024-01-01"
      }
    ],
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
        name: "Quels sont les tarifs de SmartPlanning ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SmartPlanning propose 3 offres : Starter à 39€/mois (jusqu'à 25 employés), Professional à 89€/mois (jusqu'à 100 employés avec chatbot IA), et Enterprise à 179€/mois (employés illimités avec Machine Learning). Toutes les offres incluent 30 jours d'essai gratuit.",
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
          🚀 SmartPlanning - Logiciel Planning RH Innovant | Moteur de Planification IA | Top Applications 2025
        </title>
        <meta
          name="description"
          content="SmartPlanning : Logiciel planning RH révolutionnaire avec Moteur de Planification IA ultra-performant. Génération automatique plannings équipe, gestion congés, conformité légale française. Top applications innovantes 2025 ⭐4.8/5."
        />
        <meta
          name="keywords"
          content="SmartPlanning, logiciel planning RH innovant, moteur de planification IA, logiciel planning RH révolutionnaire, meilleur logiciel gestion planning 2025, planning équipe IA ultra-rapide, logiciel planning entreprise français, SaaS planning RH performance, automatisation planning intelligence artificielle, planning RH nouvelle génération, logiciel gestion congés automatique, solution RH entreprise moderne, outil planification RH expert, logiciel planning cloud sécurisé, planning hebdomadaire automatique, gestion horaires personnel français, logiciel RH conformité légale, top applications innovantes 2025"
        />
        
        {/* Meta priorité homepage */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="rating" content="4.8" />
        <meta name="author" content="SmartPlanning" />
        <meta name="copyright" content="SmartPlanning" />
        <meta name="classification" content="Business Software, HR Management, Planning Tool" />

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

      {/* Écran de bienvenue futuriste */}
      <AnimatePresence>
        {showWelcomeScreen && (
          <WelcomeScreenOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ 
              duration: 1.2,
              ease: "easeInOut"
            }}
          >
            {/* Grille futuriste animée */}
            <FuturisticGrid />
            
            {/* Lignes de scan style CRT */}
            <ScanLines />
            
            {/* Rayons lumineux */}
            <LightBeams
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1.5 }}
            />
            
            {/* Lignes technologiques */}
            <TechLines
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            />
            
            {/* Orbes flottants */}
            <FloatingOrbs>
              {orbs.map((orb) => (
                <Orb
                  key={orb.id}
                  size={orb.size}
                  color={orb.color}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: `${orb.x}%`,
                    y: `${orb.y}%`
                  }}
                  animate={{ 
                    opacity: [0, 0.6, 0.8, 0.4, 0],
                    scale: [0, 1, 1.2, 0.8, 0],
                    x: [`${orb.x}%`, `${orb.x + 20}%`, `${orb.x - 10}%`, `${orb.x + 30}%`],
                    y: [`${orb.y}%`, `${orb.y - 30}%`, `${orb.y - 60}%`, `${orb.y - 90}%`],
                    rotate: [0, 180, 360, 540]
                  }}
                  transition={{
                    duration: orb.duration,
                    delay: orb.delay,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </FloatingOrbs>
            
            {/* Particules flottantes */}
            <FloatingParticles>
              {particles.map((particle) => (
                <Particle
                  key={particle.id}
                  delay={particle.delay}
                  duration={particle.duration}
                  x={particle.x}
                  y={particle.y}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: `${particle.x}%`,
                    y: `${particle.y}%`
                  }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1.2, 0],
                    y: [`${particle.y}%`, `${particle.y - 20}%`, `${particle.y - 40}%`, `${particle.y - 60}%`]
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </FloatingParticles>
            
            {/* Effet hologramme */}
            <HologramEffect
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            />
            
            {/* Contenu principal */}
            <WelcomeContainer
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <FuturisticLogo
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 1.8, 
                  duration: 1.0,
                  type: "spring",
                  stiffness: 80
                }}
              >
                <LottieContainer>
                  <Suspense fallback={<div style={{ width: 150, height: 150, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)', borderRadius: '50%' }} />}>
                    {chatbotAnimation ? (
                      <EnhancedLottie 
                        animationData={chatbotAnimation}
                        loop={true}
                        style={{ 
                          width: '80%', 
                          height: '80%',
                          filter: 'brightness(1.2) contrast(1.1) saturate(1.3)'
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '80%', 
                        height: '80%', 
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.3), transparent)', 
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                  </Suspense>
                </LottieContainer>
              </FuturisticLogo>
              
              <WelcomeTitle
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.4, duration: 0.8 }}
              >
                SmartPlanning
              </WelcomeTitle>
              
              <WelcomeSubtitle
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.0, duration: 0.8 }}
              >
                L'avenir de la gestion d'équipes
              </WelcomeSubtitle>
              
              <LoadingBar
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 3.6, duration: 1.2 }}
              />
            </WelcomeContainer>
          </WelcomeScreenOverlay>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: showWelcomeScreen ? 0 : 1 }}
        animate={{ opacity: showWelcomeScreen ? 0 : 1 }}
        transition={{ 
          duration: 1.5,
          ease: "easeOut",
          delay: showWelcomeScreen ? 0 : 0.5
        }}
        style={{ paddingTop: '90px' }} // Compensation pour la navbar fixe
      >
        <Header />

        <main>
        <HeroSection id="home" as="section" role="banner">
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
            
            {/* CTA secondaire dans le Hero */}
            <CTAGroup style={{ marginTop: "1rem" }}>
              <Link to="/contact">
                <ContactCTAButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📞 Parler à un conseiller
                </ContactCTAButton>
              </Link>
            </CTAGroup>
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
        <section id="features" aria-labelledby="avantages-profils-title">
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
            
            {/* CTA subtil après la première section features */}
            <SectionContactCTA>
              <SubtleContactButton 
                as={Link}
                to="/contact"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                💬 Besoin d'aide pour choisir ? Contactez-nous
              </SubtleContactButton>
            </SectionContactCTA>
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
        <section id="demo" aria-labelledby="demo-title">
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
              
              {/* CTA après la démo pour inciter au contact */}
              <CTAGroup>
                <Link to="/contact">
                  <UrgentCTAButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🚀 Obtenir une démo personnalisée
                  </UrgentCTAButton>
                </Link>
                <Link to="/contact">
                  <ContactCTAButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    💬 Discuter avec un expert
                  </ContactCTAButton>
                </Link>
              </CTAGroup>
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

        <UserReviewsSection id="testimonials">
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
          
          {/* CTA discret après les témoignages */}
          <SectionContactCTA>
            <SubtleContactButton 
              as={Link}
              to="/contact"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              👥 Rejoignez nos clients satisfaits
            </SubtleContactButton>
          </SectionContactCTA>
        </UserReviewsSection>


        {/* Section Tarifs - Moderne et professionnelle */}
        <section id="tarifs" aria-labelledby="tarifs-title">
          <FeaturesSection style={{ background: `linear-gradient(135deg, ${theme?.colors?.background || '#ffffff'} 0%, ${theme?.colors?.surface || '#f8fafc'} 100%)` }}>
            <SectionTitle id="tarifs-title" as="h2">
              Nos offres SmartPlanning
            </SectionTitle>
            <SectionSubtitle>
              Choisissez l'offre qui correspond à vos besoins. Solutions professionnelles pour tous types d'entreprises.
            </SectionSubtitle>
            
            <PricingContainer>
              {/* Offre Starter */}
              <PricingCard
                whileHover={{ scale: 1.02, y: -5 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <PricingHeader>
                  <PricingTitle>Starter</PricingTitle>
                  <PricingPrice>
                    <span className="currency">€</span>
                    <span className="price">39</span>
                    <PricingPeriod>/mois</PricingPeriod>
                  </PricingPrice>
                  <PricingSubtext>Idéal pour petites équipes</PricingSubtext>
                </PricingHeader>
                
                <PricingFeatures>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Planification IA basique
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Jusqu'à 25 employés
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Export PDF & Excel
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Gestion des congés
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Rapports de base
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Support email
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Interface mobile
                  </PricingFeature>
                </PricingFeatures>
                
                <PricingButton
                  as={Link}
                  to="/inscription"
                  className="secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🚀 Commencer
                </PricingButton>
              </PricingCard>

              {/* Offre Professional */}
              <PricingCard
                className="popular"
                whileHover={{ scale: 1.03, y: -10 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <PricingHeader>
                  <PricingTitle>Professional</PricingTitle>
                  <PricingPrice>
                    <span className="currency">€</span>
                    <span className="price">89</span>
                    <PricingPeriod>/mois</PricingPeriod>
                  </PricingPrice>
                  <PricingSubtext>Pour entreprises moyennes</PricingSubtext>
                </PricingHeader>
                
                <PricingFeatures>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Planification IA avancée
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Jusqu'à 100 employés
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Multi-sites & équipes
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Analytics avancées
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    API & intégrations
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Support prioritaire
                  </PricingFeature>
                  <PricingFeature className="bonus">
                    <FeatureCheck>🎁</FeatureCheck>
                    Chatbot IA inclus
                  </PricingFeature>
                </PricingFeatures>
                
                <PricingButton
                  as={Link}
                  to="/inscription"
                  className="primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💎 Choisir Pro
                </PricingButton>
                
                <PricingBadge>🔥 Populaire</PricingBadge>
              </PricingCard>

              {/* Offre Enterprise */}
              <PricingCard
                whileHover={{ scale: 1.02, y: -5 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <PricingHeader>
                  <PricingTitle>Enterprise</PricingTitle>
                  <PricingPrice>
                    <span className="currency">€</span>
                    <span className="price">179</span>
                    <PricingPeriod>/mois</PricingPeriod>
                  </PricingPrice>
                  <PricingSubtext>Grandes entreprises</PricingSubtext>
                </PricingHeader>
                
                <PricingFeatures>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    IA complète + Machine Learning
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Employés illimités
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Multi-sites internationaux
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Business Intelligence
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    API complète + webhooks
                  </PricingFeature>
                  <PricingFeature>
                    <FeatureCheck>✅</FeatureCheck>
                    Support 24/7 dédié
                  </PricingFeature>
                  <PricingFeature className="exclusive">
                    <FeatureCheck>⭐</FeatureCheck>
                    Formation & onboarding
                  </PricingFeature>
                  <PricingFeature className="exclusive">
                    <FeatureCheck>🔐</FeatureCheck>
                    Sécurité entreprise (SSO)
                  </PricingFeature>
                </PricingFeatures>
                
                <PricingButton
                  as={Link}
                  to="/contact"
                  className="secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📞 Nous contacter
                </PricingButton>
              </PricingCard>
            </PricingContainer>

            {/* Section garanties et informations */}
            <PricingGuarantees>
              <GuaranteeItem
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <GuaranteeIcon>🔒</GuaranteeIcon>
                <GuaranteeText>
                  <strong>Sécurité garantie</strong><br />
                  Données cryptées et conformes RGPD
                </GuaranteeText>
              </GuaranteeItem>
              
              <GuaranteeItem
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <GuaranteeIcon>🇫🇷</GuaranteeIcon>
                <GuaranteeText>
                  <strong>Made in France</strong><br />
                  Solution développée et hébergée en France
                </GuaranteeText>
              </GuaranteeItem>
              
              <GuaranteeItem
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <GuaranteeIcon>💬</GuaranteeIcon>
                <GuaranteeText>
                  <strong>Support réactif</strong><br />
                  Équipe francophone disponible
                </GuaranteeText>
              </GuaranteeItem>
            </PricingGuarantees>
            
            <PricingFooter>
              <PricingFooterText>
                🎯 <strong>Toutes nos offres incluent :</strong> 30 jours d'essai gratuit, migration de données incluse, et formation personnalisée pour votre équipe !
              </PricingFooterText>
            </PricingFooter>
          </FeaturesSection>
        </section>

        <FAQSection id="faq">
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
      
      {/* Bouton CTA flottant pour contact */}
      <FloatingContactCTA>
        <Link to="/contact">
          <FloatingButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2, type: "spring" }}
          >
            💬 Contact
          </FloatingButton>
        </Link>
      </FloatingContactCTA>
      </motion.div>
    </Container>
  );
};

export default LandingPage;

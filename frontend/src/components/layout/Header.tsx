import React, { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import planningAnimation from "../../assets/animations/planning-animation.json";
import { useTheme } from "../../components/ThemeProvider";
import Button from "../ui/Button";
import ThemeSwitch from "../ui/ThemeSwitch";

const EnhancedLottie = lazy(() => import("../ui/EnhancedLottie"));

interface DarkModeProps {
  isDarkMode?: boolean;
}

const HeaderContainer = styled.header<DarkModeProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: ${({ isDarkMode }) => (isDarkMode ? "#121829" : "#FFFFFF")};
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  font-family: "Inter", "Poppins", sans-serif;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
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
`;

const LogoAnimation = styled.div`
  width: 40px;
  height: 40px;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 1rem;
  font-weight: 600;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    gap: 1rem;
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
`;

const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <HeaderContainer isDarkMode={isDarkMode}>
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
      <Nav>
        <ThemeSwitchWrapper>
          <ThemeSwitch onChange={toggleTheme} checked={isDarkMode} />
        </ThemeSwitchWrapper>
        <Link to="/connexion">
          <LoginButton variant="ghost">🔐 Connexion</LoginButton>
        </Link>
        <Link to="/inscription">
          <SignupButton variant="primary">✨ S'inscrire</SignupButton>
        </Link>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;

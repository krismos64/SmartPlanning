import { Moon, Sun } from "lucide-react";
import React from "react";
import styled from "styled-components";
import { Theme } from "../ThemeProvider";

interface ThemeSwitchProps {
  onChange: () => void;
  checked: boolean;
}

// Étendre les types pour styled-components
declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

const SwitchContainer = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  color: ${({ theme }) => theme.colors.text.secondary};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}50;
  }
`;

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ onChange, checked }) => {
  return (
    <SwitchContainer onClick={onChange} aria-label="Changer de thème">
      {checked ? <Sun size={18} /> : <Moon size={18} />}
    </SwitchContainer>
  );
};

export default ThemeSwitch;

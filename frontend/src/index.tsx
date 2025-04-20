import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import "./locales"; // Initialisation de i18n
import LandingPage from "./pages/LandingPage";

const IndexPage: React.FC = () => (
  <HelmetProvider>
    <ThemeProvider>
      <Router>
        <Helmet>
          <title>SmartPlanning | Planifiez simplement votre équipe</title>
          <meta
            name="description"
            content="Découvrez SmartPlanning, la solution intelligente pour planifier les plannings de vos employés facilement et rapidement."
          />
          <link rel="canonical" href="https://smartplanning.fr/" />
          <meta name="robots" content="index, follow" />
        </Helmet>
        <LandingPage />
      </Router>
    </ThemeProvider>
  </HelmetProvider>
);

export default IndexPage;

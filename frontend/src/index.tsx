import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import LandingPage from "./pages/LandingPage";

const IndexPage: React.FC = () => (
  <HelmetProvider>
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
  </HelmetProvider>
);

export default IndexPage;

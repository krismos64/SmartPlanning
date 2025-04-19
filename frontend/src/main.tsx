import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./AppRouter";

// Import des styles globaux (à créer selon les besoins du projet)
import "./index.css";

// Rendu de l'application dans le DOM
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

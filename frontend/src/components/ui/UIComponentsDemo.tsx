/**
 * UIComponentsDemo - Démonstration des composants UI
 *
 * Présente les différents composants UI du système de design SmartPlanning.
 * Cet exemple montre l'utilisation des composants Tooltip, Alert et Tabs.
 */
import React, { useState } from "react";
import Accordion from "./Accordion";
import Alert from "./Alert";
import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";
import ProgressBar from "./ProgressBar";
import Tabs from "./Tabs";
import Tooltip from "./Tooltip";

const UIComponentsDemo: React.FC = () => {
  // État pour les exemples dynamiques
  const [tooltipPosition, setTooltipPosition] = useState<
    "top" | "right" | "bottom" | "left"
  >("top");
  const [tabAnimation, setTabAnimation] = useState<"fade" | "slide">("fade");
  const [accordionMultiple, setAccordionMultiple] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState<number>(65);

  // Exemples pour l'accordéon
  const accordionItems = [
    {
      title: "Comment utiliser l'application ?",
      content: (
        <div>
          <p className="mb-2">
            Notre application est conçue pour être intuitive et facile à
            utiliser. Vous trouverez dans le menu principal toutes les
            fonctionnalités disponibles.
          </p>
          <p>
            Pour plus d'informations, consultez notre{" "}
            <a
              href="#"
              className="text-[var(--accent-primary)] hover:underline"
            >
              guide d'utilisation
            </a>
            .
          </p>
        </div>
      ),
    },
    {
      title: "Comment gérer mon équipe ?",
      content: (
        <div>
          <p className="mb-2">
            La gestion d'équipe vous permet d'inviter des membres, de définir
            leurs permissions et de suivre leurs activités.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Invitez des membres via l'onglet "Équipe"</li>
            <li>Définissez les rôles et les permissions</li>
            <li>Suivez les activités des membres</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Comment créer un nouveau projet ?",
      content: (
        <p>
          Pour créer un nouveau projet, cliquez sur le bouton "+" dans le
          tableau de bord, puis suivez les étapes indiquées. Vous pourrez
          définir le nom du projet, sa description, les membres participants et
          les délais.
        </p>
      ),
    },
    {
      title: "Quelles sont les options de sauvegarde ?",
      content: (
        <div>
          <p className="mb-2">
            Vos données sont automatiquement sauvegardées dans le cloud. Vous
            pouvez également exporter vos données dans différents formats.
          </p>
          <div className="bg-[var(--background-tertiary)]/50 p-2 rounded-md">
            <p className="text-sm font-medium">
              Formats d'exportation disponibles :
            </p>
            <ul className="text-sm list-disc list-inside">
              <li>CSV</li>
              <li>Excel</li>
              <li>PDF</li>
              <li>JSON</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  // Fonction pour incrémenter la valeur de progression
  const incrementProgress = () => {
    setProgressValue((prev) => Math.min(prev + 10, 100));
  };

  // Fonction pour décrémenter la valeur de progression
  const decrementProgress = () => {
    setProgressValue((prev) => Math.max(prev - 10, 0));
  };

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
        Démonstration des composants UI
      </h1>

      {/* Démonstration de ProgressBar */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Composant ProgressBar
        </h2>

        <div className="space-y-6">
          {/* Variantes de couleur */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">
              Variantes de couleur
            </h3>
            <div className="space-y-4">
              <ProgressBar
                value={progressValue}
                label="Progression primaire"
                color="primary"
              />
              <ProgressBar
                value={progressValue}
                label="Progression réussie"
                color="success"
              />
              <ProgressBar
                value={progressValue}
                label="Progression avertissement"
                color="warning"
              />
              <ProgressBar
                value={progressValue}
                label="Progression erreur"
                color="error"
              />
            </div>
          </div>

          {/* Contrôles interactifs */}
          <div className="pt-3">
            <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">
              Contrôle interactif
            </h3>
            <div className="flex gap-2 mb-4">
              <Button onClick={decrementProgress} variant="secondary" size="sm">
                -10%
              </Button>
              <Button onClick={incrementProgress} variant="secondary" size="sm">
                +10%
              </Button>
              <Button
                onClick={() => setProgressValue(0)}
                variant="secondary"
                size="sm"
              >
                Réinitialiser
              </Button>
            </div>
            <ProgressBar
              value={progressValue}
              label="Progression interactive"
            />
          </div>

          {/* ProgressBar sans libellé */}
          <div className="pt-3">
            <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">
              Variations d'affichage
            </h3>
            <div className="space-y-4">
              <ProgressBar
                value={progressValue}
                showPercentage={false}
                label="Sans pourcentage"
              />
              <ProgressBar
                value={progressValue}
                label=""
                showPercentage={true}
              />
              <ProgressBar
                value={progressValue}
                label=""
                showPercentage={false}
              />
            </div>
          </div>

          {/* Description */}
          <div className="pt-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Le composant ProgressBar est entièrement animé avec Framer Motion
              et s'adapte au thème clair/sombre via les variables CSS. Il est
              également accessible avec les attributs aria-* appropriés pour les
              lecteurs d'écran.
            </p>
          </div>
        </div>
      </Card>

      {/* Démonstration des Tabs */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Composant Tabs
        </h2>

        <div className="space-y-6">
          {/* Tabs de base */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              Tabs standard
            </h3>
            <Tabs
              tabs={["Général", "Équipe", "Paramètres"]}
              animated
              animationType={tabAnimation}
            >
              <div className="p-4 bg-[var(--background-tertiary)]/30 rounded-lg">
                <h4 className="font-medium mb-2">Informations générales</h4>
                <p>
                  Cette section contient les informations générales du projet et
                  les paramètres de base que vous pouvez configurer.
                </p>
              </div>
              <div className="p-4 bg-[var(--background-tertiary)]/30 rounded-lg">
                <h4 className="font-medium mb-2">Gestion de l'équipe</h4>
                <p>
                  Ajoutez, modifiez ou supprimez des membres de l'équipe.
                  Définissez les rôles et les permissions.
                </p>
              </div>
              <div className="p-4 bg-[var(--background-tertiary)]/30 rounded-lg">
                <h4 className="font-medium mb-2">Paramètres avancés</h4>
                <p>
                  Configurez les paramètres avancés de votre projet, y compris
                  les intégrations et les autorisations.
                </p>
              </div>
            </Tabs>
          </div>

          {/* Contrôle d'animation */}
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              Type d'animation
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => setTabAnimation("fade")}
                variant={tabAnimation === "fade" ? "primary" : "secondary"}
                size="sm"
              >
                Fade
              </Button>
              <Button
                onClick={() => setTabAnimation("slide")}
                variant={tabAnimation === "slide" ? "primary" : "secondary"}
                size="sm"
              >
                Slide
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Démonstration des Badges */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Composant Badge
        </h2>

        <div className="space-y-6">
          {/* Types de badges */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              Types de badges
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge label="Succès" type="success" />
              <Badge label="Erreur" type="error" />
              <Badge label="Information" type="info" />
              <Badge label="Avertissement" type="warning" />
            </div>
          </div>

          {/* Badges dans un contexte */}
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              Badges en contexte
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-[var(--background-tertiary)]/20 rounded-lg flex justify-between items-center">
                <span>État du serveur</span>
                <Badge label="En ligne" type="success" />
              </div>
              <div className="p-3 bg-[var(--background-tertiary)]/20 rounded-lg flex justify-between items-center">
                <span>Tâches en attente</span>
                <Badge label="5 en attente" type="warning" />
              </div>
              <div className="p-3 bg-[var(--background-tertiary)]/20 rounded-lg flex justify-between items-center">
                <span>Nouvelles fonctionnalités</span>
                <Badge label="Nouveau" type="info" />
              </div>
              <div className="p-3 bg-[var(--background-tertiary)]/20 rounded-lg flex justify-between items-center">
                <span>Rapport d'erreurs</span>
                <Badge label="2 erreurs" type="error" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Les badges utilisent les variables CSS du thème pour s'adapter
              automatiquement aux modes clair et sombre. Ils sont animés avec
              Framer Motion pour des transitions fluides et incluent un attribut
              role="status" pour l'accessibilité.
            </p>
          </div>
        </div>
      </Card>

      {/* Démonstration des Tooltips */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Composant Tooltip
        </h2>

        <div className="space-y-6">
          {/* Positions de Tooltip */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              Positions
            </h3>
            <div className="flex flex-wrap gap-4">
              <Tooltip content="Tooltip positionné au-dessus" position="top">
                <Button variant="secondary">Top</Button>
              </Tooltip>
              <Tooltip content="Tooltip positionné à droite" position="right">
                <Button variant="secondary">Right</Button>
              </Tooltip>
              <Tooltip
                content="Tooltip positionné en-dessous"
                position="bottom"
              >
                <Button variant="secondary">Bottom</Button>
              </Tooltip>
              <Tooltip content="Tooltip positionné à gauche" position="left">
                <Button variant="secondary">Left</Button>
              </Tooltip>
            </div>
          </div>

          {/* Tooltip dynamique */}
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              Tooltip dynamique
            </h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setTooltipPosition("top")}
                  variant={tooltipPosition === "top" ? "primary" : "secondary"}
                  size="sm"
                >
                  Top
                </Button>
                <Button
                  onClick={() => setTooltipPosition("right")}
                  variant={
                    tooltipPosition === "right" ? "primary" : "secondary"
                  }
                  size="sm"
                >
                  Right
                </Button>
                <Button
                  onClick={() => setTooltipPosition("bottom")}
                  variant={
                    tooltipPosition === "bottom" ? "primary" : "secondary"
                  }
                  size="sm"
                >
                  Bottom
                </Button>
                <Button
                  onClick={() => setTooltipPosition("left")}
                  variant={tooltipPosition === "left" ? "primary" : "secondary"}
                  size="sm"
                >
                  Left
                </Button>
              </div>
              <div className="flex justify-center mt-6">
                <Tooltip
                  content={`Ce tooltip est positionné en ${tooltipPosition}`}
                  position={tooltipPosition}
                >
                  <Button>Survolez pour voir le tooltip</Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Démonstration des Alerts */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Composant Alert
        </h2>

        <div className="space-y-4">
          {/* Types d'alertes */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">
              Types d'alertes
            </h3>
            <div className="space-y-3">
              <Alert
                type="info"
                title="Information"
                message="Voici une alerte de type information importante."
              />
              <Alert
                type="success"
                title="Succès"
                message="L'opération a été complétée avec succès!"
              />
              <Alert
                type="warning"
                title="Attention"
                message="Cette action pourrait avoir des conséquences importantes."
              />
              <Alert
                type="error"
                title="Erreur"
                message="Une erreur s'est produite lors du traitement de votre demande."
              />
            </div>
          </div>

          {/* Alertes animées */}
          <div className="pt-3">
            <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">
              Alertes animées
            </h3>
            <div className="space-y-3">
              <Alert
                type="info"
                message="Alerte avec animation fade par défaut"
                animate={true}
                animationType="fade"
              />
              <Alert
                type="success"
                message="Alerte avec animation slide"
                animate={true}
                animationType="slide"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Démonstration de l'Accordion */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Composant Accordion
        </h2>

        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              Mode d'ouverture :
            </h3>
            <Button
              onClick={() => setAccordionMultiple(false)}
              variant={!accordionMultiple ? "primary" : "secondary"}
              size="sm"
            >
              Un seul à la fois
            </Button>
            <Button
              onClick={() => setAccordionMultiple(true)}
              variant={accordionMultiple ? "primary" : "secondary"}
              size="sm"
            >
              Plusieurs simultanés
            </Button>
          </div>

          <Accordion
            items={accordionItems}
            multiple={accordionMultiple}
            defaultOpenIndexes={[0]}
          />

          <div className="mt-4 p-3 bg-[var(--background-tertiary)]/30 rounded-lg text-sm">
            <p className="text-[var(--text-secondary)]">
              Le composant Accordion permet d'afficher de l'information de
              manière compacte. Il est particulièrement utile pour les FAQ, les
              paramètres groupés ou tout contenu qui bénéficie d'être organisé
              en sections repliables.
            </p>
            <p className="mt-2 text-[var(--text-secondary)]">
              <strong>Caractéristiques :</strong> Animation fluide, support
              d'accessibilité, mode simple ou multiple, thème clair/sombre.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UIComponentsDemo;

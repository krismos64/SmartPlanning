import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, CalendarRange } from "lucide-react";
import React, { useState } from "react";
import PageWrapper from "../components/layout/PageWrapper";
import SectionCard from "../components/layout/SectionCard";
import SectionTitle from "../components/layout/SectionTitle";
import Breadcrumb from "../components/ui/Breadcrumb";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DatePicker from "../components/ui/DatePicker";

const DatePickerDemoPage: React.FC = () => {
  // États pour stocker les dates sélectionnées
  const [simpleDate, setSimpleDate] = useState<Date | null>(null);
  const [dateWithMinMax, setDateWithMinMax] = useState<Date | null>(null);
  const [requiredDate, setRequiredDate] = useState<Date | null>(null);
  const [errorDate, setErrorDate] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  // Dates min et max pour la démonstration
  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3); // +3 mois à partir d'aujourd'hui

  // Items du fil d'ariane
  const breadcrumbItems = [
    { label: "Dashboard", href: "/tableau-de-bord" },
    { label: "Composants", href: "/components" },
    { label: "DatePicker" },
  ];

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requiredDate) {
      setHasError(true);
      return;
    }

    setHasError(false);

    // Format des dates pour l'affichage
    const formatDate = (date: Date | null) => {
      if (!date) return "Non sélectionné";
      return format(date, "dd MMMM yyyy", { locale: fr });
    };

    // Pour une vraie application, vous enverriez ces données à une API
    console.log({
      simpleDate: formatDate(simpleDate),
      dateWithMinMax: formatDate(dateWithMinMax),
      requiredDate: formatDate(requiredDate),
      errorDate: formatDate(errorDate),
    });

    alert(
      "Formulaire soumis avec succès!\n\nDate requise: " +
        formatDate(requiredDate)
    );
  };

  return (
    <PageWrapper>
      {/* En-tête avec fil d'ariane */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Titre de la page */}
      <SectionTitle
        title="Sélecteur de date"
        subtitle="Démonstration du composant DatePicker"
        icon={<Calendar size={24} />}
        className="mb-8"
      />

      {/* Contenu principal */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          <SectionCard
            title="Exemples de DatePicker"
            description="Différentes configurations du composant DatePicker"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DatePicker standard */}
              <Card
                title="DatePicker standard"
                className="bg-[var(--background-tertiary)]"
              >
                <div className="p-4">
                  <DatePicker
                    label="Sélectionner une date"
                    selectedDate={simpleDate}
                    onChange={setSimpleDate}
                    placeholder="JJ/MM/AAAA"
                  />
                  {simpleDate && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Date sélectionnée:{" "}
                      {format(simpleDate, "dd MMMM yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
              </Card>

              {/* DatePicker avec min/max */}
              <Card
                title="DatePicker avec min/max"
                className="bg-[var(--background-tertiary)]"
              >
                <div className="p-4">
                  <DatePicker
                    label="Sélectionner une date future"
                    selectedDate={dateWithMinMax}
                    onChange={setDateWithMinMax}
                    minDate={minDate}
                    maxDate={maxDate}
                    placeholder="JJ/MM/AAAA"
                  />
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Limité de {format(minDate, "dd/MM/yyyy")} à{" "}
                    {format(maxDate, "dd/MM/yyyy")}
                  </p>
                </div>
              </Card>

              {/* DatePicker requis */}
              <Card
                title="DatePicker requis"
                className="bg-[var(--background-tertiary)]"
              >
                <div className="p-4">
                  <DatePicker
                    label="Date de début"
                    selectedDate={requiredDate}
                    onChange={setRequiredDate}
                    required
                    error={hasError ? "Ce champ est requis" : undefined}
                    placeholder="JJ/MM/AAAA"
                  />
                </div>
              </Card>

              {/* DatePicker avec état d'erreur */}
              <Card
                title="DatePicker avec erreur"
                className="bg-[var(--background-tertiary)]"
              >
                <div className="p-4">
                  <DatePicker
                    label="Date avec validation"
                    selectedDate={errorDate}
                    onChange={setErrorDate}
                    error="Format de date invalide"
                    placeholder="JJ/MM/AAAA"
                  />
                </div>
              </Card>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={<CalendarRange size={16} />}
              >
                Soumettre le formulaire
              </Button>
            </div>
          </SectionCard>
        </div>
      </form>
    </PageWrapper>
  );
};

export default DatePickerDemoPage;

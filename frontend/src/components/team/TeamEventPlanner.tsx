import { addHours } from "date-fns";
import { CalendarClock, MapPin, Users } from "lucide-react";
import React, { useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import DatePicker from "../ui/DatePicker";
import InputField from "../ui/InputField";
import Select from "../ui/Select";

// Types pour le composant de planification d'événement
interface TeamEventPlannerProps {
  teamId: string;
  teamName: string;
  onEventCreated?: (event: TeamEvent) => void;
}

// Type pour un événement d'équipe
export interface TeamEvent {
  id?: string;
  teamId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  eventType: "meeting" | "training" | "teambuilding" | "other";
}

/**
 * Composant de planification d'événements d'équipe
 *
 * Permet de créer des événements pour une équipe en spécifiant les dates,
 * le type d'événement, le lieu et une description.
 */
const TeamEventPlanner: React.FC<TeamEventPlannerProps> = ({
  teamId,
  teamName,
  onEventCreated,
}) => {
  // État initial pour le formulaire
  const today = new Date();
  const initialEndDate = addHours(today, 1);

  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState<TeamEvent>({
    teamId,
    title: "",
    description: "",
    startDate: today,
    endDate: initialEndDate,
    location: "",
    eventType: "meeting",
  });

  // État pour la validation et la soumission
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Options pour le type d'événement
  const eventTypeOptions = [
    { label: "Réunion", value: "meeting" },
    { label: "Formation", value: "training" },
    { label: "Team Building", value: "teambuilding" },
    { label: "Autre", value: "other" },
  ];

  // Fonction pour mettre à jour les champs du formulaire
  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Effacer l'erreur pour ce champ s'il en existe une
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Fonction pour gérer le changement de date de début
  const handleStartDateChange = (date: Date | null) => {
    if (!date) return;

    setFormData((prev) => {
      // Si la date de fin est avant la nouvelle date de début, ajuster la date de fin
      const endDate = prev.endDate < date ? addHours(date, 1) : prev.endDate;
      return {
        ...prev,
        startDate: date,
        endDate,
      };
    });
  };

  // Fonction pour gérer le changement de date de fin
  const handleEndDateChange = (date: Date | null) => {
    if (!date) return;

    setFormData((prev) => ({
      ...prev,
      endDate: date,
    }));
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Le lieu est requis";
    }

    if (formData.endDate < formData.startDate) {
      newErrors.endDate = "La date de fin doit être après la date de début";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Dans une app réelle, vous feriez un appel API ici
      // const response = await axiosInstance.post(`/api/teams/${teamId}/events`, formData);

      // Simuler une requête réseau
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Générer un ID factice pour la démo
      const newEvent: TeamEvent = {
        ...formData,
        id: `event-${Date.now()}`,
      };

      // Notifier le parent que l'événement a été créé
      if (onEventCreated) {
        onEventCreated(newEvent);
      }

      // Réinitialiser le formulaire
      setFormData({
        teamId,
        title: "",
        description: "",
        startDate: new Date(),
        endDate: addHours(new Date(), 1),
        location: "",
        eventType: "meeting",
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      setErrors({
        form: "Une erreur est survenue lors de la création de l'événement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      title={`Planifier un événement pour ${teamName}`}
      icon={<CalendarClock size={18} />}
      className="bg-[var(--background-tertiary)]"
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Titre de l'événement */}
        <InputField
          label="Titre"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Nom de l'événement"
          required
          error={errors.title}
        />

        {/* Date et heure de début */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Date de début"
            selectedDate={formData.startDate}
            onChange={handleStartDateChange}
            dateFormat="dd/MM/yyyy"
            required
            error={errors.startDate}
          />

          {/* Date et heure de fin */}
          <DatePicker
            label="Date de fin"
            selectedDate={formData.endDate}
            onChange={handleEndDateChange}
            dateFormat="dd/MM/yyyy"
            minDate={formData.startDate}
            required
            error={errors.endDate}
          />
        </div>

        {/* Type d'événement */}
        <Select
          label="Type d'événement"
          options={eventTypeOptions}
          value={formData.eventType}
          onChange={(value) => handleInputChange("eventType", value)}
          icon={<Users size={16} />}
        />

        {/* Lieu */}
        <InputField
          label="Lieu"
          value={formData.location}
          onChange={(e) => handleInputChange("location", e.target.value)}
          placeholder="Emplacement de l'événement"
          icon={<MapPin size={16} />}
          required
          error={errors.location}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Détails de l'événement..."
            rows={3}
            className="w-full px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--background-secondary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
        </div>

        {/* Erreur générale du formulaire */}
        {errors.form && <p className="text-red-500 text-sm">{errors.form}</p>}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost">
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<CalendarClock size={16} />}
          >
            Planifier
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TeamEventPlanner;

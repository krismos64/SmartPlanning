import { endOfDay, format, isWithinInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Filter, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import DatePicker from "../ui/DatePicker";
import InputField from "../ui/InputField";
import Table from "../ui/Table";
import { TeamEvent } from "./TeamEventPlanner";

interface TeamEventsCalendarProps {
  events: TeamEvent[];
  teamName: string;
}

const TeamEventsCalendar: React.FC<TeamEventsCalendarProps> = ({
  events,
  teamName,
}) => {
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const getEventBadgeType = (
    eventType: string
  ): "success" | "warning" | "info" | "error" => {
    switch (eventType) {
      case "meeting":
        return "info";
      case "training":
        return "success";
      case "teambuilding":
        return "warning";
      default:
        return "error";
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case "meeting":
        return "Réunion";
      case "training":
        return "Formation";
      case "teambuilding":
        return "Team Building";
      default:
        return "Autre";
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description &&
          event.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStartDate =
        !startDateFilter ||
        isWithinInterval(event.startDate, {
          start: startOfDay(startDateFilter),
          end: endOfDay(endDateFilter ?? startDateFilter),
        });

      return matchesSearch && matchesStartDate;
    });
  }, [events, searchTerm, startDateFilter, endDateFilter]);

  const resetFilters = () => {
    setStartDateFilter(null);
    setEndDateFilter(null);
    setSearchTerm("");
  };

  const tableData = filteredEvents.map((event) => ({
    date: (
      <div>
        <div className="font-medium">
          {format(new Date(event.startDate), "dd MMM yyyy", { locale: fr })}
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {format(new Date(event.startDate), "HH:mm", { locale: fr })} -{" "}
          {format(new Date(event.endDate), "HH:mm", { locale: fr })}
        </div>
      </div>
    ),
    title: (
      <div>
        <div className="font-medium">{event.title}</div>
        {event.description && (
          <div className="text-xs text-[var(--text-secondary)] truncate max-w-xs">
            {event.description}
          </div>
        )}
      </div>
    ),
    location: event.location,
    type: (
      <Badge
        type={getEventBadgeType(event.eventType)}
        label={getEventTypeLabel(event.eventType)}
      />
    ),
  }));

  return (
    <Card title={`Calendrier des événements - ${teamName}`}>
      <div className="flex justify-end pr-4 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters((prev) => !prev)}
          icon={<Filter size={16} />}
        >
          {showFilters ? "Cacher les filtres" : "Filtrer"}
        </Button>
      </div>
      {showFilters && (
        <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              name="search"
              label="Rechercher"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Titre, lieu..."
              icon={<Search size={16} />}
            />
            <DatePicker
              label="Date de début"
              selectedDate={startDateFilter ?? undefined}
              onChange={setStartDateFilter}
              placeholder="Filtrer par date de début"
            />
            <DatePicker
              label="Date de fin"
              selectedDate={endDateFilter ?? undefined}
              onChange={setEndDateFilter}
              minDate={startDateFilter ?? undefined}
              placeholder="Filtrer par date de fin"
              disabled={!startDateFilter}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        <Table
          columns={[
            { key: "date", label: "Date", className: "w-32" },
            { key: "title", label: "Événement" },
            { key: "location", label: "Lieu" },
            { key: "type", label: "Type", className: "w-28" },
          ]}
          data={tableData}
          emptyState={{
            title: "Aucun événement",
            description: "Aucun événement planifié pour cette équipe",
            icon: <CalendarDays size={40} />,
          }}
        />
        <div className="mt-4 text-sm text-[var(--text-secondary)]">
          {filteredEvents.length} événement
          {filteredEvents.length !== 1 ? "s" : ""} trouvé
          {filteredEvents.length !== 1 ? "s" : ""}
          {(startDateFilter || searchTerm) && " avec les filtres appliqués"}
        </div>
      </div>
    </Card>
  );
};

export default TeamEventsCalendar;

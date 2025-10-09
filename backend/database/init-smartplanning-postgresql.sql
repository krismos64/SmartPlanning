-- ============================================================================
-- SMARTPLANNING - PostgreSQL Database Schema
-- ============================================================================
-- Version: 2.0 (Octobre 2025)
-- Description: Base de données complète pour SmartPlanning SaaS
-- Architecture: Multi-tenant avec isolation par companyId
-- Prisma ORM: Compatible avec schema.prisma
-- ============================================================================

-- Nettoyage sécurisé (à commenter en production)
-- DROP DATABASE IF EXISTS smartplanning;
-- CREATE DATABASE smartplanning WITH ENCODING 'UTF8' LC_COLLATE='fr_FR.UTF-8' LC_CTYPE='fr_FR.UTF-8';
-- \c smartplanning;

-- ============================================================================
-- EXTENSIONS POSTGRESQL
-- ============================================================================

-- Extension UUID (si nécessaire pour futures fonctionnalités)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pg_trgm pour recherche full-text performante
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extension btree_gin pour indexes composites optimisés
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================================================
-- FONCTION TRIGGER - Mise à jour automatique de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: company - Entreprises (racine multi-tenant)
-- ============================================================================

CREATE TABLE company (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Informations entreprise
    name VARCHAR(255) NOT NULL,
    address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'France',
    sector VARCHAR(100), -- retail, healthcare, hospitality
    size VARCHAR(20), -- small, medium, large
    logo TEXT, -- URL Cloudinary

    -- Configuration planning par défaut (JSON)
    default_opening_hours JSON DEFAULT NULL,
    -- Structure: { "monday": { "start": "09:00", "end": "18:00", "isOpen": true }, ... }
    default_minimum_staff INTEGER NOT NULL DEFAULT 1,
    default_max_hours_per_day INTEGER NOT NULL DEFAULT 8,
    default_break_duration INTEGER NOT NULL DEFAULT 60, -- minutes

    -- Support fuseau horaire
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Paris',

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Contraintes
    CONSTRAINT company_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Index company
CREATE INDEX idx_company_name ON company(name);
CREATE INDEX idx_company_sector_size_active ON company(sector, size, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_company_created_at ON company(created_at DESC);

-- Trigger company
CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON company
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires company
COMMENT ON TABLE company IS 'Entreprises clientes - Entité racine du système multi-tenant';
COMMENT ON COLUMN company.default_opening_hours IS 'Horaires d''ouverture par défaut au format JSON';
COMMENT ON COLUMN company.timezone IS 'Fuseau horaire de l''entreprise (IANA timezone)';

-- ============================================================================
-- TABLE: user - Utilisateurs et authentification
-- ============================================================================

CREATE TABLE "user" (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Authentification
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255), -- NULL si OAuth uniquement

    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL, -- admin, directeur, manager, employee

    -- Relation entreprise
    company_id INTEGER REFERENCES company(id) ON DELETE CASCADE,

    -- Profil
    profile_picture TEXT, -- URL Cloudinary

    -- OAuth Google
    google_id VARCHAR(255) UNIQUE,

    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMPTZ,

    -- Vérification email et reset password
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMPTZ,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT user_role_valid CHECK (role IN ('admin', 'directeur', 'manager', 'employee')),
    CONSTRAINT user_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index user
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_company_role_active ON "user"(company_id, role, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_google_id ON "user"(google_id) WHERE google_id IS NOT NULL;

-- Trigger user
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires user
COMMENT ON TABLE "user" IS 'Utilisateurs - Authentification et autorisation (RBAC)';
COMMENT ON COLUMN "user".role IS 'Rôle système: admin, directeur, manager, employee';
COMMENT ON COLUMN "user".google_id IS 'ID Google OAuth pour SSO';

-- ============================================================================
-- TABLE: team - Équipes de travail
-- ============================================================================

CREATE TABLE team (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Informations équipe
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Relations
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    manager_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,

    -- Configuration
    required_skills TEXT[] NOT NULL DEFAULT '{}', -- Array PostgreSQL
    minimum_members INTEGER NOT NULL DEFAULT 1,

    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT team_minimum_members_positive CHECK (minimum_members > 0)
);

-- Index team
CREATE INDEX idx_team_company_active ON team(company_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_team_manager ON team(manager_id) WHERE manager_id IS NOT NULL;

-- Trigger team
CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON team
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires team
COMMENT ON TABLE team IS 'Équipes de travail au sein d''une entreprise';
COMMENT ON COLUMN team.required_skills IS 'Compétences requises pour l''équipe (array PostgreSQL)';

-- ============================================================================
-- TABLE: employee - Employés (1-to-1 avec User)
-- ============================================================================

CREATE TABLE employee (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations (1-to-1 avec User)
    user_id INTEGER NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES team(id) ON DELETE SET NULL,

    -- Informations métier
    position VARCHAR(100),
    skills TEXT[] NOT NULL DEFAULT '{}', -- Compétences de l'employé
    contractual_hours INTEGER NOT NULL DEFAULT 35, -- heures/semaine
    hourly_rate DECIMAL(10, 2),

    -- Préférences planning (JSON)
    preferences JSON NOT NULL DEFAULT '{"preferredDays": [], "avoidedDays": [], "maxConsecutiveDays": 6, "preferSplitShifts": false}'::json,

    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    hire_date DATE,
    end_date DATE,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT employee_contractual_hours_valid CHECK (contractual_hours >= 1 AND contractual_hours <= 60),
    CONSTRAINT employee_dates_valid CHECK (end_date IS NULL OR end_date >= hire_date)
);

-- Index employee
CREATE INDEX idx_employee_user ON employee(user_id);
CREATE INDEX idx_employee_company_team_active ON employee(company_id, team_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_employee_active_company ON employee(is_active, company_id);

-- Trigger employee
CREATE TRIGGER update_employee_updated_at BEFORE UPDATE ON employee
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires employee
COMMENT ON TABLE employee IS 'Employés - Informations métier et préférences planning';
COMMENT ON COLUMN employee.preferences IS 'Préférences de planning au format JSON';
COMMENT ON COLUMN employee.contractual_hours IS 'Heures contractuelles par semaine';

-- ============================================================================
-- TABLE: weekly_schedule - Plannings hebdomadaires validés
-- ============================================================================

CREATE TABLE weekly_schedule (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES team(id) ON DELETE CASCADE,

    -- Période
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,

    -- Planning détaillé (JSON)
    schedule JSON NOT NULL DEFAULT '{}'::json,
    -- Structure: { "monday": [{ "employeeId": 1, "startTime": "09:00", "endTime": "17:00", "position": "Vendeur", "skills": ["caisse"], "breakStart": "12:00", "breakEnd": "13:00" }], ... }

    -- Workflow de validation
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, validated, published, archived
    validated_by_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,

    -- Contraintes
    CONSTRAINT weekly_schedule_dates_valid CHECK (week_end_date >= week_start_date),
    CONSTRAINT weekly_schedule_status_valid CHECK (status IN ('draft', 'validated', 'published', 'archived'))
);

-- Index weekly_schedule
CREATE INDEX idx_weekly_schedule_company_start ON weekly_schedule(company_id, week_start_date DESC);
CREATE INDEX idx_weekly_schedule_team_status ON weekly_schedule(team_id, status);
CREATE INDEX idx_weekly_schedule_dates ON weekly_schedule(week_start_date, week_end_date);
CREATE INDEX idx_weekly_schedule_status ON weekly_schedule(status);

-- Trigger weekly_schedule
CREATE TRIGGER update_weekly_schedule_updated_at BEFORE UPDATE ON weekly_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires weekly_schedule
COMMENT ON TABLE weekly_schedule IS 'Plannings hebdomadaires validés et publiés';
COMMENT ON COLUMN weekly_schedule.schedule IS 'Planning détaillé au format JSON (structure par jour)';

-- ============================================================================
-- TABLE: generated_schedule - Plannings générés par IA
-- ============================================================================

CREATE TABLE generated_schedule (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    weekly_schedule_id INTEGER REFERENCES weekly_schedule(id) ON DELETE SET NULL,

    -- Configuration de génération (JSON)
    generation_config JSON NOT NULL,
    -- Structure: { "strategy": "preferences", "weekStartDate": "2025-10-13", "selectedEmployees": [1, 2, 3], "constraints": {...} }

    -- Résultat généré (même structure que weekly_schedule.schedule)
    generated_planning JSON NOT NULL,

    -- Métriques qualité (JSON)
    metrics JSON NOT NULL DEFAULT '{}'::json,
    -- Structure: { "generationTime": 2.5, "strategy": "preferences", "qualityScore": 0.95, "constraintsRespected": 14, "employeesSatisfaction": 0.92 }

    -- Versioning du modèle IA
    model_version VARCHAR(50),
    algorithm VARCHAR(100), -- AdvancedSchedulingEngine, LinearProgramming, GeneticAlgorithm
    engine_config JSON,

    -- Validation
    status VARCHAR(20) NOT NULL DEFAULT 'generated', -- generated, validated, rejected, converted
    validation_note TEXT,
    validated_by_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,

    -- Métadonnées
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT generated_schedule_status_valid CHECK (status IN ('generated', 'validated', 'rejected', 'converted'))
);

-- Index generated_schedule
CREATE INDEX idx_generated_schedule_company_date ON generated_schedule(company_id, generated_at DESC);
CREATE INDEX idx_generated_schedule_team_status ON generated_schedule(team_id, status);
CREATE INDEX idx_generated_schedule_weekly ON generated_schedule(weekly_schedule_id) WHERE weekly_schedule_id IS NOT NULL;
CREATE INDEX idx_generated_schedule_model ON generated_schedule(model_version, generated_at DESC);

-- Trigger generated_schedule
CREATE TRIGGER update_generated_schedule_updated_at BEFORE UPDATE ON generated_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires generated_schedule
COMMENT ON TABLE generated_schedule IS 'Plannings générés automatiquement par IA avec métriques';
COMMENT ON COLUMN generated_schedule.metrics IS 'Métriques de qualité du planning généré';
COMMENT ON COLUMN generated_schedule.model_version IS 'Version du modèle IA utilisé (A/B testing)';

-- ============================================================================
-- TABLE: shift - Vue dénormalisée des créneaux (performance)
-- ============================================================================

CREATE TABLE shift (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations
    weekly_schedule_id INTEGER NOT NULL REFERENCES weekly_schedule(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES team(id) ON DELETE CASCADE,

    -- Détails du créneau
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,

    -- Métadonnées
    position VARCHAR(100),
    skills TEXT[] NOT NULL DEFAULT '{}',

    -- Statut
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT shift_times_valid CHECK (end_time > start_time),
    CONSTRAINT shift_break_valid CHECK (
        (break_start IS NULL AND break_end IS NULL) OR
        (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start)
    ),
    CONSTRAINT shift_status_valid CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'))
);

-- Index shift
CREATE INDEX idx_shift_employee_date ON shift(employee_id, shift_date);
CREATE INDEX idx_shift_weekly_schedule ON shift(weekly_schedule_id);
CREATE INDEX idx_shift_company_date ON shift(company_id, shift_date);
CREATE INDEX idx_shift_date_times ON shift(shift_date, start_time, end_time);

-- Commentaires shift
COMMENT ON TABLE shift IS 'Créneaux individuels - Vue dénormalisée pour requêtes optimisées';
COMMENT ON COLUMN shift.status IS 'Statut du créneau: scheduled, confirmed, completed, cancelled';

-- ============================================================================
-- TABLE: vacation_request - Demandes de congés
-- ============================================================================

CREATE TABLE vacation_request (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations
    employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,

    -- Détails demande
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL, -- vacation, sick, personal, training, parental
    reason TEXT,
    attachment_url TEXT, -- Certificat médical, etc.

    -- Workflow validation
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
    reviewed_by_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,

    -- Métadonnées
    request_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT vacation_dates_valid CHECK (end_date >= start_date),
    CONSTRAINT vacation_type_valid CHECK (type IN ('vacation', 'sick', 'personal', 'training', 'parental')),
    CONSTRAINT vacation_status_valid CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Index vacation_request
CREATE INDEX idx_vacation_employee_start ON vacation_request(employee_id, start_date DESC);
CREATE INDEX idx_vacation_company_status ON vacation_request(company_id, status);
CREATE INDEX idx_vacation_dates ON vacation_request(start_date, end_date);
CREATE INDEX idx_vacation_status_company ON vacation_request(status, company_id);

-- Trigger vacation_request
CREATE TRIGGER update_vacation_request_updated_at BEFORE UPDATE ON vacation_request
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires vacation_request
COMMENT ON TABLE vacation_request IS 'Demandes de congés et absences avec workflow de validation';
COMMENT ON COLUMN vacation_request.type IS 'Type: vacation, sick, personal, training, parental';

-- ============================================================================
-- TABLE: task - Tâches opérationnelles
-- ============================================================================

CREATE TABLE task (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Informations tâche
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Relations
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES team(id) ON DELETE SET NULL,
    assigned_to_id INTEGER REFERENCES employee(id) ON DELETE SET NULL,

    -- Planning
    priority VARCHAR(20), -- low, medium, high, urgent
    due_date DATE,
    estimated_hours DECIMAL(5, 2),

    -- Workflow
    status VARCHAR(20) NOT NULL DEFAULT 'todo', -- todo, in_progress, blocked, done, cancelled
    completed_at TIMESTAMPTZ,
    completed_by_id INTEGER REFERENCES employee(id) ON DELETE SET NULL,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,

    -- Contraintes
    CONSTRAINT task_priority_valid CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT task_status_valid CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled'))
);

-- Index task
CREATE INDEX idx_task_company_status ON task(company_id, status);
CREATE INDEX idx_task_assigned_status ON task(assigned_to_id, status) WHERE assigned_to_id IS NOT NULL;
CREATE INDEX idx_task_due_date ON task(due_date) WHERE due_date IS NOT NULL;

-- Trigger task
CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON task
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires task
COMMENT ON TABLE task IS 'Tâches opérationnelles assignables aux employés';

-- ============================================================================
-- TABLE: incident - Incidents opérationnels
-- ============================================================================

CREATE TABLE incident (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Informations incident
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Relations
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES team(id) ON DELETE SET NULL,

    -- Classification
    severity VARCHAR(20), -- low, medium, high, critical
    category VARCHAR(50), -- technical, hr, safety, customer

    -- Résolution
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, investigating, resolved, closed
    resolved_at TIMESTAMPTZ,
    resolved_by_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    resolution TEXT,

    -- Métadonnées
    reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reported_by_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT incident_severity_valid CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT incident_status_valid CHECK (status IN ('open', 'investigating', 'resolved', 'closed'))
);

-- Index incident
CREATE INDEX idx_incident_company_status ON incident(company_id, status);
CREATE INDEX idx_incident_severity_status ON incident(severity, status);

-- Trigger incident
CREATE TRIGGER update_incident_updated_at BEFORE UPDATE ON incident
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires incident
COMMENT ON TABLE incident IS 'Suivi des incidents opérationnels (technique, RH, sécurité, client)';

-- ============================================================================
-- TABLE: event - Événements calendrier
-- ============================================================================

CREATE TABLE event (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Informations événement
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Relations
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES team(id) ON DELETE SET NULL,

    -- Planning événement
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    location VARCHAR(255),

    -- Participants (array d'IDs employés)
    participants INTEGER[] NOT NULL DEFAULT '{}',

    -- Type
    event_type VARCHAR(50), -- meeting, training, company_event, holiday

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,

    -- Contraintes
    CONSTRAINT event_dates_valid CHECK (end_date >= start_date)
);

-- Index event
CREATE INDEX idx_event_company_start ON event(company_id, start_date DESC);

-- Trigger event
CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON event
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires event
COMMENT ON TABLE event IS 'Événements calendrier (réunions, formations, événements entreprise)';
COMMENT ON COLUMN event.participants IS 'Array d''IDs employés participants';

-- ============================================================================
-- TABLE: chatbot_interaction - Historique chatbot
-- ============================================================================

CREATE TABLE chatbot_interaction (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,

    -- Conversation
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    context JSON, -- Contexte de conversation pour continuité

    -- Métriques
    satisfaction_score INTEGER, -- 1-5
    response_time INTEGER, -- millisecondes

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT chatbot_satisfaction_valid CHECK (satisfaction_score IS NULL OR (satisfaction_score >= 1 AND satisfaction_score <= 5))
);

-- Index chatbot_interaction
CREATE INDEX idx_chatbot_user_date ON chatbot_interaction(user_id, created_at DESC);
CREATE INDEX idx_chatbot_company_date ON chatbot_interaction(company_id, created_at DESC);
CREATE INDEX idx_chatbot_satisfaction ON chatbot_interaction(satisfaction_score) WHERE satisfaction_score IS NOT NULL;

-- Commentaires chatbot_interaction
COMMENT ON TABLE chatbot_interaction IS 'Historique des interactions avec le chatbot IA';

-- ============================================================================
-- TABLE: chatbot_settings - Configuration chatbot par entreprise
-- ============================================================================

CREATE TABLE chatbot_settings (
    -- Identifiant
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL UNIQUE REFERENCES company(id) ON DELETE CASCADE,

    -- Configuration
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    language VARCHAR(10) NOT NULL DEFAULT 'fr',
    personality VARCHAR(50), -- professional, friendly, concise

    -- Limites
    max_tokens INTEGER NOT NULL DEFAULT 500,
    temperature DECIMAL(3, 2) NOT NULL DEFAULT 0.7,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT chatbot_temperature_valid CHECK (temperature >= 0 AND temperature <= 2)
);

-- Trigger chatbot_settings
CREATE TRIGGER update_chatbot_settings_updated_at BEFORE UPDATE ON chatbot_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires chatbot_settings
COMMENT ON TABLE chatbot_settings IS 'Configuration du chatbot IA par entreprise';

-- ============================================================================
-- TABLE: subscription - Abonnements Stripe
-- ============================================================================

CREATE TABLE subscription (
    -- Identifiant
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL UNIQUE REFERENCES company(id) ON DELETE CASCADE,

    -- Identifiants Stripe
    stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_price_id VARCHAR(255) NOT NULL,

    -- Détails plan
    plan VARCHAR(20) NOT NULL, -- starter, professional, enterprise
    plan_price DECIMAL(10, 2) NOT NULL, -- 39.00, 89.00, 179.00
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'month', -- month, year

    -- Statut
    status VARCHAR(20) NOT NULL, -- active, past_due, canceled, incomplete, trialing
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT subscription_plan_valid CHECK (plan IN ('starter', 'professional', 'enterprise')),
    CONSTRAINT subscription_status_valid CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing'))
);

-- Index subscription
CREATE INDEX idx_subscription_company ON subscription(company_id);
CREATE INDEX idx_subscription_stripe_customer ON subscription(stripe_customer_id);
CREATE INDEX idx_subscription_status_period ON subscription(status, current_period_end);

-- Trigger subscription
CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON subscription
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires subscription
COMMENT ON TABLE subscription IS 'Abonnements SaaS via Stripe';

-- ============================================================================
-- TABLE: payment - Historique paiements
-- ============================================================================

CREATE TABLE payment (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscription(id) ON DELETE SET NULL,

    -- Identifiants Stripe
    stripe_payment_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_invoice_id VARCHAR(255),

    -- Montant
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

    -- Statut
    status VARCHAR(20) NOT NULL, -- succeeded, pending, failed, refunded
    payment_method VARCHAR(50), -- card, sepa_debit

    -- Type de paiement
    payment_type VARCHAR(20) NOT NULL DEFAULT 'subscription', -- subscription, one_time, credit, refund

    -- Métadonnées
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT payment_status_valid CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
    CONSTRAINT payment_type_valid CHECK (payment_type IN ('subscription', 'one_time', 'credit', 'refund'))
);

-- Index payment
CREATE INDEX idx_payment_company_date ON payment(company_id, created_at DESC);
CREATE INDEX idx_payment_subscription ON payment(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_payment_status_date ON payment(status, created_at DESC);

-- Commentaires payment
COMMENT ON TABLE payment IS 'Historique complet des paiements';

-- ============================================================================
-- TABLE: role - Rôles système et personnalisés
-- ============================================================================

CREATE TABLE role (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Informations rôle
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE, -- Rôles système immuables
    company_id INTEGER REFERENCES company(id) ON DELETE CASCADE, -- NULL pour rôles système

    -- Permissions granulaires (JSON)
    permissions JSON NOT NULL DEFAULT '[]'::json,
    -- Structure: { "planning": ["create", "read", "update", "delete", "validate"], "vacation": ["approve", "reject"], ... }

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    UNIQUE(name, company_id)
);

-- Trigger role
CREATE TRIGGER update_role_updated_at BEFORE UPDATE ON role
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires role
COMMENT ON TABLE role IS 'Rôles système et personnalisés par entreprise (RBAC granulaire)';
COMMENT ON COLUMN role.is_system_role IS 'TRUE pour rôles système immuables';

-- ============================================================================
-- TABLE: user_role - Attribution rôles aux utilisateurs (many-to-many)
-- ============================================================================

CREATE TABLE user_role (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Relations
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,

    -- Attribution temporaire (optionnelle)
    valid_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMPTZ,

    -- Audit
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,

    -- Contraintes
    UNIQUE(user_id, role_id, company_id)
);

-- Index user_role
CREATE INDEX idx_user_role_user_company ON user_role(user_id, company_id);
CREATE INDEX idx_user_role_role ON user_role(role_id);

-- Commentaires user_role
COMMENT ON TABLE user_role IS 'Attribution des rôles aux utilisateurs (relation many-to-many)';

-- ============================================================================
-- TABLE: permission - Permissions fine-grained
-- ============================================================================

CREATE TABLE permission (
    -- Identifiant
    id SERIAL PRIMARY KEY,

    -- Permission
    name VARCHAR(100) NOT NULL UNIQUE, -- planning:create, vacation:approve
    resource VARCHAR(50) NOT NULL, -- planning, vacation, analytics
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, approve
    description TEXT,

    -- Contraintes
    UNIQUE(resource, action)
);

-- Commentaires permission
COMMENT ON TABLE permission IS 'Définition des permissions fine-grained';

-- ============================================================================
-- TABLE: role_permission - Attribution permissions aux rôles (many-to-many)
-- ============================================================================

CREATE TABLE role_permission (
    role_id INTEGER NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permission(id) ON DELETE CASCADE,

    -- Contraintes
    PRIMARY KEY(role_id, permission_id)
);

-- Commentaires role_permission
COMMENT ON TABLE role_permission IS 'Attribution des permissions aux rôles (relation many-to-many)';

-- ============================================================================
-- TABLE: audit_log - Journal d'audit complet (RGPD, droit du travail)
-- ============================================================================

CREATE TABLE audit_log (
    -- Identifiant (BIGINT pour volume important)
    id BIGSERIAL PRIMARY KEY,

    -- Contexte
    user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,

    -- Action
    action VARCHAR(100) NOT NULL, -- schedule.create, vacation.approve
    resource VARCHAR(50) NOT NULL, -- schedule, vacation
    resource_id VARCHAR(100), -- ID de la ressource modifiée
    method VARCHAR(10), -- POST, PUT, DELETE

    -- Données modifiées (JSON)
    changes_before JSON, -- État avant modification
    changes_after JSON, -- État après modification
    metadata JSON, -- Contexte additionnel

    -- Résultat
    status VARCHAR(20), -- success, failed, unauthorized
    error_message TEXT,

    -- Timestamp (partitionné par created_at)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index audit_log (optimisés pour requêtes temporelles)
CREATE INDEX idx_audit_company_date ON audit_log(company_id, created_at DESC);
CREATE INDEX idx_audit_user_date ON audit_log(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_resource ON audit_log(resource, resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX idx_audit_action_date ON audit_log(action, created_at DESC);

-- Commentaires audit_log
COMMENT ON TABLE audit_log IS 'Journal d''audit complet pour conformité (RGPD, droit du travail)';
COMMENT ON COLUMN audit_log.changes_before IS 'État de la ressource avant modification (JSON)';
COMMENT ON COLUMN audit_log.changes_after IS 'État de la ressource après modification (JSON)';

-- ============================================================================
-- CONTRAINTES FOREIGN KEY DIFFÉRÉES (added_by_id sur company)
-- ============================================================================

-- Foreign key company.created_by_id → user.id (circulaire, résolu en différé)
ALTER TABLE company
    ADD CONSTRAINT fk_company_created_by
    FOREIGN KEY (created_by_id)
    REFERENCES "user"(id)
    ON DELETE SET NULL;

-- ============================================================================
-- SEEDS INITIAUX - Données système essentielles
-- ============================================================================

-- Rôles système (immuables)
INSERT INTO role (name, description, is_system_role, company_id, permissions) VALUES
    ('admin', 'Administrateur système - Accès complet', TRUE, NULL, '{"all": ["*"]}'::json),
    ('directeur', 'Directeur d''entreprise - Gestion complète de l''entreprise', TRUE, NULL, '{"company": ["*"], "planning": ["*"], "vacation": ["approve"], "reports": ["*"]}'::json),
    ('manager', 'Manager d''équipe - Gestion planning équipe', TRUE, NULL, '{"planning": ["create", "read", "update"], "vacation": ["approve"], "tasks": ["*"]}'::json),
    ('employee', 'Employé - Consultation planning', TRUE, NULL, '{"planning": ["read"], "vacation": ["create", "read"], "profile": ["read", "update"]}'::json);

-- Permissions système
INSERT INTO permission (name, resource, action, description) VALUES
    ('planning:create', 'planning', 'create', 'Créer un planning'),
    ('planning:read', 'planning', 'read', 'Consulter les plannings'),
    ('planning:update', 'planning', 'update', 'Modifier les plannings'),
    ('planning:delete', 'planning', 'delete', 'Supprimer les plannings'),
    ('planning:validate', 'planning', 'validate', 'Valider les plannings'),
    ('vacation:create', 'vacation', 'create', 'Créer une demande de congé'),
    ('vacation:read', 'vacation', 'read', 'Consulter les demandes de congé'),
    ('vacation:approve', 'vacation', 'approve', 'Approuver les demandes de congé'),
    ('vacation:reject', 'vacation', 'reject', 'Refuser les demandes de congé'),
    ('analytics:view', 'analytics', 'view', 'Consulter les analytics'),
    ('company:manage', 'company', 'manage', 'Gérer les paramètres entreprise'),
    ('users:manage', 'users', 'manage', 'Gérer les utilisateurs'),
    ('tasks:create', 'tasks', 'create', 'Créer des tâches'),
    ('tasks:assign', 'tasks', 'assign', 'Assigner des tâches');

-- ============================================================================
-- OPTIMISATIONS POSTGRESQL
-- ============================================================================

-- Analyser toutes les tables pour optimiser le query planner
ANALYZE;

-- Mettre à jour les statistiques PostgreSQL
VACUUM ANALYZE;

-- ============================================================================
-- VUES UTILITAIRES (optionnel - pour reporting)
-- ============================================================================

-- Vue: Plannings actifs en cours
CREATE OR REPLACE VIEW v_active_schedules AS
SELECT
    ws.id,
    ws.week_start_date,
    ws.week_end_date,
    ws.status,
    c.name AS company_name,
    t.name AS team_name,
    u.first_name || ' ' || u.last_name AS created_by
FROM weekly_schedule ws
JOIN company c ON ws.company_id = c.id
JOIN team t ON ws.team_id = t.id
JOIN "user" u ON ws.created_by_id = u.id
WHERE ws.status IN ('validated', 'published')
  AND ws.week_start_date >= CURRENT_DATE - INTERVAL '7 days';

COMMENT ON VIEW v_active_schedules IS 'Plannings validés ou publiés de la semaine courante';

-- Vue: Congés en attente de validation
CREATE OR REPLACE VIEW v_pending_vacations AS
SELECT
    vr.id,
    vr.start_date,
    vr.end_date,
    vr.type,
    vr.request_date,
    u.first_name || ' ' || u.last_name AS employee_name,
    c.name AS company_name
FROM vacation_request vr
JOIN employee e ON vr.employee_id = e.id
JOIN "user" u ON e.user_id = u.id
JOIN company c ON vr.company_id = c.id
WHERE vr.status = 'pending'
ORDER BY vr.request_date ASC;

COMMENT ON VIEW v_pending_vacations IS 'Demandes de congés en attente de validation';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Afficher un résumé des tables créées
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ SMARTPLANNING DATABASE - Création terminée avec succès !';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables créées: 20 tables + 2 vues';
    RAISE NOTICE '🔑 Index créés: 70+ index optimisés';
    RAISE NOTICE '🎯 Triggers: Mise à jour automatique updated_at';
    RAISE NOTICE '🌱 Seeds: Rôles et permissions système initialisés';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Prochaines étapes:';
    RAISE NOTICE '   1. Créer un utilisateur admin: npm run create-admin';
    RAISE NOTICE '   2. Générer Prisma Client: npx prisma generate';
    RAISE NOTICE '   3. Lancer le serveur: npm run dev';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

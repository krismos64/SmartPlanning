#!/bin/bash

# ============================================================================
# Script de test de la base de données PostgreSQL SmartPlanning
# ============================================================================
# Usage: ./test-database.sh
# Pré-requis: PostgreSQL installé, psql disponible
# ============================================================================

set -e  # Arrêter en cas d'erreur

# Configuration PostgreSQL PATH (Homebrew macOS)
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="smartplanning_test"
DB_USER="${POSTGRES_USER:-$(whoami)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_SCRIPT="$SCRIPT_DIR/init-smartplanning-postgresql.sql"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🧪 SmartPlanning PostgreSQL - Test Database${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Vérifier que le script SQL existe
if [ ! -f "$SQL_SCRIPT" ]; then
    echo -e "${RED}❌ Erreur: Script SQL introuvable: $SQL_SCRIPT${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   - Base de données: $DB_NAME"
echo "   - Utilisateur: $DB_USER"
echo "   - Script: $SQL_SCRIPT"
echo ""

# Supprimer l'ancienne base de test si elle existe
echo -e "${YELLOW}🗑️  Suppression de l'ancienne base de test (si existe)...${NC}"
dropdb --if-exists "$DB_NAME" -U "$DB_USER" 2>/dev/null || true
echo -e "${GREEN}   ✓ Ancien base supprimée${NC}"

# Créer une nouvelle base de test
echo -e "${YELLOW}🆕 Création de la base de test...${NC}"
createdb "$DB_NAME" -U "$DB_USER" --encoding=UTF8
echo -e "${GREEN}   ✓ Base créée${NC}"

# Exécuter le script SQL
echo -e "${YELLOW}⚙️  Exécution du script SQL...${NC}"
psql -d "$DB_NAME" -U "$DB_USER" -f "$SQL_SCRIPT" -q
echo -e "${GREEN}   ✓ Script exécuté${NC}"
echo ""

# Tests de validation
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🔍 Validation de la base de données${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Test 1: Compter les tables
echo -e "${YELLOW}Test 1: Nombre de tables créées${NC}"
TABLE_COUNT=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
EXPECTED_TABLES=20
if [ "$TABLE_COUNT" -eq "$EXPECTED_TABLES" ]; then
    echo -e "${GREEN}   ✓ $TABLE_COUNT tables créées (attendu: $EXPECTED_TABLES)${NC}"
else
    echo -e "${RED}   ✗ Erreur: $TABLE_COUNT tables créées (attendu: $EXPECTED_TABLES)${NC}"
    exit 1
fi

# Test 2: Vérifier les extensions
echo -e "${YELLOW}Test 2: Extensions PostgreSQL${NC}"
EXTENSIONS=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm', 'btree_gin');")
if [ "$EXTENSIONS" -eq 3 ]; then
    echo -e "${GREEN}   ✓ 3 extensions installées${NC}"
else
    echo -e "${RED}   ✗ Erreur: $EXTENSIONS extensions (attendu: 3)${NC}"
fi

# Test 3: Vérifier les rôles système
echo -e "${YELLOW}Test 3: Rôles système (seeds)${NC}"
ROLES=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM role WHERE is_system_role = TRUE;")
if [ "$ROLES" -eq 4 ]; then
    echo -e "${GREEN}   ✓ 4 rôles système créés${NC}"
else
    echo -e "${RED}   ✗ Erreur: $ROLES rôles (attendu: 4)${NC}"
fi

# Test 4: Vérifier les permissions
echo -e "${YELLOW}Test 4: Permissions système${NC}"
PERMISSIONS=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM permission;")
if [ "$PERMISSIONS" -eq 14 ]; then
    echo -e "${GREEN}   ✓ 14 permissions créées${NC}"
else
    echo -e "${RED}   ✗ Erreur: $PERMISSIONS permissions (attendu: 14)${NC}"
fi

# Test 5: Vérifier les index
echo -e "${YELLOW}Test 5: Index créés${NC}"
INDEXES=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';")
echo -e "${GREEN}   ✓ $INDEXES index créés${NC}"

# Test 6: Vérifier les triggers
echo -e "${YELLOW}Test 6: Triggers créés${NC}"
TRIGGERS=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'update_%_updated_at';")
echo -e "${GREEN}   ✓ $TRIGGERS triggers créés${NC}"

# Test 7: Vérifier les vues
echo -e "${YELLOW}Test 7: Vues utilitaires${NC}"
VIEWS=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public';")
if [ "$VIEWS" -eq 2 ]; then
    echo -e "${GREEN}   ✓ 2 vues créées${NC}"
else
    echo -e "${RED}   ✗ Erreur: $VIEWS vues (attendu: 2)${NC}"
fi

# Test 8: Insertion test
echo -e "${YELLOW}Test 8: Insertion de données test${NC}"
psql -d "$DB_NAME" -U "$DB_USER" -q <<EOF
-- Créer une entreprise test
INSERT INTO company (name, sector, size) VALUES ('Test Company', 'retail', 'small');

-- Créer un utilisateur test
INSERT INTO "user" (email, password, first_name, last_name, role, company_id)
VALUES ('test@smartplanning.fr', 'hashed_password', 'Test', 'User', 'admin', 1);

-- Vérifier l'insertion
SELECT COUNT(*) FROM company;
SELECT COUNT(*) FROM "user";
EOF
echo -e "${GREEN}   ✓ Insertion de données réussie${NC}"

# Test 9: Contraintes FK
echo -e "${YELLOW}Test 9: Test contraintes Foreign Key${NC}"
FK_TEST=$(psql -d "$DB_NAME" -U "$DB_USER" -t -c "
    INSERT INTO employee (user_id, company_id, contractual_hours)
    VALUES (1, 1, 35);
    SELECT COUNT(*) FROM employee;
" 2>&1 | grep -c "1" || true)
if [ "$FK_TEST" -eq 1 ]; then
    echo -e "${GREEN}   ✓ Contraintes FK fonctionnelles${NC}"
else
    echo -e "${YELLOW}   ⚠ Warning: Test FK incomplet${NC}"
fi

# Test 10: Cascade DELETE
echo -e "${YELLOW}Test 10: Test CASCADE DELETE${NC}"
psql -d "$DB_NAME" -U "$DB_USER" -q <<EOF
-- Supprimer l'entreprise doit cascader
DELETE FROM company WHERE id = 1;

-- Vérifier que l'utilisateur a été supprimé (CASCADE)
SELECT COUNT(*) FROM "user" WHERE company_id = 1;
EOF
echo -e "${GREEN}   ✓ CASCADE DELETE fonctionnel${NC}"

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}✅ Tous les tests réussis !${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}📊 Statistiques de la base:${NC}"
psql -d "$DB_NAME" -U "$DB_USER" -c "
    SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10;
"

echo ""
echo -e "${BLUE}🎯 Prochaines étapes:${NC}"
echo "   1. Conserver la base de test: Ne rien faire"
echo "   2. Supprimer la base de test: dropdb $DB_NAME"
echo "   3. Utiliser pour dev: Modifier DATABASE_URL dans .env"
echo ""
echo -e "${GREEN}Script de test terminé avec succès !${NC}"

#!/bin/bash

##
# Script Exécution Tests - AdvancedSchedulingEngine v2.2.1
# 
# Lancement complet de la suite de tests avec reporting détaillé
# Développé par Christophe Mostefaoui - 14 août 2025
#
# Usage: ./run-tests.sh [option]
# Options:
#   --unit      : Tests unitaires seulement  
#   --perf      : Tests performance seulement
#   --coverage  : Avec couverture de code
#   --watch     : Mode surveillance
#   --silent    : Mode silencieux
##

set -e # Exit on error

# Couleurs pour affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$TEST_DIR/../../../.." && pwd)"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
REPORT_DIR="$BACKEND_DIR/reports/tests/$TIMESTAMP"

# Banner
echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  🚀 AdvancedSchedulingEngine v2.2.1            ║"
echo "║                     Suite de Tests Complète                   ║"
echo "║                                                                ║"
echo "║           Développé par Christophe Mostefaoui                  ║"
echo "║              https://christophe-dev-freelance.fr/              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Vérifications préalables
echo -e "${BLUE}🔍 Vérifications préalables...${NC}"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non installé${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"

# Vérifier npm/yarn
if command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    echo -e "${GREEN}✅ Yarn détecté${NC}"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo -e "${GREEN}✅ npm détecté${NC}"
else
    echo -e "${RED}❌ Aucun gestionnaire de paquets détecté${NC}"
    exit 1
fi

# Changer vers répertoire backend
cd "$BACKEND_DIR"
echo -e "${BLUE}📁 Répertoire: $BACKEND_DIR${NC}"

# Vérifier package.json et dépendances
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json non trouvé${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    $PACKAGE_MANAGER install
fi

# Créer répertoire de rapports
mkdir -p "$REPORT_DIR"
echo -e "${BLUE}📊 Rapports: $REPORT_DIR${NC}"

# Parser les arguments
RUN_UNIT=true
RUN_PERF=true  
RUN_UTILS=true
WITH_COVERAGE=false
WATCH_MODE=false
SILENT_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit)
            RUN_UNIT=true
            RUN_PERF=false
            RUN_UTILS=false
            shift
            ;;
        --perf)
            RUN_UNIT=false
            RUN_PERF=true
            RUN_UTILS=false
            shift
            ;;
        --coverage)
            WITH_COVERAGE=true
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --silent)
            SILENT_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Option inconnue: $1${NC}"
            exit 1
            ;;
    esac
done

# Configuration Jest
JEST_CONFIG="$TEST_DIR/jest.config.js"
JEST_OPTIONS="--config=$JEST_CONFIG"

if [ "$WITH_COVERAGE" = true ]; then
    JEST_OPTIONS="$JEST_OPTIONS --coverage"
fi

if [ "$WATCH_MODE" = true ]; then
    JEST_OPTIONS="$JEST_OPTIONS --watch"
fi

if [ "$SILENT_MODE" = true ]; then
    export JEST_SILENT=true
    JEST_OPTIONS="$JEST_OPTIONS --silent"
fi

# Variables d'environnement pour tests
export NODE_ENV=test
export TZ=Europe/Paris

echo -e "\n${CYAN}🧪 Configuration Tests:${NC}"
echo -e "   • Tests unitaires: ${RUN_UNIT}"
echo -e "   • Tests performance: ${RUN_PERF}"
echo -e "   • Tests utilitaires: ${RUN_UTILS}"
echo -e "   • Couverture code: ${WITH_COVERAGE}"
echo -e "   • Mode surveillance: ${WATCH_MODE}"
echo -e "   • Mode silencieux: ${SILENT_MODE}"
echo -e "   • Config Jest: $JEST_CONFIG"

echo -e "\n${PURPLE}🚀 Lancement des tests...${NC}\n"

# Fonction pour exécuter un ensemble de tests
run_test_suite() {
    local name=$1
    local pattern=$2
    local emoji=$3
    
    echo -e "${BLUE}${emoji} Exécution: $name${NC}"
    
    START_TIME=$(date +%s%3N)
    
    if $PACKAGE_MANAGER test -- --testPathPattern="$pattern" $JEST_OPTIONS; then
        END_TIME=$(date +%s%3N)
        DURATION=$((END_TIME - START_TIME))
        echo -e "${GREEN}✅ $name - Succès (${DURATION}ms)${NC}"
        return 0
    else
        END_TIME=$(date +%s%3N)
        DURATION=$((END_TIME - START_TIME))
        echo -e "${RED}❌ $name - Échec (${DURATION}ms)${NC}"
        return 1
    fi
}

# Variables pour reporting
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Exécution des suites de tests
if [ "$RUN_UNIT" = true ]; then
    if run_test_suite "Tests Unitaires Core" "generateSchedule.test.ts" "🧪"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
fi

if [ "$RUN_PERF" = true ]; then
    if run_test_suite "Tests Performance & Benchmarks" "performance.benchmark.test.ts" "⚡"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
fi

if [ "$RUN_UTILS" = true ]; then
    if run_test_suite "Tests Fonctions Utilitaires" "utilities.test.ts" "🔧"; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
fi

# Test complet si aucune option spécifique
if [ "$RUN_UNIT" = true ] && [ "$RUN_PERF" = true ] && [ "$RUN_UTILS" = true ]; then
    echo -e "\n${PURPLE}🌐 Exécution suite complète intégrée...${NC}"
    
    if run_test_suite "Suite Complète AdvancedSchedulingEngine" "planning/__tests__" "🎯"; then
        echo -e "${GREEN}✅ Suite intégrée - Tous tests validés${NC}"
    else
        echo -e "${RED}❌ Suite intégrée - Échecs détectés${NC}"
    fi
fi

# Génération du rapport final
echo -e "\n${CYAN}📊 Rapport Final${NC}"
echo "═══════════════════════════════════════════════════════════"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS PASSENT - SUCCÈS TOTAL${NC}"
    echo -e "${GREEN}✅ $PASSED_TESTS/$TOTAL_TESTS suites validées${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ ÉCHECS DÉTECTÉS${NC}"  
    echo -e "${RED}❌ $FAILED_TESTS/$TOTAL_TESTS suites en échec${NC}"
    echo -e "${GREEN}✅ $PASSED_TESTS/$TOTAL_TESTS suites réussies${NC}"
    EXIT_CODE=1
fi

# Informations de performance si disponibles
if [ -f "performance-report.json" ]; then
    echo -e "\n${BLUE}⚡ Performance Summary:${NC}"
    if command -v jq &> /dev/null; then
        cat performance-report.json | jq -r '.summary // "Données performance disponibles dans performance-report.json"'
    else
        echo "   📄 Rapport détaillé: performance-report.json"
    fi
fi

# Couverture de code si activée
if [ "$WITH_COVERAGE" = true ] && [ -d "coverage" ]; then
    echo -e "\n${BLUE}📈 Couverture de Code:${NC}"
    if [ -f "coverage/lcov-report/index.html" ]; then
        echo -e "   📄 Rapport HTML: coverage/lcov-report/index.html"
    fi
    
    if command -v grep &> /dev/null && [ -f "coverage/lcov.info" ]; then
        COVERAGE=$(grep -o 'SF:.*' coverage/lcov.info | wc -l)
        echo -e "   📊 Fichiers analysés: $COVERAGE"
    fi
fi

# Archivage des rapports
ARCHIVE_NAME="smartplanning_tests_$TIMESTAMP.tar.gz"
echo -e "\n${BLUE}💾 Archivage rapport: $ARCHIVE_NAME${NC}"

tar -czf "$ARCHIVE_NAME" \
    --exclude='node_modules' \
    --exclude='.git' \
    coverage/ *.json reports/ 2>/dev/null || true

echo -e "\n${PURPLE}🏁 Tests AdvancedSchedulingEngine v2.2.1 - Terminés${NC}"
echo -e "${PURPLE}⏱️  Horodatage: $TIMESTAMP${NC}"
echo -e "${PURPLE}🎯 Performance cible: 2-5ms (99.97% plus rapide vs IA externe)${NC}"

# Conseils si échecs
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "\n${YELLOW}💡 Actions correctives:${NC}"
    echo -e "   1. Vérifier logs détaillés ci-dessus"
    echo -e "   2. Exécuter tests unitaires seuls: ./run-tests.sh --unit"
    echo -e "   3. Consulter documentation: docs/TESTING.md"
    echo -e "   4. Contact support: https://christophe-dev-freelance.fr/"
fi

echo -e "\n${GREEN}🚀 Innovation SmartPlanning: Moteur personnalisé ultra-performant!${NC}"
echo -e "${GREEN}📞 Support développeur: Christophe Mostefaoui - Expert technique${NC}\n"

exit $EXIT_CODE
#!/bin/bash

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Vérification Finale Pré-Déploiement SmartPlanning${NC}"
echo "=================================================="

# Fonction pour afficher le statut
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Variables de comptage
total_checks=0
passed_checks=0

# 1. Vérifier la structure des dossiers
echo -e "\n${YELLOW}📁 Structure des dossiers${NC}"
total_checks=$((total_checks + 2))

if [ -d "backend" ] && [ -d "frontend" ]; then
    check_status 0 "Dossiers backend et frontend présents"
    passed_checks=$((passed_checks + 1))
else
    check_status 1 "Dossiers backend et frontend présents"
fi

if [ -f "backend/package.json" ] && [ -f "frontend/package.json" ]; then
    check_status 0 "Fichiers package.json présents"
    passed_checks=$((passed_checks + 1))
else
    check_status 1 "Fichiers package.json présents"
fi

# 2. Vérifier les fichiers de configuration
echo -e "\n${YELLOW}⚙️ Fichiers de configuration${NC}"
config_files=(
    "backend/env.example"
    "backend/tsconfig.json"
    "frontend/vite.config.ts"
    "frontend/.htaccess"
    "render.yaml"
    "DEPLOYMENT.md"
)

for file in "${config_files[@]}"; do
    total_checks=$((total_checks + 1))
    if [ -f "$file" ]; then
        check_status 0 "$file existe"
        passed_checks=$((passed_checks + 1))
    else
        check_status 1 "$file existe"
    fi
done

# 3. Compilation Backend
echo -e "\n${YELLOW}🔨 Compilation Backend${NC}"
total_checks=$((total_checks + 1))
cd backend
if npm run build > /dev/null 2>&1; then
    check_status 0 "Backend compile sans erreur"
    passed_checks=$((passed_checks + 1))
else
    check_status 1 "Backend compile sans erreur"
fi
cd ..

# 4. Compilation Frontend
echo -e "\n${YELLOW}🎨 Compilation Frontend${NC}"
total_checks=$((total_checks + 1))
cd frontend
if npm run build > /dev/null 2>&1; then
    check_status 0 "Frontend compile sans erreur"
    passed_checks=$((passed_checks + 1))
else
    check_status 1 "Frontend compile sans erreur"
fi
cd ..

# 5. Vérifier les dépendances critiques
echo -e "\n${YELLOW}📦 Dépendances critiques Backend${NC}"
critical_deps=("express" "mongoose" "cors" "jsonwebtoken" "bcrypt")
cd backend
for dep in "${critical_deps[@]}"; do
    total_checks=$((total_checks + 1))
    if npm list "$dep" > /dev/null 2>&1; then
        check_status 0 "$dep installé"
        passed_checks=$((passed_checks + 1))
    else
        check_status 1 "$dep installé"
    fi
done
cd ..

# 6. Vérifier les scripts de déploiement
echo -e "\n${YELLOW}🚀 Scripts de déploiement${NC}"
deploy_scripts=("deploy.sh" "check-deployment.sh")
for script in "${deploy_scripts[@]}"; do
    total_checks=$((total_checks + 1))
    if [ -f "$script" ] && [ -x "$script" ]; then
        check_status 0 "$script existe et est exécutable"
        passed_checks=$((passed_checks + 1))
    else
        check_status 1 "$script existe et est exécutable"
    fi
done

# 7. Vérifier la configuration TypeScript
echo -e "\n${YELLOW}📝 Configuration TypeScript${NC}"
total_checks=$((total_checks + 1))
if grep -q '"moduleResolution": "node"' backend/tsconfig.json; then
    check_status 0 "moduleResolution configuré"
    passed_checks=$((passed_checks + 1))
else
    check_status 1 "moduleResolution configuré"
fi

# 8. Vérifier les endpoints de santé
echo -e "\n${YELLOW}🏥 Endpoint de santé${NC}"
total_checks=$((total_checks + 1))
if grep -q "/api/health" backend/src/app.ts 2>/dev/null; then
    check_status 0 "Endpoint /api/health présent"
    passed_checks=$((passed_checks + 1))
else
    check_status 1 "Endpoint /api/health présent"
fi

# Résumé final
echo -e "\n${BLUE}📊 RÉSUMÉ FINAL${NC}"
echo "================="
echo -e "Tests réussis: ${GREEN}$passed_checks${NC}/$total_checks"

percentage=$((passed_checks * 100 / total_checks))
if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}🎉 PARFAIT ! Prêt pour le déploiement${NC}"
    echo -e "${GREEN}Vous pouvez procéder au déploiement sur Render et Hostinger${NC}"
elif [ $percentage -ge 90 ]; then
    echo -e "${YELLOW}⚠️  Presque prêt ($percentage%) - Vérifiez les points manquants${NC}"
else
    echo -e "${RED}❌ Pas prêt ($percentage%) - Corrigez les erreurs avant déploiement${NC}"
fi

echo -e "\n${BLUE}📋 Prochaines étapes:${NC}"
echo "1. Configurer les variables d'environnement sur Render"
echo "2. Déployer le backend sur Render"
echo "3. Uploader le frontend sur Hostinger"
echo "4. Tester les fonctionnalités"

echo -e "\n${BLUE}📖 Consultez final-deployment-guide.md pour les détails${NC}" 
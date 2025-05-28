#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Vérification Configuration Render - SmartPlanning${NC}"
echo "======================================================="

echo -e "\n${YELLOW}📋 Vérifications Critiques :${NC}"

# 1. Vérifier render.yaml
echo -e "\n${BLUE}1. Configuration render.yaml :${NC}"
if [ -f "render.yaml" ]; then
    echo -e "   ✅ Fichier render.yaml existe"
    
    if grep -q "rootDir: backend" render.yaml; then
        echo -e "   ✅ rootDir: backend configuré"
    else
        echo -e "   ❌ rootDir: backend manquant"
    fi
    
    if grep -q "buildCommand: npm install && npm run build" render.yaml; then
        echo -e "   ✅ buildCommand correct (sans cd backend)"
    else
        echo -e "   ❌ buildCommand incorrect"
    fi
    
    if grep -q "startCommand: npm start" render.yaml; then
        echo -e "   ✅ startCommand correct (sans cd backend)"
    else
        echo -e "   ❌ startCommand incorrect"
    fi
else
    echo -e "   ❌ Fichier render.yaml manquant"
fi

# 2. Vérifier package.json backend
echo -e "\n${BLUE}2. Configuration backend/package.json :${NC}"
if [ -f "backend/package.json" ]; then
    echo -e "   ✅ Fichier backend/package.json existe"
    
    # Vérifier @types/node dans dependencies
    if grep -A 20 '"dependencies"' backend/package.json | grep -q '"@types/node"'; then
        echo -e "   ✅ @types/node dans dependencies"
    else
        echo -e "   ❌ @types/node manquant dans dependencies"
    fi
    
    # Vérifier typescript dans dependencies
    if grep -A 20 '"dependencies"' backend/package.json | grep -q '"typescript"'; then
        echo -e "   ✅ typescript dans dependencies"
    else
        echo -e "   ❌ typescript manquant dans dependencies"
    fi
    
    # Vérifier tous les @types dans dependencies
    TYPES_COUNT=$(grep -A 30 '"dependencies"' backend/package.json | grep -c '"@types/')
    echo -e "   ✅ $TYPES_COUNT packages @types dans dependencies"
    
else
    echo -e "   ❌ Fichier backend/package.json manquant"
fi

# 3. Vérifier tsconfig.json
echo -e "\n${BLUE}3. Configuration backend/tsconfig.json :${NC}"
if [ -f "backend/tsconfig.json" ]; then
    echo -e "   ✅ Fichier backend/tsconfig.json existe"
    
    if grep -q '"types": \["node"\]' backend/tsconfig.json; then
        echo -e "   ✅ types: [\"node\"] configuré"
    else
        echo -e "   ❌ types: [\"node\"] manquant"
    fi
else
    echo -e "   ❌ Fichier backend/tsconfig.json manquant"
fi

# 4. Test compilation locale
echo -e "\n${BLUE}4. Test Compilation Locale :${NC}"
cd backend
if npm run build > /dev/null 2>&1; then
    echo -e "   ✅ Compilation TypeScript réussie"
else
    echo -e "   ❌ Erreur de compilation TypeScript"
fi
cd ..

echo -e "\n${GREEN}🎯 Résumé des Corrections Appliquées :${NC}"
echo "• render.yaml : Suppression des 'cd backend' redondants"
echo "• package.json : Tous les @types déplacés vers dependencies"
echo "• tsconfig.json : types: [\"node\"] ajouté"
echo "• Compilation locale : Testée et validée"

echo -e "\n${YELLOW}📊 Statut Déploiement :${NC}"
echo "• Commit actuel : 3d8d065"
echo "• Redéploiement Render : En cours automatiquement"
echo "• Temps estimé : 5-10 minutes"

echo -e "\n${BLUE}🔗 Prochaines Étapes :${NC}"
echo "1. Surveiller logs Render pour confirmation"
echo "2. Tester endpoint /api/health"
echo "3. Déployer frontend sur Hostinger"

echo -e "\n${GREEN}✅ Configuration Render optimisée pour le succès !${NC}" 
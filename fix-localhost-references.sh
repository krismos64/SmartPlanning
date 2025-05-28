#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Correction des références localhost - SmartPlanning${NC}"
echo "============================================================"

# URL de production
PROD_URL="https://smartplanning.onrender.com/api"

echo -e "\n${YELLOW}📋 Recherche et correction des références localhost...${NC}"

# Fonction pour remplacer localhost dans un fichier
fix_file() {
    local file="$1"
    local backup="${file}.backup"
    
    if grep -q "localhost:5050" "$file"; then
        echo -e "   🔧 Correction de $file"
        
        # Créer une sauvegarde
        cp "$file" "$backup"
        
        # Remplacer localhost par l'URL de production dans les fallbacks
        sed -i '' 's|"http://localhost:5050/api"|"'$PROD_URL'"|g' "$file"
        sed -i '' "s|'http://localhost:5050/api'|'$PROD_URL'|g" "$file"
        sed -i '' 's|http://localhost:5050/api|'$PROD_URL'|g' "$file"
        
        echo -e "   ✅ $file corrigé (sauvegarde: $backup)"
        return 0
    else
        echo -e "   ℹ️  $file - Pas de localhost trouvé"
        return 1
    fi
}

# Rechercher et corriger tous les fichiers TypeScript/JavaScript
echo -e "\n${BLUE}1. Correction des fichiers source...${NC}"

FIXED_COUNT=0

# Frontend
find frontend/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    if fix_file "$file"; then
        ((FIXED_COUNT++))
    fi
done

# Vérifier les fichiers de configuration
CONFIG_FILES=(
    "frontend/vite.config.ts"
    "frontend/src/services/api.ts"
    "frontend/src/api/axiosInstance.ts"
    "frontend/src/context/AuthContext.tsx"
    "frontend/src/components/layout/LayoutWithSidebar.tsx"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        fix_file "$file"
    fi
done

echo -e "\n${BLUE}2. Mise à jour des variables d'environnement...${NC}"

# S'assurer que les fichiers .env sont corrects
cd frontend

echo "VITE_API_URL=$PROD_URL" > .env
echo "VITE_APP_NAME=SmartPlanning" >> .env
echo "VITE_APP_VERSION=1.0.0" >> .env
echo -e "   ✅ .env mis à jour"

echo "VITE_API_URL=$PROD_URL" > .env.production
echo "VITE_APP_NAME=SmartPlanning" >> .env.production
echo "VITE_APP_VERSION=1.0.0" >> .env.production
echo -e "   ✅ .env.production mis à jour"

echo -e "\n${BLUE}3. Nettoyage et rebuild complet...${NC}"

# Nettoyer complètement
rm -rf node_modules/.vite
rm -rf dist
echo -e "   ✅ Cache Vite nettoyé"

# Rebuild avec variables forcées
echo -e "   🔄 Rebuild en cours..."
VITE_API_URL="$PROD_URL" NODE_ENV=production npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "   ✅ Build réussi"
else
    echo -e "   ❌ Erreur lors du build"
    exit 1
fi

# Copier les images
cp -r public/images dist/ 2>/dev/null || true
echo -e "   ✅ Images copiées"

echo -e "\n${BLUE}4. Vérification du build final...${NC}"

# Vérifier qu'il n'y a plus de localhost dans le build
cd dist/assets
LOCALHOST_COUNT=$(grep -r "localhost:5050" *.js 2>/dev/null | wc -l)

if [ "$LOCALHOST_COUNT" -eq 0 ]; then
    echo -e "   ✅ Aucune référence localhost dans le build"
else
    echo -e "   ⚠️  $LOCALHOST_COUNT références localhost trouvées"
    grep -r "localhost:5050" *.js | head -3
fi

# Vérifier que l'URL de production est présente
PROD_COUNT=$(grep -r "smartplanning\.onrender\.com" *.js 2>/dev/null | wc -l)
echo -e "   ✅ $PROD_COUNT références à l'URL de production trouvées"

cd ../..

echo -e "\n${BLUE}5. Préparation du déploiement...${NC}"

# Créer le ZIP pour Hostinger
cd dist
zip -r ../smartplanning-frontend-fixed.zip . > /dev/null 2>&1
cd ..

DIST_SIZE=$(du -sh dist | cut -f1)
ZIP_SIZE=$(du -sh smartplanning-frontend-fixed.zip | cut -f1)

echo -e "   📦 Build: $DIST_SIZE"
echo -e "   📦 ZIP: $ZIP_SIZE"
echo -e "   ✅ smartplanning-frontend-fixed.zip créé"

echo -e "\n${GREEN}🎯 Résumé des corrections :${NC}"
echo -e "• Toutes les références localhost corrigées"
echo -e "• Variables d'environnement mises à jour"
echo -e "• Build propre généré"
echo -e "• ZIP prêt pour Hostinger"

echo -e "\n${YELLOW}📤 Prochaines étapes :${NC}"
echo -e "1. Upload smartplanning-frontend-fixed.zip sur Hostinger"
echo -e "2. Extraire dans public_html/"
echo -e "3. Supprimer l'ancien contenu avant extraction"
echo -e "4. Tester https://smartplanning.fr"

echo -e "\n${GREEN}✅ Correction terminée !${NC}" 
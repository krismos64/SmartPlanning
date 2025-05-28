#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Vérification du build SmartPlanning${NC}"
echo "=============================================="

# Vérifier que le build existe
if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}❌ Dossier dist/ non trouvé${NC}"
    exit 1
fi

cd frontend/dist

echo -e "\n${YELLOW}📦 Contenu du build :${NC}"
ls -la

echo -e "\n${YELLOW}🔍 Vérification des références localhost :${NC}"
LOCALHOST_COUNT=$(find . -name "*.js" -exec grep -l "localhost:5050" {} \; 2>/dev/null | wc -l)

if [ "$LOCALHOST_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune référence localhost trouvée${NC}"
else
    echo -e "${RED}❌ $LOCALHOST_COUNT fichiers contiennent encore localhost${NC}"
    find . -name "*.js" -exec grep -l "localhost:5050" {} \; 2>/dev/null
    exit 1
fi

echo -e "\n${YELLOW}🔍 Vérification des références production :${NC}"
PROD_COUNT=$(find . -name "*.js" -exec grep -l "smartplanning\.onrender\.com" {} \; 2>/dev/null | wc -l)

if [ "$PROD_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ $PROD_COUNT fichiers contiennent l'URL de production${NC}"
else
    echo -e "${RED}❌ Aucune référence à l'URL de production trouvée${NC}"
    exit 1
fi

echo -e "\n${YELLOW}📁 Vérification des fichiers essentiels :${NC}"

# Vérifier index.html
if [ -f "index.html" ]; then
    echo -e "${GREEN}✅ index.html présent${NC}"
else
    echo -e "${RED}❌ index.html manquant${NC}"
    exit 1
fi

# Vérifier dossier assets
if [ -d "assets" ]; then
    ASSETS_COUNT=$(ls assets/*.js 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Dossier assets/ présent ($ASSETS_COUNT fichiers JS)${NC}"
else
    echo -e "${RED}❌ Dossier assets/ manquant${NC}"
    exit 1
fi

# Vérifier dossier images
if [ -d "images" ]; then
    IMAGES_COUNT=$(ls images/ 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Dossier images/ présent ($IMAGES_COUNT images)${NC}"
else
    echo -e "${YELLOW}⚠️  Dossier images/ manquant${NC}"
fi

echo -e "\n${YELLOW}📊 Taille du build :${NC}"
BUILD_SIZE=$(du -sh . | cut -f1)
echo -e "${BLUE}📦 Taille totale : $BUILD_SIZE${NC}"

# Vérifier le ZIP
cd ..
if [ -f "smartplanning-frontend-FIXED.zip" ]; then
    ZIP_SIZE=$(du -sh smartplanning-frontend-FIXED.zip | cut -f1)
    echo -e "${GREEN}✅ ZIP de déploiement : $ZIP_SIZE${NC}"
else
    echo -e "${YELLOW}⚠️  ZIP de déploiement non trouvé${NC}"
    echo -e "${BLUE}Création du ZIP...${NC}"
    cd dist
    zip -r ../smartplanning-frontend-FIXED.zip . > /dev/null 2>&1
    cd ..
    ZIP_SIZE=$(du -sh smartplanning-frontend-FIXED.zip | cut -f1)
    echo -e "${GREEN}✅ ZIP créé : $ZIP_SIZE${NC}"
fi

echo -e "\n${GREEN}🎯 RÉSUMÉ DE LA VÉRIFICATION :${NC}"
echo -e "• ✅ Build présent et complet"
echo -e "• ✅ 0 référence localhost"
echo -e "• ✅ Références production OK"
echo -e "• ✅ Fichiers essentiels présents"
echo -e "• ✅ ZIP de déploiement prêt"

echo -e "\n${BLUE}📤 PRÊT POUR DÉPLOIEMENT !${NC}"
echo -e "${YELLOW}Fichier à uploader : frontend/smartplanning-frontend-FIXED.zip${NC}"
echo -e "${YELLOW}Destination : public_html/ sur Hostinger${NC}"

echo -e "\n${GREEN}✅ Vérification terminée avec succès !${NC}" 
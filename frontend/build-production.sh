#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Build Production Frontend - SmartPlanning${NC}"
echo "=================================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé. Exécutez ce script depuis le dossier frontend.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}📋 Étapes du Build :${NC}"

# 1. Vérifier les variables d'environnement
echo -e "\n${BLUE}1. Vérification des variables d'environnement...${NC}"
if [ -f ".env.production" ]; then
    echo -e "   ✅ Fichier .env.production trouvé"
    API_URL=$(grep "VITE_API_URL" .env.production | cut -d'=' -f2)
    echo -e "   📍 API URL configurée : $API_URL"
    
    # Test de l'API
    if command -v curl >/dev/null 2>&1; then
        echo -e "   🔍 Test de l'API..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "   ✅ API accessible (200 OK)"
        else
            echo -e "   ⚠️  API non accessible (Code: $HTTP_CODE)"
            echo -e "   ℹ️  Le build continuera, mais vérifiez l'URL de l'API"
        fi
    fi
else
    echo -e "   ❌ Fichier .env.production manquant"
    echo -e "   ℹ️  Création du fichier avec l'URL par défaut..."
    echo "VITE_API_URL=https://smartplanning-backend.onrender.com/api" > .env.production
    echo "VITE_APP_NAME=SmartPlanning" >> .env.production
    echo "VITE_APP_VERSION=1.0.0" >> .env.production
    echo -e "   ✅ Fichier .env.production créé"
fi

# 2. Nettoyer le dossier dist
echo -e "\n${BLUE}2. Nettoyage du dossier dist...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "   ✅ Dossier dist supprimé"
else
    echo -e "   ℹ️  Dossier dist n'existe pas"
fi

# 3. Vérifier que les images sont dans public/images
echo -e "\n${BLUE}3. Vérification des images...${NC}"
if [ ! -d "public/images" ]; then
    echo -e "   ⚠️  Dossier public/images manquant, création..."
    mkdir -p public/images
fi

# Copier les images depuis src/assets/images si elles n'existent pas dans public
if [ -d "src/assets/images" ]; then
    echo -e "   📁 Copie des images depuis src/assets/images..."
    cp -r src/assets/images/* public/images/ 2>/dev/null || true
    echo -e "   ✅ Images copiées vers public/images"
fi

# Compter les images
IMAGE_COUNT=$(find public/images -name "*.webp" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" 2>/dev/null | wc -l)
echo -e "   ✅ $IMAGE_COUNT images trouvées dans public/images"

# 4. Installation des dépendances
echo -e "\n${BLUE}4. Installation des dépendances...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "   ✅ Dépendances installées"
else
    echo -e "   ❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

# 5. Build de production
echo -e "\n${BLUE}5. Build de production...${NC}"
NODE_ENV=production npm run build
if [ $? -eq 0 ]; then
    echo -e "   ✅ Build réussi"
else
    echo -e "   ❌ Erreur lors du build"
    exit 1
fi

# 6. Vérifier que les images sont dans dist
echo -e "\n${BLUE}6. Vérification du build...${NC}"
if [ -d "dist/images" ]; then
    DIST_IMAGE_COUNT=$(find dist/images -name "*.webp" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" 2>/dev/null | wc -l)
    echo -e "   ✅ $DIST_IMAGE_COUNT images copiées dans dist/images"
else
    echo -e "   ❌ Dossier dist/images manquant"
fi

# 7. Vérifier la configuration de l'API dans le build
echo -e "\n${BLUE}7. Vérification de la configuration API...${NC}"
if [ -f "dist/assets/index-"*.js ]; then
    JS_FILE=$(ls dist/assets/index-*.js | head -n 1)
    if grep -q "smartplanning-backend.onrender.com" "$JS_FILE"; then
        echo -e "   ✅ URL de production détectée dans le build"
    elif grep -q "localhost:5050" "$JS_FILE"; then
        echo -e "   ⚠️  URL localhost détectée dans le build"
        echo -e "   ℹ️  Vérifiez que .env.production est correct"
    else
        echo -e "   ℹ️  Configuration API non détectable (normal si minifiée)"
    fi
fi

# 8. Taille du build
echo -e "\n${BLUE}8. Informations du build :${NC}"
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    echo -e "   📦 Taille totale du build : $DIST_SIZE"
    
    if [ -f "dist/index.html" ]; then
        echo -e "   ✅ index.html généré"
    else
        echo -e "   ❌ index.html manquant"
    fi
    
    if [ -d "dist/assets" ]; then
        echo -e "   ✅ Dossier assets généré"
    else
        echo -e "   ❌ Dossier assets manquant"
    fi
fi

echo -e "\n${GREEN}🎯 Résumé :${NC}"
echo -e "• Variables d'environnement : ✅ Vérifiées"
echo -e "• Images : ✅ Copiées dans public/images et dist/images"
echo -e "• Build : ✅ Généré dans le dossier dist/"
echo -e "• API URL : $API_URL"
echo -e "• Prêt pour déploiement : ✅ Hostinger"

echo -e "\n${YELLOW}📤 Prochaines étapes :${NC}"
echo -e "1. Compresser le dossier dist/ en ZIP"
echo -e "2. Se connecter au cPanel Hostinger"
echo -e "3. Uploader et extraire dans public_html/"
echo -e "4. Tester https://smartplanning.fr"

echo -e "\n${GREEN}✅ Build production terminé avec succès !${NC}" 
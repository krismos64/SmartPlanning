#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Test de Déploiement SmartPlanning${NC}"
echo "======================================="

# Variables (à modifier selon votre déploiement)
BACKEND_URL="https://smartplanning-backend.onrender.com"  # Remplacez par votre URL Render
FRONTEND_URL="https://smartplanning.fr"

echo -e "\n${YELLOW}🔍 Test Backend${NC}"
echo "URL: $BACKEND_URL"

# Test health check
echo -e "\n1. Health Check..."
if curl -s "$BACKEND_URL/api/health" | grep -q "OK"; then
    echo -e "${GREEN}✅ Backend health check OK${NC}"
else
    echo -e "${RED}❌ Backend health check FAILED${NC}"
    echo "Vérifiez les logs Render et les variables d'environnement"
fi

# Test route principale
echo -e "\n2. Route principale..."
if curl -s "$BACKEND_URL/" | grep -q "SmartPlanning API"; then
    echo -e "${GREEN}✅ Route principale OK${NC}"
else
    echo -e "${RED}❌ Route principale FAILED${NC}"
fi

echo -e "\n${YELLOW}🌐 Test Frontend${NC}"
echo "URL: $FRONTEND_URL"

# Test frontend
echo -e "\n3. Frontend accessible..."
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${RED}❌ Frontend non accessible${NC}"
    echo "Vérifiez que les fichiers sont uploadés sur Hostinger"
fi

echo -e "\n${YELLOW}📊 Résumé des Tests${NC}"
echo "===================="
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo -e "${BLUE}📋 Prochaines vérifications manuelles :${NC}"
echo "1. Ouvrir $FRONTEND_URL dans le navigateur"
echo "2. Tester l'inscription/connexion"
echo "3. Vérifier les appels API dans DevTools"
echo "4. Tester les fonctionnalités principales"

echo -e "\n${GREEN}🚀 Déploiement en cours - Surveillez les logs Render !${NC}" 
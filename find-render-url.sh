#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Recherche de l'URL Render - SmartPlanning${NC}"
echo "=================================================="

echo -e "\n${YELLOW}📋 URLs possibles à tester :${NC}"

# Liste des URLs possibles
POSSIBLE_URLS=(
    "https://smartplanning-backend.onrender.com"
    "https://smartplanning-backend-latest.onrender.com"
    "https://smartplanning-backend-main.onrender.com"
    "https://smartplanning.onrender.com"
    "https://smartplanning-api.onrender.com"
    "https://smartplanning-server.onrender.com"
)

echo -e "\n${BLUE}🧪 Test des URLs possibles :${NC}"

WORKING_URL=""

for url in "${POSSIBLE_URLS[@]}"; do
    echo -e "\n${YELLOW}Testing: $url${NC}"
    
    # Test de l'endpoint de santé
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url/api/health" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "   ✅ $url/api/health - ACCESSIBLE (200 OK)"
        WORKING_URL="$url"
        break
    elif [ "$HTTP_CODE" = "404" ]; then
        echo -e "   ❌ $url/api/health - 404 Not Found"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "   ❌ $url - Inaccessible"
    else
        echo -e "   ⚠️  $url/api/health - Code: $HTTP_CODE"
    fi
done

if [ ! -z "$WORKING_URL" ]; then
    echo -e "\n${GREEN}🎯 URL Trouvée !${NC}"
    echo -e "URL de votre backend : ${GREEN}$WORKING_URL${NC}"
    
    # Test de quelques endpoints
    echo -e "\n${BLUE}🧪 Test des endpoints principaux :${NC}"
    
    # Test /api/health
    HEALTH_RESPONSE=$(curl -s "$WORKING_URL/api/health" 2>/dev/null)
    if [ ! -z "$HEALTH_RESPONSE" ]; then
        echo -e "   ✅ /api/health : $HEALTH_RESPONSE"
    fi
    
    # Test /api/auth/google
    GOOGLE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKING_URL/api/auth/google" 2>/dev/null || echo "000")
    if [ "$GOOGLE_CODE" = "302" ]; then
        echo -e "   ✅ /api/auth/google : Redirection OK (302)"
    else
        echo -e "   ⚠️  /api/auth/google : Code $GOOGLE_CODE"
    fi
    
    # Test /api/upload/public
    UPLOAD_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKING_URL/api/upload/public" 2>/dev/null || echo "000")
    echo -e "   ℹ️  /api/upload/public : Code $UPLOAD_CODE (normal sans POST)"
    
    echo -e "\n${GREEN}📝 Actions à faire :${NC}"
    echo -e "1. Mettre à jour frontend/.env.production :"
    echo -e "   ${YELLOW}VITE_API_URL=$WORKING_URL/api${NC}"
    echo -e ""
    echo -e "2. Rebuild le frontend :"
    echo -e "   ${YELLOW}cd frontend && ./build-production.sh${NC}"
    echo -e ""
    echo -e "3. Redéployer sur Hostinger"
    
    # Proposer de mettre à jour automatiquement
    echo -e "\n${BLUE}🤖 Mise à jour automatique ?${NC}"
    read -p "Voulez-vous mettre à jour .env.production automatiquement ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd frontend
        echo "VITE_API_URL=$WORKING_URL/api" > .env.production
        echo "VITE_APP_NAME=SmartPlanning" >> .env.production
        echo "VITE_APP_VERSION=1.0.0" >> .env.production
        echo -e "   ✅ Fichier .env.production mis à jour"
        echo -e "   ℹ️  Lancez maintenant : ${YELLOW}cd frontend && ./build-production.sh${NC}"
    fi
    
else
    echo -e "\n${RED}❌ Aucune URL accessible trouvée${NC}"
    echo -e "\n${YELLOW}📝 Actions à faire :${NC}"
    echo -e "1. Vérifier sur render.com :"
    echo -e "   - Votre service est-il déployé ?"
    echo -e "   - Quelle est l'URL exacte ?"
    echo -e "   - Y a-t-il des erreurs dans les logs ?"
    echo -e ""
    echo -e "2. URLs possibles non testées :"
    echo -e "   - Votre service peut avoir un nom différent"
    echo -e "   - Vérifiez l'onglet 'Settings' de votre service"
    echo -e ""
    echo -e "3. Test manuel :"
    echo -e "   ${YELLOW}curl https://VOTRE-URL.onrender.com/api/health${NC}"
fi

echo -e "\n${BLUE}💡 Conseils :${NC}"
echo -e "• L'URL Render est visible dans votre dashboard"
echo -e "• Format typique : https://nom-service-XXXX.onrender.com"
echo -e "• Le service doit être en état 'Live'"
echo -e "• Vérifiez les logs pour les erreurs de déploiement"

echo -e "\n${GREEN}✅ Recherche terminée !${NC}" 
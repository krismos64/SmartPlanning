#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Vérification Configuration OAuth Google - SmartPlanning${NC}"
echo "=================================================================="

# URL du backend (à adapter selon votre déploiement)
BACKEND_URL="https://smartplanning-backend.onrender.com"
FRONTEND_URL="https://smartplanning.fr"

echo -e "\n${YELLOW}📋 Tests de Configuration OAuth :${NC}"

# 1. Test endpoint de santé
echo -e "\n${BLUE}1. Test endpoint de santé...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response "$BACKEND_URL/api/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "   ✅ Backend accessible (200 OK)"
    cat /tmp/health_response | jq . 2>/dev/null || cat /tmp/health_response
else
    echo -e "   ❌ Backend inaccessible (Code: $HEALTH_RESPONSE)"
fi

# 2. Test redirection OAuth Google
echo -e "\n${BLUE}2. Test redirection OAuth Google...${NC}"
OAUTH_RESPONSE=$(curl -s -I "$BACKEND_URL/api/auth/google" | head -n 1)
if echo "$OAUTH_RESPONSE" | grep -q "302"; then
    echo -e "   ✅ Redirection OAuth configurée (302 Found)"
else
    echo -e "   ❌ Problème redirection OAuth"
    echo "   Response: $OAUTH_RESPONSE"
fi

# 3. Vérifier l'URL de redirection
echo -e "\n${BLUE}3. Vérification URL de callback...${NC}"
LOCATION_HEADER=$(curl -s -I "$BACKEND_URL/api/auth/google" | grep -i "location:")
if echo "$LOCATION_HEADER" | grep -q "accounts.google.com"; then
    echo -e "   ✅ Redirection vers Google OAuth détectée"
    
    # Extraire et vérifier l'URL de callback
    CALLBACK_URL=$(echo "$LOCATION_HEADER" | grep -o 'redirect_uri=[^&]*' | cut -d'=' -f2 | sed 's/%3A/:/g' | sed 's/%2F/\//g')
    if [ ! -z "$CALLBACK_URL" ]; then
        echo -e "   📍 Callback URL: $CALLBACK_URL"
        if echo "$CALLBACK_URL" | grep -q "$BACKEND_URL"; then
            echo -e "   ✅ Callback URL correcte"
        else
            echo -e "   ❌ Callback URL incorrecte (devrait contenir $BACKEND_URL)"
        fi
    fi
else
    echo -e "   ❌ Pas de redirection vers Google détectée"
fi

# 4. Test frontend accessible
echo -e "\n${BLUE}4. Test frontend accessible...${NC}"
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "   ✅ Frontend accessible (200 OK)"
else
    echo -e "   ❌ Frontend inaccessible (Code: $FRONTEND_RESPONSE)"
fi

# 5. Vérifier la route OAuth callback frontend
echo -e "\n${BLUE}5. Test route OAuth callback frontend...${NC}"
CALLBACK_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL/oauth/callback")
if [ "$CALLBACK_RESPONSE" = "200" ]; then
    echo -e "   ✅ Route /oauth/callback accessible"
else
    echo -e "   ⚠️  Route /oauth/callback retourne $CALLBACK_RESPONSE (normal si pas de token)"
fi

echo -e "\n${GREEN}🎯 Résumé des Tests :${NC}"
echo -e "• Backend : $BACKEND_URL"
echo -e "• Frontend : $FRONTEND_URL"
echo -e "• OAuth Google : Vérifiez les résultats ci-dessus"

echo -e "\n${YELLOW}📝 Actions Recommandées :${NC}"
echo -e "1. Si backend inaccessible → Vérifier déploiement Render"
echo -e "2. Si OAuth ne redirige pas → Vérifier variables GOOGLE_CLIENT_ID/SECRET"
echo -e "3. Si callback URL incorrecte → Vérifier GOOGLE_CALLBACK_URL"
echo -e "4. Si frontend inaccessible → Vérifier déploiement Hostinger"

echo -e "\n${BLUE}🔧 Pour corriger OAuth :${NC}"
echo -e "• Suivre le guide : RENDER-OAUTH-FIX.md"
echo -e "• Configurer Google Cloud Console avec les bonnes URLs"
echo -e "• Ajouter les variables d'environnement sur Render"

# Nettoyage
rm -f /tmp/health_response

echo -e "\n${GREEN}✅ Vérification terminée !${NC}" 
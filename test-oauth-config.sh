#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Test Configuration OAuth Google - SmartPlanning${NC}"
echo "=========================================================="

BACKEND_URL="https://smartplanning.onrender.com"

echo -e "\n${YELLOW}📋 Test de la redirection OAuth...${NC}"

# Test de la redirection OAuth Google
echo -e "\n${BLUE}1. Test redirection initiale OAuth...${NC}"
OAUTH_RESPONSE=$(curl -s -I "$BACKEND_URL/api/auth/google")
LOCATION_HEADER=$(echo "$OAUTH_RESPONSE" | grep -i "location:")

if echo "$LOCATION_HEADER" | grep -q "accounts.google.com"; then
    echo -e "   ✅ Redirection vers Google OAuth détectée"
    
    # Extraire l'URL de callback
    CALLBACK_URL=$(echo "$LOCATION_HEADER" | grep -o 'redirect_uri=[^&]*' | cut -d'=' -f2 | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))")
    echo -e "   📍 Callback URL configurée: $CALLBACK_URL"
    
    if echo "$CALLBACK_URL" | grep -q "smartplanning.onrender.com"; then
        echo -e "   ✅ Callback URL correcte"
    else
        echo -e "   ❌ Callback URL incorrecte"
    fi
else
    echo -e "   ❌ Pas de redirection vers Google détectée"
fi

# Test d'un callback simulé pour voir où ça redirige
echo -e "\n${BLUE}2. Test endpoint de santé pour vérifier le déploiement...${NC}"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo -e "   ✅ Backend accessible et fonctionnel"
    TIMESTAMP=$(echo "$HEALTH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['timestamp'])")
    echo -e "   📅 Dernière mise à jour: $TIMESTAMP"
else
    echo -e "   ❌ Backend inaccessible"
fi

echo -e "\n${BLUE}3. Vérification de l'URL de redirection finale...${NC}"
echo -e "   ⚠️  Pour tester complètement, il faut faire un vrai flow OAuth"
echo -e "   📝 Étapes de test manuel:"
echo -e "      1. Aller sur https://smartplanning.fr"
echo -e "      2. Cliquer 'Connexion' → 'Continuer avec Google'"
echo -e "      3. Vérifier l'URL finale après authentification"

echo -e "\n${YELLOW}🔍 Diagnostic:${NC}"
echo -e "• Si ça redirige encore vers localhost:3000 →"
echo -e "  Le redéploiement n'a pas pris en compte CLIENT_URL"
echo -e "• Si ça redirige vers smartplanning.fr →"
echo -e "  La configuration est correcte ✅"

echo -e "\n${BLUE}💡 Solution si problème persiste:${NC}"
echo -e "1. Vérifier que CLIENT_URL est bien dans les variables Render"
echo -e "2. Forcer un nouveau déploiement"
echo -e "3. Vérifier les logs Render pour les erreurs"

echo -e "\n${GREEN}🎯 Test terminé !${NC}" 
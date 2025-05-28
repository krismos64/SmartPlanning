#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔐 Générateur de Secrets SmartPlanning${NC}"
echo "========================================"

# Fonction pour générer un secret aléatoire
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Générer les secrets
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)

echo -e "\n${GREEN}✅ Secrets générés avec succès !${NC}"
echo -e "\n${YELLOW}📋 Copiez ces valeurs dans vos variables d'environnement Render :${NC}"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"
echo ""

# Créer un fichier temporaire avec les secrets
cat > .env.secrets << EOF
# Secrets générés automatiquement - $(date)
# À copier dans les variables d'environnement Render

JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
EOF

echo -e "${BLUE}💾 Secrets sauvegardés dans .env.secrets${NC}"
echo -e "${YELLOW}⚠️  Supprimez ce fichier après avoir copié les valeurs !${NC}"
echo ""
echo -e "${GREEN}🚀 Prêt pour le déploiement Render !${NC}"
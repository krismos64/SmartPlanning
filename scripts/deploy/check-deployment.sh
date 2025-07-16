#!/bin/bash

# Script de vérification pré-déploiement SmartPlanning
set -e

echo "🔍 Vérification pré-déploiement SmartPlanning"
echo "=============================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

ERRORS=0

# Fonction pour incrémenter les erreurs
error_found() {
    log_error "$1"
    ERRORS=$((ERRORS + 1))
}

# Vérification des fichiers essentiels
log_info "Vérification des fichiers essentiels..."

# Backend
if [ ! -f "backend/package.json" ]; then
    error_found "backend/package.json manquant"
else
    log_success "backend/package.json trouvé"
fi

if [ ! -f "backend/src/server.ts" ]; then
    error_found "backend/src/server.ts manquant"
else
    log_success "backend/src/server.ts trouvé"
fi

if [ ! -f "backend/tsconfig.json" ]; then
    error_found "backend/tsconfig.json manquant"
else
    log_success "backend/tsconfig.json trouvé"
fi

# Frontend
if [ ! -f "frontend/package.json" ]; then
    error_found "frontend/package.json manquant"
else
    log_success "frontend/package.json trouvé"
fi

if [ ! -f "frontend/vite.config.ts" ]; then
    error_found "frontend/vite.config.ts manquant"
else
    log_success "frontend/vite.config.ts trouvé"
fi

# Fichiers de déploiement
if [ ! -f "render.yaml" ]; then
    error_found "render.yaml manquant"
else
    log_success "render.yaml trouvé"
fi

if [ ! -f "backend/env.example" ]; then
    error_found "backend/env.example manquant"
else
    log_success "backend/env.example trouvé"
fi

if [ ! -f "frontend/.htaccess" ]; then
    error_found "frontend/.htaccess manquant"
else
    log_success "frontend/.htaccess trouvé"
fi

# Vérification des scripts package.json
log_info "Vérification des scripts backend..."

cd backend
if ! grep -q '"start": "node dist/server.js"' package.json; then
    error_found "Script 'start' incorrect dans backend/package.json"
else
    log_success "Script 'start' correct"
fi

if ! grep -q '"build": "tsc"' package.json; then
    error_found "Script 'build' manquant dans backend/package.json"
else
    log_success "Script 'build' correct"
fi

# Test de compilation backend
log_info "Test de compilation backend..."
if npm run build > /dev/null 2>&1; then
    log_success "Compilation backend réussie"
    if [ -f "dist/server.js" ]; then
        log_success "dist/server.js généré"
    else
        error_found "dist/server.js non généré"
    fi
else
    error_found "Échec de compilation backend"
fi

cd ../frontend

# Vérification des scripts frontend
log_info "Vérification des scripts frontend..."

if ! grep -q '"build": "vite build"' package.json; then
    error_found "Script 'build' incorrect dans frontend/package.json"
else
    log_success "Script 'build' correct"
fi

# Test de build frontend
log_info "Test de build frontend..."
if npm run build > /dev/null 2>&1; then
    log_success "Build frontend réussi"
    if [ -d "dist" ]; then
        log_success "Dossier dist/ généré"
        if [ -f "dist/index.html" ]; then
            log_success "dist/index.html généré"
        else
            error_found "dist/index.html manquant"
        fi
    else
        error_found "Dossier dist/ non généré"
    fi
else
    error_found "Échec du build frontend"
fi

cd ..

# Vérification des dépendances critiques
log_info "Vérification des dépendances critiques..."

# Backend
cd backend
if ! grep -q '"express"' package.json; then
    error_found "Express manquant dans les dépendances backend"
else
    log_success "Express trouvé"
fi

if ! grep -q '"mongoose"' package.json; then
    error_found "Mongoose manquant dans les dépendances backend"
else
    log_success "Mongoose trouvé"
fi

if ! grep -q '"jsonwebtoken"' package.json; then
    error_found "JWT manquant dans les dépendances backend"
else
    log_success "JWT trouvé"
fi

cd ../frontend

if ! grep -q '"react"' package.json; then
    error_found "React manquant dans les dépendances frontend"
else
    log_success "React trouvé"
fi

if ! grep -q '"vite"' package.json; then
    error_found "Vite manquant dans les dépendances frontend"
else
    log_success "Vite trouvé"
fi

cd ..

# Vérification de la configuration
log_info "Vérification de la configuration..."

# Vérifier que l'URL API est configurée
if grep -q "VITE_API_URL" frontend/env.production; then
    log_success "URL API configurée pour la production"
else
    log_warning "URL API non configurée dans frontend/env.production"
fi

# Vérifier les CORS dans le backend
if grep -q "cors" backend/src/app.ts; then
    log_success "CORS configuré dans le backend"
else
    error_found "CORS non configuré dans le backend"
fi

# Résumé final
echo ""
echo "📊 Résumé de la vérification"
echo "============================"

if [ $ERRORS -eq 0 ]; then
    log_success "Toutes les vérifications sont passées ! 🎉"
    log_info "Le projet est prêt pour le déploiement."
    echo ""
    echo "Prochaines étapes :"
    echo "1. Configurer les variables d'environnement sur Render"
    echo "2. Déployer le backend sur Render"
    echo "3. Uploader le frontend sur Hostinger"
    echo "4. Tester le déploiement"
    exit 0
else
    log_error "❌ $ERRORS erreur(s) trouvée(s)"
    log_warning "Corrigez les erreurs avant de déployer."
    exit 1
fi 
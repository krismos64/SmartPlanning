#!/bin/bash

# Script de déploiement SmartPlanning
# Usage: ./deploy.sh [backend|frontend|all]

set -e

echo "🚀 Déploiement SmartPlanning"
echo "=============================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour déployer le backend
deploy_backend() {
    log_info "Déploiement du backend..."
    
    cd backend
    
    # Vérification des dépendances
    log_info "Installation des dépendances..."
    npm install
    
    # Build TypeScript
    log_info "Compilation TypeScript..."
    npm run build
    
    # Vérification du build
    if [ ! -f "dist/server.js" ]; then
        log_error "Échec de la compilation - dist/server.js introuvable"
        exit 1
    fi
    
    log_success "Backend prêt pour le déploiement Render"
    log_warning "N'oubliez pas de configurer les variables d'environnement sur Render :"
    echo "  - MONGODB_URI"
    echo "  - JWT_SECRET"
    echo "  - GOOGLE_CLIENT_ID"
    echo "  - GOOGLE_CLIENT_SECRET"
    echo "  - SMTP_PASS"
    
    cd ..
}

# Fonction pour déployer le frontend
deploy_frontend() {
    log_info "Déploiement du frontend..."
    
    cd frontend
    
    # Vérification des dépendances
    log_info "Installation des dépendances..."
    npm install
    
    # Build pour production
    log_info "Build de production..."
    npm run build
    
    # Vérification du build
    if [ ! -d "dist" ]; then
        log_error "Échec du build - dossier dist introuvable"
        exit 1
    fi
    
    log_success "Frontend compilé avec succès"
    log_info "Dossier dist/ prêt pour l'upload sur Hostinger"
    log_warning "Étapes suivantes :"
    echo "  1. Connectez-vous à votre panel Hostinger"
    echo "  2. Accédez au gestionnaire de fichiers"
    echo "  3. Supprimez le contenu du dossier public_html"
    echo "  4. Uploadez tout le contenu du dossier frontend/dist/"
    echo "  5. Vérifiez que l'URL API pointe vers votre backend Render"
    
    cd ..
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis OK"
}

# Fonction principale
main() {
    check_prerequisites
    
    case "${1:-all}" in
        "backend")
            deploy_backend
            ;;
        "frontend")
            deploy_frontend
            ;;
        "all")
            deploy_backend
            deploy_frontend
            ;;
        *)
            log_error "Usage: $0 [backend|frontend|all]"
            exit 1
            ;;
    esac
    
    log_success "Déploiement terminé ! 🎉"
}

# Exécution du script
main "$@" 
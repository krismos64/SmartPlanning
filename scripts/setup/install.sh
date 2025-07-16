#!/bin/bash

# Script d'installation SmartPlanning
# Usage: ./scripts/setup/install.sh

set -e

echo "🚀 Installation SmartPlanning"
echo "============================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Version requise: >= 18.0.0"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if ! [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        log_error "Version Node.js insuffisante. Requis: >= $REQUIRED_VERSION, Installé: $NODE_VERSION"
        exit 1
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis validés"
}

# Installation des dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    # Backend
    log_info "Installation backend..."
    cd backend
    npm install
    cd ..
    log_success "Dépendances backend installées"
    
    # Frontend
    log_info "Installation frontend..."
    cd frontend
    npm install
    cd ..
    log_success "Dépendances frontend installées"
}

# Configuration des variables d'environnement
setup_environment() {
    log_info "Configuration des variables d'environnement..."
    
    # Backend
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/env.example" ]; then
            cp backend/env.example backend/.env
            log_warning "Fichier backend/.env créé depuis env.example"
            log_warning "⚠️  Vous devez configurer vos variables d'environnement dans backend/.env"
        else
            log_warning "Aucun fichier env.example trouvé pour le backend"
        fi
    else
        log_info "Fichier backend/.env existe déjà"
    fi
    
    # Frontend
    if [ ! -f "frontend/.env.local" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env.local
            log_warning "Fichier frontend/.env.local créé depuis .env.example"
            log_warning "⚠️  Vous devez configurer vos variables d'environnement dans frontend/.env.local"
        else
            log_warning "Aucun fichier .env.example trouvé pour le frontend"
        fi
    else
        log_info "Fichier frontend/.env.local existe déjà"
    fi
}

# Build initial
initial_build() {
    log_info "Build initial..."
    
    # Backend
    log_info "Build backend..."
    cd backend
    npm run build
    cd ..
    log_success "Backend compilé"
    
    log_success "Installation terminée"
}

# Instructions finales
show_instructions() {
    echo ""
    log_success "🎉 Installation terminée avec succès!"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "1. Configurer les variables d'environnement:"
    echo "   - backend/.env"
    echo "   - frontend/.env.local"
    echo ""
    echo "2. Démarrer l'application:"
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd frontend && npm run dev"
    echo ""
    echo "3. Accéder à l'application:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - Backend API: http://localhost:5050/api"
    echo ""
    echo "📚 Documentation: ./docs/"
    echo ""
}

# Fonction principale
main() {
    check_prerequisites
    install_dependencies
    setup_environment
    initial_build
    show_instructions
}

# Exécution
main "$@"
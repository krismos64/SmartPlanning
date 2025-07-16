#!/bin/bash

# Script de nettoyage SmartPlanning
# Usage: ./scripts/maintenance/cleanup.sh [--deep]

set -e

echo "🧹 Nettoyage SmartPlanning"
echo "=========================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

DEEP_CLEAN=false

# Parsing des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --deep)
            DEEP_CLEAN=true
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            echo "Usage: $0 [--deep]"
            exit 1
            ;;
    esac
done

# Nettoyage des fichiers de build
clean_build_files() {
    log_info "Nettoyage des fichiers de build..."
    
    # Backend dist
    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        log_success "Dossier backend/dist supprimé"
    fi
    
    # Frontend dist
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        log_success "Dossier frontend/dist supprimé"
    fi
}

# Nettoyage des logs
clean_logs() {
    log_info "Nettoyage des fichiers de logs..."
    
    # Logs à la racine
    find . -maxdepth 1 -name "*.log" -type f -delete 2>/dev/null || true
    
    # Logs dans backend
    find backend -name "*.log" -type f -delete 2>/dev/null || true
    
    # Logs dans frontend
    find frontend -name "*.log" -type f -delete 2>/dev/null || true
    
    log_success "Fichiers de logs nettoyés"
}

# Nettoyage des fichiers temporaires
clean_temp_files() {
    log_info "Nettoyage des fichiers temporaires..."
    
    # Fichiers temporaires courants
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    find . -name "*.temp" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
    
    # Cache npm
    if [ -d ".npm" ]; then
        rm -rf .npm
    fi
    
    log_success "Fichiers temporaires nettoyés"
}

# Nettoyage des uploads de développement
clean_uploads() {
    log_info "Nettoyage des uploads de développement..."
    
    if [ -d "backend/uploads" ]; then
        # Garder le dossier mais vider le contenu
        find backend/uploads -type f ! -name ".gitkeep" -delete 2>/dev/null || true
        log_success "Uploads de développement nettoyés"
    fi
}

# Nettoyage approfondi (node_modules)
deep_clean() {
    if [ "$DEEP_CLEAN" = true ]; then
        log_warning "Nettoyage approfondi - suppression des node_modules..."
        
        # Backend node_modules
        if [ -d "backend/node_modules" ]; then
            rm -rf backend/node_modules
            log_success "backend/node_modules supprimé"
        fi
        
        # Frontend node_modules
        if [ -d "frontend/node_modules" ]; then
            rm -rf frontend/node_modules
            log_success "frontend/node_modules supprimé"
        fi
        
        # Root node_modules (si présent)
        if [ -d "node_modules" ]; then
            rm -rf node_modules
            log_success "node_modules racine supprimé"
        fi
        
        # Package-lock.json
        find . -name "package-lock.json" -not -path "./docs/*" -delete 2>/dev/null || true
        
        log_warning "Nettoyage approfondi terminé"
        log_info "Vous devrez relancer: npm install"
    fi
}

# Cache des éditeurs et IDEs
clean_editor_cache() {
    log_info "Nettoyage des caches d'éditeurs..."
    
    # VSCode
    if [ -d ".vscode" ]; then
        rm -rf .vscode
        log_success "Cache VSCode supprimé"
    fi
    
    # IntelliJ/WebStorm
    if [ -d ".idea" ]; then
        rm -rf .idea
        log_success "Cache IntelliJ supprimé"
    fi
    
    # Vim
    find . -name "*.swp" -type f -delete 2>/dev/null || true
    find . -name "*.swo" -type f -delete 2>/dev/null || true
}

# Statistiques du nettoyage
show_statistics() {
    log_info "Calcul de l'espace libéré..."
    
    # Cette fonction pourrait être améliorée pour calculer l'espace réellement libéré
    log_success "Nettoyage terminé"
    
    if [ "$DEEP_CLEAN" = true ]; then
        echo ""
        log_warning "N'oubliez pas de réinstaller les dépendances:"
        echo "cd backend && npm install"
        echo "cd frontend && npm install"
    fi
}

# Fonction principale
main() {
    clean_build_files
    clean_logs
    clean_temp_files
    clean_uploads
    clean_editor_cache
    deep_clean
    show_statistics
    
    echo ""
    log_success "🎉 Nettoyage terminé avec succès!"
}

# Confirmation pour le nettoyage approfondi
if [ "$DEEP_CLEAN" = true ]; then
    echo ""
    log_warning "⚠️  ATTENTION: Nettoyage approfondi demandé"
    log_warning "Cela supprimera tous les node_modules et package-lock.json"
    echo ""
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Nettoyage annulé"
        exit 0
    fi
fi

# Exécution
main "$@"
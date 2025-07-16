# Guide d'intégration CI/CD pour les tests de sécurité

## Configuration GitHub Actions

Créer le fichier `.github/workflows/security-tests.yml` :

```yaml
name: Tests de Sécurité

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    # Exécuter les tests de sécurité chaque jour à 2h du matin
    - cron: '0 2 * * *'

jobs:
  security-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
        
    - name: Install dependencies
      working-directory: ./backend
      run: npm ci
      
    - name: Run security tests
      working-directory: ./backend
      run: npm run test:security
      env:
        NODE_ENV: test
        JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
        
    - name: Generate security test coverage
      working-directory: ./backend
      run: npm run test:security -- --coverage
      
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage/lcov.info
        flags: security-tests
        name: security-coverage
        
    - name: Security audit
      working-directory: ./backend
      run: npm audit --audit-level moderate
      
    - name: Check for high-risk dependencies
      working-directory: ./backend
      run: |
        npm audit --audit-level high --json > audit-results.json
        if [ -s audit-results.json ]; then
          echo "❌ Vulnérabilités critiques détectées"
          cat audit-results.json
          exit 1
        fi

  dependency-check:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Run OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'SmartPlanning'
        path: './backend'
        format: 'JSON'
        
    - name: Upload OWASP report
      uses: actions/upload-artifact@v3
      with:
        name: dependency-check-report
        path: reports/

  secrets-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Run secret detection
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
```

## Scripts package.json

Ajouter ces scripts dans `backend/package.json` :

```json
{
  "scripts": {
    "test:security": "jest --testPathPattern=security --verbose",
    "test:security:watch": "jest --testPathPattern=security --watch",
    "test:security:coverage": "jest --testPathPattern=security --coverage",
    "security:audit": "npm audit --audit-level moderate",
    "security:fix": "npm audit fix",
    "security:check": "npm run test:security && npm run security:audit"
  }
}
```

## Pre-commit hooks

Créer `.pre-commit-config.yaml` :

```yaml
repos:
  - repo: local
    hooks:
      - id: security-tests
        name: Tests de sécurité
        entry: npm run test:security
        language: system
        pass_filenames: false
        always_run: true
        
      - id: audit-check
        name: Audit des dépendances
        entry: npm audit --audit-level moderate
        language: system
        pass_filenames: false
        always_run: true
```

## Variables d'environnement

Configurer ces secrets dans GitHub :

- `JWT_SECRET_TEST`: Clé JWT pour les tests
- `MONGODB_URI_TEST`: URI MongoDB pour les tests (optionnel)
- `CODECOV_TOKEN`: Token pour l'upload de coverage

## Notifications Slack/Discord

Ajouter cette étape pour les notifications :

```yaml
- name: Notify security test results
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    channel: '#security-alerts'
    text: '🚨 Les tests de sécurité ont échoué sur ${{ github.ref }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Métriques de sécurité

Créer un dashboard pour tracker :

1. **Couverture des tests de sécurité** : % de code couvert
2. **Temps d'exécution** : Performance des tests
3. **Vulnérabilités détectées** : Nombre et gravité
4. **Tendances** : Évolution dans le temps

## Automatisation des correctifs

Script pour auto-fix des vulnérabilités mineures :

```yaml
- name: Auto-fix minor vulnerabilities
  run: |
    npm audit fix --audit-level low
    if [ -n "$(git status --porcelain)" ]; then
      git config --local user.email "security-bot@smartplanning.com"
      git config --local user.name "Security Bot"
      git add package*.json
      git commit -m "🔒 Auto-fix security vulnerabilities"
      git push
    fi
```

## Intégration avec SonarQube

```yaml
- name: SonarQube analysis
  uses: sonarqube-quality-gate-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Tests de sécurité en production

Pour les environnements de production :

```yaml
production-security-check:
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
  - name: Health check endpoint
    run: |
      curl -f https://api.smartplanning.fr/api/health || exit 1
      
  - name: SSL certificate check
    run: |
      echo | openssl s_client -connect smartplanning.fr:443 2>/dev/null | 
      openssl x509 -noout -dates | grep -o 'notAfter=.*' | 
      cut -d= -f2 | xargs -I {} date -d "{}" +%s > cert_expiry
      
      current_time=$(date +%s)
      cert_expiry=$(cat cert_expiry)
      days_left=$(( (cert_expiry - current_time) / 86400 ))
      
      if [ $days_left -lt 30 ]; then
        echo "⚠️ Certificat SSL expire dans $days_left jours"
        exit 1
      fi
```

## Rapports de sécurité

Générer des rapports automatiques :

```yaml
- name: Generate security report
  run: |
    echo "# Rapport de sécurité - $(date)" > security-report.md
    echo "## Tests de sécurité" >> security-report.md
    npm run test:security -- --reporter=json > test-results.json
    echo "## Audit des dépendances" >> security-report.md
    npm audit --json >> security-report.md
    
- name: Upload security report
  uses: actions/upload-artifact@v3
  with:
    name: security-report
    path: security-report.md
```
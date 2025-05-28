# Utiliser l'image Node.js officielle
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Exposer le port
EXPOSE 10000

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S smartplanning -u 1001

# Changer la propriété des fichiers
RUN chown -R smartplanning:nodejs /app
USER smartplanning

# Commande de démarrage
CMD ["npm", "start"] 
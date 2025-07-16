import request from 'supertest';
import app from '../app';
import User from '../models/User.model';
import bcrypt from 'bcrypt';

describe('Tests de sécurité des cookies httpOnly', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      lastName: 'Test',
      firstName: 'User',
      email: 'test@security.com',
      password: 'password123',
      role: 'admin'
    });
  });

  describe('Configuration des cookies de sécurité', () => {
    it('devrait définir un cookie httpOnly lors de la connexion', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      
      const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toMatch(/HttpOnly/);
    });

    it('devrait définir SameSite=Strict pour prévenir les attaques CSRF', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      
      expect(tokenCookie).toMatch(/SameSite=Strict/);
    });

    it('devrait définir un chemin de cookie sécurisé', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      
      expect(tokenCookie).toMatch(/Path=\//);
    });

    it('devrait définir une expiration appropriée (24h)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      
      // Vérifier que Max-Age est défini (86400 secondes = 24 heures)
      expect(tokenCookie).toMatch(/Max-Age=86400/);
    });

    it('ne devrait pas définir Secure en environnement de test', async () => {
      // En test (NODE_ENV=test), le cookie ne devrait pas être Secure
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      
      expect(tokenCookie).not.toMatch(/Secure/);
    });
  });

  describe('Suppression sécurisée des cookies', () => {
    it('devrait supprimer le cookie lors de la déconnexion', async () => {
      // Se connecter d'abord
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const loginCookies = loginResponse.headers['set-cookie'];
      const tokenCookie = Array.isArray(loginCookies) ? loginCookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      
      // Extraire le token du cookie pour la déconnexion
      const cookieHeader = tokenCookie;

      // Se déconnecter
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookieHeader);

      expect(logoutResponse.status).toBe(200);
      
      // Vérifier que le cookie est supprimé (Max-Age=0)
      const logoutCookies = logoutResponse.headers['set-cookie'];
      const clearedCookie = Array.isArray(logoutCookies) ? logoutCookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      
      expect(clearedCookie).toBeDefined();
      expect(clearedCookie).toMatch(/Max-Age=0/);
      expect(clearedCookie).toMatch(/token=;/); // Valeur vide
    });
  });

  describe('Validation et sécurité des cookies', () => {
    let validCookie: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      validCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) || '' : '';
    });

    it('devrait accepter des requêtes avec un cookie valide', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', validCookie);

      expect(response.status).toBe(200);
    });

    it('devrait rejeter des cookies malformés', async () => {
      const malformedCookies = [
        'token=invalid-format',
        'token=',
        'token=header.payload', // JWT incomplet
        'token=not.a.jwt.token.with.too.many.parts',
        'wrongname=validtoken'
      ];

      for (const cookie of malformedCookies) {
        const response = await request(app)
          .get('/api/profile')
          .set('Cookie', cookie);

        expect(response.status).toBe(401);
      }
    });

    it('devrait rejeter des cookies avec des signatures invalides', async () => {
      // Modifier légèrement le cookie pour corrompre la signature
      const corruptedCookie = validCookie.replace(/.$/, 'X');

      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', corruptedCookie);

      expect(response.status).toBe(401);
    });

    it('devrait gérer les requêtes sans cookies', async () => {
      const response = await request(app)
        .get('/api/profile');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });
  });

  describe('Protection contre les attaques XSS', () => {
    it('ne devrait pas exposer le token dans les réponses JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toMatch(/jwt|token.*=.*\./i);
    });

    it('ne devrait pas permettre l\'accès au token via JavaScript côté client', async () => {
      // Simuler une tentative d'accès via document.cookie
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
      
      // Vérifier que HttpOnly est défini
      expect(tokenCookie).toMatch(/HttpOnly/);
      
      // En pratique, HttpOnly empêche l'accès via document.cookie
      // Ce test vérifie que l'attribut est présent
    });
  });

  describe('Gestion des sessions multiples', () => {
    it('devrait permettre plusieurs sessions simultanées', async () => {
      // Première connexion
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies1 = response1.headers['set-cookie'];
      const cookie1 = Array.isArray(cookies1) ? cookies1.find((cookie: string) => cookie.startsWith('token=')) : null;

      // Deuxième connexion (simule un autre navigateur/appareil)
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookies2 = response2.headers['set-cookie'];
      const cookie2 = Array.isArray(cookies2) ? cookies2.find((cookie: string) => cookie.startsWith('token=')) : null;

      // Les deux cookies devraient être valides
      const profileResponse1 = await request(app)
        .get('/api/profile')
        .set('Cookie', cookie1);

      const profileResponse2 = await request(app)
        .get('/api/profile')
        .set('Cookie', cookie2);

      expect(profileResponse1.status).toBe(200);
      expect(profileResponse2.status).toBe(200);
    });

    it('devrait invalider uniquement la session déconnectée', async () => {
      // Créer deux sessions
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@security.com',
          password: 'password123'
        });

      const cookie1 = Array.isArray(login1.headers['set-cookie']) ? login1.headers['set-cookie'].find((c: string) => c.startsWith('token=')) : null;
      const cookie2 = Array.isArray(login2.headers['set-cookie']) ? login2.headers['set-cookie'].find((c: string) => c.startsWith('token=')) : null;

      // Déconnecter la première session
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie1);

      // La première session devrait être invalidée
      const response1 = await request(app)
        .get('/api/profile')
        .set('Cookie', cookie1);

      // La deuxième session devrait rester valide
      const response2 = await request(app)
        .get('/api/profile')
        .set('Cookie', cookie2);

      expect(response1.status).toBe(401);
      expect(response2.status).toBe(200);
    });
  });
});
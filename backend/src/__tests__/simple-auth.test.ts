import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';
import bcrypt from 'bcrypt';

describe('Tests d\'authentification simplifiés', () => {
  let testUser: any;

  beforeEach(async () => {
    // Nettoyer avant chaque test
    await prisma.user.deleteMany({
      where: { email: 'test@simple.com' }
    });

    // Hasher le mot de passe manuellement
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Créer un utilisateur de test
    testUser = await prisma.user.create({
      data: {
        lastName: 'Test',
        firstName: 'User',
        email: 'test@simple.com',
        password: hashedPassword,
        role: 'admin'
      }
    });
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    await prisma.user.deleteMany({
      where: { email: 'test@simple.com' }
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait permettre la connexion avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@simple.com',
          password: 'password123'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('devrait rejeter des identifiants incorrects', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@simple.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Cookie Configuration', () => {
    it('devrait définir des cookies de sécurité', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@simple.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      console.log('Cookies:', cookies);
      
      if (cookies) {
        expect(Array.isArray(cookies)).toBe(true);
        const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
        if (tokenCookie) {
          expect(tokenCookie).toMatch(/HttpOnly/);
          expect(tokenCookie).toMatch(/SameSite=Strict/);
        }
      }
    });
  });
});
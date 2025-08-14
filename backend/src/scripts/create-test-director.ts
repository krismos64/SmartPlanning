import mongoose from 'mongoose';
import User from '../models/User.model';
import Company from '../models/Company.model';
import bcrypt from 'bcrypt';

async function createTestDirector() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartplanning';
    await mongoose.connect(mongoUri);
    console.log('🔗 Connexion à la base de données établie');
    
    // Trouver une compagnie existante
    const company = await Company.findOne();
    if (!company) {
      console.log('❌ Aucune compagnie trouvée');
      process.exit(1);
    }
    
    console.log('🏢 Compagnie trouvée:', company.name);
    
    // Créer un directeur de test
    const existingUser = await User.findOne({ email: 'directeur@test.fr' });
    if (existingUser) {
      console.log('✅ Le directeur existe déjà');
      console.log('📧 Email:', existingUser.email);
      console.log('🏢 CompanyId:', existingUser.companyId);
      console.log('👤 Rôle:', existingUser.role);
      process.exit(0);
    }
    
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    const newUser = new User({
      email: 'directeur@test.fr',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Directeur',
      role: 'directeur',
      companyId: company._id,
      isActive: true
    });
    
    await newUser.save();
    console.log('✅ Directeur créé avec succès');
    console.log('📧 Email: directeur@test.fr');
    console.log('🔑 Mot de passe: Test123!');
    console.log('🏢 CompanyId:', company._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createTestDirector();
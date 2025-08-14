const mongoose = require('mongoose');
require('dotenv').config();

// Définir les schémas pour éviter les erreurs
const employeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  preferences: {
    preferredDays: [String],
    preferredHours: [String],
  },
  contractHoursPerWeek: Number,
  startDate: Date,
  status: String,
}, { collection: 'employees' });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  status: String,
}, { collection: 'users' });

const teamSchema = new mongoose.Schema({
  name: String,
  managerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  employeeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
}, { collection: 'teams' });

const generatedScheduleSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  scheduleData: { type: Map, of: mongoose.Schema.Types.Mixed },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'approved', 'rejected'], default: 'draft' },
  weekNumber: { type: Number },
  year: { type: Number },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { collection: 'generatedschedules' });

const Employee = mongoose.model('Employee', employeeSchema);
const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);
const GeneratedSchedule = mongoose.model('GeneratedSchedule', generatedScheduleSchema);

async function debugAISchedules() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion MongoDB OK');
    
    // 1. Compter tous les plannings générés
    const totalSchedules = await GeneratedSchedule.countDocuments({});
    console.log(`📊 Total des plannings générés: ${totalSchedules}`);
    
    // 2. Compter les plannings en draft
    const draftSchedules = await GeneratedSchedule.countDocuments({ status: 'draft' });
    console.log(`📝 Plannings en draft: ${draftSchedules}`);
    
    // 3. Lister les utilisateurs managers/directeurs
    const managers = await User.find({ role: { $in: ['manager', 'directeur', 'admin'] } });
    console.log(`\n👥 Utilisateurs avec rôle manager/directeur/admin: ${managers.length}`);
    
    for (const manager of managers) {
      console.log(`  - ${manager.firstName} ${manager.lastName} (${manager.role}) - ID: ${manager._id}`);
      
      if (manager.role === 'manager') {
        // Trouver les équipes gérées par ce manager
        const managedTeams = await Team.find({ managerIds: manager._id });
        console.log(`    Équipes gérées: ${managedTeams.length}`);
        
        for (const team of managedTeams) {
          console.log(`      - ${team.name} (${team.employeeIds.length} employés)`);
          
          // Trouver les plannings générés pour les employés de cette équipe
          const teamSchedules = await GeneratedSchedule.find({
            employeeId: { $in: team.employeeIds },
            status: 'draft'
          });
          console.log(`        Plannings IA draft: ${teamSchedules.length}`);
        }
      }
      
      if (manager.role === 'directeur') {
        // Trouver les équipes de la même société
        const companyTeams = await Team.find({ companyId: manager.companyId });
        console.log(`    Équipes de la société: ${companyTeams.length}`);
        
        const employeeIds = [];
        for (const team of companyTeams) {
          employeeIds.push(...team.employeeIds);
        }
        
        const companySchedules = await GeneratedSchedule.find({
          employeeId: { $in: employeeIds },
          status: 'draft'
        });
        console.log(`    Plannings IA draft de la société: ${companySchedules.length}`);
      }
    }
    
    // 4. Analyser les plannings en détail
    console.log('\n🔍 Analyse des plannings générés:');
    const schedules = await GeneratedSchedule.find({ status: 'draft' })
      .populate('employeeId', 'firstName lastName')
      .populate('generatedBy', 'firstName lastName')
      .limit(10);
    
    for (const schedule of schedules) {
      console.log(`\n📋 Planning ${schedule._id}:`);
      console.log(`  - Employé: ${schedule.employeeId ? `${schedule.employeeId.firstName} ${schedule.employeeId.lastName}` : 'EMPLOYÉ NON TROUVÉ'}`);
      console.log(`  - Généré par: ${schedule.generatedBy ? `${schedule.generatedBy.firstName} ${schedule.generatedBy.lastName}` : 'GÉNÉRATEUR NON TROUVÉ'}`);
      console.log(`  - Semaine: ${schedule.weekNumber}/${schedule.year}`);
      console.log(`  - Timestamp: ${schedule.timestamp}`);
      console.log(`  - Status: ${schedule.status}`);
      
      // Vérifier si l'employé existe toujours
      if (schedule.employeeId) {
        const employee = await Employee.findById(schedule.employeeId);
        if (!employee) {
          console.log(`  ⚠️  PROBLÈME: Employé ${schedule.employeeId} non trouvé!`);
        } else {
          // Trouver l'équipe de cet employé
          const team = await Team.findOne({ employeeIds: schedule.employeeId });
          if (team) {
            console.log(`  - Équipe: ${team.name}`);
            console.log(`  - Managers de l'équipe: ${team.managerIds.length}`);
          } else {
            console.log(`  ⚠️  PROBLÈME: Employé ${schedule.employeeId} n'est dans aucune équipe!`);
          }
        }
      }
    }
    
    // 5. Vérifier les orphelins
    console.log('\n🔍 Vérification des orphelins:');
    const orphanedSchedules = await GeneratedSchedule.find({ status: 'draft' })
      .populate('employeeId');
    
    let orphanCount = 0;
    for (const schedule of orphanedSchedules) {
      if (!schedule.employeeId) {
        orphanCount++;
      }
    }
    
    console.log(`❌ Plannings avec employés orphelins: ${orphanCount}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion MongoDB');
  }
}

debugAISchedules();
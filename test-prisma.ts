import prisma from './src/lib/prisma';

async function testConnection() {
  try {
    // Test la connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Compter les utilisateurs (vide au début)
    const userCount = await prisma.user.count();
    console.log(`Nombre d'utilisateurs: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
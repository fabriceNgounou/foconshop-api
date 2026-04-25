// fix-category-updatedat.cjs
// Script pour corriger les valeurs NULL de updatedAt (CommonJS)

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCategoryUpdatedAt() {
  console.log('🔧 Correction des catégories...\n');

  try {
    // Récupérer toutes les catégories avec updatedAt NULL
    const categories = await prisma.$queryRaw`
      SELECT id, name, "createdAt", "updatedAt" 
      FROM "Category" 
      WHERE "updatedAt" IS NULL
    `;

    console.log(`📊 Catégories à corriger : ${categories.length}\n`);

    if (categories.length === 0) {
      console.log('✅ Aucune correction nécessaire !');
      await prisma.$disconnect();
      return;
    }

    // Afficher quelques exemples
    console.log('Exemples de catégories à corriger :');
    categories.slice(0, 3).forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id})`);
    });
    console.log('');

    // Mettre à jour avec une requête SQL brute
    const result = await prisma.$executeRaw`
      UPDATE "Category" 
      SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW())
      WHERE "updatedAt" IS NULL
    `;

    console.log(`✅ ${result} catégories corrigées !\n`);

    // Vérification
    const remaining = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Category" 
      WHERE "updatedAt" IS NULL
    `;

    console.log(`📊 Catégories restantes avec NULL : ${remaining[0].count}\n`);

    if (remaining[0].count == 0) {
      console.log('✅ Succès ! Migration peut maintenant être appliquée !');
      console.log('\nExécutez maintenant :');
      console.log('  npx prisma migrate deploy\n');
    } else {
      console.log('⚠️ Il reste des catégories à corriger. Relancez le script.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\nDétails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategoryUpdatedAt();

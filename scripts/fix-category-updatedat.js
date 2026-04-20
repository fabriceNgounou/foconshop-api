const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCategoryUpdatedAt() {
  console.log('🔧 Début de la correction des catégories...\n');

  try {
    // Compter les catégories avec updatedAt NULL
    const countBefore = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Category" 
      WHERE "updatedAt" IS NULL
    `;

    console.log(`📊 Catégories avec updatedAt NULL : ${countBefore[0].count}\n`);

    if (Number(countBefore[0].count) === 0) {
      console.log('✅ Aucune correction nécessaire !');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Correction
    console.log('🔄 Application de la correction...\n');
    
    const result = await prisma.$executeRaw`
      UPDATE "Category" 
      SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW())
      WHERE "updatedAt" IS NULL
    `;

    console.log(`✅ ${result} catégories corrigées !\n`);

    // Vérification
    const countAfter = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Category" 
      WHERE "updatedAt" IS NULL
    `;

    console.log(`📊 Catégories restantes avec NULL : ${countAfter[0].count}\n`);

    if (Number(countAfter[0].count) === 0) {
      console.log('✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅');
      console.log('\n🎉 Toutes les catégories ont été corrigées !');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategoryUpdatedAt();
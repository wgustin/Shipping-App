
import { auth, db } from '../src/server/firebaseAdmin';

async function clearDatabase() {
  console.log('🚀 Starting Firestore cleanup...');

  try {
    // 2. Clear Firestore Collections
    const collections = ['users', 'shipments', 'secure_rates'];
    
    for (const collectionName of collections) {
      console.log(`--- Clearing collection: ${collectionName} ---`);
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`Collection ${collectionName} was already empty.`);
        continue;
      }

      const batchSize = 400;
      let documentsDeleted = 0;
      
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = snapshot.docs.slice(i, i + batchSize);
        
        for (const doc of chunk) {
          batch.delete(doc.ref);
        }
        
        await batch.commit();
        documentsDeleted += chunk.length;
        console.log(`Deleted ${documentsDeleted} documents from ${collectionName}...`);
      }
      
      console.log(`✅ Cleared ${collectionName} collection.`);
    }

    console.log('🏆 Firestore database is now clean!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

clearDatabase();

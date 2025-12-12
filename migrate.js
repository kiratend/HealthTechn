const admin = require('firebase-admin');

// Initialize with your service account key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Use your specific Realtime Database URL
  databaseURL: 'https://healthtechn-cli6da-default-rtfb.asia-southeast1.firebasedatabase.app/'
});

const rtdb = admin.database();
const firestore = admin.firestore();

async function migrateData() {
  try {
    const snapshot = await rtdb.ref('orders').once('value');
    const ordersData = snapshot.val();

    if (!ordersData) {
      console.log('No orders found to migrate.');
      return;
    }

    const batch = firestore.batch();
    const ordersCollectionRef = firestore.collection('orders');

    for (const orderId in ordersData) {
      const orderDocRef = ordersCollectionRef.doc(orderId);
      batch.set(orderDocRef, ordersData[orderId]);
      console.log(`Queued order: ${orderId}`);
    }

    await batch.commit();
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up to allow the script to exit
    process.exit();
  }
}

// Run the function
migrateData();
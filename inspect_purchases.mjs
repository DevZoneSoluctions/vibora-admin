import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBsLX8L1apNIpWTcYzNWPCMXkK-sBaGRGM",
  authDomain: "vibora-d505c.firebaseapp.com",
  projectId: "vibora-d505c",
  storageBucket: "vibora-d505c.firebasestorage.app",
  messagingSenderId: "986844844645",
  appId: "1:986844844645:web:031eb7f91fbcb427aaec8c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectPurchases() {
  console.log('=== CHECKING userspurchases COLLECTION ===');
  try {
    const snap = await getDocs(collection(db, 'userspurchases'));
    console.log(`Found ${snap.size} user docs in userspurchases:`);
    for (const d of snap.docs) {
      console.log(`\nDoc ID (User ID): ${d.id}`);
      console.log('Data:', JSON.stringify(d.data(), null, 2));

      // Check subcollections: messages and requests
      try {
        const msgSnap = await getDocs(collection(db, 'userspurchases', d.id, 'messages'));
        console.log(`  Subcollection messages: ${msgSnap.size} docs`);
        msgSnap.docs.forEach(m => {
          console.log(`    Message [${m.id}]:`, JSON.stringify(m.data(), null, 2));
        });
      } catch (e) {
        console.log(`  Failed reading messages:`, e.message);
      }

      try {
        const reqSnap = await getDocs(collection(db, 'userspurchases', d.id, 'requests'));
        console.log(`  Subcollection requests: ${reqSnap.size} docs`);
        reqSnap.docs.forEach(r => {
          console.log(`    Request [${r.id}]:`, JSON.stringify(r.data(), null, 2));
        });
      } catch (e) {
        console.log(`  Failed reading requests:`, e.message);
      }
    }
  } catch (e) {
    console.error('Error reading userspurchases:', e.message);
  }
}

inspectPurchases().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

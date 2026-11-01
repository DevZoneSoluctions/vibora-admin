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

async function inspect() {
  console.log('\n====== USERS COLLECTION — FULL DATA ======\n');
  const usersSnap = await getDocs(collection(db, 'users'));

  for (const docSnap of usersSnap.docs) {
    const d = docSnap.data();
    console.log(`\n--- ${d.fullName || d.name || 'Unknown'} [${docSnap.id}] ---`);
    console.log('  All Keys:', Object.keys(d).join(', '));

    // Show EXACT value of ALL fields
    for (const [key, val] of Object.entries(d)) {
      if (Array.isArray(val)) {
        console.log(`  [ARRAY] ${key}: [${val.join(', ')}]  (length: ${val.length})`);
      } else if (val && typeof val === 'object' && !val.seconds && !val._seconds) {
        console.log(`  [MAP] ${key}: ${JSON.stringify(val)}`);
      } else if (val && typeof val === 'object' && (val.seconds || val._seconds)) {
        const sec = val.seconds || val._seconds;
        console.log(`  [TIMESTAMP] ${key}: ${new Date(sec * 1000).toISOString()}`);
      } else {
        const display = typeof val === 'string' ? val.slice(0, 80) : val;
        console.log(`  ${key}: ${display}`);
      }
    }

    // Try to fetch subcollections by checking known names
    const subcols = ['friends', 'blocked', 'chats', 'contacts', 'requests'];
    for (const sub of subcols) {
      try {
        const subSnap = await getDocs(collection(db, 'users', docSnap.id, sub));
        if (!subSnap.empty) {
          console.log(`  [SUBCOLLECTION] ${sub}: ${subSnap.size} docs`);
          subSnap.docs.slice(0, 5).forEach(sd => {
            console.log(`    - ${sd.id}: ${JSON.stringify(sd.data()).slice(0, 100)}`);
          });
        }
      } catch {
        // permission denied or not found — skip

      }
    }
  }

  console.log('\n====== SEPARATE COLLECTIONS CHECK ======\n');
  const topLevelCols = ['friends', 'chats', 'contacts', 'blocked', 'friendRequests', 'friend_requests'];
  for (const col of topLevelCols) {
    try {
      const snap = await getDocs(collection(db, col));
      if (!snap.empty) {
        console.log(`\n[COLLECTION] ${col}: ${snap.size} docs`);
        snap.docs.slice(0, 3).forEach(d => {
          console.log(`  - ${d.id}: ${JSON.stringify(d.data()).slice(0, 150)}`);
        });
      }
    } catch {
      console.log(`  ${col}: permission denied / not found`);
    }
  }

  console.log('\n====== GROUPS COLLECTION ======\n');
  try {
    const groupsSnap = await getDocs(collection(db, 'groups'));
    groupsSnap.forEach((docSnap) => {
      const d = docSnap.data();
      console.log(`\n--- ${d.name || d.title || 'Unnamed'} [${docSnap.id}] ---`);
      if (Array.isArray(d.members)) console.log('  members:', d.members);
      if (Array.isArray(d.admins)) console.log('  admins:', d.admins);
      if (d.deliveredAt) console.log('  deliveredAt keys:', Object.keys(d.deliveredAt));
    });
  } catch (e) {
    console.log('groups: permission denied —', e.message);
  }
}

inspect().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

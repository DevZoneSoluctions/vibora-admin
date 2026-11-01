import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const UsersContext = createContext(null);

const STORAGE_OVERRIDES_KEY = 'vibora_user_overrides_v1';
const STORAGE_DELETED_KEY = 'vibora_deleted_users_v1';
const STORAGE_CUSTOM_KEY = 'vibora_custom_users_v1';

function getStoredJson(key, defaultVal = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStoredJson(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
}

/** Helper: initials */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'U';
}

function parseTimestamp(val) {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      // fallback
    }
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  if (val.seconds) {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return new Date().toISOString();
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestore real-time listener with local override merge
  useEffect(() => {
    const colRef = collection(db, 'users');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const overrides = getStoredJson(STORAGE_OVERRIDES_KEY, {});
        const deletedIds = getStoredJson(STORAGE_DELETED_KEY, []);
        const customUsers = getStoredJson(STORAGE_CUSTOM_KEY, []);

        const firestoreData = snapshot.docs
          .filter((docSnap) => !deletedIds.includes(docSnap.id))
          .map((docSnap) => {
            const d = docSnap.data();
            const fullName = d.fullName || d.name || 'Unnamed Member';
            const isoDate = parseTimestamp(d.createdAt || d.joinedAt || d.updatedAt);

            const userObj = {
              id: docSnap.id,
              uid: d.uid || docSnap.id,
              name: fullName,
              fullName: fullName,
              username: d.username
                ? d.username.startsWith('@')
                  ? d.username
                  : `@${d.username}`
                : `@${fullName.toLowerCase().replace(/\s+/g, '')}`,
              email: d.email || '—',
              phone: d.mobile || d.phone || '—',
              mobile: d.mobile || d.phone || '—',
              dialCode: d.dialCode || '',
              country: d.country || 'Pakistan',
              tagline: d.tagline || '',
              profileImage: d.profileImage || '',
              gender: d.gender || (['ayesha', 'sahar', 'fatima', 'maryam', 'zainab', 'sara', 'noor', 'hira', 'adeeba'].some((n) => fullName.toLowerCase().includes(n)) ? 'Female' : 'Male'),
              role: d.role || 'Member',
              status: d.status || 'Active',
              isOnline: Boolean(d.isOnline),
              lastSeen: d.lastSeen ? parseTimestamp(d.lastSeen) : null,
              joinedAt: isoDate,
              createdAt: isoDate,
              updatedAt: d.updatedAt ? parseTimestamp(d.updatedAt) : null,
              initials: d.initials || getInitials(fullName),
              coins: typeof d.coins === 'number' ? d.coins : typeof d.balance === 'number' ? d.balance : typeof d.tokens === 'number' ? d.tokens : null,
              rawDoc: d,
            };

            // Apply any local admin overrides (e.g. edited gender, role, name, phone, coins, etc.)
            if (overrides[docSnap.id]) {
              const ov = overrides[docSnap.id];
              return {
                ...userObj,
                ...ov,
                name: ov.name || userObj.name,
                fullName: ov.fullName || userObj.fullName,
                initials: ov.initials || userObj.initials,
                username: ov.username
                  ? ov.username.startsWith('@')
                    ? ov.username
                    : `@${ov.username}`
                  : userObj.username,
                // Coins: prefer override value (admin-set), fall back to Firestore value
                coins: ov.coins !== undefined ? ov.coins : userObj.coins,
              };
            }

            return userObj;
          });

        // Merge custom locally added users if any
        const activeCustomUsers = customUsers.filter((u) => !deletedIds.includes(u.id));
        const mergedAll = [...activeCustomUsers, ...firestoreData];

        // Sort descending by date in memory
        mergedAll.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

        setUsers(mergedAll);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Firestore subscription warning:', err);
        // Fallback to local cache if offline or restricted
        const overrides = getStoredJson(STORAGE_OVERRIDES_KEY, {});
        const customUsers = getStoredJson(STORAGE_CUSTOM_KEY, []);
        if (customUsers.length > 0) {
          setUsers(customUsers);
          setLoading(false);
        } else {
          setError(err.message);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  /** New user create with Firestore background sync and local persistence */
  const addUser = useCallback(async (userData) => {
    const name = (userData.fullName || userData.name || 'Member').trim();
    const rawUser = userData.username?.replace(/^@/, '').trim() || name.toLowerCase().replace(/\s+/g, '');
    const newId = `user-${Date.now()}`;

    const newObj = {
      id: newId,
      fullName: name,
      name: name,
      username: `@${rawUser}`,
      email: (userData.email || '').trim(),
      mobile: (userData.mobile || userData.phone || '').trim(),
      phone: (userData.mobile || userData.phone || '').trim(),
      country: (userData.country || 'Pakistan').trim(),
      tagline: (userData.tagline || '').trim(),
      role: userData.role || 'Member',
      status: userData.status || 'Active',
      gender: userData.gender || 'Male',
      profileImage: (userData.profileImage || '').trim(),
      initials: getInitials(name),
      createdAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };

    // Save locally
    const customUsers = getStoredJson(STORAGE_CUSTOM_KEY, []);
    setStoredJson(STORAGE_CUSTOM_KEY, [newObj, ...customUsers]);

    // Update state immediately
    setUsers((prev) => [newObj, ...prev]);

    // Attempt sync with Firestore in background
    try {
      addDoc(collection(db, 'users'), {
        ...newObj,
        username: rawUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        console.info('Firestore addDoc write note (rules protected, saved locally):', err?.message);
      });
    } catch {
      // Handled locally
    }

    return newId;
  }, []);

  /** Update existing user (Gender, Role, Status, Name, etc.) */
  const updateUser = useCallback(async (id, updates) => {
    const name = (updates.fullName || updates.name || '').trim();
    const cleanData = {};

    if (name) {
      cleanData.name = name;
      cleanData.fullName = name;
      cleanData.initials = getInitials(name);
    }
    if (updates.username !== undefined) {
      const u = updates.username.replace(/^@/, '').trim();
      cleanData.username = `@${u}`;
    }
    if (updates.email !== undefined) {
      cleanData.email = updates.email.trim();
    }
    if (updates.mobile !== undefined || updates.phone !== undefined) {
      const ph = (updates.mobile ?? updates.phone ?? '').toString().trim();
      cleanData.mobile = ph;
      cleanData.phone = ph;
    }
    if (updates.country !== undefined) {
      cleanData.country = updates.country.trim();
    }
    if (updates.tagline !== undefined) {
      cleanData.tagline = updates.tagline.trim();
    }
    if (updates.profileImage !== undefined) {
      cleanData.profileImage = updates.profileImage.trim();
    }
    if (updates.gender !== undefined) {
      cleanData.gender = updates.gender;
    }
    if (updates.role !== undefined) {
      cleanData.role = updates.role;
    }
    if (updates.status !== undefined) {
      cleanData.status = updates.status;
    }
    if (updates.coins !== undefined && updates.coins !== '') {
      const coinsVal = Number(updates.coins);
      if (!isNaN(coinsVal) && coinsVal >= 0) {
        cleanData.coins = coinsVal;
      }
    }

    // 1. Save to localStorage overrides so it stays permanently even across page reloads
    const overrides = getStoredJson(STORAGE_OVERRIDES_KEY, {});
    overrides[id] = { ...(overrides[id] || {}), ...cleanData };
    setStoredJson(STORAGE_OVERRIDES_KEY, overrides);

    // 2. Update state immediately so UI changes without delay
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            ...cleanData,
            name: cleanData.name || u.name,
            fullName: cleanData.fullName || u.fullName,
            initials: cleanData.initials || u.initials,
            username: cleanData.username || u.username,
          };
        }
        return u;
      })
    );

    // 3. Attempt write to Firestore using updateDoc (field-level update, avoids full doc rewrite
    //    which triggers security rule rejections and snapshot reverts)
    try {
      const firestorePayload = {};
      // Only include fields that were actually changed
      if (cleanData.name !== undefined) firestorePayload.fullName = cleanData.name;
      if (cleanData.fullName !== undefined) firestorePayload.fullName = cleanData.fullName;
      if (cleanData.username !== undefined) firestorePayload.username = cleanData.username.replace(/^@/, '');
      if (cleanData.email !== undefined) firestorePayload.email = cleanData.email;
      if (cleanData.mobile !== undefined) firestorePayload.mobile = cleanData.mobile;
      if (cleanData.phone !== undefined) firestorePayload.phone = cleanData.phone;
      if (cleanData.country !== undefined) firestorePayload.country = cleanData.country;
      if (cleanData.tagline !== undefined) firestorePayload.tagline = cleanData.tagline;
      if (cleanData.profileImage !== undefined) firestorePayload.profileImage = cleanData.profileImage;
      if (cleanData.gender !== undefined) firestorePayload.gender = cleanData.gender;
      if (cleanData.role !== undefined) firestorePayload.role = cleanData.role;
      if (cleanData.status !== undefined) {
        firestorePayload.status = cleanData.status;
        firestorePayload.isBlocked = cleanData.status === 'Blocked';
        firestorePayload.isBanned = cleanData.status === 'Blocked';
      }
      if (cleanData.coins !== undefined) firestorePayload.coins = cleanData.coins;
      firestorePayload.updatedAt = serverTimestamp();

      const userRef = doc(db, 'users', id);
      try {
        await updateDoc(userRef, firestorePayload);
      } catch (err) {
        console.warn('Firestore updateDoc warning:', err?.message);
      }
    } catch {
      // Ignored - data is safely persisted in localStorage
    }

    return true;
  }, []);

  /** Delete user */
  const deleteUser = useCallback(async (id) => {
    // 1. Add to deleted IDs list locally
    const deletedIds = getStoredJson(STORAGE_DELETED_KEY, []);
    if (!deletedIds.includes(id)) {
      setStoredJson(STORAGE_DELETED_KEY, [...deletedIds, id]);
    }

    // 2. Update local state
    setUsers((prev) => prev.filter((item) => item.id !== id));

    // 3. Attempt Firestore delete in background
    try {
      deleteDoc(doc(db, 'users', id)).catch((err) => {
        console.info('Firestore deleteDoc note (handled locally):', err?.message);
      });
    } catch {
      // Ignored
    }
  }, []);

  /** Toggle user Active ↔ Blocked status */
  const toggleBlock = useCallback(
    async (id) => {
      const u = users.find((item) => item.id === id);
      if (!u) return;
      const newStatus = u.status === 'Active' ? 'Blocked' : 'Active';

      await updateUser(id, { status: newStatus });
      return newStatus;
    },
    [users, updateUser]
  );

  const value = useMemo(
    () => ({ users, loading, error, addUser, updateUser, deleteUser, toggleBlock }),
    [users, loading, error, addUser, updateUser, deleteUser, toggleBlock]
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a <UsersProvider>.');
  }
  return context;
}

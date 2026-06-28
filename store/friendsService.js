// store/friendsService.js
import { db } from '../config/firebase';
import { ref, set, get, onValue, remove } from 'firebase/database';

// ─── Recherche un joueur par nom dans players/ ───────────────────
export async function searchPlayer(name) {
  const snap = await get(ref(db, 'players'));
  if (!snap.exists()) return [];
  const results = [];
  snap.forEach(child => {
    const data = child.val();
    if (data.name && data.name.toLowerCase().includes(name.toLowerCase())) {
      results.push({ uid: child.key, ...data });
    }
  });
  return results.slice(0, 10);
}

// ─── Envoie une demande d'ami ────────────────────────────────────
export async function sendFriendRequest(fromUid, fromName, toUid) {
  const existing    = await get(ref(db, `friends/${toUid}/${fromUid}`));
  if (existing.exists()) return { error: 'Déjà amis' };
  const existingReq = await get(ref(db, `friendRequests/${toUid}/${fromUid}`));
  if (existingReq.exists()) return { error: 'Demande déjà envoyée' };
  await set(ref(db, `friendRequests/${toUid}/${fromUid}`), {
    fromUid, fromName, sentAt: Date.now(),
  });
  return { success: true };
}

// ─── Accepte une demande ─────────────────────────────────────────
export async function acceptFriendRequest(myUid, myName, fromUid, fromName) {
  await set(ref(db, `friends/${myUid}/${fromUid}`), { name: fromName, addedAt: Date.now() });
  await set(ref(db, `friends/${fromUid}/${myUid}`), { name: myName,   addedAt: Date.now() });
  await remove(ref(db, `friendRequests/${myUid}/${fromUid}`));
  return { success: true };
}

// ─── Refuse une demande ──────────────────────────────────────────
export async function declineFriendRequest(myUid, fromUid) {
  await remove(ref(db, `friendRequests/${myUid}/${fromUid}`));
  return { success: true };
}

// ─── Supprime un ami ─────────────────────────────────────────────
export async function removeFriend(myUid, friendUid) {
  await remove(ref(db, `friends/${myUid}/${friendUid}`));
  await remove(ref(db, `friends/${friendUid}/${myUid}`));
  return { success: true };
}

// ─── Listeners Firebase ──────────────────────────────────────────
export function listenFriendRequests(uid, callback) {
  return onValue(ref(db, `friendRequests/${uid}`), snap => {
    const requests = [];
    if (snap.exists()) snap.forEach(c => requests.push({ uid: c.key, ...c.val() }));
    callback(requests);
  });
}

export function listenFriends(uid, callback) {
  return onValue(ref(db, `friends/${uid}`), snap => {
    const friends = [];
    if (snap.exists()) snap.forEach(c => friends.push({ uid: c.key, ...c.val() }));
    callback(friends);
  });
}

// ─── Charge profil + collection d'un ami depuis players/ ─────────
export async function loadFriendProfile(uid) {
  const snap = await get(ref(db, `players/${uid}`));
  return snap.exists() ? { uid, ...snap.val() } : null;
}

export async function loadFriendCollection(uid) {
  const snap = await get(ref(db, `saves/${uid}`));
  if (!snap.exists()) return [];
  return snap.val().collection || [];
}
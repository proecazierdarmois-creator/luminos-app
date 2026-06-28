// store/profileService.js
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { ref, set, get, onValue, push, serverTimestamp } from 'firebase/database';
import { getPlayerId, getPlayerName } from './marketService';

function getCurrentId() {
  return auth.currentUser?.uid || getPlayerId();
}

// ─── Initialise ou met à jour le profil ──────────────────────────
export async function initProfile(name) {
  const id = getCurrentId();
  const profileRef = ref(db, `players/${id}`);
  const snap = await get(profileRef);

  if (!snap.exists()) {
    await set(profileRef, {
      name,
      createdAt: serverTimestamp(),
      wins: 0,
      losses: 0,
      summonCount: 0,
      totalSold: 0,
      totalBought: 0,
      crystalsEarned: 0,
    });
  } else {
    await set(ref(db, `players/${id}/name`), name);
  }
}

// ─── Enregistre une vente ─────────────────────────────────────────
export async function recordSale(creature, price) {
  const id = getCurrentId();
  const txRef = ref(db, `players/${id}/transactions`);
  await push(txRef, {
    type: 'sale',
    creatureId:   creature.id,
    creatureName: creature.name,
    rarityColor:  creature.rarityColor,
    rarityLabel:  creature.rarityLabel,
    price,
    at: serverTimestamp(),
  });
  const profileRef = ref(db, `players/${id}`);
  const snap = await get(profileRef);
  if (snap.exists()) {
    const p = snap.val();
    await set(ref(db, `players/${id}/totalSold`),      (p.totalSold || 0) + 1);
    await set(ref(db, `players/${id}/crystalsEarned`), (p.crystalsEarned || 0) + price);
  }
}

// ─── Enregistre un achat ──────────────────────────────────────────
export async function recordPurchase(creature, price) {
  const id = getCurrentId();
  const txRef = ref(db, `players/${id}/transactions`);
  await push(txRef, {
    type: 'purchase',
    creatureId:   creature.id,
    creatureName: creature.name,
    rarityColor:  creature.rarityColor,
    rarityLabel:  creature.rarityLabel,
    price,
    at: serverTimestamp(),
  });
  const profileRef = ref(db, `players/${id}`);
  const snap = await get(profileRef);
  if (snap.exists()) {
    const p = snap.val();
    await set(ref(db, `players/${id}/totalBought`), (p.totalBought || 0) + 1);
  }
}

// ─── Écoute le profil en temps réel ──────────────────────────────
export function subscribeToProfile(callback) {
  const id = getCurrentId();
  const profileRef = ref(db, `players/${id}`);
  const unsub = onValue(profileRef, snap => {
    callback(snap.exists() ? snap.val() : null);
  });
  return unsub;
}

// ─── Récupère les transactions (dernières 20) ─────────────────────
export async function getTransactions() {
  const id = getCurrentId();
  const txRef = ref(db, `players/${id}/transactions`);
  const snap = await get(txRef);
  if (!snap.exists()) return [];
  const txs = Object.values(snap.val());
  return txs.sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 20);
}
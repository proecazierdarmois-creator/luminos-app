// store/marketService.js
// Toutes les opérations Firebase pour le marché P2P

import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import {
  ref, push, set, get, remove, onValue, off, serverTimestamp, query, orderByChild, limitToLast,
} from 'firebase/database';

// ─── Structure d'un listing ───────────────────────────────────────
// {
//   id: string (Firebase key)
//   sellerId: string
//   sellerName: string
//   creature: { id, name, rarity, rarityColor, stats, ... }
//   price: number (cristaux)
//   createdAt: timestamp
// }

// Génère un ID joueur persistant (basé sur timestamp + random)
let _playerId = null;
let _playerName = null;

export function getPlayerId() {
  // Priorité au uid Firebase
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  if (!_playerId) {
    _playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
  return _playerId;
}

export function setPlayerName(name) {
  _playerName = name;
}

export function getPlayerName() {
  return _playerName || 'Joueur inconnu';
}

// ─── Mettre en vente ─────────────────────────────────────────────
export async function createListing(creature, price, sellerName) {
  const listingsRef = ref(db, 'market/listings');
  const newRef = push(listingsRef);
  await set(newRef, {
    sellerId:   getPlayerId(),
    sellerName: sellerName || getPlayerName(),
    creature:   {
      id:          creature.id,
      name:        creature.name,
      number:      creature.number,
      rarity:      creature.rarity,
      rarityLabel: creature.rarityLabel,
      rarityColor: creature.rarityColor,
      type:        creature.type,
      stats:       creature.stats,
      uid:         creature.uid || null,
    },
    price,
    createdAt: serverTimestamp(),
  });
  return newRef.key;
}

// ─── Supprimer un listing (vendeur annule) ────────────────────────
export async function removeListing(listingId) {
  await remove(ref(db, `market/listings/${listingId}`));
}

// ─── Acheter un listing ───────────────────────────────────────────
export async function buyListing(listingId, listing) {
  // 1. Supprime le listing
  await remove(ref(db, `market/listings/${listingId}`));

  // 2. Enregistre dans l'historique
  const histRef = ref(db, `market/history/${listing.creature.id}`);
  const newHist = push(histRef);
  await set(newHist, {
    price:      listing.price,
    soldAt:     serverTimestamp(),
    sellerName: listing.sellerName,
    buyerId:    getPlayerId(),
  });

  // 3. Crédite les cristaux au vendeur
  const sellerCrystalsRef = ref(db, `players/${listing.sellerId}/pendingCrystals`);
  const current = await get(sellerCrystalsRef);
  const currentVal = current.exists() ? (current.val() || 0) : 0;
  await set(sellerCrystalsRef, currentVal + listing.price);
}

// ─── Récupère les cristaux en attente (appel au login) ────────────
export async function claimPendingCrystals(uid, addCrystalsFn) {
  const pendingRef = ref(db, `players/${uid}/pendingCrystals`);
  const snap = await get(pendingRef);
  if (snap.exists() && snap.val() > 0) {
    const amount = snap.val();
    addCrystalsFn(amount);
    await set(pendingRef, 0);
    return amount;
  }
  return 0;
}

// ─── Écouter les listings en temps réel ──────────────────────────
export function subscribeToListings(callback) {
  const listingsRef = ref(db, 'market/listings');
  onValue(listingsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const listings = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    // Tri par date décroissante
    listings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(listings);
  });
  return () => off(listingsRef); // retourne unsubscribe
}

// ─── Historique des prix pour une créature ────────────────────────
export async function getPriceHistory(creatureId) {
  const histRef = query(
    ref(db, `market/history/${creatureId}`),
    orderByChild('soldAt'),
    limitToLast(10)
  );
  const snap = await get(histRef);
  if (!snap.exists()) return [];
  return Object.values(snap.val()).reverse();
}
// store/xpService.js — Système de niveaux et XP
import { db } from '../config/firebase';
import { ref, set, get, onValue } from 'firebase/database';

// ─── XP par action ────────────────────────────────────────────────
export const XP_REWARDS = {
  win:      50,   // Victoire en combat
  loss:     10,   // Défaite (on apprend)
  summon:   20,   // Invocation
  capture:  30,   // Capture dans le monde
  trade:    40,   // Échange complété
  quest:    60,   // Quête terminée
  shiny:    100,  // Créature Shiny obtenue
  legendary:80,   // Créature Légendaire obtenue
  daily:    25,   // Connexion quotidienne
};

// ─── XP requis par niveau ─────────────────────────────────────────
export function xpForLevel(level) {
  // Progression croissante : niveau 1 = 100 XP, niveau 100 = 10000 XP
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

export function getLevelFromXp(totalXp) {
  let level = 1;
  let xpUsed = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (xpUsed + needed > totalXp) break;
    xpUsed += needed;
    level++;
    if (level >= 100) break;
  }
  return { level, currentXp: totalXp - xpUsed, neededXp: xpForLevel(level) };
}

// ─── Récompenses par niveau ───────────────────────────────────────
export const LEVEL_REWARDS = {
  5:   { crystals: 50,  title: '🌱 Apprenti',      creature: null },
  10:  { crystals: 100, title: '⭐ Explorateur',    creature: 'pyrox' },
  15:  { crystals: 150, title: '🔥 Aventurier',     creature: null },
  20:  { crystals: 200, title: '💎 Collectionneur', creature: 'glacix' },
  25:  { crystals: 300, title: '⚡ Champion',        creature: null },
  30:  { crystals: 400, title: '🌊 Maître',          creature: 'spectrox' },
  40:  { crystals: 500, title: '🌟 Légende',         creature: null },
  50:  { crystals: 750, title: '👑 Grand Maître',    creature: 'ventis' },
  75:  { crystals:1000, title: '🐉 Gardien',         creature: 'stormyx' },
  100: { crystals:2000, title: '🌌 LUMINOS',         creature: 'luminos' },
};

// ─── Firebase ─────────────────────────────────────────────────────
export async function getXpData(uid) {
  const snap = await get(ref(db, `xp/${uid}`));
  if (snap.exists()) return snap.val();
  return { totalXp: 0, level: 1, claimedLevels: {} };
}

export async function addXp(uid, amount, addCrystalsFn, addToCollectionFn, ALL_CREATURES) {
  const snap = await get(ref(db, `xp/${uid}`));
  const data = snap.exists() ? snap.val() : { totalXp: 0, level: 1, claimedLevels: {} };

  const newTotalXp = (data.totalXp || 0) + amount;
  const { level, currentXp, neededXp } = getLevelFromXp(newTotalXp);

  // Vérifie les récompenses de niveau
  const newClaimed = { ...(data.claimedLevels || {}) };
  const rewards = [];

  for (let lvl = (data.level || 1) + 1; lvl <= level; lvl++) {
    if (LEVEL_REWARDS[lvl] && !newClaimed[lvl]) {
      const reward = LEVEL_REWARDS[lvl];
      newClaimed[lvl] = true;
      rewards.push({ level: lvl, ...reward });
      if (reward.crystals && addCrystalsFn) addCrystalsFn(reward.crystals);
      if (reward.creature && addToCollectionFn && ALL_CREATURES?.[reward.creature]) {
        addToCollectionFn({ ...ALL_CREATURES[reward.creature] });
      }
    }
  }

  const newData = {
    totalXp: newTotalXp,
    level,
    currentXp,
    neededXp,
    claimedLevels: newClaimed,
    updatedAt: Date.now(),
  };

  await set(ref(db, `xp/${uid}`), newData).catch(() => {});
  return { ...newData, rewards, leveledUp: level > (data.level || 1) };
}

export function listenXp(uid, callback) {
  return onValue(ref(db, `xp/${uid}`), snap => {
    if (snap.exists()) callback(snap.val());
    else callback({ totalXp: 0, level: 1, currentXp: 0, neededXp: 100, claimedLevels: {} });
  });
}
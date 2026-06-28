// store/useGameStore.js
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { ref, set, get } from 'firebase/database';

const STORAGE_KEY = '@luminos_save';

const DEFAULT_STATE = {
  collection:  [],
  crystals:    50,
  summonCount: 0,
  wins:        0,
  losses:      0,
};

let _setState = null;
let _state    = DEFAULT_STATE;
let _uidCounter = 1;

function genUid() { return `c_${Date.now()}_${_uidCounter++}`; }

let _currentUid = null;
export function setStoreUid(uid) { _currentUid = uid; }

async function persist(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (_currentUid) {
      await set(ref(db, `saves/${_currentUid}`), {
        collection:  state.collection,
        crystals:    state.crystals,
        wins:        state.wins,
        losses:      state.losses,
        summonCount: state.summonCount,
        updatedAt:   Date.now(),
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Save error:', e);
  }
}

export async function loadFromFirebase(uid) {
  try {
    const snap = await get(ref(db, `saves/${uid}`));
    if (snap.exists()) return snap.val();
  } catch (e) {}
  return null;
}

async function load() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function useGameStore() {
  const [state, setState] = useState(_state);

  useEffect(() => {
    _setState = setState;
    load().then(saved => {
      if (saved) { _state = saved; setState(saved); }
    });
  }, []);

  // ── Ajouter à la collection SANS déduire de cristaux
  // (utilisé par le marché, les boîtes, l'admin, les récompenses)
  const addToCollection = useCallback((creature) => {
    const entry = { ...creature, uid: creature.uid || genUid(), obtainedAt: Date.now() };
    const next = {
      ..._state,
      collection: [..._state.collection, entry],
    };
    _state = next; setState(next); persist(next);
    return entry;
  }, []);

  // ── Invoquer une créature (déduit 3 cristaux + incrémente summonCount)
  const summonCreature = useCallback((creature) => {
    if (_state.crystals < 3) return null;
    const entry = { ...creature, uid: genUid(), obtainedAt: Date.now() };
    const next = {
      ..._state,
      collection:  [..._state.collection, entry],
      summonCount: _state.summonCount + 1,
      crystals:    _state.crystals - 3,
    };
    _state = next; setState(next); persist(next);
    return entry;
  }, []);

  // ── Cristaux (positif = gain, négatif = dépense)
  const addCrystals = useCallback((amount) => {
    const next = { ..._state, crystals: Math.max(0, _state.crystals + amount) };
    _state = next; setState(next); persist(next);
  }, []);

  // ── Victoire / défaite
  const recordBattle = useCallback((won) => {
    const next = {
      ..._state,
      wins:     won ? _state.wins + 1 : _state.wins,
      losses:   won ? _state.losses   : _state.losses + 1,
      crystals: won ? _state.crystals + 2 : _state.crystals,
    };
    _state = next; setState(next); persist(next);
  }, []);

  // ── Retirer une créature de la collection (marché P2P)
  const removeFromCollection = useCallback((creatureUid) => {
    const next = {
      ..._state,
      collection: _state.collection.filter(c => c.uid !== creatureUid),
    };
    _state = next; setState(next); persist(next);
  }, []);

  // ── Incrémenter summonCount (pour les boîtes sans déduire)
  const incrementSummon = useCallback(() => {
    const next = { ..._state, summonCount: _state.summonCount + 1 };
    _state = next; setState(next); persist(next);
  }, []);

  // ── Reset
  const resetGame = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    _state = DEFAULT_STATE; setState(DEFAULT_STATE);
  }, []);

  // ── Recharge depuis Firebase (appelé par AuthContext)
  const reloadFromFirebase = useCallback(async (uid) => {
    const saved = await loadFromFirebase(uid);
    if (saved) { _state = saved; setState(saved); }
  }, []);

  return {
    ...state,
    canSummon: state.crystals >= 3,
    addToCollection,
    summonCreature,
    addCrystals,
    recordBattle,
    removeFromCollection,
    incrementSummon,
    resetGame,
    reloadFromFirebase,
    uniqueCount: new Set(state.collection.map(c => c.id)).size,
  };
}
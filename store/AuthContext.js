// store/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';
import { ref, set } from 'firebase/database';
import { setPlayerName, getPlayerId, claimPendingCrystals } from './marketService';
import { setStoreUid, loadFromFirebase } from './useGameStore';
import { initProfile } from './profileService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      getRedirectResult(auth).then(async result => {
        if (result?.user) {
          const name = result.user.displayName || result.user.email?.split('@')[0] || 'Joueur';
          setPlayerName(name);
          await initProfile(name);
          setUser(result.user);
          setLoading(false);
        }
      }).catch(() => {});
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setStoreUid(firebaseUser.uid);

        // Charge depuis Firebase — écrase AsyncStorage local
        const firebaseSave = await loadFromFirebase(firebaseUser.uid);
        if (firebaseSave) {
          await AsyncStorage.setItem('@luminos_save', JSON.stringify(firebaseSave)).catch(() => {});
        } else {
          await AsyncStorage.removeItem('@luminos_save').catch(() => {});
        }
        await AsyncStorage.setItem('@luminos_last_uid', firebaseUser.uid).catch(() => {});

        setUser(firebaseUser);
        // Met à jour lastSeen
        set(ref(db,`players/${firebaseUser.uid}/lastSeen`), Date.now()).catch(()=>{});
        const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Joueur';
        setPlayerName(name);
        await initProfile(name);

        // Récupère les cristaux en attente (ventes marché)
        await claimPendingCrystals(firebaseUser.uid, async (amount) => {
          // Met à jour le save Firebase avec les cristaux récupérés
          const save = await loadFromFirebase(firebaseUser.uid);
          if (save) {
            const newSave = { ...save, crystals: (save.crystals || 0) + amount };
            await AsyncStorage.setItem('@luminos_save', JSON.stringify(newSave)).catch(() => {});
          }
        });

      } else {
        setStoreUid(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  async function signUpEmail(email, password, displayName) {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      setPlayerName(displayName);
      await initProfile(displayName);
      return { success: true };
    } catch (e) {
      const msg = friendlyError(e.code);
      setError(msg);
      return { success: false, error: msg };
    }
  }

  async function signInEmail(email, password) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      const msg = friendlyError(e.code);
      setError(msg);
      return { success: false, error: msg };
    }
  }

  async function signInGoogle() {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      if (Platform.OS === 'web') {
        await signInWithPopup(auth, provider);
      } else {
        await signInWithRedirect(auth, provider);
      }
      return { success: true };
    } catch (e) {
      const msg = friendlyError(e.code);
      setError(msg);
      return { success: false, error: msg };
    }
  }

  async function signInGithub() {
    setError(null);
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const name = result.user.displayName || result.user.email?.split('@')[0] || 'Joueur';
        setPlayerName(name);
        await initProfile(name);
        setUser(result.user);
      }
      return { success: true };
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
          return { success: true };
        } catch (e2) {
          const msg = friendlyError(e2.code);
          setError(msg);
          return { success: false, error: msg };
        }
      } else {
        const msg = friendlyError(e.code);
        setError(msg);
        return { success: false, error: msg };
      }
    }
  }

  async function signInFacebook() {
    setError(null);
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const name = result.user.displayName || result.user.email?.split('@')[0] || 'Joueur';
        setPlayerName(name);
        await initProfile(name);
        setUser(result.user);
      }
      return { success: true };
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
        try { await signInWithRedirect(auth, provider); return { success: true }; }
        catch (e2) { const msg = friendlyError(e2.code); setError(msg); return { success: false }; }
      }
      const msg = friendlyError(e.code); setError(msg); return { success: false };
    }
  }

  async function signInMicrosoft() {
    setError(null);
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const name = result.user.displayName || result.user.email?.split('@')[0] || 'Joueur';
        setPlayerName(name);
        await initProfile(name);
        setUser(result.user);
      }
      return { success: true };
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
        try { await signInWithRedirect(auth, provider); return { success: true }; }
        catch (e2) { const msg = friendlyError(e2.code); setError(msg); return { success: false }; }
      }
      const msg = friendlyError(e.code); setError(msg); return { success: false };
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, signUpEmail, signInEmail, signInGoogle, signInGithub, signInFacebook, signInMicrosoft, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':   return 'Cet email est déjà utilisé.';
    case 'auth/invalid-email':           return 'Email invalide.';
    case 'auth/weak-password':           return 'Mot de passe trop court (6 caractères min).';
    case 'auth/user-not-found':          return 'Aucun compte avec cet email.';
    case 'auth/wrong-password':          return 'Mot de passe incorrect.';
    case 'auth/invalid-credential':      return 'Email ou mot de passe incorrect.';
    case 'auth/too-many-requests':       return 'Trop de tentatives. Réessaie plus tard.';
    case 'auth/popup-closed-by-user':    return 'Connexion annulée.';
    case 'auth/popup-blocked':           return 'Popup bloqué. Autoriser les popups pour ce site.';
    case 'auth/network-request-failed':  return 'Erreur réseau. Vérifie ta connexion.';
    case 'auth/account-exists-with-different-credential': return 'Un compte existe déjà avec cet email.';
    default: return 'Une erreur est survenue. Réessaie.';
  }
}
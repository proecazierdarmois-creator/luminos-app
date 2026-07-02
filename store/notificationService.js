// store/notificationService.js — Notifications push Expo
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { ref, set, get } from 'firebase/database';

// Config handler (affichage des notifs quand l'app est ouverte)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Enregistrer le token push ────────────────────────────────────
export async function registerPushToken(uid) {
  if (Platform.OS === 'web') return null; // Web push nécessite service worker

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'luminos-app', // Remplace par ton EAS project ID si nécessaire
    })).data;

    // Sauvegarder le token dans Firebase
    if (uid && token) {
      await set(ref(db, `pushTokens/${uid}`), {
        token, platform: Platform.OS, updatedAt: Date.now(),
      }).catch(() => {});
    }

    return token;
  } catch (e) {
    console.log('Push token error:', e);
    return null;
  }
}

// ─── Envoyer une notif locale (immédiate, sans serveur) ──────────
export async function sendLocalNotification({ title, body, data = {} }) {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null, // immédiat
    });
  } catch (e) {
    console.log('Local notif error:', e);
  }
}

// ─── Notif planifiée (ex: dans X secondes) ───────────────────────
export async function scheduleNotification({ title, body, seconds, data = {} }) {
  if (Platform.OS === 'web') return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: { seconds },
    });
    return id;
  } catch (e) {
    console.log('Schedule notif error:', e);
    return null;
  }
}

export async function cancelNotification(id) {
  if (!id || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// ─── Sauvegarder les préférences de notifications ────────────────
export async function saveNotifPrefs(uid, prefs) {
  await set(ref(db, `notifPrefs/${uid}`), prefs).catch(() => {});
}

export async function getNotifPrefs(uid) {
  const snap = await get(ref(db, `notifPrefs/${uid}`));
  return snap.exists() ? snap.val() : {
    eclipse: true,
    tournament: true,
    reward: true,
    guild: true,
  };
}

// ─── Notifs spécifiques LUMINOS ──────────────────────────────────
export async function notifyEclipseStarted() {
  await sendLocalNotification({
    title: '🌑 Éclipse en cours !',
    body: 'LUMINOS est apparu ! Cours le capturer avant la fin de l\'Éclipse.',
    data: { screen: 'Eclipse' },
  });
}

export async function notifyTournamentResult(rank, crystals) {
  await sendLocalNotification({
    title: '🏆 Tournoi terminé !',
    body: rank === 1
      ? `Tu es CHAMPION ! +${crystals} 💎 t'attendent dans ta boîte.`
      : `Tu as terminé #${rank}. +${crystals} 💎 dans ta boîte de réception !`,
    data: { screen: 'Inbox' },
  });
}

export async function notifyUnclaimedReward(count) {
  await sendLocalNotification({
    title: '🎁 Récompenses en attente !',
    body: `Tu as ${count} récompense${count > 1 ? 's' : ''} non récupérée${count > 1 ? 's' : ''} dans ta boîte.`,
    data: { screen: 'Inbox' },
  });
}

export async function notifyGuildChallenge(guildName) {
  await sendLocalNotification({
    title: '⚔️ Défi de guilde !',
    body: `Nouveau défi disponible pour ${guildName}. Rejoins tes alliés !`,
    data: { screen: 'GuildChallenge' },
  });
}
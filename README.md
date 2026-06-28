# LUMINOS — App Mobile V1

Jeu de collection mobile React Native (Expo) avec 4 créatures, système de tirage, combat tour par tour, et persistance locale.

---

## 🚀 Installation (5 minutes)

### Prérequis
- Node.js 18+ : https://nodejs.org
- Expo Go sur ton téléphone : App Store ou Google Play

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npx expo start

# 3. Scanner le QR code avec Expo Go sur ton téléphone
```

C'est tout. L'app tourne directement sur ton téléphone via Expo Go, sans avoir besoin de compiler ni de compte développeur Apple/Google.

---

## 📁 Structure

```
luminos-app/
├── App.js                    ← Navigation (3 onglets)
├── data/creatures.js         ← Données des 4 créatures + drop rates
├── store/useGameStore.js     ← État global persisté (AsyncStorage)
├── components/CreatureCard.js ← Carte + sprites SVG animés
├── screens/
│   ├── CollectionScreen.js   ← Pokédex + stats globales
│   ├── SummonScreen.js       ← Gacha + historique des tirages
│   └── BattleScreen.js       ← Combat tour par tour
```

---

## 🎮 Fonctionnalités V1

| Feature | Statut |
|---|---|
| 4 créatures avec sprites SVG | ✅ |
| Drop rates réels (60/25/10/5%) | ✅ |
| Animation d'invocation | ✅ |
| Pokédex avec créatures verrouillées | ✅ |
| Combat tour par tour | ✅ |
| Persistance locale (AsyncStorage) | ✅ |
| Cristaux comme monnaie in-game | ✅ |
| Historique des tirages | ✅ |

---

## 🔮 Prochaines étapes V2

- Carte monde avec géolocalisation (react-native-maps)
- Évolution des créatures (3 cristaux + niveau)
- Marché P2P entre joueurs (Firebase Realtime DB)
- Événements temporels (heure réelle)
- 20+ créatures supplémentaires
- Système Shiny (fusion de 3 identiques)
- Notifications push pour événements Eclipse

---

## 🛠 Stack technique

- **Expo** ~51 — framework React Native simplifié
- **React Navigation** — tabs + navigation
- **AsyncStorage** — persistance locale
- **Expo LinearGradient** — effets visuels
- **react-native-svg** — sprites vectoriels animés

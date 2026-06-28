// screens/MarketScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Modal, ScrollView, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { SPRITES } from '../components/CreatureCard';
import { CREATURES } from '../data/creatures';
import {
  createListing, removeListing, buyListing,
  subscribeToListings, getPriceHistory,
  getPlayerId, getPlayerName, setPlayerName,
} from '../store/marketService';
import { recordSale, recordPurchase, initProfile } from '../store/profileService';

// ─── Tabs ─────────────────────────────────────────────────────────
const TABS = ['Parcourir', 'Mes ventes', 'Vendre'];

export default function MarketScreen() {
  const { collection, crystals, addToCollection, addCrystals } = useGameStore();
  const [tab, setTab] = useState('Parcourir');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerNameLocal] = useState(getPlayerName());
  const [nameSet, setNameSet] = useState(getPlayerName() !== 'Joueur inconnu');

  // Sell flow
  const [sellCreature, setSellCreature] = useState(null);
  const [sellPrice, setSellPrice] = useState('5');
  const [selling, setSelling] = useState(false);
  const [sellSuccess, setSellSuccess] = useState(false);

  // Buy flow
  const [buyTarget, setBuyTarget] = useState(null);
  const [buying, setBuying] = useState(false);

  // History modal
  const [histCreature, setHistCreature] = useState(null);
  const [history, setHistory] = useState([]);

  const playerId = getPlayerId();

  // Subscribe to listings
  useEffect(() => {
    const unsub = subscribeToListings((data) => {
      setListings(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Créatures possédées (avec uid)
  const ownedCreatures = collection.filter(
    c => !listings.find(l => l.creature.uid === c.uid && l.sellerId === playerId)
  );

  // Mes listings actifs
  const myListings = listings.filter(l => l.sellerId === playerId);
  const otherListings = listings.filter(l => l.sellerId !== playerId);
  async function handleSell() {
    if (!sellCreature || !sellPrice || selling) return;
    const price = parseInt(sellPrice);
    if (isNaN(price) || price < 1) return;
    setSelling(true);
    try {
      await createListing(sellCreature, price, playerName);
      await recordSale(sellCreature, price);
      setSellSuccess(true);
      setSellCreature(null);
      setSellPrice('5');
      setTimeout(() => { setSellSuccess(false); setTab('Mes ventes'); }, 1500);
    } catch (e) {
      console.error(e);
    }
    setSelling(false);
  }

  async function handleCancel(listingId) {
    await removeListing(listingId);
  }

  async function handleBuy(listing) {
    if (crystals < listing.price || buying) return;
    setBuying(true);
    try {
      await buyListing(listing.id, listing);
      await recordPurchase(listing.creature, listing.price);
      addToCollection({ ...CREATURES[listing.creature.id], uid: listing.creature.uid });
      addCrystals(-listing.price);
      setBuyTarget(null);
    } catch (e) {
      console.error(e);
    }
    setBuying(false);
  }

  async function handleShowHistory(creatureId) {
    setHistCreature(creatureId);
    const hist = await getPriceHistory(creatureId);
    setHistory(hist);
  }

  // ── Name setup ──
  if (!nameSet) {
    return (
      <LinearGradient colors={['#07090f', '#0d1220', '#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.nameSetup}>
            <Text style={styles.title}>MARCHÉ</Text>
            <Text style={styles.namePrompt}>Choisis ton nom de vendeur</Text>
            <TextInput
              style={styles.nameInput}
              value={playerName}
              onChangeText={setPlayerNameLocal}
              placeholder="Ex: LuminosMaster42"
              placeholderTextColor="#4a6080"
              maxLength={20}
            />
            <TouchableOpacity
              onPress={() => { setPlayerName(playerName); setNameSet(true); }}
              style={styles.nameBtn}
              disabled={!playerName.trim()}
            >
              <LinearGradient colors={['#00e5ff33', '#bf5fff33']} style={styles.nameBtnGrad}>
                <Text style={styles.nameBtnText}>Entrer dans le marché →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#07090f', '#0d1220', '#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>MARCHÉ P2P</Text>

        {/* Crystal balance */}
        <View style={styles.crystalBar}>
          <Text style={styles.crystalText}>💎 {crystals} cristaux</Text>
          <Text style={styles.playerTag}>@{playerName}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB: Parcourir ── */}
        {tab === 'Parcourir' && (
          <>
            {loading ? (
              <ActivityIndicator color="#00e5ff" style={{ marginTop: 40 }} />
            ) : otherListings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucune offre disponible</Text>
                <Text style={styles.emptySubtext}>Sois le premier à vendre une créature !</Text>
              </View>
            ) : (
              <FlatList
                data={otherListings}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const Sprite = SPRITES[item.creature.id] || SPRITES.lumikos;
                  const canAfford = crystals >= item.price;
                  return (
                    <LinearGradient
                      colors={['#0d1220', '#07090f']}
                      style={[styles.listingCard, { borderColor: item.creature.rarityColor + '44' }]}
                    >
                      <View style={styles.listingLeft}>
                        <Sprite size={56} />
                      </View>
                      <View style={styles.listingMid}>
                        <Text style={[styles.listingName, { color: item.creature.rarityColor }]}>
                          {item.creature.name}
                        </Text>
                        <Text style={styles.listingRarity}>{item.creature.rarityLabel}</Text>
                        <Text style={styles.listingSeller}>par @{item.sellerName}</Text>
                        <TouchableOpacity onPress={() => handleShowHistory(item.creature.id)}>
                          <Text style={styles.histLink}>📈 Historique prix</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.listingRight}>
                        <Text style={[styles.listingPrice, { color: canAfford ? '#ffd700' : '#ff4444' }]}>
                          💎 {item.price}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setBuyTarget(item)}
                          style={[styles.buyBtn, !canAfford && styles.disabled]}
                          disabled={!canAfford}
                        >
                          <Text style={styles.buyBtnText}>{canAfford ? 'Acheter' : 'Insuffisant'}</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  );
                }}
              />
            )}
          </>
        )}

        {/* ── TAB: Mes ventes ── */}
        {tab === 'Mes ventes' && (
          <>
            {myListings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucune vente en cours</Text>
                <TouchableOpacity onPress={() => setTab('Vendre')}>
                  <Text style={[styles.emptySubtext, { color: '#00e5ff' }]}>→ Mettre une créature en vente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={myListings}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const Sprite = SPRITES[item.creature.id] || SPRITES.lumikos;
                  return (
                    <LinearGradient
                      colors={['#0d1220', '#07090f']}
                      style={[styles.listingCard, { borderColor: item.creature.rarityColor + '44' }]}
                    >
                      <View style={styles.listingLeft}>
                        <Sprite size={56} />
                      </View>
                      <View style={styles.listingMid}>
                        <Text style={[styles.listingName, { color: item.creature.rarityColor }]}>
                          {item.creature.name}
                        </Text>
                        <Text style={styles.listingRarity}>{item.creature.rarityLabel}</Text>
                        <Text style={[styles.listingSeller, { color: '#39ff8f' }]}>En vente</Text>
                      </View>
                      <View style={styles.listingRight}>
                        <Text style={styles.listingPrice}>💎 {item.price}</Text>
                        <TouchableOpacity
                          onPress={() => handleCancel(item.id)}
                          style={styles.cancelBtn}
                        >
                          <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  );
                }}
              />
            )}
          </>
        )}

        {/* ── TAB: Vendre ── */}
        {tab === 'Vendre' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.sellContainer}>
              {sellSuccess && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✓ Créature mise en vente !</Text>
                </View>
              )}

              <Text style={styles.sellLabel}>Choisis une créature à vendre</Text>

              {ownedCreatures.length === 0 ? (
                <Text style={styles.emptyText}>Aucune créature disponible à vendre</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.creatureScroll}>
                  {ownedCreatures.map(c => {
                    const Sprite = SPRITES[c.id] || SPRITES.lumikos;
                    const sel = sellCreature?.uid === c.uid;
                    return (
                      <TouchableOpacity
                        key={c.uid}
                        onPress={() => setSellCreature(c)}
                        style={[
                          styles.sellCreatureCard,
                          {
                            borderColor: sel ? c.rarityColor : c.rarityColor + '33',
                            backgroundColor: sel ? c.rarityColor + '22' : '#0d1220',
                          }
                        ]}
                      >
                        <Sprite size={52} />
                        <Text style={[styles.sellCreatureName, { color: c.rarityColor }]}>{c.name}</Text>
                        <Text style={styles.sellCreatureRarity}>{c.rarityLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {sellCreature && (
                <View style={styles.priceBox}>
                  <Text style={styles.sellLabel}>Prix de vente (💎 cristaux)</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={sellPrice}
                    onChangeText={setSellPrice}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="Ex: 10"
                    placeholderTextColor="#4a6080"
                  />
                  <Text style={styles.priceHint}>
                    Tarifs conseillés : Common 3-8 · Uncommon 8-20 · Rare 20-50 · Légendaire 50+
                  </Text>
                  <TouchableOpacity
                    onPress={handleSell}
                    style={styles.sellBtn}
                    disabled={selling}
                  >
                    <LinearGradient
                      colors={['#ffd70044', '#ffa50033']}
                      style={styles.sellBtnGrad}
                    >
                      <Text style={styles.sellBtnText}>
                        {selling ? 'Publication...' : `✦ Mettre en vente pour ${sellPrice} 💎`}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── Modal: Confirmer achat ── */}
        <Modal visible={!!buyTarget} transparent animationType="fade" onRequestClose={() => setBuyTarget(null)}>
          <View style={styles.modalOverlay}>
            {buyTarget && (() => {
              const Sprite = SPRITES[buyTarget.creature.id] || SPRITES.lumikos;
              return (
                <LinearGradient
                  colors={['#0d1220', '#07090f']}
                  style={[styles.modalBox, { borderColor: buyTarget.creature.rarityColor + '66' }]}
                >
                  <Text style={styles.modalTitle}>Confirmer l'achat</Text>
                  <Sprite size={90} />
                  <Text style={[styles.modalCreatureName, { color: buyTarget.creature.rarityColor }]}>
                    {buyTarget.creature.name}
                  </Text>
                  <Text style={styles.modalSeller}>Vendu par @{buyTarget.sellerName}</Text>
                  <View style={styles.modalPriceRow}>
                    <Text style={styles.modalBalance}>Ton solde : 💎 {crystals}</Text>
                    <Text style={styles.modalArrow}>→</Text>
                    <Text style={[styles.modalAfter, { color: crystals >= buyTarget.price ? '#39ff8f' : '#ff4444' }]}>
                      💎 {crystals - buyTarget.price}
                    </Text>
                  </View>
                  <View style={styles.modalBtns}>
                    <TouchableOpacity
                      onPress={() => handleBuy(buyTarget)}
                      style={[styles.modalConfirm, { borderColor: buyTarget.creature.rarityColor + '88' }]}
                      disabled={buying}
                    >
                      <Text style={[styles.modalConfirmText, { color: buyTarget.creature.rarityColor }]}>
                        {buying ? 'Achat...' : `Acheter — ${buyTarget.price} 💎`}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setBuyTarget(null)} style={styles.modalCancel}>
                      <Text style={styles.modalCancelText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              );
            })()}
          </View>
        </Modal>

        {/* ── Modal: Historique prix ── */}
        <Modal visible={!!histCreature} transparent animationType="fade" onRequestClose={() => setHistCreature(null)}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#0d1220', '#07090f']} style={[styles.modalBox, { borderColor: '#00e5ff44' }]}>
              <Text style={styles.modalTitle}>📈 Historique des prix</Text>
              {histCreature && (
                <Text style={[styles.modalCreatureName, { color: CREATURES[histCreature]?.rarityColor }]}>
                  {CREATURES[histCreature]?.name}
                </Text>
              )}
              {history.length === 0 ? (
                <Text style={styles.emptyText}>Aucune vente enregistrée</Text>
              ) : (
                history.map((h, i) => (
                  <View key={i} style={styles.histRow}>
                    <Text style={styles.histPrice}>💎 {h.price}</Text>
                    <Text style={styles.histSeller}>par @{h.sellerName}</Text>
                  </View>
                ))
              )}
              <TouchableOpacity onPress={() => setHistCreature(null)} style={[styles.modalCancel, { marginTop: 16 }]}>
                <Text style={styles.modalCancelText}>Fermer</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 6, textAlign: 'center', paddingTop: 16, marginBottom: 10 },
  crystalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0d1220', borderWidth: 1, borderColor: '#1e2d4a',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12,
  },
  crystalText: { color: '#ffd700', fontSize: 15, fontWeight: '700' },
  playerTag: { color: '#4a6080', fontSize: 12 },
  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#1e2d4a', backgroundColor: '#0d1220',
  },
  tabActive: { borderColor: '#00e5ff66', backgroundColor: '#00e5ff15' },
  tabText: { color: '#4a6080', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tabTextActive: { color: '#00e5ff' },
  // Listings
  listContent: { gap: 10, paddingBottom: 20 },
  listingCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16, padding: 12, gap: 10,
  },
  listingLeft: { width: 60, alignItems: 'center' },
  listingMid: { flex: 1, gap: 2 },
  listingName: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  listingRarity: { fontSize: 10, color: '#4a6080', letterSpacing: 1 },
  listingSeller: { fontSize: 11, color: '#4a6080' },
  histLink: { fontSize: 10, color: '#00e5ff', marginTop: 2 },
  listingRight: { alignItems: 'center', gap: 6 },
  listingPrice: { fontSize: 15, fontWeight: '900' },
  buyBtn: {
    backgroundColor: '#ffd70022', borderWidth: 1, borderColor: '#ffd70044',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  buyBtnText: { color: '#ffd700', fontSize: 11, fontWeight: '800' },
  cancelBtn: {
    backgroundColor: '#ff444422', borderWidth: 1, borderColor: '#ff444444',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  cancelBtnText: { color: '#ff4444', fontSize: 11, fontWeight: '800' },
  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: '#4a6080', fontSize: 14, textAlign: 'center' },
  emptySubtext: { color: '#4a6080', fontSize: 12, fontStyle: 'italic' },
  // Sell
  sellContainer: { paddingBottom: 40, gap: 16 },
  sellLabel: { color: '#c8daf0', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  creatureScroll: { flexGrow: 0 },
  sellCreatureCard: {
    alignItems: 'center', borderWidth: 1.5, borderRadius: 14,
    padding: 10, marginRight: 10, width: 90, gap: 4,
  },
  sellCreatureName: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  sellCreatureRarity: { fontSize: 8, color: '#4a6080' },
  priceBox: { gap: 10 },
  priceInput: {
    backgroundColor: '#0d1220', borderWidth: 1, borderColor: '#1e2d4a',
    borderRadius: 12, padding: 14, color: '#fff', fontSize: 20, fontWeight: '900',
    textAlign: 'center',
  },
  priceHint: { color: '#4a6080', fontSize: 10, lineHeight: 16 },
  sellBtn: { borderRadius: 14, overflow: 'hidden' },
  sellBtnGrad: {
    alignItems: 'center', paddingVertical: 16,
    borderWidth: 1, borderColor: '#ffd70033', borderRadius: 14,
  },
  sellBtnText: { color: '#ffd700', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  successBanner: {
    backgroundColor: '#39ff8f22', borderWidth: 1, borderColor: '#39ff8f44',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  successText: { color: '#39ff8f', fontSize: 14, fontWeight: '700' },
  // Name setup
  nameSetup: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  namePrompt: { color: '#c8daf0', fontSize: 16, textAlign: 'center' },
  nameInput: {
    width: '100%', backgroundColor: '#0d1220', borderWidth: 1, borderColor: '#1e2d4a',
    borderRadius: 14, padding: 16, color: '#fff', fontSize: 18, textAlign: 'center',
  },
  nameBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  nameBtnGrad: { alignItems: 'center', paddingVertical: 16, borderWidth: 1, borderColor: '#00e5ff33', borderRadius: 14 },
  nameBtnText: { color: '#00e5ff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'center', padding: 24 },
  modalBox: { borderWidth: 1, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  modalCreatureName: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  modalSeller: { color: '#4a6080', fontSize: 12 },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  modalBalance: { color: '#ffd700', fontSize: 14, fontWeight: '700' },
  modalArrow: { color: '#4a6080', fontSize: 16 },
  modalAfter: { fontSize: 14, fontWeight: '900' },
  modalBtns: { width: '100%', gap: 8, marginTop: 8 },
  modalConfirm: {
    borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  modalCancel: { alignItems: 'center', padding: 12 },
  modalCancelText: { color: '#4a6080', fontSize: 13 },
  // History
  histRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#1e2d4a' },
  histPrice: { color: '#ffd700', fontWeight: '700', fontSize: 14 },
  histSeller: { color: '#4a6080', fontSize: 12 },
  disabled: { opacity: 0.4 },
});
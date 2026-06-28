// screens/ShopScreen.js — Boutique complète (Skins + Cristaux + Boîtes + Marché)
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, TextInput, Modal, Linking, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Circle, Ellipse, Path } from 'react-native-svg';
import { db } from '../config/firebase';
import { ref, set, get, onValue, push, remove } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES, CREATURES, CREATURE_LIST } from '../data/creatures';
import {
  getPlayerName, getPlayerId, setPlayerName,
  createListing, removeListing, buyListing,
  subscribeToListings, getPriceHistory, recordSale, recordPurchase,
} from '../store/marketService';

const { width: SW } = Dimensions.get('window');

// ─── Stripe Links ─────────────────────────────────────────────────
const STRIPE = {
  // Cristaux
  pack100:  'https://buy.stripe.com/test_00w28r2KFcrP5mYaKidnW00',
  pack500:  'https://buy.stripe.com/test_8x2eVd3OJgI5g1C5pYdnW01',
  pack1000: 'https://buy.stripe.com/test_4gM9ATclfgI516I7y6dnW02',
  premium:  'https://buy.stripe.com/test_bJe6oH70VajHbLm6u2dnW03',
  // Boîtes
  box_common:    'https://buy.stripe.com/test_cNi8wPbhbcrPbLmbOmdnW04',
  box_rare:      'https://buy.stripe.com/test_8x2cN5gBv2Rf6r24lUdnW05',
  box_legendary: 'https://buy.stripe.com/test_14AdR9etn9fDeXyf0ydnW06',
  box_mega:      'https://buy.stripe.com/test_aFa5ad7crP3eQcSqdnW07',
};

// ─── Boîtes ───────────────────────────────────────────────────────
const BOXES = [
  { id:'common',    name:'Boîte Lumière',    price:10,  realPrice:'0,50€', emoji:'📦', color:'#00e5ff', gradient:['#0d1a2e','#0a2040'], description:'Common/Uncommon garantie', pityMax:10, shinyChance:0.005,
    drops:[{rarity:'common',weight:70},{rarity:'uncommon',weight:27},{rarity:'rare',weight:3}] },
  { id:'rare',      name:'Boîte Cristal',    price:30,  realPrice:'1,29€', emoji:'🔷', color:'#bf5fff', gradient:['#100018','#180028'], description:'Rare garantie + chance Shiny', pityMax:5,  shinyChance:0.03,
    drops:[{rarity:'uncommon',weight:40},{rarity:'rare',weight:50},{rarity:'legendary',weight:10}] },
  { id:'legendary', name:'Boîte Légendaire', price:100, realPrice:'3,99€', emoji:'⭐', color:'#ffd700', gradient:['#1a1000','#2a1800'], description:'Rare/Légendaire + haute chance Shiny', pityMax:3, shinyChance:0.10,
    drops:[{rarity:'rare',weight:60},{rarity:'legendary',weight:40}] },
  { id:'mega',      name:'Méga Boîte',       price:250, realPrice:'8,99€', emoji:'🌟', color:'#ffa500', gradient:['#0a0018','#150030'], description:'Légendaire garantie + Shiny possible', pityMax:1, shinyChance:0.20,
    drops:[{rarity:'legendary',weight:100}] },
];

// ─── Cristaux ─────────────────────────────────────────────────────
const CRYSTAL_PACKS = [
  { id:'pack100',  name:'Pack Starter',    crystals:100,  price:'0,99€', emoji:'💎',    color:'#00e5ff', gradient:['#0d1a2e','#0a2040'], badge:null,              perCrystal:'0,01€/💎' },
  { id:'pack500',  name:'Pack Aventurier', crystals:500,  price:'3,99€', emoji:'💎💎',  color:'#bf5fff', gradient:['#100018','#180028'], badge:'POPULAIRE',       perCrystal:'0,008€/💎', bonus:'+50 bonus' },
  { id:'pack1000', name:'Pack Légendaire', crystals:1000, price:'6,99€', emoji:'💎💎💎',color:'#ffd700', gradient:['#1a1000','#2a1800'], badge:'MEILLEURE VALEUR', perCrystal:'0,007€/💎', bonus:'+150 bonus' },
];

const PREMIUM_PERKS = [
  {icon:'💎',text:'+50 cristaux par jour'},{icon:'✨',text:'Créature exclusive mensuelle'},
  {icon:'👑',text:'Badge Premium sur le profil'},{icon:'⚡',text:'Invocations avec -1 cristal'},
];

// ─── Skins ────────────────────────────────────────────────────────
const THEMES = [
  { id:'theme_dark',   name:'Cosmos Sombre',  price:0,  emoji:'🌌', colors:['#07090f','#0d1220'], accent:'#00e5ff', free:true },
  { id:'theme_neon',   name:'Néon City',      price:30, emoji:'🌆', colors:['#0a0014','#14002a'], accent:'#ff00ff' },
  { id:'theme_nature', name:'Forêt Ancienne', price:25, emoji:'🌲', colors:['#040a04','#081408'], accent:'#39ff8f' },
  { id:'theme_solar',  name:'Cœur Solaire',   price:35, emoji:'☀️', colors:['#120800','#201000'], accent:'#ffd700' },
  { id:'theme_ocean',  name:'Abysses',        price:28, emoji:'🌊', colors:['#000814','#001428'], accent:'#00aaff' },
];
const FRAMES = [
  { id:'frame_none',   name:'Sans cadre',   price:0,  emoji:'○',  free:true, borderColor:'#1e2d4a', borderWidth:1 },
  { id:'frame_gold',   name:'Cadre Doré',   price:20, emoji:'🟡', borderColor:'#ffd700', borderWidth:2 },
  { id:'frame_neon',   name:'Néon Bleu',    price:18, emoji:'🔵', borderColor:'#00e5ff', borderWidth:2 },
  { id:'frame_purple', name:'Aura Violette',price:22, emoji:'🟣', borderColor:'#bf5fff', borderWidth:2 },
  { id:'frame_fire',   name:'Flammes',      price:25, emoji:'🔴', borderColor:'#ff6b35', borderWidth:2 },
];
const BADGES = [
  { id:'badge_star',   name:'Étoile',   emoji:'⭐', price:10 },
  { id:'badge_crown',  name:'Couronne', emoji:'👑', price:25 },
  { id:'badge_dragon', name:'Dragon',   emoji:'🐉', price:35 },
  { id:'badge_cosmic', name:'Cosmique', emoji:'🌌', price:50 },
  { id:'badge_shiny',  name:'Shiny ✨', emoji:'✨', price:30 },
  { id:'badge_thunder',name:'Foudre',   emoji:'⚡', price:20 },
];

// ─── Box SVG ──────────────────────────────────────────────────────
function BoxSvg({ box, size=80 }) {
  const c = box.color;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="50" cy="88" rx="30" ry="6" fill="rgba(0,0,0,0.3)"/>
      <Path d="M18 50 L18 80 L82 80 L82 50 Z" fill={c} opacity="0.8"/>
      <Path d="M12 38 L12 52 L88 52 L88 38 Z" fill={c}/>
      <Path d="M14 40 L14 50 L86 50 L86 40 Z" fill="rgba(255,255,255,0.2)"/>
      <Path d="M44 38 L44 80 L56 80 L56 38 Z" fill="rgba(255,255,255,0.25)"/>
      <Path d="M12 44 L88 44 L88 48 L12 48 Z" fill="rgba(255,255,255,0.25)"/>
      <Circle cx="50" cy="38" r="8" fill="rgba(255,255,255,0.4)"/>
      <Path d="M44 34 Q50 28 56 34" stroke="white" strokeWidth="2" fill="none"/>
      <Path d="M44 42 Q50 48 56 42" stroke="white" strokeWidth="2" fill="none"/>
      <Circle cx="50" cy="38" r="4" fill="white" opacity="0.8"/>
    </Svg>
  );
}

// ─── Drop system ──────────────────────────────────────────────────
function rollBox(box) {
  const rand = Math.random() * 100;
  let cumul  = 0;
  let rarity = box.drops[box.drops.length-1].rarity;
  for (const drop of box.drops) {
    cumul += drop.weight;
    if (rand < cumul) { rarity = drop.rarity; break; }
  }
  const pool = CREATURE_LIST.filter(c => c.rarity === rarity);
  if (!pool.length) return CREATURE_LIST[0];
  const creature = pool[Math.floor(Math.random() * pool.length)];
  if (Math.random() < box.shinyChance) {
    const shiny = ALL_CREATURES[`${creature.id}_shiny`];
    if (shiny) return shiny;
  }
  return creature;
}

// ─── ShopScreen ───────────────────────────────────────────────────
export default function ShopScreen() {
  const { collection, crystals, addCrystals, addToCollection } = useGameStore();
  const authCtx = useAuth();
  const user    = authCtx?.user;
  const uid     = user?.uid || 'guest';

  const [mainTab, setMainTab] = useState('Skins');

  // ── Skins ──
  const [skinsTab, setSkinsTab]     = useState('Thèmes');
  const [owned, setOwned]           = useState({});
  const [equipped, setEquipped]     = useState({ theme:'theme_dark', frame:'frame_none', badge:null });
  const [preview, setPreview]       = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  // ── Boîtes ──
  const [selectedBox, setSelectedBox] = useState(BOXES[0]);
  const [boxPhase, setBoxPhase]       = useState('select'); // select | opening | result
  const [boxResult, setBoxResult]     = useState(null);
  const [pity, setPity]               = useState({});
  const [openCount, setOpenCount]     = useState({});
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const resultScale= useRef(new Animated.Value(0)).current;

  // ── Marché ──
  const [marketTab, setMarketTab]       = useState('Parcourir');
  const [listings, setListings]         = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [playerName, setPlayerNameLocal] = useState(getPlayerName());
  const [nameSet, setNameSet]           = useState(getPlayerName() !== 'Joueur inconnu');
  const [sellCreature, setSellCreature] = useState(null);
  const [sellPrice, setSellPrice]       = useState('5');
  const [selling, setSelling]           = useState(false);
  const [sellSuccess, setSellSuccess]   = useState(false);
  const [buyTarget, setBuyTarget]       = useState(null);
  const [buying, setBuying]             = useState(false);
  const playerId = getPlayerId();

  // ── Init ──
  useEffect(() => {
    onValue(ref(db, `shop/${uid}`), snap => {
      if (snap.exists()) {
        setOwned(snap.val().owned || {});
        setEquipped(snap.val().equipped || { theme:'theme_dark', frame:'frame_none', badge:null });
      } else {
        setOwned({ theme_dark:true, frame_none:true });
      }
    });
    get(ref(db, `boxes/${uid}/pity`)).then(s => { if (s.exists()) setPity(s.val()); });
    get(ref(db, `boxes/${uid}/count`)).then(s => { if (s.exists()) setOpenCount(s.val()); });
    const unsub = subscribeToListings(d => { setListings(d); setLoadingMarket(false); });
    return unsub;
  }, [uid]);

  async function saveShop(o, e) { await set(ref(db, `shop/${uid}`), { owned:o, equipped:e }).catch(()=>{}); }
  async function savePity(p, c) {
    await set(ref(db, `boxes/${uid}/pity`), p).catch(()=>{});
    await set(ref(db, `boxes/${uid}/count`), c).catch(()=>{});
  }

  async function purchaseSkin(item) {
    if (owned[item.id] || purchasing || crystals < item.price) return;
    setPurchasing(true);
    const n = { ...owned, [item.id]:true };
    setOwned(n); addCrystals(-item.price);
    await saveShop(n, equipped);
    setPurchasing(false); setPreview(null);
  }

  async function equipSkin(item, type) {
    if (!owned[item.id]) return;
    const e = { ...equipped, [type]:item.id };
    setEquipped(e); await saveShop(owned, e);
  }

  async function openStripe(key) { await Linking.openURL(STRIPE[key]); }

  // ── Box open ──
  async function openBox() {
    if (crystals < selectedBox.price) return;
    addCrystals(-selectedBox.price);
    const cur = pity[selectedBox.id] || 0;
    let creature;
    if (cur + 1 >= selectedBox.pityMax && selectedBox.pityMax > 1) {
      const top = selectedBox.drops[selectedBox.drops.length-1].rarity;
      const pool = CREATURE_LIST.filter(c => c.rarity === top);
      creature = pool[Math.floor(Math.random()*pool.length)];
    } else { creature = rollBox(selectedBox); }
    const np = { ...pity, [selectedBox.id]: creature.rarity==='legendary'?0:cur+1 };
    const nc = { ...openCount, [selectedBox.id]:(openCount[selectedBox.id]||0)+1 };
    setPity(np); setOpenCount(nc); await savePity(np, nc);
    setBoxResult(creature); setBoxPhase('opening');
    shakeAnim.setValue(0); scaleAnim.setValue(1); fadeAnim.setValue(0); resultScale.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue:8,  duration:55, useNativeDriver:true }),
        Animated.timing(shakeAnim, { toValue:-8, duration:55, useNativeDriver:true }),
      ]), { iterations:6 }
    ).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue:1.5, duration:350, useNativeDriver:true }),
        Animated.timing(fadeAnim,  { toValue:1,   duration:400, useNativeDriver:true }),
      ]).start(() => {
        setBoxPhase('result');
        addToCollection({ ...creature });
        Animated.spring(resultScale, { toValue:1, friction:4, useNativeDriver:true }).start();
      });
    }, 700);
  }

  function resetBox() {
    setBoxResult(null); setBoxPhase('select');
    shakeAnim.setValue(0); scaleAnim.setValue(1); fadeAnim.setValue(0); resultScale.setValue(0);
  }

  // ── Marché ──
  const ownedCreatures = collection.filter(c => !listings.find(l => l.creature?.uid===c.uid && l.sellerId===playerId));
  const myListings     = listings.filter(l => l.sellerId===playerId);
  const otherListings  = listings.filter(l => l.sellerId!==playerId);

  async function handleSell() {
    if (!sellCreature||!sellPrice||selling) return;
    const price = parseInt(sellPrice);
    if (isNaN(price)||price<1) return;
    setSelling(true);
    try {
      await createListing(sellCreature, price, playerName);
      await recordSale(sellCreature, price);
      setSellSuccess(true); setSellCreature(null); setSellPrice('5');
      setTimeout(() => { setSellSuccess(false); setMarketTab('Mes ventes'); }, 1500);
    } catch(e) { console.error(e); }
    setSelling(false);
  }

  async function handleBuy(listing) {
    if (crystals<listing.price||buying) return;
    setBuying(true);
    try {
      await buyListing(listing.id, listing);
      await recordPurchase(listing.creature, listing.price);
      addToCollection({ ...CREATURES[listing.creature.id], uid:listing.creature.uid });
      addCrystals(-listing.price); setBuyTarget(null);
    } catch(e) { console.error(e); }
    setBuying(false);
  }

  const currentFrame = FRAMES.find(f => f.id===equipped.frame) || FRAMES[0];
  const currentBadge = BADGES.find(b => b.id===equipped.badge);

  // ── OUVERTURE BOÎTE ──
  if (mainTab==='Boîtes' && boxPhase==='opening') {
    return (
      <LinearGradient colors={selectedBox.gradient} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.openingArea}>
            <Text style={styles.openingTitle}>Ouverture...</Text>
            <Animated.View style={{ transform:[{translateX:shakeAnim},{scale:scaleAnim}], opacity:Animated.subtract(1,fadeAnim) }}>
              <BoxSvg box={selectedBox} size={200}/>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── RÉSULTAT BOÎTE ──
  if (mainTab==='Boîtes' && boxPhase==='result' && boxResult) {
    const Sprite = SPRITES[boxResult.id?.replace('_shiny','')] || SPRITES.lumikos;
    return (
      <LinearGradient colors={boxResult.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.resultArea}>
            {boxResult.isShiny && <Text style={styles.shinyLabel}>✨ SHINY !</Text>}
            {boxResult.rarity==='legendary' && <Text style={styles.legLabel}>★ LÉGENDAIRE !</Text>}
            <Text style={styles.resultFrom}>{selectedBox.emoji} {selectedBox.name}</Text>
            <Animated.View style={{transform:[{scale:resultScale}]}}>
              <Sprite size={160}/>
            </Animated.View>
            <Text style={[styles.resultName,{color:boxResult.rarityColor}]}>{boxResult.name}</Text>
            <Text style={[styles.resultRarity,{color:boxResult.rarityColor+'aa'}]}>{boxResult.rarityLabel}</Text>
            <Text style={styles.resultDesc}>{boxResult.description}</Text>
            <View style={styles.resultStats}>
              {[['PV',boxResult.stats?.hp,'#39ff8f'],['ATK',boxResult.stats?.atk,'#ff4fa3'],['DEF',boxResult.stats?.def,'#00e5ff'],['VIT',boxResult.stats?.spd,'#ffd700']].map(([l,v,c])=>(
                <View key={l} style={[styles.statChip,{borderColor:c+'44'}]}>
                  <Text style={[styles.statLbl,{color:c+'88'}]}>{l}</Text>
                  <Text style={[styles.statVal,{color:c}]}>{v}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={openBox} disabled={crystals<selectedBox.price}
              style={[styles.openAgainBtn,{borderColor:selectedBox.color+'66'},crystals<selectedBox.price&&styles.disabled]}>
              <LinearGradient colors={[selectedBox.color+'33',selectedBox.color+'11']} style={styles.openAgainGrad}>
                <Text style={[styles.openAgainText,{color:selectedBox.color}]}>↺ Encore ({selectedBox.price} 💎)</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetBox} style={styles.backBtn2}>
              <Text style={styles.backBtn2Text}>← Retour aux boîtes</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>BOUTIQUE</Text>

        {/* Solde amélioré */}
        <LinearGradient colors={['#0d1a2e','#07090f']} style={styles.balanceRow}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLbl}>SOLDE</Text>
            <Text style={styles.balanceText}>💎 {crystals}</Text>
          </View>
          <View style={styles.balanceRight}>
            <Text style={styles.balanceEquipLbl}>ÉQUIPÉ</Text>
            <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
              <View style={styles.equippedPill}>
                <Text>{THEMES.find(t=>t.id===equipped.theme)?.emoji}</Text>
                <Text style={styles.equippedPillText}>{THEMES.find(t=>t.id===equipped.theme)?.name}</Text>
              </View>
              <Text style={{fontSize:16}}>{currentFrame.emoji}</Text>
              {currentBadge&&<Text style={{fontSize:16}}>{currentBadge.emoji}</Text>}
            </View>
          </View>
        </LinearGradient>

        {/* Onglets principaux */}
        <View style={styles.mainTabRow}>
          {[
            {id:'Skins',    emoji:'🎨'},
            {id:'Cristaux', emoji:'💎'},
            {id:'Boîtes',   emoji:'📦'},
            {id:'Marché',   emoji:'🏪'},
          ].map(t => (
            <TouchableOpacity key={t.id} onPress={() => { setMainTab(t.id); if(t.id!=='Boîtes') resetBox(); }}
              style={[styles.mainTabBtn, mainTab===t.id && styles.mainTabActive]}>
              <Text style={styles.mainTabEmoji}>{t.emoji}</Text>
              <Text style={[styles.mainTabText, mainTab===t.id && styles.mainTabTextActive]}>{t.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ SKINS ══ */}
        {mainTab==='Skins' && (
          <>
            <View style={styles.subTabRow}>
              {['Thèmes','Cadres','Badges'].map(t => (
                <TouchableOpacity key={t} onPress={() => setSkinsTab(t)}
                  style={[styles.subTabBtn, skinsTab===t && styles.subTabActive]}>
                  <Text style={[styles.subTabText, skinsTab===t && styles.subTabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {skinsTab==='Thèmes' && THEMES.map(theme => {
                const isOwned = !!owned[theme.id], isEquipped = equipped.theme===theme.id;
                return (
                  <LinearGradient key={theme.id} colors={theme.colors}
                    style={[styles.skinCard,{borderColor:isEquipped?theme.accent+'bb':isOwned?theme.accent+'55':'#1e2d4a'}]}>
                    <Text style={styles.skinEmoji}>{theme.emoji}</Text>
                    <View style={styles.skinInfo}>
                      <Text style={[styles.skinName,{color:theme.accent}]}>{theme.name}</Text>
                      <Text style={styles.skinPrice}>{theme.free?'Gratuit':`💎 ${theme.price}`}</Text>
                      {/* Aperçu couleurs */}
                      <View style={{flexDirection:'row',gap:3,marginTop:2}}>
                        {theme.colors.map((c,i)=><View key={i} style={{width:10,height:10,borderRadius:5,backgroundColor:c,borderWidth:1,borderColor:'rgba(255,255,255,0.2)'}}/>)}
                        <View style={{width:10,height:10,borderRadius:5,backgroundColor:theme.accent}}/>
                      </View>
                    </View>
                    {isEquipped
                      ? <View style={[styles.equippedBadge,{borderColor:theme.accent+'77',backgroundColor:theme.accent+'33'}]}><Text style={[styles.equippedText,{color:theme.accent}]}>✓ Actif</Text></View>
                      : isOwned
                        ? <TouchableOpacity onPress={()=>equipSkin(theme,'theme')} style={[styles.equipBtn,{borderColor:theme.accent+'66',backgroundColor:theme.accent+'15'}]}><Text style={[styles.equipText,{color:theme.accent}]}>Équiper</Text></TouchableOpacity>
                        : <TouchableOpacity onPress={()=>setPreview({item:theme,type:'theme'})} style={[styles.buyBtn,crystals<theme.price&&styles.disabled]}><Text style={styles.buyBtnText}>💎 {theme.price}</Text></TouchableOpacity>
                    }
                  </LinearGradient>
                );
              })}
              {skinsTab==='Cadres' && FRAMES.map(frame => {
                const isOwned = !!owned[frame.id], isEquipped = equipped.frame===frame.id;
                return (
                  <View key={frame.id} style={[styles.skinCard,{borderColor:isEquipped?frame.borderColor+'aa':isOwned?frame.borderColor+'44':'#1e2d4a',backgroundColor:'#0d1220'}]}>
                    <View style={[styles.frameMini,{borderColor:frame.borderColor,borderWidth:frame.borderWidth||1}]}><Text style={styles.skinEmoji}>{frame.emoji}</Text></View>
                    <View style={styles.skinInfo}>
                      <Text style={[styles.skinName,{color:frame.borderColor}]}>{frame.name}</Text>
                      <Text style={styles.skinPrice}>{frame.free?'Gratuit':`💎 ${frame.price}`}</Text>
                    </View>
                    {isEquipped
                      ? <View style={[styles.equippedBadge,{borderColor:frame.borderColor+'66',backgroundColor:frame.borderColor+'22'}]}><Text style={[styles.equippedText,{color:frame.borderColor}]}>Actif</Text></View>
                      : isOwned
                        ? <TouchableOpacity onPress={()=>equipSkin(frame,'frame')} style={[styles.equipBtn,{borderColor:frame.borderColor+'66'}]}><Text style={[styles.equipText,{color:frame.borderColor}]}>Équiper</Text></TouchableOpacity>
                        : <TouchableOpacity onPress={()=>setPreview({item:frame,type:'frame'})} style={[styles.buyBtn,crystals<frame.price&&styles.disabled]}><Text style={styles.buyBtnText}>💎 {frame.price}</Text></TouchableOpacity>
                    }
                  </View>
                );
              })}
              {skinsTab==='Badges' && (
                <View style={styles.badgeGrid}>
                  {BADGES.map(badge => {
                    const isOwned = !!owned[badge.id], isEquipped = equipped.badge===badge.id;
                    return (
                      <TouchableOpacity key={badge.id}
                        onPress={()=>isOwned?equipSkin(badge,'badge'):setPreview({item:badge,type:'badge'})}
                        style={[styles.badgeCard,{borderColor:isEquipped?'#ffd70088':isOwned?'#ffd70033':'#1e2d4a',backgroundColor:isEquipped?'#ffd70015':'#0d1220'}]}>
                        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                        <Text style={[styles.badgeName,isEquipped&&{color:'#ffd700'}]}>{badge.name}</Text>
                        {isEquipped?<Text style={styles.badgeActive}>Actif</Text>:isOwned?<Text style={styles.badgeOwned}>Équiper</Text>:<Text style={[styles.badgePrice,crystals<badge.price&&{color:'#ff4444'}]}>💎 {badge.price}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </>
        )}

        {/* ══ CRISTAUX ══ */}
        {mainTab==='Cristaux' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.bigBalance}>
              <Text style={styles.bigBalanceLbl}>SOLDE</Text>
              <Text style={styles.bigBalanceVal}>💎 {crystals}</Text>
            </View>
            {CRYSTAL_PACKS.map((pack,pi) => (
              <TouchableOpacity key={pack.id} onPress={()=>openStripe(pack.id)} style={[styles.packCard,pi===1&&{borderColor:'#bf5fff44'}]}>
                <LinearGradient colors={pack.gradient} style={styles.packGrad}>
                  {pack.badge&&<View style={[styles.packBadge,{backgroundColor:pack.color}]}><Text style={styles.packBadgeText}>{pack.badge}</Text></View>}
                  <View style={styles.packContent}>
                    <View style={{gap:3}}>
                      <Text style={styles.packEmoji}>{pack.emoji}</Text>
                      <Text style={[styles.packName,{color:pack.color}]}>{pack.name}</Text>
                      <Text style={styles.packCrystals}>{pack.crystals.toLocaleString()} cristaux{pack.bonus&&<Text style={[{color:pack.color}]}> {pack.bonus}</Text>}</Text>
                      <Text style={styles.packPerCrystal}>{pack.perCrystal}</Text>
                    </View>
                    <View style={{alignItems:'center',gap:6}}>
                      <Text style={[styles.packPrice,{color:pack.color}]}>{pack.price}</Text>
                      <View style={[styles.packBtn,{backgroundColor:pack.color+'22',borderColor:pack.color+'66'}]}><Text style={[styles.packBtnText,{color:pack.color}]}>Acheter</Text></View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={()=>openStripe('premium')} style={[styles.packCard,{borderColor:'#ffd70033'}]}>
              <LinearGradient colors={['#1a1000','#2a1800']} style={styles.packGrad}>
                <View style={styles.packContent}>
                  <View style={{gap:3}}>
                    <Text style={styles.packEmoji}>👑</Text>
                    <Text style={[styles.packName,{color:'#ffd700'}]}>Premium Mensuel</Text>
                    {PREMIUM_PERKS.map((p,i)=><Text key={i} style={styles.perkMini}>{p.icon} {p.text}</Text>)}
                  </View>
                  <View style={{alignItems:'center',gap:4}}>
                    <Text style={[styles.packPrice,{color:'#ffd700'}]}>2,99€</Text>
                    <Text style={{color:'#4a6080',fontSize:10}}>/mois</Text>
                    <View style={[styles.packBtn,{backgroundColor:'#ffd70022',borderColor:'#ffd70044'}]}><Text style={[styles.packBtnText,{color:'#ffd700'}]}>S'abonner</Text></View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.assocBox}>
              <Text style={styles.assocEmoji}>🌱</Text>
              <Text style={styles.assocText}><Text style={styles.assocBold}>5% de chaque achat</Text> est reversé à une association caritative.</Text>
            </View>
            <View style={styles.testBox}><Text style={styles.testText}>🧪 Carte test : <Text style={styles.testCard}>4242 4242 4242 4242</Text></Text></View>
          </ScrollView>
        )}

        {/* ══ BOÎTES ══ */}
        {mainTab==='Boîtes' && boxPhase==='select' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.hint}>Achète avec 💎 cristaux ou avec de l'argent réel</Text>
            <View style={styles.boxGrid}>
              {BOXES.map(box => {
                const cur = pity[box.id]||0, tot = openCount[box.id]||0;
                const pct = box.pityMax>1?(cur/box.pityMax)*100:100;
                return (
                  <TouchableOpacity key={box.id} onPress={()=>setSelectedBox(box)}
                    style={[styles.boxCard,{borderColor:selectedBox.id===box.id?box.color:'#1e2d4a',backgroundColor:selectedBox.id===box.id?box.color+'12':'#0d1220'}]}>
                    <LinearGradient colors={box.gradient} style={styles.boxCardGrad}>
                      <BoxSvg box={box} size={80}/>
                      <Text style={[styles.boxName,{color:box.color}]}>{box.name}</Text>
                      <Text style={styles.boxDesc}>{box.description}</Text>
                      <Text style={[styles.boxPrice,{color:crystals>=box.price?box.color:'#ff4444'}]}>💎 {box.price}</Text>
                      <Text style={[styles.boxRealPrice,{color:box.color+'88'}]}>{box.realPrice}</Text>
                      {box.pityMax>1&&(
                        <View style={{width:'100%',gap:2}}>
                          <Text style={styles.pityLabel}>Garantie {cur}/{box.pityMax}</Text>
                          <View style={styles.pityBarBg}><View style={[styles.pityBarFill,{width:`${pct}%`,backgroundColor:box.color}]}/></View>
                        </View>
                      )}
                      {tot>0&&<Text style={styles.boxOpened}>{tot} ouvertes</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Détail */}
            <LinearGradient colors={selectedBox.gradient} style={[styles.detailCard,{borderColor:selectedBox.color+'44'}]}>
              <Text style={[styles.detailName,{color:selectedBox.color}]}>{selectedBox.emoji} {selectedBox.name}</Text>
              <Text style={styles.detailDesc}>{selectedBox.description}</Text>
              <Text style={styles.dropTitle}>TAUX D'APPARITION</Text>
              {selectedBox.drops.map(d=>(
                <View key={d.rarity} style={styles.dropRow}>
                  <Text style={styles.dropRarity}>{d.rarity==='common'?'Common':d.rarity==='uncommon'?'Uncommon':d.rarity==='rare'?'Rare':'★ Légendaire'}</Text>
                  <View style={styles.dropBarBg}><View style={[styles.dropBarFill,{width:`${d.weight}%`,backgroundColor:d.rarity==='legendary'?'#ffd700':d.rarity==='rare'?'#bf5fff':d.rarity==='uncommon'?'#39ff8f':'#00e5ff'}]}/></View>
                  <Text style={styles.dropPct}>{d.weight}%</Text>
                </View>
              ))}
              <Text style={styles.shinyChance}>✨ Shiny : {(selectedBox.shinyChance*100).toFixed(1)}%</Text>
            </LinearGradient>

            {/* Boutons acheter */}
            <TouchableOpacity onPress={openBox} disabled={crystals<selectedBox.price}
              style={[styles.openBtn,crystals<selectedBox.price&&styles.disabled]}>
              <LinearGradient colors={[selectedBox.color+'55',selectedBox.color+'22']} style={styles.openBtnGrad}>
                <Text style={[styles.openBtnText,{color:selectedBox.color}]}>{selectedBox.emoji} Ouvrir — {selectedBox.price} 💎</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=>openStripe(`box_${selectedBox.id}`)} style={[styles.openBtn,{borderColor:selectedBox.color+'33'}]}>
              <LinearGradient colors={[selectedBox.color+'22',selectedBox.color+'11']} style={styles.openBtnGrad}>
                <Text style={[styles.openBtnText,{color:selectedBox.color+'cc'}]}>💳 Acheter — {selectedBox.realPrice}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.assocBox}>
              <Text style={styles.assocEmoji}>🌱</Text>
              <Text style={styles.assocText}><Text style={styles.assocBold}>5% de chaque achat</Text> est reversé à une association.</Text>
            </View>
            <View style={styles.testBox}><Text style={styles.testText}>🧪 Carte test : <Text style={styles.testCard}>4242 4242 4242 4242</Text></Text></View>
          </ScrollView>
        )}

        {/* ══ MARCHÉ ══ */}
        {mainTab==='Marché' && (
          <>
            {!nameSet ? (
              <View style={styles.nameSetup}>
                <Text style={styles.namePrompt}>Choisis ton nom de vendeur</Text>
                <TextInput style={styles.nameInput} value={playerName} onChangeText={setPlayerNameLocal} placeholder="Nom..." placeholderTextColor="#4a6080" maxLength={20}/>
                <TouchableOpacity onPress={()=>{setPlayerName(playerName);setNameSet(true);}} style={styles.nameBtn}>
                  <LinearGradient colors={['#00e5ff33','#00e5ff11']} style={styles.nameBtnGrad}>
                    <Text style={styles.nameBtnText}>→ Entrer dans le marché</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <LinearGradient colors={['#0d1a2e','#07090f']} style={styles.marketHeader}>
                  <View>
                    <Text style={styles.marketBalanceLbl}>SOLDE</Text>
                    <Text style={styles.marketBalance}>💎 {crystals}</Text>
                  </View>
                  <View style={styles.marketNameBadge}>
                    <Text style={styles.marketNameEmoji}>👤</Text>
                    <Text style={styles.marketName}>{playerName}</Text>
                  </View>
                </LinearGradient>
                <View style={styles.subTabRow}>
                  {['Parcourir','Mes ventes','Vendre'].map(t=>(
                    <TouchableOpacity key={t} onPress={()=>setMarketTab(t)}
                      style={[styles.subTabBtn,marketTab===t&&styles.subTabActive]}>
                      <Text style={[styles.subTabText,marketTab===t&&styles.subTabTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                  {marketTab==='Parcourir' && (otherListings.length===0
                    ? <View style={styles.empty}><Text style={styles.emptyText}>Aucune offre</Text><Text style={styles.emptySub}>Sois le premier à vendre !</Text></View>
                    : otherListings.map(l=>{
                        const c=ALL_CREATURES[l.creature?.id];
                        const Sprite=SPRITES[l.creature?.id?.replace('_shiny','')]||SPRITES.lumikos;
                        return (
                          <LinearGradient key={l.id} colors={c?.bgGradient||['#0d1220','#07090f']}
                            style={[styles.listingCard,{borderColor:c?.rarityColor+'44'}]}>
                            <View style={styles.listingLeft}><Sprite size={54}/></View>
                            <View style={styles.listingMid}>
                              <Text style={[styles.listingName,{color:c?.rarityColor}]}>{c?.name}</Text>
                              <Text style={[styles.listingRarity,{color:c?.rarityColor+'88'}]}>{c?.rarityLabel}</Text>
                              <Text style={styles.listingSeller}>par {l.sellerName}</Text>
                            </View>
                            <View style={styles.listingRight}>
                              <Text style={[styles.listingPrice,{color:crystals>=l.price?'#ffd700':'#ff4444'}]}>💎 {l.price}</Text>
                              <TouchableOpacity onPress={()=>setBuyTarget(l)}
                                style={[styles.buyMarketBtn,crystals<l.price&&styles.disabled,{borderColor:c?.rarityColor+'55',backgroundColor:c?.rarityColor+'18'}]} disabled={crystals<l.price}>
                                <Text style={[styles.buyMarketBtnText,{color:c?.rarityColor}]}>Acheter</Text>
                              </TouchableOpacity>
                            </View>
                          </LinearGradient>
                        );
                      })
                  )}
                  {marketTab==='Mes ventes' && (myListings.length===0
                    ? <View style={styles.empty}><Text style={styles.emptyText}>Aucune vente en cours</Text></View>
                    : myListings.map(l=>{
                        const c=ALL_CREATURES[l.creature?.id];
                        const Sprite=SPRITES[l.creature?.id?.replace('_shiny','')]||SPRITES.lumikos;
                        return (
                          <View key={l.id} style={[styles.listingCard,{borderColor:c?.rarityColor+'33'}]}>
                            <View style={styles.listingLeft}><Sprite size={50}/></View>
                            <View style={styles.listingMid}>
                              <Text style={[styles.listingName,{color:c?.rarityColor}]}>{c?.name}</Text>
                              <Text style={styles.listingPrice}>💎 {l.price}</Text>
                            </View>
                            <TouchableOpacity onPress={()=>removeListing(l.id)} style={[styles.actionBtn,{borderColor:'#ff444444',backgroundColor:'#ff444415'}]}>
                              <Text style={[styles.actionBtnText,{color:'#ff4444'}]}>Annuler</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                  )}
                  {marketTab==='Vendre' && (
                    <View style={{gap:14,paddingBottom:40}}>
                      {sellSuccess&&<View style={styles.successBanner}><Text style={styles.successText}>✓ Mis en vente !</Text></View>}
                      <Text style={styles.sellLabel}>CRÉATURE</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {ownedCreatures.map(c=>{
                          const data=ALL_CREATURES[c.id];
                          const Sprite=SPRITES[c.id?.replace('_shiny','')]||SPRITES.lumikos;
                          return (
                            <TouchableOpacity key={c.uid} onPress={()=>setSellCreature(c)}
                              style={[styles.sellCard,{borderColor:sellCreature?.uid===c.uid?data?.rarityColor:'#1e2d4a',backgroundColor:sellCreature?.uid===c.uid?data?.rarityColor+'22':'#0d1220'}]}>
                              <Sprite size={50}/>
                              <Text style={[styles.sellCardName,{color:data?.rarityColor}]}>{data?.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <Text style={styles.sellLabel}>PRIX</Text>
                      <TextInput style={styles.priceInput} value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" placeholder="Prix..." placeholderTextColor="#4a6080"/>
                      <TouchableOpacity onPress={handleSell} disabled={!sellCreature||selling}
                        style={[styles.sellBtn,(!sellCreature||selling)&&styles.disabled]}>
                        <LinearGradient colors={['#ffd70033','#ffd70011']} style={styles.sellBtnGrad}>
                          <Text style={styles.sellBtnText}>{selling?'Mise en vente...':'→ Mettre en vente'}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </>
        )}

        {/* Modal achat skin */}
        <Modal visible={!!preview} transparent animationType="fade" onRequestClose={()=>setPreview(null)}>
          <View style={styles.modalOverlay}>
            {preview&&(
              <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
                <Text style={styles.modalTitle}>Confirmer l'achat</Text>
                <Text style={styles.modalEmoji}>{preview.item.emoji}</Text>
                <Text style={styles.modalName}>{preview.item.name}</Text>
                <View style={styles.modalPriceRow}>
                  <Text style={styles.modalBal}>💎 {crystals}</Text>
                  <Text style={styles.modalArrow}>→</Text>
                  <Text style={[styles.modalAfter,{color:crystals>=preview.item.price?'#39ff8f':'#ff4444'}]}>💎 {crystals-preview.item.price}</Text>
                </View>
                <TouchableOpacity onPress={()=>purchaseSkin(preview.item)}
                  style={[styles.modalConfirm,crystals<preview.item.price&&styles.disabled]} disabled={crystals<preview.item.price||purchasing}>
                  <Text style={styles.modalConfirmText}>{purchasing?'Achat...':`Acheter — 💎 ${preview.item.price}`}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setPreview(null)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        </Modal>

        {/* Modal achat marché */}
        <Modal visible={!!buyTarget} transparent animationType="fade" onRequestClose={()=>setBuyTarget(null)}>
          <View style={styles.modalOverlay}>
            {buyTarget&&(()=>{
              const c=ALL_CREATURES[buyTarget.creature?.id];
              return (
                <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Confirmer l'achat</Text>
                  <Text style={[styles.modalName,{color:c?.rarityColor}]}>{c?.name}</Text>
                  <Text style={{color:'#4a6080',fontSize:12}}>par {buyTarget.sellerName}</Text>
                  <View style={styles.modalPriceRow}>
                    <Text style={styles.modalBal}>💎 {crystals}</Text>
                    <Text style={styles.modalArrow}>→</Text>
                    <Text style={[styles.modalAfter,{color:crystals>=buyTarget.price?'#39ff8f':'#ff4444'}]}>💎 {crystals-buyTarget.price}</Text>
                  </View>
                  <TouchableOpacity onPress={()=>handleBuy(buyTarget)}
                    style={[styles.modalConfirm,crystals<buyTarget.price&&styles.disabled]} disabled={crystals<buyTarget.price||buying}>
                    <Text style={styles.modalConfirmText}>{buying?'Achat...':`Acheter — 💎 ${buyTarget.price}`}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>setBuyTarget(null)} style={styles.modalCancel}>
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                </LinearGradient>
              );
            })()}
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:16,marginBottom:8},
  balanceRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,paddingHorizontal:14,paddingVertical:10,marginBottom:10},
  balanceLeft:{gap:2},
  balanceLbl:{fontSize:7,color:'#4a6080',letterSpacing:2,textTransform:'uppercase'},
  balanceRight:{alignItems:'flex-end',gap:3},
  balanceEquipLbl:{fontSize:7,color:'#4a6080',letterSpacing:2,textTransform:'uppercase'},
  equippedPill:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#1e2d4a',borderRadius:8,paddingHorizontal:6,paddingVertical:2},
  equippedPillText:{color:'#c8daf0',fontSize:9,fontWeight:'700'},
  balanceText:{color:'#ffd700',fontSize:14,fontWeight:'700'},
  mainTabRow:{flexDirection:'row',gap:6,marginBottom:10},
  mainTabBtn:{flex:1,alignItems:'center',paddingVertical:8,gap:2,borderRadius:12,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  mainTabEmoji:{fontSize:16},
  mainTabActive:{borderColor:'#ffd70044',backgroundColor:'#ffd70012'},
  mainTabText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  mainTabTextActive:{color:'#ffd700'},
  subTabRow:{flexDirection:'row',gap:6,marginBottom:10},
  subTabBtn:{flex:1,alignItems:'center',paddingVertical:8,borderRadius:10,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  subTabActive:{borderColor:'#00e5ff44',backgroundColor:'#00e5ff10'},
  subTabText:{color:'#4a6080',fontSize:10,fontWeight:'700'},
  subTabTextActive:{color:'#00e5ff'},
  scroll:{gap:10,paddingBottom:24},
  hint:{color:'#4a6080',fontSize:11,fontStyle:'italic',textAlign:'center'},
  // Skins
  skinCard:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:16,padding:12,gap:10},
  skinEmoji:{fontSize:22},
  skinInfo:{flex:1,gap:2},
  skinName:{fontSize:13,fontWeight:'800'},
  skinPrice:{fontSize:11,color:'#4a6080'},
  frameMini:{width:44,height:44,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:'#0d1220'},
  equippedBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:4},
  equippedText:{fontSize:10,fontWeight:'800'},
  equipBtn:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6},
  equipText:{fontSize:11,fontWeight:'700'},
  buyBtn:{backgroundColor:'#ffd70022',borderWidth:1,borderColor:'#ffd70044',borderRadius:10,paddingHorizontal:10,paddingVertical:6},
  buyBtnText:{color:'#ffd700',fontSize:12,fontWeight:'800'},
  badgeGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  badgeCard:{width:(SW-52)/3,borderWidth:1,borderRadius:14,padding:12,alignItems:'center',gap:4},
  badgeEmoji:{fontSize:28},
  badgeName:{fontSize:10,fontWeight:'700',color:'#c8daf0',textAlign:'center'},
  badgeActive:{fontSize:9,color:'#ffd700',fontWeight:'800'},
  badgeOwned:{fontSize:9,color:'#39ff8f',fontWeight:'700'},
  badgePrice:{fontSize:11,color:'#ffd700',fontWeight:'900'},
  // Cristaux
  bigBalance:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:14,alignItems:'center',gap:2},
  bigBalanceLbl:{fontSize:8,color:'#4a6080',letterSpacing:3},
  bigBalanceVal:{fontSize:26,fontWeight:'900',color:'#ffd700'},
  packCard:{borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#1e2d4a'},
  packGrad:{padding:14},
  packBadge:{alignSelf:'flex-start',borderRadius:8,paddingHorizontal:8,paddingVertical:3,marginBottom:8},
  packBadgeText:{fontSize:9,fontWeight:'900',color:'#000'},
  packContent:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  packEmoji:{fontSize:20},
  packName:{fontSize:14,fontWeight:'900'},
  packCrystals:{fontSize:12,color:'#c8daf0',fontWeight:'700'},
  packPerCrystal:{fontSize:10,color:'#4a6080'},
  packPrice:{fontSize:20,fontWeight:'900'},
  packBtn:{borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:6},
  packBtnText:{fontSize:12,fontWeight:'800'},
  perkMini:{color:'#4a6080',fontSize:10},
  assocBox:{flexDirection:'row',gap:10,alignItems:'flex-start',backgroundColor:'#0a1a0a',borderWidth:1,borderColor:'#39ff8f22',borderRadius:14,padding:12},
  assocEmoji:{fontSize:18},
  assocText:{flex:1,color:'#6a84a0',fontSize:11,lineHeight:17},
  assocBold:{color:'#39ff8f',fontWeight:'700'},
  testBox:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#ffd70022',borderRadius:12,padding:10},
  testText:{color:'#4a6080',fontSize:10,textAlign:'center'},
  testCard:{color:'#ffd700',fontWeight:'700'},
  // Boîtes
  boxGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  boxCard:{width:(SW-42)/2,borderWidth:1.5,borderRadius:18,overflow:'hidden'},
  boxCardGrad:{padding:12,alignItems:'center',gap:5,minHeight:210},
  boxName:{fontSize:12,fontWeight:'900',textAlign:'center'},
  boxDesc:{fontSize:9,color:'#6a84a0',textAlign:'center'},
  boxPrice:{fontSize:15,fontWeight:'900'},
  boxRealPrice:{fontSize:10,fontWeight:'700'},
  pityLabel:{fontSize:9,color:'#4a6080'},
  pityBarBg:{height:4,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  pityBarFill:{height:'100%',borderRadius:4},
  boxOpened:{fontSize:9,color:'#4a6080'},
  detailCard:{borderWidth:1,borderRadius:20,padding:16,gap:8},
  detailName:{fontSize:17,fontWeight:'900',letterSpacing:1},
  detailDesc:{color:'#6a84a0',fontSize:12},
  dropTitle:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700'},
  dropRow:{flexDirection:'row',alignItems:'center',gap:8},
  dropRarity:{fontSize:11,color:'#c8daf0',width:100},
  dropBarBg:{flex:1,height:4,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  dropBarFill:{height:'100%',borderRadius:4},
  dropPct:{fontSize:11,fontWeight:'700',color:'#c8daf0',width:30,textAlign:'right'},
  shinyChance:{fontSize:12,color:'#ff69b4',fontWeight:'700'},
  openBtn:{borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#1e2d4a'},
  openBtnGrad:{alignItems:'center',paddingVertical:18},
  openBtnText:{fontSize:16,fontWeight:'900',letterSpacing:1},
  // Opening / result
  openingArea:{flex:1,alignItems:'center',justifyContent:'center',gap:20},
  openingTitle:{color:'#fff',fontSize:20,fontWeight:'900',letterSpacing:4},
  resultArea:{flex:1,alignItems:'center',justifyContent:'center',gap:10,padding:20},
  shinyLabel:{color:'#ff69b4',fontSize:20,fontWeight:'900',letterSpacing:4},
  legLabel:{color:'#ffd700',fontSize:18,fontWeight:'900',letterSpacing:3},
  resultFrom:{color:'#4a6080',fontSize:12},
  resultName:{fontSize:26,fontWeight:'900',letterSpacing:3},
  resultRarity:{fontSize:11,letterSpacing:2},
  resultDesc:{color:'#6a84a0',fontSize:12,textAlign:'center',fontStyle:'italic',paddingHorizontal:20},
  resultStats:{flexDirection:'row',gap:8},
  statChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center',gap:2},
  statLbl:{fontSize:8,fontWeight:'700'},
  statVal:{fontSize:14,fontWeight:'900'},
  openAgainBtn:{width:'100%',borderWidth:1,borderRadius:14,overflow:'hidden'},
  openAgainGrad:{alignItems:'center',paddingVertical:14},
  openAgainText:{fontSize:14,fontWeight:'800'},
  backBtn2:{padding:10},
  backBtn2Text:{color:'#4a6080',fontSize:13},
  // Marché
  marketHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,paddingHorizontal:14,paddingVertical:10,marginBottom:8},
  marketBalanceLbl:{fontSize:7,color:'#4a6080',letterSpacing:2,textTransform:'uppercase'},
  marketNameBadge:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#1e2d4a',borderRadius:10,paddingHorizontal:10,paddingVertical:6},
  marketNameEmoji:{fontSize:14},
  marketBalance:{color:'#ffd700',fontSize:16,fontWeight:'900'},
  marketName:{color:'#c8daf0',fontSize:12,fontWeight:'700'},
  listingCard:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:16,padding:12,gap:10,backgroundColor:'#0d1220',marginBottom:2},
  listingLeft:{width:56,alignItems:'center'},
  listingMid:{flex:1,gap:2},
  listingName:{fontSize:13,fontWeight:'800'},
  listingRarity:{fontSize:9,color:'#4a6080'},
  listingSeller:{fontSize:10,color:'#4a6080'},
  listingRight:{alignItems:'center',gap:6},
  listingPrice:{fontSize:13,fontWeight:'900',color:'#ffd700'},
  actionBtn:{borderWidth:1,borderColor:'#ffd70044',backgroundColor:'#ffd70015',borderRadius:10,paddingHorizontal:10,paddingVertical:6},
  buyMarketBtn:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center'},
  buyMarketBtnText:{fontSize:11,fontWeight:'800'},
  actionBtnText:{color:'#ffd700',fontSize:11,fontWeight:'700'},
  empty:{alignItems:'center',paddingVertical:40,gap:8},
  emptyText:{color:'#4a6080',fontSize:14},
  emptySub:{color:'#4a6080',fontSize:11,fontStyle:'italic'},
  sellLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700',textTransform:'uppercase'},
  sellCard:{alignItems:'center',borderWidth:1.5,borderRadius:14,padding:10,marginRight:10,width:85,gap:3},
  sellCardName:{fontSize:8,fontWeight:'800',textAlign:'center'},
  priceInput:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,padding:14,color:'#fff',fontSize:18,textAlign:'center'},
  sellBtn:{borderRadius:14,overflow:'hidden'},
  sellBtnGrad:{alignItems:'center',paddingVertical:16,borderWidth:1,borderColor:'#ffd70033',borderRadius:14},
  sellBtnText:{color:'#ffd700',fontSize:14,fontWeight:'800'},
  successBanner:{backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:12,padding:12,alignItems:'center'},
  successText:{color:'#39ff8f',fontSize:14,fontWeight:'700'},
  nameSetup:{flex:1,alignItems:'center',justifyContent:'center',gap:16},
  namePrompt:{color:'#c8daf0',fontSize:16,textAlign:'center'},
  nameInput:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:16,color:'#fff',fontSize:18,textAlign:'center'},
  nameBtn:{width:'100%',borderRadius:14,overflow:'hidden'},
  nameBtnGrad:{alignItems:'center',paddingVertical:16,borderWidth:1,borderColor:'#00e5ff33',borderRadius:14},
  nameBtnText:{color:'#00e5ff',fontSize:15,fontWeight:'800'},
  // Modal
  modalOverlay:{flex:1,backgroundColor:'#000000cc',justifyContent:'center',padding:24},
  modalBox:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:24,padding:24,alignItems:'center',gap:10},
  modalTitle:{color:'#fff',fontSize:16,fontWeight:'900',letterSpacing:2},
  modalEmoji:{fontSize:36},
  modalName:{fontSize:18,fontWeight:'900',color:'#fff'},
  modalPriceRow:{flexDirection:'row',alignItems:'center',gap:12},
  modalBal:{color:'#ffd700',fontSize:14,fontWeight:'700'},
  modalArrow:{color:'#4a6080',fontSize:16},
  modalAfter:{fontSize:14,fontWeight:'900'},
  modalConfirm:{backgroundColor:'#ffd70022',borderWidth:1,borderColor:'#ffd70044',borderRadius:14,paddingVertical:14,paddingHorizontal:24,alignItems:'center'},
  modalConfirmText:{color:'#ffd700',fontSize:14,fontWeight:'800'},
  modalCancel:{padding:12},
  modalCancelText:{color:'#4a6080',fontSize:13},
  disabled:{opacity:0.4},
});
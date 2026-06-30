// screens/AdminScreen.js — Admin amélioré V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, TextInput, Modal, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, get, set, remove, onValue, push } from 'firebase/database';
import { useAuth } from '../store/AuthContext';
import { useGameStore } from '../store/useGameStore';
import { ALL_CREATURES, CREATURE_LIST, EXCLUSIVE_CREATURES } from '../data/creatures';
import { getCurrentSeasonId, getSeasonLabel, archiveSeasonAndReset } from '../store/seasonService';
import { getLevelFromXp } from '../store/xpService';

const { width: SW } = Dimensions.get('window');
const ADMIN_UID = 'NpKZ4aF5kVMlZTN3W8Wy3GCNOhK2';

// ─── StatCard ─────────────────────────────────────────────────────
function StatCard({label,value,color,emoji}) {
  return (
    <View style={[styles.statCard,{borderColor:color+'33'}]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statVal,{color}]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

// ─── ActionCard ───────────────────────────────────────────────────
function ActionCard({title,emoji,children}) {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionCardHeader}>
        <Text style={styles.actionCardEmoji}>{emoji}</Text>
        <Text style={styles.actionCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AdminScreen() {
  const authCtx = useAuth();
  const user    = authCtx?.user;
  const {addCrystals,addToCollection} = useGameStore();

  const [players, setPlayers]           = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedSave, setSelectedSave] = useState(null);
  const [selectedXp, setSelectedXp]     = useState(null);
  const [crystalAmount, setCrystalAmount] = useState('50');
  const [xpAmount, setXpAmount]         = useState('100');
  const [selectedCreature, setSelectedCreature] = useState('lumikos');
  const [feedback, setFeedback]         = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [tab, setTab]                   = useState('Stats');
  const [globalStats, setGlobalStats]   = useState({players:0,totalCrystals:0,totalCreatures:0,totalWins:0,totalSummons:0});
  const [confirmResetPlayer, setConfirmResetPlayer] = useState(false);
  const [guilds, setGuilds] = useState([]);
  const [showGuildReset, setShowGuildReset] = useState(false);
  const [guildSearch, setGuildSearch] = useState('');
  const [codesList, setCodesList]     = useState([]);
  const [releaseCreature, setReleaseCreature] = useState(Object.keys(EXCLUSIVE_CREATURES)[0]);
  const [releaseMsg, setReleaseMsg]   = useState('');
  const [releaseCrystals, setReleaseCrystals] = useState('0');
  const [releasing, setReleasing]     = useState(false);
  const [archivingSeasonInProgress, setArchivingSeasonInProgress] = useState(false);
  const [confirmSeasonReset, setConfirmSeasonReset] = useState(false);
  const [shopExclusives, setShopExclusives] = useState([]);
  const [shopPrice, setShopPrice]     = useState('500');
  const [shopQty, setShopQty]         = useState('10');
  const [newCode, setNewCode]         = useState('');
  const [newCodeCreature, setNewCodeCreature] = useState('lumikos');
  const [newCodeCrystals, setNewCodeCrystals] = useState('0');
  const [newCodeMaxUses, setNewCodeMaxUses]   = useState('100');
  const [newCodeExpiry, setNewCodeExpiry]     = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    newPlayersToday:0, newPlayersWeek:0,
    activeToday:[], activeWeek:[],
    topCreatures:{}, totalTrades:0,
    avgCrystals:0, avgWins:0,
  });
  const [newsList, setNewsList] = useState([]);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsType, setNewsType] = useState('news');
  const [newsEmoji, setNewsEmoji] = useState('📢');
  const [searchQuery, setSearchQuery]   = useState('');

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const titleAnim    = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  useEffect(()=>{
    const unsubNews = onValue(ref(db,'news'),snap=>{
      if (snap.exists()) {
        const items = Object.entries(snap.val())
          .map(([id,v])=>({id,...v}))
          .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
        setNewsList(items);
      } else setNewsList([]);
    });
    return unsubNews;
  },[]);

  useEffect(()=>{
    const unsubShop = onValue(ref(db,'exclusiveShop'),snap=>{
      if (snap.exists()) {
        const list = Object.entries(snap.val()).map(([id,v])=>({id,...v}));
        setShopExclusives(list);
      } else setShopExclusives([]);
    });

    const unsubCodes = onValue(ref(db,'codes'),snap=>{
      if (snap.exists()) {
        const list = Object.entries(snap.val()).map(([code,v])=>({code,...v}));
        setCodesList(list);
      } else setCodesList([]);
    });
    return unsubCodes;
  },[]);

  useEffect(()=>{
    // Analytics — calcul depuis les données joueurs
    const unsubAnalytics = onValue(ref(db,'players'),snap=>{
      if (!snap.exists()) return;
      const list = []; snap.forEach(c=>list.push({uid:c.key,...c.val()}));
      const now = Date.now();
      const oneDayAgo  = now - 86400000;
      const oneWeekAgo = now - 7*86400000;
      const newToday = list.filter(p=>(p.createdAt||0)>oneDayAgo).length;
      const newWeek  = list.filter(p=>(p.createdAt||0)>oneWeekAgo).length;
      const activeToday = list.filter(p=>(p.lastSeen||p.updatedAt||0)>oneDayAgo);
      const activeWeek  = list.filter(p=>(p.lastSeen||p.updatedAt||0)>oneWeekAgo);
      const avgCrystals = list.length ? Math.round(list.reduce((a,p)=>a+(p.crystalsEarned||0),0)/list.length) : 0;
      const avgWins     = list.length ? Math.round(list.reduce((a,p)=>a+(p.wins||0),0)/list.length) : 0;
      setAnalyticsData(prev=>({...prev,newPlayersToday:newToday,newPlayersWeek:newWeek,activeToday,activeWeek,avgCrystals,avgWins}));
    });
    return unsubAnalytics;
  },[]);

  useEffect(()=>{
    const unsub = onValue(ref(db,'players'),snap=>{
      if (!snap.exists()) return;
      const list = [];
      snap.forEach(c=>list.push({uid:c.key,...c.val()}));
      setPlayers(list);
      setGlobalStats({
        players:list.length,
        totalCrystals:list.reduce((a,p)=>a+(p.crystalsEarned||0),0),
        totalCreatures:list.reduce((a,p)=>a+(p.summonCount||0),0),
        totalWins:list.reduce((a,p)=>a+(p.wins||0),0),
        totalSummons:list.reduce((a,p)=>a+(p.summonCount||0),0),
      });
    });
    return unsub;
  },[]);

  function showFeedback(msg,type='success') {
    setFeedback(msg); setFeedbackType(type);
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim,{toValue:1,duration:200,useNativeDriver:true}),
      Animated.delay(2500),
      Animated.timing(feedbackAnim,{toValue:0,duration:300,useNativeDriver:true}),
    ]).start(()=>setFeedback(''));
  }

  async function loadPlayerSave(uid) {
    const [saveSnap,xpSnap,profSnap] = await Promise.all([
      get(ref(db,`saves/${uid}`)),
      get(ref(db,`xp/${uid}`)),
      get(ref(db,`players/${uid}`)),
    ]);
    setSelectedSave(saveSnap.exists()?saveSnap.val():null);
    setSelectedXp(xpSnap.exists()?xpSnap.val():null);
    if (profSnap.exists()) setSelectedPlayer(prev=>({...prev,...profSnap.val()}));
  }

  async function handleGiveCrystals(uid,name) {
    const amount=parseInt(crystalAmount); if(isNaN(amount)||amount<=0) return;
    const pendRef=ref(db,`players/${uid}/pendingCrystals`);
    const snap=await get(pendRef);
    await set(pendRef,(snap.exists()?snap.val()||0:0)+amount);
    if (selectedSave) {
      const ns={...selectedSave,crystals:(selectedSave.crystals||0)+amount};
      await set(ref(db,`saves/${uid}`),ns); setSelectedSave(ns);
    }
    showFeedback(`✓ +${amount} 💎 donnés à ${name}`);
  }

  async function handleRemoveCrystals(uid,name) {
    const amount=parseInt(crystalAmount); if(isNaN(amount)||amount<=0) return;
    if (selectedSave) {
      const ns={...selectedSave,crystals:Math.max(0,(selectedSave.crystals||0)-amount)};
      await set(ref(db,`saves/${uid}`),ns); setSelectedSave(ns);
    }
    showFeedback(`✓ -${amount} 💎 retirés à ${name}`,'warning');
  }

  async function handleGiveXp(uid,name) {
    const amount=parseInt(xpAmount); if(isNaN(amount)||amount<=0) return;
    const snap=await get(ref(db,`xp/${uid}`));
    const data=snap.exists()?snap.val():{totalXp:0,level:1,claimedLevels:{}};
    const newTotal=(data.totalXp||0)+amount;
    const computed=getLevelFromXp(newTotal);
    const newData={...data,totalXp:newTotal,...computed};
    await set(ref(db,`xp/${uid}`),newData); setSelectedXp(newData);
    showFeedback(`✓ +${amount} XP donnés à ${name}`);
  }

  async function handleSetXp(uid,name) {
    const amount=parseInt(xpAmount); if(isNaN(amount)||amount<0) return;
    const computed=getLevelFromXp(amount);
    const newData={totalXp:amount,...computed,claimedLevels:{}};
    await set(ref(db,`xp/${uid}`),newData); setSelectedXp(newData);
    showFeedback(`✓ XP de ${name} défini à ${amount}`);
  }

  async function handleGiveCreature(uid,name) {
    const creature=ALL_CREATURES[selectedCreature]; if(!creature) return;
    const save=selectedSave||{collection:[],crystals:50,wins:0,losses:0,summonCount:0};
    const newCol=[...(save.collection||[]),{...creature,uid:`admin_${Date.now()}`,obtainedAt:Date.now()}];
    const newSave={...save,collection:newCol};
    await set(ref(db,`saves/${uid}`),newSave); setSelectedSave(newSave);
    showFeedback(`✓ ${creature.name} donné à ${name}`);
  }

  async function handleRemoveCreature(uid,name,creatureUid) {
    if (!selectedSave) return;
    const newCol=(selectedSave.collection||[]).filter(c=>c.uid!==creatureUid);
    const newSave={...selectedSave,collection:newCol};
    await set(ref(db,`saves/${uid}`),newSave); setSelectedSave(newSave);
    showFeedback(`✓ Créature retirée`,'warning');
  }

  async function handleResetPlayer(uid,name) {
    await Promise.all([
      remove(ref(db,`saves/${uid}`)),
      remove(ref(db,`xp/${uid}`)),
      remove(ref(db,`quests/${uid}`)),
    ]);
    setSelectedSave(null); setSelectedXp(null); setConfirmResetPlayer(false);
    showFeedback(`✓ Compte de ${name} réinitialisé`,'warning');
  }

  // Nettoyer leaderboard
  async function handleClearLeaderboard() {
    const snap = await get(ref(db,'leaderboard'));
    if (!snap.exists()) { showFeedback('Leaderboard déjà vide'); return; }
    // Garde seulement l'entrée de l'admin
    const entries = snap.val();
    for (const uid of Object.keys(entries)) {
      if (uid !== user.uid) {
        await remove(ref(db,`leaderboard/${uid}`));
      }
    }
    showFeedback('✓ Leaderboard nettoyé (entrées corrompues supprimées)');
  }

  // Force mutation (debug)
  async function handleForceMutation() {
    const uid = user.uid;
    // Prend 2 créatures aléatoires de la collection
    const snap = await get(ref(db, `saves/${uid}`));
    const coll = snap.exists() ? (snap.val().collection || []) : [];
    if (coll.length < 2) { showFeedback('Pas assez de créatures !', 'warning'); return; }
    const pool = CREATURE_LIST.filter(c => !c.id.includes('_shiny'));
    const mutant = pool[Math.floor(Math.random() * pool.length)];
    const newColl = [...coll, { ...mutant, uid: `mutation_${Date.now()}`, obtainedAt: Date.now(), isMutant: true, fromBreeding: true }];
    await set(ref(db, `saves/${uid}`), { ...snap.val(), collection: newColl }).catch(() => {});
    showFeedback(`✓ Mutation forcée : ${mutant.name} ajouté !`);
  }

  // Reset score d'une guilde spécifique
  async function handleResetGuildScore(guildId, guildName) {
    try {
      const snap = await get(ref(db, `guilds/${guildId}/members`));
      if (!snap.exists()) { showFeedback('Guilde vide', 'warning'); return; }
      for (const memberId of Object.keys(snap.val())) {
        await set(ref(db, `guilds/${guildId}/members/${memberId}/score`), 0).catch(()=>{});
        await set(ref(db, `guilds/${guildId}/members/${memberId}/wins`), 0).catch(()=>{});
      }
      showFeedback(`✓ Score de "${guildName}" réinitialisé !`);
      setShowGuildReset(false);
    } catch(e) { showFeedback('Erreur', 'warning'); }
  }

  // Ajouter une créature exclusive à la boutique
  async function handleAddToShop() {
    const c = EXCLUSIVE_CREATURES[releaseCreature];
    if (!c) return;
    const price = parseInt(shopPrice)||500;
    const qty   = parseInt(shopQty)||10;
    await set(ref(db,`exclusiveShop/${releaseCreature}`),{
      creatureId: releaseCreature,
      name: c.name,
      rarityColor: c.rarityColor,
      rarityLabel: c.rarityLabel,
      price,
      qty,
      soldCount: 0,
      createdAt: Date.now(),
      active: true,
    }).catch(()=>{});
    showFeedback(`✓ ${c.name} ajouté à la boutique — ${price} 💎`);
  }

  async function handleRemoveFromShop(id) {
    await remove(ref(db,`exclusiveShop/${id}`)).catch(()=>{});
    showFeedback('✓ Retiré de la boutique','warning');
  }

  // Clôturer la saison et distribuer les récompenses
  async function handleEndSeason() {
    setArchivingSeasonInProgress(true);
    try {
      const snap = await get(ref(db,'leaderboard'));
      const data = snap.exists() ? snap.val() : {};
      const result = await archiveSeasonAndReset(data);
      showFeedback(`✓ Saison ${getSeasonLabel(getCurrentSeasonId())} archivée — ${result.totalPlayers} joueurs récompensés !`);
      setConfirmSeasonReset(false);
    } catch(e) { showFeedback('Erreur lors de la clôture','warning'); }
    setArchivingSeasonInProgress(false);
  }

  // Sortir une créature exclusive pour tous les joueurs
  async function handleReleaseCreature() {
    if (releasing) return;
    setReleasing(true);
    const snap = await get(ref(db,'players')).catch(()=>null);
    if (!snap||!snap.exists()) { showFeedback('Aucun joueur !','warning'); setReleasing(false); return; }
    const playerUids = Object.keys(snap.val());
    const creature = EXCLUSIVE_CREATURES[releaseCreature];
    let sent = 0;
    for (const puid of playerUids) {
      await push(ref(db,`inbox/${puid}`), {
        type:'system',
        title:`🎁 Créature exclusive : ${creature.name} !`,
        description:releaseMsg||`${creature.name} est maintenant disponible pour toi !`,
        crystals:parseInt(releaseCrystals)||0,
        creatureId:releaseCreature,
        claimed:false,
        createdAt:Date.now(),
        expiresAt:Date.now()+30*86400000,
      }).catch(()=>{});
      sent++;
    }
    showFeedback(`✓ ${creature.name} envoyé à ${sent} joueurs !`);
    setReleasing(false);
  }

  // Créer un code
  async function handleCreateCode() {
    const code = newCode.trim().toUpperCase();
    if (!code) { showFeedback('Entre un code !','warning'); return; }
    const snap = await get(ref(db,`codes/${code}`));
    if (snap.exists()) { showFeedback('Ce code existe déjà !','warning'); return; }
    const data = {
      creatureId: newCodeCreature!=='none'?newCodeCreature:null,
      crystals: parseInt(newCodeCrystals)||0,
      maxUses: parseInt(newCodeMaxUses)||100,
      usedCount: 0,
      createdAt: Date.now(),
      expiresAt: newCodeExpiry ? new Date(newCodeExpiry).getTime() : null,
    };
    await set(ref(db,`codes/${code}`),data).catch(()=>{});
    setNewCode(''); setNewCodeCrystals('0'); setNewCodeExpiry('');
    showFeedback(`✓ Code "${code}" créé !`);
  }

  async function handleDeleteCode(code) {
    await remove(ref(db,`codes/${code}`)).catch(()=>{});
    showFeedback(`✓ Code "${code}" supprimé`,'warning');
  }

  // Publier une news
  async function handlePublishNews() {
    if (!newsTitle.trim()||!newsContent.trim()) { showFeedback('Titre et contenu requis !','warning'); return; }
    const lines = newsContent.split('\n').filter(l=>l.trim());
    await push(ref(db,'news'), {
      type: newsType,
      tag: newsType==='patch'?'PATCH NOTES':newsType==='event'?'ÉVÉNEMENT':'ANNONCE',
      tagColor: newsType==='patch'?'#00e5ff':newsType==='event'?'#bf5fff':'#39ff8f',
      title: newsTitle.trim(),
      emoji: newsEmoji,
      bg: newsType==='patch'?['#0d1a2e','#07090f']:newsType==='event'?['#0a0018','#150030']:['#041204','#07090f'],
      content: lines,
      date: new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}),
      createdAt: Date.now(),
    });
    setNewsTitle(''); setNewsContent('');
    showFeedback('✓ Actualité publiée !');
  }

  async function handleDeleteNews(id) {
    await remove(ref(db,`news/${id}`));
    showFeedback('✓ Actualité supprimée','warning');
  }

  // Mon compte
  async function handleGiveSelfCrystals() {
    addCrystals(parseInt(crystalAmount)||50);
    showFeedback(`✓ +${crystalAmount} 💎 ajoutés`);
  }

  async function handleGiveSelfCreature() {
    const creature=ALL_CREATURES[selectedCreature];
    if (creature) { addToCollection({...creature}); showFeedback(`✓ ${creature.name} ajouté`); }
  }

  async function handleGiveSelfXp() {
    const uid=user.uid, amount=parseInt(xpAmount)||100;
    const snap=await get(ref(db,`xp/${uid}`));
    const data=snap.exists()?snap.val():{totalXp:0,level:1,claimedLevels:{}};
    const newTotal=(data.totalXp||0)+amount;
    const computed=getLevelFromXp(newTotal);
    await set(ref(db,`xp/${uid}`),{...data,totalXp:newTotal,...computed});
    showFeedback(`✓ +${amount} XP ajoutés`);
  }

  const xpLevel = selectedXp?getLevelFromXp(selectedXp.totalXp||0):null;
  const filteredPlayers = players.filter(p=>
    !searchQuery||p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── ACCÈS REFUSÉ ──
  if (!user||user.uid!==ADMIN_UID) return (
    <LinearGradient colors={['#07090f','#0d1220']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <Text style={{fontSize:60}}>🔒</Text>
          <Text style={styles.deniedTitle}>Accès refusé</Text>
          <Text style={styles.deniedText}>Zone réservée à l'administrateur.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>⚙️ ADMIN</Animated.Text>

        {/* Feedback */}
        {feedback!==''&&(
          <Animated.View style={[styles.feedbackBox,{
            opacity:feedbackAnim,
            backgroundColor:feedbackType==='warning'?'#ff444422':'#39ff8f22',
            borderColor:feedbackType==='warning'?'#ff444444':'#39ff8f44',
          }]}>
            <Text style={[styles.feedbackText,{color:feedbackType==='warning'?'#ff4444':'#39ff8f'}]}>{feedback}</Text>
          </Animated.View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['Stats','Joueurs','News','Analytics','Codes','Release','Mon compte'].map(t=>(
            <TouchableOpacity key={t} onPress={()=>setTab(t)}
              style={[styles.tabBtn,tab===t&&styles.tabActive]}>
              <Text style={[styles.tabText,tab===t&&styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── STATS GLOBALES ── */}
          {tab==='Stats'&&(
            <>
              <Text style={styles.sectionLabel}>📊 STATISTIQUES GLOBALES</Text>
              <View style={styles.statsGrid}>
                <StatCard label="Joueurs"     value={globalStats.players}        color="#00e5ff" emoji="👥"/>
                <StatCard label="Victoires"   value={globalStats.totalWins}      color="#39ff8f" emoji="⚔️"/>
                <StatCard label="Invocations" value={globalStats.totalSummons}   color="#bf5fff" emoji="✦"/>
                <StatCard label="💎 Total"    value={globalStats.totalCrystals}  color="#ffd700" emoji="💎"/>
              </View>

              {/* Clôture de saison */}
              <TouchableOpacity onPress={()=>setConfirmSeasonReset(true)}
                style={[styles.mainBtn,{borderColor:'#ffd70033',backgroundColor:'#ffd70012'}]}>
                <Text style={[styles.mainBtnText,{color:'#ffd700'}]}>🏆 Clôturer la saison {getSeasonLabel(getCurrentSeasonId())}</Text>
              </TouchableOpacity>

              {/* Reset guildes */}
              <TouchableOpacity onPress={async()=>{
                const snap = await get(ref(db,'guilds'));
                if (snap.exists()) setGuilds(Object.entries(snap.val()).map(([id,g])=>({id,...g})));
                else setGuilds([]);
                setShowGuildReset(true);
              }}
                style={[styles.mainBtn,{borderColor:'#ff444433',backgroundColor:'#ff444412'}]}>
                <Text style={[styles.mainBtnText,{color:'#ff6666'}]}>🔄 Réinitialiser score d'une guilde</Text>
              </TouchableOpacity>

              {/* Top joueurs */}
              <Text style={styles.sectionLabel}>🏆 TOP JOUEURS PAR VICTOIRES</Text>
              {[...players].sort((a,b)=>(b.wins||0)-(a.wins||0)).slice(0,5).map((p,i)=>(
                <View key={p.uid} style={[styles.topRow,{borderColor:i===0?'#ffd70033':'#1e2d4a'}]}>
                  <Text style={styles.topRank}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</Text>
                  <View style={styles.topAvatar}>
                    <Text style={styles.topAvatarText}>{p.name?.[0]?.toUpperCase()||'?'}</Text>
                  </View>
                  <Text style={[styles.topName,i===0&&{color:'#ffd700'}]}>{p.name}{p.uid===ADMIN_UID?' 👑':''}</Text>
                  <Text style={styles.topWins}>{p.wins||0} V</Text>
                </View>
              ))}

              {/* Infos app */}
              <View style={styles.appInfoCard}>
                <Text style={styles.sectionLabel}>📱 INFOS APP</Text>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Admin UID</Text><Text style={styles.infoVal} numberOfLines={1}>{ADMIN_UID.slice(0,20)}...</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Version</Text><Text style={styles.infoVal}>LUMINOS V4</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Joueurs actifs</Text><Text style={[styles.infoVal,{color:'#39ff8f'}]}>{players.filter(p=>p.wins>0).length}</Text></View>
              </View>

              {/* Nettoyer leaderboard */}
              <TouchableOpacity onPress={handleClearLeaderboard} style={[styles.resetBtn,{borderColor:'#ff690033',backgroundColor:'#ff690010'}]}>
                <Text style={[styles.resetBtnText,{color:'#ff6900'}]}>🧹 Nettoyer le leaderboard (supprimer données corrompues)</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── JOUEURS ── */}
          {tab==='Joueurs'&&(
            selectedPlayer?(
              <>
                <TouchableOpacity onPress={()=>{setSelectedPlayer(null);setSelectedSave(null);setSelectedXp(null);}} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Retour à la liste</Text>
                </TouchableOpacity>

                {/* Header joueur */}
                <LinearGradient colors={['#0d1a2e','#0a2040']} style={styles.playerHeader}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>{selectedPlayer.name?.[0]?.toUpperCase()||'?'}</Text>
                  </View>
                  <View style={{flex:1,gap:4}}>
                    <Text style={styles.playerName}>{selectedPlayer.name}{selectedPlayer.uid===ADMIN_UID?' 👑':''}</Text>
                    <Text style={styles.playerUid}>{selectedPlayer.uid?.slice(0,24)}...</Text>
                    {xpLevel&&<Text style={styles.playerLevel}>Niveau {xpLevel.level} · {selectedXp?.totalXp||0} XP total</Text>}
                  </View>
                </LinearGradient>

                {/* Stats joueur */}
                <View style={styles.statsGrid}>
                  <StatCard label="Cristaux"  value={selectedSave?.crystals||0}           color="#ffd700" emoji="💎"/>
                  <StatCard label="Créatures" value={selectedSave?.collection?.length||0}  color="#00e5ff" emoji="📖"/>
                  <StatCard label="Niveau"    value={`Nv.${xpLevel?.level||1}`}            color="#bf5fff" emoji="⭐"/>
                  <StatCard label="Victoires" value={selectedPlayer.wins||0}               color="#39ff8f" emoji="⚔️"/>
                </View>

                {/* XP Bar */}
                {xpLevel&&(
                  <View style={styles.xpCard}>
                    <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                      <Text style={styles.xpCardLabel}>XP · Niveau {xpLevel.level}</Text>
                      <Text style={styles.xpCardVal}>{xpLevel.currentXp}/{xpLevel.neededXp}</Text>
                    </View>
                    <View style={styles.xpBarBg}>
                      <View style={[styles.xpBarFill,{width:`${Math.min(100,(xpLevel.currentXp/xpLevel.neededXp)*100)}%`}]}/>
                    </View>
                  </View>
                )}

                {/* Cristaux */}
                <ActionCard title="Cristaux" emoji="💎">
                  <TextInput style={styles.input} value={crystalAmount} onChangeText={setCrystalAmount}
                    keyboardType="numeric" placeholder="Quantité" placeholderTextColor="#4a6080"/>
                  <View style={styles.btnRow}>
                    <TouchableOpacity onPress={()=>handleGiveCrystals(selectedPlayer.uid,selectedPlayer.name)}
                      style={[styles.btn,{borderColor:'#39ff8f44',backgroundColor:'#39ff8f15'}]}>
                      <Text style={[styles.btnText,{color:'#39ff8f'}]}>+ {crystalAmount} 💎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>handleRemoveCrystals(selectedPlayer.uid,selectedPlayer.name)}
                      style={[styles.btn,{borderColor:'#ff444444',backgroundColor:'#ff444415'}]}>
                      <Text style={[styles.btnText,{color:'#ff4444'}]}>- {crystalAmount} 💎</Text>
                    </TouchableOpacity>
                  </View>
                </ActionCard>

                {/* XP */}
                <ActionCard title="XP" emoji="⭐">
                  <TextInput style={styles.input} value={xpAmount} onChangeText={setXpAmount}
                    keyboardType="numeric" placeholder="Quantité XP" placeholderTextColor="#4a6080"/>
                  <View style={styles.btnRow}>
                    <TouchableOpacity onPress={()=>handleGiveXp(selectedPlayer.uid,selectedPlayer.name)}
                      style={[styles.btn,{borderColor:'#00e5ff44',backgroundColor:'#00e5ff15'}]}>
                      <Text style={[styles.btnText,{color:'#00e5ff'}]}>+ {xpAmount} XP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>handleSetXp(selectedPlayer.uid,selectedPlayer.name)}
                      style={[styles.btn,{borderColor:'#bf5fff44',backgroundColor:'#bf5fff15'}]}>
                      <Text style={[styles.btnText,{color:'#bf5fff'}]}>Définir à {xpAmount}</Text>
                    </TouchableOpacity>
                  </View>
                </ActionCard>

                {/* Créature */}
                <ActionCard title="Donner une créature" emoji="📖">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{flexDirection:'row',gap:6,paddingBottom:8}}>
                      {CREATURE_LIST.map(c=>(
                        <TouchableOpacity key={c.id} onPress={()=>setSelectedCreature(c.id)}
                          style={[styles.creatureChip,{
                            borderColor:selectedCreature===c.id?c.rarityColor:'#1e2d4a',
                            backgroundColor:selectedCreature===c.id?c.rarityColor+'22':'#0d1220',
                          }]}>
                          <Text style={[styles.creatureChipText,{color:c.rarityColor}]}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <TouchableOpacity onPress={()=>handleGiveCreature(selectedPlayer.uid,selectedPlayer.name)} style={styles.mainBtn}>
                    <Text style={styles.mainBtnText}>✦ Donner {ALL_CREATURES[selectedCreature]?.name}</Text>
                  </TouchableOpacity>
                </ActionCard>

                {/* Collection */}
                {selectedSave?.collection?.length>0&&(
                  <ActionCard title={`Collection (${selectedSave.collection.length})`} emoji="📦">
                    {[...new Set(selectedSave.collection.map(c=>c.id))].map(id=>{
                      const cr=ALL_CREATURES[id]; if(!cr) return null;
                      const count=selectedSave.collection.filter(c=>c.id===id).length;
                      return (
                        <View key={id} style={styles.collRow}>
                          <View style={[styles.collDot,{backgroundColor:cr.rarityColor}]}/>
                          <Text style={[styles.collName,{color:cr.rarityColor}]}>{cr.name}</Text>
                          <Text style={styles.collCount}>×{count}</Text>
                          <TouchableOpacity
                            onPress={()=>handleRemoveCreature(selectedPlayer.uid,selectedPlayer.name,selectedSave.collection.find(c=>c.id===id)?.uid)}
                            style={styles.removeBtn}>
                            <Text style={styles.removeBtnText}>−</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ActionCard>
                )}

                {/* Reset */}
                <TouchableOpacity onPress={()=>setConfirmResetPlayer(true)} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>⚠️ Réinitialiser le compte de {selectedPlayer.name}</Text>
                </TouchableOpacity>

                {/* Modal confirm */}
                <Modal visible={confirmResetPlayer} transparent animationType="fade">
                  <View style={styles.modalOverlay}>
                    <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
                      <Text style={{fontSize:44}}>⚠️</Text>
                      <Text style={styles.modalTitle}>Confirmer la réinitialisation</Text>
                      <Text style={styles.modalText}>Le compte de <Text style={{color:'#ff4444',fontWeight:'900'}}>{selectedPlayer.name}</Text> sera entièrement effacé.</Text>
                      <TouchableOpacity onPress={()=>handleResetPlayer(selectedPlayer.uid,selectedPlayer.name)}
                        style={styles.modalDangerBtn}>
                        <Text style={styles.modalDangerBtnText}>Oui, tout effacer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={()=>setConfirmResetPlayer(false)} style={styles.modalCancelBtn}>
                        <Text style={styles.modalCancelBtnText}>Annuler</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                </Modal>
              </>
            ):(
              <>
                {/* Recherche */}
                <View style={styles.searchRow}>
                  <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery}
                    placeholder="🔍 Rechercher un joueur..." placeholderTextColor="#4a6080"/>
                  {searchQuery!==''&&(
                    <TouchableOpacity onPress={()=>setSearchQuery('')} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.sectionLabel}>JOUEURS ({filteredPlayers.length}/{players.length})</Text>
                {filteredPlayers.length===0&&<Text style={styles.emptyText}>Aucun joueur trouvé</Text>}
                {filteredPlayers.map(p=>(
                  <TouchableOpacity key={p.uid} onPress={()=>{setSelectedPlayer(p);loadPlayerSave(p.uid);}}
                    style={[styles.playerRow,p.uid===ADMIN_UID&&{borderColor:'#ffd70033'}]}>
                    <View style={[styles.playerAvatarSmall,p.uid===ADMIN_UID&&{backgroundColor:'#ffd70022',borderColor:'#ffd70044'}]}>
                      <Text style={[styles.playerAvatarText,p.uid===ADMIN_UID&&{color:'#ffd700'}]}>{p.name?.[0]?.toUpperCase()||'?'}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={[styles.playerRowName,p.uid===ADMIN_UID&&{color:'#ffd700'}]}>{p.name}{p.uid===ADMIN_UID?' 👑':''}</Text>
                      <Text style={styles.playerRowSub}>{p.wins||0}V · {p.summonCount||0} invoc.</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </>
            )
          )}

          {/* ── NEWS ── */}
          {tab==='News'&&(
            <>
              <Text style={styles.sectionLabel}>📰 PUBLIER UNE ACTUALITÉ</Text>
              <ActionCard title="Nouvelle actualité" emoji="📢">
                {/* Type */}
                <View style={{flexDirection:'row',gap:8}}>
                  {[{id:'news',label:'Annonce',color:'#39ff8f'},{id:'patch',label:'Patch',color:'#00e5ff'},{id:'event',label:'Événement',color:'#bf5fff'}].map(t=>(
                    <TouchableOpacity key={t.id} onPress={()=>setNewsType(t.id)}
                      style={[styles.btn,{flex:1,borderColor:newsType===t.id?t.color+'55':'#1e2d4a',backgroundColor:newsType===t.id?t.color+'15':'#0d1220'}]}>
                      <Text style={[styles.btnText,{color:newsType===t.id?t.color:'#4a6080'}]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Emoji */}
                <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                  <Text style={{color:'#4a6080',fontSize:12}}>Emoji :</Text>
                  <TextInput style={[styles.input,{flex:1,fontSize:20,textAlign:'center'}]}
                    value={newsEmoji} onChangeText={setNewsEmoji} maxLength={2}/>
                </View>
                {/* Titre */}
                <TextInput style={styles.input} value={newsTitle} onChangeText={setNewsTitle}
                  placeholder="Titre de l'actualité..." placeholderTextColor="#4a6080" maxLength={60}/>
                {/* Contenu */}
                <TextInput style={[styles.input,{height:120,textAlignVertical:'top'}]}
                  value={newsContent} onChangeText={setNewsContent}
                  placeholder={"Une ligne = un bullet point\nEx: ✦ Nouvelle feature\n🔥 Correction de bug"}
                  placeholderTextColor="#4a6080" multiline maxLength={500}/>
                <TouchableOpacity onPress={handlePublishNews}
                  style={[styles.mainBtn,{borderColor:'#39ff8f44',backgroundColor:'#39ff8f15'}]}>
                  <Text style={[styles.mainBtnText,{color:'#39ff8f'}]}>📢 Publier</Text>
                </TouchableOpacity>
              </ActionCard>

              {/* Liste news existantes */}
              <Text style={styles.sectionLabel}>ACTUALITÉS PUBLIÉES ({newsList.length})</Text>
              {newsList.length===0&&<Text style={styles.emptyText}>Aucune actualité Firebase</Text>}
              {newsList.map(n=>(
                <View key={n.id} style={[styles.newsRow,{borderColor:(n.tagColor||'#1e2d4a')+'44'}]}>
                  <Text style={{fontSize:22,width:36,textAlign:'center'}}>{n.emoji||'📢'}</Text>
                  <View style={{flex:1,gap:2}}>
                    <Text style={[styles.newsRowTitle,{color:n.tagColor||'#c8daf0'}]}>{n.title}</Text>
                    <Text style={styles.newsRowDate}>{n.date}</Text>
                  </View>
                  <TouchableOpacity onPress={()=>handleDeleteNews(n.id)}
                    style={styles.newsDeleteBtn}>
                    <Text style={styles.newsDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* ── CODES ── */}
          {tab==='Codes'&&(
            <>
              <Text style={styles.sectionLabel}>🔑 CRÉER UN CODE SECRET</Text>
              <ActionCard title="Nouveau code" emoji="🔑">
                {/* Code */}
                <TextInput style={[styles.input,{letterSpacing:3,textTransform:'uppercase',fontWeight:'800'}]}
                  value={newCode} onChangeText={t=>setNewCode(t.toUpperCase())}
                  placeholder="Ex: LUMINOS2026" placeholderTextColor="#4a6080" maxLength={20}
                  autoCapitalize="characters"/>
                {/* Cristaux */}
                <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                  <Text style={{color:'#4a6080',fontSize:12,width:80}}>💎 Cristaux</Text>
                  <TextInput style={[styles.input,{flex:1}]} value={newCodeCrystals}
                    onChangeText={setNewCodeCrystals} keyboardType="numeric" placeholder="0" placeholderTextColor="#4a6080"/>
                </View>
                {/* Max utilisations */}
                <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                  <Text style={{color:'#4a6080',fontSize:12,width:80}}>👥 Max uses</Text>
                  <TextInput style={[styles.input,{flex:1}]} value={newCodeMaxUses}
                    onChangeText={setNewCodeMaxUses} keyboardType="numeric" placeholder="100" placeholderTextColor="#4a6080"/>
                </View>
                {/* Créature */}
                <Text style={{color:'#4a6080',fontSize:12}}>✦ Créature exclusive :</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection:'row',gap:6,paddingBottom:4}}>
                    <TouchableOpacity onPress={()=>setNewCodeCreature('none')}
                      style={[styles.creatureChip,{borderColor:newCodeCreature==='none'?'#ff444444':'#1e2d4a',backgroundColor:newCodeCreature==='none'?'#ff444415':'#0d1220'}]}>
                      <Text style={[styles.creatureChipText,{color:'#4a6080'}]}>Aucune</Text>
                    </TouchableOpacity>
                    {CREATURE_LIST.map(c=>(
                      <TouchableOpacity key={c.id} onPress={()=>setNewCodeCreature(c.id)}
                        style={[styles.creatureChip,{borderColor:newCodeCreature===c.id?c.rarityColor:'#1e2d4a',backgroundColor:newCodeCreature===c.id?c.rarityColor+'22':'#0d1220'}]}>
                        <Text style={[styles.creatureChipText,{color:c.rarityColor}]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <TouchableOpacity onPress={handleCreateCode}
                  style={[styles.mainBtn,{borderColor:'#bf5fff44',backgroundColor:'#bf5fff15'}]}>
                  <Text style={[styles.mainBtnText,{color:'#bf5fff'}]}>🔑 Créer le code</Text>
                </TouchableOpacity>
              </ActionCard>

              {/* Liste codes */}
              <Text style={styles.sectionLabel}>CODES ACTIFS ({codesList.length})</Text>
              {codesList.length===0&&<Text style={styles.emptyText}>Aucun code créé</Text>}
              {codesList.map(c=>(
                <View key={c.code} style={[styles.topRow,{borderColor:'#bf5fff22',flexDirection:'column',gap:6,alignItems:'flex-start'}]}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:8,width:'100%'}}>
                    <Text style={{color:'#bf5fff',fontSize:16,fontWeight:'900',letterSpacing:2,flex:1}}>🔑 {c.code}</Text>
                    <TouchableOpacity onPress={()=>handleDeleteCode(c.code)}
                      style={[styles.removeBtn]}>
                      <Text style={styles.removeBtnText}>−</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
                    {c.crystals>0&&<Text style={{color:'#ffd700',fontSize:11}}>💎 {c.crystals} cristaux</Text>}
                    {c.creatureId&&<Text style={{color:'#00e5ff',fontSize:11}}>✦ {ALL_CREATURES[c.creatureId]?.name||c.creatureId}</Text>}
                    <Text style={{color:'#4a6080',fontSize:11}}>👥 {c.usedCount||0}/{c.maxUses||'∞'} uses</Text>
                    {c.expiresAt&&<Text style={{color:Date.now()>c.expiresAt?'#ff4444':'#39ff8f',fontSize:11}}>
                      📅 {Date.now()>c.expiresAt?'Expiré':'Expire le '+new Date(c.expiresAt).toLocaleDateString('fr-FR')}
                    </Text>}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── RELEASE ── */}
          {tab==='Release'&&(
            <>
              <Text style={styles.sectionLabel}>🚀 SORTIR UNE CRÉATURE EXCLUSIVE</Text>
              <View style={styles.appInfoCard}>
                <Text style={{color:'#4a6080',fontSize:12,lineHeight:18}}>
                  Envoie une créature exclusive dans la boîte de réception de TOUS les joueurs en un clic.
                </Text>
              </View>

              <ActionCard title="Choisir la créature" emoji="✦">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection:'row',gap:8,paddingBottom:8}}>
                    {Object.values(EXCLUSIVE_CREATURES).map(c=>(
                      <TouchableOpacity key={c.id} onPress={()=>setReleaseCreature(c.id)}
                        style={[styles.creatureChip,{
                          borderColor:releaseCreature===c.id?c.rarityColor:'#1e2d4a',
                          backgroundColor:releaseCreature===c.id?c.rarityColor+'22':'#0d1220',
                          padding:10,
                        }]}>
                        <Text style={[styles.creatureChipText,{color:c.rarityColor,fontSize:12}]}>{c.rarityLabel}</Text>
                        <Text style={[styles.creatureChipText,{color:c.rarityColor,fontWeight:'900'}]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Preview */}
                {EXCLUSIVE_CREATURES[releaseCreature]&&(()=>{
                  const c=EXCLUSIVE_CREATURES[releaseCreature];
                  return (
                    <LinearGradient colors={c.bgGradient} style={{borderRadius:14,padding:14,borderWidth:1,borderColor:c.rarityColor+'44',gap:6}}>
                      <Text style={{color:c.rarityColor,fontSize:16,fontWeight:'900'}}>{c.name}</Text>
                      <Text style={{color:'#4a6080',fontSize:11}}>{c.description}</Text>
                      <View style={{flexDirection:'row',gap:8}}>
                        <Text style={{color:'#39ff8f',fontSize:11}}>❤️ {c.stats.hp}</Text>
                        <Text style={{color:'#ff4fa3',fontSize:11}}>⚔️ {c.stats.atk}</Text>
                        <Text style={{color:'#ffd700',fontSize:11}}>💨 {c.stats.spd}</Text>
                      </View>
                    </LinearGradient>
                  );
                })()}

                {/* Message */}
                <TextInput style={styles.input} value={releaseMsg} onChangeText={setReleaseMsg}
                  placeholder="Message pour les joueurs (optionnel)..." placeholderTextColor="#4a6080"/>

                {/* Cristaux bonus */}
                <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                  <Text style={{color:'#4a6080',fontSize:12,width:100}}>💎 Cristaux bonus</Text>
                  <TextInput style={[styles.input,{flex:1}]} value={releaseCrystals}
                    onChangeText={setReleaseCrystals} keyboardType="numeric" placeholder="0" placeholderTextColor="#4a6080"/>
                </View>

                {/* Prix et quantité */}
                <View style={{flexDirection:'row',gap:8}}>
                  <View style={{flex:1,gap:4}}>
                    <Text style={{color:'#4a6080',fontSize:11}}>💎 Prix boutique</Text>
                    <TextInput style={styles.input} value={shopPrice} onChangeText={setShopPrice}
                      keyboardType="numeric" placeholder="500" placeholderTextColor="#4a6080"/>
                  </View>
                  <View style={{flex:1,gap:4}}>
                    <Text style={{color:'#4a6080',fontSize:11}}>📦 Quantité</Text>
                    <TextInput style={styles.input} value={shopQty} onChangeText={setShopQty}
                      keyboardType="numeric" placeholder="10" placeholderTextColor="#4a6080"/>
                  </View>
                </View>

                <TouchableOpacity onPress={handleAddToShop}
                  style={[styles.mainBtn,{borderColor:'#ffd70044',backgroundColor:'#ffd70015'}]}>
                  <Text style={[styles.mainBtnText,{color:'#ffd700'}]}>🛍️ Ajouter à la boutique</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleReleaseCreature} disabled={releasing}
                  style={[styles.mainBtn,{borderColor:'#39ff8f44',backgroundColor:'#39ff8f15'},releasing&&{opacity:0.5}]}>
                  <Text style={[styles.mainBtnText,{color:'#39ff8f'}]}>
                    {releasing?'Envoi en cours...':'🚀 Envoyer à tous les joueurs'}
                  </Text>
                </TouchableOpacity>
              </ActionCard>

              {/* Shop actuel */}
              {shopExclusives.length>0&&(
                <ActionCard title="En boutique actuellement" emoji="🛍️">
                  {shopExclusives.map(s=>(
                    <View key={s.id} style={[styles.topRow,{borderColor:'#ffd70022'}]}>
                      <View style={{flex:1,gap:2}}>
                        <Text style={{color:s.rarityColor,fontWeight:'900',fontSize:13}}>{s.name}</Text>
                        <Text style={{color:'#4a6080',fontSize:11}}>💎 {s.price} · {s.soldCount||0}/{s.qty} vendus</Text>
                      </View>
                      <TouchableOpacity onPress={()=>handleRemoveFromShop(s.id)}
                        style={[styles.removeBtn]}>
                        <Text style={styles.removeBtnText}>−</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ActionCard>
              )}
            </>
          )}

          {/* ── ANALYTICS ── */}
          {tab==='Analytics'&&(
            <>
              <Text style={styles.sectionLabel}>📊 ANALYTICS JOUEURS</Text>

              {/* Nouveaux joueurs */}
              <View style={styles.analyticsGrid}>
                <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.analyticsCard,{borderColor:'#00e5ff33'}]}>
                  <Text style={styles.analyticsEmoji}>🆕</Text>
                  <Text style={[styles.analyticsVal,{color:'#00e5ff'}]}>{analyticsData.newPlayersToday}</Text>
                  <Text style={styles.analyticsLbl}>Nouveaux aujourd'hui</Text>
                </LinearGradient>
                <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.analyticsCard,{borderColor:'#39ff8f33'}]}>
                  <Text style={styles.analyticsEmoji}>📅</Text>
                  <Text style={[styles.analyticsVal,{color:'#39ff8f'}]}>{analyticsData.newPlayersWeek}</Text>
                  <Text style={styles.analyticsLbl}>Nouveaux cette semaine</Text>
                </LinearGradient>
                <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.analyticsCard,{borderColor:'#ffd70033'}]}>
                  <Text style={styles.analyticsEmoji}>⚡</Text>
                  <Text style={[styles.analyticsVal,{color:'#ffd700'}]}>{analyticsData.activeToday.length}</Text>
                  <Text style={styles.analyticsLbl}>Actifs aujourd'hui</Text>
                </LinearGradient>
                <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.analyticsCard,{borderColor:'#bf5fff33'}]}>
                  <Text style={styles.analyticsEmoji}>🔥</Text>
                  <Text style={[styles.analyticsVal,{color:'#bf5fff'}]}>{analyticsData.activeWeek.length}</Text>
                  <Text style={styles.analyticsLbl}>Actifs cette semaine</Text>
                </LinearGradient>
              </View>

              {/* Moyennes */}
              <Text style={styles.sectionLabel}>📈 MOYENNES PAR JOUEUR</Text>
              <View style={styles.appInfoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>💎 Cristaux moyens gagnés</Text>
                  <Text style={[styles.infoVal,{color:'#ffd700'}]}>{analyticsData.avgCrystals}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>⚔️ Victoires moyennes</Text>
                  <Text style={[styles.infoVal,{color:'#39ff8f'}]}>{analyticsData.avgWins}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>👥 Total joueurs inscrits</Text>
                  <Text style={[styles.infoVal,{color:'#00e5ff'}]}>{globalStats.players}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>⚔️ Total victoires</Text>
                  <Text style={[styles.infoVal,{color:'#39ff8f'}]}>{globalStats.totalWins}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>✦ Total invocations</Text>
                  <Text style={[styles.infoVal,{color:'#bf5fff'}]}>{globalStats.totalSummons}</Text>
                </View>
              </View>

              {/* Joueurs actifs aujourd'hui */}
              <Text style={styles.sectionLabel}>⚡ ACTIFS AUJOURD'HUI ({analyticsData.activeToday.length})</Text>
              {analyticsData.activeToday.length===0
                ?<Text style={styles.emptyText}>Aucun joueur actif aujourd'hui</Text>
                :analyticsData.activeToday.slice(0,10).map(p=>(
                  <View key={p.uid} style={[styles.topRow,{borderColor:'#ffd70022'}]}>
                    <View style={styles.topAvatar}>
                      <Text style={styles.topAvatarText}>{p.name?.[0]?.toUpperCase()||'?'}</Text>
                    </View>
                    <Text style={[styles.topName]}>{p.name}{p.uid===ADMIN_UID?' 👑':''}</Text>
                    <Text style={[styles.topWins,{color:'#ffd700'}]}>{p.crystalsEarned||0} 💎</Text>
                  </View>
                ))
              }

              {/* Rétention */}
              <Text style={styles.sectionLabel}>📉 RÉTENTION</Text>
              <View style={styles.appInfoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Taux actifs / total (7j)</Text>
                  <Text style={[styles.infoVal,{color:analyticsData.activeWeek.length/Math.max(1,globalStats.players)>0.3?'#39ff8f':'#ff4444'}]}>
                    {globalStats.players>0?Math.round((analyticsData.activeWeek.length/globalStats.players)*100):0}%
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Taux actifs / total (1j)</Text>
                  <Text style={[styles.infoVal,{color:analyticsData.activeToday.length/Math.max(1,globalStats.players)>0.1?'#39ff8f':'#ff4444'}]}>
                    {globalStats.players>0?Math.round((analyticsData.activeToday.length/globalStats.players)*100):0}%
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Joueurs avec victoires</Text>
                  <Text style={[styles.infoVal,{color:'#39ff8f'}]}>{players.filter(p=>p.wins>0).length}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Joueurs sans victoire</Text>
                  <Text style={[styles.infoVal,{color:'#ff4444'}]}>{players.filter(p=>!(p.wins>0)).length}</Text>
                </View>
              </View>
            </>
          )}

          {/* ── MON COMPTE ── */}
          {tab==='Mon compte'&&(
            <>
              <View style={[styles.myAccountHeader,{borderColor:'#ffd70033'}]}>
                <Text style={{fontSize:32}}>👑</Text>
                <View>
                  <Text style={styles.myAccountName}>{user.displayName||'Admin'}</Text>
                  <Text style={styles.myAccountSub}>Administrateur LUMINOS</Text>
                </View>
              </View>

              <ActionCard title="Cristaux" emoji="💎">
                <TextInput style={styles.input} value={crystalAmount} onChangeText={setCrystalAmount}
                  keyboardType="numeric" placeholder="Quantité" placeholderTextColor="#4a6080"/>
                <TouchableOpacity onPress={handleGiveSelfCrystals} style={styles.mainBtn}>
                  <Text style={styles.mainBtnText}>+ {crystalAmount} 💎 à mon compte</Text>
                </TouchableOpacity>
              </ActionCard>

              <ActionCard title="XP" emoji="⭐">
                <TextInput style={styles.input} value={xpAmount} onChangeText={setXpAmount}
                  keyboardType="numeric" placeholder="Quantité XP" placeholderTextColor="#4a6080"/>
                <TouchableOpacity onPress={handleGiveSelfXp}
                  style={[styles.mainBtn,{borderColor:'#00e5ff44',backgroundColor:'#00e5ff15'}]}>
                  <Text style={[styles.mainBtnText,{color:'#00e5ff'}]}>+ {xpAmount} XP à mon compte</Text>
                </TouchableOpacity>
              </ActionCard>

              <ActionCard title="Force Mutation (debug)" emoji="⚡">
                <Text style={{color:'#4a6080',fontSize:12,lineHeight:18}}>
                  Ajoute une créature mutante aléatoire directement dans ta collection. Simule le résultat d'un breeding avec 10% de chance.
                </Text>
                <TouchableOpacity onPress={handleForceMutation}
                  style={[styles.mainBtn,{borderColor:'#00e5ff44',backgroundColor:'#00e5ff15'}]}>
                  <Text style={[styles.mainBtnText,{color:'#00e5ff'}]}>⚡ Forcer une mutation</Text>
                </TouchableOpacity>
              </ActionCard>

              <ActionCard title="Ajouter une créature" emoji="📖">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection:'row',gap:6,paddingBottom:8}}>
                    {CREATURE_LIST.map(c=>(
                      <TouchableOpacity key={c.id} onPress={()=>setSelectedCreature(c.id)}
                        style={[styles.creatureChip,{
                          borderColor:selectedCreature===c.id?c.rarityColor:'#1e2d4a',
                          backgroundColor:selectedCreature===c.id?c.rarityColor+'22':'#0d1220',
                        }]}>
                        <Text style={[styles.creatureChipText,{color:c.rarityColor}]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <TouchableOpacity onPress={handleGiveSelfCreature} style={styles.mainBtn}>
                  <Text style={styles.mainBtnText}>✦ Ajouter {ALL_CREATURES[selectedCreature]?.name}</Text>
                </TouchableOpacity>
              </ActionCard>
            </>
          )}

        </ScrollView>

      {/* Modal confirm fin de saison */}
      <Modal visible={confirmSeasonReset} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1a1000','#07090f']} style={[styles.modalBox,{borderColor:'#ffd70044'}]}>
            <Text style={{fontSize:44}}>🏆</Text>
            <Text style={styles.modalTitle}>Clôturer la saison ?</Text>
            <Text style={styles.modalText}>
              Tous les joueurs recevront leurs récompenses de fin de saison ({getSeasonLabel(getCurrentSeasonId())}) dans leur boîte de réception, selon leur classement actuel.
            </Text>
            <TouchableOpacity onPress={handleEndSeason} disabled={archivingSeasonInProgress}
              style={[styles.modalDangerBtn,{backgroundColor:'#ffd70022',borderColor:'#ffd70044'}]}>
              <Text style={[styles.modalDangerBtnText,{color:'#ffd700'}]}>
                {archivingSeasonInProgress?'Distribution en cours...':'✓ Confirmer et distribuer'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setConfirmSeasonReset(false)} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal reset guilde */}
      <Modal visible={showGuildReset} transparent animationType="slide" onRequestClose={()=>setShowGuildReset(false)}>
        <View style={styles.guildModalOverlay}>
          <LinearGradient colors={['#0d1220','#07090f']} style={styles.guildModalBox}>
            {/* Header */}
            <View style={styles.guildModalHeader}>
              <Text style={styles.guildModalTitle}>🔄 Choisir une guilde</Text>
              <TouchableOpacity onPress={()=>setShowGuildReset(false)} style={styles.guildModalClose}>
                <Text style={styles.guildModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {/* Barre de recherche */}
            <TextInput
              style={styles.guildSearchInput}
              value={guildSearch}
              onChangeText={setGuildSearch}
              placeholder="🔍 Rechercher une guilde..."
              placeholderTextColor="#4a6080"
            />
            {/* Liste guildes */}
            <ScrollView showsVerticalScrollIndicator={false} style={{width:'100%'}}>
              {guilds.length===0
                ?<Text style={{color:'#4a6080',textAlign:'center',padding:24,fontSize:13}}>Aucune guilde trouvée</Text>
                :guilds
                  .filter(g=>!guildSearch||g.name?.toLowerCase().includes(guildSearch.toLowerCase()))
                  .map(g=>(
                    <TouchableOpacity key={g.id} onPress={()=>handleResetGuildScore(g.id,g.name)}
                      style={styles.guildResetRow}>
                      <Text style={styles.guildResetEmoji}>{g.emblem||'⚔️'}</Text>
                      <View style={{flex:1,gap:2}}>
                        <Text style={styles.guildResetName}>{g.name}</Text>
                        <Text style={styles.guildResetMeta}>{Object.keys(g.members||{}).length} membres · Score : {
                          Object.values(g.members||{}).reduce((a,m)=>a+(m.score||0),0).toLocaleString()
                        } pts</Text>
                      </View>
                      <View style={styles.guildResetBtn}>
                        <Text style={styles.guildResetBtnText}>Reset</Text>
                      </View>
                    </TouchableOpacity>
                  ))
              }
            </ScrollView>
            <TouchableOpacity onPress={()=>setShowGuildReset(false)} style={{padding:14}}>
              <Text style={{color:'#4a6080',fontSize:13,textAlign:'center'}}>Annuler</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:4,textAlign:'center',paddingTop:16,marginBottom:8},
  denied:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
  deniedTitle:{color:'#fff',fontSize:22,fontWeight:'900'},
  deniedText:{color:'#4a6080',fontSize:14},
  feedbackBox:{borderWidth:1,borderRadius:12,padding:10,marginBottom:8,alignItems:'center'},
  feedbackText:{fontSize:13,fontWeight:'700'},
  tabRow:{flexDirection:'row',gap:6,marginBottom:10},
  tabBtn:{flex:1,alignItems:'center',paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  tabActive:{borderColor:'#ffd70044',backgroundColor:'#ffd70012'},
  tabText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  tabTextActive:{color:'#ffd700'},
  scroll:{gap:12,paddingBottom:32},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  emptyText:{color:'#4a6080',fontSize:13,textAlign:'center',paddingVertical:16},
  // Stats
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  statCard:{flex:1,minWidth:'45%',backgroundColor:'#0d1220',borderWidth:1,borderRadius:14,padding:12,alignItems:'center',gap:4},
  statEmoji:{fontSize:20},
  statVal:{fontSize:20,fontWeight:'900'},
  statLbl:{fontSize:8,color:'#4a6080',letterSpacing:1,textTransform:'uppercase',textAlign:'center'},
  // Top players
  topRow:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#0d1220',borderWidth:1,borderRadius:14,padding:12},
  topRank:{fontSize:18,width:28,textAlign:'center'},
  topAvatar:{width:34,height:34,borderRadius:17,backgroundColor:'#1e2d4a',alignItems:'center',justifyContent:'center'},
  topAvatarText:{color:'#fff',fontSize:14,fontWeight:'900'},
  topName:{flex:1,color:'#c8daf0',fontSize:13,fontWeight:'700'},
  topWins:{color:'#39ff8f',fontSize:12,fontWeight:'700'},
  // App info
  appInfoCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:8},
  infoRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:4,borderBottomWidth:1,borderBottomColor:'#1e2d4a'},
  infoLabel:{color:'#4a6080',fontSize:12},
  infoVal:{color:'#c8daf0',fontSize:12,fontWeight:'700',flex:1,textAlign:'right'},
  // Players
  searchRow:{flexDirection:'row',gap:8,alignItems:'center'},
  searchInput:{flex:1,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,paddingHorizontal:14,paddingVertical:10,color:'#fff',fontSize:14},
  clearBtn:{backgroundColor:'#1e2d4a',borderRadius:10,width:38,height:38,alignItems:'center',justifyContent:'center'},
  clearBtnText:{color:'#4a6080',fontSize:14},
  playerRow:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14},
  playerAvatar:{width:52,height:52,borderRadius:26,backgroundColor:'#00e5ff22',borderWidth:1,borderColor:'#00e5ff44',alignItems:'center',justifyContent:'center'},
  playerAvatarSmall:{width:42,height:42,borderRadius:21,backgroundColor:'#00e5ff22',borderWidth:1,borderColor:'#00e5ff44',alignItems:'center',justifyContent:'center'},
  playerAvatarText:{color:'#00e5ff',fontSize:20,fontWeight:'900'},
  playerInfo:{flex:1},
  playerRowName:{color:'#c8daf0',fontSize:14,fontWeight:'700'},
  playerRowSub:{color:'#4a6080',fontSize:11,marginTop:2},
  arrow:{color:'#4a6080',fontSize:20},
  backBtn:{paddingVertical:8},
  backBtnText:{color:'#ffd700',fontSize:14,fontWeight:'700'},
  playerHeader:{borderRadius:18,padding:16,flexDirection:'row',alignItems:'center',gap:12},
  playerName:{color:'#fff',fontSize:18,fontWeight:'900'},
  playerUid:{color:'#4a6080',fontSize:9},
  playerLevel:{color:'#00e5ff',fontSize:11,fontWeight:'700'},
  xpCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#00e5ff22',borderRadius:12,padding:12,gap:6},
  xpCardLabel:{color:'#4a6080',fontSize:11},
  xpCardVal:{color:'#00e5ff',fontSize:11,fontWeight:'700'},
  xpBarBg:{height:6,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  xpBarFill:{height:'100%',backgroundColor:'#00e5ff',borderRadius:4},
  // ActionCard
  actionCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:10},
  actionCardHeader:{flexDirection:'row',alignItems:'center',gap:8},
  actionCardEmoji:{fontSize:18},
  actionCardTitle:{color:'#c8daf0',fontSize:13,fontWeight:'800'},
  input:{backgroundColor:'#07090f',borderWidth:1,borderColor:'#1e2d4a',borderRadius:10,paddingHorizontal:12,paddingVertical:10,color:'#fff',fontSize:15},
  btnRow:{flexDirection:'row',gap:8},
  btn:{flex:1,borderWidth:1,borderRadius:12,padding:11,alignItems:'center'},
  btnText:{fontSize:12,fontWeight:'800'},
  mainBtn:{borderWidth:1,borderColor:'#ffd70044',backgroundColor:'#ffd70015',borderRadius:12,padding:13,alignItems:'center'},
  mainBtnText:{color:'#ffd700',fontSize:13,fontWeight:'900'},
  creatureChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6},
  creatureChipText:{fontSize:10,fontWeight:'700'},
  collRow:{flexDirection:'row',alignItems:'center',paddingVertical:6,borderBottomWidth:1,borderBottomColor:'#1e2d4a',gap:8},
  collDot:{width:8,height:8,borderRadius:4},
  collName:{flex:1,fontSize:13,fontWeight:'700'},
  collCount:{color:'#4a6080',fontSize:12},
  removeBtn:{backgroundColor:'#ff444422',borderRadius:8,paddingHorizontal:10,paddingVertical:4},
  removeBtnText:{color:'#ff4444',fontSize:14,fontWeight:'900'},
  resetBtn:{backgroundColor:'#ff444418',borderWidth:1,borderColor:'#ff444433',borderRadius:14,padding:14,alignItems:'center'},
  resetBtnText:{color:'#ff6666',fontSize:12,fontWeight:'700'},
  // My account
  myAccountHeader:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#0d1220',borderWidth:1,borderRadius:16,padding:14},
  myAccountName:{color:'#ffd700',fontSize:18,fontWeight:'900'},
  myAccountSub:{color:'#4a6080',fontSize:11},
  // Modal
  modalOverlay:{flex:1,backgroundColor:'#000000cc',justifyContent:'center',padding:32},
  modalBox:{borderWidth:1,borderColor:'#ff444444',borderRadius:24,padding:24,alignItems:'center',gap:12},
  modalTitle:{color:'#fff',fontSize:18,fontWeight:'900',textAlign:'center'},
  modalText:{color:'#6a84a0',fontSize:13,textAlign:'center',lineHeight:20},
  modalDangerBtn:{backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444444',borderRadius:14,paddingVertical:14,paddingHorizontal:24,alignItems:'center',width:'100%'},
  modalDangerBtnText:{color:'#ff4444',fontSize:14,fontWeight:'900'},
  modalCancelBtn:{padding:12},
  modalCancelBtnText:{color:'#4a6080',fontSize:13},
  // Guild reset modal
  guildModalOverlay:{flex:1,backgroundColor:'#000000cc',justifyContent:'flex-end'},
  guildModalBox:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'80%',borderTopWidth:1,borderColor:'#1e2d4a'},
  guildModalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  guildModalTitle:{color:'#fff',fontSize:16,fontWeight:'900'},
  guildModalClose:{width:32,height:32,borderRadius:16,backgroundColor:'#1e2d4a',alignItems:'center',justifyContent:'center'},
  guildModalCloseText:{color:'#4a6080',fontSize:14,fontWeight:'900'},
  guildSearchInput:{backgroundColor:'#07090f',borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,paddingHorizontal:14,paddingVertical:10,color:'#fff',fontSize:14,marginBottom:10,width:'100%'},
  guildResetRow:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#ff444422',borderRadius:14,padding:14,marginBottom:8},
  guildResetEmoji:{fontSize:24},
  guildResetName:{color:'#c8daf0',fontSize:14,fontWeight:'700'},
  guildResetMeta:{color:'#4a6080',fontSize:10},
  guildResetBtn:{backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444444',borderRadius:10,paddingHorizontal:12,paddingVertical:6},
  guildResetBtnText:{color:'#ff6666',fontSize:12,fontWeight:'800'},
  newsRow:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#0d1220',borderWidth:1,borderRadius:14,padding:12},
  analyticsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  analyticsCard:{flex:1,minWidth:'45%',borderWidth:1,borderRadius:14,padding:12,alignItems:'center',gap:4},
  analyticsEmoji:{fontSize:22},
  analyticsVal:{fontSize:22,fontWeight:'900'},
  analyticsLbl:{fontSize:8,color:'#4a6080',letterSpacing:1,textTransform:'uppercase',textAlign:'center'},
  newsRowTitle:{fontSize:13,fontWeight:'700'},
  newsRowDate:{color:'#4a6080',fontSize:10},
  newsDeleteBtn:{backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444433',borderRadius:8,paddingHorizontal:10,paddingVertical:6},
  newsDeleteText:{color:'#ff4444',fontSize:13,fontWeight:'900'},
});
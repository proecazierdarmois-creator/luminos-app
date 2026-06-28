// screens/ProfileScreen.js — Profil amélioré V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, ActivityIndicator, Animated, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, get, onValue } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { CREATURES, ALL_CREATURES, CREATURE_LIST } from '../data/creatures';
import { subscribeToProfile, getTransactions, initProfile } from '../store/profileService';
import { getPlayerId } from '../store/marketService';
import { useAuth } from '../store/AuthContext';
import { listenXp, getLevelFromXp, LEVEL_REWARDS, addXp } from '../store/xpService';

const { width: SW } = Dimensions.get('window');

const AVATARS = ['✦','🌟','⭐','🔥','💎','🌊','🌿','⚡','🌑','🦋','🐉','👑','🎯','🏆','🌈','🦊','🐺','🦅','🌙','☀️'];

const BANNERS = [
  { id:'default',  label:'Cosmos',   colors:['#0d1a2e','#0a2040'],  accent:'#00e5ff' },
  { id:'fire',     label:'Feu',      colors:['#1a0800','#2a1000'],  accent:'#ff6b35' },
  { id:'nature',   label:'Nature',   colors:['#081408','#101e08'],  accent:'#39ff8f' },
  { id:'shadow',   label:'Ombre',    colors:['#08000f','#100018'],  accent:'#8844cc' },
  { id:'gold',     label:'Or',       colors:['#1a1000','#2a1800'],  accent:'#ffd700' },
  { id:'crystal',  label:'Cristal',  colors:['#001820','#002030'],  accent:'#aaeeff' },
  { id:'storm',    label:'Tempête',  colors:['#0a0a00','#151500'],  accent:'#ffe033' },
  { id:'sakura',   label:'Sakura',   colors:['#0f0008','#1a0012'],  accent:'#ff69b4' },
];

// ─── Achievements ────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // Combat
  { id:'first_win',      category:'Combat',     emoji:'⚔️', title:'Premier Sang',        desc:'Remporte ton premier combat',           color:'#39ff8f', check:(d)=>d.wins>=1,    reward:{crystals:20,  xp:50,  titleLabel:null,               creature:null} },
  { id:'wins_10',        category:'Combat',     emoji:'🏆', title:'Guerrier',             desc:'Remporte 10 combats',                   color:'#39ff8f', check:(d)=>d.wins>=10,   reward:{crystals:50,  xp:100, titleLabel:'Guerrier',          creature:null} },
  { id:'wins_50',        category:'Combat',     emoji:'👑', title:'Champion',             desc:'Remporte 50 combats',                   color:'#ffd700', check:(d)=>d.wins>=50,   reward:{crystals:150, xp:300, titleLabel:'Champion',          creature:null} },
  { id:'wins_100',       category:'Combat',     emoji:'🌌', title:'Maître des Batailles', desc:'Remporte 100 combats',                  color:'#bf5fff', check:(d)=>d.wins>=100,  reward:{crystals:500, xp:800, titleLabel:'Maître des Batailles',creature:'luminos'} },
  // Collection
  { id:'first_creature', category:'Collection', emoji:'📖', title:'Collectionneur',       desc:'Obtiens ta première créature',          color:'#00e5ff', check:(d)=>d.collection>=1,  reward:{crystals:10,  xp:30,  titleLabel:null,               creature:null} },
  { id:'collect_5',      category:'Collection', emoji:'🌟', title:'Apprenti Dresseur',    desc:'Possède 5 créatures différentes',       color:'#00e5ff', check:(d)=>d.unique>=5,      reward:{crystals:30,  xp:80,  titleLabel:'Apprenti Dresseur', creature:null} },
  { id:'collect_15',     category:'Collection', emoji:'💎', title:'Grand Dresseur',       desc:'Possède 15 créatures différentes',      color:'#00e5ff', check:(d)=>d.unique>=15,     reward:{crystals:100, xp:200, titleLabel:'Grand Dresseur',    creature:null} },
  { id:'first_shiny',    category:'Collection', emoji:'✨', title:'Chasseur de Lumière',  desc:'Obtiens ton premier Shiny',             color:'#ff69b4', check:(d)=>d.shinys>=1,      reward:{crystals:100, xp:150, titleLabel:'Chasseur de Lumière',creature:null} },
  { id:'shinys_5',       category:'Collection', emoji:'🌈', title:'Arc-en-Ciel',          desc:'Possède 5 Shinys',                      color:'#ff69b4', check:(d)=>d.shinys>=5,      reward:{crystals:300, xp:400, titleLabel:'Arc-en-Ciel',       creature:null} },
  { id:'first_legendary',category:'Collection', emoji:'🐉', title:'Dompteur de Légendes', desc:'Possède une créature légendaire',       color:'#ffd700', check:(d)=>d.legendaries>=1, reward:{crystals:80,  xp:120, titleLabel:'Dompteur de Légendes',creature:null} },
  // Invocation
  { id:'summon_1',       category:'Invocation', emoji:'✦',  title:'Premier Appel',        desc:'Effectue ta première invocation',      color:'#bf5fff', check:(d)=>d.summons>=1,     reward:{crystals:15,  xp:40,  titleLabel:null,               creature:null} },
  { id:'summon_10',      category:'Invocation', emoji:'🌀', title:'Invocateur',           desc:'Effectue 10 invocations',              color:'#bf5fff', check:(d)=>d.summons>=10,    reward:{crystals:60,  xp:100, titleLabel:'Invocateur',        creature:null} },
  { id:'summon_50',      category:'Invocation', emoji:'🔮', title:'Maître Invocateur',    desc:'Effectue 50 invocations',              color:'#bf5fff', check:(d)=>d.summons>=50,    reward:{crystals:200, xp:350, titleLabel:'Maître Invocateur', creature:null} },
  // Spéciaux
  { id:'eclipse',        category:'Spécial',    emoji:'🌑', title:"Élu de l'Éclipse",   desc:"Capture LUMINOS lors d'une éclipse",  color:'#bf5fff', check:(d)=>d.hasLuminos,     reward:{crystals:500, xp:1000,titleLabel:"Élu de l'Éclipse", creature:null} },
  { id:'market_sell',    category:'Spécial',    emoji:'💰', title:'Marchand',             desc:'Vends une créature sur le marché',     color:'#ffd700', check:(d)=>d.sold>=1,        reward:{crystals:30,  xp:60,  titleLabel:'Marchand',          creature:null} },
  { id:'guild_member',   category:'Spécial',    emoji:'⚔️', title:"Frère d'Armes",       desc:'Rejoins une guilde',                  color:'#ff6b35', check:(d)=>d.inGuild,        reward:{crystals:40,  xp:80,  titleLabel:"Frère d'Armes",    creature:null} },
];

function getRank(wins) {
  if (wins>=100) return {label:'MAÎTRE',    color:'#ffd700',emoji:'👑',next:null};
  if (wins>=50)  return {label:'EXPERT',    color:'#bf5fff',emoji:'💎',next:{label:'MAÎTRE',at:100}};
  if (wins>=20)  return {label:'CHASSEUR',  color:'#39ff8f',emoji:'⚔️',next:{label:'EXPERT',at:50}};
  return              {label:'NOVICE',    color:'#00e5ff',emoji:'✦',next:{label:'CHASSEUR',at:20}};
}

function getLevelEmoji(level) {
  if (level>=100) return '🌌';
  if (level>=75)  return '🐉';
  if (level>=50)  return '👑';
  if (level>=30)  return '🌊';
  if (level>=20)  return '💎';
  if (level>=10)  return '⭐';
  return '🌱';
}

// ─── Composants ───────────────────────────────────────────────────
function StatCard({ label, value, emoji, color, delay=0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    setTimeout(()=>{
      Animated.spring(anim,{toValue:1,friction:5,useNativeDriver:true}).start();
    },delay);
  },[]);
  return (
    <Animated.View style={[styles.statCard,{borderColor:color+'33',opacity:anim,transform:[{scale:anim.interpolate({inputRange:[0,1],outputRange:[0.8,1]})}]}]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue,{color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function ProgressBar({ label, value, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.timing(anim,{toValue:Math.min(100,value),duration:800,useNativeDriver:false}).start();
  },[value]);
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill,{
          width:anim.interpolate({inputRange:[0,100],outputRange:['0%','100%']}),
          backgroundColor:color,
        }]}/>
      </View>
      <Text style={[styles.progressPct,{color}]}>{Math.round(value)}%</Text>
    </View>
  );
}

function GoalRow({ label, icon, color, progress }) {
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalIcon}>{icon}</Text>
      <View style={styles.goalInfo}>
        <Text style={styles.goalLabel}>{label}</Text>
        <View style={styles.goalBarBg}>
          <View style={[styles.goalBarFill,{width:`${Math.min(100,progress*100)}%`,backgroundColor:color}]}/>
        </View>
      </View>
      <Text style={[styles.goalPct,{color}]}>{Math.round(progress*100)}%</Text>
    </View>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────
export default function ProfileScreen() {
  const { collection, crystals, wins, losses, summonCount, uniqueCount, resetGame, addCrystals, addToCollection } = useGameStore();
  const [profile, setProfile]   = useState(null);
  const [txs, setTxs]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('stats');

  const [avatar, setAvatar]       = useState('✦');
  const [banner, setBanner]       = useState(BANNERS[0]);
  const [favCreature, setFavCreature] = useState(null);
  const [showAvatarModal, setShowAvatarModal]   = useState(false);
  const [showBannerModal, setShowBannerModal]   = useState(false);
  const [showCreatureModal, setShowCreatureModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [xpData, setXpData] = useState({totalXp:0,level:1,currentXp:0,neededXp:100,claimedLevels:{}});
  const [claimedAchievements, setClaimedAchievements] = useState({});
  const [inGuild, setInGuild] = useState(false);
  const [soldCount, setSoldCount] = useState(0);

  const auth       = useAuth();
  const user       = auth?.user;
  const logout     = auth?.logout;
  const uid        = user?.uid || 'guest';
  const playerName = user?.displayName || user?.email?.split('@')[0] || 'Joueur';
  const playerId   = getPlayerId();

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim,{toValue:1.06,duration:1500,useNativeDriver:true}),
        Animated.timing(pulseAnim,{toValue:1,   duration:1500,useNativeDriver:true}),
      ])
    ).start();
    Animated.timing(bannerAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
    setTimeout(()=>{
      Animated.timing(statsAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
    },300);
  },[]);

  useEffect(()=>{
    const unsub = listenXp(uid,data=>{
      const computed = getLevelFromXp(data.totalXp||0);
      setXpData({...data,...computed});
    });
    return unsub;
  },[uid]);

  useEffect(()=>{
    get(ref(db,`achievements/${uid}`)).then(snap=>{
      if (snap.exists()) setClaimedAchievements(snap.val()||{});
    });
    get(ref(db,`players/${uid}/guildId`)).then(snap=>setInGuild(snap.exists()));
    // Compte les ventes depuis les listings actifs du vendeur
    get(ref(db,'market/listings')).then(snap=>{
      if (!snap.exists()) return;
      const listings = Object.values(snap.val());
      const sold = listings.filter(l=>l.sellerId===uid).length;
      setSoldCount(sold>0?1:0); // au moins 1 listing = succès marchand
    }).catch(()=>{});
  },[uid]);

  useEffect(()=>{
    get(ref(db,`profiles/${uid}/customize`)).then(snap=>{
      if (snap.exists()) {
        const d=snap.val();
        if (d.avatar) setAvatar(d.avatar);
        if (d.banner) setBanner(BANNERS.find(b=>b.id===d.banner)||BANNERS[0]);
        if (d.favCreature) setFavCreature(d.favCreature);
      }
    });
  },[uid]);

  useEffect(()=>{
    initProfile(playerName).then(()=>setLoading(false));
    const unsub = subscribeToProfile(p=>setProfile(p));
    getTransactions().then(setTxs);
    return unsub;
  },[]);

  async function claimAchievement(ach) {
    if (claimedAchievements[ach.id]) return;
    if (ach.reward.crystals) addCrystals(ach.reward.crystals);
    const uid2 = user?.uid;
    if (uid2 && ach.reward.xp) {
      addXp(uid2, ach.reward.xp, null, null, null).catch(()=>{});
    }
    if (ach.reward.creature && ALL_CREATURES[ach.reward.creature]) {
      addToCollection({...ALL_CREATURES[ach.reward.creature]});
    }
    const newClaimed = {...claimedAchievements, [ach.id]:true};
    setClaimedAchievements(newClaimed);
    await set(ref(db,`achievements/${uid}`), newClaimed).catch(()=>{});
  }

  async function saveCustomize(a,b,f) {
    await set(ref(db,`profiles/${uid}/customize`),{avatar:a,banner:b.id,favCreature:f}).catch(()=>{});
  }

  async function selectAvatar(a)   { setAvatar(a);    setShowAvatarModal(false);   await saveCustomize(a,banner,favCreature); }
  async function selectBanner(b)   { setBanner(b);    setShowBannerModal(false);   await saveCustomize(avatar,b,favCreature); }
  async function selectFavCreature(c){ setFavCreature(c); setShowCreatureModal(false); await saveCustomize(avatar,banner,c); }

  const totalCreatures = CREATURE_LIST.length;
  const completionPct  = Math.round(((uniqueCount||0)/totalCreatures)*100);
  const winRate        = wins+losses>0?Math.round((wins/(wins+losses))*100):0;
  const shinys         = collection.filter(c=>c.isShiny).length;
  const legendaries    = [...new Set(collection.filter(c=>ALL_CREATURES[c.id]?.rarity==='legendary').map(c=>c.id))].length;
  const ownedMap       = collection.reduce((acc,c)=>{acc[c.id]=(acc[c.id]||0)+1;return acc;},{});
  const rank           = getRank(wins);
  const xpPct          = xpData.neededXp>0?(xpData.currentXp/xpData.neededXp)*100:0;
  const totalSold      = profile?.totalSold||0;
  const totalBought    = profile?.totalBought||0;
  const crystalsEarned = profile?.crystalsEarned||0;
  const FavSprite      = favCreature?(SPRITES[favCreature.id?.replace('_shiny','')]||SPRITES.lumikos):null;

  if (loading) return (
    <LinearGradient colors={['#07090f','#0d1220']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#00e5ff" style={{marginTop:100}}/>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── BANNIÈRE ── */}
          <Animated.View style={{opacity:bannerAnim}}>
            <LinearGradient colors={banner.colors} style={styles.bannerArea}>
              {/* Étoiles déco */}
              {[{l:20,t:20,s:16},{l:SW*0.35,t:28,s:12},{l:SW*0.6,t:14,s:18},{l:SW*0.8,t:38,s:14},{l:60,t:90,s:10},{l:SW*0.5,t:80,s:8},{l:SW*0.9,t:70,s:12}].map((s,i)=>(
                <Text key={i} style={[styles.bannerStar,{left:s.l,top:s.t,color:banner.accent,opacity:0.25+i*0.03,fontSize:s.s}]}>✦</Text>
              ))}

              {/* Boutons haut */}
              <View style={styles.bannerBtns}>
                <TouchableOpacity onPress={()=>setShowBannerModal(true)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>🎨 Bannière</Text>
                </TouchableOpacity>
                <View style={styles.bannerBtnsRight}>

                  <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>⏻</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Créature favorite */}
              {FavSprite&&(
                <Animated.View style={[styles.favArea,{transform:[{scale:pulseAnim}]}]}>
                  <FavSprite size={110}/>
                </Animated.View>
              )}

              {/* Avatar + infos */}
              <View style={styles.profileRow}>
                <TouchableOpacity onPress={()=>setShowAvatarModal(true)}
                  style={[styles.avatarRing,{borderColor:banner.accent+'88',shadowColor:banner.accent}]}>
                  <Text style={styles.avatarEmoji}>{avatar}</Text>
                  <View style={[styles.avatarDot,{backgroundColor:banner.accent}]}>
                    <Text style={styles.avatarDotText}>✎</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  <Text style={styles.playerName}>{playerName}</Text>
                  <Text style={styles.playerId}>#{playerId.slice(0,10)}</Text>
                  <View style={styles.rankRow}>
                    <View style={[styles.rankBadge,{borderColor:rank.color+'55',backgroundColor:rank.color+'22'}]}>
                      <Text style={[styles.rankText,{color:rank.color}]}>{rank.emoji} {rank.label}</Text>
                    </View>
                    <View style={[styles.levelBadge,{borderColor:banner.accent+'55',backgroundColor:banner.accent+'18'}]}>
                      <Text style={[styles.levelText,{color:banner.accent}]}>{getLevelEmoji(xpData.level)} Nv.{xpData.level}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity onPress={()=>setShowCreatureModal(true)} style={styles.favBtn}>
                  <Text style={styles.favBtnEmoji}>⭐</Text>
                  <Text style={styles.favBtnLabel}>Favori</Text>
                </TouchableOpacity>
              </View>

              {/* XP bar dans la bannière */}
              <View style={styles.bannerXpRow}>
                <Text style={[styles.bannerXpText,{color:banner.accent}]}>{xpData.currentXp} / {xpData.neededXp} XP</Text>
                <Text style={[styles.bannerXpPct,{color:banner.accent}]}>{Math.round(xpPct)}%</Text>
              </View>
              <View style={styles.bannerXpBg}>
                <View style={[styles.bannerXpFill,{width:`${Math.min(100,xpPct)}%`,backgroundColor:banner.accent}]}/>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── STATS RAPIDES ── */}
          <Animated.View style={{opacity:statsAnim,paddingHorizontal:16}}>
            <View style={styles.quickRow}>
              {[
                {val:`${crystals}`,lbl:'💎 Cristaux', color:'#ffd700', bg:['#1a1000','#0d1220']},
                {val:`${wins}`,    lbl:'Victoires',   color:'#39ff8f', bg:['#0a1a0a','#0d1220']},
                {val:`${winRate}%`,lbl:'Win Rate',    color:'#00e5ff', bg:['#0d1a2e','#0d1220']},
                {val:`${shinys}`,  lbl:'✨ Shinys',   color:'#ff69b4', bg:['#18000f','#0d1220']},
              ].map((s,i)=>(
                <LinearGradient key={i} colors={s.bg} style={[styles.quickCard,{borderColor:s.color+'33'}]}>
                  <Text style={[styles.quickVal,{color:s.color}]}>{s.val}</Text>
                  <Text style={styles.quickLbl}>{s.lbl}</Text>
                </LinearGradient>
              ))}
            </View>
          </Animated.View>

          {/* ── BARRE POKÉDEX ── */}
          <View style={styles.pokedexBar}>
            <View style={styles.pokedexBarHeader}>
              <Text style={styles.pokedexBarLabel}>📖 POKÉDEX</Text>
              <Text style={[styles.pokedexBarPct,{color:banner.accent}]}>{uniqueCount||0}/{totalCreatures} · {completionPct}%</Text>
            </View>
            <View style={styles.pokedexBarBg}>
              <View style={[styles.pokedexBarFill,{width:`${completionPct}%`,backgroundColor:banner.accent}]}/>
            </View>
          </View>

          {/* ── TABS ── */}
          <View style={styles.tabRow}>
            {[
              {id:'stats',label:'📊 Stats'},
              {id:'xp',   label:'⭐ XP'},
              {id:'collection',label:'📖 Collec'},
              {id:'history',label:'📋 Histo'},
              {id:'achievements',label:'🏅 Succès'},
            ].map(t=>(
              <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)}
                style={[styles.tabBtn,tab===t.id&&{borderColor:banner.accent+'55',backgroundColor:banner.accent+'12'}]}>
                <Text style={[styles.tabText,tab===t.id&&{color:banner.accent}]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── STATS ── */}
          {tab==='stats'&&(
            <View style={styles.tabContent}>
              {/* Prochains objectifs */}
              {rank.next&&(
                <LinearGradient colors={[rank.color+'12','#0d1220']} style={[styles.nextRankCard,{borderColor:rank.color+'44'}]}>
                  <Text style={styles.sectionLabel}>🎯 PROCHAIN RANG</Text>
                  <View style={styles.nextRankRow}>
                    <Text style={[styles.nextRankEmoji,{color:rank.color}]}>{rank.emoji}</Text>
                    <Text style={styles.nextRankArrow}>→</Text>
                    <View style={{gap:4,flex:1}}>
                      <Text style={{color:'#c8daf0',fontSize:13,fontWeight:'700'}}>{rank.next.label} ({rank.next.at} victoires)</Text>
                      <View style={styles.goalBarBg}>
                        <View style={[styles.goalBarFill,{width:`${Math.min(100,(wins/rank.next.at)*100)}%`,backgroundColor:rank.color}]}/>
                      </View>
                      <Text style={[styles.nextRankSub,{color:rank.color}]}>{rank.next.at-wins} victoires restantes</Text>
                    </View>
                  </View>
                </LinearGradient>
              )}

              {/* Barres de progression */}
              <View style={styles.progressCard}>
                <Text style={styles.sectionLabel}>PROGRESSION</Text>
                <ProgressBar label="Niveau XP"   value={Math.min(100,(xpData.level/100)*100)} color="#00e5ff"/>
                <ProgressBar label="Pokédex"      value={completionPct}                        color={banner.accent}/>
                <ProgressBar label="Win Rate"     value={winRate}                              color="#39ff8f"/>
                <ProgressBar label="Shinys"       value={Math.min(100,shinys*10)}              color="#ff69b4"/>
                <ProgressBar label="Légendaires"  value={Math.min(100,legendaries*25)}         color="#ffd700"/>
              </View>

              {/* Grid stats */}
              <View style={styles.statsGrid}>
                <StatCard label="Invocations" value={summonCount}      emoji="✦"  color="#bf5fff" delay={0}/>
                <StatCard label="Victoires"   value={wins}             emoji="⚔️" color="#39ff8f" delay={60}/>
                <StatCard label="Défaites"    value={losses}           emoji="💀" color="#ff4444" delay={120}/>
                <StatCard label="Win Rate"    value={`${winRate}%`}    emoji="🏆" color="#ffd700" delay={180}/>
                <StatCard label="Collection"  value={collection.length}emoji="📖" color="#00e5ff" delay={240}/>
                <StatCard label="Shinys"      value={shinys}           emoji="✨" color="#ff69b4" delay={300}/>
                <StatCard label="Légendaires" value={legendaries}      emoji="🌟" color="#ffd700" delay={360}/>
                <StatCard label="💎 Gagnés"   value={crystalsEarned}   emoji="💰" color="#ffd700" delay={420}/>
              </View>

              {/* Objectifs */}
              <View style={styles.goalsCard}>
                <Text style={styles.sectionLabel}>🎯 OBJECTIFS</Text>
                {wins<20   &&<GoalRow label={`${20-wins} victoires → CHASSEUR`}   icon="⚔️" color="#39ff8f" progress={wins/20}/>}
                {wins>=20&&wins<50   &&<GoalRow label={`${50-wins} victoires → EXPERT`}    icon="💎" color="#bf5fff" progress={wins/50}/>}
                {wins>=50&&wins<100  &&<GoalRow label={`${100-wins} victoires → MAÎTRE`}   icon="👑" color="#ffd700" progress={wins/100}/>}
                {shinys<5  &&<GoalRow label={`${5-shinys} Shinys`}                icon="✨" color="#ff69b4" progress={shinys/5}/>}
                {legendaries<4&&<GoalRow label={`${4-legendaries} Légendaires`}   icon="🌟" color="#ffd700" progress={legendaries/4}/>}
                {completionPct<100&&<GoalRow label={`Pokédex complet (${completionPct}%)`} icon="📖" color={banner.accent} progress={completionPct/100}/>}
              </View>

              {/* Réinitialiser */}
              <TouchableOpacity onPress={()=>setConfirmReset(true)} style={styles.resetBtn}>
                <Text style={styles.resetText}>⚠️ Réinitialiser mon compte</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── XP ── */}
          {tab==='xp'&&(
            <View style={styles.tabContent}>
              {/* Carte niveau actuel */}
              <LinearGradient colors={banner.colors} style={[styles.xpCard,{borderColor:banner.accent+'44'}]}>
                <View style={styles.xpCardTop}>
                  <View style={{gap:6}}>
                    <Text style={[styles.xpLevel,{color:banner.accent}]}>NIVEAU {xpData.level}</Text>
                    <Text style={styles.xpCurrent}>{xpData.currentXp.toLocaleString()} / {xpData.neededXp.toLocaleString()} XP</Text>
                    <Text style={styles.xpTotal}>{xpData.totalXp.toLocaleString()} XP total</Text>
                  </View>
                  <Text style={styles.xpEmoji}>{getLevelEmoji(xpData.level)}</Text>
                </View>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill,{width:`${Math.min(100,xpPct)}%`,backgroundColor:banner.accent}]}/>
                </View>
                <Text style={[styles.xpPct,{color:banner.accent}]}>{Math.round(xpPct)}% vers le niveau {xpData.level+1}</Text>
              </LinearGradient>

              {/* Récompenses */}
              <Text style={styles.sectionLabel}>RÉCOMPENSES DE NIVEAU</Text>
              {Object.entries(LEVEL_REWARDS).map(([lvl,reward])=>{
                const l=parseInt(lvl);
                const claimed=xpData.claimedLevels?.[l];
                const reached=xpData.level>=l;
                return (
                  <View key={lvl} style={[styles.rewardRow,{
                    backgroundColor:claimed?'#39ff8f10':reached?'#ffd70010':'#0d1220',
                    borderColor:claimed?'#39ff8f33':reached?'#ffd70033':'#1e2d4a',
                  }]}>
                    <View style={[styles.rewardLvlBox,{backgroundColor:claimed?'#39ff8f22':reached?'#ffd70022':'#1e2d4a22',borderColor:claimed?'#39ff8f33':reached?'#ffd70033':'#1e2d4a'}]}>
                      <Text style={[styles.rewardLvlNum,{color:claimed?'#39ff8f':reached?'#ffd700':'#4a6080'}]}>Nv.</Text>
                      <Text style={[styles.rewardLvlVal,{color:claimed?'#39ff8f':reached?'#ffd700':'#4a6080'}]}>{l}</Text>
                    </View>
                    <View style={{flex:1,gap:3}}>
                      <Text style={[styles.rewardTitle,{color:claimed?'#39ff8f':reached?'#ffd700':'#4a6080'}]}>{reward.title}</Text>
                      <View style={{flexDirection:'row',gap:8}}>
                        {reward.crystals>0&&<Text style={styles.rewardCrystals}>💎 +{reward.crystals}</Text>}
                        {reward.creature&&<Text style={styles.rewardCreature}>✦ {reward.creature}</Text>}
                      </View>
                    </View>
                    <Text style={{fontSize:20}}>{claimed?'✅':reached?'🔓':'🔒'}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── COLLECTION ── */}
          {tab==='collection'&&(
            <View style={[styles.tabContent,{paddingHorizontal:0}]}>
              <View style={styles.collecGrid}>
                {Object.values(CREATURES).map(c=>{
                  const count=ownedMap[c.id]||0;
                  const Sprite=SPRITES[c.id];
                  return (
                    <View key={c.id} style={[styles.collecCard,{borderColor:count>0?c.rarityColor+'55':'#1e2d4a',backgroundColor:count>0?c.rarityColor+'08':'#0d1220',opacity:count>0?1:0.3}]}>
                      {Sprite&&<Sprite size={52}/>}
                      <Text style={[styles.collecName,{color:count>0?c.rarityColor:'#4a6080'}]} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.collecNum}>{c.number}</Text>
                      {count>0
                        ?<View style={[styles.countBadge,{backgroundColor:c.rarityColor}]}><Text style={styles.countText}>×{count}</Text></View>
                        :<Text style={styles.lockIcon}>🔒</Text>
                      }
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {tab==='achievements'&&(()=>{
            const achData = {
              wins, collection:collection.length,
              unique:[...new Set(collection.map(c=>c.id))].length,
              shinys:collection.filter(c=>c.isShiny).length,
              legendaries:[...new Set(collection.filter(c=>ALL_CREATURES[c.id]?.rarity==='legendary').map(c=>c.id))].length,
              summons:summonCount,
              hasLuminos:collection.some(c=>c.id==='luminos'),
              sold:soldCount, inGuild,
            };
            const categories = [...new Set(ACHIEVEMENTS.map(a=>a.category))];
            const totalUnlocked = ACHIEVEMENTS.filter(a=>a.check(achData)).length;
            const totalClaimed  = Object.keys(claimedAchievements).length;
            return (
              <View style={styles.tabContent}>
                {/* Header */}
                <LinearGradient colors={['#1a1000','#07090f']} style={styles.achHeader}>
                  <Text style={styles.achHeaderTitle}>🏅 SUCCÈS</Text>
                  <View style={styles.achHeaderStats}>
                    <View style={styles.achHeaderStat}>
                      <Text style={[styles.achHeaderVal,{color:'#ffd700'}]}>{totalClaimed}/{ACHIEVEMENTS.length}</Text>
                      <Text style={styles.achHeaderLbl}>Réclamés</Text>
                    </View>
                    <View style={styles.achHeaderStat}>
                      <Text style={[styles.achHeaderVal,{color:'#39ff8f'}]}>{totalUnlocked}</Text>
                      <Text style={styles.achHeaderLbl}>Débloqués</Text>
                    </View>
                  </View>
                  <View style={styles.achBarBg}>
                    <View style={[styles.achBarFill,{width:`${(totalClaimed/ACHIEVEMENTS.length)*100}%`}]}/>
                  </View>
                </LinearGradient>

                {categories.map(cat=>{
                  const catAchs = ACHIEVEMENTS.filter(a=>a.category===cat);
                  return (
                    <View key={cat} style={{gap:8}}>
                      <Text style={styles.sectionLabel}>{cat.toUpperCase()}</Text>
                      {catAchs.map(ach=>{
                        const unlocked = ach.check(achData);
                        const claimed  = !!claimedAchievements[ach.id];
                        return (
                          <LinearGradient key={ach.id}
                            colors={unlocked?[ach.color+'18','#0d1220']:['#0d1220','#0d1220']}
                            style={[styles.achCard,{borderColor:unlocked?ach.color+'44':'#1e2d4a',opacity:unlocked?1:0.5}]}>
                            <View style={[styles.achIconBox,{backgroundColor:ach.color+'22',borderColor:ach.color+(unlocked?'55':'22')}]}>
                              <Text style={styles.achEmoji}>{unlocked?ach.emoji:'🔒'}</Text>
                            </View>
                            <View style={styles.achInfo}>
                              <Text style={[styles.achTitle,{color:unlocked?ach.color:'#4a6080'}]}>{ach.title}</Text>
                              <Text style={styles.achDesc}>{ach.desc}</Text>
                              <View style={styles.achRewards}>
                                {ach.reward.crystals>0&&<Text style={styles.achRewardCrystals}>+{ach.reward.crystals}💎</Text>}
                                {ach.reward.xp>0&&<Text style={styles.achRewardXp}>+{ach.reward.xp}XP</Text>}
                                {ach.reward.titleLabel&&<View style={[styles.achTitleBadge,{borderColor:ach.color+'44',backgroundColor:ach.color+'15'}]}><Text style={[styles.achTitleBadgeText,{color:ach.color}]}>✦ {ach.reward.titleLabel}</Text></View>}
                                {ach.reward.creature&&<View style={[styles.achTitleBadge,{borderColor:'#00e5ff44',backgroundColor:'#00e5ff15'}]}><Text style={[styles.achTitleBadgeText,{color:'#00e5ff'}]}>🐉 {ALL_CREATURES[ach.reward.creature]?.name}</Text></View>}
                              </View>
                            </View>
                            {unlocked&&!claimed&&(
                              <TouchableOpacity onPress={()=>claimAchievement(ach)}
                                style={[styles.achClaimBtn,{borderColor:ach.color+'55',backgroundColor:ach.color+'22'}]}>
                                <Text style={[styles.achClaimText,{color:ach.color}]}>🎁</Text>
                              </TouchableOpacity>
                            )}
                            {claimed&&(
                              <View style={styles.achClaimedBadge}>
                                <Text style={styles.achClaimedText}>✓</Text>
                              </View>
                            )}
                          </LinearGradient>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            );
          })()}

          {/* ── HISTORIQUE ── */}
          {tab==='history'&&(
            <View style={styles.tabContent}>
              {txs.length===0
                ?<View style={styles.empty}><Text style={{fontSize:40}}>📋</Text><Text style={styles.emptyText}>Aucune transaction</Text></View>
                :txs.map((tx,i)=>(
                  <View key={i} style={[styles.txRow,{borderColor:(tx.rarityColor||'#1e2d4a')+'33'}]}>
                    <View style={[styles.txBadge,{backgroundColor:tx.type==='sale'?'#39ff8f22':'#00e5ff22',borderColor:tx.type==='sale'?'#39ff8f44':'#00e5ff44'}]}>
                      <Text style={[styles.txType,{color:tx.type==='sale'?'#39ff8f':'#00e5ff'}]}>{tx.type==='sale'?'↑ VENDU':'↓ ACHETÉ'}</Text>
                    </View>
                    <View style={{flex:1,gap:2}}>
                      <Text style={[styles.txName,{color:tx.rarityColor||'#fff'}]}>{tx.creatureName}</Text>
                      <Text style={styles.txRarity}>{tx.rarityLabel}</Text>
                    </View>
                    <Text style={[styles.txPrice,{color:tx.type==='sale'?'#39ff8f':'#ff4444'}]}>{tx.type==='sale'?'+':'-'}{tx.price} 💎</Text>
                  </View>
                ))
              }
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <Modal visible={showAvatarModal} transparent animationType="fade" onRequestClose={()=>setShowAvatarModal(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map(a=>(
                <TouchableOpacity key={a} onPress={()=>selectAvatar(a)}
                  style={[styles.avatarOpt,avatar===a&&{borderColor:banner.accent,backgroundColor:banner.accent+'22'}]}>
                  <Text style={styles.avatarOptText}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={()=>setShowAvatarModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Fermer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showBannerModal} transparent animationType="fade" onRequestClose={()=>setShowBannerModal(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Bannière</Text>
            <View style={styles.bannerGrid}>
              {BANNERS.map(b=>(
                <TouchableOpacity key={b.id} onPress={()=>selectBanner(b)} style={{width:'47%'}}>
                  <LinearGradient colors={b.colors} style={[styles.bannerPreview,{borderColor:banner.id===b.id?b.accent:'#1e2d4a'}]}>
                    <Text style={[styles.bannerPreviewLabel,{color:b.accent}]}>{b.label}</Text>
                    <View style={[styles.bannerPreviewDot,{backgroundColor:b.accent}]}/>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={()=>setShowBannerModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Fermer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showCreatureModal} transparent animationType="fade" onRequestClose={()=>setShowCreatureModal(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Créature favorite</Text>
            <ScrollView style={{maxHeight:300}}>
              <View style={styles.creatureGrid}>
                {[...new Set(collection.map(c=>c.id))].map(id=>{
                  const c=ALL_CREATURES[id]; if(!c) return null;
                  const Sprite=SPRITES[id.replace('_shiny','')]||SPRITES.lumikos;
                  return (
                    <TouchableOpacity key={id} onPress={()=>selectFavCreature(c)}
                      style={[styles.creatureOpt,{borderColor:favCreature?.id===id?c.rarityColor:'#1e2d4a',backgroundColor:favCreature?.id===id?c.rarityColor+'22':'#0d1220'}]}>
                      <Sprite size={46}/>
                      <Text style={[styles.creatureOptName,{color:c.rarityColor}]} numberOfLines={1}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={()=>setShowCreatureModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Fermer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={confirmReset} transparent animationType="fade" onRequestClose={()=>setConfirmReset(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
            <Text style={{fontSize:44}}>⚠️</Text>
            <Text style={styles.modalTitle}>Réinitialiser ?</Text>
            <Text style={styles.modalDesc}>Toutes tes créatures, cristaux, victoires et XP seront effacés. Irréversible.</Text>
            <TouchableOpacity onPress={async()=>{await resetGame();setConfirmReset(false);}}
              style={styles.resetConfirmBtn}>
              <Text style={styles.resetConfirmText}>Tout effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setConfirmReset(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1},
  scrollContent:{paddingBottom:32,gap:12},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  // Banner
  bannerArea:{paddingHorizontal:16,paddingBottom:16,paddingTop:10,gap:10,minHeight:200,position:'relative',overflow:'hidden'},
  bannerStar:{position:'absolute',fontSize:16},
  bannerBtns:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  bannerBtnsRight:{flexDirection:'row',alignItems:'center',gap:8},
  editBtn:{backgroundColor:'rgba(0,0,0,0.35)',borderWidth:1,borderColor:'rgba(255,255,255,0.15)',borderRadius:10,paddingHorizontal:10,paddingVertical:5},
  editBtnText:{color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:'700'},
  logoutBtn:{backgroundColor:'rgba(255,68,68,0.15)',borderWidth:1,borderColor:'rgba(255,68,68,0.3)',borderRadius:8,paddingHorizontal:8,paddingVertical:4},
  logoutText:{color:'#ff6666',fontSize:15},
  favArea:{position:'absolute',right:16,top:40,opacity:0.55},
  profileRow:{flexDirection:'row',alignItems:'center',gap:12},
  avatarRing:{width:80,height:80,borderRadius:40,borderWidth:2.5,backgroundColor:'rgba(0,0,0,0.5)',alignItems:'center',justifyContent:'center',position:'relative',shadowOpacity:0.8,shadowRadius:16,shadowOffset:{width:0,height:0},elevation:8},
  avatarEmoji:{fontSize:34},
  avatarDot:{position:'absolute',bottom:0,right:0,width:22,height:22,borderRadius:11,alignItems:'center',justifyContent:'center'},
  avatarDotText:{color:'#000',fontSize:11,fontWeight:'900'},
  profileInfo:{flex:1,gap:5},
  playerName:{fontSize:20,fontWeight:'900',color:'#fff',letterSpacing:0.5,flexShrink:1},
  playerId:{fontSize:9,color:'rgba(255,255,255,0.35)',letterSpacing:1},
  rankRow:{flexDirection:'row',gap:6,alignItems:'center'},
  rankBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:3},
  rankText:{fontSize:9,fontWeight:'900',letterSpacing:1},
  levelBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:3},
  levelText:{fontSize:9,fontWeight:'900',letterSpacing:1},
  favBtn:{alignItems:'center',gap:2},
  favBtnEmoji:{fontSize:26},
  favBtnLabel:{fontSize:8,color:'rgba(255,255,255,0.4)',letterSpacing:1},
  bannerXpRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  bannerXpText:{fontSize:11,fontWeight:'700',opacity:0.8},
  bannerXpPct:{fontSize:11,fontWeight:'700'},
  bannerXpBg:{height:6,backgroundColor:'rgba(0,0,0,0.4)',borderRadius:4,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  bannerXpFill:{height:'100%',borderRadius:4},
  // Quick stats
  quickRow:{flexDirection:'row',gap:8},
  quickCard:{flex:1,backgroundColor:'#0d1220',borderWidth:1,borderRadius:12,padding:10,alignItems:'center',gap:2},
  quickVal:{fontSize:15,fontWeight:'900'},
  quickLbl:{fontSize:7,color:'#4a6080',letterSpacing:1,textAlign:'center'},
  // Pokédex bar
  pokedexBar:{marginHorizontal:16,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:12,gap:8},
  pokedexBarHeader:{flexDirection:'row',justifyContent:'space-between'},
  pokedexBarLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700'},
  pokedexBarPct:{fontSize:11,fontWeight:'700'},
  pokedexBarBg:{height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  pokedexBarFill:{height:'100%',borderRadius:4},
  // Tabs
  tabRow:{flexDirection:'row',gap:6,paddingHorizontal:16},
  tabBtn:{flex:1,alignItems:'center',paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  tabText:{color:'#4a6080',fontSize:9,fontWeight:'700'},
  // Tab content
  tabContent:{paddingHorizontal:16,gap:12},
  // Next rank
  nextRankCard:{backgroundColor:'#0d1220',borderWidth:1,borderRadius:16,padding:14,gap:10},
  nextRankRow:{flexDirection:'row',alignItems:'center',gap:12},
  nextRankEmoji:{fontSize:28},
  nextRankArrow:{color:'#4a6080',fontSize:20},
  nextRankSub:{fontSize:10,fontWeight:'700'},
  // Progress
  progressCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:10},
  progressRow:{flexDirection:'row',alignItems:'center',gap:8},
  progressLabel:{fontSize:11,color:'#c8daf0',width:90},
  progressBg:{flex:1,height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  progressFill:{height:'100%',borderRadius:4},
  progressPct:{fontSize:11,fontWeight:'700',width:35,textAlign:'right'},
  // Stats grid
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  statCard:{width:'47%',borderWidth:1,borderRadius:16,padding:14,alignItems:'center',gap:5,overflow:'hidden'},
  statEmoji:{fontSize:24},
  statValue:{fontSize:24,fontWeight:'900'},
  statLabel:{fontSize:9,color:'#4a6080',letterSpacing:1,textAlign:'center'},
  // Goals
  goalsCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:10},
  goalRow:{flexDirection:'row',alignItems:'center',gap:10},
  goalIcon:{fontSize:16,width:24,textAlign:'center'},
  goalInfo:{flex:1,gap:4},
  goalLabel:{fontSize:11,color:'#c8daf0'},
  goalBarBg:{height:4,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  goalBarFill:{height:'100%',borderRadius:4},
  goalPct:{fontSize:10,fontWeight:'700',width:30,textAlign:'right'},
  resetBtn:{backgroundColor:'#ff444415',borderWidth:1,borderColor:'#ff444433',borderRadius:14,padding:14,alignItems:'center'},
  resetText:{color:'#ff6666',fontSize:12,fontWeight:'700'},
  // XP tab
  xpCard:{borderWidth:1,borderRadius:20,padding:18,gap:10},
  xpCardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  xpLevel:{fontSize:11,fontWeight:'900',letterSpacing:4},
  xpCurrent:{color:'#fff',fontSize:22,fontWeight:'900'},
  xpTotal:{color:'#4a6080',fontSize:10},
  xpEmoji:{fontSize:44},
  xpBarBg:{height:7,backgroundColor:'rgba(0,0,0,0.3)',borderRadius:4,overflow:'hidden'},
  xpBarFill:{height:'100%',borderRadius:4},
  xpPct:{fontSize:10,fontWeight:'700',textAlign:'right'},
  rewardRow:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderRadius:14,padding:12},
  rewardLvlBox:{width:44,height:44,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center',gap:1},
  rewardLvlNum:{fontSize:8,fontWeight:'700'},
  rewardLvlVal:{fontSize:14,fontWeight:'900'},
  rewardTitle:{fontSize:13,fontWeight:'800'},
  rewardCrystals:{color:'#ffd700',fontSize:11},
  rewardCreature:{color:'#00e5ff',fontSize:11},
  // Collection
  collecGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'space-between',paddingHorizontal:16},
  collecCard:{width:'31%',borderWidth:1,borderRadius:14,padding:8,alignItems:'center',gap:3,position:'relative'},
  collecName:{fontSize:7,fontWeight:'800',textAlign:'center'},
  collecNum:{fontSize:7,color:'#4a6080'},
  countBadge:{position:'absolute',top:4,right:4,borderRadius:6,paddingHorizontal:4,paddingVertical:1},
  countText:{fontSize:8,fontWeight:'900',color:'#000'},
  lockIcon:{fontSize:12},
  // History
  txRow:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#0d1220',borderWidth:1,borderRadius:14,padding:12},
  txBadge:{borderWidth:1,borderRadius:8,paddingHorizontal:8,paddingVertical:4},
  txType:{fontSize:9,fontWeight:'800',letterSpacing:1},
  txName:{fontSize:13,fontWeight:'800'},
  txRarity:{fontSize:10,color:'#4a6080'},
  txPrice:{fontSize:14,fontWeight:'900'},
  empty:{alignItems:'center',paddingVertical:40,gap:8},
  emptyText:{color:'#4a6080',fontSize:14},
  // Modals
  modalOverlay:{flex:1,backgroundColor:'#000000cc',justifyContent:'center',padding:24},
  modalBox:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:24,padding:20,gap:14,alignItems:'center'},
  modalTitle:{color:'#fff',fontSize:17,fontWeight:'900',letterSpacing:2},
  modalDesc:{color:'#6a84a0',fontSize:13,textAlign:'center',lineHeight:20},
  avatarGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center'},
  avatarOpt:{width:52,height:52,borderRadius:14,borderWidth:1.5,borderColor:'#1e2d4a',backgroundColor:'#0d1220',alignItems:'center',justifyContent:'center'},
  avatarOptText:{fontSize:26},
  bannerGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,width:'100%'},
  bannerPreview:{borderRadius:14,borderWidth:2,padding:14,alignItems:'center',gap:6,height:64},
  bannerPreviewLabel:{fontSize:13,fontWeight:'900'},
  bannerPreviewDot:{width:8,height:8,borderRadius:4},
  creatureGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  creatureOpt:{width:'31%',borderWidth:1.5,borderRadius:12,padding:8,alignItems:'center',gap:4},
  creatureOptName:{fontSize:7,fontWeight:'800',textAlign:'center'},
  modalCancel:{padding:10},
  modalCancelText:{color:'#4a6080',fontSize:13},
  resetConfirmBtn:{backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444444',borderRadius:14,paddingVertical:14,paddingHorizontal:28,alignItems:'center',width:'100%'},
  resetConfirmText:{color:'#ff4444',fontSize:14,fontWeight:'900'},
  // Achievements
  achHeader:{borderWidth:1,borderColor:'#ffd70033',borderRadius:16,padding:14,gap:8},
  achHeaderTitle:{color:'#ffd700',fontSize:14,fontWeight:'900',letterSpacing:3},
  achHeaderStats:{flexDirection:'row',gap:24},
  achHeaderStat:{alignItems:'center',gap:2},
  achHeaderVal:{fontSize:20,fontWeight:'900'},
  achHeaderLbl:{fontSize:8,color:'#4a6080',letterSpacing:1,textTransform:'uppercase'},
  achBarBg:{height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  achBarFill:{height:'100%',backgroundColor:'#ffd700',borderRadius:4},
  achCard:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:16,padding:12},
  achIconBox:{width:44,height:44,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},
  achEmoji:{fontSize:22},
  achInfo:{flex:1,gap:3},
  achTitle:{fontSize:13,fontWeight:'900'},
  achDesc:{color:'#4a6080',fontSize:10,lineHeight:15},
  achRewards:{flexDirection:'row',gap:6,flexWrap:'wrap',marginTop:2},
  achRewardCrystals:{color:'#ffd700',fontSize:9,fontWeight:'700'},
  achRewardXp:{color:'#00e5ff',fontSize:9,fontWeight:'700'},
  achTitleBadge:{borderWidth:1,borderRadius:6,paddingHorizontal:5,paddingVertical:2},
  achTitleBadgeText:{fontSize:8,fontWeight:'800'},
  achClaimBtn:{width:36,height:36,borderWidth:1,borderRadius:10,alignItems:'center',justifyContent:'center'},
  achClaimText:{fontSize:18},
  achClaimedBadge:{width:36,height:36,backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:10,alignItems:'center',justifyContent:'center'},
  achClaimedText:{color:'#39ff8f',fontSize:16,fontWeight:'900'},
});
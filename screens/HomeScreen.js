// screens/HomeScreen.js — Accueil amélioré V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, onValue, get } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES, CREATURE_LIST } from '../data/creatures';
import { listenXp, getLevelFromXp, LEVEL_REWARDS } from '../store/xpService';
import { useNavigation } from '@react-navigation/native';
import { onValue as fbOnValue } from 'firebase/database';
import { useTheme } from '../store/ThemeContext';

const { width: SW } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { label:'Invoquer',  icon:'✦',  screen:'Summon',     color:'#bf5fff', bg:['#100018','#180028'] },
  { label:'Combat',    icon:'⚔️', screen:'Battle',     color:'#ff4fa3', bg:['#180008','#280010'] },
  { label:'Évoluer',   icon:'⚗️', screen:'Evolution',  color:'#ffd700', bg:['#1a1000','#2a1800'] },
  { label:'Monde',     icon:'🌍', screen:'World',      color:'#39ff8f', bg:['#041204','#081808'] },
  { label:'Boutique',  icon:'🛍️', screen:'Shop',       color:'#ffd700', bg:['#1a1000','#2a1800'] },
  { label:'Quêtes',    icon:'📋', screen:'Quests',     color:'#00e5ff', bg:['#0d1a2e','#0a2040'] },
  { label:'Tournoi',   icon:'🏆', screen:'Tournament', color:'#ff6b35', bg:['#180800','#281200'] },
  { label:'Éclipse',   icon:'🌑', screen:'Eclipse',    color:'#bf5fff', bg:['#0a0018','#150030'] },
  { label:'News',      icon:'📰', screen:'News',        color:'#ffa500', bg:['#1a0e00','#0d0700'] },
  { label:'Casino',    icon:'🎰', screen:'SlotMachine', color:'#ff4fa3', bg:['#180008','#0d0004'] },
];

function Star({ x, y, size, delay }) {
  const anim = useRef(new Animated.Value(0.2)).current;
  useEffect(()=>{
    setTimeout(()=>{
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim,{toValue:1,   duration:1200+Math.random()*800,useNativeDriver:true}),
          Animated.timing(anim,{toValue:0.2, duration:1200+Math.random()*800,useNativeDriver:true}),
        ])
      ).start();
    },delay);
  },[]);
  return <Animated.View style={{position:'absolute',left:x,top:y,width:size,height:size,borderRadius:size/2,backgroundColor:'white',opacity:anim}}/>;
}

function StatCard({ label, value, color, emoji }) {
  return (
    <LinearGradient colors={[color+'18',color+'08']} style={[styles.statCard,{borderColor:color+'33'}]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statVal,{color}]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </LinearGradient>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme, mode, setTheme } = useTheme();
  const authCtx  = useAuth();
  const user     = authCtx?.user;
  const uid      = user?.uid||'guest';
  const userName = user?.displayName||user?.email?.split('@')[0]||'Joueur';

  const { collection, crystals, wins, summonCount } = useGameStore();

  const [xpData, setXpData]           = useState({level:1,currentXp:0,neededXp:100,totalXp:0});
  const [guildName, setGuildName]     = useState(null);
  const [dailyDone, setDailyDone]     = useState(0);
  const [eclipseActive, setEclipseActive] = useState(false);
  const [nextEgg, setNextEgg]         = useState(null);
  const [inboxCount, setInboxCount]   = useState(0);

  const greetAnim = useRef(new Animated.Value(0)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const xpAnim    = useRef(new Animated.Value(0)).current;

  const stars = Array.from({length:18},(_,i)=>({
    x:Math.random()*SW, y:Math.random()*200,
    size:0.8+Math.random()*2.5, delay:Math.random()*3000,
  }));

  useEffect(()=>{
    Animated.sequence([
      Animated.timing(greetAnim,{toValue:1,duration:600,useNativeDriver:true}),
      Animated.timing(cardAnim,  {toValue:1,duration:500,useNativeDriver:true}),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.spring(pulseAnim,{toValue:1.06,friction:3,useNativeDriver:true}),
        Animated.spring(pulseAnim,{toValue:1,   friction:5,useNativeDriver:true}),
        Animated.delay(1800),
      ])
    ).start();
  },[]);

  useEffect(()=>{
    const unsub=listenXp(uid,data=>{
      const computed=getLevelFromXp(data.totalXp||0);
      setXpData({...data,...computed});
      Animated.timing(xpAnim,{toValue:1,duration:800,useNativeDriver:false}).start();
    });
    return unsub;
  },[uid]);

  useEffect(()=>{
    get(ref(db,`players/${uid}/guildId`)).then(snap=>{
      if (snap.exists()) get(ref(db,`guilds/${snap.val()}/name`)).then(s=>{if(s.exists())setGuildName(s.val());});
    });
    const today=new Date(), key=`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    get(ref(db,`quests/${uid}/${key}/claimed`)).then(snap=>{
      if (snap.exists()) setDailyDone(Object.keys(snap.val()).length);
    });
    const now=new Date();
    const eclipseDates=[
      new Date(`${now.getFullYear()}-03-20`),new Date(`${now.getFullYear()}-06-21`),
      new Date(`${now.getFullYear()}-09-22`),new Date(`${now.getFullYear()}-12-21`),
    ];
    setEclipseActive(eclipseDates.some(d=>Math.abs(now-d)/3600000<48));
    // Inbox
    const unsubInbox = onValue(ref(db,`inbox/${uid}`),snap=>{
      if (snap.exists()) {
        const msgs = Object.values(snap.val());
        const unclaimed = msgs.filter(m=>!m.claimed&&(!m.expiresAt||Date.now()<m.expiresAt)&&(m.crystals||m.xp)).length;
        setInboxCount(unclaimed);
      } else setInboxCount(0);
    });
    onValue(ref(db,`breeding/${uid}/eggs`),snap=>{
      if (snap.exists()) {
        const eggs=Object.values(snap.val());
        const ready=eggs.find(e=>(Date.now()-e.startedAt)/1000>=e.hatchTime);
        if (ready) setNextEgg(ready);
      }
    });
  },[uid]);

  const uniqueOwned   = new Set(collection.map(c=>c.id)).size;
  const totalCreatures= CREATURE_LIST.length;
  const shinys        = collection.filter(c=>c.isShiny).length;
  const legendaries   = new Set(collection.filter(c=>c.rarity==='legendary').map(c=>c.id)).size;
  const xpPct         = xpData.neededXp>0?(xpData.currentXp/xpData.neededXp)*100:0;

  function getGreeting() {
    const h=new Date().getHours();
    if (h<6)  return 'Bonne nuit 🌙';
    if (h<12) return 'Bonjour ☀️';
    if (h<18) return 'Bon après-midi 🌤️';
    return 'Bonsoir 🌆';
  }

  function getRank() {
    if (xpData.level>=100) return {label:'🌌 LUMINOS',    color:'#bf5fff'};
    if (xpData.level>=50)  return {label:'👑 Grand Maître', color:'#ffd700'};
    if (xpData.level>=20)  return {label:'💎 Collectionneur',color:'#00e5ff'};
    if (xpData.level>=10)  return {label:'⭐ Explorateur',  color:'#39ff8f'};
    return                        {label:'🌱 Apprenti',     color:'#4a6080'};
  }

  const rank = getRank();

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {stars.map((s,i)=><Star key={i} {...s}/>)}
      </View>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── HEADER ── */}
          <Animated.View style={[styles.header,{
            opacity:greetAnim,
            transform:[{translateY:greetAnim.interpolate({inputRange:[0,1],outputRange:[-20,0]})}],
          }]}>
            <View style={styles.greetRow}>
              <View style={{gap:2}}>
                <Text style={styles.greetText}>{getGreeting()}</Text>
                <Text style={styles.greetName}>{userName}</Text>
                <View style={styles.rankRow}>
                  <View style={[styles.rankBadge,{backgroundColor:rank.color+'20',borderColor:rank.color+'44'}]}>
                    <Text style={[styles.rankLabel,{color:rank.color}]}>{rank.label}</Text>
                  </View>
                  {guildName&&<View style={styles.guildBadge}>
                    <Text style={styles.guildText}>⚔️ {guildName}</Text>
                  </View>}
                </View>
              </View>
              <View style={{flexDirection:'row',gap:8,alignItems:'flex-start'}}>
                {eclipseActive&&(
                  <Animated.View style={[styles.eclipseBadge,{transform:[{scale:pulseAnim}]}]}>
                    <Text style={styles.eclipseBadgeText}>🌑 ÉCLIPSE</Text>
                  </Animated.View>
                )}
                <TouchableOpacity onPress={()=>navigation.navigate('Inbox')} style={styles.bellBtn}>
                  <Text style={styles.bellEmoji}>🔔</Text>
                  {inboxCount>0&&(
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>{inboxCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* ── CARTE XP ── */}
          <Animated.View style={{
            opacity:cardAnim,
            transform:[{translateY:cardAnim.interpolate({inputRange:[0,1],outputRange:[20,0]})}],
          }}>
            <LinearGradient colors={['#0d1a2e','#07090f']} style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <View>
                  <Text style={styles.xpLevelLabel}>NIVEAU</Text>
                  <Text style={styles.xpLevel}>{xpData.level}</Text>
                </View>
                <View style={styles.xpMid}>
                  <View style={styles.xpBarBg}>
                    <Animated.View style={[styles.xpBarFill,{
                      width:xpAnim.interpolate({inputRange:[0,1],outputRange:['0%',`${Math.min(100,xpPct)}%`]}),
                    }]}/>
                  </View>
                  <Text style={styles.xpSubtext}>{xpData.currentXp} / {xpData.neededXp} XP</Text>
                </View>
                <Text style={styles.xpEmoji}>
                  {xpData.level>=50?'👑':xpData.level>=20?'💎':xpData.level>=10?'⭐':'🌱'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── STATS ── */}
          <View style={styles.statsRow}>
            <StatCard label="Pokédex"    value={`${uniqueOwned}/${totalCreatures}`} color="#00e5ff" emoji="📖"/>
            <StatCard label="Victoires"  value={wins}    color="#39ff8f" emoji="⚔️"/>
            <StatCard label="Shinys"     value={shinys}  color="#ff69b4" emoji="✨"/>
            <StatCard label="Cristaux"   value={crystals} color="#ffd700" emoji="💎"/>
          </View>

          {/* ── ALERTES ── */}
          {nextEgg&&(
            <TouchableOpacity onPress={()=>navigation.navigate('Breeding')}
              style={[styles.alertCard,{borderColor:'#39ff8f33',backgroundColor:'#39ff8f08'}]}>
              <Animated.Text style={[styles.alertEmoji,{transform:[{scale:pulseAnim}]}]}>🥚</Animated.Text>
              <View style={styles.alertInfo}>
                <Text style={[styles.alertTitle,{color:'#39ff8f'}]}>Œuf prêt à éclore !</Text>
                <Text style={styles.alertSub}>Tape pour aller à l'élevage</Text>
              </View>
              <Text style={[styles.alertArrow,{color:'#39ff8f'}]}>›</Text>
            </TouchableOpacity>
          )}

          {eclipseActive&&(
            <TouchableOpacity onPress={()=>navigation.navigate('Eclipse')}
              style={[styles.alertCard,{borderColor:'#bf5fff55',backgroundColor:'#bf5fff10'}]}>
              <Animated.Text style={[styles.alertEmoji,{transform:[{scale:pulseAnim}]}]}>🌑</Animated.Text>
              <View style={styles.alertInfo}>
                <Text style={[styles.alertTitle,{color:'#bf5fff'}]}>ÉCLIPSE EN COURS !</Text>
                <Text style={styles.alertSub}>Capture LUMINOS — places limitées</Text>
              </View>
              <Text style={[styles.alertArrow,{color:'#bf5fff'}]}>›</Text>
            </TouchableOpacity>
          )}

          {/* ── ACCÈS RAPIDE ── */}
          <Text style={styles.sectionLabel}>⚡ ACCÈS RAPIDE</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a,i)=>(
              <TouchableOpacity key={a.screen} onPress={()=>navigation.navigate(a.screen)}
                style={styles.actionCard}>
                <LinearGradient colors={a.bg} style={[styles.actionGrad,{borderColor:a.color+'44'}]}>
                  <Text style={styles.actionIcon}>{a.icon}</Text>
                  <Text style={[styles.actionLabel,{color:a.color}]}>{a.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── POKÉDEX ── */}
          <TouchableOpacity onPress={()=>navigation.navigate('Collection')} style={styles.pokedexCard}>
            <View style={styles.pokedexHeader}>
              <Text style={styles.sectionLabel}>📖 POKÉDEX</Text>
              <Text style={styles.pokedexPct}>{Math.round((uniqueOwned/totalCreatures)*100)}%</Text>
            </View>
            <View style={styles.pokedexBarBg}>
              <View style={[styles.pokedexBarFill,{width:`${(uniqueOwned/totalCreatures)*100}%`}]}/>
            </View>
            <View style={styles.pokedexFooter}>
              <Text style={styles.pokedexSub}>{uniqueOwned}/{totalCreatures} créatures</Text>
              <Text style={styles.pokedexLink}>Voir tout →</Text>
            </View>
          </TouchableOpacity>

          {/* ── QUÊTES ── */}
          <TouchableOpacity onPress={()=>navigation.navigate('Quests')} style={styles.questCard}>
            <View style={styles.questHeader}>
              <Text style={styles.sectionLabel}>📋 QUÊTES DU JOUR</Text>
              <View style={[styles.questBadge,{backgroundColor:dailyDone>=6?'#39ff8f22':'#ffd70015',borderColor:dailyDone>=6?'#39ff8f44':'#ffd70033'}]}>
                <Text style={[styles.questDone,{color:dailyDone>=6?'#39ff8f':'#ffd700'}]}>{dailyDone}/6</Text>
              </View>
            </View>
            <View style={styles.questBarBg}>
              <View style={[styles.questBarFill,{
                width:`${(dailyDone/6)*100}%`,
                backgroundColor:dailyDone>=6?'#39ff8f':'#ffd700',
              }]}/>
            </View>
            <Text style={styles.questSub}>
              {dailyDone>=6?'🎉 Toutes complétées ! Reviens demain.':'Continue tes quêtes pour gagner des 💎'}
            </Text>
          </TouchableOpacity>

          {/* ── CRÉATURES RÉCENTES ── */}
          {collection.length>0&&(
            <>
              <Text style={styles.sectionLabel}>✨ RÉCEMMENT OBTENUES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.recentRow}>
                  {[...collection].reverse().slice(0,8).map((c,i)=>{
                    const cr=ALL_CREATURES[c.id]; if(!cr) return null;
                    const Sprite=SPRITES[c.id?.replace('_shiny','')]||SPRITES.lumikos;
                    return (
                      <LinearGradient key={c.uid||i} colors={cr.bgGradient||['#0d1220','#07090f']}
                        style={[styles.recentCard,{borderColor:cr.rarityColor+'55'}]}>
                        <Sprite size={50}/>
                        {c.isShiny&&<Text style={styles.recentShiny}>✨</Text>}
                        {cr.rarity==='legendary'&&<Text style={styles.recentLeg}>★</Text>}
                        <Text style={[styles.recentName,{color:cr.rarityColor}]} numberOfLines={1}>{cr.name}</Text>
                      </LinearGradient>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          {/* ── PROCHAIN NIVEAU ── */}
          {(()=>{
            const nextLvl=Object.keys(LEVEL_REWARDS).map(Number).find(l=>l>xpData.level);
            const reward=nextLvl?LEVEL_REWARDS[nextLvl]:null;
            if (!reward) return null;
            return (
              <LinearGradient colors={['#1a1000','#07090f']} style={styles.nextLevelCard}>
                <Text style={styles.sectionLabel}>🎁 PROCHAIN PALIER</Text>
                <View style={styles.nextLevelRow}>
                  <View style={[styles.nextLevelBadge,{backgroundColor:'#ffd70022',borderColor:'#ffd70044'}]}>
                    <Text style={styles.nextLevelNum}>Nv.{nextLvl}</Text>
                  </View>
                  <View style={{flex:1,gap:3}}>
                    <Text style={styles.nextLevelTitle}>{reward.title}</Text>
                    <View style={styles.nextLevelRewards}>
                      {reward.crystals>0&&<Text style={styles.nextLevelCrystals}>+{reward.crystals} 💎</Text>}
                      {reward.creature&&<Text style={styles.nextLevelCreature}>✦ {reward.creature}</Text>}
                    </View>
                  </View>
                  <Text style={styles.nextLevelXp}>{xpData.neededXp-xpData.currentXp} XP</Text>
                </View>
              </LinearGradient>
            );
          })()}

          {/* ── THÈME ── */}
          <View style={styles.themeCard}>
            <Text style={styles.sectionLabel}>🎨 THÈME</Text>
            <View style={styles.themeRow}>
              {[
                {id:'dark', label:'Sombre', emoji:'🌑'},
                {id:'light',label:'Clair',  emoji:'☀️'},
                {id:'auto', label:'Appareil',emoji:'📱'},
              ].map(t=>(
                <TouchableOpacity key={t.id} onPress={()=>setTheme(t.id)}
                  style={[styles.themeBtn,mode===t.id&&styles.themeBtnActive]}>
                  <Text style={styles.themeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.themeLabel,mode===t.id&&{color:'#00e5ff'}]}>{t.label}</Text>
                  {mode===t.id&&<View style={styles.themeCheck}/>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1},
  scroll:{paddingHorizontal:16,paddingBottom:32,gap:14},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  // Header
  header:{paddingTop:16,gap:6},
  greetRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  greetText:{fontSize:13,color:'#4a6080'},
  greetName:{fontSize:26,fontWeight:'900',color:'#fff',letterSpacing:1},
  rankRow:{flexDirection:'row',gap:8,alignItems:'center',marginTop:4},
  rankBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:3},
  rankLabel:{fontSize:10,fontWeight:'800'},
  guildBadge:{backgroundColor:'#ff6b3518',borderWidth:1,borderColor:'#ff6b3533',borderRadius:10,paddingHorizontal:8,paddingVertical:3},
  guildText:{fontSize:10,color:'#ff6b35',fontWeight:'700'},
  eclipseBadge:{backgroundColor:'#bf5fff22',borderWidth:1,borderColor:'#bf5fff55',borderRadius:12,paddingHorizontal:10,paddingVertical:6},
  eclipseBadgeText:{color:'#bf5fff',fontSize:11,fontWeight:'900',letterSpacing:1},
  bellBtn:{position:'relative',width:40,height:40,borderRadius:20,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',alignItems:'center',justifyContent:'center'},
  bellEmoji:{fontSize:18},
  bellBadge:{position:'absolute',top:-4,right:-4,backgroundColor:'#ff4fa3',borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  bellBadgeText:{color:'#000',fontSize:8,fontWeight:'900'},
  // XP
  xpCard:{borderWidth:1,borderColor:'#00e5ff22',borderRadius:18,padding:16},
  xpHeader:{flexDirection:'row',alignItems:'center',gap:12},
  xpLevelLabel:{fontSize:7,color:'#4a6080',letterSpacing:2,textTransform:'uppercase'},
  xpLevel:{fontSize:32,fontWeight:'900',color:'#00e5ff'},
  xpMid:{flex:1,gap:6},
  xpBarBg:{height:7,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  xpBarFill:{height:'100%',backgroundColor:'#00e5ff',borderRadius:4},
  xpSubtext:{fontSize:10,color:'#4a6080'},
  xpEmoji:{fontSize:30},
  // Stats
  statsRow:{flexDirection:'row',gap:8},
  statCard:{flex:1,borderWidth:1,borderRadius:14,padding:10,alignItems:'center',gap:3},
  statEmoji:{fontSize:16},
  statVal:{fontSize:13,fontWeight:'900'},
  statLbl:{fontSize:7,color:'#4a6080',letterSpacing:0.5,textAlign:'center'},
  // Alertes
  alertCard:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderRadius:16,padding:14},
  alertEmoji:{fontSize:28},
  alertInfo:{flex:1,gap:2},
  alertTitle:{fontSize:14,fontWeight:'800'},
  alertSub:{color:'#4a6080',fontSize:11},
  alertArrow:{fontSize:22,fontWeight:'900'},
  // Actions
  actionsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  actionCard:{width:(SW-48)/4,borderRadius:14,overflow:'hidden'},
  actionGrad:{borderWidth:1,borderRadius:14,padding:10,alignItems:'center',gap:5,minHeight:68,justifyContent:'center'},
  actionIcon:{fontSize:20},
  actionLabel:{fontSize:8,fontWeight:'900',letterSpacing:0.5,textAlign:'center'},
  // Pokédex
  pokedexCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#00e5ff22',borderRadius:16,padding:14,gap:8},
  pokedexHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  pokedexPct:{color:'#00e5ff',fontSize:18,fontWeight:'900'},
  pokedexBarBg:{height:6,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  pokedexBarFill:{height:'100%',backgroundColor:'#00e5ff',borderRadius:4},
  pokedexFooter:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  pokedexSub:{color:'#4a6080',fontSize:11},
  pokedexLink:{color:'#00e5ff',fontSize:11,fontWeight:'700'},
  // Quêtes
  questCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#ffd70022',borderRadius:16,padding:14,gap:8},
  questHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  questBadge:{borderWidth:1,borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  questDone:{fontSize:13,fontWeight:'900'},
  questBarBg:{height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  questBarFill:{height:'100%',borderRadius:4},
  questSub:{color:'#4a6080',fontSize:11},
  // Récents
  recentRow:{flexDirection:'row',gap:10,paddingRight:16},
  recentCard:{borderWidth:1.5,borderRadius:14,padding:8,alignItems:'center',gap:4,width:80,position:'relative'},
  recentShiny:{position:'absolute',top:4,right:4,fontSize:10},
  recentLeg:{position:'absolute',top:4,left:4,fontSize:10,color:'#ffd700',fontWeight:'900'},
  recentName:{fontSize:7,fontWeight:'800',textAlign:'center'},
  // Prochain niveau
  nextLevelCard:{borderWidth:1,borderColor:'#ffd70022',borderRadius:16,padding:14,gap:10},
  nextLevelRow:{flexDirection:'row',alignItems:'center',gap:12},
  nextLevelBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center'},
  nextLevelNum:{color:'#ffd700',fontSize:16,fontWeight:'900'},
  nextLevelTitle:{color:'#c8daf0',fontSize:13,fontWeight:'700'},
  nextLevelRewards:{flexDirection:'row',gap:8},
  nextLevelCrystals:{color:'#ffd700',fontSize:11,fontWeight:'700'},
  nextLevelCreature:{color:'#00e5ff',fontSize:11,fontWeight:'700'},
  nextLevelXp:{color:'#4a6080',fontSize:10,textAlign:'right'},
  // Thème
  themeCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:10},
  themeRow:{flexDirection:'row',gap:8},
  themeBtn:{flex:1,alignItems:'center',gap:5,backgroundColor:'#07090f',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:12},
  themeBtnActive:{borderColor:'#00e5ff44',backgroundColor:'#00e5ff10'},
  themeEmoji:{fontSize:22},
  themeLabel:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  themeCheck:{width:8,height:8,borderRadius:4,backgroundColor:'#00e5ff'},
});
// screens/TournamentScreen.js — Tournoi amélioré V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, get, onValue, push, serverTimestamp } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES, CREATURE_LIST } from '../data/creatures';
import { addXp, XP_REWARDS } from '../store/xpService';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');
const MAX_PLAYERS = 8;
const ROUND_NAMES = ['⚔️ Quarts de finale', '🔥 Demi-finales', '🏆 Finale'];

// ─── Helpers ──────────────────────────────────────────────────────
function simulateBattle(a, b) {
  const scoreA = (a.atk*0.4 + a.spd*0.3 + a.hp*0.3) * (0.8+Math.random()*0.4);
  const scoreB = (b.atk*0.4 + b.spd*0.3 + b.hp*0.3) * (0.8+Math.random()*0.4);
  return scoreA >= scoreB ? 'a' : 'b';
}

function getBestCreature(collection) {
  if (!collection?.length) return {id:'lumikos',atk:38,spd:61,hp:52,def:30};
  return collection.reduce((best,c) => {
    const cr = ALL_CREATURES[c.id];
    if (!cr) return best;
    const score = cr.stats.atk + cr.stats.spd + cr.stats.hp;
    return score > (best.atk+best.spd+best.hp) ? {...cr.stats,id:c.id} : best;
  }, {id:'lumikos',atk:0,spd:0,hp:0,def:0});
}

const BOT_NAMES = ['PixelMage','DarkKnight','StarChaser','IronFox','CrystalWing','ShadowBlade','NeonRaider'];

function generateBots(count) {
  return Array.from({length:count},(_,i) => {
    const c = CREATURE_LIST[i % CREATURE_LIST.length];
    return {id:`bot_${i}_${Date.now()}`,name:BOT_NAMES[i%BOT_NAMES.length],isBot:true,creatureId:c.id,atk:c.stats.atk,spd:c.stats.spd,hp:c.stats.hp};
  });
}

// ─── Particule ────────────────────────────────────────────────────
function Particle({color,delay}) {
  const anim = useRef(new Animated.Value(0)).current;
  const x = (Math.random()-0.5)*SW*0.8, y = -20-Math.random()*80;
  useEffect(()=>{
    setTimeout(()=>{
      Animated.timing(anim,{toValue:1,duration:800+Math.random()*400,useNativeDriver:true}).start();
    },delay);
  },[]);
  return (
    <Animated.View style={{
      position:'absolute',left:SW/2+x,top:SH*0.3+y,
      width:6+Math.random()*6,height:6+Math.random()*6,borderRadius:4,backgroundColor:color,
      opacity:anim.interpolate({inputRange:[0,0.3,1],outputRange:[0,1,0]}),
      transform:[{translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-60]})}],
    }}/>
  );
}

const SH = 400;

// ─── PlayerSlot ───────────────────────────────────────────────────
function PlayerSlot({player,isWinner,isLoser,myId}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    if (isWinner) {
      Animated.sequence([
        Animated.spring(scaleAnim,{toValue:1.08,friction:3,useNativeDriver:true}),
        Animated.spring(scaleAnim,{toValue:1,   friction:5,useNativeDriver:true}),
      ]).start();
    }
  },[isWinner]);

  if (!player) return (
    <View style={styles.emptySlot}>
      <Text style={styles.emptySlotText}>En attente…</Text>
    </View>
  );

  const isMe   = player.id===myId;
  const c      = player.creatureId ? ALL_CREATURES[player.creatureId] : null;
  const Sprite = SPRITES[player.creatureId?.replace('_shiny','')] || SPRITES.lumikos;

  return (
    <Animated.View style={[
      styles.playerSlot,
      isMe    &&styles.playerSlotMe,
      isWinner&&styles.playerSlotWinner,
      isLoser &&styles.playerSlotLoser,
      {transform:[{scale:scaleAnim}]},
    ]}>
      <Sprite size={38}/>
      <View style={styles.slotInfo}>
        <View style={styles.slotNameRow}>
          <Text style={[styles.slotName,isMe&&{color:'#00e5ff'},isWinner&&{color:'#39ff8f'}]} numberOfLines={1}>
            {isMe?`${player.name} ★`:player.name}
          </Text>
          {player.isBot&&<Text style={styles.botTag}>🤖</Text>}
        </View>
        {c&&<Text style={[styles.slotCreature,{color:c.rarityColor}]} numberOfLines={1}>{c.name}</Text>}
        {c&&<View style={styles.slotStats}>
          <Text style={styles.slotStat}>⚔️{player.atk}</Text>
          <Text style={styles.slotStat}>💨{player.spd}</Text>
          <Text style={styles.slotStat}>❤️{player.hp}</Text>
        </View>}
      </View>
      {isWinner&&<Text style={styles.winIcon}>👑</Text>}
      {isLoser &&<Text style={styles.loseIcon}>✗</Text>}
    </Animated.View>
  );
}

// ─── MatchCard ────────────────────────────────────────────────────
function MatchCard({match,myId,isLive}) {
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if (isLive && !match?.winner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim,{toValue:1,duration:700,useNativeDriver:false}),
          Animated.timing(glowAnim,{toValue:0,duration:700,useNativeDriver:false}),
        ])
      ).start();
    }
    if (match?.winner) {
      Animated.sequence([
        Animated.timing(shakeAnim,{toValue:8, duration:50,useNativeDriver:true}),
        Animated.timing(shakeAnim,{toValue:-8,duration:50,useNativeDriver:true}),
        Animated.timing(shakeAnim,{toValue:0, duration:50,useNativeDriver:true}),
      ]).start();
    }
  },[match?.winner,isLive]);

  if (!match) return null;
  const isMe = match.playerA?.id===myId || match.playerB?.id===myId;

  return (
    <Animated.View style={[
      styles.matchCard,
      isMe&&styles.matchCardMe,
      {transform:[{translateX:shakeAnim}]},
    ]}>
      {isLive&&!match.winner&&(
        <Animated.View style={[styles.liveBanner,{
          backgroundColor:glowAnim.interpolate({inputRange:[0,1],outputRange:['#ffd70015','#ffd70035']}),
        }]}>
          <Text style={styles.liveBannerText}>⚔️ EN COURS</Text>
        </Animated.View>
      )}
      <PlayerSlot player={match.playerA} isWinner={match.winner==='a'} isLoser={match.winner==='b'} myId={myId}/>
      <View style={styles.vsRow}>
        <View style={styles.vsLine}/>
        <View style={[styles.vsCircle,{borderColor:isMe?'#00e5ff33':'#1e2d4a'}]}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <View style={styles.vsLine}/>
      </View>
      <PlayerSlot player={match.playerB} isWinner={match.winner==='b'} isLoser={match.winner==='a'} myId={myId}/>
    </Animated.View>
  );
}

// ─── TournamentScreen ─────────────────────────────────────────────
export default function TournamentScreen() {
  const { collection, crystals, addCrystals } = useGameStore();
  const authCtx  = useAuth();
  const user     = authCtx?.user;
  const myId     = user?.uid || 'guest';
  const myName   = user?.displayName || user?.email?.split('@')[0] || 'Joueur';

  const [phase, setPhase]           = useState('lobby');
  const [tournament, setTournament] = useState(null);
  const [tournamentId, setTournamentId] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [myRank, setMyRank]         = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [pickingCreature, setPickingCreature] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [countdown, setCountdown]   = useState(5);
  const [particles, setParticles]   = useState([]);

  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const trophyAnim  = useRef(new Animated.Value(0)).current;
  const countAnim   = useRef(new Animated.Value(1)).current;
  const titleAnim   = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim,{toValue:1.12,duration:900,useNativeDriver:true}),
        Animated.timing(pulseAnim,{toValue:1,   duration:900,useNativeDriver:true}),
      ])
    ).start();
    Animated.timing(titleAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  useEffect(()=>{
    if (!tournamentId) return;
    const unsub = onValue(ref(db,`tournaments/${tournamentId}`),snap=>{
      if (!snap.exists()) return;
      const data = snap.val();
      setTournament(data);
      if (data.status==='running'&&phase==='waiting') setPhase('bracket');
      if (data.status==='finished') {
        const rank = getMyRank(data,myId);
        setPhase('finished');
        setMyRank(rank);
        Animated.spring(trophyAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
        if (auth.currentUser?.uid) addXp(auth.currentUser.uid,rank===1?XP_REWARDS.win:XP_REWARDS.loss,null,null,null);
        // Particules si top 2
        if (rank===1||rank===2) {
          const ps = Array.from({length:20},(_,i)=>({id:i,color:rank===1?'#ffd700':'#c0c0c0',delay:i*80}));
          setParticles(ps);
          setTimeout(()=>setParticles([]),2000);
        }
      }
      const rounds = data.rounds||{};
      if (rounds[2]&&Object.values(rounds[2]).some(m=>m.winner)) setCurrentRound(3);
      else if (rounds[1]&&Object.values(rounds[1]).some(m=>m.winner)) setCurrentRound(2);
      else setCurrentRound(1);
    });
    return unsub;
  },[tournamentId,phase]);

  useEffect(()=>{
    if (phase!=='waiting') return;
    const interval = setInterval(()=>{
      setCountdown(c=>{
        Animated.sequence([
          Animated.spring(countAnim,{toValue:1.4,friction:3,useNativeDriver:true}),
          Animated.spring(countAnim,{toValue:1,  friction:5,useNativeDriver:true}),
        ]).start();
        return Math.max(0,c-1);
      });
    },1000);
    return ()=>clearInterval(interval);
  },[phase]);

  function getMyRank(t,id) {
    const finalMatch = t.rounds?.[2]?Object.values(t.rounds[2])[0]:null;
    if (!finalMatch) return 'Éliminé';
    if ((finalMatch.winner==='a'&&finalMatch.playerA?.id===id)||(finalMatch.winner==='b'&&finalMatch.playerB?.id===id)) return 1;
    const sf = t.rounds?.[1]?Object.values(t.rounds[1]):[];
    for (const m of sf) {
      if ((m.winner==='a'&&m.playerB?.id===id)||(m.winner==='b'&&m.playerA?.id===id)) return 2;
    }
    return 'Éliminé';
  }

  async function joinTournament() {
    setLoading(true);
    const best = selectedId ? {...ALL_CREATURES[selectedId]?.stats,id:selectedId} : getBestCreature(collection);
    const playerData = {
      id:myId, name:myName, isBot:false,
      creatureId:best.id||'lumikos',
      atk:best.atk||38, spd:best.spd||61, hp:best.hp||52,
      joinedAt:serverTimestamp(),
    };
    try {
      const snap = await get(ref(db,'tournaments'));
      let foundId = null;
      if (snap.exists()) {
        for (const [tid,t] of Object.entries(snap.val())) {
          if (t.status==='waiting'&&Object.keys(t.players||{}).length<MAX_PLAYERS) {
            await set(ref(db,`tournaments/${tid}/players/${myId}`),playerData);
            foundId=tid; break;
          }
        }
      }
      if (!foundId) {
        const newRef = push(ref(db,'tournaments'));
        foundId = newRef.key;
        await set(newRef,{status:'waiting',createdAt:serverTimestamp(),players:{[myId]:playerData}});
      }
      setTournamentId(foundId); setPhase('waiting'); setCountdown(5);
      checkAndStart(foundId);
    } catch(e){console.error(e);}
    setLoading(false);
  }

  async function checkAndStart(tid) {
    setTimeout(async()=>{
      const snap = await get(ref(db,`tournaments/${tid}`));
      if (!snap.exists()) return;
      const t = snap.val();
      if (t.status!=='waiting') return;
      const players  = Object.values(t.players||{});
      const bots     = generateBots(MAX_PLAYERS-players.length);
      const all      = [...players,...bots];
      const shuffled = [...all].sort(()=>Math.random()-0.5);
      const qf = [
        {playerA:shuffled[0],playerB:shuffled[1],winner:null},
        {playerA:shuffled[2],playerB:shuffled[3],winner:null},
        {playerA:shuffled[4],playerB:shuffled[5],winner:null},
        {playerA:shuffled[6],playerB:shuffled[7],winner:null},
      ];
      await set(ref(db,`tournaments/${tid}`),{
        ...t,status:'running',
        players:Object.fromEntries(all.map(p=>[p.id,p])),
        rounds:{0:qf,1:[],2:[]},startedAt:serverTimestamp(),
      });
      simulateRounds(tid,qf);
    },5000);
  }

  async function simulateRounds(tid,qf) {
    setTimeout(async()=>{
      const qfR = qf.map(m=>({...m,winner:simulateBattle(m.playerA,m.playerB)}));
      await set(ref(db,`tournaments/${tid}/rounds/0`),qfR);
      const sf = [
        {playerA:qfR[0].winner==='a'?qfR[0].playerA:qfR[0].playerB,playerB:qfR[1].winner==='a'?qfR[1].playerA:qfR[1].playerB,winner:null},
        {playerA:qfR[2].winner==='a'?qfR[2].playerA:qfR[2].playerB,playerB:qfR[3].winner==='a'?qfR[3].playerA:qfR[3].playerB,winner:null},
      ];
      await set(ref(db,`tournaments/${tid}/rounds/1`),sf);
      setTimeout(async()=>{
        const sfR = sf.map(m=>({...m,winner:simulateBattle(m.playerA,m.playerB)}));
        await set(ref(db,`tournaments/${tid}/rounds/1`),sfR);
        const fin = [{playerA:sfR[0].winner==='a'?sfR[0].playerA:sfR[0].playerB,playerB:sfR[1].winner==='a'?sfR[1].playerA:sfR[1].playerB,winner:null}];
        await set(ref(db,`tournaments/${tid}/rounds/2`),fin);
        setTimeout(async()=>{
          const finR = [{...fin[0],winner:simulateBattle(fin[0].playerA,fin[0].playerB)}];
          await set(ref(db,`tournaments/${tid}/rounds/2`),finR);
          await set(ref(db,`tournaments/${tid}/status`),'finished');
          await set(ref(db,`tournaments/${tid}/finishedAt`),serverTimestamp());
        },3000);
      },3000);
    },3000);
  }

  async function claimReward() {
    if (rewardClaimed) return;
    const amounts = {1:150,2:75,'Éliminé':20};
    addCrystals(amounts[myRank]||20);
    setRewardClaimed(true);
  }

  function leaveTournament() {
    setPhase('lobby'); setTournament(null); setTournamentId(null);
    setMyRank(null); setRewardClaimed(false); setCountdown(5);
    trophyAnim.setValue(0); setParticles([]);
  }

  // ── PICK CREATURE ──
  if (pickingCreature) {
    const ownedIds = [...new Set(collection.map(c=>c.id))].filter(id=>ALL_CREATURES[id]);
    return (
      <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.title}>CHOISIR</Text>
          <Text style={styles.subtitle}>Quelle créature envoies-tu au tournoi ?</Text>
          <ScrollView contentContainerStyle={styles.pickScroll} showsVerticalScrollIndicator={false}>
            {ownedIds.map(id=>{
              const c = ALL_CREATURES[id];
              const Sprite = SPRITES[id.replace('_shiny','')]||SPRITES.lumikos;
              const isSel  = selectedId===id;
              const score  = c.stats.atk+c.stats.spd+c.stats.hp;
              return (
                <TouchableOpacity key={id} onPress={()=>{setSelectedId(id);setPickingCreature(false);}}
                  style={[styles.pickRow,{borderColor:isSel?c.rarityColor+'88':'#1e2d4a',backgroundColor:isSel?c.rarityColor+'18':'#0d1220'}]}>
                  <LinearGradient colors={isSel?c.bgGradient||['#0d1220','#07090f']:['#0d1220','#07090f']} style={styles.pickGrad}>
                    <Sprite size={68}/>
                    <View style={styles.pickInfo}>
                      <Text style={[styles.pickName,{color:c.rarityColor}]}>{c.name}</Text>
                      <Text style={styles.pickType}>{c.rarityLabel} · {c.type}</Text>
                      <View style={styles.pickStats}>
                        <Text style={[styles.pickStat,{color:'#ff4fa3'}]}>⚔️ {c.stats.atk}</Text>
                        <Text style={[styles.pickStat,{color:'#ffd700'}]}>💨 {c.stats.spd}</Text>
                        <Text style={[styles.pickStat,{color:'#39ff8f'}]}>❤️ {c.stats.hp}</Text>
                        <Text style={[styles.pickStat,{color:'#00e5ff'}]}>Score {score}</Text>
                      </View>
                    </View>
                    {isSel&&<View style={[styles.pickCheck,{backgroundColor:c.rarityColor}]}><Text style={styles.pickCheckText}>✓</Text></View>}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={()=>setPickingCreature(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>← Annuler</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── LOBBY ──
  if (phase==='lobby') {
    const best = selectedId?ALL_CREATURES[selectedId]:ALL_CREATURES[getBestCreature(collection).id];
    const BSprite = best?(SPRITES[best.id?.replace('_shiny','')]||SPRITES.lumikos):SPRITES.lumikos;

    return (
      <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.lobbyScroll}>

            <Animated.View style={{opacity:titleAnim,transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-20,0]})}]}}>
              <Text style={styles.title}>TOURNOI</Text>
              <Text style={styles.subtitle}>8 joueurs · Élimination directe</Text>
            </Animated.View>

            {/* Trophée pulsant */}
            <Animated.Text style={[styles.trophy,{transform:[{scale:pulseAnim}]}]}>🏆</Animated.Text>

            {/* Récompenses */}
            <View style={styles.rewardsCard}>
              <Text style={styles.sectionLabel}>💎 RÉCOMPENSES</Text>
              {[
                {rank:'🥇 Champion',  crystals:150, xp:150, color:'#ffd700', bg:['#1a1000','#2a1800']},
                {rank:'🥈 Finaliste', crystals:75,  xp:100, color:'#c0c0c0', bg:['#141414','#1e1e1e']},
                {rank:'🥉 Demi',      crystals:40,  xp:60,  color:'#cd7f32', bg:['#100800','#180c00']},
                {rank:'○  Éliminé',  crystals:20,  xp:30,  color:'#4a6080', bg:['#0d1220','#07090f']},
              ].map((r,i)=>(
                <LinearGradient key={i} colors={r.bg}
                  style={[styles.rewardRow,{borderColor:r.color+'33'}]}>
                  <Text style={[styles.rewardRank,{color:r.color}]}>{r.rank}</Text>
                  <View style={styles.rewardRight}>
                    <Text style={[styles.rewardCrystals,{color:r.color}]}>+{r.crystals} 💎</Text>
                    <Text style={styles.rewardXp}>+{r.xp} XP</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>

            {/* Créature */}
            <TouchableOpacity onPress={()=>setPickingCreature(true)}
              style={[styles.creatureCard,{borderColor:best?.rarityColor+'55'||'#1e2d4a'}]}>
              <LinearGradient colors={best?.bgGradient||['#0d1220','#07090f']} style={styles.creatureCardGrad}>
                <Text style={styles.sectionLabel}>{selectedId?'✓ CRÉATURE CHOISIE':'MEILLEURE AUTO'}</Text>
                <BSprite size={88}/>
                {best&&<>
                  <Text style={[styles.creatureName,{color:best.rarityColor}]}>{best.name}</Text>
                  <View style={styles.creatureStats}>
                    <Text style={[styles.creatureStat,{color:'#ff4fa3'}]}>⚔️ {best.stats.atk}</Text>
                    <Text style={[styles.creatureStat,{color:'#ffd700'}]}>💨 {best.stats.spd}</Text>
                    <Text style={[styles.creatureStat,{color:'#39ff8f'}]}>❤️ {best.stats.hp}</Text>
                  </View>
                </>}
                <Text style={styles.changeHint}>Appuie pour changer →</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Guide */}
            <View style={styles.howCard}>
              <Text style={styles.sectionLabel}>⚔️ RÈGLES</Text>
              {[
                ['🎮','8 joueurs (bots si nécessaire)'],
                ['⚡','Combat automatique basé sur les stats'],
                ['🔄','Quarts → Demi-finales → Finale'],
                ['📡','Résultats en temps réel'],
                ['🎁','Récompenses immédiates'],
              ].map(([icon,text],i)=>(
                <View key={i} style={styles.howRow}>
                  <Text style={styles.howIcon}>{icon}</Text>
                  <Text style={styles.howText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Bouton rejoindre */}
            <TouchableOpacity onPress={joinTournament} disabled={loading} style={styles.joinBtn}>
              <LinearGradient colors={['#ffd70055','#ffa50033']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.joinBtnGrad}>
                {loading
                  ? <ActivityIndicator color="#ffd700" size="large"/>
                  : <>
                      <Text style={styles.joinText}>🏆 REJOINDRE LE TOURNOI</Text>
                      <Text style={styles.joinSub}>Entrée gratuite · Commence dans 5s</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── WAITING ──
  if (phase==='waiting') {
    const pCount = tournament?Object.keys(tournament.players||{}).length:1;
    return (
      <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.waitArea}>
            <Text style={styles.title}>TOURNOI</Text>
            <Animated.Text style={[styles.trophy,{transform:[{scale:pulseAnim}]}]}>🏆</Animated.Text>
            <Text style={styles.waitTitle}>Recherche de joueurs...</Text>
            <Text style={[styles.waitCount,{color:'#ffd700'}]}>{pCount}/{MAX_PLAYERS}</Text>
            <View style={styles.waitSlots}>
              {Array.from({length:MAX_PLAYERS}).map((_,i)=>(
                <Animated.View key={i} style={[styles.waitSlot,i<pCount&&{
                  backgroundColor:'#ffd700',
                  transform:[{scale:i<pCount?1.1:1}],
                }]}/>
              ))}
            </View>
            <Animated.Text style={[styles.countdownText,{
              transform:[{scale:countAnim}],
              color:countdown<=2?'#ff4fa3':'#00e5ff',
            }]}>
              {countdown>0?`Début dans ${countdown}s`:'Démarrage...'}
            </Animated.Text>
            <Text style={styles.waitSub}>Les places vides sont remplies par des bots</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── BRACKET / FINISHED ──
  const rounds = tournament?.rounds||{};

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      {particles.map(p=><Particle key={p.id} color={p.color} delay={p.delay}/>)}
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.bracketHeader}>
          <Text style={styles.title}>TOURNOI</Text>
          {phase==='bracket'
            ?<View style={styles.livePill}><Text style={styles.livePillText}>🔴 EN DIRECT</Text></View>
            :<View style={styles.donePill}><Text style={styles.donePillText}>✓ TERMINÉ</Text></View>
          }
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bracketScroll}>

          {/* Rounds */}
          {[0,1,2].map(ri=>{
            const matches = rounds[ri]?Object.values(rounds[ri]):[];
            const isActive = ri+1===currentRound && phase==='bracket';
            return (
              <View key={ri} style={styles.roundSection}>
                <View style={[styles.roundHeader,isActive&&{borderColor:'#ffd70044'}]}>
                  <Text style={[styles.roundTitle,isActive&&{color:'#ffd700'}]}>{ROUND_NAMES[ri]}</Text>
                  {isActive&&<ActivityIndicator color="#ffd700" size="small"/>}
                  {ri<currentRound-1&&<Text style={styles.roundDone}>✓</Text>}
                </View>
                {matches.length===0
                  ?<View style={styles.roundPending}>
                    <ActivityIndicator color="#4a6080" size="small"/>
                    <Text style={styles.roundPendingText}>En attente...</Text>
                  </View>
                  :matches.map((match,mi)=>(
                    <MatchCard key={mi} match={match} myId={myId} isLive={isActive&&!match?.winner}/>
                  ))
                }
              </View>
            );
          })}

          {/* Résultat final */}
          {phase==='finished'&&myRank!==null&&(
            <Animated.View style={[styles.resultCard,{
              borderColor:myRank===1?'#ffd70066':myRank===2?'#c0c0c066':'#1e2d4a',
              opacity:trophyAnim,
              transform:[{scale:trophyAnim.interpolate({inputRange:[0,1],outputRange:[0.85,1]})}],
            }]}>
              <LinearGradient
                colors={myRank===1?['#1a1000','#2a1800']:myRank===2?['#141414','#1e1e1e']:['#0d1220','#07090f']}
                style={styles.resultGrad}>
                <Text style={styles.resultEmoji}>{myRank===1?'🥇':myRank===2?'🥈':'○'}</Text>
                <Text style={[styles.resultTitle,{color:myRank===1?'#ffd700':myRank===2?'#c0c0c0':'#4a6080'}]}>
                  {myRank===1?'CHAMPION !':myRank===2?'FINALISTE':'ÉLIMINÉ'}
                </Text>
                <View style={styles.resultRewards}>
                  <Text style={[styles.resultCrystals,{color:myRank===1?'#ffd700':myRank===2?'#c0c0c0':'#4a6080'}]}>
                    +{myRank===1?150:myRank===2?75:20} 💎
                  </Text>
                  <Text style={styles.resultXp}>+{myRank===1?150:myRank===2?100:30} XP</Text>
                </View>
                {!rewardClaimed
                  ?<TouchableOpacity onPress={claimReward} style={styles.claimBtn}>
                    <LinearGradient colors={['#ffd70055','#ffa50022']} style={styles.claimBtnGrad}>
                      <Text style={styles.claimBtnText}>✦ Récupérer la récompense</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  :<Text style={styles.claimedText}>✅ Récompense récupérée !</Text>
                }
                <TouchableOpacity onPress={leaveTournament} style={styles.leaveBtn}>
                  <Text style={styles.leaveBtnText}>← Rejouer un tournoi</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1},
  title:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:12},
  subtitle:{fontSize:11,color:'#4a6080',letterSpacing:2,textAlign:'center',marginBottom:4},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700',textTransform:'uppercase'},
  trophy:{fontSize:64,textAlign:'center'},
  // Lobby
  lobbyScroll:{paddingHorizontal:16,paddingVertical:12,gap:14,alignItems:'center'},
  rewardsCard:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#ffd70022',borderRadius:18,padding:14,gap:8},
  rewardRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderRadius:12,padding:12},
  rewardRank:{fontSize:13,fontWeight:'800'},
  rewardRight:{alignItems:'flex-end',gap:2},
  rewardCrystals:{fontSize:15,fontWeight:'900'},
  rewardXp:{fontSize:10,color:'#4a6080'},
  creatureCard:{width:'100%',borderWidth:1,borderRadius:18,overflow:'hidden'},
  creatureCardGrad:{padding:16,alignItems:'center',gap:8},
  creatureName:{fontSize:20,fontWeight:'900',letterSpacing:2},
  creatureStats:{flexDirection:'row',gap:16},
  creatureStat:{fontSize:13,fontWeight:'700'},
  changeHint:{fontSize:10,color:'#4a6080',fontStyle:'italic'},
  howCard:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:8},
  howRow:{flexDirection:'row',alignItems:'center',gap:10},
  howIcon:{fontSize:16,width:24,textAlign:'center'},
  howText:{flex:1,color:'#6a84a0',fontSize:13,lineHeight:20},
  joinBtn:{width:'100%',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#ffd70033'},
  joinBtnGrad:{alignItems:'center',paddingVertical:22,gap:6},
  joinText:{color:'#ffd700',fontSize:17,fontWeight:'900',letterSpacing:2},
  joinSub:{color:'#ffd70077',fontSize:10,letterSpacing:1},
  // Pick
  pickScroll:{gap:10,paddingHorizontal:16,paddingBottom:80,paddingTop:8},
  pickRow:{borderWidth:1.5,borderRadius:16,overflow:'hidden'},
  pickGrad:{flexDirection:'row',alignItems:'center',padding:12,gap:12},
  pickInfo:{flex:1,gap:4},
  pickName:{fontSize:16,fontWeight:'900',letterSpacing:1},
  pickType:{fontSize:10,color:'#4a6080'},
  pickStats:{flexDirection:'row',gap:10},
  pickStat:{fontSize:12,fontWeight:'700'},
  pickCheck:{width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center'},
  pickCheckText:{color:'#000',fontWeight:'900',fontSize:14},
  cancelBtn:{position:'absolute',bottom:16,left:16,right:16,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:14,alignItems:'center'},
  cancelBtnText:{color:'#4a6080',fontSize:13,fontWeight:'700'},
  // Wait
  waitArea:{flex:1,alignItems:'center',justifyContent:'center',gap:16,padding:24},
  waitTitle:{color:'#c8daf0',fontSize:18,fontWeight:'700',letterSpacing:2},
  waitCount:{fontSize:40,fontWeight:'900'},
  waitSlots:{flexDirection:'row',gap:8},
  waitSlot:{width:34,height:10,borderRadius:5,backgroundColor:'#1e2d4a'},
  countdownText:{fontSize:24,fontWeight:'900',letterSpacing:2},
  waitSub:{color:'#4a6080',fontSize:11,textAlign:'center',fontStyle:'italic'},
  // Bracket
  bracketHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingBottom:8,paddingTop:4},
  livePill:{backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444444',borderRadius:10,paddingHorizontal:10,paddingVertical:4},
  livePillText:{color:'#ff4444',fontSize:11,fontWeight:'800'},
  donePill:{backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:10,paddingHorizontal:10,paddingVertical:4},
  donePillText:{color:'#39ff8f',fontSize:11,fontWeight:'800'},
  bracketScroll:{paddingHorizontal:16,paddingVertical:8,gap:20,paddingBottom:32},
  roundSection:{gap:10},
  roundHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:1,borderColor:'#1e2d4a'},
  roundTitle:{fontSize:12,color:'#4a6080',fontWeight:'900',letterSpacing:2},
  roundDone:{color:'#39ff8f',fontSize:14,fontWeight:'900'},
  roundPending:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,padding:16,backgroundColor:'#0d1220',borderRadius:12},
  roundPendingText:{color:'#4a6080',fontSize:12,fontStyle:'italic'},
  // Match
  matchCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,overflow:'hidden'},
  matchCardMe:{borderColor:'#00e5ff33'},
  liveBanner:{paddingVertical:5,alignItems:'center'},
  liveBannerText:{color:'#ffd700',fontSize:9,fontWeight:'900',letterSpacing:2},
  vsRow:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12},
  vsLine:{flex:1,height:1,backgroundColor:'#1e2d4a'},
  vsCircle:{width:32,height:32,borderRadius:16,borderWidth:1,alignItems:'center',justifyContent:'center',backgroundColor:'#07090f'},
  vsText:{color:'#4a6080',fontSize:9,fontWeight:'900'},
  // Player slot
  playerSlot:{flexDirection:'row',alignItems:'center',gap:8,padding:10},
  emptySlot:{padding:14,alignItems:'center'},
  emptySlotText:{color:'#4a6080',fontSize:11,fontStyle:'italic'},
  playerSlotMe:{backgroundColor:'#00e5ff08'},
  playerSlotWinner:{backgroundColor:'#39ff8f10'},
  playerSlotLoser:{opacity:0.45},
  slotInfo:{flex:1,gap:2},
  slotNameRow:{flexDirection:'row',alignItems:'center',gap:6},
  slotName:{color:'#c8daf0',fontSize:12,fontWeight:'700'},
  botTag:{fontSize:10},
  slotCreature:{fontSize:10},
  slotStats:{flexDirection:'row',gap:8},
  slotStat:{color:'#4a6080',fontSize:9},
  winIcon:{fontSize:16},
  loseIcon:{fontSize:14,color:'#ff4444'},
  // Result
  resultCard:{borderWidth:1,borderRadius:24,overflow:'hidden'},
  resultGrad:{padding:24,alignItems:'center',gap:12},
  resultEmoji:{fontSize:60},
  resultTitle:{fontSize:30,fontWeight:'900',letterSpacing:4},
  resultRewards:{flexDirection:'row',gap:20,alignItems:'center'},
  resultCrystals:{fontSize:28,fontWeight:'900'},
  resultXp:{color:'#00e5ff',fontSize:16,fontWeight:'700'},
  claimBtn:{width:'100%',borderRadius:16,overflow:'hidden'},
  claimBtnGrad:{alignItems:'center',paddingVertical:18,borderWidth:1,borderColor:'#ffd70033',borderRadius:16},
  claimBtnText:{color:'#ffd700',fontSize:15,fontWeight:'900',letterSpacing:2},
  claimedText:{color:'#39ff8f',fontSize:15,fontWeight:'700'},
  leaveBtn:{padding:10},
  leaveBtnText:{color:'#4a6080',fontSize:13},
});
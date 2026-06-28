// screens/GuildChallengeScreen.js — Défis de guilde améliorés V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, get, onValue } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { addXp } from '../store/xpService';
import { useToast } from '../store/ToastContext';
import { sendInboxMessage } from './InboxScreen';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');

const CHALLENGE_TYPES = [
  { id:'wins',       label:'Victoires en combat',     emoji:'⚔️', unit:'victoires',   color:'#ff4fa3', bg:['#180008','#280010'] },
  { id:'summons',    label:'Invocations de créatures', emoji:'✦',  unit:'invocations', color:'#bf5fff', bg:['#100018','#180028'] },
  { id:'collect',    label:'Créatures collectées',     emoji:'📖', unit:'créatures',   color:'#00e5ff', bg:['#0d1a2e','#0a2040'] },
  { id:'crystals',   label:'Cristaux accumulés',       emoji:'💎', unit:'cristaux',    color:'#ffd700', bg:['#1a1000','#2a1800'] },
  { id:'evolutions', label:'Évolutions effectuées',    emoji:'⚗️', unit:'évolutions',  color:'#39ff8f', bg:['#041204','#081808'] },
];

const REWARDS = {
  1:            { crystals:100, xp:200, label:'1ère place',    color:'#ffd700', emoji:'🥇' },
  2:            { crystals:50,  xp:120, label:'2ème place',    color:'#c0c0c0', emoji:'🥈' },
  3:            { crystals:25,  xp:80,  label:'3ème place',    color:'#cd7f32', emoji:'🥉' },
  participation:{ crystals:10,  xp:30,  label:'Participation', color:'#00e5ff', emoji:'✦'  },
};

function getTodayKey() {
  const d=new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getDailyChallenges() {
  const key=getTodayKey();
  const seed=key.split('-').reduce((a,b)=>a+parseInt(b),0);
  const indices=[seed%5,(seed+2)%5,(seed+4)%5];
  const targets=[20,30,50,75,100];
  return indices.map((idx,i)=>({
    ...CHALLENGE_TYPES[idx],
    target:targets[(seed+i)%targets.length],
    key:`${key}_${i}`,dateKey:key,index:i,
  }));
}

function getTimeUntilReset() {
  const now=new Date(),t=new Date(now);
  t.setDate(t.getDate()+1); t.setHours(0,0,0,0);
  const diff=t-now;
  const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getPlayerScore(challengeId,gameData) {
  const {wins,summonCount,collection,crystals}=gameData;
  switch(challengeId) {
    case 'wins':       return wins;
    case 'summons':    return summonCount;
    case 'collect':    return collection.length;
    case 'crystals':   return crystals;
    case 'evolutions': return collection.filter(c=>['lumivex','lumirex','luminos','pyrax','pyralord','aquilon','aquarex','floriva','glacirath','voltaris'].includes(c.id)).length;
    default: return 0;
  }
}

// ─── ChallengeCard ────────────────────────────────────────────────
function ChallengeCard({ch, myGuild, myGuildId, contributions, claimed, gameData, allGuilds, onSync, onClaim, syncing, index}) {
  const barAnim   = useRef(new Animated.Value(0)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const myScore    = getPlayerScore(ch.id,gameData);
  const myContrib  = contributions[ch.key]?.score||0;
  const guildScore = myGuild?.challenges?.[ch.key]?.score||0;
  const guildPct   = Math.min(100,(guildScore/ch.target)*100);
  const myPct      = Math.min(100,(myScore/ch.target)*100);
  const isComplete = guildScore>=ch.target;
  const isClaimed  = claimed[ch.key];

  const sorted = [...allGuilds].map(g=>({...g,score:g.challenges?.[ch.key]?.score||0})).sort((a,b)=>b.score-a.score);
  const guildRank = sorted.findIndex(g=>g.id===myGuildId)+1||null;
  const reward = REWARDS[guildRank]||REWARDS.participation;

  useEffect(()=>{
    setTimeout(()=>{
      Animated.spring(entryAnim,{toValue:1,friction:6,useNativeDriver:true}).start();
    },index*100);
    Animated.timing(barAnim,{toValue:guildPct,duration:800,useNativeDriver:false}).start();
    if (isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim,{toValue:1,duration:800,useNativeDriver:true}),
          Animated.timing(glowAnim,{toValue:0,duration:800,useNativeDriver:true}),
        ])
      ).start();
    }
  },[guildPct,isComplete]);

  return (
    <Animated.View style={{
      opacity:entryAnim,
      transform:[{translateY:entryAnim.interpolate({inputRange:[0,1],outputRange:[20,0]})}],
    }}>
      <LinearGradient colors={ch.bg} style={[styles.challengeCard,{
        borderColor:isComplete?ch.color+'99':ch.color+'44',
      }]}>
        {/* Shimmer si complété */}
        {isComplete&&(
          <Animated.View style={[StyleSheet.absoluteFill,{
            backgroundColor:ch.color,
            opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0,0.05]}),
            borderRadius:20,
          }]}/>
        )}

        {/* Header */}
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeIconBox,{backgroundColor:ch.color+'22',borderColor:ch.color+'44'}]}>
            <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
          </View>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeTitle,{color:ch.color}]}>{ch.label}</Text>
            <Text style={styles.challengeTarget}>Objectif : {ch.target} {ch.unit}</Text>
          </View>
          {guildRank>0&&(
            <View style={[styles.rankBadge,{backgroundColor:reward.color+'22',borderColor:reward.color+'55'}]}>
              <Text style={styles.rankBadgeEmoji}>{reward.emoji}</Text>
              <Text style={[styles.rankBadgeText,{color:reward.color}]}>#{guildRank}</Text>
            </View>
          )}
        </View>

        {/* Score guilde */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{myGuild?.emblem} Guilde</Text>
            <Text style={[styles.scoreVal,{color:ch.color}]}>{guildScore}<Text style={styles.scoreTarget}>/{ch.target}</Text></Text>
          </View>
          <View style={styles.barBg}>
            <Animated.View style={[styles.barFill,{
              width:barAnim.interpolate({inputRange:[0,100],outputRange:['0%','100%']}),
              backgroundColor:ch.color,
            }]}/>
            {guildPct>0&&guildPct<100&&(
              <View style={[styles.barGlow,{left:`${guildPct}%`,backgroundColor:ch.color}]}/>
            )}
          </View>
          {/* Ma contribution */}
          <View style={styles.myContribRow}>
            <View style={styles.myContribLeft}>
              <Text style={styles.myContribLabel}>👤 Ma contribution</Text>
              <Text style={[styles.myContribVal,{color:ch.color}]}>{myContrib} {ch.unit}</Text>
            </View>
            <View style={styles.myContribLeft}>
              <Text style={styles.myContribLabel}>📊 Mon score</Text>
              <Text style={[styles.myContribVal,{color:ch.color}]}>{myScore} {ch.unit}</Text>
            </View>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.challengeBtns}>
          <TouchableOpacity onPress={()=>onSync(ch)} disabled={syncing}
            style={[styles.syncBtn,{borderColor:ch.color+'44',backgroundColor:ch.color+'18'},syncing&&styles.disabled]}>
            <Text style={[styles.syncBtnText,{color:ch.color}]}>
              {syncing?'…':'↑ Sync — '+myScore+' '+ch.unit}
            </Text>
          </TouchableOpacity>
          {isComplete&&!isClaimed&&(
            <TouchableOpacity onPress={()=>onClaim(ch,guildRank||'participation')}
              style={[styles.claimBtn,{borderColor:reward.color+'66',backgroundColor:reward.color+'22'}]}>
              <Text style={[styles.claimBtnText,{color:reward.color}]}>🎁 +{reward.crystals}💎</Text>
            </TouchableOpacity>
          )}
          {isClaimed&&(
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedText}>✓ Réclamé</Text>
            </View>
          )}
        </View>

        {/* Banner complété */}
        {isComplete&&(
          <Animated.View style={[styles.completeBanner,{
            backgroundColor:ch.color+'22',borderColor:ch.color+'55',
            opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.8,1]}),
          }]}>
            <Text style={[styles.completeText,{color:ch.color}]}>✓ DÉFI COMPLÉTÉ !</Text>
            {!isClaimed&&<Text style={[styles.completeSub,{color:ch.color+'88'}]}>Réclame ta récompense →</Text>}
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ─── GuildChallengeScreen ─────────────────────────────────────────
export default function GuildChallengeScreen() {
  const {wins,summonCount,collection,crystals,addCrystals} = useGameStore();
  const { showToast } = useToast();
  const authCtx  = useAuth();
  const user     = authCtx?.user;
  const uid      = user?.uid||'guest';
  const userName = user?.displayName||user?.email?.split('@')[0]||'Joueur';

  const [myGuildId, setMyGuildId]   = useState(null);
  const [myGuild, setMyGuild]       = useState(null);
  const [allGuilds, setAllGuilds]   = useState([]);
  const [contributions, setContributions] = useState({});
  const [claimed, setClaimed]       = useState({});
  const [timeLeft, setTimeLeft]     = useState(getTimeUntilReset());
  const [tab, setTab]               = useState('Défis');
  const [feedback, setFeedback]     = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [syncing, setSyncing]       = useState(false);

  const challenges = getDailyChallenges();
  const gameData   = {wins,summonCount,collection,crystals};
  const dateKey    = getTodayKey();

  const titleAnim    = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  useEffect(()=>{
    const interval=setInterval(()=>setTimeLeft(getTimeUntilReset()),1000);
    return ()=>clearInterval(interval);
  },[]);

  useEffect(()=>{
    const unsub=onValue(ref(db,`players/${uid}/guildId`),snap=>{
      if (snap.exists()) setMyGuildId(snap.val());
      else setMyGuildId(null);
    });
    return unsub;
  },[uid]);

  useEffect(()=>{
    if (!myGuildId) return;
    const unsubGuild=onValue(ref(db,`guilds/${myGuildId}`),snap=>{if(snap.exists())setMyGuild(snap.val());});
    const unsubAll=onValue(ref(db,'guilds'),snap=>{if(snap.exists())setAllGuilds(Object.values(snap.val()));});
    challenges.forEach(ch=>{
      onValue(ref(db,`guildChallenges/${ch.key}/${uid}`),snap=>{
        if(snap.exists())setContributions(prev=>({...prev,[ch.key]:snap.val()}));
      });
    });
    get(ref(db,`guildChallenges/claimed/${dateKey}/${uid}`)).then(snap=>{
      if(snap.exists())setClaimed(snap.val());
    });
    return ()=>{unsubGuild();unsubAll();};
  },[myGuildId]);

  function showFeedback(msg,type='success') {
    setFeedback(msg); setFeedbackType(type);
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim,{toValue:1,duration:200,useNativeDriver:true}),
      Animated.delay(2000),
      Animated.timing(feedbackAnim,{toValue:0,duration:300,useNativeDriver:true}),
    ]).start(()=>setFeedback(''));
  }

  async function syncChallenge(ch) {
    if (!myGuildId||syncing) return;
    setSyncing(true);
    const score=getPlayerScore(ch.id,gameData);
    await set(ref(db,`guildChallenges/${ch.key}/${uid}`),{score,name:userName,updatedAt:Date.now()});
    setContributions(prev=>({...prev,[ch.key]:{score,name:userName}}));
    const membSnap=await get(ref(db,`guilds/${myGuildId}/members`));
    if (membSnap.exists()) {
      let total=0;
      for (const mid of Object.keys(membSnap.val())) {
        const s=await get(ref(db,`guildChallenges/${ch.key}/${mid}`));
        if(s.exists()) total+=s.val().score||0;
      }
      await set(ref(db,`guilds/${myGuildId}/challenges/${ch.key}`),{score:total,updatedAt:Date.now()});
    }
    showFeedback(`✓ Sync — ${score} ${ch.unit} envoyés !`);
    setSyncing(false);
  }

  async function claimReward(ch,rank) {
    if (claimed[ch.key]||!rank) return;
    const reward=REWARDS[rank]||REWARDS.participation;
    addCrystals(reward.crystals);
    const uid2=auth.currentUser?.uid;
    if (uid2) addXp(uid2,reward.xp,null,null,null);
    const newClaimed={...claimed,[ch.key]:true};
    setClaimed(newClaimed);
    await set(ref(db,`guildChallenges/claimed/${dateKey}/${uid}`),newClaimed);
    showFeedback(`✓ +${reward.crystals} 💎 · +${reward.xp} XP récupérés !`);
    showToast({type:'guild',title:'Défi de guilde complété !',message:`${reward.label} — ${ch.label}`,crystals:reward.crystals,xp:reward.xp,duration:4000});
    if (auth.currentUser?.uid) {
      sendInboxMessage(auth.currentUser.uid,{
        type:'guild',
        title:`🏆 Récompense défi — ${ch.label}`,
        description:`Tu as terminé "${ch.label}" avec ta guilde.`,
        crystals:reward.crystals,
        xp:reward.xp,
        expiresIn:3*86400000,
      });
    }
  }

  // Pas de guilde
  if (!myGuildId) return (
    <LinearGradient colors={['#07090f','#0d1220']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={{fontSize:60}}>⚔️</Text>
          <Text style={styles.noGuildTitle}>Rejoins une guilde</Text>
          <Text style={styles.noGuildText}>Tu dois être dans une guilde pour participer aux défis quotidiens.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const completedCount = challenges.filter(ch=>(myGuild?.challenges?.[ch.key]?.score||0)>=ch.target).length;

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>DÉFIS DE GUILDE</Animated.Text>

        {/* Feedback */}
        {feedback!==''&&(
          <Animated.View style={[styles.feedbackBox,{
            opacity:feedbackAnim,
            backgroundColor:feedbackType==='success'?'#39ff8f22':'#ff444422',
            borderColor:feedbackType==='success'?'#39ff8f44':'#ff444444',
          }]}>
            <Text style={[styles.feedbackText,{color:feedbackType==='success'?'#39ff8f':'#ff4444'}]}>{feedback}</Text>
          </Animated.View>
        )}

        {/* Header */}
        <View style={styles.headerRow}>
          <LinearGradient colors={['#0d1a2e','#07090f']} style={styles.timerBox}>
            <Text style={styles.timerLabel}>⏱ RESET</Text>
            <Text style={styles.timerVal}>{timeLeft}</Text>
          </LinearGradient>
          {myGuild&&(
            <LinearGradient colors={['#0d1220','#07090f']} style={styles.myGuildBox}>
              <Text style={styles.myGuildEmoji}>{myGuild.emblem}</Text>
              <View style={{flex:1}}>
                <Text style={styles.myGuildName} numberOfLines={1}>{myGuild.name}</Text>
                <Text style={styles.myGuildSub}>{completedCount}/3 défis</Text>
              </View>
              <View style={[styles.completedBadge,{backgroundColor:completedCount===3?'#39ff8f22':'#1e2d4a',borderColor:completedCount===3?'#39ff8f44':'#1e2d4a'}]}>
                <Text style={[styles.completedBadgeText,{color:completedCount===3?'#39ff8f':'#4a6080'}]}>{completedCount}/3</Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            {id:'Défis',        color:'#ff4fa3'},
            {id:'Classement',   color:'#ffd700'},
            {id:'Récompenses',  color:'#00e5ff'},
          ].map(t=>(
            <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)}
              style={[styles.tabBtn,tab===t.id&&{borderColor:t.color+'44',backgroundColor:t.color+'12'}]}>
              <Text style={[styles.tabText,tab===t.id&&{color:t.color}]}>{t.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── DÉFIS ── */}
          {tab==='Défis'&&(
            <>
              <View style={styles.defisHeader}>
                <Text style={styles.sectionLabel}>📅 3 DÉFIS DU JOUR</Text>
                <Text style={styles.defisDate}>{getTodayKey()}</Text>
              </View>
              {challenges.map((ch,i)=>(
                <ChallengeCard key={ch.key} ch={ch} myGuild={myGuild} myGuildId={myGuildId}
                  contributions={contributions} claimed={claimed} gameData={gameData}
                  allGuilds={allGuilds} onSync={syncChallenge} onClaim={claimReward}
                  syncing={syncing} index={i}/>
              ))}
            </>
          )}

          {/* ── CLASSEMENT ── */}
          {tab==='Classement'&&(
            <>
              {challenges.map(ch=>{
                const sorted=[...allGuilds]
                  .map(g=>({...g,score:g.challenges?.[ch.key]?.score||0}))
                  .sort((a,b)=>b.score-a.score)
                  .slice(0,10);
                const medals=['🥇','🥈','🥉'];
                return (
                  <View key={ch.key} style={styles.rankSection}>
                    <LinearGradient colors={ch.bg} style={[styles.rankSectionHeader,{borderColor:ch.color+'44'}]}>
                      <View style={[styles.rankSectionIconBox,{backgroundColor:ch.color+'22'}]}>
                        <Text style={{fontSize:18}}>{ch.emoji}</Text>
                      </View>
                      <Text style={[styles.rankSectionTitle,{color:ch.color}]}>{ch.label}</Text>
                      <Text style={[styles.rankSectionTarget,{color:ch.color+'77'}]}>/{ch.target}</Text>
                    </LinearGradient>
                    {sorted.length===0&&(
                      <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>Aucune guilde classée</Text>
                      </View>
                    )}
                    {sorted.map((guild,i)=>{
                      const isMe=guild.id===myGuildId;
                      const pct=Math.min(100,(guild.score/ch.target)*100);
                      return (
                        <LinearGradient key={guild.id}
                          colors={isMe?ch.bg:['#0d1220','#07090f']}
                          style={[styles.rankRow,{borderColor:isMe?ch.color+'55':'#1e2d4a'}]}>
                          <Text style={styles.rankPos}>{medals[i]||`#${i+1}`}</Text>
                          <Text style={styles.rankGuildEmoji}>{guild.emblem}</Text>
                          <View style={styles.rankInfo}>
                            <Text style={[styles.rankName,{color:isMe?ch.color:'#c8daf0'}]}>
                              {guild.name}{isMe?' ★':''}
                            </Text>
                            <View style={styles.rankBarBg}>
                              <View style={[styles.rankBarFill,{width:`${pct}%`,backgroundColor:isMe?ch.color:ch.color+'55'}]}/>
                            </View>
                          </View>
                          <Text style={[styles.rankScore,{color:isMe?ch.color:'#ffd700'}]}>{guild.score}</Text>
                        </LinearGradient>
                      );
                    })}
                  </View>
                );
              })}
            </>
          )}

          {/* ── RÉCOMPENSES ── */}
          {tab==='Récompenses'&&(
            <>
              <Text style={styles.sectionLabel}>🎁 RÉCOMPENSES PAR CLASSEMENT</Text>
              <Text style={styles.rewardsHint}>Distribuées à chaque membre de la guilde à la fin du défi</Text>
              {Object.entries(REWARDS).map(([rank,r])=>(
                <LinearGradient key={rank} colors={[r.color+'18','#07090f']}
                  style={[styles.rewardCard,{borderColor:r.color+'33'}]}>
                  <Text style={styles.rewardEmoji}>{r.emoji}</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardLabel,{color:r.color}]}>{r.label}</Text>
                    <Text style={styles.rewardDesc}>Par défi complété · Par membre</Text>
                  </View>
                  <View style={styles.rewardVals}>
                    <Text style={[styles.rewardCrystals,{color:r.color}]}>+{r.crystals} 💎</Text>
                    <Text style={styles.rewardXp}>+{r.xp} XP</Text>
                  </View>
                </LinearGradient>
              ))}

              <View style={styles.rulesCard}>
                <Text style={styles.sectionLabel}>📖 RÈGLES</Text>
                {[
                  ['⏱','3 défis différents chaque jour'],
                  ['🔄','Réinitialisation à minuit'],
                  ['↑','Clique Sync pour mettre à jour ta contribution'],
                  ['🏆','Le score guilde = somme des contributions'],
                  ['🎁','Réclame ta récompense quand le défi est complété'],
                  ['👥','Tous les membres reçoivent la même récompense'],
                ].map(([e,t],i)=>(
                  <View key={i} style={styles.ruleRow}>
                    <Text style={styles.ruleEmoji}>{e}</Text>
                    <Text style={styles.ruleText}>{t}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:20,fontWeight:'900',color:'#fff',letterSpacing:4,textAlign:'center',paddingTop:16,marginBottom:8},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  centered:{flex:1,alignItems:'center',justifyContent:'center',gap:16,padding:24},
  noGuildTitle:{color:'#fff',fontSize:20,fontWeight:'900'},
  noGuildText:{color:'#4a6080',fontSize:13,textAlign:'center',lineHeight:20},
  feedbackBox:{borderWidth:1,borderRadius:12,padding:10,alignItems:'center',marginBottom:8},
  feedbackText:{fontSize:12,fontWeight:'700'},
  // Header
  headerRow:{flexDirection:'row',gap:8,marginBottom:10},
  timerBox:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:10,alignItems:'center',gap:2,minWidth:100},
  timerLabel:{fontSize:7,color:'#4a6080',letterSpacing:2,textTransform:'uppercase'},
  timerVal:{fontSize:20,fontWeight:'900',color:'#00e5ff'},
  myGuildBox:{flex:1,borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:10,flexDirection:'row',alignItems:'center',gap:8},
  myGuildEmoji:{fontSize:22},
  myGuildName:{color:'#c8daf0',fontSize:13,fontWeight:'700'},
  myGuildSub:{color:'#4a6080',fontSize:9},
  completedBadge:{borderWidth:1,borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  completedBadgeText:{fontSize:11,fontWeight:'900'},
  // Tabs
  tabRow:{flexDirection:'row',gap:6,marginBottom:12},
  tabBtn:{flex:1,alignItems:'center',paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  tabText:{color:'#4a6080',fontSize:10,fontWeight:'700'},
  scroll:{gap:14,paddingBottom:24},
  // Défis
  defisHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  defisDate:{color:'#4a6080',fontSize:10},
  // Challenge card
  challengeCard:{borderWidth:1.5,borderRadius:20,padding:16,gap:12,overflow:'hidden'},
  challengeHeader:{flexDirection:'row',alignItems:'center',gap:12},
  challengeIconBox:{width:50,height:50,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},
  challengeEmoji:{fontSize:24},
  challengeInfo:{flex:1,gap:3},
  challengeTitle:{fontSize:14,fontWeight:'900',letterSpacing:0.5},
  challengeTarget:{fontSize:10,color:'rgba(255,255,255,0.4)'},
  rankBadge:{borderWidth:1,borderRadius:12,paddingHorizontal:8,paddingVertical:5,alignItems:'center',gap:2},
  rankBadgeEmoji:{fontSize:14},
  rankBadgeText:{fontSize:10,fontWeight:'900'},
  // Score section
  scoreSection:{gap:8},
  scoreRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  scoreLabel:{fontSize:11,color:'rgba(255,255,255,0.4)'},
  scoreVal:{fontSize:20,fontWeight:'900'},
  scoreTarget:{fontSize:12,color:'rgba(255,255,255,0.3)',fontWeight:'400'},
  barBg:{height:8,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:6,overflow:'hidden',position:'relative'},
  barFill:{height:'100%',borderRadius:6},
  barGlow:{position:'absolute',top:0,width:8,height:'100%',borderRadius:4,opacity:0.8},
  myContribRow:{flexDirection:'row',justifyContent:'space-between'},
  myContribLeft:{gap:2},
  myContribLabel:{fontSize:9,color:'rgba(255,255,255,0.3)',letterSpacing:1},
  myContribVal:{fontSize:13,fontWeight:'800'},
  // Boutons
  challengeBtns:{flexDirection:'row',gap:8},
  syncBtn:{flex:1,borderWidth:1,borderRadius:12,paddingVertical:11,alignItems:'center'},
  syncBtnText:{fontSize:11,fontWeight:'900'},
  claimBtn:{borderWidth:1,borderRadius:12,paddingHorizontal:14,paddingVertical:11,alignItems:'center'},
  claimBtnText:{fontSize:12,fontWeight:'900'},
  claimedBadge:{borderRadius:10,paddingHorizontal:12,paddingVertical:10,backgroundColor:'#39ff8f18',borderWidth:1,borderColor:'#39ff8f33'},
  claimedText:{color:'#39ff8f',fontSize:11,fontWeight:'700'},
  completeBanner:{borderWidth:1,borderRadius:12,padding:10,gap:2,alignItems:'center'},
  completeText:{fontSize:12,fontWeight:'900',letterSpacing:2},
  completeSub:{fontSize:9,letterSpacing:1},
  // Classement
  rankSection:{gap:8},
  rankSectionHeader:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:14,padding:12},
  rankSectionIconBox:{width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center'},
  rankSectionTitle:{flex:1,fontSize:13,fontWeight:'800',letterSpacing:0.5},
  rankSectionTarget:{fontSize:12,fontWeight:'700'},
  rankRow:{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1,borderRadius:14,padding:10},
  rankPos:{fontSize:18,width:28,textAlign:'center'},
  rankGuildEmoji:{fontSize:18},
  rankInfo:{flex:1,gap:3},
  rankName:{fontSize:12,fontWeight:'700'},
  rankBarBg:{height:4,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  rankBarFill:{height:'100%',borderRadius:4},
  rankScore:{fontSize:14,fontWeight:'900'},
  emptyBox:{alignItems:'center',paddingVertical:16},
  emptyText:{color:'#4a6080',fontSize:12},
  // Récompenses
  rewardsHint:{color:'#4a6080',fontSize:11,fontStyle:'italic'},
  rewardCard:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderRadius:16,padding:14},
  rewardEmoji:{fontSize:28,width:34,textAlign:'center'},
  rewardInfo:{flex:1,gap:3},
  rewardLabel:{fontSize:14,fontWeight:'800'},
  rewardDesc:{fontSize:10,color:'#4a6080'},
  rewardVals:{alignItems:'flex-end',gap:2},
  rewardCrystals:{fontSize:15,fontWeight:'900'},
  rewardXp:{fontSize:11,color:'#00e5ff',fontWeight:'700'},
  rulesCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:8},
  ruleRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
  ruleEmoji:{fontSize:14,width:22,textAlign:'center'},
  ruleText:{flex:1,color:'#6a84a0',fontSize:12,lineHeight:20},
  disabled:{opacity:0.4},
});
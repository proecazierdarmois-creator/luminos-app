// screens/QuestScreen.js — Quêtes améliorées V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, onValue } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { addXp, XP_REWARDS } from '../store/xpService';
import { useToast } from '../store/ToastContext';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');

// ─── Templates ───────────────────────────────────────────────────
const DAILY_QUESTS = [
  { id:'summon_3',     label:'Effectuer 3 invocations',          emoji:'✦',  target:3,   reward:8,   xp:20,  type:'summon',    color:'#bf5fff' },
  { id:'summon_10',    label:'Effectuer 10 invocations',         emoji:'✦',  target:10,  reward:20,  xp:40,  type:'summon',    color:'#bf5fff' },
  { id:'win_3',        label:'Remporter 3 combats',              emoji:'⚔️', target:3,   reward:10,  xp:30,  type:'win',       color:'#ff4fa3' },
  { id:'win_10',       label:'Remporter 10 combats',             emoji:'⚔️', target:10,  reward:25,  xp:60,  type:'win',       color:'#ff4fa3' },
  { id:'evolve_1',     label:'Faire évoluer une créature',       emoji:'⚗️', target:1,   reward:15,  xp:35,  type:'evolve',    color:'#00e5ff' },
  { id:'collect_5',    label:'Obtenir 5 créatures',              emoji:'📖', target:5,   reward:15,  xp:40,  type:'collect',   color:'#39ff8f' },
  { id:'collect_10',   label:'Obtenir 10 créatures',             emoji:'📖', target:10,  reward:30,  xp:70,  type:'collect',   color:'#39ff8f' },
  { id:'shiny_1',      label:'Obtenir un Shiny',                 emoji:'✨', target:1,   reward:50,  xp:100, type:'shiny',     color:'#ff69b4' },
  { id:'market_buy',   label:'Acheter au marché',                emoji:'🏪', target:1,   reward:10,  xp:25,  type:'market',    color:'#ffd700' },
  { id:'crystals_50',  label:'Accumuler 50 cristaux',            emoji:'💎', target:50,  reward:5,   xp:15,  type:'crystals',  color:'#00e5ff' },
  { id:'breed_1',      label:'Faire éclore un œuf',              emoji:'🥚', target:1,   reward:12,  xp:30,  type:'breed',     color:'#ff9944' },
  { id:'tournament_1', label:'Participer à un tournoi',          emoji:'🏆', target:1,   reward:20,  xp:50,  type:'tournament',color:'#ffd700' },
  { id:'win_5',        label:'Remporter 5 combats',              emoji:'🏆', target:5,   reward:20,  xp:50,  type:'win',       color:'#ffd700' },
  { id:'evolve_2',     label:'Faire évoluer 2 créatures',        emoji:'⚗️', target:2,   reward:28,  xp:60,  type:'evolve',    color:'#00e5ff' },
  { id:'market_sell',  label:'Vendre une créature au marché',    emoji:'💰', target:1,   reward:10,  xp:25,  type:'market',    color:'#ffd700' },
];

const BONUS_QUESTS = [
  { id:'bonus_win_5',      label:'BONUS : Remporter 5 combats',       emoji:'🏆', target:5,  reward:60,  xp:150, type:'win',     color:'#ffd700' },
  { id:'bonus_summon_15',  label:'BONUS : 15 invocations',            emoji:'🌟', target:15, reward:70,  xp:160, type:'summon',  color:'#ffd700' },
  { id:'bonus_evolve_3',   label:'BONUS : Faire évoluer 3 créatures', emoji:'⚡', target:3,  reward:55,  xp:140, type:'evolve',  color:'#ffd700' },
  { id:'bonus_collect_15', label:'BONUS : Obtenir 15 créatures',      emoji:'💫', target:15, reward:65,  xp:150, type:'collect', color:'#ffd700' },
  { id:'bonus_shiny_1',    label:'BONUS : Obtenir un Shiny',          emoji:'✨', target:1,  reward:80,  xp:200, type:'shiny',   color:'#ffd700' },
];

const WEEKLY_QUESTS = [
  { id:'weekly_win_30',    label:'Remporter 30 combats cette semaine', emoji:'⚔️', target:30, reward:150, xp:300, type:'win',    color:'#ff4fa3', weekly:true },
  { id:'weekly_summon_50', label:'Effectuer 50 invocations',           emoji:'✦',  target:50, reward:200, xp:400, type:'summon', color:'#bf5fff', weekly:true },
  { id:'weekly_evolve_5',  label:'Faire évoluer 5 créatures',          emoji:'⚗️', target:5,  reward:180, xp:350, type:'evolve', color:'#39ff8f', weekly:true },
  { id:'weekly_collect_20',label:'Obtenir 20 créatures',               emoji:'📖', target:20, reward:160, xp:320, type:'collect',color:'#00e5ff', weekly:true },
];

// ─── Helpers ──────────────────────────────────────────────────────
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getWeekKey() {
  const d = new Date(), jan1 = new Date(d.getFullYear(),0,1);
  const week = Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7);
  return `${d.getFullYear()}-W${week}`;
}

function getDailyQuests() {
  const today = getTodayKey();
  const seed  = today.split('-').reduce((a,b)=>a+parseInt(b),0);
  const shuffled = [...DAILY_QUESTS].sort((a,b)=>(seed*a.id.length)%DAILY_QUESTS.length-(seed*b.id.length)%DAILY_QUESTS.length);
  return { daily:shuffled.slice(0,5), bonus:BONUS_QUESTS[seed%BONUS_QUESTS.length] };
}

function getTimeUntilReset(weekly=false) {
  const now = new Date();
  let target = new Date(now);
  if (weekly) {
    const days = (8-now.getDay())%7||7;
    target.setDate(now.getDate()+days);
  } else {
    target.setDate(target.getDate()+1);
  }
  target.setHours(0,0,0,0);
  const diff = target-now;
  const h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function calcProgress(quest, gameData, savedProg) {
  const {wins,summonCount,collection,crystals} = gameData;
  switch(quest.type) {
    case 'summon':  return Math.min(summonCount, quest.target);
    case 'win':     return Math.min(wins, quest.target);
    case 'collect': return Math.min(collection.length, quest.target);
    case 'crystals':return Math.min(crystals, quest.target);
    case 'shiny':   return Math.min(collection.filter(c=>c.isShiny).length, quest.target);
    case 'evolve':  return Math.min(
      collection.filter(c=>['lumivex','lumirex','luminos','pyrax','pyralord','aquilon','aquarex','floriva','glacirath','voltaris'].includes(c.id)).length,
      quest.target
    );
    default: return savedProg||0;
  }
}

// ─── Particule ────────────────────────────────────────────────────
function Particle({color,x,y}) {
  const anim = useRef(new Animated.Value(0)).current;
  const dx=(Math.random()-0.5)*100, dy=-30-Math.random()*60;
  useEffect(()=>{
    Animated.timing(anim,{toValue:1,duration:700+Math.random()*300,useNativeDriver:true}).start();
  },[]);
  return (
    <Animated.View style={{
      position:'absolute',left:x+dx,top:y+dy,
      width:6+Math.random()*6,height:6+Math.random()*6,borderRadius:4,backgroundColor:color,
      opacity:anim.interpolate({inputRange:[0,0.4,1],outputRange:[0,1,0]}),
      transform:[
        {translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-40]})},
        {scale:anim.interpolate({inputRange:[0,0.4,1],outputRange:[0.5,1.5,0.2]})},
      ],
    }}/>
  );
}

// ─── QuestCard ────────────────────────────────────────────────────
function QuestCard({quest,progress,claimed,onClaim,isBonus,isWeekly,index=0}) {
  const pct      = Math.min(1,progress/quest.target);
  const complete = pct>=1;
  const color    = claimed?'#39ff8f':isBonus||isWeekly?'#ffd700':quest.color||'#00e5ff';
  const [particles, setParticles] = useState([]);
  const [pos, setPos]             = useState({x:SW/2,y:300});
  const claimScale = useRef(new Animated.Value(1)).current;
  const entryAnim  = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    setTimeout(()=>{
      Animated.spring(entryAnim,{toValue:1,friction:6,useNativeDriver:true}).start();
    },index*50);
  },[]);

  function handleClaim(e) {
    if (!complete||claimed) return;
    const {pageX,pageY} = e.nativeEvent;
    setPos({x:pageX,y:pageY});
    setParticles(Array.from({length:12},(_,i)=>({id:i,color:quest.color||'#ffd700'})));
    setTimeout(()=>setParticles([]),1000);
    Animated.sequence([
      Animated.spring(claimScale,{toValue:0.94,friction:3,useNativeDriver:true}),
      Animated.spring(claimScale,{toValue:1,   friction:5,useNativeDriver:true}),
    ]).start();
    onClaim();
  }

  return (
    <Animated.View style={{
      opacity:entryAnim,
      transform:[{translateY:entryAnim.interpolate({inputRange:[0,1],outputRange:[16,0]})}],
    }}>
      {particles.map(p=><Particle key={p.id} color={p.color} x={pos.x} y={pos.y}/>)}
      <LinearGradient
        colors={
          claimed        ?['#39ff8f08','#07090f']:
          isWeekly       ?['#001428','#000a18']:
          isBonus        ?['#141000','#0a0800']:
          complete       ?[quest.color+'12','#07090f']:
                          ['#0d1220','#07090f']
        }
        style={[styles.questCard,{
          borderColor:claimed?'#39ff8f33':complete?color+'66':isBonus||isWeekly?color+'22':'#1e2d4a',
        }]}
      >
        {/* Header */}
        <View style={styles.questHeader}>
          <View style={[styles.questIcon,{backgroundColor:color+'22',borderColor:color+'44'}]}>
            <Text style={styles.questEmoji}>{quest.emoji}</Text>
          </View>
          <View style={styles.questMeta}>
            <View style={styles.questBadgeRow}>
              {isWeekly&&<View style={[styles.badge,{backgroundColor:'#00e5ff22',borderColor:'#00e5ff44'}]}><Text style={[styles.badgeText,{color:'#00e5ff'}]}>SEMAINE</Text></View>}
              {isBonus &&<View style={[styles.badge,{backgroundColor:'#ffd70022',borderColor:'#ffd70044'}]}><Text style={[styles.badgeText,{color:'#ffd700'}]}>BONUS ⭐</Text></View>}
            </View>
            <Text style={[styles.questLabel,claimed&&{color:'#c8daf0',opacity:0.7}]}>{quest.label}</Text>
            <View style={styles.questProgRow}>
              <Text style={[styles.questProgText,{color}]}>
                {progress} / {quest.target}
              </Text>
              {complete&&!claimed&&<Text style={[styles.questReadyText,{color}]}>✓ Prêt !</Text>}
            </View>
          </View>
          <View style={styles.questRewardCol}>
            <View style={[styles.crystalBadge,{backgroundColor:color+'22',borderColor:color+'33'}]}>
              <Text style={[styles.crystalBadgeText,{color}]}>+{quest.reward}💎</Text>
            </View>
            <Text style={[styles.xpBadgeText,{color:color+'99'}]}>+{quest.xp} XP</Text>
          </View>
        </View>

        {/* Barre progression */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill,{width:`${pct*100}%`,backgroundColor:color}]}/>
          {pct>0&&pct<1&&<View style={[styles.progressGlow,{left:`${pct*100}%`,backgroundColor:color}]}/>}
        </View>

        {/* Bouton claim */}
        {complete&&!claimed&&(
          <Animated.View style={{transform:[{scale:claimScale}]}}>
            <TouchableOpacity onPress={handleClaim}
              style={[styles.claimBtn,{borderColor:color+'55'}]}>
              <LinearGradient colors={[color+'55',color+'22']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.claimBtnGrad}>
                <Text style={[styles.claimBtnText,{color}]}>✦ Récupérer · +{quest.reward} 💎 · +{quest.xp} XP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
        {claimed&&(
          <View style={styles.claimedRow}>
            <Text style={styles.claimedCheck}>✓</Text>
            <Text style={styles.claimedText}>Récompense récupérée</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ─── QuestScreen ─────────────────────────────────────────────────
export default function QuestScreen() {
  const { collection, wins, summonCount, crystals, addCrystals } = useGameStore();
  const { showToast } = useToast();
  const authCtx = useAuth();
  const uid     = authCtx?.user?.uid||'guest';

  const [tab, setTab]           = useState('daily');
  const [claimed, setClaimed]   = useState({});
  const [totalEarned, setTotalEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());
  const [weekLeft, setWeekLeft] = useState(getTimeUntilReset(true));
  const [loaded, setLoaded]     = useState(false);
  const [savedProgress, setSavedProgress] = useState({});

  const todayKey = getTodayKey();
  const { daily, bonus } = getDailyQuests();
  const allDailyQuests = [...daily, bonus];
  const gameData = {wins,summonCount,collection,crystals};

  const completeAnim = useRef(new Animated.Value(0)).current;
  const titleAnim    = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  useEffect(()=>{
    const interval = setInterval(()=>{
      setTimeLeft(getTimeUntilReset());
      setWeekLeft(getTimeUntilReset(true));
    },1000);
    return ()=>clearInterval(interval);
  },[]);

  useEffect(()=>{
    onValue(ref(db,`quests/${uid}/${todayKey}`),snap=>{
      if (snap.exists()) {
        const d = snap.val();
        if (d.date===todayKey) {
          setClaimed(d.claimed||{});
          setTotalEarned(d.totalEarned||0);
          setSavedProgress(d.progress||{});
        }
      }
      setLoaded(true);
    },{onlyOnce:true});
  },[uid,todayKey]);

  async function saveFirebase(newClaimed,newEarned,newProg) {
    await set(ref(db,`quests/${uid}/${todayKey}`),{date:todayKey,claimed:newClaimed,totalEarned:newEarned,progress:newProg}).catch(()=>{});
  }

  async function claimReward(quest) {
    const prog = calcProgress(quest,gameData,savedProgress[quest.id]);
    if (prog<quest.target||claimed[quest.id]) return;
    const newClaimed  = {...claimed,[quest.id]:true};
    const newEarned   = totalEarned+quest.reward;
    const newProg     = {...savedProgress};
    [...allDailyQuests,...WEEKLY_QUESTS].forEach(q=>{
      newProg[q.id] = calcProgress(q,gameData,savedProgress[q.id]);
    });
    setClaimed(newClaimed); setTotalEarned(newEarned); setSavedProgress(newProg);
    addCrystals(quest.reward);
    const uid2 = auth.currentUser?.uid;
    if (uid2) addXp(uid2,quest.xp,null,null,null);
    await saveFirebase(newClaimed,newEarned,newProg);
    showToast({type:'quest',title:'Quête complétée !',message:quest.label,crystals:quest.reward,xp:quest.xp,duration:3500});
    // All done ?
    const allDone = allDailyQuests.every(q=>calcProgress(q,gameData,newProg[q.id])>=q.target&&newClaimed[q.id]);
    if (allDone) Animated.spring(completeAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
  }

  const dailyDone   = allDailyQuests.filter(q=>calcProgress(q,gameData,savedProgress[q.id])>=q.target).length;
  const weeklyDone  = WEEKLY_QUESTS.filter(q=>calcProgress(q,gameData,savedProgress[q.id])>=q.target).length;
  const dailyTotal  = allDailyQuests.length;
  const weeklyTotal = WEEKLY_QUESTS.length;
  const allDailyDone= dailyDone===dailyTotal&&allDailyQuests.every(q=>claimed[q.id]);
  const dailyPct    = (dailyDone/dailyTotal)*100;
  const weeklyPct   = (weeklyDone/weeklyTotal)*100;

  if (!loaded) return (
    <LinearGradient colors={['#07090f','#0d1220']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>QUÊTES</Text>
        <Text style={styles.loading}>Chargement...</Text>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* Titre */}
        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>QUÊTES</Animated.Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            {id:'daily',  label:'📅 Quotidiennes', done:dailyDone,  total:dailyTotal,  color:'#00e5ff'},
            {id:'weekly', label:'📆 Hebdomadaires',done:weeklyDone, total:weeklyTotal, color:'#ffd700'},
          ].map(t=>(
            <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)}
              style={[styles.tabBtn,tab===t.id&&{borderColor:t.color+'44',backgroundColor:t.color+'10'}]}>
              <Text style={[styles.tabText,tab===t.id&&{color:t.color}]}>{t.label}</Text>
              <View style={[styles.tabBadge,{backgroundColor:tab===t.id?t.color+'33':'#1e2d4a'}]}>
                <Text style={[styles.tabBadgeText,{color:tab===t.id?t.color:'#4a6080'}]}>{t.done}/{t.total}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats + timer */}
        <View style={styles.headerCards}>
          <View style={styles.headerCard}>
            <Text style={styles.headerCardLabel}>⏱ RESET</Text>
            <Text style={styles.headerCardVal}>{tab==='daily'?timeLeft:weekLeft}</Text>
          </View>
          <View style={[styles.headerCard,{borderColor:'#ffd70033'}]}>
            <Text style={styles.headerCardLabel}>💎 AUJOURD'HUI</Text>
            <Text style={[styles.headerCardVal,{color:'#ffd700'}]}>{totalEarned}</Text>
          </View>
          <View style={[styles.headerCard,{borderColor:'#39ff8f33'}]}>
            <Text style={styles.headerCardLabel}>✓ FAITES</Text>
            <Text style={[styles.headerCardVal,{color:'#39ff8f'}]}>
              {tab==='daily'?`${dailyDone}/${dailyTotal}`:`${weeklyDone}/${weeklyTotal}`}
            </Text>
          </View>
        </View>

        {/* Barre globale */}
        <View style={styles.globalBarWrap}>
          <View style={styles.globalBarBg}>
            <View style={[styles.globalBarFill,{
              width:`${tab==='daily'?dailyPct:weeklyPct}%`,
              backgroundColor:tab==='daily'?'#00e5ff':'#ffd700',
            }]}/>
          </View>
          <Text style={[styles.globalBarPct,{color:tab==='daily'?'#00e5ff':'#ffd700'}]}>
            {Math.round(tab==='daily'?dailyPct:weeklyPct)}%
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── QUOTIDIENNES ── */}
          {tab==='daily'&&<>
            <Text style={styles.sectionLabel}>📅 QUÊTES DU JOUR</Text>
            {daily.map((q,i)=>(
              <QuestCard key={q.id} quest={q} index={i}
                progress={calcProgress(q,gameData,savedProgress[q.id])}
                claimed={!!claimed[q.id]}
                onClaim={()=>claimReward(q)}
                isBonus={false} isWeekly={false}
              />
            ))}

            <Text style={[styles.sectionLabel,{color:'#ffd700',marginTop:4}]}>⭐ QUÊTE BONUS DU JOUR</Text>
            <QuestCard quest={bonus} index={daily.length}
              progress={calcProgress(bonus,gameData,savedProgress[bonus.id])}
              claimed={!!claimed[bonus.id]}
              onClaim={()=>claimReward(bonus)}
              isBonus={true} isWeekly={false}
            />

            {allDailyDone&&(
              <Animated.View style={{
                transform:[{scale:completeAnim.interpolate({inputRange:[0,1],outputRange:[0.9,1]})}],
                opacity:completeAnim.interpolate({inputRange:[0,0.1,1],outputRange:[0,1,1]}),
              }}>
                <LinearGradient colors={['#39ff8f22','#39ff8f08']} style={styles.allDoneBox}>
                  <Text style={styles.allDoneEmoji}>🎉</Text>
                  <Text style={styles.allDoneTitle}>TOUTES COMPLÉTÉES !</Text>
                  <Text style={styles.allDoneSub}>
                    +{totalEarned} 💎 gagnés aujourd'hui. Reviens demain !
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}
          </>}

          {/* ── HEBDOMADAIRES ── */}
          {tab==='weekly'&&<>
            <View style={styles.weeklyInfo}>
              <Text style={styles.weeklyInfoEmoji}>📆</Text>
              <Text style={styles.weeklyInfoText}>
                Ces quêtes se réinitialisent chaque lundi. Les récompenses sont bien plus importantes !
              </Text>
            </View>
            {WEEKLY_QUESTS.map((q,i)=>(
              <QuestCard key={q.id} quest={q} index={i}
                progress={calcProgress(q,gameData,savedProgress[q.id])}
                claimed={!!claimed[q.id]}
                onClaim={()=>claimReward(q)}
                isBonus={false} isWeekly={true}
              />
            ))}
          </>}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:16,marginBottom:10},
  loading:{color:'#4a6080',textAlign:'center',marginTop:40,fontSize:14},
  // Tabs
  tabRow:{flexDirection:'row',gap:8,marginBottom:10},
  tabBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:10,borderRadius:14,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  tabText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  tabBadge:{borderRadius:8,paddingHorizontal:7,paddingVertical:3},
  tabBadgeText:{fontSize:9,fontWeight:'900'},
  // Header cards
  headerCards:{flexDirection:'row',gap:8,marginBottom:8},
  headerCard:{flex:1,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,padding:8,alignItems:'center',gap:2},
  headerCardLabel:{fontSize:7,color:'#4a6080',letterSpacing:1,textTransform:'uppercase'},
  headerCardVal:{fontSize:14,fontWeight:'900',color:'#00e5ff'},
  // Global bar
  globalBarWrap:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},
  globalBarBg:{flex:1,height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  globalBarFill:{height:'100%',borderRadius:4},
  globalBarPct:{fontSize:11,fontWeight:'700',width:36,textAlign:'right'},
  sectionLabel:{fontSize:9,color:'#00e5ff',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  // Scroll
  scroll:{gap:10,paddingBottom:32},
  // Quest card
  questCard:{borderWidth:1,borderRadius:18,padding:14,gap:10},
  questHeader:{flexDirection:'row',alignItems:'flex-start',gap:10},
  questIcon:{width:46,height:46,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},
  questEmoji:{fontSize:22},
  questMeta:{flex:1,gap:4},
  questBadgeRow:{flexDirection:'row',gap:5},
  badge:{borderWidth:1,borderRadius:6,paddingHorizontal:6,paddingVertical:2},
  badgeText:{fontSize:7,fontWeight:'900',letterSpacing:1},
  questLabel:{color:'#6a84a0',fontSize:13,lineHeight:18},
  questProgRow:{flexDirection:'row',alignItems:'center',gap:8},
  questProgText:{fontSize:11,fontWeight:'700'},
  questReadyText:{fontSize:10,fontWeight:'800',letterSpacing:1},
  questRewardCol:{alignItems:'flex-end',gap:4},
  crystalBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:4},
  crystalBadgeText:{fontSize:12,fontWeight:'900'},
  xpBadgeText:{fontSize:9,fontWeight:'700'},
  // Progress bar
  progressBarBg:{height:6,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden',position:'relative'},
  progressBarFill:{height:'100%',borderRadius:4},
  progressGlow:{position:'absolute',top:0,width:8,height:'100%',borderRadius:4,opacity:0.8},
  // Claim
  claimBtn:{borderWidth:1,borderRadius:14,overflow:'hidden'},
  claimBtnGrad:{alignItems:'center',paddingVertical:13},
  claimBtnText:{fontSize:12,fontWeight:'900',letterSpacing:1},
  claimedRow:{flexDirection:'row',alignItems:'center',gap:8,paddingTop:2},
  claimedCheck:{color:'#39ff8f',fontSize:16,fontWeight:'900'},
  claimedText:{color:'#39ff8f',fontSize:12,fontWeight:'700'},
  // All done
  allDoneBox:{borderWidth:1,borderColor:'#39ff8f44',borderRadius:18,padding:20,alignItems:'center',gap:8},
  allDoneEmoji:{fontSize:48},
  allDoneTitle:{color:'#39ff8f',fontSize:14,fontWeight:'900',letterSpacing:2},
  allDoneSub:{color:'#4a6080',fontSize:12,textAlign:'center',lineHeight:18},
  // Weekly info
  weeklyInfo:{flexDirection:'row',alignItems:'flex-start',gap:10,backgroundColor:'#00e5ff08',borderWidth:1,borderColor:'#00e5ff22',borderRadius:14,padding:12,marginBottom:4},
  weeklyInfoEmoji:{fontSize:20},
  weeklyInfoText:{flex:1,color:'#4a6080',fontSize:12,lineHeight:18},
});
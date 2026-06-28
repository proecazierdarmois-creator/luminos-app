// screens/LeaderboardScreen.js — Top 100 amélioré V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  SafeAreaView, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, onValue } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { getPlayerId } from '../store/marketService';
import { CREATURES } from '../data/creatures';

const { width: SW } = Dimensions.get('window');

const RARITY_PTS = {common:10,uncommon:30,rare:100,legendary:300};

function computeScore({collection,wins,crystals}) {
  const safeWins     = Math.min(Number(wins)||0, 99999);
  const safeCrystals = Math.min(Number(crystals)||0, 99999);
  const safeColl     = Array.isArray(collection) ? collection : [];

  const cs = safeColl.reduce((acc,c)=>{
    // Gère les IDs shiny (ex: lumikos_shiny → lumikos)
    const baseId = c.id?.replace('_shiny','');
    const cr = CREATURES[baseId] || CREATURES[c.id];
    if (!cr) return acc;
    // Shiny = 500pts bonus sur la rareté de base
    return acc + (c.isShiny ? 500 + (RARITY_PTS[cr.rarity]||10) : RARITY_PTS[cr.rarity]||10);
  },0);

  const legends = new Set(
    safeColl
      .filter(c=>{ const baseId=c.id?.replace('_shiny',''); return (CREATURES[baseId]||CREATURES[c.id])?.rarity==='legendary'; })
      .map(c=>c.id?.replace('_shiny',''))
  ).size;

  const shinys = safeColl.filter(c=>c.isShiny).length;

  const total = cs + safeWins*10 + Math.floor(safeCrystals*0.5) + legends*200 + shinys*100;
  return Math.min(total, 9999999);
}

function getMedal(rank) {
  if (rank===1) return '🥇';
  if (rank===2) return '🥈';
  if (rank===3) return '🥉';
  if (rank<=10) return '⭐';
  if (rank<=50) return '✦';
  return '○';
}

function getRankColor(rank) {
  if (rank===1) return '#ffd700';
  if (rank===2) return '#c0c0c0';
  if (rank===3) return '#cd7f32';
  if (rank<=10) return '#00e5ff';
  if (rank<=50) return '#bf5fff';
  return '#4a6080';
}

function getRankTitle(rank) {
  if (rank===1)  return '👑 CHAMPION';
  if (rank<=3)   return '🏆 Podium';
  if (rank<=10)  return '⭐ Élite';
  if (rank<=25)  return '◆ Expert';
  if (rank<=50)  return '● Chasseur';
  return '○ Novice';
}

// ─── Podium ───────────────────────────────────────────────────────
function Podium({entries}) {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.stagger(150, anims.map(a=>
      Animated.spring(a,{toValue:1,friction:4,tension:50,useNativeDriver:true})
    )).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,{toValue:1,duration:1200,useNativeDriver:true}),
        Animated.timing(glowAnim,{toValue:0,duration:1200,useNativeDriver:true}),
      ])
    ).start();
  },[]);

  // order: 2nd (left), 1st (center), 3rd (right)
  const order  = [1,0,2];
  const heights= [90,120,70];
  const colors = ['#c0c0c0','#ffd700','#cd7f32'];

  return (
    <View style={styles.podiumWrap}>
      {/* Titre podium */}
      <Text style={styles.podiumTitle}>🏆 PODIUM</Text>
      <View style={styles.podiumRow}>
        {order.map((idx,pos)=>{
          const entry = entries[idx];
          if (!entry) return null;
          const rank  = idx+1;
          const color = colors[idx];
          const h     = heights[pos];
          const isFirst = rank===1;

          return (
            <Animated.View key={idx} style={[styles.podiumSlot,{
              transform:[
                {scale:anims[idx]},
                {translateY:anims[idx].interpolate({inputRange:[0,1],outputRange:[30,0]})}
              ],
              opacity:anims[idx],
            }]}>
              {/* Couronne pour le 1er */}
              {isFirst&&(
                <Animated.Text style={[styles.crown,{
                  opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]}),
                  transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.95,1.05]})}],
                }]}>👑</Animated.Text>
              )}

              {/* Nom */}
              <Text style={[styles.podiumName,{color,fontSize:isFirst?11:9}]} numberOfLines={1}>{entry.name}</Text>
              <Text style={[styles.podiumScore,{color:color+'88'}]}>{(entry.score||0).toLocaleString()}</Text>
              <Text style={styles.podiumMedal}>{getMedal(rank)}</Text>

              {/* Bloc */}
              <LinearGradient colors={[color+'55',color+'22']}
                style={[styles.podiumBlock,{height:h,borderColor:color+'88'}]}>
                <Animated.View style={[StyleSheet.absoluteFill,{
                  backgroundColor:color,
                  opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0,isFirst?0.10:0.04]}),
                  borderRadius:12,
                }]}/>
                <Text style={[styles.podiumRankNum,{color,fontSize:isFirst?18:14}]}>#{rank}</Text>
                {entry.wins>0&&<Text style={styles.podiumWins}>⚔️ {entry.wins}V</Text>}
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// ─── EntryRow ─────────────────────────────────────────────────────
function EntryRow({item,index,playerId,animVal}) {
  const rank   = index+1;
  const isMe   = item.id===playerId;
  const isTop3 = rank<=3;
  const color  = getRankColor(rank);

  return (
    <Animated.View style={{opacity:animVal}}>
      <LinearGradient
        colors={isMe?['#00e5ff18','#00e5ff08']:isTop3?[color+'18',color+'06']:['#0d1220','#07090f']}
        style={[styles.entry,{borderColor:isMe?'#00e5ff55':isTop3?color+'44':'#1e2d4a'}]}
      >
        {/* Rang */}
        <View style={styles.rankCol}>
          <Text style={styles.entryMedal}>{getMedal(rank)}</Text>
          <Text style={[styles.rankNum,{color}]}>#{rank}</Text>
        </View>

        {/* Infos */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.entryName,isMe&&{color:'#00e5ff'}]} numberOfLines={1}>{item.name}</Text>
            {isMe&&<View style={styles.youBadge}><Text style={styles.youText}>MOI</Text></View>}
          </View>
          <View style={styles.entryStats}>
            <Text style={styles.entryStat}>📖 {item.creatures||0}</Text>
            <Text style={styles.entryStat}>⚔️ {item.wins||0}</Text>
            {(item.shinys||0)>0&&<Text style={styles.entryStat}>✨ {item.shinys}</Text>}
            {(item.legendaries||0)>0&&<Text style={styles.entryStat}>★ {item.legendaries}</Text>}
          </View>
          {isTop3&&<Text style={[styles.rankTitleText,{color}]}>{getRankTitle(rank)}</Text>}
        </View>

        {/* Score */}
        <View style={styles.scoreCol}>
          <Text style={[styles.entryScore,{color:isTop3?color:isMe?'#00e5ff':'#c8daf0'}]}>
            {(item.score||0).toLocaleString()}
          </Text>
          <Text style={styles.scorePts}>pts</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── LeaderboardScreen ────────────────────────────────────────────
export default function LeaderboardScreen() {
  const {collection,wins,crystals} = useGameStore();
  const authCtx    = useAuth();
  const user       = authCtx?.user;
  const playerId   = user?.uid || null;
  const playerName = user?.displayName||user?.email?.split('@')[0]||'Joueur';

  const [entries, setEntries]   = useState([]);
  const [myRank, setMyRank]     = useState(null);
  const [myScore, setMyScore]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('score');
  const [showPodium, setShowPodium] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnims  = useRef(Array.from({length:100},()=>new Animated.Value(0))).current;

  useEffect(()=>{
    Animated.timing(headerAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  function animateList(count) {
    const anims = listAnims.slice(0,Math.min(count,20));
    Animated.stagger(30, anims.map(a=>{
      a.setValue(0);
      return Animated.timing(a,{toValue:1,duration:300,useNativeDriver:true});
    })).start();
  }

  useEffect(()=>{
    const score = computeScore({collection,wins,crystals});
    setMyScore(score);
    // Ne publie QUE si l'utilisateur est authentifié avec un vrai uid Firebase
    if (!user?.uid) return;
    const shinys = collection.filter(c=>c.isShiny).length;
    const legends = new Set(
      collection
        .filter(c=>{ const baseId=c.id?.replace('_shiny',''); return (CREATURES[baseId]||CREATURES[c.id])?.rarity==='legendary'; })
        .map(c=>c.id?.replace('_shiny',''))
    ).size;
    set(ref(db,`leaderboard/${user.uid}`),{
      name:playerName,score,wins,
      creatures:collection.length,
      legendaries:legends,shinys,
      updatedAt:Date.now(),
    }).catch(()=>{});
  },[collection,wins,crystals,user?.uid]);

  useEffect(()=>{
    const unsub = onValue(ref(db,'leaderboard'),snap=>{
      if (!snap.exists()){setLoading(false);return;}
      const raw = Object.entries(snap.val()).map(([id,v])=>({id,...v}));
      const sorted = sortEntries(raw,filter);
      const top = sorted.slice(0,100);
      setEntries(top);
      const rank = sorted.findIndex(e=>e.id===playerId)+1;
      setMyRank(rank>0?rank:null);
      setLoading(false);
      animateList(top.length);
    });
    return unsub;
  },[filter]);

  function sortEntries(data,f) {
    return [...data].sort((a,b)=>{
      switch(f) {
        case 'wins':      return (b.wins||0)-(a.wins||0);
        case 'creatures': return (b.creatures||0)-(a.creatures||0);
        case 'shinys':    return (b.shinys||0)-(a.shinys||0);
        default:          return (b.score||0)-(a.score||0);
      }
    });
  }

  function handleFilter(f) {
    setFilter(f);
    const sorted = sortEntries(entries,f);
    setEntries(sorted);
    const rank = sorted.findIndex(e=>e.id===playerId)+1;
    setMyRank(rank>0?rank:null);
    animateList(sorted.length);
  }

  const creatureScore = collection.reduce((acc,c)=>{
    const baseId=c.id?.replace('_shiny','');
    const cr=CREATURES[baseId]||CREATURES[c.id]; if(!cr) return acc;
    return acc+(c.isShiny?500+(RARITY_PTS[cr.rarity]||10):RARITY_PTS[cr.rarity]||10);
  },0);
  const legends = new Set(
    collection
      .filter(c=>{ const b=c.id?.replace('_shiny',''); return (CREATURES[b]||CREATURES[c.id])?.rarity==='legendary'; })
      .map(c=>c.id?.replace('_shiny',''))
  ).size;
  const myRankColor = myRank?getRankColor(myRank):'#4a6080';

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <Animated.View style={{
          opacity:headerAnim,
          transform:[{translateY:headerAnim.interpolate({inputRange:[0,1],outputRange:[-20,0]})}],
        }}>
          <Text style={styles.title}>🏆 TOP 100</Text>
          <Text style={styles.subtitle}>Classement mondial · Temps réel</Text>
        </Animated.View>

        {/* Mon rang */}
        <LinearGradient
          colors={myRank&&myRank<=3?[myRankColor+'22',myRankColor+'08']:myRank&&myRank<=10?['#00e5ff12','#00e5ff05']:['#0d1220','#07090f']}
          style={[styles.myRankBox,{borderColor:myRank?myRankColor+'44':'#1e2d4a'}]}
        >
          <View style={styles.myRankLeft}>
            <Text style={styles.myRankLabel}>RANG</Text>
            <Text style={[styles.myRankNum,{color:myRankColor}]}>{myRank?`#${myRank}`:'—'}</Text>
            {myRank&&<Text style={[styles.myRankTitle,{color:myRankColor}]}>{getRankTitle(myRank)}</Text>}
          </View>
          <View style={styles.myRankMid}>
            <Text style={styles.myRankName}>{playerName}</Text>
            <Text style={styles.myRankSub}>{collection.length} créatures · {wins} victoires</Text>
            <View style={styles.myBreakdown}>
              <Text style={styles.breakdownItem}>📖 {creatureScore}</Text>
              <Text style={styles.breakdownItem}>⚔️ {wins*10}</Text>
              {legends>0&&<Text style={styles.breakdownItem}>★ {legends*200}</Text>}
            </View>
          </View>
          <View style={styles.myRankRight}>
            <Text style={[styles.myScoreVal,{color:myRankColor}]}>{myScore.toLocaleString()}</Text>
            <Text style={styles.myScoreLbl}>points</Text>
          </View>
        </LinearGradient>

        {/* Filtres */}
        <View style={styles.filterRow}>
          {[
            {key:'score',    label:'🏆 Score',  color:'#ffd700'},
            {key:'wins',     label:'⚔️ Wins',   color:'#39ff8f'},
            {key:'creatures',label:'📖 Collec', color:'#00e5ff'},
            {key:'shinys',   label:'✨ Shiny',  color:'#ff69b4'},
          ].map(f=>(
            <TouchableOpacity key={f.key} onPress={()=>handleFilter(f.key)}
              style={[styles.filterBtn,filter===f.key&&{borderColor:f.color+'44',backgroundColor:f.color+'12'}]}>
              <Text style={[styles.filterText,filter===f.key&&{color:f.color}]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading?(
          <ActivityIndicator color="#00e5ff" style={{marginTop:40}}/>
        ):entries.length===0?(
          <View style={styles.empty}>
            <Text style={{fontSize:48}}>🏆</Text>
            <Text style={styles.emptyText}>Aucun joueur classé</Text>
            <Text style={styles.emptySub}>Joue pour apparaître dans le top !</Text>
          </View>
        ):(
          <FlatList
            data={entries}
            keyExtractor={item=>item.id}
            renderItem={({item,index})=>(
              <EntryRow item={item} index={index} playerId={playerId}
                animVal={listAnims[Math.min(index,19)]}/>
            )}
            ListHeaderComponent={
              showPodium&&filter==='score'&&entries.length>=3
                ?<>
                  <Podium entries={entries.slice(0,3)}/>
                  <TouchableOpacity onPress={()=>setShowPodium(false)} style={styles.podiumToggle}>
                    <Text style={styles.podiumToggleText}>▲ Masquer le podium</Text>
                  </TouchableOpacity>
                  <Text style={styles.listLabel}>CLASSEMENT COMPLET</Text>
                </>
                :filter==='score'&&entries.length>=3
                  ?<TouchableOpacity onPress={()=>setShowPodium(true)} style={styles.podiumToggle}>
                    <Text style={styles.podiumToggleText}>▼ Voir le podium</Text>
                  </TouchableOpacity>
                  :null
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            getItemLayout={(_,i)=>({length:68,offset:68*i,index:i})}
          />
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:16},
  subtitle:{fontSize:10,color:'#4a6080',letterSpacing:2,textAlign:'center',marginBottom:10},
  // Mon rang
  myRankBox:{flexDirection:'row',alignItems:'center',borderWidth:1.5,borderRadius:18,padding:14,marginBottom:10,gap:10},
  myRankLeft:{alignItems:'center',width:56,gap:2},
  myRankLabel:{fontSize:7,color:'#4a6080',letterSpacing:2,textTransform:'uppercase'},
  myRankNum:{fontSize:24,fontWeight:'900'},
  myRankTitle:{fontSize:7,fontWeight:'800',letterSpacing:1,textAlign:'center'},
  myRankMid:{flex:1,gap:3,minWidth:0},
  myRankName:{fontSize:14,fontWeight:'900',color:'#fff',flexShrink:1},
  myRankSub:{fontSize:10,color:'#4a6080'},
  myBreakdown:{flexDirection:'row',gap:8,marginTop:2},
  breakdownItem:{fontSize:9,color:'#4a6080'},
  myRankRight:{alignItems:'flex-end',gap:2},
  myScoreVal:{fontSize:18,fontWeight:'900',flexShrink:1},
  myScoreLbl:{fontSize:8,color:'#4a6080'},
  // Filtres
  filterRow:{flexDirection:'row',gap:6,marginBottom:8},
  filterBtn:{flex:1,alignItems:'center',paddingVertical:8,borderRadius:10,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  filterActive:{borderColor:'#ffd70044',backgroundColor:'#ffd70012'},
  filterText:{color:'#4a6080',fontSize:9,fontWeight:'700'},
  filterTextActive:{color:'#ffd700'},
  // Podium
  podiumWrap:{marginBottom:8,gap:8},
  podiumTitle:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700',textAlign:'center'},
  podiumRow:{flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:6,paddingVertical:8,paddingHorizontal:4},
  podiumSlot:{flex:1,alignItems:'center',gap:3},
  crown:{fontSize:22,textAlign:'center'},
  podiumName:{fontWeight:'900',letterSpacing:0.5,textAlign:'center',width:'100%'},
  podiumScore:{fontSize:8,color:'#4a6080',textAlign:'center'},
  podiumMedal:{fontSize:26},
  podiumBlock:{width:'100%',borderWidth:1.5,borderRadius:12,alignItems:'center',justifyContent:'flex-end',paddingBottom:8,overflow:'hidden'},
  podiumRankNum:{fontSize:14,fontWeight:'900'},
  podiumWins:{fontSize:8,color:'rgba(255,255,255,0.4)'},
  podiumToggle:{alignItems:'center',paddingVertical:6},
  podiumToggleText:{color:'#4a6080',fontSize:11},
  listLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700',marginBottom:6,marginTop:4},
  // Liste
  list:{gap:5,paddingBottom:24},
  entry:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:14,paddingHorizontal:12,paddingVertical:12,gap:10,minHeight:68},
  rankCol:{alignItems:'center',width:36,gap:1},
  entryMedal:{fontSize:16},
  rankNum:{fontSize:9,fontWeight:'800',letterSpacing:1},
  infoCol:{flex:1,gap:3},
  nameRow:{flexDirection:'row',alignItems:'center',gap:6},
  entryName:{fontSize:13,fontWeight:'900',color:'#c8daf0',flex:1,flexShrink:1},
  youBadge:{backgroundColor:'#00e5ff22',borderWidth:1,borderColor:'#00e5ff44',borderRadius:6,paddingHorizontal:5,paddingVertical:1},
  youText:{color:'#00e5ff',fontSize:7,fontWeight:'900',letterSpacing:1},
  entryStats:{flexDirection:'row',gap:8},
  entryStat:{fontSize:9,color:'#4a6080'},
  rankTitleText:{fontSize:8,fontWeight:'700',letterSpacing:1},
  scoreCol:{alignItems:'flex-end',gap:1,minWidth:60},
  entryScore:{fontSize:13,fontWeight:'900',flexShrink:1},
  scorePts:{fontSize:7,color:'#4a6080',letterSpacing:1},
  // Empty
  empty:{flex:1,alignItems:'center',justifyContent:'center',gap:10},
  emptyText:{color:'#4a6080',fontSize:14},
  emptySub:{color:'#4a6080',fontSize:12,fontStyle:'italic'},
});
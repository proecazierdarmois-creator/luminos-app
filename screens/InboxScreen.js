// screens/InboxScreen.js — Boîte de réception
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, onValue, set, remove, push, get } from 'firebase/database';
import { useAuth } from '../store/AuthContext';
import { useGameStore } from '../store/useGameStore';
import { addXp } from '../store/xpService';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');

// ─── Types de messages ────────────────────────────────────────────
const MSG_TYPES = {
  tournament: { color:'#ffd700', emoji:'🏆', label:'Tournoi' },
  quest:      { color:'#00e5ff', emoji:'📋', label:'Quête'   },
  guild:      { color:'#ff6b35', emoji:'⚔️', label:'Guilde'  },
  system:     { color:'#bf5fff', emoji:'✦',  label:'Système' },
  admin:      { color:'#ff4fa3', emoji:'👑', label:'Admin'   },
};

// ─── MessageCard ─────────────────────────────────────────────────
function MessageCard({ msg, onClaim, onDelete, index }) {
  const entryAnim = useRef(new Animated.Value(0)).current;
  const type = MSG_TYPES[msg.type] || MSG_TYPES.system;

  useEffect(()=>{
    setTimeout(()=>{
      Animated.spring(entryAnim,{toValue:1,friction:6,useNativeDriver:true}).start();
    },index*60);
  },[]);

  const isExpired = msg.expiresAt && Date.now() > msg.expiresAt;

  return (
    <Animated.View style={{
      opacity:entryAnim,
      transform:[{translateY:entryAnim.interpolate({inputRange:[0,1],outputRange:[20,0]})}],
    }}>
      <LinearGradient
        colors={msg.claimed||isExpired?['#0d1220','#07090f']:[type.color+'15','#07090f']}
        style={[styles.msgCard,{
          borderColor:msg.claimed||isExpired?'#1e2d4a':type.color+'44',
          opacity:msg.claimed||isExpired?0.6:1,
        }]}>
        {/* Header */}
        <View style={styles.msgHeader}>
          <View style={[styles.msgTypeBadge,{backgroundColor:type.color+'22',borderColor:type.color+'44'}]}>
            <Text style={styles.msgTypeEmoji}>{type.emoji}</Text>
            <Text style={[styles.msgTypeLabel,{color:type.color}]}>{type.label}</Text>
          </View>
          <Text style={styles.msgDate}>{new Date(msg.createdAt||0).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</Text>
          {isExpired&&<View style={styles.expiredBadge}><Text style={styles.expiredText}>Expiré</Text></View>}
        </View>

        {/* Titre + desc */}
        <Text style={[styles.msgTitle,{color:msg.claimed||isExpired?'#4a6080':type.color}]}>{msg.title}</Text>
        {msg.description&&<Text style={styles.msgDesc}>{msg.description}</Text>}

        {/* Récompenses */}
        {(msg.crystals||msg.xp||msg.creature)&&(
          <View style={styles.msgRewards}>
            {msg.crystals>0&&(
              <View style={[styles.rewardChip,{backgroundColor:'#ffd70015',borderColor:'#ffd70033'}]}>
                <Text style={styles.rewardChipText}>+{msg.crystals} 💎</Text>
              </View>
            )}
            {msg.xp>0&&(
              <View style={[styles.rewardChip,{backgroundColor:'#00e5ff15',borderColor:'#00e5ff33'}]}>
                <Text style={[styles.rewardChipText,{color:'#00e5ff'}]}>+{msg.xp} XP</Text>
              </View>
            )}
            {msg.creature&&(
              <View style={[styles.rewardChip,{backgroundColor:'#bf5fff15',borderColor:'#bf5fff33'}]}>
                <Text style={[styles.rewardChipText,{color:'#bf5fff'}]}>✦ {msg.creature}</Text>
              </View>
            )}
          </View>
        )}

        {/* Boutons */}
        <View style={styles.msgBtns}>
          {!msg.claimed&&!isExpired&&(msg.crystals||msg.xp||msg.creature)&&(
            <TouchableOpacity onPress={()=>onClaim(msg)}
              style={[styles.claimBtn,{borderColor:type.color+'55',backgroundColor:type.color+'22'}]}>
              <Text style={[styles.claimBtnText,{color:type.color}]}>🎁 Récupérer</Text>
            </TouchableOpacity>
          )}
          {msg.claimed&&(
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedText}>✓ Récupéré</Text>
            </View>
          )}
          {!msg.crystals&&!msg.xp&&!msg.creature&&!msg.claimed&&(
            <View style={styles.readBadge}>
              <Text style={styles.readText}>📖 Lu</Text>
            </View>
          )}
          <TouchableOpacity onPress={()=>onDelete(msg.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── InboxScreen ─────────────────────────────────────────────────
export default function InboxScreen() {
  const authCtx = useAuth();
  const user    = authCtx?.user;
  const uid     = user?.uid||'guest';
  const { addCrystals, addToCollection } = useGameStore();

  const [messages, setMessages] = useState([]);
  const [filter, setFilter]     = useState('tous');
  const [feedback, setFeedback] = useState('');
  const titleAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
    const unsub = onValue(ref(db,`inbox/${uid}`),snap=>{
      if (snap.exists()) {
        const msgs = Object.entries(snap.val())
          .map(([id,v])=>({id,...v}))
          .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
        setMessages(msgs);
      } else setMessages([]);
    });
    return unsub;
  },[uid]);

  function showFeedback(msg) {
    setFeedback(msg);
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim,{toValue:1,duration:200,useNativeDriver:true}),
      Animated.delay(2000),
      Animated.timing(feedbackAnim,{toValue:0,duration:300,useNativeDriver:true}),
    ]).start(()=>setFeedback(''));
  }

  async function handleClaim(msg) {
    if (msg.claimed) return;
    // Donner les récompenses
    if (msg.crystals) addCrystals(msg.crystals);
    const uid2 = auth.currentUser?.uid;
    if (uid2 && msg.xp) addXp(uid2,msg.xp,null,null,null).catch(()=>{});
    // Marquer comme réclamé
    await set(ref(db,`inbox/${uid}/${msg.id}/claimed`),true).catch(()=>{});
    showFeedback(`✓ Récompenses récupérées !`);
  }

  async function handleDelete(id) {
    await remove(ref(db,`inbox/${uid}/${id}`)).catch(()=>{});
  }

  async function handleClaimAll() {
    const unclaimed = messages.filter(m=>!m.claimed&&!isExpired(m)&&(m.crystals||m.xp));
    if (!unclaimed.length) return;
    let totalCrystals=0, totalXp=0;
    for (const msg of unclaimed) {
      if (msg.crystals) totalCrystals+=msg.crystals;
      if (msg.xp) totalXp+=msg.xp;
      await set(ref(db,`inbox/${uid}/${msg.id}/claimed`),true).catch(()=>{});
    }
    if (totalCrystals) addCrystals(totalCrystals);
    const uid2=auth.currentUser?.uid;
    if (uid2&&totalXp) addXp(uid2,totalXp,null,null,null).catch(()=>{});
    showFeedback(`✓ +${totalCrystals}💎 · +${totalXp}XP récupérés !`);
  }

  function isExpired(msg) { return msg.expiresAt && Date.now() > msg.expiresAt; }

  const filtered = filter==='tous' ? messages
    : filter==='non_recus' ? messages.filter(m=>!m.claimed&&!isExpired(m))
    : messages.filter(m=>m.type===filter);

  const unclaimedCount = messages.filter(m=>!m.claimed&&!isExpired(m)&&(m.crystals||m.xp)).length;
  const totalCount = messages.length;

  const filters = [
    {id:'tous',       label:'Tout',      color:'#c8daf0'},
    {id:'non_recus',  label:'À récupérer',color:'#ffd700'},
    {id:'tournament', label:'Tournoi',   color:'#ffd700'},
    {id:'quest',      label:'Quêtes',    color:'#00e5ff'},
    {id:'guild',      label:'Guilde',    color:'#ff6b35'},
  ];

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>📬 BOÎTE DE RÉCEPTION</Animated.Text>

        {/* Feedback */}
        {feedback!==''&&(
          <Animated.View style={[styles.feedbackBox,{opacity:feedbackAnim}]}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </Animated.View>
        )}

        {/* Header stats */}
        <View style={styles.statsRow}>
          <LinearGradient colors={['#1a1000','#07090f']} style={[styles.statCard,{borderColor:'#ffd70033'}]}>
            <Text style={[styles.statVal,{color:'#ffd700'}]}>{unclaimedCount}</Text>
            <Text style={styles.statLbl}>À récupérer</Text>
          </LinearGradient>
          <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.statCard,{borderColor:'#00e5ff33'}]}>
            <Text style={[styles.statVal,{color:'#00e5ff'}]}>{totalCount}</Text>
            <Text style={styles.statLbl}>Messages</Text>
          </LinearGradient>
          {unclaimedCount>0&&(
            <TouchableOpacity onPress={handleClaimAll}
              style={[styles.claimAllBtn,{borderColor:'#ffd70044',backgroundColor:'#ffd70015'}]}>
              <Text style={styles.claimAllText}>🎁 Tout récupérer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f=>(
            <TouchableOpacity key={f.id} onPress={()=>setFilter(f.id)}
              style={[styles.filterBtn,filter===f.id&&{backgroundColor:f.color+'18',borderColor:f.color+'44'}]}>
              <Text style={[styles.filterText,filter===f.id&&{color:f.color}]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {filtered.length===0?(
            <View style={styles.emptyBox}>
              <Text style={{fontSize:48}}>📭</Text>
              <Text style={styles.emptyTitle}>Boîte vide</Text>
              <Text style={styles.emptySub}>Tes récompenses apparaîtront ici</Text>
            </View>
          ):filtered.map((msg,i)=>(
            <MessageCard key={msg.id} msg={msg} index={i}
              onClaim={handleClaim} onDelete={handleDelete}/>
          ))}
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Helper pour envoyer un message dans la boîte ─────────────────
export async function sendInboxMessage(uid, {type='system',title,description='',crystals=0,xp=0,creature=null,expiresIn=null}) {
  const msg = {
    type, title, description, crystals, xp, creature,
    claimed: false,
    createdAt: Date.now(),
    expiresAt: expiresIn ? Date.now()+expiresIn : null,
  };
  await push(ref(db,`inbox/${uid}`), msg).catch(()=>{});
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:20,fontWeight:'900',color:'#fff',letterSpacing:4,textAlign:'center',paddingTop:16,marginBottom:10},
  feedbackBox:{backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:12,padding:10,alignItems:'center',marginBottom:8},
  feedbackText:{color:'#39ff8f',fontSize:13,fontWeight:'700'},
  // Stats
  statsRow:{flexDirection:'row',gap:8,marginBottom:10,alignItems:'center'},
  statCard:{flex:1,borderWidth:1,borderRadius:14,padding:10,alignItems:'center',gap:2},
  statVal:{fontSize:22,fontWeight:'900'},
  statLbl:{fontSize:8,color:'#4a6080',letterSpacing:1,textTransform:'uppercase'},
  claimAllBtn:{flex:1,borderWidth:1,borderRadius:14,padding:10,alignItems:'center',justifyContent:'center'},
  claimAllText:{color:'#ffd700',fontSize:11,fontWeight:'900'},
  // Filtres
  filterScroll:{gap:8,paddingBottom:10,paddingRight:16},
  filterBtn:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,paddingHorizontal:12,paddingVertical:7,backgroundColor:'#0d1220'},
  filterText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  // Messages
  scroll:{gap:10,paddingBottom:32},
  msgCard:{borderWidth:1.5,borderRadius:18,padding:14,gap:10},
  msgHeader:{flexDirection:'row',alignItems:'center',gap:8},
  msgTypeBadge:{flexDirection:'row',alignItems:'center',gap:5,borderWidth:1,borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  msgTypeEmoji:{fontSize:12},
  msgTypeLabel:{fontSize:9,fontWeight:'800',letterSpacing:1},
  msgDate:{flex:1,color:'#4a6080',fontSize:10,textAlign:'right'},
  expiredBadge:{backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444433',borderRadius:6,paddingHorizontal:6,paddingVertical:2},
  expiredText:{color:'#ff4444',fontSize:8,fontWeight:'700'},
  msgTitle:{fontSize:14,fontWeight:'900',letterSpacing:0.5},
  msgDesc:{color:'#6a84a0',fontSize:12,lineHeight:18},
  msgRewards:{flexDirection:'row',gap:8,flexWrap:'wrap'},
  rewardChip:{borderWidth:1,borderRadius:8,paddingHorizontal:10,paddingVertical:4},
  rewardChipText:{color:'#ffd700',fontSize:12,fontWeight:'800'},
  msgBtns:{flexDirection:'row',alignItems:'center',gap:8},
  claimBtn:{flex:1,borderWidth:1,borderRadius:12,paddingVertical:10,alignItems:'center'},
  claimBtnText:{fontSize:13,fontWeight:'900'},
  claimedBadge:{flex:1,backgroundColor:'#39ff8f18',borderWidth:1,borderColor:'#39ff8f33',borderRadius:12,paddingVertical:10,alignItems:'center'},
  claimedText:{color:'#39ff8f',fontSize:12,fontWeight:'700'},
  readBadge:{flex:1,backgroundColor:'#1e2d4a',borderRadius:12,paddingVertical:10,alignItems:'center'},
  readText:{color:'#4a6080',fontSize:12,fontWeight:'700'},
  deleteBtn:{width:36,height:36,borderRadius:10,backgroundColor:'#ff444418',borderWidth:1,borderColor:'#ff444433',alignItems:'center',justifyContent:'center'},
  deleteBtnText:{color:'#ff4444',fontSize:14,fontWeight:'900'},
  // Empty
  emptyBox:{alignItems:'center',paddingVertical:60,gap:10},
  emptyTitle:{color:'#c8daf0',fontSize:18,fontWeight:'700'},
  emptySub:{color:'#4a6080',fontSize:13,textAlign:'center'},
});
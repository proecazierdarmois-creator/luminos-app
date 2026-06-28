// screens/FriendsScreen.js — Amis amélioré V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, TextInput, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, get, onValue, push, remove } from 'firebase/database';
import { useAuth } from '../store/AuthContext';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES } from '../data/creatures';
import {
  searchPlayer, sendFriendRequest, acceptFriendRequest,
  declineFriendRequest, removeFriend,
  listenFriendRequests, listenFriends,
  loadFriendProfile, loadFriendCollection,
} from '../store/friendsService';

const { width: SW } = Dimensions.get('window');
const MAIN_TABS  = ['Amis','Échanges','Rechercher','Demandes'];
const TRADE_TABS = ['Reçus','Envoyés','Historique'];

async function sendTradeOffer(fromUid,fromName,toUid,toName,offeredCreature,requestedCreature) {
  const tradeRef = push(ref(db,`trades/${toUid}/incoming`));
  const id = tradeRef.key;
  const trade = {id,fromUid,fromName,toUid,toName,offeredCreature,requestedCreature,status:'pending',createdAt:Date.now()};
  await set(tradeRef,trade);
  await set(ref(db,`trades/${fromUid}/outgoing/${id}`),trade);
  return id;
}

async function acceptTrade(trade,myUid) {
  const mySave     = await get(ref(db,`saves/${myUid}`));
  const friendSave = await get(ref(db,`saves/${trade.fromUid}`));
  if (!mySave.exists()||!friendSave.exists()) return false;
  const myNew = (mySave.val().collection||[]).filter(c=>c.uid!==trade.requestedCreature.uid);
  myNew.push({...trade.offeredCreature,obtainedAt:Date.now()});
  const friendNew = (friendSave.val().collection||[]).filter(c=>c.uid!==trade.offeredCreature.uid);
  friendNew.push({...trade.requestedCreature,obtainedAt:Date.now()});
  await set(ref(db,`saves/${myUid}/collection`),myNew);
  await set(ref(db,`saves/${trade.fromUid}/collection`),friendNew);
  await push(ref(db,`trades/${myUid}/history`),{...trade,status:'accepted',completedAt:Date.now()});
  await push(ref(db,`trades/${trade.fromUid}/history`),{...trade,status:'accepted',completedAt:Date.now()});
  await remove(ref(db,`trades/${myUid}/incoming/${trade.id}`));
  await remove(ref(db,`trades/${trade.fromUid}/outgoing/${trade.id}`));
  return true;
}

function getRank(wins) {
  if (wins>=100) return {label:'★ MAÎTRE',   color:'#ffd700'};
  if (wins>=50)  return {label:'◆ EXPERT',   color:'#bf5fff'};
  if (wins>=20)  return {label:'● CHASSEUR', color:'#39ff8f'};
  return              {label:'○ NOVICE',   color:'#00e5ff'};
}

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({name,size=44,color='#00e5ff',border=true}) {
  return (
    <View style={{
      width:size,height:size,borderRadius:size/2,
      backgroundColor:color+'22',
      borderWidth:border?1.5:0,borderColor:color+'55',
      alignItems:'center',justifyContent:'center',
    }}>
      <Text style={{color,fontSize:size*0.4,fontWeight:'900'}}>
        {name?.[0]?.toUpperCase()||'?'}
      </Text>
    </View>
  );
}

// ─── StatBox ──────────────────────────────────────────────────────
function StatBox({label,value,color,emoji}) {
  return (
    <View style={[styles.statBox,{borderColor:color+'33'}]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue,{color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── FriendsScreen ────────────────────────────────────────────────
export default function FriendsScreen() {
  const authCtx = useAuth();
  const user    = authCtx?.user;
  const uid     = user?.uid||'guest';
  const myName  = user?.displayName||user?.email?.split('@')[0]||'Joueur';
  const {collection,addToCollection} = useGameStore();

  const [tab, setTab]         = useState('Amis');
  const [tradeTab, setTradeTab] = useState('Reçus');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendProfile, setFriendProfile] = useState(null);
  const [friendCollection2, setFriendCollection2] = useState([]);
  const [feedback, setFeedback] = useState('');

  const [incoming, setIncoming]     = useState([]);
  const [outgoing, setOutgoing]     = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [tradePhase, setTradePhase] = useState('list');
  const [tradeFriend, setTradeFriend] = useState(null);
  const [tradeFriendColl, setTradeFriendColl] = useState([]);
  const [myCreature, setMyCreature]     = useState(null);
  const [friendCreature, setFriendCreature] = useState(null);
  const [sending, setSending]     = useState(false);
  const [processing, setProcessing] = useState(false);

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const titleAnim    = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  useEffect(()=>{
    const unsubF = listenFriends(uid,setFriends);
    const unsubR = listenFriendRequests(uid,setRequests);
    const unsubIn = onValue(ref(db,`trades/${uid}/incoming`),snap=>{
      const list=[]; if(snap.exists()) snap.forEach(c=>list.push(c.val()));
      setIncoming(list.filter(t=>t.status==='pending'));
    });
    const unsubOut = onValue(ref(db,`trades/${uid}/outgoing`),snap=>{
      const list=[]; if(snap.exists()) snap.forEach(c=>list.push(c.val()));
      setOutgoing(list.filter(t=>t.status==='pending'));
    });
    get(ref(db,`trades/${uid}/history`)).then(snap=>{
      if(snap.exists()) setTradeHistory(Object.values(snap.val()).sort((a,b)=>(b.completedAt||0)-(a.completedAt||0)).slice(0,10));
    });
    return ()=>{unsubF();unsubR();unsubIn();unsubOut();};
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

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchPlayer(searchQuery.trim());
    setSearchResults(results.filter(r=>r.uid!==uid));
    setSearching(false);
  }

  async function handleSendRequest(toUid,toName) {
    const res = await sendFriendRequest(uid,myName,toUid);
    if (res.success) showFeedback(`✓ Demande envoyée à ${toName} !`);
    else showFeedback(res.error||'Erreur');
  }

  async function handleAcceptFriend(fromUid,fromName) {
    await acceptFriendRequest(uid,myName,fromUid,fromName);
    showFeedback(`✓ ${fromName} ajouté(e) !`);
  }

  async function handleDeclineFriend(fromUid) { await declineFriendRequest(uid,fromUid); }

  async function handleRemove(friendUid,friendName) {
    await removeFriend(uid,friendUid);
    showFeedback(`${friendName} retiré(e)`);
    setFriendProfile(null);
  }

  async function openFriendProfile(friendUid) {
    const profile = await loadFriendProfile(friendUid);
    const coll    = await loadFriendCollection(friendUid);
    setFriendProfile(profile);
    setFriendCollection2(coll);
  }

  async function handleSelectTradeFriend(friend) {
    setTradeFriend(friend);
    const coll = await loadFriendCollection(friend.uid);
    setTradeFriendColl(coll);
    setTradePhase('selectMine');
  }

  async function handleSendTrade() {
    if (!myCreature||!friendCreature||!tradeFriend||sending) return;
    setSending(true);
    try {
      await sendTradeOffer(uid,myName,tradeFriend.uid,tradeFriend.name,myCreature,friendCreature);
      showFeedback(`✓ Offre envoyée à ${tradeFriend.name} !`);
      setTradePhase('list'); setMyCreature(null); setFriendCreature(null); setTradeFriend(null);
    } catch(e){console.error(e);}
    setSending(false);
  }

  async function handleAcceptTrade(trade) {
    setProcessing(true);
    try {
      const ok = await acceptTrade(trade,uid);
      if (ok) {
        showFeedback('✓ Échange effectué !');
        const snap = await get(ref(db,`saves/${uid}`));
        if (snap.exists()) {
          (snap.val().collection||[]).forEach(c=>{
            if (!collection.find(x=>x.uid===c.uid)) addToCollection(c);
          });
        }
      }
    } catch(e){showFeedback('Erreur lors de l\'échange');}
    setProcessing(false);
  }

  async function handleDeclineTrade(trade) {
    await remove(ref(db,`trades/${uid}/incoming/${trade.id}`));
    await remove(ref(db,`trades/${trade.fromUid}/outgoing/${trade.id}`));
    showFeedback('Offre refusée');
  }

  async function handleCancelTrade(trade) {
    await remove(ref(db,`trades/${uid}/outgoing/${trade.id}`));
    await remove(ref(db,`trades/${trade.toUid}/incoming/${trade.id}`));
    showFeedback('Offre annulée');
  }

  const isFriend = uid2 => friends.some(f=>f.uid===uid2);
  const tradeNotif = incoming.length+outgoing.length;

  // ── PROFIL AMI ──
  if (friendProfile) {
    const rank     = getRank(friendProfile.wins||0);
    const shinys   = friendCollection2.filter(c=>c.isShiny).length;
    const legends  = [...new Set(friendCollection2.filter(c=>ALL_CREATURES[c.id]?.rarity==='legendary').map(c=>c.id))].length;
    const unique   = [...new Set(friendCollection2.map(c=>c.id))];
    return (
      <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={()=>setFriendProfile(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.profileScroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <LinearGradient colors={['#0d1a2e','#0a2040']} style={[styles.profileHeader,{borderWidth:1,borderColor:'#00e5ff22'}]}>
              <Avatar name={friendProfile.name} size={80} color="#00e5ff"/>
              <Text style={styles.profileName}>{friendProfile.name}</Text>
              <View style={[styles.rankBadge,{backgroundColor:rank.color+'22',borderColor:rank.color+'44'}]}>
                <Text style={[styles.rankBadgeText,{color:rank.color}]}>{rank.label}</Text>
              </View>
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatBox label="Victoires"   value={friendProfile.wins||0}   color="#39ff8f" emoji="⚔️"/>
              <StatBox label="Créatures"   value={friendCollection2.length} color="#00e5ff" emoji="📖"/>
              <StatBox label="Shinys"      value={shinys}                   color="#ff69b4" emoji="✨"/>
              <StatBox label="Légendaires" value={legends}                  color="#ffd700" emoji="🌟"/>
            </View>

            {/* Collection */}
            <Text style={styles.sectionLabel}>📖 COLLECTION ({unique.length})</Text>
            <View style={styles.collGrid}>
              {unique.map(id=>{
                const c=ALL_CREATURES[id]; if(!c) return null;
                const Sprite=SPRITES[id.replace('_shiny','')]||SPRITES.lumikos;
                const count=friendCollection2.filter(x=>x.id===id).length;
                return (
                  <View key={id} style={[styles.collCard,{borderColor:c.rarityColor+'44',backgroundColor:c.rarityColor+'08'}]}>
                    <Sprite size={46}/>
                    <Text style={[styles.collName,{color:c.rarityColor}]} numberOfLines={1}>{c.name}</Text>
                    {count>1&&<View style={[styles.collCount,{backgroundColor:c.rarityColor}]}><Text style={styles.collCountText}>×{count}</Text></View>}
                  </View>
                );
              })}
            </View>

            {/* Actions */}
            <TouchableOpacity onPress={()=>handleRemove(friendProfile.uid,friendProfile.name)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕ Retirer des amis</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── TRADE : SELECT FRIEND ──
  if (tab==='Échanges'&&tradePhase==='selectFriend') return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={()=>setTradePhase('list')} style={styles.backBtn}><Text style={styles.backBtnText}>← Retour</Text></TouchableOpacity>
        <Text style={styles.title}>CHOISIR UN AMI</Text>
        <ScrollView contentContainerStyle={styles.scroll}>
          {friends.length===0
            ?<View style={styles.emptyBox}><Text style={styles.emptyEmoji}>👥</Text><Text style={styles.emptyTitle}>Aucun ami</Text></View>
            :friends.map(f=>(
              <TouchableOpacity key={f.uid} onPress={()=>handleSelectTradeFriend(f)}
                style={styles.friendRow}>
                <Avatar name={f.name} size={44} color="#39ff8f"/>
                <Text style={[styles.friendName,{flex:1}]}>{f.name}</Text>
                <Text style={styles.friendArrow}>›</Text>
              </TouchableOpacity>
            ))
          }
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── TRADE : MA CRÉATURE ──
  if (tab==='Échanges'&&tradePhase==='selectMine') return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={()=>setTradePhase('selectFriend')} style={styles.backBtn}><Text style={styles.backBtnText}>← Retour</Text></TouchableOpacity>
        <Text style={styles.title}>J'OFFRE</Text>
        <Text style={styles.tradeSubtitle}>Quelle créature offres-tu à {tradeFriend?.name} ?</Text>
        <ScrollView contentContainerStyle={styles.creatureGridScroll}>
          {collection.map(c=>{
            const data=ALL_CREATURES[c.id];
            const Sprite=SPRITES[c.id?.replace('_shiny','')]||SPRITES.lumikos;
            return (
              <TouchableOpacity key={c.uid} onPress={()=>{setMyCreature(c);setTradePhase('selectFriendCreature');}}
                style={[styles.creatureCard,{borderColor:data?.rarityColor+'55',backgroundColor:data?.rarityColor+'12'}]}>
                <Sprite size={58}/>
                <Text style={[styles.creatureName,{color:data?.rarityColor}]} numberOfLines={1}>{data?.name}</Text>
                <Text style={styles.creatureRarity}>{data?.rarityLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── TRADE : CRÉATURE AMI ──
  if (tab==='Échanges'&&tradePhase==='selectFriendCreature') return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={()=>setTradePhase('selectMine')} style={styles.backBtn}><Text style={styles.backBtnText}>← Retour</Text></TouchableOpacity>
        <Text style={styles.title}>JE DEMANDE</Text>
        <Text style={styles.tradeSubtitle}>Que veux-tu de {tradeFriend?.name} ?</Text>
        <ScrollView contentContainerStyle={styles.creatureGridScroll}>
          {tradeFriendColl.length===0
            ?<View style={styles.emptyBox}><Text style={styles.emptyTitle}>{tradeFriend?.name} n'a pas encore de créatures</Text></View>
            :tradeFriendColl.map((c,i)=>{
              const data=ALL_CREATURES[c.id];
              const Sprite=SPRITES[c.id?.replace('_shiny','')]||SPRITES.lumikos;
              return (
                <TouchableOpacity key={c.uid||i} onPress={()=>{setFriendCreature(c);setTradePhase('confirm');}}
                  style={[styles.creatureCard,{borderColor:data?.rarityColor+'55',backgroundColor:data?.rarityColor+'12'}]}>
                  <Sprite size={58}/>
                  <Text style={[styles.creatureName,{color:data?.rarityColor}]} numberOfLines={1}>{data?.name}</Text>
                  <Text style={styles.creatureRarity}>{data?.rarityLabel}</Text>
                </TouchableOpacity>
              );
            })
          }
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── TRADE : CONFIRMATION ──
  if (tab==='Échanges'&&tradePhase==='confirm'&&myCreature&&friendCreature) {
    const myData     = ALL_CREATURES[myCreature.id];
    const friendData = ALL_CREATURES[friendCreature.id];
    const MySprite     = SPRITES[myCreature.id?.replace('_shiny','')]    ||SPRITES.lumikos;
    const FriendSprite = SPRITES[friendCreature.id?.replace('_shiny','')]||SPRITES.lumikos;
    return (
      <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={()=>setTradePhase('selectFriendCreature')} style={styles.backBtn}><Text style={styles.backBtnText}>← Retour</Text></TouchableOpacity>
          <Text style={styles.title}>CONFIRMATION</Text>
          <View style={styles.confirmArea}>
            <Text style={styles.confirmWith}>Échange avec {tradeFriend?.name}</Text>
            <View style={styles.confirmRow}>
              <View style={styles.confirmSide}>
                <Text style={styles.confirmLabel}>Tu offres</Text>
                <LinearGradient colors={myData?.bgGradient||['#0d1220','#07090f']}
                  style={[styles.confirmBox,{borderColor:myData?.rarityColor+'55'}]}>
                  <MySprite size={90}/>
                  <Text style={[styles.confirmName,{color:myData?.rarityColor}]}>{myData?.name}</Text>
                  <Text style={styles.confirmRarity}>{myData?.rarityLabel}</Text>
                </LinearGradient>
              </View>
              <Text style={styles.confirmArrow}>⇄</Text>
              <View style={styles.confirmSide}>
                <Text style={styles.confirmLabel}>Tu reçois</Text>
                <LinearGradient colors={friendData?.bgGradient||['#0d1220','#07090f']}
                  style={[styles.confirmBox,{borderColor:friendData?.rarityColor+'55'}]}>
                  <FriendSprite size={90}/>
                  <Text style={[styles.confirmName,{color:friendData?.rarityColor}]}>{friendData?.name}</Text>
                  <Text style={styles.confirmRarity}>{friendData?.rarityLabel}</Text>
                </LinearGradient>
              </View>
            </View>
            <TouchableOpacity onPress={handleSendTrade} disabled={sending}
              style={[styles.sendBtn,sending&&styles.disabled]}>
              <LinearGradient colors={['#39ff8f44','#39ff8f22']} style={styles.sendBtnGrad}>
                <Text style={styles.sendBtnText}>{sending?'Envoi...':'✓ Envoyer la proposition'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{setTradePhase('list');setMyCreature(null);setFriendCreature(null);}} style={styles.cancelTradeBtn}>
              <Text style={styles.cancelTradeBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── MAIN ──
  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>👥 AMIS</Animated.Text>

        {/* Feedback animé */}
        {feedback!==''&&(
          <Animated.View style={[styles.feedbackBox,{opacity:feedbackAnim,transform:[{translateY:feedbackAnim.interpolate({inputRange:[0,1],outputRange:[-10,0]})}]}]}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </Animated.View>
        )}

        {/* Mon ID */}
        <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.myIdBox,{borderColor:'#00e5ff22'}]}>
          <Avatar name={myName} size={36} color="#00e5ff"/>
          <View style={{flex:1,gap:1}}>
            <Text style={styles.myIdLabel}>TON NOM</Text>
            <Text style={styles.myIdValue}>{myName}</Text>
          </View>
          <View style={[styles.friendCountBadge]}>
            <Text style={styles.friendCountVal}>{friends.length}</Text>
            <Text style={styles.friendCountLbl}>amis</Text>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {MAIN_TABS.map(t=>(
            <TouchableOpacity key={t} onPress={()=>{setTab(t);setTradePhase('list');}}
              style={[styles.tabBtn,tab===t&&styles.tabActive]}>
              <Text style={[styles.tabText,tab===t&&styles.tabTextActive]}>{t}</Text>
              {t==='Demandes'&&requests.length>0&&<View style={styles.notifDot}><Text style={styles.notifDotText}>{requests.length}</Text></View>}
              {t==='Échanges'&&tradeNotif>0&&<View style={[styles.notifDot,{backgroundColor:'#ffd700'}]}><Text style={styles.notifDotText}>{tradeNotif}</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── AMIS ── */}
        {tab==='Amis'&&(
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {friends.length===0
              ?<View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyTitle}>Aucun ami pour l'instant</Text>
                <Text style={styles.emptyHint}>Recherche des joueurs pour les ajouter !</Text>
              </View>
              :friends.map((f,i)=>(
                <TouchableOpacity key={f.uid} onPress={()=>openFriendProfile(f.uid)}>
                  <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.friendRow,{borderColor:'#00e5ff22'}]}>
                    <Avatar name={f.name} size={46} color="#00e5ff"/>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{f.name}</Text>
                      <Text style={styles.friendSub}>Voir la collection →</Text>
                    </View>
                    <Text style={[styles.friendArrow,{color:'#00e5ff'}]}>›</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            }
          </ScrollView>
        )}

        {/* ── ÉCHANGES ── */}
        {tab==='Échanges'&&tradePhase==='list'&&(
          <>
            <TouchableOpacity onPress={()=>setTradePhase('selectFriend')} style={styles.proposeBtn}>
              <LinearGradient colors={['#39ff8f44','#39ff8f22']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.proposeBtnGrad}>
                <Text style={styles.proposeBtnText}>⇄ Proposer un échange</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.subTabRow}>
              {TRADE_TABS.map(t=>(
                <TouchableOpacity key={t} onPress={()=>setTradeTab(t)}
                  style={[styles.subTabBtn,tradeTab===t&&styles.subTabActive]}>
                  <Text style={[styles.subTabText,tradeTab===t&&styles.subTabTextActive]}>{t}</Text>
                  {t==='Reçus'&&incoming.length>0&&<View style={styles.subNotif}><Text style={styles.subNotifText}>{incoming.length}</Text></View>}
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {tradeTab==='Reçus'&&(
                incoming.length===0
                  ?<View style={styles.emptyBox}><Text style={styles.emptyEmoji}>📥</Text><Text style={styles.emptyTitle}>Aucune proposition reçue</Text></View>
                  :incoming.map(trade=>{
                    const offered   = ALL_CREATURES[trade.offeredCreature?.id];
                    const requested = ALL_CREATURES[trade.requestedCreature?.id];
                    const OffSprite = SPRITES[trade.offeredCreature?.id?.replace('_shiny','')]  ||SPRITES.lumikos;
                    const ReqSprite = SPRITES[trade.requestedCreature?.id?.replace('_shiny','')]||SPRITES.lumikos;
                    return (
                      <View key={trade.id} style={[styles.tradeCard,{borderColor:'#39ff8f22'}]}>
                        <View style={styles.tradeCardHeader}>
                          <Avatar name={trade.fromName} size={28} color="#39ff8f"/>
                          <Text style={styles.tradeCardFrom}>Proposition de <Text style={{color:'#39ff8f',fontWeight:'800'}}>{trade.fromName}</Text></Text>
                        </View>
                        <View style={styles.tradeCardRow}>
                          <View style={styles.tradeCardSide}>
                            <OffSprite size={60}/>
                            <Text style={[styles.tradeCardName,{color:offered?.rarityColor}]}>{offered?.name}</Text>
                            <Text style={styles.tradeCardLbl}>Il offre</Text>
                          </View>
                          <Text style={styles.tradeCardArrow}>⇄</Text>
                          <View style={styles.tradeCardSide}>
                            <ReqSprite size={60}/>
                            <Text style={[styles.tradeCardName,{color:requested?.rarityColor}]}>{requested?.name}</Text>
                            <Text style={styles.tradeCardLbl}>Il demande</Text>
                          </View>
                        </View>
                        <View style={styles.tradeCardBtns}>
                          <TouchableOpacity onPress={()=>handleAcceptTrade(trade)} disabled={processing}
                            style={[styles.acceptTradeBtn,processing&&styles.disabled]}>
                            <Text style={styles.acceptTradeBtnText}>✓ Accepter</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={()=>handleDeclineTrade(trade)} style={styles.declineTradeBtn}>
                            <Text style={styles.declineTradeBtnText}>✕ Refuser</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
              )}

              {tradeTab==='Envoyés'&&(
                outgoing.length===0
                  ?<View style={styles.emptyBox}><Text style={styles.emptyEmoji}>📤</Text><Text style={styles.emptyTitle}>Aucune proposition envoyée</Text></View>
                  :outgoing.map(trade=>{
                    const offered   = ALL_CREATURES[trade.offeredCreature?.id];
                    const requested = ALL_CREATURES[trade.requestedCreature?.id];
                    const OffSprite = SPRITES[trade.offeredCreature?.id?.replace('_shiny','')]  ||SPRITES.lumikos;
                    const ReqSprite = SPRITES[trade.requestedCreature?.id?.replace('_shiny','')]||SPRITES.lumikos;
                    return (
                      <View key={trade.id} style={[styles.tradeCard,{borderColor:'#ffd70022'}]}>
                        <View style={styles.tradeCardHeader}>
                          <View style={[styles.pendingBadge]}><Text style={styles.pendingBadgeText}>⏳ En attente</Text></View>
                          <Text style={styles.tradeCardFrom}>{trade.toName}</Text>
                        </View>
                        <View style={styles.tradeCardRow}>
                          <View style={styles.tradeCardSide}><OffSprite size={60}/><Text style={[styles.tradeCardName,{color:offered?.rarityColor}]}>{offered?.name}</Text><Text style={styles.tradeCardLbl}>Tu offres</Text></View>
                          <Text style={styles.tradeCardArrow}>⇄</Text>
                          <View style={styles.tradeCardSide}><ReqSprite size={60}/><Text style={[styles.tradeCardName,{color:requested?.rarityColor}]}>{requested?.name}</Text><Text style={styles.tradeCardLbl}>Tu demandes</Text></View>
                        </View>
                        <TouchableOpacity onPress={()=>handleCancelTrade(trade)} style={styles.declineTradeBtn}>
                          <Text style={styles.declineTradeBtnText}>Annuler l'offre</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
              )}

              {tradeTab==='Historique'&&(
                tradeHistory.length===0
                  ?<View style={styles.emptyBox}><Text style={styles.emptyEmoji}>📋</Text><Text style={styles.emptyTitle}>Aucun échange effectué</Text></View>
                  :tradeHistory.map((trade,i)=>{
                    const offered   = ALL_CREATURES[trade.offeredCreature?.id];
                    const requested = ALL_CREATURES[trade.requestedCreature?.id];
                    return (
                      <View key={i} style={styles.histCard}>
                        <View style={styles.histRow}>
                          <Text style={[styles.histName,{color:offered?.rarityColor}]}>{offered?.name}</Text>
                          <Text style={styles.histArrow}>⇄</Text>
                          <Text style={[styles.histName,{color:requested?.rarityColor}]}>{requested?.name}</Text>
                        </View>
                        <Text style={styles.histMeta}>
                          {trade.fromUid===uid?`Avec ${trade.toName||'un ami'}`:`De ${trade.fromName}`}
                          {trade.completedAt?` · ${new Date(trade.completedAt).toLocaleDateString('fr-FR')}`:''}
                        </Text>
                      </View>
                    );
                  })
              )}
            </ScrollView>
          </>
        )}

        {/* ── RECHERCHER ── */}
        {tab==='Rechercher'&&(
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.searchRow}>
              <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery}
                placeholder="Nom du joueur..." placeholderTextColor="#4a6080"
                onSubmitEditing={handleSearch} returnKeyType="search"/>
              <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>{searching?'…':'🔍'}</Text>
              </TouchableOpacity>
            </View>
            {searchResults.length===0&&!searching&&searchQuery!==''&&(
              <Text style={styles.noResults}>Aucun joueur trouvé pour "{searchQuery}"</Text>
            )}
            {searchResults.map(player=>{
              const already=isFriend(player.uid);
              const rank=getRank(player.wins||0);
              return (
                <View key={player.uid} style={styles.searchResultRow}>
                  <Avatar name={player.name} size={44} color="#00e5ff"/>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{player.name}</Text>
                    <Text style={[styles.friendSub,{color:rank.color}]}>{rank.label} · {player.wins||0} victoires</Text>
                  </View>
                  {already
                    ?<View style={styles.alreadyBadge}><Text style={styles.alreadyBadgeText}>✓ Ami</Text></View>
                    :<TouchableOpacity onPress={()=>handleSendRequest(player.uid,player.name)} style={styles.addBtn}>
                      <Text style={styles.addBtnText}>+ Ajouter</Text>
                    </TouchableOpacity>
                  }
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ── DEMANDES ── */}
        {tab==='Demandes'&&(
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {requests.length===0
              ?<View style={styles.emptyBox}><Text style={styles.emptyEmoji}>📬</Text><Text style={styles.emptyTitle}>Aucune demande en attente</Text></View>
              :requests.map(req=>(
                <LinearGradient key={req.uid} colors={['#18000f','#07090f']} style={[styles.requestRow,{borderColor:'#ff4fa333'}]}>
                  <Avatar name={req.fromName} size={46} color="#ff4fa3"/>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{req.fromName}</Text>
                    <Text style={styles.friendSub}>veut être ton ami ✦</Text>
                  </View>
                  <View style={styles.requestBtns}>
                    <TouchableOpacity onPress={()=>handleAcceptFriend(req.fromUid,req.fromName)} style={styles.acceptBtn}>
                      <Text style={styles.acceptBtnText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>handleDeclineFriend(req.fromUid)} style={styles.declineBtn}>
                      <Text style={styles.declineBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              ))
            }
          </ScrollView>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:16,marginBottom:10},
  feedbackBox:{backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:12,padding:10,marginBottom:8,alignItems:'center'},
  feedbackText:{color:'#39ff8f',fontSize:13,fontWeight:'700'},
  // My ID
  myIdBox:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:12,marginBottom:10},
  myIdLabel:{fontSize:7,color:'#4a6080',letterSpacing:3,textTransform:'uppercase'},
  myIdValue:{fontSize:16,fontWeight:'900',color:'#00e5ff'},
  friendCountBadge:{alignItems:'center',gap:1},
  friendCountVal:{fontSize:20,fontWeight:'900',color:'#00e5ff'},
  friendCountLbl:{fontSize:8,color:'#4a6080',letterSpacing:1},
  // Tabs
  tabRow:{flexDirection:'row',gap:6,marginBottom:10},
  tabBtn:{flex:1,alignItems:'center',paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220',position:'relative'},
  tabActive:{borderColor:'#00e5ff44',backgroundColor:'#00e5ff10'},
  tabText:{color:'#4a6080',fontSize:9,fontWeight:'700'},
  tabTextActive:{color:'#00e5ff'},
  notifDot:{position:'absolute',top:-5,right:-5,backgroundColor:'#ff4fa3',borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  notifDotText:{color:'#000',fontSize:8,fontWeight:'900'},
  scroll:{gap:10,paddingBottom:24},
  emptyBox:{alignItems:'center',gap:8,paddingVertical:40},
  emptyEmoji:{fontSize:48},
  emptyTitle:{color:'#c8daf0',fontSize:16,fontWeight:'700'},
  emptyHint:{color:'#4a6080',fontSize:13,textAlign:'center'},
  // Friends
  friendRow:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14},
  friendInfo:{flex:1},
  friendName:{color:'#c8daf0',fontSize:15,fontWeight:'700'},
  friendSub:{color:'#4a6080',fontSize:11,marginTop:2},
  friendArrow:{color:'#4a6080',fontSize:20},
  // Profile
  profileScroll:{gap:14,paddingBottom:32},
  profileHeader:{borderRadius:18,padding:20,alignItems:'center',gap:8},
  profileName:{color:'#fff',fontSize:22,fontWeight:'900',letterSpacing:2},
  rankBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:4},
  rankBadgeText:{fontSize:11,fontWeight:'800',letterSpacing:1},
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  statBox:{flex:1,minWidth:'45%',borderWidth:1,borderRadius:14,padding:12,alignItems:'center',gap:4},
  statEmoji:{fontSize:20},
  statValue:{fontSize:22,fontWeight:'900'},
  statLabel:{fontSize:8,color:'#4a6080',letterSpacing:1,textTransform:'uppercase'},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  collGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  collCard:{width:'30%',borderWidth:1,borderRadius:12,padding:8,alignItems:'center',gap:3,position:'relative'},
  collName:{fontSize:7,fontWeight:'800',textAlign:'center'},
  collCount:{position:'absolute',top:4,right:4,backgroundColor:'#00e5ff',borderRadius:6,paddingHorizontal:4,paddingVertical:1},
  collCountText:{fontSize:7,fontWeight:'900',color:'#000'},
  removeBtn:{backgroundColor:'#ff444418',borderWidth:1,borderColor:'#ff444433',borderRadius:14,padding:14,alignItems:'center'},
  removeBtnText:{color:'#ff6666',fontSize:13,fontWeight:'700'},
  backBtn:{paddingTop:16,paddingBottom:8},
  backBtnText:{color:'#00e5ff',fontSize:14,fontWeight:'700'},
  // Search
  searchRow:{flexDirection:'row',gap:8},
  searchInput:{flex:1,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,paddingHorizontal:16,paddingVertical:12,color:'#fff',fontSize:15},
  searchBtn:{backgroundColor:'#00e5ff22',borderWidth:1,borderColor:'#00e5ff44',borderRadius:14,paddingHorizontal:16,justifyContent:'center'},
  searchBtnText:{fontSize:18},
  noResults:{color:'#4a6080',fontSize:13,textAlign:'center',marginTop:20,fontStyle:'italic'},
  searchResultRow:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14},
  addBtn:{backgroundColor:'#00e5ff22',borderWidth:1,borderColor:'#00e5ff44',borderRadius:10,paddingHorizontal:12,paddingVertical:6},
  addBtnText:{color:'#00e5ff',fontSize:12,fontWeight:'700'},
  alreadyBadge:{borderRadius:10,paddingHorizontal:10,paddingVertical:6,backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f33'},
  alreadyBadgeText:{color:'#39ff8f',fontSize:11,fontWeight:'700'},
  // Requests
  requestRow:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#ff4fa322',borderRadius:16,padding:14},
  requestBtns:{flexDirection:'row',gap:8},
  acceptBtn:{width:40,height:40,borderRadius:12,backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',alignItems:'center',justifyContent:'center'},
  acceptBtnText:{color:'#39ff8f',fontSize:18,fontWeight:'900'},
  declineBtn:{width:40,height:40,borderRadius:12,backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444444',alignItems:'center',justifyContent:'center'},
  declineBtnText:{color:'#ff4444',fontSize:18,fontWeight:'900'},
  // Trades
  tradeSubtitle:{fontSize:12,color:'#4a6080',textAlign:'center',marginBottom:10},
  proposeBtn:{borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#39ff8f33',marginBottom:10},
  proposeBtnGrad:{alignItems:'center',paddingVertical:14},
  proposeBtnText:{color:'#39ff8f',fontSize:14,fontWeight:'900',letterSpacing:1},
  subTabRow:{flexDirection:'row',gap:6,marginBottom:10},
  subTabBtn:{flex:1,alignItems:'center',paddingVertical:8,borderRadius:10,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220',position:'relative'},
  subTabActive:{borderColor:'#39ff8f44',backgroundColor:'#39ff8f10'},
  subTabText:{color:'#4a6080',fontSize:10,fontWeight:'700'},
  subTabTextActive:{color:'#39ff8f'},
  subNotif:{position:'absolute',top:-5,right:-5,backgroundColor:'#ff4fa3',borderRadius:7,minWidth:14,height:14,alignItems:'center',justifyContent:'center',paddingHorizontal:2},
  subNotifText:{color:'#000',fontSize:7,fontWeight:'900'},
  creatureGridScroll:{flexDirection:'row',flexWrap:'wrap',gap:10,paddingBottom:24},
  creatureCard:{width:'30%',borderWidth:1.5,borderRadius:14,padding:10,alignItems:'center',gap:4},
  creatureName:{fontSize:8,fontWeight:'800',textAlign:'center'},
  creatureRarity:{fontSize:7,color:'#4a6080'},
  // Confirm trade
  confirmArea:{flex:1,paddingTop:8,gap:14},
  confirmWith:{color:'#4a6080',fontSize:13,textAlign:'center'},
  confirmRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',gap:8},
  confirmSide:{alignItems:'center',gap:6,flex:1},
  confirmLabel:{color:'#4a6080',fontSize:10,fontWeight:'700',letterSpacing:1},
  confirmBox:{borderWidth:1,borderRadius:18,padding:12,alignItems:'center',gap:5},
  confirmName:{fontSize:13,fontWeight:'900',textAlign:'center'},
  confirmRarity:{fontSize:9,color:'rgba(255,255,255,0.4)'},
  confirmArrow:{fontSize:26,color:'#39ff8f',fontWeight:'900'},
  sendBtn:{borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#39ff8f33'},
  sendBtnGrad:{alignItems:'center',paddingVertical:16},
  sendBtnText:{color:'#39ff8f',fontSize:15,fontWeight:'900',letterSpacing:1},
  cancelTradeBtn:{alignItems:'center',padding:10},
  cancelTradeBtnText:{color:'#4a6080',fontSize:13},
  // Trade cards
  tradeCard:{backgroundColor:'#0d1220',borderWidth:1.5,borderRadius:18,padding:14,gap:12},
  tradeCardHeader:{flexDirection:'row',alignItems:'center',gap:8},
  tradeCardFrom:{color:'#4a6080',fontSize:11,fontWeight:'700',flex:1},
  tradeCardRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-around'},
  tradeCardSide:{alignItems:'center',gap:4,flex:1},
  tradeCardName:{fontSize:11,fontWeight:'800',textAlign:'center'},
  tradeCardLbl:{fontSize:9,color:'#4a6080'},
  tradeCardArrow:{fontSize:22,color:'#ffd700'},
  tradeCardBtns:{flexDirection:'row',gap:8},
  acceptTradeBtn:{flex:1,backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:12,padding:11,alignItems:'center'},
  acceptTradeBtnText:{color:'#39ff8f',fontSize:13,fontWeight:'800'},
  declineTradeBtn:{flex:1,backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444444',borderRadius:12,padding:11,alignItems:'center'},
  declineTradeBtnText:{color:'#ff4444',fontSize:13,fontWeight:'800'},
  pendingBadge:{backgroundColor:'#ffd70022',borderWidth:1,borderColor:'#ffd70044',borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  pendingBadgeText:{color:'#ffd700',fontSize:9,fontWeight:'800'},
  // History
  histCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:12,gap:5},
  histRow:{flexDirection:'row',alignItems:'center',gap:8},
  histName:{fontSize:13,fontWeight:'800',flex:1,textAlign:'center'},
  histArrow:{color:'#4a6080',fontSize:16},
  histMeta:{color:'#4a6080',fontSize:10},
  disabled:{opacity:0.4},
});
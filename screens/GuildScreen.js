// screens/GuildScreen.js — Guildes améliorées
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, get, onValue, push, remove, serverTimestamp } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';

// ─── Config ──────────────────────────────────────────────────────
const RANKS = {
  president:      { label:'Président',      emoji:'👑', color:'#ffd700' },
  vice_president: { label:'Vice-Président', emoji:'⭐', color:'#bf5fff' },
  member:         { label:'Membre',         emoji:'🔵', color:'#00e5ff' },
};

const EMBLEMS = ['🌟','⚔️','🔥','💎','🌊','🌿','⚡','🌑','🦋','🐉','🏆','🌈','🦊','🐺','🦅','☀️','🌙','🔮'];

const GUILD_COLORS = [
  {id:'blue',   label:'Azur',    color:'#00e5ff', gradient:['#0d1a2e','#0a2040']},
  {id:'purple', label:'Violet',  color:'#bf5fff', gradient:['#100018','#180028']},
  {id:'gold',   label:'Or',      color:'#ffd700', gradient:['#1a1000','#2a1800']},
  {id:'green',  label:'Émeraude',color:'#39ff8f', gradient:['#041204','#081808']},
  {id:'red',    label:'Écarlate',color:'#ff4fa3', gradient:['#180008','#280010']},
  {id:'orange', label:'Feu',     color:'#ff6b35', gradient:['#180800','#281200']},
];

// ─── Firebase helpers ─────────────────────────────────────────────
async function createGuild(uid, userName, name, description, emblem, colorId) {
  const guildRef = push(ref(db,'guilds'));
  const guildId  = guildRef.key;
  await set(guildRef, {
    id:guildId, name, description, emblem, colorId,
    createdAt:Date.now(), presidentId:uid, presidentName:userName,
    score:0, wins:0, totalMembers:1,
    members:{ [uid]:{ name:userName, rank:'president', joinedAt:Date.now(), score:0, wins:0 } },
  });
  await set(ref(db,`players/${uid}/guildId`), guildId);
  return guildId;
}

async function joinGuild(uid, userName, guildId) {
  await set(ref(db,`guilds/${guildId}/members/${uid}`), {
    name:userName, rank:'member', joinedAt:Date.now(), score:0, wins:0,
  });
  await set(ref(db,`players/${uid}/guildId`), guildId);
}

async function leaveGuild(uid, guildId, isPresident, members) {
  await remove(ref(db,`guilds/${guildId}/members/${uid}`));
  await remove(ref(db,`players/${uid}/guildId`));
  if (isPresident) {
    const remaining = Object.entries(members).filter(([id])=>id!==uid);
    if (remaining.length===0) { await remove(ref(db,`guilds/${guildId}`)); }
    else {
      const vp = remaining.find(([,m])=>m.rank==='vice_president');
      const next = vp||remaining[0];
      await set(ref(db,`guilds/${guildId}/members/${next[0]}/rank`),'president');
      await set(ref(db,`guilds/${guildId}/presidentId`),next[0]);
      await set(ref(db,`guilds/${guildId}/presidentName`),next[1].name);
    }
  }
}

async function sendMessage(guildId, uid, name, rank, text) {
  await push(ref(db,`guilds/${guildId}/chat`), {uid, name, rank, text, at:Date.now()});
}

// ─── GuildScreen ─────────────────────────────────────────────────
export default function GuildScreen() {
  const { wins, collection, crystals } = useGameStore();
  const authCtx  = useAuth();
  const user     = authCtx?.user;
  const uid      = user?.uid || 'guest';
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Joueur';

  const [myGuildId, setMyGuildId]     = useState(null);
  const [myGuild, setMyGuild]         = useState(null);
  const [allGuilds, setAllGuilds]     = useState([]);
  const [phase, setPhase]             = useState('loading');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]     = useState('');
  const [tab, setTab]                 = useState('Chat');
  const [search, setSearch]           = useState('');
  const [feedback, setFeedback]       = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Create
  const [newName, setNewName]     = useState('');
  const [newDesc, setNewDesc]     = useState('');
  const [newEmblem, setNewEmblem] = useState('🌟');
  const [newColor, setNewColor]   = useState(GUILD_COLORS[0]);
  const [creating, setCreating]   = useState(false);

  const chatScrollRef = useRef(null);
  const headerAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
  }, [myGuild]);

  useEffect(() => {
    const unsub = onValue(ref(db,`players/${uid}/guildId`), snap => {
      if (snap.exists()) setMyGuildId(snap.val());
      else { setMyGuildId(null); setMyGuild(null); setPhase('none'); }
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!myGuildId) return;
    const unsub = onValue(ref(db,`guilds/${myGuildId}`), snap => {
      if (snap.exists()) { setMyGuild(snap.val()); setPhase('guild'); }
      else { setMyGuildId(null); setMyGuild(null); setPhase('none'); }
    });
    return unsub;
  }, [myGuildId]);

  useEffect(() => {
    if (!myGuildId) return;
    const unsub = onValue(ref(db,`guilds/${myGuildId}/chat`), snap => {
      if (snap.exists()) {
        const msgs = Object.values(snap.val()).sort((a,b)=>a.at-b.at).slice(-60);
        setChatMessages(msgs);
        setTimeout(()=>chatScrollRef.current?.scrollToEnd({animated:true}), 100);
      }
    });
    return unsub;
  }, [myGuildId]);

  useEffect(() => {
    if (phase!=='browse') return;
    onValue(ref(db,'guilds'), snap => {
      if (snap.exists()) {
        setAllGuilds(Object.values(snap.val()).sort((a,b)=>
          (Object.keys(b.members||{}).length)-(Object.keys(a.members||{}).length)
        ));
      }
    }, {onlyOnce:true});
  }, [phase]);

  // Sync score guilde avec stats joueur
  useEffect(() => {
    if (!myGuildId || !uid) return;
    const myScore = wins*10 + collection.length*2 + crystals;
    set(ref(db,`guilds/${myGuildId}/members/${uid}/score`), myScore).catch(()=>{});
    set(ref(db,`guilds/${myGuildId}/members/${uid}/wins`), wins).catch(()=>{});
  }, [wins, collection.length, crystals, myGuildId]);

  function showFeedback(msg) { setFeedback(msg); setTimeout(()=>setFeedback(''),2500); }

  async function handleCreate() {
    if (!newName.trim()||creating) return;
    setCreating(true);
    await createGuild(uid, userName, newName.trim(), newDesc.trim(), newEmblem, newColor.id);
    setCreating(false);
  }

  async function handleJoin(guildId) {
    await joinGuild(uid, userName, guildId);
  }

  async function handleLeave() {
    if (!myGuild) return;
    await leaveGuild(uid, myGuildId, myGuild.presidentId===uid, myGuild.members||{});
  }

  async function handleSendMessage() {
    if (!chatInput.trim()) return;
    await sendMessage(myGuildId, uid, userName, myRank, chatInput.trim());
    setChatInput('');
  }

  async function handlePromote(memberId, newRank) {
    await set(ref(db,`guilds/${myGuildId}/members/${memberId}/rank`), newRank);
    setSelectedMember(null); showFeedback('Rang mis à jour !');
  }

  async function handleKick(memberId) {
    await remove(ref(db,`guilds/${myGuildId}/members/${memberId}`));
    await remove(ref(db,`players/${memberId}/guildId`));
    setSelectedMember(null); showFeedback('Membre exclu.');
  }

  const myRank     = myGuild?.members?.[uid]?.rank || 'member';
  const isPresident= myRank==='president';
  const canManage  = myRank==='president'||myRank==='vice_president';
  const members    = myGuild ? Object.entries(myGuild.members||{}) : [];
  const guildScore = members.reduce((a,[,m])=>a+(m.score||0),0);
  const guildColor = GUILD_COLORS.find(c=>c.id===myGuild?.colorId) || GUILD_COLORS[0];
  const filteredGuilds = allGuilds.filter(g=>g.name?.toLowerCase().includes(search.toLowerCase()));

  // ── LOADING ──
  if (phase==='loading') return (
    <LinearGradient colors={['#07090f','#0d1220']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><Text style={styles.loadingText}>Chargement...</Text></View>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── CRÉER ──
  if (phase==='create') return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={()=>setPhase('none')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.createScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>CRÉER UNE GUILDE</Text>

          <Text style={styles.createLabel}>EMBLÈME</Text>
          <View style={styles.emblemGrid}>
            {EMBLEMS.map(e=>(
              <TouchableOpacity key={e} onPress={()=>setNewEmblem(e)}
                style={[styles.emblemBtn,newEmblem===e&&styles.emblemBtnActive]}>
                <Text style={styles.emblemText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.createLabel}>COULEUR</Text>
          <View style={styles.colorRow}>
            {GUILD_COLORS.map(c=>(
              <TouchableOpacity key={c.id} onPress={()=>setNewColor(c)}
                style={[styles.colorBtn,{backgroundColor:c.color+'33',borderColor:newColor.id===c.id?c.color:'#1e2d4a'}]}>
                <Text style={[styles.colorBtnText,{color:c.color}]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.createLabel}>NOM</Text>
          <TextInput style={styles.createInput} value={newName} onChangeText={setNewName}
            placeholder="Ex: Les Gardiens de Lumière" placeholderTextColor="#4a6080" maxLength={30}/>

          <Text style={styles.createLabel}>DESCRIPTION</Text>
          <TextInput style={[styles.createInput,{height:80,textAlignVertical:'top'}]}
            value={newDesc} onChangeText={setNewDesc}
            placeholder="Décris ta guilde..." placeholderTextColor="#4a6080" multiline maxLength={120}/>

          {/* Aperçu */}
          {newName.length>0&&(
            <LinearGradient colors={newColor.gradient} style={[styles.guildPreview,{borderColor:newColor.color+'44'}]}>
              <Text style={styles.guildPreviewEmoji}>{newEmblem}</Text>
              <Text style={[styles.guildPreviewName,{color:newColor.color}]}>{newName}</Text>
              {newDesc.length>0&&<Text style={styles.guildPreviewDesc}>{newDesc}</Text>}
              <Text style={styles.guildPreviewMeta}>👑 {userName} · 1 membre</Text>
            </LinearGradient>
          )}

          <TouchableOpacity onPress={handleCreate} disabled={!newName.trim()||creating}
            style={[styles.createBtn,(!newName.trim()||creating)&&styles.disabled]}>
            <LinearGradient colors={[newColor.color+'44',newColor.color+'22']}
              start={{x:0,y:0}} end={{x:1,y:0}} style={styles.createBtnGrad}>
              <Text style={[styles.createBtnText,{color:newColor.color}]}>
                {creating?'Création...':'✦ Créer la guilde'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── PARCOURIR ──
  if (phase==='browse') return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={()=>setPhase('none')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>REJOINDRE</Text>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="🔍 Rechercher une guilde..." placeholderTextColor="#4a6080"/>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {filteredGuilds.length===0&&<Text style={styles.emptyText}>Aucune guilde trouvée</Text>}
          {filteredGuilds.map(guild=>{
            const memberCount = Object.keys(guild.members||{}).length;
            const alreadyIn   = guild.members?.[uid];
            const gc = GUILD_COLORS.find(c=>c.id===guild.colorId)||GUILD_COLORS[0];
            const gScore = Object.values(guild.members||{}).reduce((a,m)=>a+(m.score||0),0);
            return (
              <LinearGradient key={guild.id} colors={gc.gradient}
                style={[styles.guildCard,{borderColor:gc.color+'55'}]}>
                <View style={[StyleSheet.absoluteFill,{borderRadius:18,overflow:'hidden'}]}>
                  <LinearGradient colors={['rgba(255,255,255,0.03)','rgba(255,255,255,0)']} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}/>
                </View>
                <Text style={styles.guildCardEmoji}>{guild.emblem}</Text>
                <View style={styles.guildCardInfo}>
                  <Text style={[styles.guildCardName,{color:gc.color}]}>{guild.name}</Text>
                  {guild.description&&<Text style={styles.guildCardDesc}>{guild.description}</Text>}
                  <View style={styles.guildCardStats}>
                    <Text style={styles.guildCardMeta}>👑 {guild.presidentName}</Text>
                    <Text style={styles.guildCardMeta}>👥 {memberCount}</Text>
                    <Text style={[styles.guildCardMeta,{color:'#ffd700'}]}>🏆 {gScore}pts</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={()=>!alreadyIn&&handleJoin(guild.id)} disabled={!!alreadyIn}
                  style={[styles.joinBtn,{borderColor:gc.color+'44',backgroundColor:gc.color+'15'},alreadyIn&&styles.disabled]}>
                  <Text style={[styles.joinBtnText,{color:gc.color}]}>{alreadyIn?'✓':'Rejoindre'}</Text>
                </TouchableOpacity>
              </LinearGradient>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── PAS DE GUILDE ──
  if (phase==='none') return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>GUILDES</Text>
        <View style={styles.centered}>
          <Text style={styles.noGuildEmoji}>⚔️</Text>
          <Text style={styles.noGuildTitle}>Tu n'as pas de guilde</Text>
          <Text style={styles.noGuildText}>Crée ta propre guilde ou rejoins-en une existante pour jouer en équipe.</Text>

          <View style={styles.noGuildInfoRow}>
            {[['👑','Préside ta guilde'],['💬','Chat en temps réel'],['🏆','Classement guilde']].map(([e,t],i)=>(
              <View key={i} style={styles.noGuildInfoCard}>
                <Text style={{fontSize:22}}>{e}</Text>
                <Text style={styles.noGuildInfoText}>{t}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={()=>setPhase('create')} style={styles.bigBtn}>
            <LinearGradient colors={['#ffd70055','#ffd70022']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.bigBtnGrad}>
              <Text style={styles.bigBtnText}>👑 Créer une guilde</Text>
              <Text style={styles.bigBtnSub}>Deviens président et recrute</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setPhase('browse')} style={styles.bigBtn}>
            <LinearGradient colors={['#00e5ff22','#00e5ff11']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.bigBtnGrad}>
              <Text style={[styles.bigBtnText,{color:'#00e5ff'}]}>🔍 Parcourir les guildes</Text>
              <Text style={[styles.bigBtnSub,{color:'#00e5ff66'}]}>Rejoins une équipe existante</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── MA GUILDE ──
  const sortedMembers = [...members].sort((a,b)=>{
    const order={president:0,vice_president:1,member:2};
    return (order[a[1].rank]||2)-(order[b[1].rank]||2);
  });

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* Header guilde animé */}
        <Animated.View style={{opacity:headerAnim,transform:[{translateY:headerAnim.interpolate({inputRange:[0,1],outputRange:[-10,0]})}]}}>
          <LinearGradient colors={guildColor.gradient}
            style={[styles.guildHeader,{borderColor:guildColor.color+'66'}]}>
            {/* Fond shimmer */}
            <View style={[StyleSheet.absoluteFill,{borderRadius:18,overflow:'hidden'}]}>
              <LinearGradient colors={['rgba(255,255,255,0.04)','rgba(255,255,255,0)']}
                start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}/>
            </View>
            <Text style={styles.guildHeaderEmoji}>{myGuild?.emblem}</Text>
            <View style={styles.guildHeaderInfo}>
              <Text style={[styles.guildHeaderName,{color:guildColor.color}]}>{myGuild?.name}</Text>
              <View style={styles.guildHeaderMetaRow}>
                <View style={[styles.guildMetaPill,{backgroundColor:guildColor.color+'18',borderColor:guildColor.color+'33'}]}>
                  <Text style={[styles.guildMetaPillText,{color:guildColor.color}]}>👥 {members.length}</Text>
                </View>
                <View style={[styles.guildMetaPill,{backgroundColor:'#ffd70018',borderColor:'#ffd70033'}]}>
                  <Text style={[styles.guildMetaPillText,{color:'#ffd700'}]}>🏆 {guildScore.toLocaleString()}</Text>
                </View>
              </View>
              {myGuild?.description&&<Text style={styles.guildHeaderDesc}>{myGuild.description}</Text>}
            </View>
            <View style={[styles.myRankBadge,{borderColor:RANKS[myRank].color+'66',backgroundColor:RANKS[myRank].color+'22'}]}>
              <Text style={[styles.myRankText,{color:RANKS[myRank].color}]}>{RANKS[myRank].emoji}</Text>
              <Text style={[styles.myRankLabel,{color:RANKS[myRank].color}]}>{RANKS[myRank].label}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Feedback */}
        {feedback!==''&&(
          <View style={styles.feedbackBox}><Text style={styles.feedbackText}>{feedback}</Text></View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['Chat','Membres','Infos'].map(t=>(
            <TouchableOpacity key={t} onPress={()=>setTab(t)}
              style={[styles.tabBtn,tab===t&&{borderColor:guildColor.color+'44',backgroundColor:guildColor.color+'12'}]}>
              <Text style={[styles.tabText,tab===t&&{color:guildColor.color}]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CHAT ── */}
        {tab==='Chat'&&(
          <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
            <ScrollView ref={chatScrollRef} style={styles.chatScroll} showsVerticalScrollIndicator={false}>
              {chatMessages.length===0&&(
                <View style={styles.chatEmptyBox}>
                  <Text style={styles.chatEmptyEmoji}>💬</Text>
                  <Text style={styles.chatEmpty}>Aucun message — brise la glace !</Text>
                </View>
              )}
              {chatMessages.map((msg,i)=>{
                const isMe = msg.uid===uid;
                const rankInfo = RANKS[msg.rank]||RANKS.member;
                return (
                  <View key={i} style={[styles.msgRow,isMe&&styles.msgRowMe]}>
                    {!isMe&&(
                      <View style={[styles.msgAvatar,{backgroundColor:rankInfo.color+'22',borderColor:rankInfo.color+'44'}]}>
                        <Text style={styles.msgAvatarText}>{msg.name?.[0]?.toUpperCase()||'?'}</Text>
                      </View>
                    )}
                    <View style={styles.msgContent}>
                      {!isMe&&(
                        <View style={styles.msgMeta}>
                          <Text style={[styles.msgName,{color:rankInfo.color}]}>{msg.name}</Text>
                          <Text style={[styles.msgRank,{color:rankInfo.color+'88'}]}>{rankInfo.emoji}</Text>
                        </View>
                      )}
                      <LinearGradient colors={isMe?[guildColor.color+'30',guildColor.color+'12']:['#0d1220','#07090f']}
                        style={[styles.msgBubble,{borderColor:isMe?guildColor.color+'44':'#1e2d4a'}]}>
                        <Text style={[styles.msgText,isMe&&{color:guildColor.color}]}>{msg.text}</Text>
                        <Text style={styles.msgTime}>
                          {new Date(msg.at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput style={styles.chatInput} value={chatInput} onChangeText={setChatInput}
                placeholder="Message à la guilde..." placeholderTextColor="#4a6080"
                onSubmitEditing={handleSendMessage} returnKeyType="send"/>
              <TouchableOpacity onPress={handleSendMessage}
                style={[styles.sendBtn,{backgroundColor:guildColor.color+'22',borderColor:guildColor.color+'44'}]}>
                <Text style={[styles.sendBtnText,{color:guildColor.color}]}>→</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── MEMBRES ── */}
        {tab==='Membres'&&(
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.sectionLabel}>{members.length} MEMBRES</Text>
            {sortedMembers.map(([memberId,member])=>{
              const rank = RANKS[member.rank]||RANKS.member;
              const isMe = memberId===uid;
              return (
                <TouchableOpacity key={memberId}
                  onPress={()=>canManage&&!isMe&&setSelectedMember({id:memberId,...member})}
                  disabled={!canManage||isMe}
                  style={[styles.memberRow,{borderColor:rank.color+'33',backgroundColor:rank.color+'08'}]}>
                  <View style={[styles.memberAvatar,{backgroundColor:rank.color+'22',borderColor:rank.color+'55'}]}>
                    <Text style={[styles.memberAvatarText,{color:rank.color}]}>{member.name?.[0]?.toUpperCase()||'?'}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}{isMe?' (moi)':''}</Text>
                      {isMe&&<View style={[styles.meBadge,{backgroundColor:guildColor.color+'22',borderColor:guildColor.color+'44'}]}><Text style={[styles.meBadgeText,{color:guildColor.color}]}>MOI</Text></View>}
                    </View>
                    <Text style={[styles.memberRank,{color:rank.color}]}>{rank.emoji} {rank.label}</Text>
                  </View>
                  <View style={styles.memberScoreArea}>
                    <Text style={[styles.memberScore,{color:'#ffd700'}]}>{(member.score||0).toLocaleString()}</Text>
                    <Text style={styles.memberScoreLbl}>pts</Text>
                  </View>
                  {canManage&&!isMe&&<Text style={styles.memberArrow}>›</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── INFOS ── */}
        {tab==='Infos'&&(
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <LinearGradient colors={guildColor.gradient}
              style={[styles.infoCard,{borderColor:guildColor.color+'44'}]}>
              <Text style={styles.infoEmoji}>{myGuild?.emblem}</Text>
              <Text style={[styles.infoName,{color:guildColor.color}]}>{myGuild?.name}</Text>
              {myGuild?.description&&<Text style={styles.infoDesc}>{myGuild.description}</Text>}
              <View style={styles.infoStats}>
                <View style={styles.infoStatBox}>
                  <Text style={[styles.infoStatVal,{color:'#00e5ff'}]}>{members.length}</Text>
                  <Text style={styles.infoStatLbl}>Membres</Text>
                </View>
                <View style={styles.infoStatBox}>
                  <Text style={[styles.infoStatVal,{color:'#ffd700'}]}>{guildScore.toLocaleString()}</Text>
                  <Text style={styles.infoStatLbl}>Score total</Text>
                </View>
                <View style={styles.infoStatBox}>
                  <Text style={[styles.infoStatVal,{color:'#39ff8f'}]}>
                    {members.reduce((a,[,m])=>a+(m.wins||0),0)}
                  </Text>
                  <Text style={styles.infoStatLbl}>Victoires</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Top membres */}
            <Text style={styles.sectionLabel}>🏆 CLASSEMENT GUILDE</Text>
            {[...members].sort((a,b)=>(b[1].score||0)-(a[1].score||0)).map(([id,m],i)=>{
              const rank=RANKS[m.rank]||RANKS.member;
              const medals=['🥇','🥈','🥉'];
              return (
                <View key={id} style={[styles.rankRow,{borderColor:rank.color+'22'}]}>
                  <Text style={styles.rankPos}>{medals[i]||`#${i+1}`}</Text>
                  <View style={[styles.rankAvatar,{backgroundColor:rank.color+'22',borderColor:rank.color+'44'}]}>
                    <Text style={[styles.rankAvatarText,{color:rank.color}]}>{m.name?.[0]?.toUpperCase()||'?'}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={styles.rankName}>{m.name}{id===uid?' ★':''}</Text>
                    <Text style={[styles.rankRankText,{color:rank.color}]}>{rank.emoji} {rank.label}</Text>
                  </View>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={[styles.rankScore,{color:'#ffd700'}]}>{(m.score||0).toLocaleString()}</Text>
                    <Text style={styles.rankScoreLbl}>pts</Text>
                  </View>
                </View>
              );
            })}

            {/* Fondateur */}
            <View style={styles.founderBox}>
              <Text style={styles.founderLabel}>Fondée par</Text>
              <Text style={[styles.founderName,{color:guildColor.color}]}>👑 {myGuild?.presidentName}</Text>
              <Text style={styles.founderDate}>
                {new Date(myGuild?.createdAt||0).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
              </Text>
            </View>

            <TouchableOpacity onPress={handleLeave} style={styles.leaveBtn}>
              <Text style={styles.leaveBtnText}>
                {isPresident?'⚠️ Dissoudre la guilde':'← Quitter la guilde'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Modal membre */}
        <Modal visible={!!selectedMember} transparent animationType="fade" onRequestClose={()=>setSelectedMember(null)}>
          <View style={styles.modalOverlay}>
            {selectedMember&&(
              <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
                <View style={[styles.modalAvatar,{backgroundColor:RANKS[selectedMember.rank]?.color+'22',borderColor:RANKS[selectedMember.rank]?.color+'44'}]}>
                  <Text style={styles.modalAvatarText}>{selectedMember.name?.[0]?.toUpperCase()||'?'}</Text>
                </View>
                <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                <Text style={[styles.modalRank,{color:RANKS[selectedMember.rank]?.color}]}>
                  {RANKS[selectedMember.rank]?.emoji} {RANKS[selectedMember.rank]?.label}
                </Text>
                <Text style={styles.modalScore}>{(selectedMember.score||0).toLocaleString()} pts</Text>

                {isPresident&&selectedMember.rank!=='vice_president'&&(
                  <TouchableOpacity onPress={()=>handlePromote(selectedMember.id,'vice_president')} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>⭐ Promouvoir Vice-Président</Text>
                  </TouchableOpacity>
                )}
                {isPresident&&selectedMember.rank==='vice_president'&&(
                  <TouchableOpacity onPress={()=>handlePromote(selectedMember.id,'member')} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>🔵 Rétrograder Membre</Text>
                  </TouchableOpacity>
                )}
                {canManage&&selectedMember.rank!=='president'&&(
                  <TouchableOpacity onPress={()=>handleKick(selectedMember.id)}
                    style={[styles.modalBtn,{borderColor:'#ff444444',backgroundColor:'#ff444415'}]}>
                    <Text style={[styles.modalBtnText,{color:'#ff4444'}]}>✕ Exclure</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={()=>setSelectedMember(null)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:5,textAlign:'center',paddingTop:16,marginBottom:12},
  centered:{flex:1,alignItems:'center',justifyContent:'center',gap:16,padding:16},
  loadingText:{color:'#4a6080',fontSize:14},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  // No guild
  noGuildInfoRow:{flexDirection:'row',gap:8,width:'100%'},
  noGuildInfoCard:{flex:1,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:10,alignItems:'center',gap:4},
  noGuildInfoText:{color:'#4a6080',fontSize:9,textAlign:'center',fontWeight:'700',letterSpacing:0.5},
  noGuildEmoji:{fontSize:60},
  noGuildTitle:{color:'#fff',fontSize:20,fontWeight:'900'},
  noGuildText:{color:'#4a6080',fontSize:13,textAlign:'center',lineHeight:20},
  bigBtn:{width:'100%',borderRadius:16,overflow:'hidden'},
  bigBtnGrad:{alignItems:'center',paddingVertical:18,borderWidth:1,borderColor:'#ffd70033',borderRadius:16},
  bigBtnText:{color:'#ffd700',fontSize:16,fontWeight:'900',letterSpacing:1},
  bigBtnSub:{color:'rgba(255,215,0,0.5)',fontSize:10,letterSpacing:1},
  // Back
  backBtn:{paddingTop:16,paddingBottom:4},
  backBtnText:{color:'#00e5ff',fontSize:14,fontWeight:'700'},
  // Create
  createScroll:{gap:14,paddingBottom:32},
  createLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,textTransform:'uppercase',fontWeight:'700'},
  emblemGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  emblemBtn:{width:48,height:48,borderRadius:12,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220',alignItems:'center',justifyContent:'center'},
  emblemBtnActive:{borderColor:'#ffd70088',backgroundColor:'#ffd70022'},
  emblemText:{fontSize:24},
  colorRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  colorBtn:{borderWidth:1.5,borderRadius:10,paddingHorizontal:10,paddingVertical:6},
  colorBtnText:{fontSize:11,fontWeight:'700'},
  createInput:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:14,color:'#fff',fontSize:15},
  guildPreview:{borderWidth:1,borderRadius:18,padding:18,alignItems:'center',gap:6},
  guildPreviewEmoji:{fontSize:40},
  guildPreviewName:{fontSize:20,fontWeight:'900',letterSpacing:2},
  guildPreviewDesc:{color:'rgba(255,255,255,0.5)',fontSize:12,fontStyle:'italic',textAlign:'center'},
  guildPreviewMeta:{color:'rgba(255,255,255,0.3)',fontSize:11},
  createBtn:{borderRadius:16,overflow:'hidden'},
  createBtnGrad:{alignItems:'center',paddingVertical:18,borderWidth:1,borderColor:'rgba(255,255,255,0.1)',borderRadius:16},
  createBtnText:{fontSize:16,fontWeight:'900',letterSpacing:2},
  // Browse
  searchInput:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:14,color:'#fff',fontSize:15,marginBottom:10},
  scroll:{gap:10,paddingBottom:24},
  emptyText:{color:'#4a6080',fontSize:13,textAlign:'center',paddingVertical:20},
  guildCard:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:18,padding:14,gap:12},
  guildCardEmoji:{fontSize:28},
  guildCardInfo:{flex:1,gap:4},
  guildCardName:{fontSize:15,fontWeight:'900'},
  guildCardDesc:{color:'rgba(255,255,255,0.4)',fontSize:11},
  guildCardStats:{flexDirection:'row',gap:10},
  guildCardMeta:{color:'rgba(255,255,255,0.4)',fontSize:10},
  joinBtn:{borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:8},
  joinBtnText:{fontSize:12,fontWeight:'800'},
  // Guild header
  guildHeader:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:18,padding:14,marginBottom:10},
  guildHeaderEmoji:{fontSize:34},
  guildHeaderInfo:{flex:1,gap:2},
  guildHeaderName:{fontSize:17,fontWeight:'900',letterSpacing:1},
  guildHeaderMetaRow:{flexDirection:'row',gap:6,marginTop:2},
  guildMetaPill:{borderWidth:1,borderRadius:8,paddingHorizontal:7,paddingVertical:2},
  guildMetaPillText:{fontSize:10,fontWeight:'700'},
  guildHeaderMeta:{color:'rgba(255,255,255,0.4)',fontSize:11},
  guildHeaderDesc:{color:'rgba(255,255,255,0.3)',fontSize:10,fontStyle:'italic'},
  myRankBadge:{borderWidth:1,borderRadius:12,paddingHorizontal:8,paddingVertical:6,alignItems:'center',gap:2},
  myRankText:{fontSize:18},
  myRankLabel:{fontSize:8,fontWeight:'800',letterSpacing:1},
  // Feedback
  feedbackBox:{backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:12,padding:8,alignItems:'center',marginBottom:8},
  feedbackText:{color:'#39ff8f',fontSize:12,fontWeight:'700'},
  // Tabs
  tabRow:{flexDirection:'row',gap:8,marginBottom:10},
  tabBtn:{flex:1,alignItems:'center',paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  tabText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  // Chat
  chatScroll:{flex:1,marginBottom:8},
  chatEmptyBox:{alignItems:'center',gap:8,paddingVertical:40},
  chatEmptyEmoji:{fontSize:36},
  chatEmpty:{color:'#4a6080',fontSize:13,fontStyle:'italic'},
  msgRow:{flexDirection:'row',gap:8,marginVertical:4,alignItems:'flex-end'},
  msgRowMe:{flexDirection:'row-reverse'},
  msgAvatar:{width:32,height:32,borderRadius:16,borderWidth:1,alignItems:'center',justifyContent:'center'},
  msgAvatarText:{fontSize:13,fontWeight:'900',color:'#fff'},
  msgContent:{maxWidth:'75%',gap:3},
  msgMeta:{flexDirection:'row',alignItems:'center',gap:4},
  msgName:{fontSize:10,fontWeight:'700'},
  msgRank:{fontSize:12},
  msgBubble:{borderWidth:1,borderRadius:16,padding:10,gap:2},
  msgText:{color:'#c8daf0',fontSize:14,lineHeight:20},
  msgTime:{fontSize:9,color:'#4a6080',alignSelf:'flex-end'},
  chatInputRow:{flexDirection:'row',gap:8,paddingBottom:8},
  chatInput:{flex:1,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,paddingHorizontal:14,paddingVertical:12,color:'#fff',fontSize:14},
  sendBtn:{borderWidth:1,borderRadius:14,paddingHorizontal:16,justifyContent:'center'},
  sendBtnText:{fontSize:18,fontWeight:'900'},
  // Members
  memberRow:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:16,padding:12,backgroundColor:'#0d1220'},
  memberAvatar:{width:46,height:46,borderRadius:23,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  memberAvatarText:{fontSize:18,fontWeight:'900'},
  memberInfo:{flex:1,gap:3},
  memberNameRow:{flexDirection:'row',alignItems:'center',gap:6},
  memberName:{color:'#c8daf0',fontSize:14,fontWeight:'700'},
  meBadge:{borderWidth:1,borderRadius:6,paddingHorizontal:5,paddingVertical:1},
  meBadgeText:{fontSize:7,fontWeight:'900'},
  memberRank:{fontSize:11,fontWeight:'700'},
  memberScoreArea:{alignItems:'flex-end'},
  memberScore:{fontSize:14,fontWeight:'900'},
  memberScoreLbl:{fontSize:8,color:'#4a6080'},
  memberArrow:{color:'#4a6080',fontSize:18},
  // Info
  infoCard:{borderWidth:1,borderRadius:20,padding:20,alignItems:'center',gap:8},
  infoEmoji:{fontSize:48},
  infoName:{fontSize:22,fontWeight:'900',letterSpacing:2},
  infoDesc:{color:'rgba(255,255,255,0.4)',fontSize:13,fontStyle:'italic',textAlign:'center'},
  infoStats:{flexDirection:'row',gap:24,marginTop:8},
  infoStatBox:{alignItems:'center',gap:2},
  infoStatVal:{fontSize:22,fontWeight:'900'},
  infoStatLbl:{fontSize:9,color:'rgba(255,255,255,0.3)',letterSpacing:1},
  rankRow:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:12,backgroundColor:'#0d1220'},
  rankPos:{fontSize:20,width:30,textAlign:'center'},
  rankAvatar:{width:38,height:38,borderRadius:19,borderWidth:1,alignItems:'center',justifyContent:'center'},
  rankAvatarText:{fontSize:16,fontWeight:'900'},
  rankName:{color:'#c8daf0',fontSize:13,fontWeight:'700'},
  rankRankText:{fontSize:10,fontWeight:'700'},
  rankScore:{fontSize:16,fontWeight:'900'},
  rankScoreLbl:{fontSize:9,color:'#4a6080'},
  founderBox:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:14,alignItems:'center',gap:4},
  founderLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,textTransform:'uppercase'},
  founderName:{fontSize:16,fontWeight:'800'},
  founderDate:{fontSize:11,color:'#4a6080'},
  leaveBtn:{backgroundColor:'#ff444422',borderWidth:1,borderColor:'#ff444444',borderRadius:14,padding:14,alignItems:'center'},
  leaveBtnText:{color:'#ff4444',fontSize:13,fontWeight:'700'},
  // Modal
  modalOverlay:{flex:1,backgroundColor:'#000000cc',justifyContent:'center',padding:24},
  modalBox:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:24,padding:24,alignItems:'center',gap:10},
  modalAvatar:{width:64,height:64,borderRadius:32,borderWidth:2,alignItems:'center',justifyContent:'center'},
  modalAvatarText:{fontSize:28,fontWeight:'900',color:'#fff'},
  modalTitle:{color:'#fff',fontSize:18,fontWeight:'900'},
  modalRank:{fontSize:14,fontWeight:'700'},
  modalScore:{color:'#ffd700',fontSize:16,fontWeight:'700'},
  modalBtn:{width:'100%',borderWidth:1,borderColor:'#ffd70044',backgroundColor:'#ffd70015',borderRadius:14,padding:14,alignItems:'center'},
  modalBtnText:{color:'#ffd700',fontSize:14,fontWeight:'700'},
  modalCancel:{padding:12},
  modalCancelText:{color:'#4a6080',fontSize:13},
  disabled:{opacity:0.4},
});
// screens/BreedingScreen.js — Élevage amélioré V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Dimensions, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, get, onValue } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES, CREATURES, SHINY_CREATURES, CREATURE_LIST } from '../data/creatures';
import { addXp, XP_REWARDS } from '../store/xpService';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');

const NURSERY_SLOTS = [
  { id:1, free:true,  cost:0   },
  { id:2, free:true,  cost:0   },
  { id:3, free:true,  cost:0   },
  { id:4, free:false, cost:50  },
  { id:5, free:false, cost:100 },
];

function getCompatibility(idA, idB) {
  const a=ALL_CREATURES[idA], b=ALL_CREATURES[idB];
  if (!a||!b||idA===idB||a.isShiny||b.isShiny) return 0;
  const typeA=a.type.split(' · ')[0], typeB=b.type.split(' · ')[0];
  if (typeA===typeB) return 100;
  const compat = {
    'Feu':['Lumière','Foudre'],'Eau':['Glace','Lumière'],
    'Terre':['Feu','Roche'],'Foudre':['Vent','Feu'],
    'Nature':['Eau','Lumière'],'Glace':['Eau','Vent'],
    'Ombre':['Fantôme','Lumière'],'Lumière':['Solaire','Cosmique'],
  };
  if (compat[typeA]?.includes(typeB)||compat[typeB]?.includes(typeA)) return 60;
  return 20;
}

function getCompatLabel(pct) {
  if (pct>=100) return {label:'💕 Parfaite',   color:'#ff69b4'};
  if (pct>=60)  return {label:'✦ Excellente',  color:'#39ff8f'};
  if (pct>=20)  return {label:'○ Moyenne',     color:'#ffd700'};
  return              {label:'⚠ Faible',      color:'#ff4444'};
}

function calculateOffspring(idA, idB) {
  const a=ALL_CREATURES[idA], b=ALL_CREATURES[idB];
  if (!a||!b) return null;
  const hybrid = {
    hp:  Math.round((a.stats.hp +b.stats.hp) /2*(0.9+Math.random()*0.3)),
    atk: Math.round((a.stats.atk+b.stats.atk)/2*(0.9+Math.random()*0.3)),
    def: Math.round((a.stats.def+b.stats.def)/2*(0.9+Math.random()*0.3)),
    spd: Math.round((a.stats.spd+b.stats.spd)/2*(0.9+Math.random()*0.3)),
  };
  hybrid.maxHp = hybrid.hp;
  const rarityOrder=['common','uncommon','rare','legendary'];
  const rankA=rarityOrder.indexOf(a.rarity), rankB=rarityOrder.indexOf(b.rarity);
  const base = rankA>=rankB?a:b;
  const shinyChance=(rankA+rankB)*0.04;
  if (Math.random()<shinyChance) {
    const shinyId=`${base.id}_shiny`;
    if (SHINY_CREATURES[shinyId]) return {...SHINY_CREATURES[shinyId],stats:hybrid,isShiny:true,fromBreeding:true};
  }
  if (Math.random()<0.1) {
    const pool=CREATURE_LIST.filter(c=>c.id!==idA&&c.id!==idB);
    return {...pool[Math.floor(Math.random()*pool.length)],stats:hybrid,isMutant:true,fromBreeding:true};
  }
  return {...base,stats:hybrid,fromBreeding:true};
}

function getHatchTime(idA, idB) {
  const times={common:60,uncommon:120,rare:300,legendary:600};
  const a=ALL_CREATURES[idA], b=ALL_CREATURES[idB];
  return Math.round(((times[a?.rarity]||60)+(times[b?.rarity]||60))/2);
}

function formatTime(s) {
  const m=Math.floor(s/60),sec=Math.floor(s%60);
  return m>0?`${m}m ${String(sec).padStart(2,'0')}s`:`${sec}s`;
}

// ─── Œuf animé ────────────────────────────────────────────────────
function EggView({ color='#00e5ff', progress=0, cracking=false, pulsing=false, size=80 }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rockAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if (pulsing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim,{toValue:1,duration:600,useNativeDriver:true}),
          Animated.timing(glowAnim,{toValue:0,duration:600,useNativeDriver:true}),
        ])
      ).start();
    }
    if (cracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rockAnim,{toValue:8,  duration:100,useNativeDriver:true}),
          Animated.timing(rockAnim,{toValue:-8, duration:100,useNativeDriver:true}),
          Animated.timing(rockAnim,{toValue:4,  duration:80, useNativeDriver:true}),
          Animated.timing(rockAnim,{toValue:0,  duration:80, useNativeDriver:true}),
          Animated.delay(500),
        ])
      ).start();
    }
  },[cracking,pulsing]);

  const eggW = size*0.68, eggH = size*0.85;

  return (
    <Animated.View style={{
      transform:[{rotate:rockAnim.interpolate({inputRange:[-8,0,8],outputRange:['-8deg','0deg','8deg']})}],
      alignItems:'center',justifyContent:'center',
    }}>
      <Animated.View style={{
        width:eggW,height:eggH,borderRadius:eggW*0.5,
        backgroundColor:'#0a0f18',borderWidth:2,
        borderColor:pulsing
          ?glowAnim.interpolate({inputRange:[0,1],outputRange:[color+'66',color+'ff']})
          :color+'88',
        alignItems:'center',justifyContent:'center',overflow:'hidden',
        shadowColor:color,shadowRadius:pulsing?20:8,shadowOpacity:pulsing?0.8:0.3,
      }}>
        {/* Remplissage progression */}
        {progress>0&&(
          <View style={{
            position:'absolute',bottom:0,left:0,right:0,
            height:`${Math.min(100,progress*100)}%`,
            backgroundColor:color,opacity:0.18,
          }}/>
        )}
        {/* Reflet */}
        <View style={{
          position:'absolute',top:eggH*0.12,left:eggW*0.25,
          width:eggW*0.2,height:eggH*0.15,borderRadius:eggW*0.1,
          backgroundColor:'rgba(255,255,255,0.15)',
        }}/>
        {cracking&&(
          <Animated.Text style={{
            color,fontSize:size*0.28,fontWeight:'900',
            opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.5,1]}),
          }}>✦</Animated.Text>
        )}
        {pulsing&&(
          <Animated.Text style={{
            color,fontSize:size*0.32,fontWeight:'900',
            opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.6,1]}),
            transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.9,1.1]})}],
          }}>✦</Animated.Text>
        )}
        {!cracking&&!pulsing&&progress>0&&(
          <Text style={{color,fontSize:size*0.2,opacity:0.6}}>✦</Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// ─── Nursery Slot ─────────────────────────────────────────────────
function NurserySlot({ slotId, egg, unlocked, cost, onUnlock, onHatch, onSelect, isSelecting }) {
  const [progress, setProgress] = useState(
    egg?Math.min(1,(Date.now()-egg.startedAt)/1000/egg.hatchTime):0
  );

  useEffect(()=>{
    if (!egg) return;
    const interval=setInterval(()=>{
      setProgress(Math.min(1,(Date.now()-egg.startedAt)/1000/egg.hatchTime));
    },1000);
    return ()=>clearInterval(interval);
  },[egg]);

  const ready  = egg&&progress>=1;
  const color  = egg?.offspring?.rarityColor||'#00e5ff';
  const cA     = egg?ALL_CREATURES[egg.parentA]:null;
  const cB     = egg?ALL_CREATURES[egg.parentB]:null;
  const remain = egg?Math.max(0,egg.hatchTime-(Date.now()-egg.startedAt)/1000):0;

  if (!unlocked) return (
    <TouchableOpacity onPress={onUnlock}
      style={[styles.slot,{borderColor:'#ffd70022',backgroundColor:'#0d1220',borderStyle:'dashed'}]}>
      <View style={styles.slotLockedContent}>
        <Text style={{fontSize:28}}>🔒</Text>
        <View style={{flex:1,gap:2}}>
          <Text style={styles.slotLockedTitle}>Emplacement verrouillé</Text>
          <Text style={styles.slotLockedSub}>Débloquer pour +1 œuf en parallèle</Text>
        </View>
        <View style={styles.slotCostBadge}>
          <Text style={styles.slotCostText}>{cost} 💎</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!egg) return (
    <TouchableOpacity onPress={onSelect}
      style={[styles.slot,styles.slotEmpty,isSelecting&&{borderColor:'#00e5ff44',backgroundColor:'#00e5ff08'}]}>
      <Text style={{fontSize:32}}>🥚</Text>
      <Text style={styles.slotEmptyText}>{isSelecting?'Emplacement sélectionné →':'+ Créer un œuf'}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableOpacity onPress={()=>ready&&onHatch(egg)}
      style={[styles.slot,{
        borderColor:ready?color+'88':'#1e2d4a',
        backgroundColor:ready?color+'08':'#0d1220',
      }]}>
      <LinearGradient colors={ready?[color+'12','#07090f']:['#0d1220','#07090f']} style={styles.slotContent}>
        <EggView color={color} progress={progress} cracking={progress>0.8&&!ready} pulsing={ready} size={72}/>
        <View style={styles.slotInfo}>
          {/* Parents */}
          <View style={styles.slotParentsRow}>
            {cA&&<Text style={[styles.slotParent,{color:cA.rarityColor}]} numberOfLines={1}>{cA.name}</Text>}
            <Text style={styles.slotX}>×</Text>
            {cB&&<Text style={[styles.slotParent,{color:cB.rarityColor}]} numberOfLines={1}>{cB.name}</Text>}
          </View>
          {/* Barre */}
          <View style={styles.slotBarBg}>
            <View style={[styles.slotBarFill,{width:`${progress*100}%`,backgroundColor:color}]}/>
          </View>
          {ready
            ?<Text style={[styles.slotReady,{color}]}>✦ Tapez pour éclore !</Text>
            :<Text style={styles.slotTime}>⏱ {formatTime(remain)}</Text>
          }
          {/* Rareté probable */}
          {cA&&cB&&<Text style={styles.slotRarity}>
            {cA.rarityLabel} × {cB.rarityLabel}
          </Text>}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── BreedingScreen ───────────────────────────────────────────────
export default function BreedingScreen() {
  const { collection, crystals, addToCollection, addCrystals } = useGameStore();
  const authCtx = useAuth();
  const uid     = authCtx?.user?.uid||'guest';

  const [eggs, setEggs]             = useState([]);
  const [unlockedSlots, setUnlockedSlots] = useState([1,2,3]);
  const [phase, setPhase]           = useState('nursery');
  const [selectingSlot, setSelectingSlot] = useState(null);
  const [parentA, setParentA]       = useState(null);
  const [parentB, setParentB]       = useState(null);
  const [selectingFor, setSelectingFor] = useState('A');
  const [hatchPhase, setHatchPhase] = useState('none');
  const [result, setResult]         = useState(null);
  const [feedback, setFeedback]     = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
    Animated.loop(
      Animated.sequence([
        Animated.spring(heartAnim,{toValue:1.35,friction:3,useNativeDriver:true}),
        Animated.spring(heartAnim,{toValue:1,   friction:5,useNativeDriver:true}),
        Animated.delay(800),
      ])
    ).start();
  },[]);

  useEffect(()=>{
    const unsub = onValue(ref(db,`breeding/${uid}/eggs`),snap=>{
      if (snap.exists()) setEggs(Object.values(snap.val()));
      else setEggs([]);
    });
    const unsubSlots = onValue(ref(db,`breeding/${uid}/slots`),snap=>{
      if (snap.exists()) setUnlockedSlots(snap.val()||[1,2,3]);
    });
    return ()=>{unsub();unsubSlots();};
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

  function getCompatInfo() {
    if (!parentA||!parentB) return null;
    const pct=getCompatibility(parentA,parentB);
    return {pct,...getCompatLabel(pct)};
  }

  function getSlotEgg(slotId) { return eggs.find(e=>e.slotId===slotId)||null; }

  async function handleUnlockSlot(slotId, cost) {
    if (crystals<cost) { showFeedback('Pas assez de cristaux !'); return; }
    addCrystals(-cost);
    const newSlots=[...unlockedSlots,slotId];
    setUnlockedSlots(newSlots);
    await set(ref(db,`breeding/${uid}/slots`),newSlots).catch(()=>{});
    setShowUnlockModal(null);
    showFeedback(`✓ Emplacement ${slotId} débloqué !`);
  }

  async function handleCreateEgg() {
    if (!parentA||!parentB||!selectingSlot) return;
    const offspring=calculateOffspring(parentA,parentB);
    if (!offspring) return;
    const egg={
      uid:`egg_${Date.now()}`,slotId:selectingSlot,
      parentA,parentB,offspring,
      hatchTime:getHatchTime(parentA,parentB),
      startedAt:Date.now(),progress:0,
    };
    const newEggs=[...eggs.filter(e=>e.slotId!==selectingSlot),egg];
    setEggs(newEggs);
    await set(ref(db,`breeding/${uid}/eggs/${egg.uid}`),egg).catch(()=>{});
    setParentA(null); setParentB(null); setSelectingSlot(null); setSelectingFor('A');
    setPhase('nursery');
    showFeedback(`✓ Œuf créé dans l'emplacement ${selectingSlot} !`);
  }

  async function hatchEgg(egg) {
    if ((Date.now()-egg.startedAt)/1000<egg.hatchTime) return;
    setResult(egg.offspring);
    setHatchPhase('hatching');
    Animated.sequence([
      Animated.timing(shakeAnim,{toValue:16, duration:80,useNativeDriver:true}),
      Animated.timing(shakeAnim,{toValue:-16,duration:80,useNativeDriver:true}),
      Animated.timing(shakeAnim,{toValue:10, duration:80,useNativeDriver:true}),
      Animated.timing(shakeAnim,{toValue:0,  duration:80,useNativeDriver:true}),
    ]).start();
    setTimeout(()=>{
      Animated.sequence([
        Animated.timing(flashAnim,{toValue:1,duration:200,useNativeDriver:true}),
        Animated.timing(flashAnim,{toValue:0,duration:300,useNativeDriver:true}),
      ]).start(()=>{
        setHatchPhase('result');
        scaleAnim.setValue(0);
        Animated.spring(scaleAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
      });
    },700);
    const uid2=auth.currentUser?.uid;
    if (uid2) addXp(uid2,egg.offspring.isShiny?XP_REWARDS.shiny:30,null,null,null);
    addToCollection({...egg.offspring});
    const newEggs=eggs.filter(e=>e.uid!==egg.uid);
    setEggs(newEggs);
    await set(ref(db,`breeding/${uid}/eggs`),
      newEggs.length?Object.fromEntries(newEggs.map(e=>[e.uid,e])):null
    ).catch(()=>{});
  }

  const compat    = getCompatInfo();
  const available = [...new Set(collection.map(c=>c.id))].filter(id=>ALL_CREATURES[id]&&!ALL_CREATURES[id].isShiny);
  const usedSlots = eggs.length;

  // ── HATCHING ──
  if (hatchPhase==='hatching'&&result) {
    return (
      <LinearGradient colors={['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:'white',opacity:flashAnim}]}/>
          <View style={styles.centeredArea}>
            <Text style={styles.hatchTitle}>L'œuf éclot !</Text>
            <Animated.View style={{transform:[{translateX:shakeAnim}]}}>
              <EggView color={result.rarityColor||'#00e5ff'} progress={1} cracking size={130}/>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── RESULT ──
  if (hatchPhase==='result'&&result) {
    const Sprite=SPRITES[result.id?.replace('_shiny','')]||SPRITES.lumikos;
    return (
      <LinearGradient colors={result.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.centeredArea}>
            {result.isShiny&&<Text style={styles.shinyTag}>✨ SHINY !</Text>}
            {result.isMutant&&<Text style={styles.mutantTag}>⚡ MUTATION !</Text>}
            <Text style={styles.hatchTitle}>Créature née !</Text>
            <Animated.View style={{transform:[{scale:scaleAnim}],marginVertical:8,
              shadowColor:result.rarityColor,shadowRadius:30,shadowOpacity:0.8}}>
              <Sprite size={155}/>
            </Animated.View>
            <Text style={[styles.resultName,{color:result.rarityColor}]}>{result.name}</Text>
            <View style={[styles.resultRarityBadge,{backgroundColor:result.rarityColor+'22',borderColor:result.rarityColor+'44'}]}>
              <Text style={[styles.resultRarityText,{color:result.rarityColor}]}>{result.rarityLabel}</Text>
            </View>
            <View style={styles.resultStats}>
              {[['PV',result.stats?.hp,'#39ff8f'],['ATK',result.stats?.atk,'#ff4fa3'],['DEF',result.stats?.def,'#00e5ff'],['VIT',result.stats?.spd,'#ffd700']].map(([l,v,c])=>(
                <View key={l} style={[styles.statChip,{borderColor:c+'44',backgroundColor:c+'10'}]}>
                  <Text style={[styles.statLbl,{color:c+'88'}]}>{l}</Text>
                  <Text style={[styles.statVal,{color:c}]}>{v}</Text>
                </View>
              ))}
            </View>
            {result.fromBreeding&&<Text style={styles.hybridNote}>🧬 Stats hybrides des parents</Text>}
            <TouchableOpacity onPress={()=>setHatchPhase('none')}
              style={[styles.continueBtn,{borderColor:result.rarityColor+'44'}]}>
              <LinearGradient colors={[result.rarityColor+'44',result.rarityColor+'22']} style={styles.continueBtnGrad}>
                <Text style={[styles.continueBtnText,{color:result.rarityColor}]}>→ Continuer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── SÉLECTION PARENTS ──
  if (phase==='select') {
    const cA = parentA?ALL_CREATURES[parentA]:null;
    const cB = parentB?ALL_CREATURES[parentB]:null;
    const SpA = parentA?(SPRITES[parentA.replace('_shiny','')]||SPRITES.lumikos):null;
    const SpB = parentB?(SPRITES[parentB.replace('_shiny','')]||SPRITES.lumikos):null;

    return (
      <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={()=>{setPhase('nursery');setParentA(null);setParentB(null);}} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Nurserie</Text>
          </TouchableOpacity>
          <Text style={styles.title}>ÉLEVAGE</Text>
          <Text style={styles.subtitle}>Emplacement {selectingSlot} · Choisis 2 parents</Text>

          {/* Panel parents */}
          <View style={styles.parentsPanel}>
            <TouchableOpacity onPress={()=>setSelectingFor('A')}
              style={[styles.parentSlot,{
                borderColor:selectingFor==='A'?'#ff69b488':'#1e2d4a',
                backgroundColor:selectingFor==='A'?'#ff69b415':'#0d1220',
              }]}>
              {SpA?<>
                <SpA size={58}/>
                <Text style={[styles.parentName,{color:cA?.rarityColor}]} numberOfLines={1}>{cA?.name}</Text>
                <Text style={styles.parentRarity}>{cA?.rarityLabel}</Text>
              </>:<>
                <Text style={styles.parentPlus}>+</Text>
                <Text style={styles.parentLabel}>Parent A</Text>
              </>}
              {selectingFor==='A'&&<View style={[styles.selectingIndicator,{backgroundColor:'#ff69b4'}]}/>}
            </TouchableOpacity>

            <View style={styles.heartArea}>
              <Animated.Text style={[styles.heart,{transform:[{scale:heartAnim}]}]}>💕</Animated.Text>
              {compat&&(
                <View style={[styles.compatBadge,{backgroundColor:compat.color+'22',borderColor:compat.color+'44'}]}>
                  <Text style={[styles.compatPct,{color:compat.color}]}>{compat.pct}%</Text>
                  <Text style={[styles.compatLbl,{color:compat.color}]}>{compat.label.split(' ')[1]}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={()=>setSelectingFor('B')}
              style={[styles.parentSlot,{
                borderColor:selectingFor==='B'?'#bf5fff88':'#1e2d4a',
                backgroundColor:selectingFor==='B'?'#bf5fff15':'#0d1220',
              }]}>
              {SpB?<>
                <SpB size={58}/>
                <Text style={[styles.parentName,{color:cB?.rarityColor}]} numberOfLines={1}>{cB?.name}</Text>
                <Text style={styles.parentRarity}>{cB?.rarityLabel}</Text>
              </>:<>
                <Text style={styles.parentPlus}>+</Text>
                <Text style={styles.parentLabel}>Parent B</Text>
              </>}
              {selectingFor==='B'&&<View style={[styles.selectingIndicator,{backgroundColor:'#bf5fff'}]}/>}
            </TouchableOpacity>
          </View>

          {/* Info compat */}
          {compat&&parentA&&parentB&&(
            <LinearGradient colors={[compat.color+'15','#07090f']}
              style={[styles.compatCard,{borderColor:compat.color+'33'}]}>
              <Text style={[styles.compatCardLabel,{color:compat.color}]}>{compat.label}</Text>
              <Text style={styles.compatCardTime}>⏱ Éclosion : {formatTime(getHatchTime(parentA,parentB))}</Text>
            </LinearGradient>
          )}

          {/* Bouton créer */}
          <TouchableOpacity onPress={handleCreateEgg} disabled={!parentA||!parentB}
            style={[styles.createBtn,(!parentA||!parentB)&&styles.disabled]}>
            <LinearGradient colors={['#ff69b455','#bf5fff44']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.createBtnGrad}>
              <Text style={styles.createBtnText}>🥚 Créer l'œuf</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Grille créatures */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.creaturesGrid}>
            {available.map(id=>{
              const c=ALL_CREATURES[id]; if(!c) return null;
              const Sp=SPRITES[id.replace('_shiny','')]||SPRITES.lumikos;
              const isOpp=(selectingFor==='B'&&id===parentA)||(selectingFor==='A'&&id===parentB);
              const isSel=id===parentA||id===parentB;
              return (
                <TouchableOpacity key={id} disabled={isOpp}
                  onPress={()=>{
                    if (selectingFor==='A'){setParentA(id);if(!parentB)setSelectingFor('B');}
                    else {if(id===parentA)return;setParentB(id);setSelectingFor('A');}
                  }}
                  style={[styles.creatureCard,{
                    borderColor:isSel?c.rarityColor:'#1e2d4a',
                    backgroundColor:isSel?c.rarityColor+'22':'#0d1220',
                    opacity:isOpp?0.2:1,
                  }]}>
                  <Sp size={46}/>
                  <Text style={[styles.cName,{color:c.rarityColor}]} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.cRarity}>{c.rarityLabel}</Text>
                  {isSel&&<View style={[styles.cSelBadge,{backgroundColor:c.rarityColor}]}><Text style={styles.cSelText}>✓</Text></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── NURSERIE ──
  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>🥚 ÉLEVAGE</Animated.Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.statCard,{borderColor:'#00e5ff33'}]}>
            <Text style={[styles.statCardVal,{color:'#00e5ff'}]}>{usedSlots}</Text>
            <Text style={styles.statCardLbl}>Œufs actifs</Text>
          </LinearGradient>
          <LinearGradient colors={['#0a1a0a','#07090f']} style={[styles.statCard,{borderColor:'#39ff8f33'}]}>
            <Text style={[styles.statCardVal,{color:'#39ff8f'}]}>{unlockedSlots.length}/5</Text>
            <Text style={styles.statCardLbl}>Emplacements</Text>
          </LinearGradient>
          <LinearGradient colors={['#1a1000','#07090f']} style={[styles.statCard,{borderColor:'#ffd70033'}]}>
            <Text style={[styles.statCardVal,{color:'#ffd700'}]}>{crystals} 💎</Text>
            <Text style={styles.statCardLbl}>Cristaux</Text>
          </LinearGradient>
        </View>

        {/* Feedback */}
        {feedback!==''&&(
          <Animated.View style={[styles.feedbackBox,{opacity:feedbackAnim}]}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </Animated.View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.nurseryScroll}>

          <Text style={styles.sectionLabel}>🏠 NURSERIE</Text>
          {NURSERY_SLOTS.map(slot=>{
            const unlocked=unlockedSlots.includes(slot.id);
            const egg=getSlotEgg(slot.id);
            return (
              <View key={slot.id} style={styles.slotWrap}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotNum}>#{slot.id}</Text>
                  {!unlocked&&<View style={styles.slotLockTag}><Text style={styles.slotLockTagText}>🔒 Verrouillé</Text></View>}
                  {unlocked&&!egg&&<View style={styles.slotFreeTag}><Text style={styles.slotFreeTagText}>○ Libre</Text></View>}
                  {unlocked&&egg&&(
                    <View style={[styles.slotActiveTag,{backgroundColor:egg.offspring?.rarityColor+'22',borderColor:egg.offspring?.rarityColor+'44'}]}>
                      <Text style={[styles.slotActiveTagText,{color:egg.offspring?.rarityColor}]}>● En cours</Text>
                    </View>
                  )}
                </View>
                <NurserySlot
                  slotId={slot.id} egg={egg} unlocked={unlocked} cost={slot.cost}
                  onUnlock={()=>setShowUnlockModal(slot)}
                  onHatch={hatchEgg}
                  onSelect={()=>{setSelectingSlot(slot.id);setPhase('select');}}
                  isSelecting={selectingSlot===slot.id}
                />
              </View>
            );
          })}

          {/* Guide */}
          <View style={styles.guideCard}>
            <Text style={styles.sectionLabel}>📖 GUIDE</Text>
            {[
              ['💕','Même type','100% compat — meilleures stats'],
              ['✦','Types proches','60% compat — bons résultats'],
              ['⚡','Mutation','10% chance d\'une créature surprise'],
              ['✨','Shiny','Chance selon rareté des parents'],
            ].map(([emoji,t,d],i)=>(
              <View key={i} style={styles.guideRow}>
                <Text style={styles.guideEmoji}>{emoji}</Text>
                <View style={{flex:1}}>
                  <Text style={styles.guideTitle}>{t}</Text>
                  <Text style={styles.guideDesc}>{d}</Text>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>

        {/* Modal déblocage */}
        <Modal visible={!!showUnlockModal} transparent animationType="fade"
          onRequestClose={()=>setShowUnlockModal(null)}>
          <View style={styles.modalOverlay}>
            {showUnlockModal&&(
              <LinearGradient colors={['#0d1220','#07090f']} style={styles.modalBox}>
                <Text style={{fontSize:44}}>🔓</Text>
                <Text style={styles.modalTitle}>Emplacement {showUnlockModal.id}</Text>
                <Text style={styles.modalDesc}>
                  Débloquer pour faire éclore plusieurs œufs en parallèle.
                </Text>
                <View style={styles.modalCostRow}>
                  <Text style={styles.modalCostLabel}>Coût</Text>
                  <Text style={styles.modalCostVal}>{showUnlockModal.cost} 💎</Text>
                </View>
                <View style={styles.modalCostRow}>
                  <Text style={styles.modalCostLabel}>Ton solde</Text>
                  <Text style={[styles.modalCostVal,{color:crystals>=showUnlockModal.cost?'#39ff8f':'#ff4444'}]}>
                    {crystals} 💎
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={()=>handleUnlockSlot(showUnlockModal.id,showUnlockModal.cost)}
                  disabled={crystals<showUnlockModal.cost}
                  style={[styles.modalBtn,crystals<showUnlockModal.cost&&styles.disabled]}>
                  <LinearGradient colors={['#ffd70044','#ffd70022']} style={styles.modalBtnGrad}>
                    <Text style={styles.modalBtnText}>
                      {crystals>=showUnlockModal.cost?`✓ Débloquer — ${showUnlockModal.cost} 💎`:'Pas assez de cristaux'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setShowUnlockModal(null)} style={{padding:12}}>
                  <Text style={{color:'#4a6080',fontSize:13}}>Annuler</Text>
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
  title:{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:5,textAlign:'center',paddingTop:16},
  subtitle:{fontSize:11,color:'#4a6080',letterSpacing:2,textAlign:'center',marginBottom:8},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  // Stats
  statsRow:{flexDirection:'row',gap:8,marginBottom:8},
  statCard:{flex:1,borderWidth:1,borderRadius:12,padding:10,alignItems:'center',gap:2},
  statCardVal:{fontSize:16,fontWeight:'900'},
  statCardLbl:{fontSize:7,color:'#4a6080',letterSpacing:1,textTransform:'uppercase'},
  // Feedback
  feedbackBox:{backgroundColor:'#39ff8f22',borderWidth:1,borderColor:'#39ff8f44',borderRadius:12,padding:8,alignItems:'center',marginBottom:8},
  feedbackText:{color:'#39ff8f',fontSize:12,fontWeight:'700'},
  nurseryScroll:{gap:14,paddingBottom:32},
  // Slot wrapper
  slotWrap:{gap:4},
  slotHeader:{flexDirection:'row',alignItems:'center',gap:8},
  slotNum:{fontSize:10,color:'#4a6080',fontWeight:'800',letterSpacing:1},
  slotLockTag:{backgroundColor:'#1e2d4a',borderRadius:6,paddingHorizontal:7,paddingVertical:2},
  slotLockTagText:{fontSize:9,color:'#4a6080',fontWeight:'700'},
  slotFreeTag:{backgroundColor:'#39ff8f18',borderRadius:6,paddingHorizontal:7,paddingVertical:2,borderWidth:1,borderColor:'#39ff8f33'},
  slotFreeTagText:{fontSize:9,color:'#39ff8f',fontWeight:'700'},
  slotActiveTag:{borderWidth:1,borderRadius:6,paddingHorizontal:7,paddingVertical:2},
  slotActiveTagText:{fontSize:9,fontWeight:'700'},
  // Slot
  slot:{borderWidth:1,borderRadius:16,overflow:'hidden'},
  slotContent:{flexDirection:'row',alignItems:'center',padding:14,gap:12},
  slotLockedContent:{flexDirection:'row',alignItems:'center',padding:14,gap:12},
  slotLockedTitle:{color:'#4a6080',fontSize:12,fontWeight:'700'},
  slotLockedSub:{color:'#2a3a50',fontSize:10},
  slotCostBadge:{backgroundColor:'#ffd70022',borderWidth:1,borderColor:'#ffd70044',borderRadius:10,paddingHorizontal:10,paddingVertical:5},
  slotCostText:{color:'#ffd700',fontSize:12,fontWeight:'900'},
  slotEmpty:{borderColor:'#1e2d4a',backgroundColor:'#0d1220',padding:20,alignItems:'center',gap:6,borderStyle:'dashed'},
  slotEmptyText:{color:'#4a6080',fontSize:12},
  slotInfo:{flex:1,gap:6},
  slotParentsRow:{flexDirection:'row',alignItems:'center',gap:6},
  slotParent:{fontSize:11,fontWeight:'800',flex:1},
  slotX:{color:'#4a6080',fontSize:10},
  slotBarBg:{height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  slotBarFill:{height:'100%',borderRadius:4},
  slotReady:{fontSize:11,fontWeight:'800',letterSpacing:1},
  slotTime:{color:'#4a6080',fontSize:11},
  slotRarity:{color:'#2a3a50',fontSize:9},
  // Select parents
  backBtn:{paddingTop:14,paddingBottom:6},
  backBtnText:{color:'#00e5ff',fontSize:14,fontWeight:'700'},
  parentsPanel:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
  parentSlot:{flex:1,borderWidth:1.5,borderRadius:16,padding:12,alignItems:'center',gap:4,minHeight:120,justifyContent:'center',position:'relative'},
  parentPlus:{fontSize:28,color:'#1e2d4a'},
  parentLabel:{color:'#4a6080',fontSize:11},
  parentName:{fontSize:9,fontWeight:'900',letterSpacing:0.5,textAlign:'center'},
  parentRarity:{fontSize:8,color:'#4a6080'},
  selectingIndicator:{position:'absolute',top:6,right:6,width:8,height:8,borderRadius:4},
  heartArea:{alignItems:'center',gap:6},
  heart:{fontSize:24},
  compatBadge:{borderWidth:1,borderRadius:12,paddingHorizontal:8,paddingVertical:5,alignItems:'center'},
  compatPct:{fontSize:14,fontWeight:'900'},
  compatLbl:{fontSize:8,fontWeight:'700',letterSpacing:1},
  compatCard:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderRadius:12,paddingHorizontal:14,paddingVertical:10,marginBottom:8},
  compatCardLabel:{fontSize:13,fontWeight:'800'},
  compatCardTime:{color:'#4a6080',fontSize:12},
  createBtn:{borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#ff69b433',marginBottom:10},
  createBtnGrad:{alignItems:'center',paddingVertical:16},
  createBtnText:{color:'#fff',fontSize:15,fontWeight:'900',letterSpacing:2},
  creaturesGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingBottom:32},
  creatureCard:{width:'30%',borderWidth:1.5,borderRadius:14,padding:8,alignItems:'center',gap:3,position:'relative'},
  cName:{fontSize:7,fontWeight:'800',textAlign:'center'},
  cRarity:{fontSize:6,color:'#4a6080'},
  cSelBadge:{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:8,alignItems:'center',justifyContent:'center'},
  cSelText:{color:'#000',fontSize:9,fontWeight:'900'},
  // Guide
  guideCard:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:10},
  guideRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
  guideEmoji:{fontSize:16,width:24,textAlign:'center'},
  guideTitle:{color:'#c8daf0',fontSize:12,fontWeight:'700'},
  guideDesc:{color:'#4a6080',fontSize:11,marginTop:1},
  // Hatch / Result
  centeredArea:{flex:1,alignItems:'center',justifyContent:'center',gap:14,padding:24},
  hatchTitle:{color:'#fff',fontSize:22,fontWeight:'900',letterSpacing:3},
  shinyTag:{color:'#ffd700',fontSize:20,fontWeight:'900',letterSpacing:4},
  mutantTag:{color:'#00e5ff',fontSize:16,fontWeight:'900',letterSpacing:3},
  resultName:{fontSize:26,fontWeight:'900',letterSpacing:3,textAlign:'center'},
  resultRarityBadge:{borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:5},
  resultRarityText:{fontSize:11,fontWeight:'800',letterSpacing:1},
  resultStats:{flexDirection:'row',gap:8},
  statChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center',gap:2},
  statLbl:{fontSize:8,fontWeight:'700'},
  statVal:{fontSize:14,fontWeight:'900'},
  hybridNote:{color:'#4a6080',fontSize:11,fontStyle:'italic'},
  continueBtn:{width:'100%',borderWidth:1,borderRadius:16,overflow:'hidden'},
  continueBtnGrad:{alignItems:'center',paddingVertical:16},
  continueBtnText:{fontSize:15,fontWeight:'900',letterSpacing:2},
  // Modal
  modalOverlay:{flex:1,backgroundColor:'#000000cc',justifyContent:'center',padding:24},
  modalBox:{borderWidth:1,borderColor:'#ffd70033',borderRadius:24,padding:24,alignItems:'center',gap:12},
  modalTitle:{color:'#fff',fontSize:18,fontWeight:'900',textAlign:'center'},
  modalDesc:{color:'#6a84a0',fontSize:13,textAlign:'center',lineHeight:20},
  modalCostRow:{flexDirection:'row',justifyContent:'space-between',width:'100%',paddingHorizontal:8},
  modalCostLabel:{color:'#4a6080',fontSize:13},
  modalCostVal:{fontSize:16,fontWeight:'900',color:'#ffd700'},
  modalBtn:{width:'100%',borderRadius:14,overflow:'hidden'},
  modalBtnGrad:{alignItems:'center',paddingVertical:14,borderWidth:1,borderColor:'#ffd70033',borderRadius:14},
  modalBtnText:{color:'#ffd700',fontSize:14,fontWeight:'800'},
  disabled:{opacity:0.4},
});
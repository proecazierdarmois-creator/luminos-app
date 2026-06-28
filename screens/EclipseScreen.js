// screens/EclipseScreen.js — Éclipse améliorée V2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { db } from '../config/firebase';
import { ref, onValue, runTransaction, get } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES, CREATURES } from '../data/creatures';
import { getPlayerId } from '../store/marketService';
import { addXp, XP_REWARDS } from '../store/xpService';
import { auth } from '../config/firebase';

const { width: SW, height: SH } = Dimensions.get('window');
const ECLIPSE_MAX_CAPTURES = 25;
const ECLIPSE_DURATION_H   = 48;

const RITUAL_STEPS = [
  { id:'collect_all',   label:'Posséder les 3 évolutions de Lumikos', emoji:'📖', check:(d)=>['lumivex','lumirex','luminos'].every(id=>new Set(d.collection.map(c=>c.id)).has(id)) },
  { id:'wins_10',       label:'Remporter 10 combats',                  emoji:'⚔️', check:(d)=>d.wins>=10 },
  { id:'summon_20',     label:'Effectuer 20 invocations',              emoji:'✦',  check:(d)=>d.summonCount>=20 },
  { id:'evolve_once',   label:'Faire évoluer une créature',            emoji:'⚗️', check:(d)=>['lumivex','lumirex','luminos','pyrax','pyralord','aquilon','aquarex'].some(id=>new Set(d.collection.map(c=>c.id)).has(id)) },
  { id:'crystals_50',   label:'Accumuler 50 cristaux',                 emoji:'💎', check:(d)=>d.crystals>=50 },
  { id:'explore_night', label:'Explorer de nuit (21h–5h)',             emoji:'🌙', check:()=>{ const h=new Date().getHours(); return h>=21||h<5; } },
  { id:'shiny_1',       label:'Posséder au moins un Shiny',            emoji:'✨', check:(d)=>d.collection.some(c=>c.isShiny) },
];

function getNextEclipseDates() {
  const y=new Date().getFullYear();
  return [
    new Date(`${y}-03-20T00:00:00`),new Date(`${y}-06-21T00:00:00`),
    new Date(`${y}-09-22T00:00:00`),new Date(`${y}-12-21T00:00:00`),
    new Date(`${y+1}-03-20T00:00:00`),
  ];
}

function getEclipseStatus() {
  const now=new Date();
  for (const d of getNextEclipseDates()) {
    const start=d.getTime(), end=start+ECLIPSE_DURATION_H*3600000;
    if (now>=start&&now<=end) return {active:true,start,end,remaining:end-now.getTime()};
  }
  const next=getNextEclipseDates().find(d=>d>now)||getNextEclipseDates().at(-1);
  return {active:false,next:next.getTime(),countdown:next.getTime()-now.getTime()};
}

function fmt(ms) {
  if (ms<=0) return '00:00:00';
  const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function fmtDays(ms) {
  const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);
  return `${d}j ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
}

// ─── Étoile ───────────────────────────────────────────────────────
function Star({ delay }) {
  const anim=useRef(new Animated.Value(0)).current;
  const x=Math.random()*SW, y=Math.random()*SH*0.55;
  const size=0.8+Math.random()*2.5;
  useEffect(()=>{
    setTimeout(()=>{
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim,{toValue:1,duration:1200+Math.random()*2000,useNativeDriver:true}),
          Animated.timing(anim,{toValue:0.1,duration:1200+Math.random()*2000,useNativeDriver:true}),
        ])
      ).start();
    },delay);
  },[]);
  return <Animated.View style={{position:'absolute',left:x,top:y,width:size,height:size,borderRadius:size/2,backgroundColor:'white',opacity:anim}}/>;
}

// ─── Lune ─────────────────────────────────────────────────────────
function EclipseMoon({ active, glowAnim, rotAnim }) {
  const rot  = rotAnim.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  const rot2 = rotAnim.interpolate({inputRange:[0,1],outputRange:['0deg','-180deg']});
  const rot3 = rotAnim.interpolate({inputRange:[0,1],outputRange:['0deg','120deg']});

  if (!active) return (
    <View style={{width:160,height:160,alignItems:'center',justifyContent:'center'}}>
      <Svg width={160} height={160} viewBox="0 0 160 160">
        <Circle cx="80" cy="80" r="72" fill="#0d1220"/>
        <Circle cx="80" cy="80" r="72" fill="none" stroke="#1e2d4a" strokeWidth="2"/>
        <Circle cx="80" cy="80" r="56" fill="#07090f"/>
        <Circle cx="98" cy="62" r="48" fill="#0d1220"/>
        <Circle cx="60" cy="90" r="8" fill="#1e2d4a" opacity="0.4"/>
        <Circle cx="95" cy="65" r="5" fill="#1e2d4a" opacity="0.3"/>
        <Circle cx="75" cy="105" r="6" fill="#1e2d4a" opacity="0.3"/>
      </Svg>
    </View>
  );

  return (
    <View style={{width:220,height:220,alignItems:'center',justifyContent:'center'}}>
      {/* Halos */}
      <Animated.View style={{position:'absolute',width:220,height:220,borderRadius:110,backgroundColor:'#bf5fff',opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.03,0.10]})}}/>
      <Animated.View style={{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'#bf5fff',opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.05,0.14]})}}/>
      <Animated.View style={{position:'absolute',width:145,height:145,borderRadius:73,backgroundColor:'#bf5fff',opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.07,0.20]})}}/>
      {/* Anneau 1 */}
      <Animated.View style={{position:'absolute',transform:[{rotate:rot}]}}>
        <Svg width={210} height={210} viewBox="0 0 210 210">
          <Circle cx="105" cy="105" r="100" fill="none" stroke="#bf5fff" strokeWidth="1.2" strokeDasharray="5 9" opacity="0.7"/>
          <Circle cx="105" cy="5"   r="6" fill="#ffa500"/>
          <Circle cx="105" cy="205" r="6" fill="#bf5fff"/>
          <Circle cx="5"   cy="105" r="4" fill="#ffd700"/>
          <Circle cx="205" cy="105" r="4" fill="#ffd700"/>
        </Svg>
      </Animated.View>
      {/* Anneau 2 */}
      <Animated.View style={{position:'absolute',transform:[{rotate:rot2}]}}>
        <Svg width={178} height={178} viewBox="0 0 178 178">
          <Circle cx="89" cy="89" r="84" fill="none" stroke="#ffa500" strokeWidth="0.8" strokeDasharray="3 12" opacity="0.45"/>
          <Circle cx="89" cy="5"   r="3.5" fill="#ffd700" opacity="0.9"/>
          <Circle cx="89" cy="173" r="3.5" fill="#ff69b4" opacity="0.9"/>
        </Svg>
      </Animated.View>
      {/* Anneau 3 */}
      <Animated.View style={{position:'absolute',transform:[{rotate:rot3}]}}>
        <Svg width={150} height={150} viewBox="0 0 150 150">
          <Circle cx="75" cy="75" r="70" fill="none" stroke="#ffd700" strokeWidth="0.5" strokeDasharray="2 15" opacity="0.3"/>
          <Circle cx="75" cy="5" r="2" fill="#ffd700" opacity="0.7"/>
        </Svg>
      </Animated.View>
      {/* Lune */}
      <Svg width={145} height={145} viewBox="0 0 145 145">
        {Array.from({length:18}).map((_,i)=>{
          const a=(i*20)*Math.PI/180;
          return <Line key={i}
            x1={72+64*Math.cos(a)} y1={72+64*Math.sin(a)}
            x2={72+80*Math.cos(a)} y2={72+80*Math.sin(a)}
            stroke={i%3===0?'#ffd700':i%3===1?'#ffa500':'#bf5fff'}
            strokeWidth={i%4===0?'2.2':'1.2'} opacity="0.85"
          />;
        })}
        <Circle cx="72" cy="72" r="62" fill="#150030"/>
        <Circle cx="72" cy="72" r="62" fill="none" stroke="#bf5fff" strokeWidth="2.5" opacity="0.95"/>
        <Circle cx="72" cy="72" r="52" fill="#0a0018"/>
        <Circle cx="57" cy="62" r="9"  fill="#1a0030" opacity="0.55"/>
        <Circle cx="82" cy="82" r="7"  fill="#1a0030" opacity="0.45"/>
        <Circle cx="72" cy="47" r="5"  fill="#1a0030" opacity="0.45"/>
        <Circle cx="72" cy="72" r="22" fill="#bf5fff" opacity="0.10"/>
        <Circle cx="72" cy="72" r="11" fill="#bf5fff" opacity="0.16"/>
        <Circle cx="60" cy="77" r="1.8" fill="white" opacity="0.8"/>
        <Circle cx="80" cy="57" r="1.8" fill="white" opacity="0.9"/>
        <Circle cx="87" cy="77" r="1.2" fill="white" opacity="0.7"/>
        <Circle cx="57" cy="84" r="1.2" fill="#ffd700" opacity="0.8"/>
      </Svg>
    </View>
  );
}

// ─── EclipseScreen ────────────────────────────────────────────────
export default function EclipseScreen() {
  const {collection,wins,summonCount,crystals,addToCollection} = useGameStore();
  const [status, setStatus]         = useState(getEclipseStatus());
  const [captureCount, setCaptureCount] = useState(0);
  const [alreadyCaptured, setAlreadyCaptured] = useState(false);
  const [phase, setPhase]           = useState('main');
  const [catching, setCatching]     = useState(false);
  const [captureResult, setCaptureResult] = useState(null);

  const glowAnim  = useRef(new Animated.Value(0)).current;
  const rotAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const playerId = getPlayerId();

  useEffect(()=>{
    const interval=setInterval(()=>setStatus(getEclipseStatus()),1000);
    return ()=>clearInterval(interval);
  },[]);

  useEffect(()=>{
    const unsub=onValue(ref(db,'eclipse/currentSeason/captureCount'),snap=>setCaptureCount(snap.val()||0));
    return unsub;
  },[]);

  useEffect(()=>{
    get(ref(db,`eclipse/currentSeason/capturedBy/${playerId}`)).then(snap=>setAlreadyCaptured(snap.exists()));
  },[]);

  useEffect(()=>{
    if (status.active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim,{toValue:1,duration:1400,useNativeDriver:true}),
          Animated.timing(glowAnim,{toValue:0,duration:1400,useNativeDriver:true}),
        ])
      ).start();
      Animated.loop(Animated.timing(rotAnim,{toValue:1,duration:22000,useNativeDriver:true})).start();
      Animated.loop(
        Animated.sequence([
          Animated.spring(pulseAnim,{toValue:1.06,friction:3,useNativeDriver:true}),
          Animated.spring(pulseAnim,{toValue:1,   friction:5,useNativeDriver:true}),
          Animated.delay(1800),
        ])
      ).start();
    }
    Animated.timing(titleAnim,{toValue:1,duration:700,useNativeDriver:true}).start();
  },[status.active]);

  const gameData      = {collection,wins,summonCount,crystals};
  const ritualProgress= Object.fromEntries(RITUAL_STEPS.map(s=>[s.id,s.check(gameData)]));
  const ritualCount   = Object.values(ritualProgress).filter(Boolean).length;
  const ritualComplete= ritualCount===RITUAL_STEPS.length;
  const placesLeft    = Math.max(0,ECLIPSE_MAX_CAPTURES-captureCount);
  const LuminosSprite = SPRITES.luminos;

  async function handleCapture() {
    if (!status.active||!ritualComplete||alreadyCaptured||captureCount>=ECLIPSE_MAX_CAPTURES||catching) return;
    setCatching(true); setPhase('capturing');
    Animated.sequence([
      Animated.timing(flashAnim,{toValue:1,duration:250,useNativeDriver:true}),
      Animated.timing(flashAnim,{toValue:0,duration:300,useNativeDriver:true}),
      Animated.timing(flashAnim,{toValue:1,duration:200,useNativeDriver:true}),
      Animated.timing(flashAnim,{toValue:0,duration:500,useNativeDriver:true}),
    ]).start();
    try {
      const result=await runTransaction(ref(db,'eclipse/currentSeason/captureCount'),cur=>{
        if ((cur||0)>=ECLIPSE_MAX_CAPTURES) return;
        return (cur||0)+1;
      });
      if (result.committed) {
        await runTransaction(ref(db,`eclipse/currentSeason/capturedBy/${playerId}`),()=>Date.now());
        addToCollection({...CREATURES.luminos});
        setAlreadyCaptured(true); setCaptureResult({...CREATURES.luminos}); setPhase('caught');
        const uid=auth.currentUser?.uid;
        if (uid) addXp(uid,XP_REWARDS.legendary,null,null,null);
        scaleAnim.setValue(0);
        Animated.spring(scaleAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
      } else { setCaptureCount(ECLIPSE_MAX_CAPTURES); setPhase('main'); }
    } catch(e) { console.error(e); setPhase('main'); }
    setCatching(false);
  }

  // ── CAPTURING ──
  if (phase==='capturing') return (
    <LinearGradient colors={['#0a0018','#150030','#0a0018']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:'white',opacity:flashAnim}]}/>
        <View style={styles.centeredArea}>
          <Text style={[styles.capturingText,{color:'#bf5fff'}]}>Rituel en cours...</Text>
          <Animated.View style={{transform:[{scale:pulseAnim}]}}>
            <EclipseMoon active glowAnim={glowAnim} rotAnim={rotAnim}/>
          </Animated.View>
          <View style={styles.dotsRow}>
            {[0,1,2].map(i=>(
              <Animated.View key={i} style={[styles.dot,{
                backgroundColor:'#bf5fff',
                opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.3,1]}),
              }]}/>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── CAUGHT ──
  if (phase==='caught'&&captureResult) return (
    <LinearGradient colors={['#0a0018','#150030','#0a0018']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {Array.from({length:30}).map((_,i)=><Star key={i} delay={i*70}/>)}
        <View style={styles.centeredArea}>
          <Animated.Text style={[styles.caughtStars,{
            opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.5,1]}),
          }]}>✦ ✦ ✦</Animated.Text>
          <Text style={styles.caughtTitle}>LUMINOS CAPTURÉ</Text>
          <Text style={styles.caughtSubtitle}>Tu es parmi les élus de l'Éclipse</Text>
          <Animated.View style={{
            transform:[{scale:scaleAnim}],marginVertical:12,
            shadowColor:'#bf5fff',shadowRadius:40,shadowOpacity:0.9,
          }}>
            <LuminosSprite size={180}/>
          </Animated.View>
          <Animated.Text style={[styles.caughtName,{
            color:'#bf5fff',
            opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]}),
            transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.97,1.03]})}],
          }]}>★ LUMINOS ★</Animated.Text>
          <View style={[styles.caughtTypeBadge,{backgroundColor:'#bf5fff22',borderColor:'#bf5fff44'}]}>
            <Text style={[styles.caughtTypeText,{color:'#bf5fff'}]}>Cosmique · Légendaire</Text>
          </View>
          <View style={styles.caughtStats}>
            {[['PV','145','#39ff8f'],['ATK','130','#ff4fa3'],['DEF','95','#00e5ff'],['VIT','140','#ffd700']].map(([l,v,c])=>(
              <View key={l} style={[styles.statChip,{borderColor:c+'44',backgroundColor:c+'10'}]}>
                <Text style={[styles.statChipLbl,{color:c+'88'}]}>{l}</Text>
                <Text style={[styles.statChipVal,{color:c}]}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.caughtDesc}>L'être primordial qui a donné son nom au jeu.{'\n'}Sa lumière illumine l'univers entier.</Text>
          <Text style={styles.caughtXp}>+80 XP légendaire gagné !</Text>
          <TouchableOpacity onPress={()=>setPhase('main')}
            style={[styles.backBtn,{borderColor:'#bf5fff44'}]}>
            <LinearGradient colors={['#bf5fff44','#bf5fff22']} style={styles.backBtnGrad}>
              <Text style={[styles.backBtnText,{color:'#bf5fff'}]}>→ Retour à l'Éclipse</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── MAIN ──
  const capturePct = (captureCount/ECLIPSE_MAX_CAPTURES)*100;

  return (
    <LinearGradient
      colors={status.active?['#0a0018','#150030','#0a0018']:['#07090f','#0d1220','#07090f']}
      style={styles.container}>
      {status.active&&Array.from({length:22}).map((_,i)=><Star key={i} delay={i*160}/>)}
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Titre */}
          <Animated.Text style={[styles.title,status.active&&{color:'#bf5fff'},
            {opacity:titleAnim,transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-20,0]})}]}]}>
            {status.active?'🌑 ÉCLIPSE ACTIVE':'🌑 ÉCLIPSE'}
          </Animated.Text>

          {status.active&&(
            <Animated.View style={[styles.liveBadge,{
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]}),
              backgroundColor:glowAnim.interpolate({inputRange:[0,1],outputRange:['#bf5fff18','#bf5fff30']}),
            }]}>
              <Text style={styles.liveText}>● EN COURS</Text>
            </Animated.View>
          )}

          {/* Lune */}
          <Animated.View style={status.active?{transform:[{scale:pulseAnim}]}:null}>
            <EclipseMoon active={status.active} glowAnim={glowAnim} rotAnim={rotAnim}/>
          </Animated.View>

          {/* Timer */}
          <LinearGradient
            colors={status.active?['#150030','#0a0018']:['#0d1220','#07090f']}
            style={[styles.timerBox,{borderColor:status.active?'#bf5fff44':'#1e2d4a'}]}>
            {status.active?<>
              <Text style={styles.timerLabel}>TEMPS RESTANT</Text>
              <Text style={[styles.timerValue,{color:'#bf5fff'}]}>{fmt(status.remaining)}</Text>
              {/* Barre captures */}
              <View style={styles.captureBarWrap}>
                <View style={styles.captureBarBg}>
                  <View style={[styles.captureBarFill,{
                    width:`${capturePct}%`,
                    backgroundColor:captureCount>=ECLIPSE_MAX_CAPTURES?'#ff4444':'#bf5fff',
                  }]}/>
                </View>
                <Text style={[styles.captureBarPct,{color:captureCount>=ECLIPSE_MAX_CAPTURES?'#ff4444':'#bf5fff'}]}>
                  {captureCount}/{ECLIPSE_MAX_CAPTURES}
                </Text>
              </View>
              <Text style={styles.captureCountText}>
                {placesLeft>0?`✦ ${placesLeft} places restantes`:'✗ Quota épuisé pour cette éclipse'}
              </Text>
            </>:<>
              <Text style={styles.timerLabel}>PROCHAINE ÉCLIPSE DANS</Text>
              <Text style={[styles.timerValue,{color:'#4a6080',fontSize:26}]}>{fmtDays(status.countdown||0)}</Text>
              <Text style={styles.timerDate}>{new Date(status.next||0).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</Text>
              <Text style={styles.timerHint}>Prépare le Rituel des 7 Gardiens !</Text>
            </>}
          </LinearGradient>

          {/* Bouton capture */}
          {status.active&&(
            <TouchableOpacity onPress={handleCapture}
              disabled={!ritualComplete||alreadyCaptured||captureCount>=ECLIPSE_MAX_CAPTURES||catching}
              style={styles.captureBtn}>
              <LinearGradient
                colors={
                  alreadyCaptured?['#1e2d4a','#0d1828']:
                  captureCount>=ECLIPSE_MAX_CAPTURES?['#3a0000','#1a0000']:
                  !ritualComplete?['#1e2d4a','#0d1828']:
                  ['#bf5fff77','#ffa50066']
                }
                start={{x:0,y:0}} end={{x:1,y:0}} style={styles.captureBtnGrad}>
                <Text style={[styles.captureBtnText,{
                  color:alreadyCaptured?'#4a6080':captureCount>=ECLIPSE_MAX_CAPTURES?'#ff4444':!ritualComplete?'#4a6080':'#fff',
                }]}>
                  {alreadyCaptured?'✓ LUMINOS déjà capturé':
                   captureCount>=ECLIPSE_MAX_CAPTURES?'✗ Quota épuisé (25/25)':
                   !ritualComplete?`Rituel incomplet (${ritualCount}/7)`:
                   catching?'Capture en cours…':'🌑 CAPTURER LUMINOS'}
                </Text>
                {ritualComplete&&!alreadyCaptured&&captureCount<ECLIPSE_MAX_CAPTURES&&(
                  <Text style={styles.captureBtnSub}>Appuie pour invoquer la créature légendaire</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Rituel */}
          <View style={[styles.ritualBox,{borderColor:ritualComplete?'#39ff8f44':'#1e2d4a'}]}>
            <View style={styles.ritualHeader}>
              <Text style={styles.ritualTitle}>✦ RITUEL DES 7 GARDIENS</Text>
              <View style={[styles.ritualBadge,{
                backgroundColor:ritualComplete?'#39ff8f22':'#ffd70015',
                borderColor:ritualComplete?'#39ff8f44':'#ffd70033',
              }]}>
                <Text style={[styles.ritualCount,{color:ritualComplete?'#39ff8f':'#ffd700'}]}>{ritualCount}/7</Text>
              </View>
            </View>

            <View style={styles.ritualBarBg}>
              <View style={[styles.ritualBarFill,{
                width:`${(ritualCount/7)*100}%`,
                backgroundColor:ritualComplete?'#39ff8f':'#ffd700',
              }]}/>
            </View>

            {ritualComplete&&(
              <LinearGradient colors={['#39ff8f18','#39ff8f08']} style={styles.ritualCompleteBox}>
                <Text style={styles.ritualCompleteEmoji}>✓</Text>
                <Text style={styles.ritualCompleteText}>Rituel accompli ! Tu peux capturer LUMINOS.</Text>
              </LinearGradient>
            )}

            {RITUAL_STEPS.map((step,i)=>{
              const done=ritualProgress[step.id];
              return (
                <LinearGradient key={step.id}
                  colors={done?['#39ff8f0a','#39ff8f05']:['#ffffff04','transparent']}
                  style={[styles.ritualRow,{borderColor:done?'#39ff8f22':'#1e2d4a22'}]}>
                  <View style={[styles.ritualIconBox,{
                    backgroundColor:done?'#39ff8f22':'#1e2d4a22',
                    borderColor:done?'#39ff8f55':'#1e2d4a',
                  }]}>
                    <Text style={styles.ritualEmoji}>{step.emoji}</Text>
                  </View>
                  <Text style={[styles.ritualLabel,done&&{color:'#c8daf0'}]}>{step.label}</Text>
                  <View style={[styles.ritualCheck,{
                    backgroundColor:done?'#39ff8f22':'#1e2d4a22',
                    borderColor:done?'#39ff8f55':'#1e2d4a',
                  }]}>
                    <Text style={[styles.ritualCheckText,{color:done?'#39ff8f':'#2a3a50'}]}>{done?'✓':'○'}</Text>
                  </View>
                </LinearGradient>
              );
            })}
          </View>

          {/* Règles */}
          <View style={styles.infoBox}>
            <Text style={styles.sectionLabel}>📜 RÈGLES DE L'ÉCLIPSE</Text>
            {[
              ['🗓️','4 éclipses par an (équinoxes & solstices)'],
              ['⏱️','Durée de 48 heures par éclipse'],
              ['🎯','Maximum 25 captures mondiales par éclipse'],
              ['📖','Le Rituel des 7 Gardiens est obligatoire'],
              ['👤','Un seul LUMINOS par joueur par éclipse'],
              ['💱','Les LUMINOS sont échangeables sur le marché'],
              ['⭐','Capture = +80 XP légendaire'],
            ].map(([e,t],i)=>(
              <View key={i} style={styles.infoRow}>
                <Text style={styles.infoEmoji}>{e}</Text>
                <Text style={styles.infoText}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Preview LUMINOS */}
          <LinearGradient colors={['#150030','#0a0018']}
            style={[styles.previewBox,{borderColor:'#bf5fff44'}]}>
            <Text style={styles.sectionLabel}>🌑 LUMINOS — CRÉATURE LÉGENDAIRE</Text>
            <View style={styles.previewContent}>
              <View style={{shadowColor:'#bf5fff',shadowRadius:20,shadowOpacity:0.7}}>
                <LuminosSprite size={100}/>
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName,{color:'#bf5fff'}]}>LUMINOS</Text>
                <View style={[styles.previewTypeBadge,{backgroundColor:'#bf5fff18',borderColor:'#bf5fff33'}]}>
                  <Text style={[styles.previewTypeText,{color:'#bf5fff'}]}>Cosmique · Légendaire</Text>
                </View>
                <View style={styles.previewStats}>
                  {[['PV','145','#39ff8f'],['ATK','130','#ff4fa3'],['VIT','140','#ffd700']].map(([l,v,c])=>(
                    <View key={l} style={[styles.previewStatChip,{backgroundColor:c+'15',borderColor:c+'33'}]}>
                      <Text style={[styles.previewStatText,{color:c}]}>{l} {v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </LinearGradient>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1},
  scroll:{alignItems:'center',paddingHorizontal:16,paddingVertical:16,gap:16},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,textTransform:'uppercase',fontWeight:'700'},
  title:{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center'},
  liveBadge:{borderWidth:1,borderColor:'#bf5fff44',borderRadius:10,paddingHorizontal:14,paddingVertical:5},
  liveText:{color:'#bf5fff',fontSize:11,fontWeight:'900',letterSpacing:2},
  // Timer
  timerBox:{width:'100%',borderWidth:1,borderRadius:20,padding:18,alignItems:'center',gap:8},
  timerLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase'},
  timerValue:{fontSize:38,fontWeight:'900',letterSpacing:2},
  timerDate:{fontSize:13,color:'#4a6080'},
  timerHint:{fontSize:11,color:'#bf5fff',fontStyle:'italic'},
  captureBarWrap:{width:'100%',flexDirection:'row',alignItems:'center',gap:8},
  captureBarBg:{flex:1,height:8,backgroundColor:'#1e2d4a',borderRadius:6,overflow:'hidden'},
  captureBarFill:{height:'100%',borderRadius:6},
  captureBarPct:{fontSize:11,fontWeight:'700',width:40,textAlign:'right'},
  captureCountText:{fontSize:11,color:'#6a84a0'},
  // Capture btn
  captureBtn:{width:'100%',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#bf5fff44'},
  captureBtnGrad:{alignItems:'center',paddingVertical:22,gap:6},
  captureBtnText:{fontSize:16,fontWeight:'900',letterSpacing:3},
  captureBtnSub:{fontSize:10,color:'rgba(255,255,255,0.5)',letterSpacing:1},
  // Rituel
  ritualBox:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderRadius:20,padding:16,gap:10},
  ritualHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  ritualTitle:{fontSize:10,color:'#6a84a0',letterSpacing:3,fontWeight:'800'},
  ritualBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:4},
  ritualCount:{fontSize:15,fontWeight:'900'},
  ritualBarBg:{height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  ritualBarFill:{height:'100%',borderRadius:4},
  ritualCompleteBox:{borderWidth:1,borderColor:'#39ff8f33',borderRadius:12,padding:12,flexDirection:'row',alignItems:'center',gap:8},
  ritualCompleteEmoji:{color:'#39ff8f',fontSize:18,fontWeight:'900'},
  ritualCompleteText:{color:'#39ff8f',fontSize:12,fontWeight:'700',flex:1},
  ritualRow:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:12,padding:10},
  ritualIconBox:{width:36,height:36,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},
  ritualEmoji:{fontSize:16},
  ritualLabel:{flex:1,color:'#6a84a0',fontSize:12,lineHeight:18},
  ritualCheck:{width:32,height:32,borderRadius:8,borderWidth:1,alignItems:'center',justifyContent:'center'},
  ritualCheckText:{fontSize:14,fontWeight:'900'},
  // Info
  infoBox:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:18,padding:16,gap:8},
  infoRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
  infoEmoji:{fontSize:14,width:22,textAlign:'center'},
  infoText:{flex:1,color:'#4a6080',fontSize:12,lineHeight:20},
  // Preview
  previewBox:{width:'100%',borderWidth:1,borderRadius:18,padding:16,gap:12},
  previewContent:{flexDirection:'row',alignItems:'center',gap:14},
  previewInfo:{flex:1,gap:8},
  previewName:{fontSize:20,fontWeight:'900',letterSpacing:2},
  previewTypeBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:4,alignSelf:'flex-start'},
  previewTypeText:{fontSize:9,fontWeight:'700',letterSpacing:1},
  previewStats:{flexDirection:'row',gap:6,flexWrap:'wrap'},
  previewStatChip:{borderWidth:1,borderRadius:8,paddingHorizontal:7,paddingVertical:3},
  previewStatText:{fontSize:10,fontWeight:'700'},
  // Caught
  centeredArea:{flex:1,alignItems:'center',justifyContent:'center',gap:12,padding:20},
  capturingText:{fontSize:18,fontWeight:'900',letterSpacing:3},
  dotsRow:{flexDirection:'row',gap:12},
  dot:{width:11,height:11,borderRadius:6},
  caughtStars:{fontSize:22,color:'#ffd700',letterSpacing:10,textAlign:'center'},
  caughtTitle:{fontSize:26,fontWeight:'900',color:'#bf5fff',letterSpacing:4,textAlign:'center'},
  caughtSubtitle:{fontSize:12,color:'#6a84a0',letterSpacing:2,textAlign:'center'},
  caughtName:{fontSize:30,fontWeight:'900',letterSpacing:4,textAlign:'center'},
  caughtTypeBadge:{borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:5},
  caughtTypeText:{fontSize:10,fontWeight:'700',letterSpacing:1},
  caughtStats:{flexDirection:'row',gap:8},
  statChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center',gap:2},
  statChipLbl:{fontSize:8,fontWeight:'700'},
  statChipVal:{fontSize:14,fontWeight:'900'},
  caughtDesc:{color:'#6a84a0',fontSize:13,textAlign:'center',lineHeight:22,fontStyle:'italic'},
  caughtXp:{color:'#00e5ff',fontSize:13,fontWeight:'700'},
  backBtn:{width:'100%',borderWidth:1,borderRadius:16,overflow:'hidden'},
  backBtnGrad:{alignItems:'center',paddingVertical:16},
  backBtnText:{fontSize:15,fontWeight:'800',letterSpacing:2},
});
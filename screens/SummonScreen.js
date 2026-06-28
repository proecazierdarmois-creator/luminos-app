// screens/SummonScreen.js — Invocation améliorée V2
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/useGameStore';
import { addXp, XP_REWARDS } from '../store/xpService';
import { auth } from '../config/firebase';
import { SPRITES } from '../components/CreatureCard';
import { rollCreature, CREATURE_LIST } from '../data/creatures';

const { width: SW } = Dimensions.get('window');
const SUMMON_COST = 3;

// ─── Particule ────────────────────────────────────────────────────
function Particle({ color, delay=0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const x = (Math.random()-0.5)*160;
  const y = -20-Math.random()*120;
  const size = 4+Math.random()*7;

  useEffect(()=>{
    setTimeout(()=>{
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim,{toValue:1,duration:800+Math.random()*600,useNativeDriver:true}),
          Animated.timing(anim,{toValue:0,duration:400,useNativeDriver:true}),
        ])
      ).start();
    },delay);
  },[]);

  return (
    <Animated.View style={{
      position:'absolute',width:size,height:size,borderRadius:size/2,
      backgroundColor:color,left:SW/2+x,top:SW*0.38+y,
      opacity:anim.interpolate({inputRange:[0,0.4,1],outputRange:[0,1,0]}),
      transform:[
        {translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-60]})},
        {scale:anim.interpolate({inputRange:[0,0.4,1],outputRange:[0.3,1.4,0.2]})},
      ],
    }}/>
  );
}

export default function SummonScreen() {
  const { crystals, canSummon, summonCreature } = useGameStore();
  const [phase, setPhase]         = useState('idle');
  const [result, setResult]       = useState(null);
  const [history, setHistory]     = useState([]);
  const [multiResults, setMultiResults] = useState([]);
  const [particles, setParticles] = useState([]);

  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const rotAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const flashAnim  = useRef(new Animated.Value(0)).current;
  const spinAnim   = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
    Animated.loop(Animated.timing(rotAnim,{toValue:1,duration:10000,useNativeDriver:true})).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,{toValue:1,duration:1400,useNativeDriver:true}),
        Animated.timing(glowAnim,{toValue:0,duration:1400,useNativeDriver:true}),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.spring(pulseAnim,{toValue:1.06,friction:3,useNativeDriver:true}),
        Animated.spring(pulseAnim,{toValue:1,   friction:3,useNativeDriver:true}),
      ])
    ).start();
  },[]);

  const rot  = rotAnim.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  const rot2 = rotAnim.interpolate({inputRange:[0,1],outputRange:['0deg','-240deg']});
  const rot3 = rotAnim.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']});

  async function handleSummon(multi=false) {
    if (phase!=='idle') return;
    const count = multi?10:1;
    if (crystals<SUMMON_COST*count) return;

    setPhase('spinning');
    spinAnim.setValue(0);
    Animated.timing(spinAnim,{toValue:1,duration:800,useNativeDriver:true}).start();

    setTimeout(()=>{
      const uid = auth.currentUser?.uid;
      if (multi) {
        const results=[];
        for (let i=0;i<count;i++) {
          const creature=rollCreature();
          const entry=summonCreature(creature);
          if (entry) {
            results.push(entry);
            if (uid) addXp(uid,creature.rarity==='legendary'?XP_REWARDS.legendary:XP_REWARDS.summon,null,null,null);
          }
        }
        setMultiResults(results);
        setHistory(h=>[...results,...h].slice(0,20));
        setResult(null);
        setPhase('multi');
        scaleAnim.setValue(0);
        // Particules pour les rares/légendaires
        const hasLeg = results.some(r=>r.rarity==='legendary');
        const hasRare = results.some(r=>r.rarity==='rare'||r.isShiny);
        if (hasLeg||hasRare) {
          const ps = Array.from({length:16},(_,i)=>({id:i,color:hasLeg?'#ffd700':'#bf5fff',delay:i*60}));
          setParticles(ps);
          setTimeout(()=>setParticles([]),2000);
        }
        Animated.spring(scaleAnim,{toValue:1,friction:4,useNativeDriver:true}).start();
      } else {
        const creature=rollCreature();
        const entry=summonCreature(creature);
        if (!entry){setPhase('idle');return;}
        if (uid) addXp(uid,creature.rarity==='legendary'?XP_REWARDS.legendary:creature.isShiny?XP_REWARDS.shiny:XP_REWARDS.summon,null,null,null);
        setResult(entry);
        setMultiResults([]);
        setHistory(h=>[entry,...h].slice(0,20));
        setPhase('result');
        scaleAnim.setValue(0);
        // Flash + particules selon rareté
        if (entry.rarity==='legendary'||entry.isShiny) {
          Animated.sequence([
            Animated.timing(flashAnim,{toValue:1,duration:150,useNativeDriver:true}),
            Animated.timing(flashAnim,{toValue:0,duration:250,useNativeDriver:true}),
          ]).start();
          const color = entry.isShiny?'#ff69b4':'#ffd700';
          const ps = Array.from({length:20},(_,i)=>({id:i,color,delay:i*50}));
          setParticles(ps);
          setTimeout(()=>setParticles([]),2000);
        }
        Animated.spring(scaleAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
      }
    }, 900);
  }

  function reset() {
    setPhase('idle'); setResult(null); setMultiResults([]);
    scaleAnim.setValue(0); setParticles([]);
  }

  const ResultSprite = result?(SPRITES[result.id?.replace('_shiny','')]||SPRITES.lumikos):null;
  const portalColor  = result?.rarityColor||'#00e5ff';

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      {/* Flash légendaire */}
      <Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:'white',opacity:flashAnim,pointerEvents:'none'}]}/>
      {/* Particules */}
      {particles.map(p=><Particle key={p.id} color={p.color} delay={p.delay}/>)}

      <SafeAreaView style={styles.safe}>
        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>INVOCATION</Animated.Text>
        <Text style={styles.subtitle}>Tire une créature du cosmos</Text>

        {/* Solde */}
        <LinearGradient colors={['#0d1a2e','#07090f']} style={styles.crystalBar}>
          <View>
            <Text style={styles.crystalLbl}>SOLDE</Text>
            <Text style={styles.crystalVal}>💎 {crystals}</Text>
          </View>
          <View style={styles.costBadges}>
            <View style={styles.costBadge}>
              <Text style={styles.costBadgeText}>1× = {SUMMON_COST} 💎</Text>
            </View>
            <View style={[styles.costBadge,{backgroundColor:'#ffd70015',borderColor:'#ffd70033'}]}>
              <Text style={[styles.costBadgeText,{color:'#ffd700'}]}>10× = {SUMMON_COST*10} 💎</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── PORTAIL ── */}
          <View style={styles.portalWrap} pointerEvents="none">
            {/* Anneaux */}
            <Animated.View style={[styles.ring1,{
              transform:[{rotate:rot}],
              borderColor:portalColor,
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.35,0.75]}),
            }]}/>
            <Animated.View style={[styles.ring2,{
              transform:[{rotate:rot2}],
              borderColor:result?.rarityColor||'#ffd700',
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.2,0.5]}),
            }]}/>
            <Animated.View style={[styles.ring3,{
              transform:[{rotate:rot3}],
              borderColor:portalColor,
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.1,0.3]}),
            }]}/>
            {/* Halo */}
            <Animated.View style={[styles.halo,{
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.06,0.22]}),
              backgroundColor:portalColor,
            }]}/>
            {/* Symbole central */}
            {phase!=='result'&&phase!=='spinning'&&(
              <Animated.Text style={[styles.orbSymbol,{
                color:portalColor,
                opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.4,1]}),
                transform:[{rotate:rot},{scale:pulseAnim}],
              }]}>✦</Animated.Text>
            )}
            {/* Spinner */}
            {phase==='spinning'&&(
              <Animated.Text style={[styles.spinText,{
                color:portalColor,
                opacity:spinAnim.interpolate({inputRange:[0,1],outputRange:[1,0.3]}),
                transform:[{rotate:rot},{scale:pulseAnim}],
              }]}>✦ ✦ ✦</Animated.Text>
            )}
            {/* Créature dans le portail */}
            {phase==='result'&&result&&ResultSprite&&(
              <Animated.View style={[styles.orbCreature,{transform:[{scale:scaleAnim}]}]}>
                <ResultSprite size={120}/>
              </Animated.View>
            )}
          </View>

          {/* ── RÉSULTAT SIMPLE ── */}
          {phase==='result'&&result&&(
            <Animated.View style={[styles.resultCard,{
              borderColor:result.rarityColor+'66',
              transform:[{scale:scaleAnim}],
              opacity:scaleAnim,
            }]}>
              <LinearGradient colors={result.bgGradient||['#0d1220','#07090f']} style={styles.resultCardGrad}>
                {result.isShiny&&(
                  <Animated.Text style={[styles.shinyBanner,{
                    opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]}),
                  }]}>✨ SHINY !</Animated.Text>
                )}
                {result.rarity==='legendary'&&<Text style={styles.legBanner}>★ LÉGENDAIRE !</Text>}
                {result.rarity==='rare'&&!result.isShiny&&<Text style={[styles.rareBanner,{color:result.rarityColor}]}>◆ RARE</Text>}

                <Text style={[styles.resultName,{color:result.rarityColor}]}>{result.name}</Text>
                <View style={[styles.typeTag,{backgroundColor:result.rarityColor+'22',borderColor:result.rarityColor+'44'}]}>
                  <Text style={[styles.typeTagText,{color:result.rarityColor}]}>{result.type} · {result.rarityLabel}</Text>
                </View>
                <Text style={styles.resultDesc}>{result.description}</Text>

                <View style={styles.resultStats}>
                  {[['PV',result.stats?.hp,'#39ff8f'],['ATK',result.stats?.atk,'#ff4fa3'],['DEF',result.stats?.def,'#00e5ff'],['VIT',result.stats?.spd,'#ffd700']].map(([l,v,c])=>(
                    <View key={l} style={[styles.statChip,{borderColor:c+'44',backgroundColor:c+'10'}]}>
                      <Text style={[styles.statL,{color:c+'88'}]}>{l}</Text>
                      <Text style={[styles.statV,{color:c}]}>{v}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── RÉSULTAT ×10 ── */}
          {phase==='multi'&&multiResults.length>0&&(
            <Animated.View style={[styles.multiWrap,{opacity:scaleAnim,transform:[{scale:scaleAnim}]}]}>
              {/* Résumé */}
              <View style={styles.multiSummary}>
                {['legendary','rare','uncommon','common'].map(r=>{
                  const count=multiResults.filter(c=>c.rarity===r&&!c.isShiny).length;
                  const shinys=multiResults.filter(c=>c.rarity===r&&c.isShiny).length;
                  const color=r==='legendary'?'#ffd700':r==='rare'?'#bf5fff':r==='uncommon'?'#39ff8f':'#6a84a0';
                  if (!count&&!shinys) return null;
                  return (
                    <View key={r} style={[styles.summaryChip,{backgroundColor:color+'18',borderColor:color+'33'}]}>
                      <Text style={[styles.summaryText,{color}]}>{r==='legendary'?'★':r==='rare'?'◆':r==='uncommon'?'●':'○'} {count+shinys}</Text>
                      {shinys>0&&<Text style={styles.summaryShiny}>✨{shinys}</Text>}
                    </View>
                  );
                })}
              </View>
              <View style={styles.multiGrid}>
                {multiResults.map((c,i)=>{
                  const Sp=SPRITES[c.id?.replace('_shiny','')]||SPRITES.lumikos;
                  return (
                    <LinearGradient key={c.uid||i} colors={c.bgGradient||['#0d1220','#07090f']}
                      style={[styles.multiCard,{borderColor:c.rarityColor+'55'}]}>
                      {c.isShiny&&<Text style={styles.multiShiny}>✨</Text>}
                      {c.rarity==='legendary'&&<Text style={styles.multiLeg}>★</Text>}
                      <Sp size={50}/>
                      <Text style={[styles.multiName,{color:c.rarityColor}]} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.multiRarity}>{c.rarityLabel}</Text>
                    </LinearGradient>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── BOUTONS ── */}
          {phase==='idle'&&(
            <>
              <TouchableOpacity onPress={()=>handleSummon(false)} disabled={!canSummon}
                style={[styles.summonBtn,!canSummon&&styles.disabled]}>
                <LinearGradient colors={['#00e5ff55','#bf5fff44']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGrad}>
                  <Text style={styles.btnText}>✦ INVOQUER</Text>
                  <Text style={styles.btnCost}>{SUMMON_COST} 💎</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={()=>handleSummon(true)} disabled={crystals<SUMMON_COST*10}
                style={[styles.summonBtn,{borderColor:'#ffd70033'},crystals<SUMMON_COST*10&&styles.disabled]}>
                <LinearGradient colors={['#ffd70044','#ffa50033']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGrad}>
                  <Text style={[styles.btnText,{color:'#ffd700'}]}>✦✦ INVOQUER ×10</Text>
                  <Text style={[styles.btnCost,{color:'#ffd70099'}]}>{SUMMON_COST*10} 💎 · Rare garantie</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {phase==='spinning'&&(
            <View style={styles.spinningBox}>
              <Text style={styles.spinningText}>Le cosmos répond...</Text>
            </View>
          )}

          {(phase==='result'||phase==='multi')&&(
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <LinearGradient colors={['#1e2d4a','#0d1828']} style={styles.btnGrad}>
                <Text style={[styles.btnText,{color:'#6a84a0'}]}>↺ Nouvelle invocation</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── TAUX ── */}
          {phase==='idle'&&(
            <View style={styles.ratesBox}>
              <Text style={styles.ratesTitle}>📊 TAUX D'APPARITION</Text>
              {[
                {label:'Common',     color:'#6a84a0', pct:55},
                {label:'Uncommon',   color:'#39ff8f', pct:30},
                {label:'Rare',       color:'#bf5fff', pct:12},
                {label:'Légendaire', color:'#ffd700', pct:3},
              ].map(r=>(
                <View key={r.label} style={styles.rateRow}>
                  <View style={[styles.rateDot,{backgroundColor:r.color}]}/>
                  <Text style={[styles.rateName,{color:r.color}]}>{r.label}</Text>
                  <View style={styles.rateBarBg}>
                    <View style={[styles.rateBarFill,{width:`${r.pct}%`,backgroundColor:r.color}]}/>
                  </View>
                  <Text style={[styles.rateVal,{color:r.color}]}>{r.pct}%</Text>
                </View>
              ))}
              <Text style={styles.shinyNote}>✨ Chance Shiny : 0.5% sur toute invocation</Text>
            </View>
          )}

          {/* ── HISTORIQUE ── */}
          {history.length>0&&(
            <View style={styles.histBox}>
              <Text style={styles.ratesTitle}>🕐 HISTORIQUE ({history.length})</Text>
              <View style={styles.histGrid}>
                {history.slice(0,10).map((c,i)=>{
                  const Sp=SPRITES[c.id?.replace('_shiny','')]||SPRITES.lumikos;
                  return (
                    <View key={c.uid||i} style={[styles.histCard,{borderColor:c.rarityColor+'44',backgroundColor:c.rarityColor+'10'}]}>
                      {c.isShiny&&<Text style={styles.histShiny}>✨</Text>}
                      {c.rarity==='legendary'&&<Text style={styles.histLeg}>★</Text>}
                      <Sp size={36}/>
                      <Text style={[styles.histName,{color:c.rarityColor}]} numberOfLines={1}>{c.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:26,fontWeight:'900',color:'#fff',letterSpacing:8,textAlign:'center',paddingTop:16},
  subtitle:{fontSize:11,color:'#4a6080',letterSpacing:2,textAlign:'center',marginBottom:8},
  // Cristaux
  crystalBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,paddingHorizontal:14,paddingVertical:10,marginBottom:10},
  crystalLbl:{fontSize:7,color:'#4a6080',letterSpacing:2,textTransform:'uppercase'},
  crystalVal:{color:'#ffd700',fontSize:18,fontWeight:'900'},
  costBadges:{flexDirection:'row',gap:6},
  costBadge:{backgroundColor:'#00e5ff12',borderWidth:1,borderColor:'#00e5ff22',borderRadius:8,paddingHorizontal:8,paddingVertical:4},
  costBadgeText:{color:'#00e5ff',fontSize:10,fontWeight:'700'},
  scroll:{alignItems:'center',paddingBottom:32,gap:14},
  // Portail
  portalWrap:{width:220,height:220,alignItems:'center',justifyContent:'center',position:'relative'},
  ring1:{position:'absolute',width:210,height:210,borderRadius:105,borderWidth:1.5,borderStyle:'dashed'},
  ring2:{position:'absolute',width:168,height:168,borderRadius:84,borderWidth:1,borderStyle:'dashed'},
  ring3:{position:'absolute',width:126,height:126,borderRadius:63,borderWidth:0.5,borderStyle:'dashed'},
  halo:{position:'absolute',width:140,height:140,borderRadius:70},
  orbSymbol:{position:'absolute',fontSize:40,fontWeight:'900'},
  spinText:{position:'absolute',fontSize:18,letterSpacing:4,fontWeight:'900'},
  orbCreature:{position:'absolute'},
  // Résultat
  resultCard:{width:'100%',borderWidth:1,borderRadius:22,overflow:'hidden'},
  resultCardGrad:{padding:18,alignItems:'center',gap:8},
  shinyBanner:{color:'#ff69b4',fontSize:18,fontWeight:'900',letterSpacing:4},
  legBanner:{color:'#ffd700',fontSize:16,fontWeight:'900',letterSpacing:3},
  rareBanner:{fontSize:13,fontWeight:'900',letterSpacing:3},
  resultName:{fontSize:24,fontWeight:'900',letterSpacing:3,textAlign:'center'},
  typeTag:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:4},
  typeTagText:{fontSize:10,fontWeight:'700',letterSpacing:1},
  resultDesc:{color:'#6a84a0',fontSize:12,textAlign:'center',fontStyle:'italic',lineHeight:18},
  resultStats:{flexDirection:'row',gap:8,marginTop:4},
  statChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center',gap:2},
  statL:{fontSize:8,fontWeight:'700'},
  statV:{fontSize:14,fontWeight:'900'},
  // Multi
  multiWrap:{width:'100%',gap:10},
  multiSummary:{flexDirection:'row',gap:8,justifyContent:'center',flexWrap:'wrap'},
  summaryChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:5,flexDirection:'row',gap:5,alignItems:'center'},
  summaryText:{fontSize:12,fontWeight:'800'},
  summaryShiny:{fontSize:11},
  multiGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center'},
  multiCard:{width:(SW-80)/5,borderWidth:1,borderRadius:12,padding:6,alignItems:'center',gap:2,position:'relative'},
  multiShiny:{position:'absolute',top:2,right:2,fontSize:9},
  multiLeg:{position:'absolute',top:2,left:2,fontSize:9,color:'#ffd700',fontWeight:'900'},
  multiName:{fontSize:7,fontWeight:'800',textAlign:'center'},
  multiRarity:{fontSize:6,color:'rgba(255,255,255,0.4)'},
  // Boutons
  summonBtn:{width:'100%',borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#00e5ff22'},
  resetBtn:{width:'100%',borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#1e2d4a'},
  btnGrad:{alignItems:'center',paddingVertical:18,gap:4},
  btnText:{color:'#fff',fontSize:16,fontWeight:'900',letterSpacing:2},
  btnCost:{color:'rgba(255,255,255,0.5)',fontSize:11,letterSpacing:1},
  spinningBox:{alignItems:'center',padding:16},
  spinningText:{color:'#4a6080',fontSize:14,fontStyle:'italic',letterSpacing:2},
  disabled:{opacity:0.35},
  // Taux
  ratesBox:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:10},
  ratesTitle:{fontSize:9,color:'#4a6080',letterSpacing:3,textTransform:'uppercase',fontWeight:'700'},
  rateRow:{flexDirection:'row',alignItems:'center',gap:8},
  rateDot:{width:8,height:8,borderRadius:4},
  rateName:{fontSize:12,fontWeight:'700',width:82},
  rateBarBg:{flex:1,height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  rateBarFill:{height:'100%',borderRadius:4},
  rateVal:{fontSize:12,fontWeight:'900',width:32,textAlign:'right'},
  shinyNote:{fontSize:10,color:'#ff69b4',fontStyle:'italic'},
  // Historique
  histBox:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:10},
  histGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  histCard:{width:(SW-80)/5,borderWidth:1,borderRadius:10,padding:6,alignItems:'center',gap:2,position:'relative'},
  histShiny:{position:'absolute',top:2,right:2,fontSize:9},
  histLeg:{position:'absolute',top:2,left:2,fontSize:9,color:'#ffd700',fontWeight:'900'},
  histName:{fontSize:7,fontWeight:'800',textAlign:'center'},
});
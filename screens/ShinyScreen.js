// screens/ShinyScreen.js — Fusion Shiny améliorée V2
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { CREATURES, SHINY_CREATURES, ALL_CREATURES } from '../data/creatures';
import { addXp, XP_REWARDS } from '../store/xpService';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');
const FUSIONABLE_IDS = Object.keys(SHINY_CREATURES).map(k=>k.replace('_shiny',''));

// ─── Particule ────────────────────────────────────────────────────
function Particle({ color, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  const x = (Math.random()-0.5)*SW*0.85;
  const y = -20-Math.random()*120;
  const size = 5+Math.random()*8;
  useEffect(()=>{
    setTimeout(()=>{
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim,{toValue:1,duration:700+Math.random()*500,useNativeDriver:true}),
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
        {translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-70]})},
        {scale:anim.interpolate({inputRange:[0,0.4,1],outputRange:[0.3,1.5,0.2]})},
      ],
    }}/>
  );
}

// ─── ShinyCard ────────────────────────────────────────────────────
function ShinyCard({ creature, size='medium', owned=true }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const float   = useRef(new Animated.Value(0)).current;
  const glowAnim= useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer,{toValue:1,duration:1000,useNativeDriver:true}),
        Animated.timing(shimmer,{toValue:0,duration:1000,useNativeDriver:true}),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float,{toValue:-10,duration:2200,useNativeDriver:true}),
        Animated.timing(float,{toValue:0,  duration:2200,useNativeDriver:true}),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,{toValue:1,duration:800,useNativeDriver:true}),
        Animated.timing(glowAnim,{toValue:0,duration:800,useNativeDriver:true}),
      ])
    ).start();
  },[]);

  const baseId    = creature.baseId||creature.id?.replace('_shiny','');
  const Sprite    = SPRITES[baseId]||SPRITES.lumikos;
  const cardW     = size==='large'?SW-48:148;
  const spriteSize= size==='large'?145:78;

  return (
    <LinearGradient colors={creature.bgGradient||['#0d1220','#07090f']}
      style={[styles.shinyCard,{width:cardW,borderColor:creature.rarityColor+(owned?'88':'33'),opacity:owned?1:0.3}]}>

      {/* Shimmer overlay */}
      {owned&&(
        <Animated.View style={[StyleSheet.absoluteFill,{
          backgroundColor:'white',
          opacity:shimmer.interpolate({inputRange:[0,1],outputRange:[0,0.05]}),
          borderRadius:20,
        }]}/>
      )}

      {/* Étoiles décoratives */}
      {owned&&['starTL','starTR','starBL','starBR'].map((pos,i)=>(
        <Animated.Text key={pos} style={[styles[pos],{
          color:creature.rarityColor,
          opacity:shimmer.interpolate({inputRange:[0,1],outputRange:[0.3,1]}),
          transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.8,1.2]})}],
        }]}>✦</Animated.Text>
      ))}

      {/* Badge SHINY */}
      <Animated.View style={[styles.shinyBadge,{
        backgroundColor:creature.rarityColor+'22',
        borderColor:creature.rarityColor+(owned?'66':'33'),
        opacity:shimmer.interpolate({inputRange:[0,1],outputRange:[0.7,1]}),
      }]}>
        <Text style={[styles.shinyBadgeText,{color:creature.rarityColor}]}>✨ SHINY</Text>
      </Animated.View>

      <Text style={styles.shinyNum}>{creature.number}</Text>

      {/* Sprite flottant */}
      <Animated.View style={{transform:[{translateY:float}],alignItems:'center'}}>
        {owned&&(
          <Animated.View style={{
            shadowColor:creature.rarityColor,
            shadowRadius:glowAnim.interpolate({inputRange:[0,1],outputRange:[15,35]}),
            shadowOpacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.4,0.9]}),
          }}>
            <Sprite size={spriteSize}/>
          </Animated.View>
        )}
        {!owned&&<Sprite size={spriteSize}/>}
      </Animated.View>

      <Text style={[styles.shinyName,{color:creature.rarityColor}]}>{creature.name}</Text>
      {creature.jp&&<Text style={styles.shinyJp}>{creature.jp}</Text>}

      <View style={[styles.shinyTypeBadge,{borderColor:creature.rarityColor+'44',backgroundColor:creature.rarityColor+'15'}]}>
        <Text style={[styles.shinyTypeText,{color:creature.rarityColor}]}>{creature.type}</Text>
      </View>

      {size==='large'&&owned&&(
        <>
          <Text style={styles.shinyDesc}>{creature.description}</Text>
          <View style={styles.miniStats}>
            {[['PV',creature.stats?.hp||0,'#39ff8f'],['ATK',creature.stats?.atk||0,'#ff4fa3'],['DEF',creature.stats?.def||0,'#00e5ff'],['VIT',creature.stats?.spd||0,'#ffd700']].map(([l,v,c])=>(
              <View key={l} style={styles.miniStatRow}>
                <Text style={[styles.miniStatLabel,{color:c}]}>{l}</Text>
                <View style={styles.miniBar}>
                  <View style={[styles.miniFill,{width:`${Math.min(100,(v/160)*100)}%`,backgroundColor:c}]}/>
                </View>
                <Text style={[styles.miniStatVal,{color:c}]}>{v}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {!owned&&(
        <View style={styles.lockOverlay}>
          <Text style={styles.lockText}>🔒</Text>
          <Text style={styles.lockSub}>Non obtenu</Text>
        </View>
      )}
    </LinearGradient>
  );
}

// ─── ShinyScreen ─────────────────────────────────────────────────
export default function ShinyScreen() {
  const { collection, addToCollection } = useGameStore();
  const [tab, setTab]           = useState('Fusion');
  const [selectedId, setSelectedId] = useState(null);
  const [phase, setPhase]       = useState('idle');
  const [result, setResult]     = useState(null);
  const [particles, setParticles] = useState([]);

  const fuseAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  const fusionCounts = FUSIONABLE_IDS.reduce((acc,id)=>{
    acc[id]=collection.filter(c=>c.id===id).length;
    return acc;
  },{});

  const ownedShinyIds = new Set(collection.filter(c=>c.isShiny).map(c=>c.id));
  const totalShinys   = ownedShinyIds.size;
  const totalPossible = Object.keys(SHINY_CREATURES).length;
  const completionPct = Math.round((totalShinys/totalPossible)*100);

  const selectedCreature = selectedId?CREATURES[selectedId]:null;
  const selectedShiny    = selectedId?SHINY_CREATURES[`${selectedId}_shiny`]:null;
  const SelSprite = selectedId?(SPRITES[selectedId]||SPRITES.lumikos):null;

  function handleFuse() {
    if (!selectedId||phase!=='idle') return;
    if ((fusionCounts[selectedId]||0)<3||!selectedShiny) return;
    setPhase('fusing');
    fuseAnim.setValue(0); scaleAnim.setValue(0); glowAnim.setValue(0); flashAnim.setValue(0);

    Animated.timing(fuseAnim,{toValue:1,duration:1500,useNativeDriver:true}).start(()=>{
      Animated.sequence([
        Animated.timing(flashAnim,{toValue:1,duration:200,useNativeDriver:true}),
        Animated.timing(flashAnim,{toValue:0,duration:300,useNativeDriver:true}),
      ]).start(()=>{
        addToCollection({...selectedShiny,isShiny:true});
        setResult(selectedShiny);
        setPhase('result');
        const uid=auth.currentUser?.uid;
        if (uid) addXp(uid,XP_REWARDS.shiny,null,null,null);
        const ps=Array.from({length:20},(_,i)=>({id:i,color:i%3===0?'#ffd700':i%3===1?selectedShiny.rarityColor:'#ff69b4'}));
        setParticles(ps);
        setTimeout(()=>setParticles([]),2000);
        Animated.parallel([
          Animated.spring(scaleAnim,{toValue:1,friction:3,useNativeDriver:true}),
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim,{toValue:1,duration:700,useNativeDriver:true}),
              Animated.timing(glowAnim,{toValue:0,duration:700,useNativeDriver:true}),
            ]),{iterations:8}
          ),
        ]).start();
      });
    });
  }

  const fuseRotate = fuseAnim.interpolate({inputRange:[0,1],outputRange:['0deg','1080deg']});
  const fuseScale  = fuseAnim.interpolate({inputRange:[0,0.4,0.8,1],outputRange:[1,1.3,0.3,0]});
  const fuseOpac   = fuseAnim.interpolate({inputRange:[0,0.7,1],outputRange:[1,1,0]});

  // ── FUSING ──
  if (phase==='fusing'&&selectedCreature&&SelSprite) {
    return (
      <LinearGradient colors={selectedCreature.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:'white',opacity:flashAnim}]}/>
          <View style={styles.animArea}>
            <Text style={[styles.fusingTitle,{color:selectedCreature.rarityColor}]}>Fusion en cours...</Text>
            <Animated.View style={{transform:[{rotate:fuseRotate},{scale:fuseScale}],opacity:fuseOpac,alignItems:'center'}}>
              <SelSprite size={160}/>
            </Animated.View>
            <Text style={[styles.fusingDots,{color:selectedCreature.rarityColor}]}>✦ ✦ ✦</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── RESULT ──
  if (phase==='result'&&result) {
    return (
      <LinearGradient colors={result.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          {particles.map(p=><Particle key={p.id} color={p.color} delay={p.id*60}/>)}
          <View style={styles.animArea}>
            <Animated.Text style={[styles.resultTitle,{
              color:result.rarityColor,
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.6,1]}),
              transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.97,1.03]})}],
            }]}>✨ SHINY OBTENU ✨</Animated.Text>
            <Text style={styles.resultXp}>+{XP_REWARDS.shiny} XP gagné !</Text>
            <Animated.View style={{transform:[{scale:scaleAnim}]}}>
              <ShinyCard creature={result} size="large" owned/>
            </Animated.View>
            <TouchableOpacity onPress={()=>{setPhase('idle');setSelectedId(null);setResult(null);}}
              style={[styles.fuseBtn,{borderColor:result.rarityColor+'44'}]}>
              <LinearGradient colors={[result.rarityColor+'44',result.rarityColor+'22']} style={styles.fuseBtnGrad}>
                <Text style={[styles.fuseBtnText,{color:result.rarityColor}]}>← Retour</Text>
              </LinearGradient>
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
        }]}>✨ SHINY</Animated.Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <LinearGradient colors={['#1a0018','#07090f']} style={[styles.statCard,{borderColor:'#ff69b433'}]}>
            <Text style={[styles.statCardVal,{color:'#ff69b4'}]}>{totalShinys}</Text>
            <Text style={styles.statCardLbl}>Obtenus</Text>
          </LinearGradient>
          <LinearGradient colors={['#1a1000','#07090f']} style={[styles.statCard,{borderColor:'#ffd70033'}]}>
            <Text style={[styles.statCardVal,{color:'#ffd700'}]}>{totalPossible}</Text>
            <Text style={styles.statCardLbl}>Total</Text>
          </LinearGradient>
          <LinearGradient colors={['#0a1a0a','#07090f']} style={[styles.statCard,{borderColor:'#39ff8f33'}]}>
            <Text style={[styles.statCardVal,{color:'#39ff8f'}]}>{completionPct}%</Text>
            <Text style={styles.statCardLbl}>Complétion</Text>
          </LinearGradient>
        </View>

        {/* Barre complétion */}
        <View style={styles.completionWrap}>
          <View style={styles.completionBg}>
            <View style={[styles.completionFill,{width:`${completionPct}%`}]}/>
          </View>
          <Text style={styles.completionPct}>{totalShinys}/{totalPossible}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['Fusion','Pokédex Shiny'].map(t=>(
            <TouchableOpacity key={t} onPress={()=>setTab(t)}
              style={[styles.tabBtn,tab===t&&styles.tabActive]}>
              <Text style={[styles.tabText,tab===t&&styles.tabTextActive]}>
                {t==='Fusion'?'⚗️ Fusion':'✨ Pokédex'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── FUSION ── */}
          {tab==='Fusion'&&(
            <>
              {/* Règles */}
              <View style={styles.ruleBox}>
                <Text style={styles.ruleTitle}>✦ COMMENT FUSIONNER</Text>
                {[
                  ['3 créatures identiques','→ 1 version Shiny unique'],
                  ['Stats supérieures','Les Shinys sont plus puissants'],
                  ['Créatures consommées','Les 3 originales disparaissent'],
                  ['+XP Shiny','Bonus d\'expérience à chaque fusion'],
                ].map(([t,d],i)=>(
                  <View key={i} style={styles.ruleRow}>
                    <Text style={styles.ruleDot}>✦</Text>
                    <View>
                      <Text style={styles.ruleText}>{t}</Text>
                      <Text style={styles.ruleSub}>{d}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Grille */}
              <Text style={styles.sectionLabel}>CRÉATURES FUSIONNABLES</Text>
              <View style={styles.fusionGrid}>
                {FUSIONABLE_IDS.map(id=>{
                  const c=CREATURES[id]; if(!c) return null;
                  const count    = fusionCounts[id]||0;
                  const shinyId  = `${id}_shiny`;
                  const hasShiny = ownedShinyIds.has(shinyId);
                  const canFuse  = count>=3&&!hasShiny;
                  const Sp       = SPRITES[id]||SPRITES.lumikos;
                  const isSel    = selectedId===id;

                  return (
                    <TouchableOpacity key={id} onPress={()=>canFuse&&setSelectedId(isSel?null:id)}
                      disabled={!canFuse}
                      style={[styles.fusionCard,{
                        borderColor:isSel?c.rarityColor:hasShiny?'#ff69b466':count>=3?c.rarityColor+'66':'#1e2d4a',
                        backgroundColor:isSel?c.rarityColor+'22':hasShiny?'#ff69b410':'#0d1220',
                        opacity:canFuse||hasShiny?1:0.4,
                      }]}>
                      <LinearGradient colors={isSel?c.bgGradient||['#0d1220','#07090f']:['#0d1220','#07090f']} style={StyleSheet.absoluteFill}/>
                      <Sp size={54}/>
                      <Text style={[styles.fusionName,{color:c.rarityColor}]} numberOfLines={1}>{c.name}</Text>
                      {/* Dots progression */}
                      <View style={styles.fusionDots}>
                        {[0,1,2].map(i=>(
                          <Animated.View key={i} style={[styles.fusionDot,{
                            backgroundColor:count>i?c.rarityColor:'#1e2d4a',
                            transform:[{scale:count>i?1.1:1}],
                          }]}/>
                        ))}
                      </View>
                      <Text style={[styles.fusionCount,{color:count>=3?c.rarityColor:'#4a6080'}]}>{count}/3</Text>
                      {hasShiny&&<View style={styles.obtainedBadge}><Text style={styles.obtainedText}>✨ Obtenu</Text></View>}
                      {canFuse&&!isSel&&<View style={[styles.readyBadge,{backgroundColor:c.rarityColor+'22',borderColor:c.rarityColor+'44'}]}><Text style={[styles.readyText,{color:c.rarityColor}]}>Prêt !</Text></View>}
                      {isSel&&<View style={[styles.selectedBadge,{backgroundColor:c.rarityColor}]}><Text style={styles.selectedBadgeText}>✓</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Panel fusion */}
              {selectedCreature&&selectedShiny&&SelSprite&&(
                <LinearGradient colors={selectedCreature.bgGradient||['#0d1220','#07090f']}
                  style={[styles.fusePanel,{borderColor:selectedCreature.rarityColor+'55'}]}>
                  <Text style={[styles.fusePanelTitle,{color:selectedCreature.rarityColor}]}>
                    ⚗️ Fusion : {selectedCreature.name}
                  </Text>
                  <View style={styles.fusePanelRow}>
                    <View style={styles.fusePanelSide}>
                      <View style={[styles.spritePill,{borderColor:selectedCreature.rarityColor+'44',backgroundColor:selectedCreature.rarityColor+'12'}]}>
                        <SelSprite size={66}/>
                      </View>
                      <Text style={styles.fusePanelMult}>× 3</Text>
                      <Text style={[styles.fusePanelName,{color:selectedCreature.rarityColor}]}>{selectedCreature.name}</Text>
                      <Text style={styles.fusePanelStats}>⚔️{selectedCreature.stats?.atk} ❤️{selectedCreature.stats?.hp}</Text>
                    </View>

                    <View style={styles.fusePanelCenter}>
                      <Text style={[styles.fusePanelArrow,{color:selectedCreature.rarityColor}]}>✨</Text>
                      <Text style={styles.fusePanelArrowSub}>Fusion</Text>
                    </View>

                    <View style={styles.fusePanelSide}>
                      <View style={[styles.spritePill,{borderColor:'#ff69b455',backgroundColor:'#ff69b415',position:'relative',overflow:'hidden'}]}>
                        <SelSprite size={66}/>
                        <View style={[StyleSheet.absoluteFill,{backgroundColor:selectedShiny.rarityColor+'30',borderRadius:16}]}/>
                      </View>
                      <Text style={[styles.fusePanelMult,{color:'#ff69b4'}]}>✨ Shiny</Text>
                      <Text style={[styles.fusePanelName,{color:selectedShiny.rarityColor}]}>{selectedShiny.name}</Text>
                      <Text style={[styles.fusePanelStats,{color:'#39ff8f'}]}>⚔️{selectedShiny.stats?.atk} ❤️{selectedShiny.stats?.hp} ↑</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={handleFuse} style={styles.fuseBtn}>
                    <LinearGradient colors={['#ff69b444','#ff69b422']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.fuseBtnGrad}>
                      <Text style={[styles.fuseBtnText,{color:'#ff69b4'}]}>✨ FUSIONNER</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {/* Mes shinys */}
              {totalShinys>0&&(
                <>
                  <Text style={styles.sectionLabel}>MES SHINYS ({totalShinys})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{width:'100%'}}>
                    <View style={{flexDirection:'row',gap:12,paddingHorizontal:4,paddingVertical:8}}>
                      {[...ownedShinyIds].map(shinyId=>{
                        const sc=SHINY_CREATURES[shinyId]; if(!sc) return null;
                        return <ShinyCard key={shinyId} creature={sc} size="medium" owned/>;
                      })}
                    </View>
                  </ScrollView>
                </>
              )}
            </>
          )}

          {/* ── POKÉDEX SHINY ── */}
          {tab==='Pokédex Shiny'&&(
            <>
              <View style={styles.pokedexHeader}>
                <Text style={styles.pokedexHint}>✨ {totalShinys}/{totalPossible} Shinys découverts</Text>
                <View style={styles.completionBg}>
                  <View style={[styles.completionFill,{width:`${completionPct}%`}]}/>
                </View>
              </View>
              <View style={styles.pokedexGrid}>
                {Object.entries(SHINY_CREATURES).map(([shinyId,sc])=>(
                  <ShinyCard key={shinyId} creature={sc} size="medium" owned={ownedShinyIds.has(shinyId)}/>
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
  container:{flex:1}, safe:{flex:1},
  title:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:16},
  // Stats
  statsRow:{flexDirection:'row',gap:8,paddingHorizontal:16,marginVertical:8},
  statCard:{flex:1,borderWidth:1,borderRadius:12,padding:10,alignItems:'center',gap:2},
  statCardVal:{fontSize:20,fontWeight:'900'},
  statCardLbl:{fontSize:8,color:'#4a6080',letterSpacing:1,textTransform:'uppercase'},
  // Completion
  completionWrap:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:16,marginBottom:10},
  completionBg:{flex:1,height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  completionFill:{height:'100%',backgroundColor:'#ff69b4',borderRadius:4},
  completionPct:{color:'#ff69b4',fontSize:10,fontWeight:'700',width:36,textAlign:'right'},
  // Tabs
  tabRow:{flexDirection:'row',gap:8,paddingHorizontal:16,marginBottom:10},
  tabBtn:{flex:1,alignItems:'center',paddingVertical:10,borderRadius:14,borderWidth:1,borderColor:'#1e2d4a',backgroundColor:'#0d1220'},
  tabActive:{borderColor:'#ff69b444',backgroundColor:'#ff69b412'},
  tabText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  tabTextActive:{color:'#ff69b4'},
  scroll:{gap:14,paddingHorizontal:16,paddingBottom:32,alignItems:'center'},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700',alignSelf:'flex-start'},
  // Rules
  ruleBox:{width:'100%',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#ff69b433',borderRadius:16,padding:14,gap:10},
  ruleTitle:{fontSize:11,color:'#ff69b4',fontWeight:'900',letterSpacing:2},
  ruleRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
  ruleDot:{color:'#ff69b4',fontSize:10,marginTop:2},
  ruleText:{color:'#c8daf0',fontSize:12,fontWeight:'700'},
  ruleSub:{color:'#4a6080',fontSize:10,marginTop:1},
  // Fusion grid
  fusionGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',width:'100%'},
  fusionCard:{alignItems:'center',borderWidth:1.5,borderRadius:16,padding:10,width:100,gap:4,position:'relative',overflow:'hidden'},
  fusionName:{fontSize:7,fontWeight:'800',letterSpacing:0.5,textAlign:'center'},
  fusionDots:{flexDirection:'row',gap:5,marginTop:2},
  fusionDot:{width:9,height:9,borderRadius:5},
  fusionCount:{fontSize:13,fontWeight:'900'},
  obtainedBadge:{backgroundColor:'#ffd70022',borderWidth:1,borderColor:'#ffd70044',borderRadius:6,paddingHorizontal:5,paddingVertical:2},
  obtainedText:{fontSize:7,color:'#ffd700',fontWeight:'800'},
  readyBadge:{borderWidth:1,borderRadius:6,paddingHorizontal:5,paddingVertical:2},
  readyText:{fontSize:7,fontWeight:'900',letterSpacing:1},
  selectedBadge:{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:8,alignItems:'center',justifyContent:'center'},
  selectedBadgeText:{color:'#000',fontSize:9,fontWeight:'900'},
  // Fuse panel
  fusePanel:{width:'100%',borderWidth:1,borderRadius:20,padding:18,gap:14},
  fusePanelTitle:{fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center'},
  fusePanelRow:{flexDirection:'row',alignItems:'center'},
  fusePanelSide:{alignItems:'center',gap:5,flex:1},
  fusePanelCenter:{alignItems:'center',gap:4,paddingHorizontal:6},
  spritePill:{borderWidth:1,borderRadius:16,padding:8,alignItems:'center'},
  fusePanelMult:{color:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:'800'},
  fusePanelName:{fontSize:9,fontWeight:'900',letterSpacing:1,textAlign:'center'},
  fusePanelStats:{fontSize:9,color:'#4a6080'},
  fusePanelArrow:{fontSize:28,fontWeight:'900'},
  fusePanelArrowSub:{fontSize:9,color:'rgba(255,255,255,0.3)',letterSpacing:1},
  fuseBtn:{width:'100%',borderWidth:1,borderRadius:14,overflow:'hidden',borderColor:'#ff69b433'},
  fuseBtnGrad:{alignItems:'center',paddingVertical:16},
  fuseBtnText:{fontSize:16,fontWeight:'900',letterSpacing:3},
  // Shiny card
  shinyCard:{borderRadius:20,borderWidth:1.5,padding:14,alignItems:'center',overflow:'hidden',position:'relative',gap:4},
  starTL:{position:'absolute',top:8,left:10,fontSize:10},
  starTR:{position:'absolute',top:8,right:10,fontSize:10},
  starBL:{position:'absolute',bottom:8,left:10,fontSize:8},
  starBR:{position:'absolute',bottom:8,right:10,fontSize:8},
  shinyBadge:{borderWidth:1,borderRadius:20,paddingHorizontal:8,paddingVertical:3,marginBottom:2},
  shinyBadgeText:{fontSize:9,fontWeight:'900',letterSpacing:1.5},
  shinyNum:{fontSize:10,color:'#4a6080',letterSpacing:1,alignSelf:'flex-start'},
  shinyName:{fontSize:15,fontWeight:'900',letterSpacing:2,textAlign:'center'},
  shinyJp:{fontSize:9,color:'#4a6080',letterSpacing:3},
  shinyTypeBadge:{borderWidth:1,borderRadius:20,paddingHorizontal:10,paddingVertical:3},
  shinyTypeText:{fontSize:9,fontWeight:'700',letterSpacing:1.5,textTransform:'uppercase'},
  shinyDesc:{color:'#6a84a0',fontSize:11,textAlign:'center',fontStyle:'italic',paddingHorizontal:4,lineHeight:18},
  miniStats:{width:'100%',gap:6,marginTop:6},
  miniStatRow:{flexDirection:'row',alignItems:'center',gap:6},
  miniStatLabel:{fontSize:9,fontWeight:'700',width:28,textAlign:'right'},
  miniBar:{flex:1,height:4,backgroundColor:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'},
  miniFill:{height:'100%',borderRadius:4},
  miniStatVal:{fontSize:12,fontWeight:'900',width:28},
  lockOverlay:{position:'absolute',top:0,left:0,right:0,bottom:0,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.65)',borderRadius:20},
  lockText:{fontSize:28},
  lockSub:{color:'rgba(255,255,255,0.3)',fontSize:9,marginTop:4},
  // Pokédex
  pokedexHeader:{width:'100%',gap:6},
  pokedexHint:{color:'#ff69b4',fontSize:11,fontWeight:'700'},
  pokedexGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center'},
  // Anim
  animArea:{flex:1,alignItems:'center',justifyContent:'center',gap:20,padding:24},
  fusingTitle:{fontSize:18,fontWeight:'900',letterSpacing:4,fontStyle:'italic'},
  fusingDots:{fontSize:26,letterSpacing:10},
  resultTitle:{fontSize:22,fontWeight:'900',letterSpacing:3,textAlign:'center'},
  resultXp:{color:'#00e5ff',fontSize:14,fontWeight:'700'},
});
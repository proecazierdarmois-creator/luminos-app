// screens/EvolutionScreen.js — Évolution améliorée V2
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES } from '../data/creatures';
import { addXp } from '../store/xpService';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');

const EVO_CHAINS = [
  { name:'Ligne Lumikos', color:'#00e5ff', chain:[{id:'lumikos',cost:0},{id:'lumivex',cost:8},{id:'lumirex',cost:15},{id:'luminos',cost:30}] },
  { name:'Ligne Pyrox',   color:'#ff4400', chain:[{id:'pyrox',cost:0},{id:'pyrax',cost:10},{id:'pyralord',cost:20}] },
  { name:'Ligne Aquila',  color:'#0066ff', chain:[{id:'aquila',cost:0},{id:'aquilon',cost:10},{id:'aquarex',cost:20}] },
  { name:'Ligne Florix',  color:'#44bb22', chain:[{id:'florix',cost:0},{id:'floriva',cost:12}] },
  { name:'Ligne Glacix',  color:'#55bbff', chain:[{id:'glacix',cost:0},{id:'glacirath',cost:12}] },
  { name:'Ligne Voltrax', color:'#ffcc00', chain:[{id:'voltrax',cost:0},{id:'voltaris',cost:12}] },
];

function getEvolution(creatureId) {
  for (const chain of EVO_CHAINS) {
    const idx = chain.chain.findIndex(e=>e.id===creatureId);
    if (idx>=0 && idx<chain.chain.length-1)
      return { from:chain.chain[idx].id, to:chain.chain[idx+1].id, cost:chain.chain[idx+1].cost, chainColor:chain.color };
  }
  return null;
}

function getChain(creatureId) {
  return EVO_CHAINS.find(ch=>ch.chain.some(e=>e.id===creatureId));
}

// ─── Particule ────────────────────────────────────────────────────
function EvoParticle({ color, delay=0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const x = (Math.random()-0.5)*SW*0.9;
  const y = -40-Math.random()*180;
  const size = 5+Math.random()*8;

  useEffect(()=>{
    setTimeout(()=>{
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim,{toValue:1,duration:700+Math.random()*500,useNativeDriver:true}),
          Animated.timing(anim,{toValue:0,duration:400,useNativeDriver:true}),
        ])
      ).start();
    }, delay);
  },[]);

  return (
    <Animated.View style={{
      position:'absolute', width:size, height:size, borderRadius:size/2,
      backgroundColor:color, left:SW/2+x, top:SW*0.4+y,
      opacity:anim.interpolate({inputRange:[0,0.4,1],outputRange:[0,1,0]}),
      transform:[
        {scale:anim.interpolate({inputRange:[0,0.4,1],outputRange:[0.3,1.5,0.2]})},
        {translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-70]})},
      ],
    }}/>
  );
}

// ─── EvolutionScreen ─────────────────────────────────────────────
export default function EvolutionScreen() {
  const { collection, crystals, addToCollection, addCrystals } = useGameStore();
  const [selected, setSelected] = useState(null);
  const [phase, setPhase]       = useState('idle');
  const [result, setResult]     = useState(null);

  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const opacAnim   = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const spinAnim   = useRef(new Animated.Value(0)).current;
  const resultScale= useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const flashAnim  = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  const ownedIds = new Set(collection.map(c=>c.id));
  const evo      = selected ? getEvolution(selected.id) : null;
  const target   = evo ? ALL_CREATURES[evo.to] : null;

  function handleEvolve() {
    if (!selected||phase!=='idle'||!evo||crystals<evo.cost) return;
    setPhase('evolving');
    addCrystals(-evo.cost);

    Animated.parallel([
      Animated.timing(scaleAnim,{toValue:0,   duration:600,useNativeDriver:true}),
      Animated.timing(spinAnim, {toValue:1,   duration:600,useNativeDriver:true}),
      Animated.timing(opacAnim, {toValue:0.1, duration:500,useNativeDriver:true}),
    ]).start(()=>{
      // Flash blanc
      Animated.sequence([
        Animated.timing(flashAnim,{toValue:1,duration:200,useNativeDriver:true}),
        Animated.timing(flashAnim,{toValue:0,duration:300,useNativeDriver:true}),
      ]).start(()=>{
        const newCreature = ALL_CREATURES[evo.to];
        addToCollection({...newCreature});
        setResult(newCreature);
        setPhase('done');
        const uid=auth.currentUser?.uid;
        if (uid) addXp(uid,35,null,null,null);
        scaleAnim.setValue(0); opacAnim.setValue(0); resultScale.setValue(0);
        Animated.parallel([
          Animated.spring(resultScale,{toValue:1,friction:3,useNativeDriver:true}),
          Animated.timing(opacAnim,  {toValue:1,duration:500,useNativeDriver:true}),
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

  const spin = spinAnim.interpolate({inputRange:[0,1],outputRange:['0deg','720deg']});

  // ── EVOLVING ──
  if (phase==='evolving'&&selected) {
    const SelSprite = SPRITES[selected.id?.replace('_shiny','')]||SPRITES.lumikos;
    return (
      <LinearGradient colors={selected.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:'white',opacity:flashAnim}]}/>
          <View style={styles.animArea}>
            {Array.from({length:14}).map((_,i)=>(
              <EvoParticle key={i} color={selected.rarityColor} delay={i*50}/>
            ))}
            {Array.from({length:8}).map((_,i)=>(
              <EvoParticle key={`g${i}`} color="#ffd700" delay={i*80+200}/>
            ))}
            <Animated.View style={{
              transform:[{scale:scaleAnim},{rotate:spin}],
              opacity:opacAnim,
              shadowColor:selected.rarityColor,shadowRadius:30,shadowOpacity:0.8,
            }}>
              <SelSprite size={160}/>
            </Animated.View>
            <Text style={[styles.evolvingText,{color:selected.rarityColor}]}>Évolution en cours...</Text>
            <View style={styles.dotsRow}>
              {[0,1,2].map(i=>(
                <Animated.View key={i} style={[styles.dot,{
                  backgroundColor:selected.rarityColor,
                  opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.3,1]}),
                  transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[1,1.3]})}],
                }]}/>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── DONE ──
  if (phase==='done'&&result) {
    const ResSprite = SPRITES[result.id?.replace('_shiny','')]||SPRITES.lumikos;
    return (
      <LinearGradient colors={result.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.animArea}>
            {Array.from({length:18}).map((_,i)=>(
              <EvoParticle key={i} color={i%3===0?'#ffd700':i%3===1?result.rarityColor:'#ffffff'} delay={i*60}/>
            ))}

            <Animated.Text style={[styles.newLabel,{
              color:result.rarityColor,
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.6,1]}),
            }]}>✦ NOUVELLE FORME ✦</Animated.Text>

            <Animated.View style={{
              transform:[{scale:resultScale}],opacity:opacAnim,
              shadowColor:result.rarityColor,shadowRadius:40,shadowOpacity:0.9,
            }}>
              <ResSprite size={170}/>
            </Animated.View>

            <Animated.Text style={[styles.resultName,{
              color:result.rarityColor,
              opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]}),
              transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.97,1.03]})}],
            }]}>★ {result.name} ★</Animated.Text>

            <Text style={[styles.resultRarity,{color:result.rarityColor+'aa'}]}>{result.rarityLabel}</Text>
            <Text style={styles.resultDesc}>{result.description}</Text>

            <View style={styles.resultStats}>
              {[['PV',result.stats.hp,'#39ff8f'],['ATK',result.stats.atk,'#ff4fa3'],['DEF',result.stats.def,'#00e5ff'],['VIT',result.stats.spd,'#ffd700']].map(([l,v,c])=>(
                <View key={l} style={[styles.statChip,{borderColor:c+'44',backgroundColor:c+'12'}]}>
                  <Text style={[styles.statChipLbl,{color:c+'88'}]}>{l}</Text>
                  <Text style={[styles.statChipVal,{color:c}]}>{v}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.xpGained}>+35 XP gagné !</Text>

            <TouchableOpacity onPress={()=>{setPhase('idle');setSelected(null);setResult(null);}}
              style={[styles.continueBtn,{borderColor:result.rarityColor+'44'}]}>
              <LinearGradient colors={[result.rarityColor+'44',result.rarityColor+'22']}
                start={{x:0,y:0}} end={{x:1,y:0}} style={styles.continueBtnGrad}>
                <Text style={[styles.continueBtnText,{color:result.rarityColor}]}>→ Continuer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── SELECTION ──
  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-20,0]})}],
        }]}>ÉVOLUTION</Animated.Text>
        <Text style={styles.subtitle}>Dépense des cristaux pour faire évoluer tes créatures</Text>

        {/* Cristaux */}
        <View style={styles.crystalBar}>
          <Text style={styles.crystalText}>💎 {crystals} cristaux</Text>
          {selected&&evo&&<Text style={[styles.crystalNeed,{color:crystals>=evo.cost?'#39ff8f':'#ff4444'}]}>
            Coût : {evo.cost} 💎 · {crystals>=evo.cost?'✓ Suffisant':'Manque '+(evo.cost-crystals)+' 💎'}
          </Text>}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {EVO_CHAINS.map(chainDef=>{
            const hasAny = chainDef.chain.some(e=>ownedIds.has(e.id));
            if (!hasAny) return null;

            return (
              <View key={chainDef.name} style={styles.chainSection}>
                <Text style={[styles.chainName,{color:chainDef.color}]}>{chainDef.name}</Text>
                <View style={styles.chainRow}>
                  {chainDef.chain.map((step,i)=>{
                    const c      = ALL_CREATURES[step.id];
                    if (!c) return null;
                    const owned  = ownedIds.has(step.id);
                    const isSel  = selected?.id===step.id;
                    const Sprite = SPRITES[step.id?.replace('_shiny','')]||SPRITES.lumikos;
                    const isMax  = i===chainDef.chain.length-1;
                    return (
                      <React.Fragment key={step.id}>
                        <TouchableOpacity onPress={()=>owned&&setSelected(c)} disabled={!owned}
                          style={[styles.chainNode,{
                            borderColor:isSel?c.rarityColor:owned?c.rarityColor+'55':'#1e2d4a',
                            backgroundColor:isSel?c.rarityColor+'22':owned?c.rarityColor+'08':'transparent',
                            opacity:owned?1:0.3,
                          }]}>
                          <Sprite size={48}/>
                          <Text style={[styles.nodeName,{color:owned?c.rarityColor:'#4a6080'}]} numberOfLines={1}>{c.name}</Text>
                          {!owned&&<Text style={styles.nodeLock}>🔒</Text>}
                          {isSel&&<View style={[styles.selDot,{backgroundColor:c.rarityColor}]}/>}
                          {isMax&&owned&&<View style={[styles.maxBadge,{backgroundColor:c.rarityColor+'22',borderColor:c.rarityColor+'44'}]}><Text style={[styles.maxBadgeText,{color:c.rarityColor}]}>MAX</Text></View>}
                        </TouchableOpacity>
                        {i<chainDef.chain.length-1&&(
                          <View style={styles.chainArrow}>
                            <Text style={[styles.arrowText,{color:chainDef.color}]}>→</Text>
                            <Text style={styles.arrowCost}>{chainDef.chain[i+1].cost}💎</Text>
                          </View>
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Panel évolution */}
          {selected&&(
            <LinearGradient colors={selected.bgGradient||['#0d1220','#07090f']}
              style={[styles.evoPanel,{borderColor:(evo?.chainColor||selected.rarityColor)+'44'}]}>

              {evo&&target?(
                <>
                  {/* From → To */}
                  <View style={styles.evoPanelRow}>
                    <View style={styles.evoPanelSide}>
                      <View style={[styles.spriteWrapper,{borderColor:selected.rarityColor+'44',backgroundColor:selected.rarityColor+'10'}]}>
                        {React.createElement(SPRITES[selected.id?.replace('_shiny','')]||SPRITES.lumikos,{size:80})}
                      </View>
                      <Text style={[styles.evoPanelName,{color:selected.rarityColor}]}>{selected.name}</Text>
                      <Text style={styles.evoPanelRarity}>{selected.rarityLabel}</Text>
                    </View>

                    <View style={styles.evoPanelCenter}>
                      <View style={[styles.costBubble,{backgroundColor:'#ffd70022',borderColor:'#ffd70044'}]}>
                        <Text style={styles.costBubbleText}>{evo.cost} 💎</Text>
                      </View>
                      <Text style={[styles.evoArrow,{color:evo.chainColor||'#ffd700'}]}>→</Text>
                      <Text style={styles.evoLabel}>Évolue en</Text>
                    </View>

                    <View style={styles.evoPanelSide}>
                      <View style={[styles.spriteWrapper,{borderColor:target.rarityColor+'44',backgroundColor:target.rarityColor+'10',opacity:0.75}]}>
                        {React.createElement(SPRITES[target.id?.replace('_shiny','')]||SPRITES.lumikos,{size:80})}
                      </View>
                      <Text style={[styles.evoPanelName,{color:target.rarityColor}]}>{target.name}</Text>
                      <Text style={styles.evoPanelRarity}>{target.rarityLabel}</Text>
                    </View>
                  </View>

                  {/* Stats comparaison */}
                  <View style={styles.statCompare}>
                    <Text style={styles.statCompareTitle}>📈 AMÉLIORATION DES STATS</Text>
                    {[['PV','hp','#39ff8f'],['ATK','atk','#ff4fa3'],['DEF','def','#00e5ff'],['VIT','spd','#ffd700']].map(([label,key,color])=>{
                      const diff = target.stats[key]-selected.stats[key];
                      return (
                        <View key={key} style={styles.statRow}>
                          <Text style={[styles.statLabel,{color}]}>{label}</Text>
                          <Text style={[styles.statFrom,{color:selected.rarityColor+'aa'}]}>{selected.stats[key]}</Text>
                          <View style={styles.statBars}>
                            <View style={styles.statBarBg}>
                              <View style={[styles.statBarFill,{width:`${(selected.stats[key]/160)*100}%`,backgroundColor:selected.rarityColor+'55'}]}/>
                            </View>
                            <View style={styles.statBarBg}>
                              <View style={[styles.statBarFill,{width:`${(target.stats[key]/160)*100}%`,backgroundColor:target.rarityColor}]}/>
                            </View>
                          </View>
                          <Text style={[styles.statTo,{color:target.rarityColor}]}>{target.stats[key]}</Text>
                          <Text style={[styles.statDiff,{color:diff>0?'#39ff8f':'#ff4444'}]}>{diff>0?`+${diff}`:diff}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Bouton évoluer */}
                  <TouchableOpacity onPress={handleEvolve} disabled={crystals<evo.cost}
                    style={[styles.evoBtn,crystals<evo.cost&&styles.disabled]}>
                    <LinearGradient
                      colors={crystals>=evo.cost?[selected.rarityColor+'66',target.rarityColor+'66']:['#1e2d4a','#0d1828']}
                      start={{x:0,y:0}} end={{x:1,y:0}} style={styles.evoBtnGrad}>
                      <Text style={[styles.evoBtnText,crystals<evo.cost&&{color:'#4a6080'}]}>
                        {crystals>=evo.cost?`✦ FAIRE ÉVOLUER — ${evo.cost} 💎`:`Pas assez de cristaux (${evo.cost} 💎)`}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ):(
                <View style={styles.maxEvoArea}>
                  <Text style={styles.maxEvoEmoji}>⭐</Text>
                  <Text style={[styles.maxEvoText,{color:selected.rarityColor}]}>
                    {selected.name} est à son évolution maximale !
                  </Text>
                  <Text style={styles.maxEvoSub}>Cette créature a atteint sa forme ultime.</Text>
                </View>
              )}
            </LinearGradient>
          )}

          {!selected&&(
            <View style={styles.hintBox}>
              <Text style={styles.hintEmoji}>👆</Text>
              <Text style={styles.hintText}>Sélectionne une créature pour voir ses évolutions disponibles</Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:16,marginBottom:4},
  subtitle:{fontSize:11,color:'#4a6080',letterSpacing:2,textAlign:'center',marginBottom:10},
  crystalBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#ffd70033',borderRadius:12,paddingHorizontal:14,paddingVertical:10,marginBottom:12},
  crystalText:{color:'#ffd700',fontSize:14,fontWeight:'700'},
  crystalNeed:{fontSize:11,fontWeight:'700'},
  scroll:{gap:16,paddingBottom:32},
  // Chain
  chainSection:{gap:8},
  chainName:{fontSize:10,fontWeight:'900',letterSpacing:2,textTransform:'uppercase'},
  chainRow:{flexDirection:'row',alignItems:'center',gap:4},
  chainNode:{alignItems:'center',borderWidth:1.5,borderRadius:14,padding:8,gap:3,flex:1,position:'relative'},
  nodeName:{fontSize:7,fontWeight:'800',letterSpacing:0.5,textAlign:'center'},
  nodeLock:{position:'absolute',top:4,right:4,fontSize:10},
  selDot:{position:'absolute',top:4,left:4,width:8,height:8,borderRadius:4},
  maxBadge:{position:'absolute',bottom:4,borderWidth:1,borderRadius:6,paddingHorizontal:4,paddingVertical:1},
  maxBadgeText:{fontSize:6,fontWeight:'900',letterSpacing:1},
  chainArrow:{alignItems:'center',gap:2},
  arrowText:{fontSize:18,fontWeight:'900'},
  arrowCost:{fontSize:8,color:'#4a6080',fontWeight:'700'},
  // Evo panel
  evoPanel:{borderWidth:1,borderRadius:20,padding:16,gap:14},
  evoPanelRow:{flexDirection:'row',alignItems:'center'},
  evoPanelSide:{alignItems:'center',gap:5,flex:1},
  spriteWrapper:{borderWidth:1,borderRadius:16,padding:8,alignItems:'center'},
  evoPanelName:{fontSize:11,fontWeight:'900',letterSpacing:1,textAlign:'center'},
  evoPanelRarity:{fontSize:9,color:'#4a6080',letterSpacing:1},
  evoPanelCenter:{alignItems:'center',gap:5},
  costBubble:{borderWidth:1,borderRadius:12,paddingHorizontal:10,paddingVertical:5},
  costBubbleText:{color:'#ffd700',fontSize:13,fontWeight:'900'},
  evoArrow:{fontSize:26,fontWeight:'900'},
  evoLabel:{color:'#4a6080',fontSize:8,letterSpacing:1},
  // Stats
  statCompare:{backgroundColor:'rgba(255,255,255,0.05)',borderRadius:14,padding:12,gap:8},
  statCompareTitle:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700'},
  statRow:{flexDirection:'row',alignItems:'center',gap:6},
  statLabel:{fontSize:9,fontWeight:'700',width:28},
  statFrom:{fontSize:10,fontWeight:'700',width:26,textAlign:'right'},
  statBars:{flex:1,gap:2},
  statBarBg:{height:4,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  statBarFill:{height:'100%',borderRadius:4},
  statTo:{fontSize:11,fontWeight:'900',width:26},
  statDiff:{fontSize:11,fontWeight:'900',width:32,textAlign:'right'},
  // Button
  evoBtn:{borderRadius:16,overflow:'hidden'},
  evoBtnGrad:{alignItems:'center',paddingVertical:18,borderWidth:1,borderColor:'rgba(255,255,255,0.1)',borderRadius:16},
  evoBtnText:{color:'#fff',fontSize:14,fontWeight:'900',letterSpacing:2},
  disabled:{opacity:0.5},
  // Max evo
  maxEvoArea:{alignItems:'center',gap:8,paddingVertical:16},
  maxEvoEmoji:{fontSize:40},
  maxEvoText:{fontSize:15,fontWeight:'800',textAlign:'center',letterSpacing:1},
  maxEvoSub:{color:'#4a6080',fontSize:12,textAlign:'center'},
  // Hint
  hintBox:{alignItems:'center',gap:10,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:24},
  hintEmoji:{fontSize:36},
  hintText:{color:'#4a6080',fontSize:13,textAlign:'center',lineHeight:20},
  // Animations
  animArea:{flex:1,alignItems:'center',justifyContent:'center',gap:16,padding:24,overflow:'hidden'},
  evolvingText:{fontSize:16,letterSpacing:3,fontStyle:'italic',fontWeight:'700'},
  dotsRow:{flexDirection:'row',gap:10},
  dot:{width:11,height:11,borderRadius:6},
  newLabel:{fontSize:12,letterSpacing:4,fontWeight:'900'},
  resultName:{fontSize:28,fontWeight:'900',letterSpacing:4,textAlign:'center'},
  resultRarity:{fontSize:11,letterSpacing:2},
  resultDesc:{color:'#6a84a0',fontSize:13,textAlign:'center',fontStyle:'italic',paddingHorizontal:20,lineHeight:20},
  resultStats:{flexDirection:'row',gap:8},
  statChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center',gap:2},
  statChipLbl:{fontSize:8,fontWeight:'700'},
  statChipVal:{fontSize:14,fontWeight:'900'},
  xpGained:{color:'#00e5ff',fontSize:13,fontWeight:'700'},
  continueBtn:{width:'100%',borderWidth:1,borderRadius:16,overflow:'hidden'},
  continueBtnGrad:{alignItems:'center',paddingVertical:16},
  continueBtnText:{fontSize:15,fontWeight:'900',letterSpacing:2},
});
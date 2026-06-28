// screens/BattleScreen.js — Combat amélioré V2
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { CREATURES, CREATURE_LIST, ALL_CREATURES } from '../data/creatures';
import { addXp, XP_REWARDS } from '../store/xpService';
import { auth } from '../config/firebase';

const { width: SW, height: SH } = Dimensions.get('window');

function cloneCreature(c) {
  return { ...c, stats: { ...c.stats, hp: c.stats.maxHp || c.stats.hp } };
}
function randomEnemy(excludedId) {
  const pool = CREATURE_LIST.filter(c => c && c.id !== excludedId);
  return cloneCreature(pool[Math.floor(Math.random() * pool.length)] || CREATURE_LIST[0]);
}
function calcDamage(attacker, move) {
  const base = move.power, mod = attacker.stats.atk / 100;
  const variance = 0.85 + Math.random() * 0.3;
  const isCrit = Math.random() < 0.15;
  const dmg = Math.max(1, Math.round(base * (1 + mod) * variance * (isCrit ? 1.5 : 1)));
  return { dmg, isCrit };
}
function getSpriteId(id) {
  return id?.endsWith('_shiny') ? id.replace('_shiny','') : id;
}

// ─── Particule ────────────────────────────────────────────────────
function Particle({ x, y, color, delay, size = 7 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const dx = (Math.random()-0.5)*120, dy = -40-Math.random()*80;
  useEffect(()=>{
    setTimeout(()=>{
      Animated.timing(anim,{toValue:1,duration:700+Math.random()*300,useNativeDriver:true}).start();
    },delay);
  },[]);
  return (
    <Animated.View style={{
      position:'absolute',left:x,top:y,width:size,height:size,borderRadius:size/2,backgroundColor:color,
      opacity:anim.interpolate({inputRange:[0,0.2,1],outputRange:[0,1,0]}),
      transform:[
        {translateX:anim.interpolate({inputRange:[0,1],outputRange:[0,dx]})},
        {translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,dy]})},
        {scale:anim.interpolate({inputRange:[0,0.3,1],outputRange:[0,1.8,0.3]})},
      ],
    }}/>
  );
}

// ─── Chiffre de dégâts ────────────────────────────────────────────
function DamageNumber({ value, color, x, y, isCrit, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.sequence([
      Animated.spring(anim,{toValue:1,friction:3,useNativeDriver:true}),
      Animated.delay(500),
      Animated.timing(anim,{toValue:2,duration:300,useNativeDriver:true}),
    ]).start(()=>onDone&&onDone());
  },[]);
  return (
    <Animated.View style={{
      position:'absolute',left:x-40,top:y,zIndex:99,
      opacity:anim.interpolate({inputRange:[0,0.2,1,1.8,2],outputRange:[0,1,1,1,0]}),
      transform:[
        {translateY:anim.interpolate({inputRange:[0,1,2],outputRange:[0,-50,-80]})},
        {scale:anim.interpolate({inputRange:[0,0.3,1,2],outputRange:[0,1.8,1,0.8]})},
      ],
    }}>
      <Text style={{
        fontSize:isCrit?38:28,fontWeight:'900',
        color:isCrit?'#ffd700':color,
        textShadowColor:'#000',textShadowOffset:{width:2,height:2},textShadowRadius:6,
      }}>
        {isCrit?`💥 ${value}!`:`-${value}`}
      </Text>
    </Animated.View>
  );
}

// ─── HP Bar ───────────────────────────────────────────────────────
function HpBar({ current, max, name, rarityColor }) {
  const widthAnim = useRef(new Animated.Value((current/max)*100)).current;
  const pct   = Math.max(0,(current/max)*100);
  const color = pct>50?'#39ff8f':pct>25?'#ffd700':'#ff4444';
  useEffect(()=>{
    Animated.spring(widthAnim,{toValue:pct,friction:8,useNativeDriver:false}).start();
  },[current]);
  return (
    <LinearGradient colors={[rarityColor+'18','#0d1220']} style={[styles.hpCard,{borderColor:rarityColor+'44'}]}>
      <View style={styles.hpCardTop}>
        <Text style={[styles.hpName,{color:rarityColor}]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.hpVal,{color}]}>{current}<Text style={styles.hpMax}>/{max}</Text></Text>
      </View>
      <View style={styles.hpBarBg}>
        <Animated.View style={[styles.hpBarFill,{
          width:widthAnim.interpolate({inputRange:[0,100],outputRange:['0%','100%']}),
          backgroundColor:color,
        }]}/>
        <Animated.View style={[styles.hpBarGlow,{
          width:widthAnim.interpolate({inputRange:[0,100],outputRange:['0%','100%']}),
          backgroundColor:color,
        }]}/>
      </View>
    </LinearGradient>
  );
}

// ─── Stat bar ─────────────────────────────────────────────────────
function StatBar({ label, value, max=160, color }) {
  return (
    <View style={styles.statBarRow}>
      <Text style={styles.statBarLabel}>{label}</Text>
      <View style={styles.statBarBg}>
        <View style={[styles.statBarFill,{width:`${Math.min(100,(value/max)*100)}%`,backgroundColor:color}]}/>
      </View>
      <Text style={[styles.statBarVal,{color}]}>{value}</Text>
    </View>
  );
}

// ─── BattleScreen ─────────────────────────────────────────────────
export default function BattleScreen() {
  const { collection, recordBattle, addCrystals } = useGameStore();
  const ownedIds = [...new Set(collection.map(c=>c.id))].filter(id=>ALL_CREATURES[id]);
  const defaultId = ownedIds[0] || 'lumikos';

  const [selectedId, setSelectedId] = useState(defaultId);
  const [phase, setPhase]     = useState('select');
  const [player, setPlayer]   = useState(null);
  const [enemy, setEnemy]     = useState(null);
  const [log, setLog]         = useState([]);
  const [turn, setTurn]       = useState('player');
  const [won, setWon]         = useState(null);
  const [particles, setParticles] = useState([]);
  const [dmgNumbers, setDmgNumbers] = useState([]);
  const [combo, setCombo]     = useState(0);
  const [moveUsed, setMoveUsed] = useState(null);
  const logRef = useRef(null);

  const shakeP   = useRef(new Animated.Value(0)).current;
  const shakeE   = useRef(new Animated.Value(0)).current;
  const flashP   = useRef(new Animated.Value(1)).current;
  const flashE   = useRef(new Animated.Value(1)).current;
  const scaleP   = useRef(new Animated.Value(1)).current;
  const scaleE   = useRef(new Animated.Value(1)).current;
  const attackP  = useRef(new Animated.Value(0)).current;
  const attackE  = useRef(new Animated.Value(0)).current;
  const victoryAnim  = useRef(new Animated.Value(0)).current;
  const arenaGlowAnim= useRef(new Animated.Value(0)).current;
  const comboAnim    = useRef(new Animated.Value(0)).current;
  const turnAnim     = useRef(new Animated.Value(1)).current;
  const titleAnim    = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(arenaGlowAnim,{toValue:1,duration:2000,useNativeDriver:false}),
        Animated.timing(arenaGlowAnim,{toValue:0,duration:2000,useNativeDriver:false}),
      ])
    ).start();
  },[]);

  function doShake(anim) {
    Animated.sequence([
      Animated.timing(anim,{toValue:16,  duration:45,useNativeDriver:true}),
      Animated.timing(anim,{toValue:-14, duration:45,useNativeDriver:true}),
      Animated.timing(anim,{toValue:9,   duration:45,useNativeDriver:true}),
      Animated.timing(anim,{toValue:-5,  duration:45,useNativeDriver:true}),
      Animated.timing(anim,{toValue:0,   duration:45,useNativeDriver:true}),
    ]).start();
  }

  function doFlash(anim) {
    Animated.sequence([
      Animated.timing(anim,{toValue:0.1,duration:60,useNativeDriver:true}),
      Animated.timing(anim,{toValue:1,  duration:60,useNativeDriver:true}),
      Animated.timing(anim,{toValue:0.1,duration:60,useNativeDriver:true}),
      Animated.timing(anim,{toValue:1,  duration:80,useNativeDriver:true}),
    ]).start();
  }

  function doAttack(anim, dir) {
    Animated.sequence([
      Animated.timing(anim,{toValue:dir*45,duration:110,useNativeDriver:true}),
      Animated.spring(anim,{toValue:0,friction:4,useNativeDriver:true}),
    ]).start();
  }

  function doPulse(anim) {
    Animated.sequence([
      Animated.spring(anim,{toValue:1.3,friction:2,useNativeDriver:true}),
      Animated.spring(anim,{toValue:1,  friction:5,useNativeDriver:true}),
    ]).start();
  }

  function doTurnFlash() {
    Animated.sequence([
      Animated.timing(turnAnim,{toValue:0,duration:120,useNativeDriver:true}),
      Animated.timing(turnAnim,{toValue:1,duration:120,useNativeDriver:true}),
    ]).start();
  }

  function spawnParticles(x,y,color,count=10) {
    const ps=Array.from({length:count},(_,i)=>({id:Date.now()+i,x,y,color,delay:i*35,size:4+Math.random()*9}));
    setParticles(prev=>[...prev,...ps]);
    setTimeout(()=>setParticles(prev=>prev.filter(p=>!ps.find(n=>n.id===p.id))),1500);
  }

  function addDmgNum(value,x,y,color,isCrit) {
    const id=Date.now();
    setDmgNumbers(prev=>[...prev,{id,value,x,y,color,isCrit}]);
  }

  function addLog(msg) { setLog(l=>[...l.slice(-20),msg]); }

  function startBattle() {
    const p=cloneCreature(ALL_CREATURES[selectedId]||CREATURES['lumikos']);
    const e=randomEnemy(selectedId);
    setPlayer(p); setEnemy(e);
    setLog([`⚔️ ${p.name} affronte ${e.name} !`]);
    setTurn('player'); setWon(null); setPhase('battle');
    setCombo(0); setParticles([]); setDmgNumbers([]); setMoveUsed(null);
    victoryAnim.setValue(0);
    [scaleP,scaleE].forEach(a=>a.setValue(1));
    [shakeP,shakeE,attackP,attackE].forEach(a=>a.setValue(0));
    [flashP,flashE].forEach(a=>a.setValue(1));
    doTurnFlash();
  }

  function handlePlayerMove(move) {
    if (turn!=='player'||phase!=='battle') return;
    setMoveUsed(move.name);
    const {dmg,isCrit}=calcDamage(player,move);
    const newHp=Math.max(0,enemy.stats.hp-dmg);
    const newCombo=combo+1;
    setCombo(newCombo);
    if (newCombo>=3) {
      comboAnim.setValue(0);
      Animated.spring(comboAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
    }
    doAttack(attackP,1);
    setTimeout(()=>{
      doShake(shakeE); doFlash(flashE); doPulse(scaleE);
      spawnParticles(SW*0.7,100,enemy.rarityColor,isCrit?18:12);
      addDmgNum(dmg,SW*0.62,80,enemy.rarityColor,isCrit);
    },120);
    setEnemy(e=>({...e,stats:{...e.stats,hp:newHp}}));
    addLog(`✦ ${player.name} — ${move.name} : ${dmg} dégâts !${isCrit?' 💥 CRITIQUE !':''}`);
    if (newHp<=0) {
      setTimeout(()=>{
        addLog(`🏆 Victoire ! ${enemy.name} est vaincu !`);
        setWon(true); recordBattle(true); setPhase('end');
        addCrystals(2);
        const uid=auth.currentUser?.uid; if(uid) addXp(uid,XP_REWARDS.win,null,null,null);
        Animated.timing(victoryAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
        spawnParticles(SW/2,160,'#ffd700',22);
        spawnParticles(SW/2,160,player.rarityColor,16);
      },400);
      return;
    }
    setTurn('enemy'); doTurnFlash();
    setTimeout(()=>{
      const em=enemy.moves[Math.floor(Math.random()*enemy.moves.length)];
      const {dmg:eDmg,isCrit:eCrit}=calcDamage(enemy,em);
      const newPHp=Math.max(0,player.stats.hp-eDmg);
      doAttack(attackE,-1);
      setTimeout(()=>{
        doShake(shakeP); doFlash(flashP); doPulse(scaleP);
        spawnParticles(SW*0.28,100,player.rarityColor,eCrit?16:10);
        addDmgNum(eDmg,SW*0.2,80,player.rarityColor,eCrit);
      },120);
      setPlayer(p=>({...p,stats:{...p.stats,hp:newPHp}}));
      addLog(`⚡ ${enemy.name} — ${em.name} : ${eDmg} dégâts !${eCrit?' 💥 CRITIQUE !':''}`);
      if (newPHp<=0) {
        setTimeout(()=>{
          addLog(`💀 Défaite... ${player.name} est vaincu.`);
          setWon(false); recordBattle(false); setPhase('end');
          const uid2=auth.currentUser?.uid; if(uid2) addXp(uid2,XP_REWARDS.loss,null,null,null);
          Animated.timing(victoryAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
        },400);
      } else {
        setTurn('player'); setMoveUsed(null); setCombo(0); doTurnFlash();
      }
    },1100);
  }

  // ── SELECT ──
  if (phase==='select') {
    const selectables=ownedIds.length>0?ownedIds:['lumikos'];
    return (
      <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <Animated.Text style={[styles.title,{
            opacity:titleAnim,
            transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
          }]}>⚔️ COMBAT</Animated.Text>
          <Text style={styles.subtitle}>Choisis ta créature</Text>
          <ScrollView contentContainerStyle={styles.selectScroll} showsVerticalScrollIndicator={false}>
            {selectables.map(id=>{
              const c=ALL_CREATURES[id]||CREATURES['lumikos'];
              const Sprite=SPRITES[getSpriteId(id)]||SPRITES['lumikos'];
              const isSel=selectedId===id;
              return (
                <TouchableOpacity key={id} onPress={()=>setSelectedId(id)}
                  style={[styles.selectCard,{borderColor:isSel?c.rarityColor+'88':'#1e2d4a'}]}>
                  <LinearGradient colors={isSel?c.bgGradient||['#0d1220','#07090f']:['#0d1220','#07090f']}
                    style={styles.selectCardGrad}>
                    {/* Shimmer overlay si sélectionné */}
                    {isSel&&(
                      <View style={[StyleSheet.absoluteFill,{borderRadius:16,overflow:'hidden'}]}>
                        <LinearGradient colors={['rgba(255,255,255,0.05)','rgba(255,255,255,0)']}
                          start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}/>
                      </View>
                    )}
                    <View style={styles.selectLeft}>
                      <Sprite size={84}/>
                      {isSel&&<View style={[styles.selDot,{backgroundColor:c.rarityColor}]}/>}
                      {c.isShiny&&<Text style={styles.shinyTagAbsolute}>✨</Text>}
                    </View>
                    <View style={styles.selectRight}>
                      <View style={styles.selectNameRow}>
                        <Text style={[styles.selectName,{color:c.rarityColor}]}>{c.name}</Text>
                        <View style={[styles.rarityBadge,{backgroundColor:c.rarityColor+'22',borderColor:c.rarityColor+'44'}]}>
                          <Text style={[styles.rarityText,{color:c.rarityColor}]}>{c.rarityLabel}</Text>
                        </View>
                      </View>
                      <Text style={styles.selectType}>{c.type}</Text>
                      <StatBar label="PV"  value={c.stats.hp}  max={160} color="#39ff8f"/>
                      <StatBar label="ATK" value={c.stats.atk} max={140} color="#ff4fa3"/>
                      <StatBar label="VIT" value={c.stats.spd} max={140} color="#ffd700"/>
                      <View style={styles.movesRow}>
                        {c.moves?.slice(0,3).map(m=>(
                          <View key={m.name} style={[styles.moveTag,{borderColor:c.rarityColor+'44',backgroundColor:c.rarityColor+'12'}]}>
                            <Text style={[styles.moveTagText,{color:c.rarityColor}]}>{m.name} ⚡{m.power}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={startBattle} style={styles.startBtn}>
            <LinearGradient colors={['#ff4fa399','#bf5fff99']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.startGrad}>
              <Text style={styles.startText}>⚔️ AU COMBAT !</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── BATTLE / END ──
  const PlayerSprite=SPRITES[getSpriteId(player?.id)]||SPRITES['lumikos'];
  const EnemySprite =SPRITES[getSpriteId(enemy?.id)] ||SPRITES['lumikos'];

  return (
    <LinearGradient colors={player?.bgGradient||['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.battleHeader}>
          <TouchableOpacity onPress={()=>setPhase('select')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚔️ COMBAT</Text>
          <Animated.View style={[styles.turnBadge,{
            opacity:turnAnim,
            backgroundColor:turn==='player'?'#39ff8f22':'#ff444422',
            borderColor:turn==='player'?'#39ff8f55':'#ff444455',
          }]}>
            <Text style={[styles.turnText,{color:turn==='player'?'#39ff8f':'#ff4444'}]}>
              {phase==='end'?won?'🏆 Victoire':'💀 Défaite':turn==='player'?'▶ Ton tour':'⚡ Ennemi'}
            </Text>
          </Animated.View>
        </View>

        {/* HP Bars */}
        <View style={styles.hpBars}>
          {enemy&&<HpBar current={enemy.stats.hp} max={enemy.stats.maxHp||enemy.stats.hp} name={enemy.name} rarityColor={enemy.rarityColor}/>}
          {player&&<HpBar current={player.stats.hp} max={player.stats.maxHp||player.stats.hp} name={player.name} rarityColor={player.rarityColor}/>}
        </View>

        {/* Arène */}
        <Animated.View style={[styles.arena,{
          borderColor:arenaGlowAnim.interpolate({inputRange:[0,1],outputRange:[player?.rarityColor+'22'||'#1e2d4a',player?.rarityColor+'55'||'#1e2d4a']}),
        }]}>
          <LinearGradient colors={['#0a0f1a','#0d1628','#0a0f1a']} style={StyleSheet.absoluteFill}/>

          {/* Ligne de sol */}
          <View style={styles.arenaFloor}/>

          {/* Particules + dégâts */}
          {particles.map(p=><Particle key={p.id} {...p}/>)}
          {dmgNumbers.map(d=>(
            <DamageNumber key={d.id} {...d} onDone={()=>setDmgNumbers(prev=>prev.filter(x=>x.id!==d.id))}/>
          ))}

          {/* Ennemi */}
          {enemy&&(
            <Animated.View style={[styles.enemySprite,{
              transform:[{translateX:shakeE},{translateX:attackE},{scale:scaleE}],
              opacity:flashE,
            }]}>
              <EnemySprite size={115}/>
            </Animated.View>
          )}

          {/* VS */}
          <View style={styles.vsSeparator}>
            <View style={[styles.vsLine,{backgroundColor:enemy?.rarityColor+'55'||'#1e2d4a'}]}/>
            <LinearGradient colors={[enemy?.rarityColor+'33'||'#1e2d4a',player?.rarityColor+'33'||'#1e2d4a']}
              style={[styles.vsCircle,{borderColor:'#ffffff22'}]}>
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
            <View style={[styles.vsLine,{backgroundColor:player?.rarityColor+'55'||'#1e2d4a'}]}/>
          </View>

          {/* Joueur */}
          {player&&(
            <Animated.View style={[styles.playerSprite,{
              transform:[{translateX:shakeP},{translateX:attackP},{scale:scaleP}],
              opacity:flashP,
            }]}>
              <PlayerSprite size={115}/>
            </Animated.View>
          )}

          {/* Combo */}
          {combo>=3&&phase==='battle'&&(
            <Animated.View style={[styles.comboBadge,{transform:[{scale:comboAnim}],opacity:comboAnim}]}>
              <LinearGradient colors={['#ff6b3544','#ff6b3522']} style={styles.comboBadgeGrad}>
                <Text style={styles.comboText}>🔥 COMBO ×{combo}</Text>
              </LinearGradient>
            </Animated.View>
          )}
        </Animated.View>

        {/* Log */}
        <ScrollView ref={logRef} style={styles.logBox}
          onContentSizeChange={()=>logRef.current?.scrollToEnd({animated:true})}>
          {log.map((l,i)=>(
            <Text key={i} style={[styles.logLine,i===log.length-1&&styles.logLineLast]}>{l}</Text>
          ))}
        </ScrollView>

        {/* Attaques */}
        {phase==='battle'&&turn==='player'&&player&&(
          <View style={styles.movesGrid}>
            {player.moves.map((m,i)=>(
              <TouchableOpacity key={m.name} onPress={()=>handlePlayerMove(m)}
                disabled={moveUsed!==null}
                style={[styles.moveBtn,{borderColor:player.rarityColor+(moveUsed===m.name?'88':'44')},moveUsed===m.name&&{transform:[{scale:0.97}]}]}>
                <LinearGradient colors={[player.rarityColor+'33',player.rarityColor+'11']}
                  start={{x:0,y:0}} end={{x:1,y:1}} style={styles.moveBtnGrad}>
                  <Text style={[styles.moveName,{color:player.rarityColor}]}>{m.name}</Text>
                  <View style={styles.moveBtnBottom}>
                    <View style={[styles.movePowBadge,{backgroundColor:'#00e5ff18',borderColor:'#00e5ff33'}]}>
                      <Text style={styles.movePow}>⚡{m.power}</Text>
                    </View>
                    <Text style={styles.moveType}>{m.type||'Normal'}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tour ennemi */}
        {phase==='battle'&&turn==='enemy'&&(
          <View style={styles.enemyTurnBox}>
            <Text style={[styles.enemyTurnText,{color:enemy?.rarityColor}]}>{enemy?.name} attaque...</Text>
            <View style={styles.dotsRow}>
              {[0,1,2].map(i=>(
                <Animated.View key={i} style={[styles.dot,{
                  backgroundColor:enemy?.rarityColor||'#ff4444',
                  opacity:arenaGlowAnim,
                }]}/>
              ))}
            </View>
          </View>
        )}

        {/* Fin de combat */}
        {phase==='end'&&(
          <Animated.View style={[styles.endBox,{
            opacity:victoryAnim,
            transform:[{scale:victoryAnim.interpolate({inputRange:[0,1],outputRange:[0.88,1]})}],
          }]}>
            <LinearGradient
              colors={won?['#39ff8f28','#39ff8f08']:['#ff444428','#ff444408']}
              style={[styles.endCard,{borderColor:won?'#39ff8f66':'#ff444466'}]}>
              <Text style={[styles.endTitle,{color:won?'#39ff8f':'#ff4444'}]}>
                {won?'🏆 VICTOIRE !':'💀 DÉFAITE'}
              </Text>
              {won&&(
                <View style={styles.endRewards}>
                  <View style={styles.endRewardChip}>
                    <Text style={styles.endRewardText}>+2 💎</Text>
                  </View>
                  <View style={[styles.endRewardChip,{backgroundColor:'#00e5ff18',borderColor:'#00e5ff33'}]}>
                    <Text style={[styles.endRewardText,{color:'#00e5ff'}]}>+{XP_REWARDS.win} XP</Text>
                  </View>
                </View>
              )}
              <Text style={styles.endDesc}>
                {won?`${player?.name} a triomphé de ${enemy?.name} !`:`${enemy?.name} a vaincu ${player?.name}...`}
              </Text>
              <View style={styles.endBtns}>
                <TouchableOpacity onPress={startBattle}
                  style={[styles.endBtn,{borderColor:'#00e5ff44',backgroundColor:'#00e5ff12'}]}>
                  <Text style={{color:'#00e5ff',fontWeight:'900',fontSize:13,letterSpacing:1}}>↺ Rejouer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setPhase('select')}
                  style={[styles.endBtn,{borderColor:'#ffd70044',backgroundColor:'#ffd70012'}]}>
                  <Text style={{color:'#ffd700',fontWeight:'900',fontSize:13,letterSpacing:1}}>← Changer</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:12},
  title:{fontSize:20,fontWeight:'900',color:'#fff',letterSpacing:4,textAlign:'center',paddingTop:12},
  subtitle:{fontSize:11,color:'#4a6080',letterSpacing:3,textAlign:'center',marginBottom:10},
  // Battle header
  battleHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:10,marginBottom:8},
  backBtn:{padding:8},
  backBtnText:{color:'#4a6080',fontSize:22,fontWeight:'900'},
  turnBadge:{borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:5},
  turnText:{fontSize:11,fontWeight:'900',letterSpacing:1},
  // HP
  hpBars:{gap:6,marginBottom:8},
  hpCard:{borderWidth:1,borderRadius:14,padding:10,gap:5},
  hpCardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  hpName:{fontSize:11,fontWeight:'900',letterSpacing:1,flex:1},
  hpVal:{fontSize:14,fontWeight:'900'},
  hpMax:{fontSize:10,color:'#4a6080',fontWeight:'400'},
  hpBarBg:{height:8,backgroundColor:'#1e2d4a',borderRadius:5,overflow:'hidden',position:'relative'},
  hpBarFill:{height:'100%',borderRadius:5,position:'absolute'},
  hpBarGlow:{height:'100%',borderRadius:5,position:'absolute',opacity:0.3,top:0},
  // Arena
  arena:{
    borderRadius:20,borderWidth:1.5,overflow:'hidden',
    alignItems:'center',justifyContent:'space-between',
    flexDirection:'row',paddingHorizontal:16,paddingVertical:14,
    marginBottom:8,height:175,position:'relative',
  },
  arenaFloor:{position:'absolute',bottom:0,left:0,right:0,height:1,backgroundColor:'rgba(255,255,255,0.05)'},
  enemySprite:{alignItems:'center'},
  playerSprite:{alignItems:'center'},
  vsSeparator:{alignItems:'center',gap:5},
  vsLine:{width:1,height:55,opacity:0.4},
  vsCircle:{width:38,height:38,borderRadius:19,borderWidth:1,alignItems:'center',justifyContent:'center'},
  vsText:{color:'rgba(255,255,255,0.6)',fontSize:10,fontWeight:'900',letterSpacing:1},
  comboBadge:{position:'absolute',top:8,alignSelf:'center',borderRadius:12,overflow:'hidden'},
  comboBadgeGrad:{borderWidth:1,borderColor:'#ff6b3555',borderRadius:12,paddingHorizontal:12,paddingVertical:5},
  comboText:{color:'#ff6b35',fontSize:13,fontWeight:'900',letterSpacing:1},
  // Log
  logBox:{backgroundColor:'#0a0f1a',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:10,maxHeight:66,marginBottom:8},
  logLine:{color:'#4a6080',fontSize:11,lineHeight:18},
  logLineLast:{color:'#c8daf0',fontWeight:'700'},
  // Moves
  movesGrid:{flexDirection:'row',gap:8,marginBottom:4},
  moveBtn:{flex:1,borderWidth:1.5,borderRadius:14,overflow:'hidden'},
  moveBtnGrad:{padding:10,gap:5},
  moveName:{fontSize:10,fontWeight:'900',letterSpacing:1},
  moveBtnBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  movePowBadge:{borderWidth:1,borderRadius:6,paddingHorizontal:5,paddingVertical:2},
  movePow:{color:'#00e5ff',fontSize:11,fontWeight:'900'},
  moveType:{fontSize:8,color:'#4a6080',letterSpacing:1},
  // Enemy turn
  enemyTurnBox:{alignItems:'center',gap:6,paddingVertical:8},
  enemyTurnText:{fontSize:13,fontWeight:'700',fontStyle:'italic'},
  dotsRow:{flexDirection:'row',gap:8},
  dot:{width:9,height:9,borderRadius:5},
  // Select
  selectScroll:{gap:12,paddingBottom:90},
  selectCard:{borderWidth:1.5,borderRadius:18,overflow:'hidden'},
  selectCardGrad:{flexDirection:'row',padding:14,gap:14,alignItems:'center'},
  selectLeft:{alignItems:'center',width:90,position:'relative'},
  selDot:{position:'absolute',top:0,right:0,width:12,height:12,borderRadius:6,borderWidth:2,borderColor:'#07090f'},
  shinyTagAbsolute:{position:'absolute',top:0,left:0,fontSize:14},
  selectRight:{flex:1,gap:5},
  selectNameRow:{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'},
  selectName:{fontSize:17,fontWeight:'900',letterSpacing:0.5},
  selectType:{fontSize:10,color:'#4a6080',letterSpacing:1},
  rarityBadge:{borderWidth:1,borderRadius:8,paddingHorizontal:7,paddingVertical:2},
  rarityText:{fontSize:8,fontWeight:'900',letterSpacing:1},
  statBarRow:{flexDirection:'row',alignItems:'center',gap:6},
  statBarLabel:{fontSize:8,color:'#4a6080',width:22,letterSpacing:1,fontWeight:'700'},
  statBarBg:{flex:1,height:4,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  statBarFill:{height:'100%',borderRadius:4},
  statBarVal:{fontSize:8,fontWeight:'900',width:24,textAlign:'right'},
  movesRow:{flexDirection:'row',gap:5,flexWrap:'wrap',marginTop:2},
  moveTag:{borderWidth:1,borderRadius:8,paddingHorizontal:6,paddingVertical:3},
  moveTagText:{fontSize:8,fontWeight:'700'},
  startBtn:{position:'absolute',bottom:16,left:12,right:12,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#ff4fa333'},
  startGrad:{alignItems:'center',paddingVertical:18},
  startText:{color:'#fff',fontSize:18,fontWeight:'900',letterSpacing:3},
  // End
  endBox:{marginBottom:8},
  endCard:{borderWidth:1.5,borderRadius:20,padding:20,alignItems:'center',gap:10},
  endTitle:{fontSize:26,fontWeight:'900',letterSpacing:3},
  endRewards:{flexDirection:'row',gap:10},
  endRewardChip:{backgroundColor:'#ffd70018',borderWidth:1,borderColor:'#ffd70033',borderRadius:10,paddingHorizontal:14,paddingVertical:6},
  endRewardText:{color:'#ffd700',fontSize:15,fontWeight:'900'},
  endDesc:{color:'#6a84a0',fontSize:13,textAlign:'center',fontStyle:'italic'},
  endBtns:{flexDirection:'row',gap:12,marginTop:4},
  endBtn:{borderWidth:1,borderRadius:14,paddingHorizontal:24,paddingVertical:12},
});
// components/XpBar.js — Barre XP globale affichée en haut
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store/AuthContext';
import { listenXp, getLevelFromXp, LEVEL_REWARDS, xpForLevel } from '../store/xpService';
import { ALL_CREATURES } from '../data/creatures';

export default function XpBar() {
  const authCtx = useAuth();
  const user    = authCtx?.user;
  const uid     = user?.uid || 'guest';

  const [xpData, setXpData]         = useState({ totalXp:0, level:1, currentXp:0, neededXp:100 });
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [prevLevel, setPrevLevel]    = useState(1);

  const barAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const levelAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsub = listenXp(uid, data => {
      const computed = getLevelFromXp(data.totalXp || 0);
      setXpData({ ...data, ...computed });

      // Vérifie si level up
      if (computed.level > prevLevel && prevLevel > 1) {
        setShowLevelUp(computed.level);
        Animated.sequence([
          Animated.spring(levelAnim, { toValue:1.4, friction:3, useNativeDriver:true }),
          Animated.spring(levelAnim, { toValue:1,   friction:5, useNativeDriver:true }),
        ]).start();
      }
      setPrevLevel(computed.level);

      // Anime la barre
      const pct = computed.neededXp > 0 ? computed.currentXp / computed.neededXp : 0;
      Animated.spring(barAnim, { toValue: pct, friction: 6, useNativeDriver: false }).start();

      // Glow
      Animated.sequence([
        Animated.timing(glowAnim, { toValue:1, duration:300, useNativeDriver:false }),
        Animated.timing(glowAnim, { toValue:0, duration:600, useNativeDriver:false }),
      ]).start();
    });
    return unsub;
  }, [uid, prevLevel]);

  const pct = xpData.neededXp > 0 ? (xpData.currentXp / xpData.neededXp) * 100 : 0;
  const reward = LEVEL_REWARDS[xpData.level];
  const nextRewardLevel = Object.keys(LEVEL_REWARDS)
    .map(Number)
    .find(l => l > xpData.level);

  return (
    <>
      <View style={styles.container}>
        {/* Niveau */}
        <Animated.View style={[styles.levelBadge, { transform:[{scale:levelAnim}] }]}>
          <Text style={styles.levelText}>Nv.{xpData.level}</Text>
        </Animated.View>

        {/* Barre XP */}
        <View style={styles.barContainer}>
          <View style={styles.barBg}>
            <Animated.View style={[styles.barFill, {
              width: barAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
            }]}>
              <LinearGradient
                colors={['#00e5ff','#bf5fff']}
                start={{x:0,y:0}} end={{x:1,y:0}}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Glow */}
            <Animated.View style={[styles.barGlow, {
              width: barAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
              opacity: glowAnim,
            }]}/>
          </View>
          <View style={styles.xpLabels}>
            <Text style={styles.xpCurrent}>{xpData.currentXp} XP</Text>
            <Text style={styles.xpNeeded}>/{xpData.neededXp}</Text>
            {nextRewardLevel && (
              <Text style={styles.nextReward}>🎁 Nv.{nextRewardLevel}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Modal Level Up */}
      <Modal visible={!!showLevelUp} transparent animationType="fade"
        onRequestClose={() => setShowLevelUp(null)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0a0f1a','#0d1628']} style={styles.modalBox}>
            <Text style={styles.levelUpEmoji}>🎉</Text>
            <Text style={styles.levelUpTitle}>NIVEAU {showLevelUp} !</Text>
            {LEVEL_REWARDS[showLevelUp] && (
              <>
                <Text style={styles.levelUpRewardTitle}>RÉCOMPENSES</Text>
                <Text style={styles.levelUpTitle2}>
                  {LEVEL_REWARDS[showLevelUp].title}
                </Text>
                {LEVEL_REWARDS[showLevelUp].crystals > 0 && (
                  <Text style={styles.levelUpCrystals}>
                    +{LEVEL_REWARDS[showLevelUp].crystals} 💎
                  </Text>
                )}
                {LEVEL_REWARDS[showLevelUp].creature && ALL_CREATURES[LEVEL_REWARDS[showLevelUp].creature] && (
                  <Text style={styles.levelUpCreature}>
                    ✦ {ALL_CREATURES[LEVEL_REWARDS[showLevelUp].creature].name} débloqué !
                  </Text>
                )}
              </>
            )}
            <TouchableOpacity onPress={() => setShowLevelUp(null)} style={styles.levelUpBtn}>
              <Text style={styles.levelUpBtnText}>Super !</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:{
    flexDirection:'row', alignItems:'center', gap:8,
    paddingHorizontal:16, paddingVertical:6,
    backgroundColor:'#04060d', borderBottomWidth:1, borderBottomColor:'#0d1220',
  },
  levelBadge:{
    backgroundColor:'#00e5ff22', borderWidth:1, borderColor:'#00e5ff44',
    borderRadius:10, paddingHorizontal:8, paddingVertical:4,
  },
  levelText:{color:'#00e5ff',fontSize:11,fontWeight:'900',letterSpacing:1},
  barContainer:{flex:1,gap:2},
  barBg:{height:6,backgroundColor:'#0d1220',borderRadius:4,overflow:'hidden',position:'relative'},
  barFill:{height:'100%',borderRadius:4,overflow:'hidden'},
  barGlow:{position:'absolute',top:0,left:0,height:'100%',backgroundColor:'white',borderRadius:4},
  xpLabels:{flexDirection:'row',alignItems:'center',gap:4},
  xpCurrent:{color:'#00e5ff',fontSize:9,fontWeight:'700'},
  xpNeeded:{color:'#4a6080',fontSize:9},
  nextReward:{color:'#ffd700',fontSize:9,fontWeight:'700',marginLeft:'auto'},
  // Modal
  modalOverlay:{flex:1,backgroundColor:'#000000cc',justifyContent:'center',padding:40},
  modalBox:{borderWidth:1,borderColor:'#00e5ff33',borderRadius:24,padding:24,alignItems:'center',gap:10},
  levelUpEmoji:{fontSize:48},
  levelUpTitle:{color:'#00e5ff',fontSize:28,fontWeight:'900',letterSpacing:4},
  levelUpTitle2:{color:'#ffd700',fontSize:18,fontWeight:'900',letterSpacing:2},
  levelUpRewardTitle:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase'},
  levelUpCrystals:{color:'#ffd700',fontSize:22,fontWeight:'900'},
  levelUpCreature:{color:'#39ff8f',fontSize:14,fontWeight:'700'},
  levelUpBtn:{
    marginTop:8,backgroundColor:'#00e5ff22',borderWidth:1,borderColor:'#00e5ff44',
    borderRadius:14,paddingHorizontal:32,paddingVertical:14,
  },
  levelUpBtnText:{color:'#00e5ff',fontSize:15,fontWeight:'800',letterSpacing:2},
});
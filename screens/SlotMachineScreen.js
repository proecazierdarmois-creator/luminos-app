// screens/SlotMachineScreen.js — Machine à sous chance
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, get, set } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { useNavigation } from '@react-navigation/native';

const { width: SW } = Dimensions.get('window');
const SPIN_COST = 15;

// Symboles avec poids et valeurs
const SYMBOLS = [
  { id:'cherry',   emoji:'🍒', weight:35, value:0 },
  { id:'lemon',    emoji:'🍋', weight:28, value:0 },
  { id:'star',     emoji:'⭐', weight:18, value:0 },
  { id:'gem',      emoji:'💎', weight:12, value:0 },
  { id:'crown',    emoji:'👑', weight:5,  value:0 },
  { id:'luminos',  emoji:'✦',  weight:2,  value:0 },
];

const PAYOUTS = {
  // 3 identiques
  'cherry_cherry_cherry':   { crystals:20,  label:'3× 🍒' },
  'lemon_lemon_lemon':      { crystals:30,  label:'3× 🍋' },
  'star_star_star':         { crystals:60,  label:'3× ⭐' },
  'gem_gem_gem':             { crystals:120, label:'3× 💎' },
  'crown_crown_crown':      { crystals:300, label:'3× 👑' },
  'luminos_luminos_luminos': { crystals:1000, label:'3× ✦ JACKPOT', creature:'lumikos' },
};

function rollSymbol() {
  const total = SYMBOLS.reduce((a,s)=>a+s.weight,0);
  let rand = Math.random()*total, cumul=0;
  for (const s of SYMBOLS) {
    cumul += s.weight;
    if (rand < cumul) return s;
  }
  return SYMBOLS[0];
}

// ─── Reel (rouleau) ───────────────────────────────────────────────
function Reel({ symbol, spinning, delay }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const displaySymbols = [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2], SYMBOLS[3], SYMBOLS[4], SYMBOLS[5]];

  useEffect(()=>{
    if (spinning) {
      spinAnim.setValue(0);
      Animated.timing(spinAnim,{
        toValue:1, duration:1200+delay, useNativeDriver:true,
      }).start();
    }
  },[spinning]);

  return (
    <View style={styles.reelBox}>
      <Animated.View style={{
        opacity: spinning ? spinAnim.interpolate({inputRange:[0,0.1,0.9,1],outputRange:[1,0.3,0.3,1]}) : 1,
        transform:[{
          scale: spinning ? spinAnim.interpolate({inputRange:[0,0.5,1],outputRange:[1,1.1,1]}) : 1,
        }],
      }}>
        <Text style={styles.reelSymbol}>{spinning ? '❓' : symbol.emoji}</Text>
      </Animated.View>
    </View>
  );
}

export default function SlotMachineScreen() {
  const navigation = useNavigation();
  const { crystals, addCrystals, addToCollection } = useGameStore();
  const authCtx = useAuth();
  const uid = authCtx?.user?.uid || 'guest';
  const { showToast } = useToast();

  const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [freeUsed, setFreeUsed] = useState(false);
  const [totalSpins, setTotalSpins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const leverAnim = useRef(new Animated.Value(0)).current;
  const winAnim   = useRef(new Animated.Value(0)).current;
  const jackpotAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
    // Vérifier si le spin gratuit du jour a été utilisé
    const today = new Date().toISOString().split('T')[0];
    get(ref(db,`slotMachine/${uid}/lastFreeDate`)).then(snap=>{
      if (snap.exists() && snap.val()===today) setFreeUsed(true);
    });
    get(ref(db,`slotMachine/${uid}/stats`)).then(snap=>{
      if (snap.exists()) {
        setTotalSpins(snap.val().totalSpins||0);
        setTotalWon(snap.val().totalWon||0);
      }
    });
  },[]);

  async function handleSpin(isFree=false) {
    if (spinning) return;
    const cost = isFree ? 0 : SPIN_COST;
    if (!isFree && crystals < cost) return;
    if (isFree && freeUsed) return;

    setSpinning(true);
    setResult(null);
    winAnim.setValue(0);

    // Animation levier
    Animated.sequence([
      Animated.timing(leverAnim,{toValue:1,duration:200,useNativeDriver:true}),
      Animated.timing(leverAnim,{toValue:0,duration:400,useNativeDriver:true}),
    ]).start();

    if (!isFree) addCrystals(-cost);

    // Tire les 3 symboles
    const newReels = [rollSymbol(), rollSymbol(), rollSymbol()];

    setTimeout(()=>{
      setReels(newReels);
      setSpinning(false);

      // Vérifier le gain
      const key = newReels.map(s=>s.id).join('_');
      const payout = PAYOUTS[key];

      const newTotalSpins = totalSpins+1;
      let newTotalWon = totalWon;

      if (payout) {
        addCrystals(payout.crystals);
        newTotalWon += payout.crystals;
        setResult({win:true, ...payout});
        Animated.spring(winAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
        if (payout.creature) {
          addToCollection({id:payout.creature, uid:`jackpot_${Date.now()}`});
          Animated.loop(
            Animated.sequence([
              Animated.timing(jackpotAnim,{toValue:1,duration:400,useNativeDriver:true}),
              Animated.timing(jackpotAnim,{toValue:0,duration:400,useNativeDriver:true}),
            ]),{iterations:5}
          ).start();
        }
        showToast({
          type: payout.creature?'reward':'success',
          title: payout.creature?'🎰 JACKPOT !':'🎰 Gagné !',
          message: payout.label,
          crystals: payout.crystals,
          duration: 4000,
        });
      } else {
        setResult({win:false});
      }

      setTotalSpins(newTotalSpins);
      setTotalWon(newTotalWon);
      set(ref(db,`slotMachine/${uid}/stats`),{totalSpins:newTotalSpins,totalWon:newTotalWon}).catch(()=>{});

      if (isFree) {
        const today = new Date().toISOString().split('T')[0];
        setFreeUsed(true);
        set(ref(db,`slotMachine/${uid}/lastFreeDate`),today).catch(()=>{});
      }
    }, 1800);
  }

  const leverRotate = leverAnim.interpolate({inputRange:[0,1],outputRange:['0deg','25deg']});

  return (
    <LinearGradient colors={['#1a0010','#07090f','#1a0010']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>🎰 MACHINE À SOUS</Animated.Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Solde */}
          <LinearGradient colors={['#0d1a2e','#07090f']} style={styles.balanceBar}>
            <Text style={styles.balanceLbl}>SOLDE</Text>
            <Text style={styles.balanceVal}>💎 {crystals}</Text>
          </LinearGradient>

          {/* Machine */}
          <LinearGradient colors={['#2a0020','#1a0010']} style={styles.machineBody}>
            {/* Jackpot glow */}
            <Animated.View style={[StyleSheet.absoluteFill,{
              backgroundColor:'#ffd700',
              opacity: jackpotAnim.interpolate({inputRange:[0,1],outputRange:[0,0.15]}),
            }]}/>

            <Text style={styles.machineTitle}>✦ LUMINOS SLOTS ✦</Text>

            {/* Rouleaux */}
            <View style={styles.reelsRow}>
              {reels.map((s,i)=>(
                <Reel key={i} symbol={s} spinning={spinning} delay={i*200}/>
              ))}
            </View>

            {/* Ligne de paiement */}
            <View style={styles.payline}/>

            {/* Résultat */}
            {result&&!spinning&&(
              <Animated.View style={{
                opacity:winAnim.interpolate({inputRange:[0,1],outputRange:[result.win?0:1,1]}),
                transform:[{scale: result.win ? winAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]}) : 1}],
              }}>
                {result.win ? (
                  <View style={[styles.resultBox,{borderColor:result.creature?'#ffd700':'#39ff8f'}]}>
                    <Text style={[styles.resultText,{color:result.creature?'#ffd700':'#39ff8f'}]}>
                      {result.creature?'🎉 JACKPOT !':'✓ '+result.label}
                    </Text>
                    <Text style={[styles.resultCrystals,{color:result.creature?'#ffd700':'#39ff8f'}]}>
                      +{result.crystals} 💎{result.creature?' + LUMIKOS':''}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.resultBox,{borderColor:'#4a6080'}]}>
                    <Text style={styles.resultLoseText}>Pas de chance, réessaie !</Text>
                  </View>
                )}
              </Animated.View>
            )}
          </LinearGradient>

          {/* Boutons */}
          {!freeUsed&&(
            <TouchableOpacity onPress={()=>handleSpin(true)} disabled={spinning} style={styles.freeBtn}>
              <LinearGradient colors={['#39ff8f55','#39ff8f22']} style={styles.spinBtnGrad}>
                <Text style={styles.freeBtnText}>🎁 SPIN GRATUIT (1×/jour)</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={()=>handleSpin(false)} disabled={spinning||crystals<SPIN_COST}
            style={[styles.spinBtn,(spinning||crystals<SPIN_COST)&&styles.disabled]}>
            <LinearGradient colors={['#ff4fa399','#bf5fff99']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.spinBtnGrad}>
              <Text style={styles.spinBtnText}>{spinning?'🎰 Tirage...':`🎰 TIRER — ${SPIN_COST} 💎`}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tableau des gains */}
          <View style={styles.payoutBox}>
            <Text style={styles.sectionLabel}>💰 TABLEAU DES GAINS</Text>
            {Object.entries(PAYOUTS).map(([key,p])=>(
              <View key={key} style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>{p.label}</Text>
                <Text style={[styles.payoutVal,{color:p.creature?'#ffd700':'#39ff8f'}]}>
                  +{p.crystals} 💎{p.creature?' + créature':''}
                </Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{totalSpins}</Text>
              <Text style={styles.statLbl}>Tirages</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statVal,{color:'#ffd700'}]}>{totalWon}</Text>
              <Text style={styles.statLbl}>💎 Gagnés</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  backBtn:{paddingTop:12,paddingBottom:4},
  backBtnText:{color:'#00e5ff',fontSize:14,fontWeight:'700'},
  title:{fontSize:20,fontWeight:'900',color:'#fff',letterSpacing:3,textAlign:'center',marginBottom:10},
  scroll:{gap:14,paddingBottom:32},
  // Balance
  balanceBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#ffd70022',borderRadius:14,paddingHorizontal:14,paddingVertical:10},
  balanceLbl:{fontSize:7,color:'#4a6080',letterSpacing:2},
  balanceVal:{color:'#ffd700',fontSize:16,fontWeight:'900'},
  // Machine
  machineBody:{borderWidth:2,borderColor:'#ff4fa344',borderRadius:24,padding:20,alignItems:'center',gap:14},
  machineTitle:{color:'#ff4fa3',fontSize:14,fontWeight:'900',letterSpacing:3},
  reelsRow:{flexDirection:'row',gap:10,backgroundColor:'#0a0008',borderRadius:16,padding:14,borderWidth:1,borderColor:'#ff4fa333'},
  reelBox:{width:70,height:70,backgroundColor:'#1a0010',borderRadius:12,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#ff4fa322'},
  reelSymbol:{fontSize:38},
  payline:{width:'90%',height:1,backgroundColor:'#ff4fa344'},
  resultBox:{borderWidth:1.5,borderRadius:14,padding:12,alignItems:'center',gap:4},
  resultText:{fontSize:14,fontWeight:'900'},
  resultCrystals:{fontSize:16,fontWeight:'900'},
  resultLoseText:{color:'#4a6080',fontSize:13,fontStyle:'italic'},
  // Boutons
  freeBtn:{borderRadius:16,overflow:'hidden',borderWidth:1.5,borderColor:'#39ff8f55'},
  spinBtn:{borderRadius:16,overflow:'hidden',borderWidth:1.5,borderColor:'#ff4fa355'},
  spinBtnGrad:{alignItems:'center',paddingVertical:16},
  freeBtnText:{color:'#39ff8f',fontSize:14,fontWeight:'900',letterSpacing:1},
  spinBtnText:{color:'#fff',fontSize:15,fontWeight:'900',letterSpacing:1},
  disabled:{opacity:0.4},
  // Payout table
  payoutBox:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:16,padding:14,gap:8},
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700',marginBottom:4},
  payoutRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:4,borderBottomWidth:1,borderBottomColor:'#1e2d4a'},
  payoutLabel:{color:'#c8daf0',fontSize:13,fontWeight:'700'},
  payoutVal:{fontSize:12,fontWeight:'800'},
  // Stats
  statsRow:{flexDirection:'row',gap:10},
  statCard:{flex:1,backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:14,padding:12,alignItems:'center',gap:3},
  statVal:{fontSize:18,fontWeight:'900',color:'#c8daf0'},
  statLbl:{fontSize:9,color:'#4a6080',letterSpacing:1},
});
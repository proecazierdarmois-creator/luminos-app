// screens/CollectionScreen.js — Collection améliorée V2
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, SafeAreaView, TextInput, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES, CREATURES, CREATURE_LIST } from '../data/creatures';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48) / 3;

const FILTERS = [
  { id:'all',       label:'Tous',        color:'#00e5ff' },
  { id:'owned',     label:'Possédés',    color:'#39ff8f' },
  { id:'missing',   label:'Manquants',   color:'#ff4444' },
  { id:'common',    label:'Common',      color:'#6a84a0' },
  { id:'uncommon',  label:'Uncommon',    color:'#39ff8f' },
  { id:'rare',      label:'Rare',        color:'#bf5fff' },
  { id:'legendary', label:'Légendaire',  color:'#ffd700' },
  { id:'shiny',     label:'✨ Shiny',    color:'#ff69b4' },
];

const SORTS = [
  { id:'number', label:'#' },
  { id:'name',   label:'A-Z' },
  { id:'rarity', label:'Rareté' },
  { id:'owned',  label:'Quantité' },
];

const RARITY_ORDER = { common:0, uncommon:1, rare:2, legendary:3 };

// ─── Carte créature ───────────────────────────────────────────────
function CreatureGridCard({ item, onPress, index=0 }) {
  const Sprite   = SPRITES[item.id?.replace('_shiny','')]||SPRITES.lumikos;
  const isOwned  = item.owned>0;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    setTimeout(()=>{
      Animated.spring(entryAnim,{toValue:1,friction:6,useNativeDriver:true}).start();
    },Math.min(index*20,400));
  },[]);

  function handlePress() {
    if (!isOwned) return;
    Animated.sequence([
      Animated.timing(scaleAnim,{toValue:0.93,duration:70,useNativeDriver:true}),
      Animated.spring(scaleAnim,{toValue:1,friction:3,useNativeDriver:true}),
    ]).start(()=>onPress(item));
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={[styles.gridCard,{
        borderColor:isOwned?item.rarityColor+'66':'#1e2d4a',
        backgroundColor:isOwned?item.rarityColor+'10':'#0a0f18',
        opacity:Animated.multiply(entryAnim, isOwned?1:0.35),
        transform:[
          {scale:scaleAnim},
          {translateY:entryAnim.interpolate({inputRange:[0,1],outputRange:[12,0]})},
        ],
      }]}>
        {/* Gradient fond si possédé */}
        {isOwned&&(
          <View style={[StyleSheet.absoluteFill,{borderRadius:13,overflow:'hidden'}]}>
            <LinearGradient colors={[item.rarityColor+'18','transparent']} style={{flex:1}}/>
          </View>
        )}

        <Sprite size={60}/>
        <Text style={[styles.gridName,{color:isOwned?item.rarityColor:'#2a3a50'}]} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.gridNum}>{item.number}</Text>

        {/* Badge quantité */}
        {isOwned&&(
          <View style={[styles.ownedBadge,{backgroundColor:item.rarityColor}]}>
            <Text style={styles.ownedText}>×{item.owned}</Text>
          </View>
        )}

        {/* Shiny */}
        {item.isShiny&&isOwned&&(
          <View style={styles.shinyBadge}><Text style={styles.shinyBadgeText}>✨</Text></View>
        )}

        {/* Légendaire */}
        {item.rarity==='legendary'&&isOwned&&(
          <View style={styles.legBadge}><Text style={styles.legBadgeText}>★</Text></View>
        )}

        {/* Lock */}
        {!isOwned&&(
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Modal détail ─────────────────────────────────────────────────
function DetailModal({ creature, onClose }) {
  if (!creature) return null;
  const Sprite   = SPRITES[creature.id?.replace('_shiny','')]||SPRITES.lumikos;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.spring(scaleAnim,{toValue:1,friction:4,useNativeDriver:true}).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim,{toValue:-8,duration:1800,useNativeDriver:true}),
        Animated.timing(floatAnim,{toValue:0, duration:1800,useNativeDriver:true}),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,{toValue:1,duration:1000,useNativeDriver:true}),
        Animated.timing(glowAnim,{toValue:0,duration:1000,useNativeDriver:true}),
      ])
    ).start();
  },[]);

  const maxStat=160;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalBox,{transform:[{scale:scaleAnim}]}]}>
          <LinearGradient colors={creature.bgGradient||['#0d1220','#07090f']} style={styles.modalGrad}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalNum}>#{creature.number}</Text>
                <View style={{flexDirection:'row',gap:6}}>
                  {creature.isShiny&&<View style={styles.modalShinyBadge}><Text style={styles.modalShinyText}>✨ SHINY</Text></View>}
                  {creature.rarity==='legendary'&&<View style={styles.modalLegBadge}><Text style={styles.modalLegText}>★ LÉGENDAIRE</Text></View>}
                </View>
              </View>

              {/* Sprite flottant avec glow */}
              <Animated.View style={{transform:[{translateY:floatAnim}],alignItems:'center',marginVertical:8}}>
                <Animated.View style={{
                  shadowColor:creature.rarityColor,
                  shadowRadius:glowAnim.interpolate({inputRange:[0,1],outputRange:[20,40]}),
                  shadowOpacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.4,0.9]}),
                }}>
                  <Sprite size={150}/>
                </Animated.View>
              </Animated.View>

              {/* Nom */}
              <Text style={[styles.modalName,{color:creature.rarityColor}]}>{creature.name}</Text>
              {creature.jp&&<Text style={styles.modalJp}>{creature.jp}</Text>}

              {/* Tags */}
              <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
                <View style={[styles.modalTag,{borderColor:creature.rarityColor+'44',backgroundColor:creature.rarityColor+'18'}]}>
                  <Text style={[styles.modalTagText,{color:creature.rarityColor}]}>{creature.type}</Text>
                </View>
                <View style={[styles.modalTag,{borderColor:creature.rarityColor+'33',backgroundColor:creature.rarityColor+'12'}]}>
                  <Text style={[styles.modalTagText,{color:creature.rarityColor}]}>{creature.rarityLabel}</Text>
                </View>
                <View style={[styles.modalTag,{borderColor:'#1e2d4a'}]}>
                  <Text style={styles.modalTagTextDim}>{(creature.dropRate*100).toFixed(1)}% drop</Text>
                </View>
              </View>

              {/* Quantité */}
              <LinearGradient colors={[creature.rarityColor+'18',creature.rarityColor+'08']}
                style={[styles.modalOwnedBox,{borderColor:creature.rarityColor+'33'}]}>
                <Text style={styles.modalOwnedLabel}>En collection</Text>
                <Text style={[styles.modalOwnedVal,{color:creature.rarityColor}]}>×{creature.owned}</Text>
              </LinearGradient>

              {/* Description */}
              <Text style={styles.modalDesc}>{creature.description}</Text>

              {/* Stats */}
              <Text style={styles.modalSectionLabel}>📊 STATISTIQUES</Text>
              {[
                {label:'PV', key:'hp', color:'#39ff8f'},
                {label:'ATK',key:'atk',color:'#ff4fa3'},
                {label:'DEF',key:'def',color:'#00e5ff'},
                {label:'VIT',key:'spd',color:'#ffd700'},
              ].map(s=>(
                <View key={s.key} style={styles.statRow}>
                  <Text style={[styles.statLabel,{color:s.color}]}>{s.label}</Text>
                  <View style={styles.statBarBg}>
                    <View style={[styles.statBarFill,{
                      width:`${Math.min(100,(creature.stats[s.key]/maxStat)*100)}%`,
                      backgroundColor:s.color,
                    }]}/>
                  </View>
                  <Text style={[styles.statVal,{color:s.color}]}>{creature.stats[s.key]}</Text>
                </View>
              ))}

              {/* Attaques */}
              {creature.moves?.length>0&&(
                <>
                  <Text style={styles.modalSectionLabel}>⚔️ ATTAQUES</Text>
                  {creature.moves.map(m=>(
                    <View key={m.name} style={[styles.moveRow,{borderColor:creature.rarityColor+'33',backgroundColor:creature.rarityColor+'08'}]}>
                      <View style={[styles.moveDot,{backgroundColor:creature.rarityColor}]}/>
                      <Text style={styles.moveName}>{m.name}</Text>
                      <View style={[styles.movePowerBadge,{backgroundColor:creature.rarityColor+'22',borderColor:creature.rarityColor+'44'}]}>
                        <Text style={[styles.movePower,{color:creature.rarityColor}]}>⚡ {m.power}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Fermer */}
              <TouchableOpacity onPress={onClose}
                style={[styles.closeBtn,{borderColor:creature.rarityColor+'44',backgroundColor:creature.rarityColor+'18'}]}>
                <Text style={[styles.closeBtnText,{color:creature.rarityColor}]}>← Fermer</Text>
              </TouchableOpacity>

            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── CollectionScreen ─────────────────────────────────────────────
export default function CollectionScreen() {
  const { collection, crystals, wins } = useGameStore();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('all');
  const [sort, setSort]         = useState('number');
  const [search, setSearch]     = useState('');
  const [showSort, setShowSort] = useState(false);

  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const uniqueOwned    = new Set(collection.map(c=>c.id)).size;
  const totalCreatures = CREATURE_LIST.length;
  const shinysOwned    = collection.filter(c=>c.isShiny).length;
  const legendsOwned   = new Set(collection.filter(c=>CREATURES[c.id]?.rarity==='legendary').map(c=>c.id)).size;
  const pct = Math.round((uniqueOwned/totalCreatures)*100);
  const completionColor = pct>=80?'#39ff8f':pct>=50?'#ffd700':'#00e5ff';

  const pokedex = CREATURE_LIST.map(c=>({
    ...c,
    owned:collection.filter(x=>x.id===c.id).length,
    isShiny:collection.some(x=>x.id===c.id&&x.isShiny),
  }));

  let filtered = pokedex.filter(c=>{
    if (search) return c.name.toLowerCase().includes(search.toLowerCase());
    switch(filter) {
      case 'owned':     return c.owned>0;
      case 'missing':   return c.owned===0;
      case 'common':    return c.rarity==='common';
      case 'uncommon':  return c.rarity==='uncommon';
      case 'rare':      return c.rarity==='rare';
      case 'legendary': return c.rarity==='legendary';
      case 'shiny':     return collection.some(x=>x.id===c.id&&x.isShiny);
      default:          return true;
    }
  });

  filtered = [...filtered].sort((a,b)=>{
    switch(sort) {
      case 'name':   return a.name.localeCompare(b.name);
      case 'rarity': return (RARITY_ORDER[b.rarity]||0)-(RARITY_ORDER[a.rarity]||0);
      case 'owned':  return b.owned-a.owned;
      default:       return (a.number||'').localeCompare(b.number||'');
    }
  });

  const activeFilter = FILTERS.find(f=>f.id===filter);

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* Titre */}
        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>COLLECTION</Animated.Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.statCard,{borderColor:'#00e5ff33'}]}>
            <Text style={[styles.statCardVal,{color:'#00e5ff'}]}>{uniqueOwned}/{totalCreatures}</Text>
            <Text style={styles.statCardLbl}>Pokédex</Text>
          </LinearGradient>
          <LinearGradient colors={['#180a2e','#07090f']} style={[styles.statCard,{borderColor:'#ff69b433'}]}>
            <Text style={[styles.statCardVal,{color:'#ff69b4'}]}>{shinysOwned} ✨</Text>
            <Text style={styles.statCardLbl}>Shinys</Text>
          </LinearGradient>
          <LinearGradient colors={['#1a1000','#07090f']} style={[styles.statCard,{borderColor:'#ffd70033'}]}>
            <Text style={[styles.statCardVal,{color:'#ffd700'}]}>{legendsOwned} ★</Text>
            <Text style={styles.statCardLbl}>Légendaires</Text>
          </LinearGradient>
          <LinearGradient colors={['#0a1a0a','#07090f']} style={[styles.statCard,{borderColor:'#39ff8f33'}]}>
            <Text style={[styles.statCardVal,{color:'#39ff8f'}]}>{wins} V</Text>
            <Text style={styles.statCardLbl}>Victoires</Text>
          </LinearGradient>
        </View>

        {/* Barre complétion */}
        <View style={styles.completionRow}>
          <Text style={[styles.completionLabel,{color:completionColor}]}>Pokédex {pct}%</Text>
          <View style={styles.completionBarBg}>
            <Animated.View style={[styles.completionBarFill,{width:`${pct}%`,backgroundColor:completionColor}]}/>
          </View>
        </View>

        {/* Recherche + tri */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
              placeholder="Rechercher..." placeholderTextColor="#4a6080"/>
            {search!==''&&(
              <TouchableOpacity onPress={()=>setSearch('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={()=>setShowSort(v=>!v)}
            style={[styles.sortBtn,showSort&&styles.sortBtnActive]}>
            <Text style={[styles.sortBtnText,showSort&&{color:'#ffd700'}]}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* Tri */}
        {showSort&&(
          <View style={styles.sortRow}>
            {SORTS.map(s=>(
              <TouchableOpacity key={s.id} onPress={()=>{setSort(s.id);setShowSort(false);}}
                style={[styles.sortOption,sort===s.id&&styles.sortOptionActive]}>
                <Text style={[styles.sortOptionText,sort===s.id&&{color:'#ffd700'}]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f=>(
            <TouchableOpacity key={f.id} onPress={()=>{setFilter(f.id);setSearch('');}}
              style={[styles.filterBtn,
                filter===f.id&&{borderColor:f.color+'55',backgroundColor:f.color+'15'}
              ]}>
              <Text style={[styles.filterText,filter===f.id&&{color:f.color}]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Compteur */}
        <View style={styles.countRow}>
          <Text style={styles.countLabel}>
            {filtered.length} créature{filtered.length!==1?'s':''}
          </Text>
          {activeFilter&&filter!=='all'&&(
            <View style={[styles.filterActivePill,{backgroundColor:activeFilter.color+'18',borderColor:activeFilter.color+'33'}]}>
              <Text style={[styles.filterActivePillText,{color:activeFilter.color}]}>{activeFilter.label}</Text>
            </View>
          )}
        </View>

        {/* Grille */}
        <FlatList
          data={filtered}
          numColumns={3}
          keyExtractor={item=>item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={(
            <View style={styles.emptyBox}>
              <Text style={{fontSize:40}}>🔍</Text>
              <Text style={styles.emptyText}>Aucune créature trouvée</Text>
            </View>
          )}
          renderItem={({item,index})=>(
            <CreatureGridCard item={item} onPress={setSelected} index={index}/>
          )}
        />

        {selected&&<DetailModal creature={selected} onClose={()=>setSelected(null)}/>}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1},
  title:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:6,textAlign:'center',paddingTop:16,marginBottom:10},
  // Stats
  statsRow:{flexDirection:'row',gap:6,paddingHorizontal:16,marginBottom:8},
  statCard:{flex:1,borderWidth:1,borderRadius:12,padding:8,alignItems:'center',gap:2},
  statCardVal:{fontSize:12,fontWeight:'900'},
  statCardLbl:{fontSize:7,color:'#4a6080',letterSpacing:0.5,textTransform:'uppercase'},
  // Completion
  completionRow:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:16,marginBottom:8},
  completionLabel:{fontSize:10,fontWeight:'700',width:80},
  completionBarBg:{flex:1,height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  completionBarFill:{height:'100%',borderRadius:4},
  // Search
  searchRow:{flexDirection:'row',gap:8,paddingHorizontal:16,marginBottom:6},
  searchBox:{flex:1,flexDirection:'row',alignItems:'center',backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,paddingHorizontal:12,gap:8},
  searchIcon:{fontSize:14},
  searchInput:{flex:1,color:'#fff',fontSize:14,paddingVertical:10},
  searchClear:{color:'#4a6080',fontSize:14,padding:4},
  sortBtn:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,width:44,alignItems:'center',justifyContent:'center'},
  sortBtnActive:{borderColor:'#ffd70044',backgroundColor:'#ffd70012'},
  sortBtnText:{color:'#4a6080',fontSize:18,fontWeight:'700'},
  sortRow:{flexDirection:'row',gap:6,paddingHorizontal:16,marginBottom:6},
  sortOption:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:10,paddingHorizontal:12,paddingVertical:6,backgroundColor:'#0d1220'},
  sortOptionActive:{borderColor:'#ffd70044',backgroundColor:'#ffd70012'},
  sortOptionText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  // Filters
  filterScroll:{maxHeight:44,marginBottom:4},
  filterRow:{paddingHorizontal:16,gap:7,alignItems:'center'},
  filterBtn:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:20,paddingHorizontal:12,paddingVertical:6,backgroundColor:'#0d1220'},
  filterText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  // Count
  countRow:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:16,marginBottom:6},
  countLabel:{color:'#4a6080',fontSize:10,letterSpacing:2},
  filterActivePill:{borderWidth:1,borderRadius:8,paddingHorizontal:8,paddingVertical:2},
  filterActivePillText:{fontSize:9,fontWeight:'700'},
  // Grid
  grid:{paddingHorizontal:12,paddingBottom:24},
  gridRow:{gap:8,marginBottom:8},
  gridCard:{width:CARD_W,borderWidth:1.5,borderRadius:14,padding:8,alignItems:'center',gap:4,position:'relative',overflow:'hidden'},
  gridName:{fontSize:8,fontWeight:'800',letterSpacing:0.5,textAlign:'center'},
  gridNum:{fontSize:7,color:'#4a6080'},
  ownedBadge:{position:'absolute',top:4,right:4,borderRadius:7,paddingHorizontal:5,paddingVertical:1},
  ownedText:{fontSize:7,fontWeight:'900',color:'#000'},
  shinyBadge:{position:'absolute',top:4,left:4},
  shinyBadgeText:{fontSize:9},
  legBadge:{position:'absolute',bottom:22,right:4},
  legBadgeText:{fontSize:9,color:'#ffd700',fontWeight:'900'},
  lockOverlay:{position:'absolute',top:0,left:0,right:0,bottom:0,alignItems:'center',justifyContent:'center'},
  lockIcon:{fontSize:18},
  emptyBox:{alignItems:'center',paddingVertical:40,gap:10},
  emptyText:{color:'#4a6080',fontSize:14},
  // Modal
  modalOverlay:{flex:1,backgroundColor:'#000000dd',justifyContent:'center',padding:16},
  modalBox:{borderRadius:24,overflow:'hidden',maxHeight:'92%'},
  modalGrad:{borderWidth:1,borderRadius:24},
  modalScroll:{padding:20,alignItems:'center',gap:10},
  modalHeader:{flexDirection:'row',justifyContent:'space-between',width:'100%',alignItems:'center'},
  modalNum:{fontSize:11,color:'#4a6080',letterSpacing:2,fontWeight:'700'},
  modalShinyBadge:{backgroundColor:'#ff69b422',borderWidth:1,borderColor:'#ff69b444',borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  modalShinyText:{color:'#ff69b4',fontSize:9,fontWeight:'900',letterSpacing:1},
  modalLegBadge:{backgroundColor:'#ffd70022',borderWidth:1,borderColor:'#ffd70044',borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  modalLegText:{color:'#ffd700',fontSize:9,fontWeight:'900',letterSpacing:1},
  modalName:{fontSize:26,fontWeight:'900',letterSpacing:3,textAlign:'center'},
  modalJp:{fontSize:10,color:'#4a6080',letterSpacing:3},
  modalTag:{borderWidth:1,borderRadius:20,paddingHorizontal:12,paddingVertical:4},
  modalTagText:{fontSize:10,fontWeight:'700',letterSpacing:1},
  modalTagTextDim:{fontSize:10,color:'#4a6080',fontWeight:'700'},
  modalOwnedBox:{borderWidth:1,borderRadius:14,padding:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%'},
  modalOwnedLabel:{color:'#4a6080',fontSize:13},
  modalOwnedVal:{fontSize:18,fontWeight:'900'},
  modalDesc:{color:'#6a84a0',fontSize:13,textAlign:'center',fontStyle:'italic',lineHeight:20},
  modalSectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700',alignSelf:'flex-start'},
  statRow:{flexDirection:'row',alignItems:'center',gap:8,width:'100%'},
  statLabel:{fontSize:10,fontWeight:'700',width:32,letterSpacing:1},
  statBarBg:{flex:1,height:6,backgroundColor:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'},
  statBarFill:{height:'100%',borderRadius:4},
  statVal:{fontSize:12,fontWeight:'900',width:32,textAlign:'right'},
  moveRow:{flexDirection:'row',alignItems:'center',gap:10,width:'100%',borderWidth:1,borderRadius:12,padding:10},
  moveDot:{width:8,height:8,borderRadius:4},
  moveName:{flex:1,color:'#c8daf0',fontSize:13,fontWeight:'600'},
  movePowerBadge:{borderWidth:1,borderRadius:8,paddingHorizontal:8,paddingVertical:4},
  movePower:{fontSize:13,fontWeight:'900'},
  closeBtn:{width:'100%',borderWidth:1,borderRadius:14,padding:14,alignItems:'center'},
  closeBtnText:{fontSize:14,fontWeight:'800',letterSpacing:2},
});
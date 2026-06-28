// screens/NewsScreen.js — Actualités & Patch Notes
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Dimensions, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';

const { width: SW } = Dimensions.get('window');

// ─── Actualités hardcodées ────────────────────────────────────────
const HARDCODED_NEWS = [
  {
    id:'patch_v6',
    type:'patch',
    tag:'PATCH NOTES',
    tagColor:'#00e5ff',
    title:'Version 6.0 — Grande refonte visuelle',
    date:'28 juin 2026',
    emoji:'🎨',
    bg:['#0d1a2e','#07090f'],
    content:[
      '✦ Tous les écrans redessinés avec des gradients et animations',
      '🥚 Système d\'élevage amélioré — 3 anneaux sur l\'œuf',
      '⚔️ Combat V2 — arène animée, particules colorées',
      '🏅 Système d\'achievements permanents',
      '📖 Mode histoire enrichi avec badges EN COURS / TERMINÉ',
      '🌑 Éclipse améliorée — lune 3 anneaux, corona 18 rayons',
      '🏠 Accueil repensé — stats cards, alertes colorées',
    ],
  },
  {
    id:'event_eclipse',
    type:'event',
    tag:'ÉVÉNEMENT',
    tagColor:'#bf5fff',
    title:'Éclipse d\'été — 21 juin 2026',
    date:'21 juin 2026',
    emoji:'🌑',
    bg:['#0a0018','#150030'],
    content:[
      '🌑 L\'Éclipse d\'été est terminée — 25 joueurs ont capturé LUMINOS',
      '📅 Prochaine Éclipse : 22 septembre 2026 (équinoxe d\'automne)',
      '✦ Prépare le Rituel des 7 Gardiens dès maintenant !',
    ],
  },
  {
    id:'patch_v5',
    type:'patch',
    tag:'PATCH NOTES',
    tagColor:'#00e5ff',
    title:'Version 5.0 — Guildes & Défis',
    date:'10 juin 2026',
    emoji:'⚔️',
    bg:['#0d1a2e','#07090f'],
    content:[
      '⚔️ Guildes — créer, rejoindre, chat en temps réel',
      '🏆 Défis quotidiens de guilde avec classement',
      '👥 Système d\'amis — échanges et profils',
      '📖 Mode histoire — 5 chapitres avec dialogues',
      '🌍 Monde — rencontres et captures de créatures',
    ],
  },
  {
    id:'news_android',
    type:'news',
    tag:'ANNONCE',
    tagColor:'#39ff8f',
    title:'Version Android en approche !',
    date:'28 juin 2026',
    emoji:'🤖',
    bg:['#041204','#07090f'],
    content:[
      '🤖 La version Android est en cours de validation sur le Google Play Store',
      '📱 Disponible très prochainement pour tous les joueurs Android',
      '🔔 Reste connecté pour l\'annonce officielle !',
    ],
  },
];

// ─── Type badge ───────────────────────────────────────────────────
function TypeBadge({ tag, color }) {
  return (
    <View style={[styles.typeBadge,{backgroundColor:color+'22',borderColor:color+'44'}]}>
      <Text style={[styles.typeBadgeText,{color}]}>{tag}</Text>
    </View>
  );
}

// ─── News Card ────────────────────────────────────────────────────
function NewsCard({ item, index }) {
  const [expanded, setExpanded] = useState(index===0);
  const entryAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(index===0?1:0)).current;

  useEffect(()=>{
    setTimeout(()=>{
      Animated.spring(entryAnim,{toValue:1,friction:6,useNativeDriver:true}).start();
    },index*80);
  },[]);

  function toggleExpand() {
    const toVal = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(expandAnim,{toValue:toVal,duration:250,useNativeDriver:false}).start();
  }

  return (
    <Animated.View style={{
      opacity:entryAnim,
      transform:[{translateY:entryAnim.interpolate({inputRange:[0,1],outputRange:[20,0]})}],
    }}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.9}>
        <LinearGradient colors={item.bg} style={[styles.newsCard,{borderColor:item.tagColor+'44'}]}>
          {/* Header */}
          <View style={styles.newsHeader}>
            <Text style={styles.newsEmoji}>{item.emoji}</Text>
            <View style={styles.newsHeaderInfo}>
              <TypeBadge tag={item.tag} color={item.tagColor}/>
              <Text style={[styles.newsTitle,{color:item.tagColor}]}>{item.title}</Text>
              <Text style={styles.newsDate}>📅 {item.date}</Text>
            </View>
            <Text style={[styles.expandIcon,{color:item.tagColor}]}>{expanded?'▲':'▼'}</Text>
          </View>

          {/* Contenu expandable */}
          {expanded&&(
            <View style={styles.newsContent}>
              <View style={[styles.newsDivider,{backgroundColor:item.tagColor+'33'}]}/>
              {item.content.map((line,i)=>(
                <Text key={i} style={styles.newsLine}>{line}</Text>
              ))}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── NewsScreen ───────────────────────────────────────────────────
export default function NewsScreen() {
  const [firebaseNews, setFirebaseNews] = useState([]);
  const [tab, setTab] = useState('tous');
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(titleAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
    // Charge les actualités Firebase
    const unsub = onValue(ref(db,'news'), snap=>{
      if (snap.exists()) {
        const items = Object.entries(snap.val())
          .map(([id,v])=>({id,...v}))
          .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
        setFirebaseNews(items);
      }
    });
    return unsub;
  },[]);

  // Fusion hardcodé + Firebase
  const allNews = [...firebaseNews, ...HARDCODED_NEWS];
  const filtered = tab==='tous' ? allNews
    : tab==='patch' ? allNews.filter(n=>n.type==='patch')
    : tab==='event' ? allNews.filter(n=>n.type==='event')
    : allNews.filter(n=>n.type==='news');

  const tabs = [
    {id:'tous',  label:'Tout',        color:'#00e5ff'},
    {id:'patch', label:'Patch Notes', color:'#00e5ff'},
    {id:'event', label:'Événements',  color:'#bf5fff'},
    {id:'news',  label:'Annonces',    color:'#39ff8f'},
  ];

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        <Animated.Text style={[styles.title,{
          opacity:titleAnim,
          transform:[{translateY:titleAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>📰 ACTUALITÉS</Animated.Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map(t=>(
            <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)}
              style={[styles.tabBtn,tab===t.id&&{backgroundColor:t.color+'18',borderColor:t.color+'44'}]}>
              <Text style={[styles.tabText,tab===t.id&&{color:t.color}]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Stats */}
          <View style={styles.statsRow}>
            <LinearGradient colors={['#0d1a2e','#07090f']} style={[styles.statCard,{borderColor:'#00e5ff33'}]}>
              <Text style={[styles.statVal,{color:'#00e5ff'}]}>{allNews.length}</Text>
              <Text style={styles.statLbl}>Actualités</Text>
            </LinearGradient>
            <LinearGradient colors={['#0a0018','#07090f']} style={[styles.statCard,{borderColor:'#bf5fff33'}]}>
              <Text style={[styles.statVal,{color:'#bf5fff'}]}>{allNews.filter(n=>n.type==='event').length}</Text>
              <Text style={styles.statLbl}>Événements</Text>
            </LinearGradient>
            <LinearGradient colors={['#041204','#07090f']} style={[styles.statCard,{borderColor:'#39ff8f33'}]}>
              <Text style={[styles.statVal,{color:'#39ff8f'}]}>V6.0</Text>
              <Text style={styles.statLbl}>Version</Text>
            </LinearGradient>
          </View>

          {/* News */}
          {filtered.length===0
            ?<View style={styles.emptyBox}>
              <Text style={{fontSize:40}}>📭</Text>
              <Text style={styles.emptyText}>Aucune actualité dans cette catégorie</Text>
            </View>
            :filtered.map((item,i)=><NewsCard key={item.id} item={item} index={i}/>)
          }

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>✦ LUMINOS — Toujours en évolution</Text>
            <Text style={styles.footerSub}>Les mises à jour sont déployées régulièrement</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:5,textAlign:'center',paddingTop:16,marginBottom:10},
  // Tabs
  tabRow:{flexDirection:'row',gap:8,marginBottom:10,flexWrap:'wrap'},
  tabBtn:{borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,paddingHorizontal:14,paddingVertical:8,backgroundColor:'#0d1220'},
  tabText:{color:'#4a6080',fontSize:11,fontWeight:'700'},
  // Stats
  statsRow:{flexDirection:'row',gap:8,marginBottom:4},
  statCard:{flex:1,borderWidth:1,borderRadius:14,padding:12,alignItems:'center',gap:3},
  statVal:{fontSize:18,fontWeight:'900'},
  statLbl:{fontSize:8,color:'#4a6080',letterSpacing:1,textTransform:'uppercase'},
  // Scroll
  scroll:{gap:12,paddingBottom:32},
  // News card
  newsCard:{borderWidth:1.5,borderRadius:18,padding:16,gap:10},
  newsHeader:{flexDirection:'row',alignItems:'flex-start',gap:10},
  newsEmoji:{fontSize:32,width:40,textAlign:'center'},
  newsHeaderInfo:{flex:1,gap:5},
  newsTitle:{fontSize:14,fontWeight:'900',letterSpacing:0.5},
  newsDate:{color:'#4a6080',fontSize:10},
  expandIcon:{fontSize:12,fontWeight:'900',paddingTop:4},
  newsContent:{gap:8},
  newsDivider:{height:1,marginVertical:2},
  newsLine:{color:'#c8daf0',fontSize:12,lineHeight:20},
  // Type badge
  typeBadge:{borderWidth:1,borderRadius:8,paddingHorizontal:7,paddingVertical:2,alignSelf:'flex-start'},
  typeBadgeText:{fontSize:8,fontWeight:'900',letterSpacing:1.5},
  // Empty
  emptyBox:{alignItems:'center',paddingVertical:40,gap:10},
  emptyText:{color:'#4a6080',fontSize:13,textAlign:'center'},
  // Footer
  footer:{alignItems:'center',paddingVertical:16,gap:4},
  footerText:{color:'#4a6080',fontSize:11,fontWeight:'700',letterSpacing:1},
  footerSub:{color:'#2a3a50',fontSize:10},
});
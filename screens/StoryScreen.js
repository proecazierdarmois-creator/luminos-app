// screens/StoryScreen.js — Mode Histoire amélioré
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../config/firebase';
import { ref, set, onValue } from 'firebase/database';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../store/AuthContext';
import { SPRITES } from '../components/CreatureCard';
import { ALL_CREATURES } from '../data/creatures';
import { addXp, XP_REWARDS } from '../store/xpService';
import { useToast } from '../store/ToastContext';
import { auth } from '../config/firebase';

const { width: SW } = Dimensions.get('window');

// ─── Personnages ─────────────────────────────────────────────────
const CHARACTERS = {
  oryn:     { name:'Sage Oryn',  color:'#ffd700', emoji:'🧙', bg:'#ffd70015' },
  lumikos:  { name:'Lumikos',    color:'#00e5ff', emoji:'✦',  bg:'#00e5ff15' },
  stranger: { name:'???',        color:'#bf5fff', emoji:'👤', bg:'#bf5fff15' },
  umbrax:   { name:'Umbrax',     color:'#8844cc', emoji:'🌑', bg:'#8844cc15' },
  crystara: { name:'Crystara',   color:'#aaeeff', emoji:'💎', bg:'#aaeeff15' },
  player:   { name:'Toi',        color:'#39ff8f', emoji:'⚡', bg:'#39ff8f15' },
};

// ─── Chapitres ────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id:1, title:"L'Éveil", subtitle:'Le commencement de tout',
    emoji:'🌟', color:'#00e5ff', bgGradient:['#0d1a2e','#0a2040'], unlocked:true,
    description:"Une lumière mystérieuse t\"a conduit jusqu\"ici. Le Sage Oryn t\"attend.",
    quests:[
      { id:'ch1_q1', title:'La Rencontre', objective:'Parle au Sage Oryn', type:'dialogue',
        reward:{crystals:10,creature:null}, xp:30,
        dialogue:[
          {char:'oryn',    text:"Enfin... tu es arrivé. J\"attendais quelqu\"un comme toi depuis bien longtemps."},
          {char:'player',  text:"Qui êtes-vous ? Où suis-je ?"},
          {char:'oryn',    text:"Je suis Oryn, gardien de l\"ordre des Luminos. Et toi... tu es le Choisi."},
          {char:'oryn',    text:"Ce monde est peuplé de créatures de lumière et d\"ombre. Elles ont besoin de toi."},
          {char:'player',  text:"Moi ? Pourquoi moi ?"},
          {char:'oryn',    text:"Parce que tu peux les entendre. Leur chant résonne en toi. Commence par invoquer ta première créature."},
        ],
      },
      { id:'ch1_q2', title:'Première Invocation', objective:'Invoque ta première créature', type:'summon', target:1,
        reward:{crystals:15,creature:null}, xp:40,
        dialogue:[
          {char:'oryn',   text:"Bien. Tu as senti l\"appel. Chaque créature choisit son compagnon."},
          {char:'lumikos',text:"...✦..."},
          {char:'oryn',   text:"Regarde — Lumikos te reconnaît. C\"est bon signe."},
          {char:'player', text:"Il est... magnifique."},
          {char:'oryn',   text:"Prends soin de lui. Votre lien grandira avec le temps."},
        ],
      },
      { id:'ch1_q3', title:'Premier Combat', objective:'Remporte ton premier combat', type:'win', target:1,
        reward:{crystals:20,creature:'lumikos'}, xp:50,
        dialogue:[
          {char:'oryn',     text:"Excellent ! Tu as le talent d\"un vrai dresseur."},
          {char:'oryn',     text:"Mais le chemin sera long. L\"ombre s\"étend sur notre monde..."},
          {char:'stranger', text:"..."},
          {char:'oryn',     text:"Qu\"est-ce que c\"était ? Une présence... sombre. Sois vigilant."},
          {char:'player',   text:"Que se passe-t-il vraiment ?"},
          {char:'oryn',     text:"Je t\"expliquerai tout au Chapitre 2. Pour l\"instant, entraîne-toi."},
        ],
      },
    ],
  },
  {
    id:2, title:"L'Ombre Grandissante", subtitle:'Une menace se réveille',
    emoji:'🌑', color:'#8844cc', bgGradient:['#08000f','#100018'], unlocked:false,
    description:"Une présence sombre perturbe l\"équilibre des créatures. Oryn a besoin de ton aide.",
    quests:[
      { id:'ch2_q1', title:"Le Message d\"Oryn", objective:'Écoute le message du Sage', type:'dialogue',
        reward:{crystals:15,creature:null}, xp:40,
        dialogue:[
          {char:'oryn',  text:"Je t\"attendais. L\"ombre dont je t\"ai parlé... elle a un nom."},
          {char:'oryn',  text:"Umbrax. L\"anti-lumière. Il était endormi depuis des siècles."},
          {char:'player',text:"Qu\"est-ce qu\"il veut ?"},
          {char:'oryn',  text:"Absorber toute la lumière du monde. Sans lumière, les créatures Luminos disparaîtront."},
          {char:'player',text:"Comment l\"arrêter ?"},
          {char:'oryn',  text:"En rassemblant les 7 Gardiens. Des créatures légendaires qui protègent l\"équilibre."},
        ],
      },
      { id:'ch2_q2', title:'Renforcement', objective:'Obtiens 5 créatures', type:'collect', target:5,
        reward:{crystals:25,creature:null}, xp:50,
        dialogue:[
          {char:'oryn',  text:"Pour affronter l\"ombre, tu auras besoin d\"alliés."},
          {char:'oryn',  text:"Les créatures sentent ta lumière intérieure. Elles viendront à toi."},
          {char:'player',text:"Je les protégerai toutes."},
          {char:'oryn',  text:"Je n\"en doute pas. Continue ton voyage."},
        ],
      },
      { id:'ch2_q3', title:"L\"Avant-Poste Sombre", objective:'Remporte 5 combats', type:'win', target:5,
        reward:{crystals:30,creature:'pyrox'}, xp:60,
        dialogue:[
          {char:'stranger',text:"Tu es plus fort que je ne le pensais..."},
          {char:'player',  text:"Qui es-tu vraiment ?"},
          {char:'stranger',text:"Un serviteur de l\"ombre. Mais tu as gagné mon respect."},
          {char:'oryn',    text:"Attention ! Il disparaît dans les ténèbres."},
          {char:'oryn',    text:"Umbrax commence à envoyer ses émissaires. Le chapitre 3 s\"ouvre à toi."},
        ],
      },
    ],
  },
  {
    id:3, title:'Les Gardiens', subtitle:'Rassemble les protecteurs',
    emoji:'⚔️', color:'#ff6b35', bgGradient:['#1a0800','#2a1000'], unlocked:false,
    description:"Les 7 Gardiens sont dispersés aux quatre coins du monde. Il faut les trouver.",
    quests:[
      { id:'ch3_q1', title:'La Carte des Gardiens', objective:'Découvre les emplacements', type:'dialogue',
        reward:{crystals:20,creature:null}, xp:50,
        dialogue:[
          {char:'oryn',    text:"Voici la carte ancienne. Les 7 Gardiens se cachent dans des zones précises."},
          {char:'oryn',    text:"Le premier se trouve dans la Forêt de Lumière. Tu le reconnaitras."},
          {char:'player',  text:"Comment les convaincre de nous rejoindre ?"},
          {char:'oryn',    text:"En prouvant ta valeur. Chaque Gardien a son épreuve."},
          {char:'crystara',text:"...Je sens ta lumière. Elle est pure. Méfie-toi de l\"ombre qui te suit."},
          {char:'player',  text:"Crystara ? Tu peux nous entendre ?"},
          {char:'crystara',text:"Je peux. Et je t\"aiderai... quand le moment viendra."},
        ],
      },
      { id:'ch3_q2', title:"L\"Épreuve du Feu", objective:'Remporte 10 combats', type:'win', target:10,
        reward:{crystals:35,creature:'ventis'}, xp:70,
        dialogue:[
          {char:'oryn',  text:"Impressionnant. Le premier Gardien a été libéré."},
          {char:'player',text:"Il y a encore 6 Gardiens à trouver."},
          {char:'oryn',  text:"Oui. Et Umbrax commence à s\"impatienter."},
          {char:'umbrax',text:"Profite de ta lumière pendant qu\"il en est encore temps..."},
          {char:'player',text:"Umbrax ! Montre-toi !"},
          {char:'umbrax',text:"Le moment viendra, Choisi. Le moment viendra."},
        ],
      },
      { id:'ch3_q3', title:'Collection de Lumière', objective:'Obtiens 12 créatures', type:'collect', target:12,
        reward:{crystals:40,creature:'spectrox'}, xp:80,
        dialogue:[
          {char:'oryn',    text:"Tu as rassemblé de nombreux alliés. Je suis fier de toi."},
          {char:'player',  text:"Chaque créature a une histoire. Je veux les toutes protéger."},
          {char:'oryn',    text:"C\"est exactement ce que fait un vrai Choisi."},
          {char:'crystara',text:"Les étoiles s\"alignent. Le chapitre final approche."},
          {char:'oryn',    text:"Repose-toi. La bataille la plus difficile t\"attend."},
        ],
      },
    ],
  },
  {
    id:4, title:'La Confrontation', subtitle:"Face à l\"obscurité",
    emoji:'🌑', color:'#bf5fff', bgGradient:['#0a0018','#150030'], unlocked:false,
    description:"Umbrax révèle sa véritable forme. La lumière et l\"ombre s\"affrontent.",
    quests:[
      { id:'ch4_q1', title:'Le Sanctuaire Obscur', objective:"Écoute la révélation d\"Umbrax", type:'dialogue',
        reward:{crystals:30,creature:null}, xp:70,
        dialogue:[
          {char:'umbrax', text:"Tu as osé venir jusqu\"ici. Bien. Je t\"attendais."},
          {char:'player', text:"Pourquoi fais-tu ça ? Pourquoi veux-tu détruire la lumière ?"},
          {char:'umbrax', text:"Détruire ? Non. Je veux... l\"équilibre. L\"ombre sans lumière n\"est rien."},
          {char:'umbrax', text:"Mais la lumière sans ombre est aveuglante. Les deux doivent coexister."},
          {char:'player', text:"Alors... tu n\"es pas le mal ?"},
          {char:'oryn',   text:"La vérité est plus complexe que je ne te l\"ai dit. Pardonne-moi."},
          {char:'umbrax', text:"Prouve que tu comprends les deux faces. Bats-moi."},
        ],
      },
      { id:'ch4_q2', title:"L\"Épreuve des Ombres", objective:'Remporte 20 combats', type:'win', target:20,
        reward:{crystals:50,creature:'umbrax'}, xp:100,
        dialogue:[
          {char:'umbrax', text:"Tu as prouvé ta force... et ta sagesse."},
          {char:'player', text:"Je comprends maintenant. La lumière a besoin de l\"ombre."},
          {char:'umbrax', text:"Et l\"ombre a besoin de la lumière. Nous sommes... complémentaires."},
          {char:'oryn',   text:"Je n\"aurais pas cru qu\"Umbrax accepterait de rejoindre un humain."},
          {char:'umbrax', text:"Celui-ci n\"est pas un humain ordinaire. Il est le pont entre nos deux mondes."},
        ],
      },
      { id:'ch4_q3', title:"L\"Alliance Ancestrale", objective:'Invoque 20 créatures au total', type:'summon', target:20,
        reward:{crystals:60,creature:'stormyx'}, xp:100,
        dialogue:[
          {char:'oryn',    text:"L\"alliance est scellée. Lumière et ombre, unis pour la première fois."},
          {char:'crystara',text:"Mais une dernière épreuve attend. La plus grande de toutes."},
          {char:'player',  text:"Laquelle ?"},
          {char:'crystara',text:"LUMINOS lui-même. L\"être primordial. Il veut te voir."},
          {char:'oryn',    text:"C\"est l\"honneur suprême. Et le danger ultime."},
          {char:'player',  text:"Je suis prêt."},
        ],
      },
    ],
  },
  {
    id:5, title:'LUMINOS', subtitle:'La lumière primordiale',
    emoji:'🌌', color:'#ffa500', bgGradient:['#0a0018','#15003a'], unlocked:false,
    description:"L\"être de lumière primordiale t\"attend. La destinée du monde est entre tes mains.",
    quests:[
      { id:'ch5_q1', title:'La Voix de LUMINOS', objective:'Médite avec LUMINOS', type:'dialogue',
        reward:{crystals:50,creature:null}, xp:120,
        dialogue:[
          {char:'lumikos', text:"...Tu as grandi, compagnon. Je suis fier de ce que tu es devenu."},
          {char:'player',  text:"Lumikos... tu peux me parler maintenant ?"},
          {char:'lumikos', text:"J\"ai toujours pu. Tu apprends à m\"écouter."},
          {char:'oryn',    text:"LUMINOS approche. Agenouille-toi, Choisi."},
          {char:'stranger',text:"...Je suis LUMINOS. Et toi... tu es celui que j\"attendais depuis l\"aube des temps."},
          {char:'player',  text:"Qu\"est-ce que tu attends de moi ?"},
          {char:'stranger',text:"Que tu deviennes le gardien de l\"équilibre. Lumière et ombre, réunies en toi."},
        ],
      },
      { id:'ch5_q2', title:"L\"Épreuve Finale", objective:'Remporte 30 combats', type:'win', target:30,
        reward:{crystals:100,creature:null}, xp:150,
        dialogue:[
          {char:'stranger',text:"Tu as la force. Mais as-tu la sagesse ?"},
          {char:'player',  text:"J\"ai appris de chaque créature. De chaque combat. De chaque erreur."},
          {char:'umbrax',  text:"Il a notre soutien. Les deux côtés."},
          {char:'crystara',text:"Les étoiles témoignent. Il est prêt."},
          {char:'stranger',text:"Alors... que commence ton règne, Gardien de l\"Équilibre."},
        ],
      },
      { id:'ch5_q3', title:"Le Gardien de l\"Équilibre", objective:'Obtiens 18 créatures différentes', type:'collect', target:18,
        reward:{crystals:150,creature:'luminos'}, xp:200,
        dialogue:[
          {char:'stranger',text:"Tu as rassemblé les créatures des deux mondes. L\"équilibre est restauré."},
          {char:'oryn',    text:"Je n\"ai jamais vu un tel compagnon en 200 ans de service."},
          {char:'lumikos', text:"✦ Notre voyage ne fait que commencer ✦"},
          {char:'umbrax',  text:"L\"ombre et la lumière, éternellement liées par toi."},
          {char:'crystara',text:"Et les étoiles chantent ton nom pour l\"éternité."},
          {char:'stranger',text:"Je suis LUMINOS. Et toi... tu es mon égal. Bienvenue, Gardien."},
          {char:'player',  text:"Ce n\"est pas une fin. C\"est un nouveau commencement."},
        ],
      },
    ],
  },
];

export default function StoryScreen() {
  const { collection, wins, summonCount, addCrystals, addToCollection } = useGameStore();
  const { showToast } = useToast();
  const authCtx = useAuth();
  const uid     = authCtx?.user?.uid || 'guest';

  const [progress, setProgress]         = useState({});
  const [claimedRewards, setClaimedRewards] = useState({});
  const [activeChapter, setActiveChapter]   = useState(null);
  const [activeQuest, setActiveQuest]       = useState(null);
  const [dialogueIndex, setDialogueIndex]   = useState(0);
  const [phase, setPhase]                   = useState('chapters');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const charAnim  = useRef(new Animated.Value(0)).current;
  const textAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim,{toValue:1.06,duration:1200,useNativeDriver:true}),
        Animated.timing(pulseAnim,{toValue:1,   duration:1200,useNativeDriver:true}),
      ])
    ).start();
  },[]);

  useEffect(() => {
    onValue(ref(db,`story/${uid}`), snap => {
      if (snap.exists()) {
        const d = snap.val();
        setProgress(d.progress||{});
        setClaimedRewards(d.claimed||{});
      }
    }, {onlyOnce:true});
  }, [uid]);

  async function saveProgress(newProg, newClaimed) {
    await set(ref(db,`story/${uid}`), {progress:newProg, claimed:newClaimed}).catch(()=>{});
  }

  function animateIn() {
    fadeAnim.setValue(0); slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue:1, duration:400, useNativeDriver:true}),
      Animated.timing(slideAnim, {toValue:0, duration:400, useNativeDriver:true}),
    ]).start();
  }

  function animateChar() {
    charAnim.setValue(0); textAnim.setValue(0);
    Animated.sequence([
      Animated.timing(charAnim, {toValue:1, duration:250, useNativeDriver:true}),
      Animated.timing(textAnim, {toValue:1, duration:300, useNativeDriver:true}),
    ]).start();
  }

  function isQuestComplete(quest) {
    if (progress[quest.id]==='done') return true;
    switch(quest.type) {
      case 'dialogue': return !!progress[quest.id];
      case 'win':      return wins>=(quest.target||1);
      case 'summon':   return summonCount>=(quest.target||1);
      case 'collect':  return [...new Set(collection.map(c=>c.id))].length>=(quest.target||1);
      default:         return false;
    }
  }

  function isChapterUnlocked(chapter) {
    if (chapter.id===1) return true;
    const prev = CHAPTERS.find(c=>c.id===chapter.id-1);
    return prev ? prev.quests.every(q=>isQuestComplete(q)) : false;
  }

  function getChapterProgress(chapter) {
    const done = chapter.quests.filter(q=>isQuestComplete(q)).length;
    return { done, total:chapter.quests.length };
  }

  function getProgressText(quest) {
    switch(quest.type) {
      case 'win':     return `${Math.min(wins,quest.target)}/${quest.target} victoires`;
      case 'summon':  return `${Math.min(summonCount,quest.target)}/${quest.target} invocations`;
      case 'collect': return `${Math.min([...new Set(collection.map(c=>c.id))].length,quest.target)}/${quest.target} créatures`;
      default:        return '';
    }
  }

  async function startQuest(quest) {
    setActiveQuest(quest); setDialogueIndex(0); setPhase('dialogue');
    animateIn(); setTimeout(animateChar, 200);
  }

  async function nextDialogue() {
    if (dialogueIndex < activeQuest.dialogue.length-1) {
      Animated.parallel([
        Animated.timing(charAnim, {toValue:0, duration:150, useNativeDriver:true}),
        Animated.timing(textAnim, {toValue:0, duration:150, useNativeDriver:true}),
      ]).start(()=>{
        setDialogueIndex(i=>i+1);
        animateChar();
      });
    } else {
      const newProg = {...progress, [activeQuest.id]:'done'};
      setProgress(newProg);
      await saveProgress(newProg, claimedRewards);
      setPhase('complete'); animateIn();
    }
  }

  async function claimReward() {
    if (claimedRewards[activeQuest.id]) return;
    const {crystals:cry, creature} = activeQuest.reward;
    if (cry) addCrystals(cry);
    if (creature && ALL_CREATURES[creature]) addToCollection({...ALL_CREATURES[creature]});
    // XP
    const uid2 = auth.currentUser?.uid;
    if (uid2) addXp(uid2, activeQuest.xp||XP_REWARDS.quest, null, null, null);
    const newClaimed = {...claimedRewards, [activeQuest.id]:true};
    setClaimedRewards(newClaimed);
    await saveProgress(progress, newClaimed);
    showToast({
      type:'reward', title:'Quête terminée !', message:activeQuest.title,
      crystals:cry||0, xp:activeQuest.xp||0, duration:4000,
    });
    setPhase('chapter'); animateIn();
  }

  const currentDialogue = activeQuest?.dialogue?.[dialogueIndex];
  const currentChar     = currentDialogue ? CHARACTERS[currentDialogue.char] : null;
  const isPlayer        = currentDialogue?.char === 'player';

  // ── DIALOGUE ──
  if (phase==='dialogue' && activeQuest) {
    const total = activeQuest.dialogue.length;
    const pct   = (dialogueIndex+1)/total;

    return (
      <LinearGradient colors={activeChapter?.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          {/* Header */}
          <View style={styles.dialogueHeader}>
            <TouchableOpacity onPress={()=>setPhase('chapter')} style={styles.skipBtn}>
              <Text style={styles.skipText}>✕ Passer</Text>
            </TouchableOpacity>
            <Text style={[styles.dialogueChapterName,{color:activeChapter?.color}]}>
              {activeChapter?.title}
            </Text>
            <Text style={styles.dialogueQuestCount}>{dialogueIndex+1}/{total}</Text>
          </View>

          {/* Barre progression */}
          <View style={styles.dialogueProgressBar}>
            <View style={[styles.dialogueProgressFill,{width:`${pct*100}%`,backgroundColor:activeChapter?.color}]}/>
          </View>

          {/* Zone dialogue */}
          <View style={styles.dialogueArea}>
            {/* Personnage */}
            <Animated.View style={[
              styles.charArea,
              isPlayer ? styles.charAreaRight : styles.charAreaLeft,
              {opacity:charAnim, transform:[{
                translateX:charAnim.interpolate({inputRange:[0,1],outputRange:[isPlayer?20:-20,0]})
              }]}
            ]}>
              <Animated.View style={[styles.charBubble,{
                backgroundColor:currentChar?.bg,borderColor:currentChar?.color+'55',
                transform:[{scale:pulseAnim}],
              }]}>
                <Text style={styles.charEmoji}>{currentChar?.emoji}</Text>
                <Text style={[styles.charName,{color:currentChar?.color}]}>{currentChar?.name}</Text>
              </Animated.View>
            </Animated.View>

            {/* Bulle de texte */}
            <Animated.View style={[
              styles.dialogueBubble,
              isPlayer ? styles.dialogueBubbleRight : styles.dialogueBubbleLeft,
              {
                opacity:textAnim,
                transform:[{translateY:textAnim.interpolate({inputRange:[0,1],outputRange:[10,0]})}],
                borderColor: currentChar?.color+'33',
                backgroundColor: currentChar?.bg,
              }
            ]}>
              <Text style={[styles.dialogueText,isPlayer&&{textAlign:'right'}]}>
                {currentDialogue?.text}
              </Text>
            </Animated.View>
          </View>

          {/* Bouton suivant */}
          <TouchableOpacity onPress={nextDialogue}
            style={[styles.nextBtn,{borderColor:activeChapter?.color+'66'}]}>
            <LinearGradient colors={[activeChapter?.color+'44',activeChapter?.color+'22']}
              start={{x:0,y:0}} end={{x:1,y:0}} style={styles.nextBtnGrad}>
              <Text style={[styles.nextBtnText,{color:activeChapter?.color}]}>
                {dialogueIndex<total-1?'Continuer →':'Terminer ✓'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Petits dots */}
          <View style={styles.dotsRow}>
            {activeQuest.dialogue.map((_,i)=>(
              <View key={i} style={[styles.dot,{
                backgroundColor:i<=dialogueIndex?activeChapter?.color:'#1e2d4a',
                width:i===dialogueIndex?16:6,
              }]}/>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── COMPLETE ──
  if (phase==='complete' && activeQuest) {
    const {crystals:cry, creature} = activeQuest.reward;
    const alreadyClaimed = claimedRewards[activeQuest.id];
    const CreatureSprite = creature ? (SPRITES[creature.replace('_shiny','')] || SPRITES.lumikos) : null;

    return (
      <LinearGradient colors={activeChapter?.bgGradient||['#07090f','#0d1220']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[styles.rewardArea,{opacity:fadeAnim,transform:[{translateY:slideAnim}]}]}>
            <Text style={styles.rewardBig}>🎉</Text>
            <Text style={styles.rewardTitle}>Quête terminée !</Text>
            <Text style={[styles.rewardQuestName,{color:activeChapter?.color}]}>{activeQuest.title}</Text>

            <LinearGradient colors={[activeChapter?.color+'12','#0d1220']} style={[styles.rewardBox,{borderColor:activeChapter?.color+'44'}]}>
              <Text style={styles.rewardLabel}>RÉCOMPENSES</Text>
              {cry>0&&(
                <View style={styles.rewardRow}>
                  <Text style={[styles.rewardCrystals,{color:activeChapter?.color}]}>+{cry} 💎</Text>
                  <Text style={styles.rewardXp}>+{activeQuest.xp||60} XP</Text>
                </View>
              )}
              {creature && ALL_CREATURES[creature] && CreatureSprite && (
                <View style={styles.rewardCreature}>
                  <CreatureSprite size={90}/>
                  <Text style={[styles.rewardCreatureName,{color:ALL_CREATURES[creature].rarityColor}]}>
                    {ALL_CREATURES[creature].name} obtenu !
                  </Text>
                  <Text style={styles.rewardCreatureRarity}>{ALL_CREATURES[creature].rarityLabel}</Text>
                </View>
              )}
            </LinearGradient>

            <TouchableOpacity onPress={claimReward} disabled={alreadyClaimed}
              style={[styles.claimBtn,{borderColor:activeChapter?.color+'66'},alreadyClaimed&&styles.disabled]}>
              <LinearGradient colors={[activeChapter?.color+'55',activeChapter?.color+'22']}
                start={{x:0,y:0}} end={{x:1,y:0}} style={styles.claimBtnGrad}>
                <Text style={[styles.claimBtnText,{color:activeChapter?.color}]}>
                  {alreadyClaimed?'✓ Déjà récupéré':'✦ Récupérer les récompenses'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── CHAPITRE ──
  if (phase==='chapter' && activeChapter) {
    const unlocked = isChapterUnlocked(activeChapter);
    return (
      <LinearGradient colors={activeChapter.bgGradient} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={()=>{setPhase('chapters');setActiveChapter(null);}} style={styles.backBtn}>
            <Text style={[styles.backBtnText,{color:activeChapter.color}]}>← Retour</Text>
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chapterScroll}>
            <Text style={styles.chapterEmoji}>{activeChapter.emoji}</Text>
            <Text style={[styles.chapterTitleBig,{color:activeChapter.color}]}>
              Chapitre {activeChapter.id} — {activeChapter.title}
            </Text>
            <Text style={styles.chapterSubBig}>{activeChapter.subtitle}</Text>
            <Text style={styles.chapterDescBig}>{activeChapter.description}</Text>

            <View style={styles.questsList}>
              {activeChapter.quests.map((quest,i)=>{
                const done      = isQuestComplete(quest);
                const claimed   = claimedRewards[quest.id];
                const prevDone  = i===0 || isQuestComplete(activeChapter.quests[i-1]);
                const available = unlocked && prevDone;
                const pct       = done ? 1 : quest.target ? Math.min(1, (() => {
                  switch(quest.type) {
                    case 'win':     return wins/quest.target;
                    case 'summon':  return summonCount/quest.target;
                    case 'collect': return [...new Set(collection.map(c=>c.id))].length/quest.target;
                    default:        return 0;
                  }
                })()) : 0;

                return (
                  <View key={quest.id} style={[styles.questCard,{
                    borderColor:done?activeChapter.color+'66':available?'#1e2d4a':'#0a0a14',
                    backgroundColor:done?activeChapter.color+'10':'#0d1220',
                    opacity:available?1:0.4,
                  }]}>
                    <View style={styles.questCardHeader}>
                      <View style={[styles.questNumBox,{backgroundColor:done?activeChapter.color+'22':'#1e2d4a22',borderColor:done?activeChapter.color+'44':'#1e2d4a'}]}>
                        <Text style={[styles.questNum,{color:done?activeChapter.color:'#4a6080'}]}>{i+1}</Text>
                      </View>
                      <View style={styles.questCardInfo}>
                        <Text style={[styles.questCardTitle,{color:done?activeChapter.color:'#c8daf0'}]}>{quest.title}</Text>
                        <Text style={styles.questCardObj}>{quest.objective}</Text>
                        {available&&!done&&quest.target&&(
                          <Text style={[styles.questCardProg,{color:activeChapter.color}]}>{getProgressText(quest)}</Text>
                        )}
                      </View>
                      <View style={[styles.questStatus,{
                        backgroundColor:done?activeChapter.color+'22':'#1e2d4a22',
                        borderColor:done?activeChapter.color+'44':'#1e2d4a',
                      }]}>
                        <Text style={[styles.questStatusText,{color:done?activeChapter.color:'#4a6080'}]}>
                          {done?'✓':available?'→':'🔒'}
                        </Text>
                      </View>
                    </View>

                    {/* Barre de progression */}
                    {available && quest.target && !done && (
                      <View style={styles.questBarBg}>
                        <View style={[styles.questBarFill,{width:`${pct*100}%`,backgroundColor:activeChapter.color}]}/>
                      </View>
                    )}

                    {/* Récompenses */}
                    <View style={styles.questRewards}>
                      {quest.reward.crystals>0&&(
                        <View style={styles.rewardTag}>
                          <Text style={styles.rewardTagText}>💎 +{quest.reward.crystals}</Text>
                        </View>
                      )}
                      {quest.xp&&(
                        <View style={[styles.rewardTag,{backgroundColor:'#00e5ff15',borderColor:'#00e5ff33'}]}>
                          <Text style={[styles.rewardTagText,{color:'#00e5ff'}]}>⭐ +{quest.xp} XP</Text>
                        </View>
                      )}
                      {quest.reward.creature&&(
                        <View style={[styles.rewardTag,{backgroundColor:ALL_CREATURES[quest.reward.creature]?.rarityColor+'15',borderColor:ALL_CREATURES[quest.reward.creature]?.rarityColor+'33'}]}>
                          <Text style={[styles.rewardTagText,{color:ALL_CREATURES[quest.reward.creature]?.rarityColor}]}>
                            ✦ {ALL_CREATURES[quest.reward.creature]?.name}
                          </Text>
                        </View>
                      )}
                    </View>

                    {available&&(
                      <TouchableOpacity onPress={()=>startQuest(quest)}
                        style={[styles.questActionBtn,{borderColor:activeChapter.color+'44'}]}>
                        <LinearGradient colors={[activeChapter.color+'33',activeChapter.color+'11']}
                          start={{x:0,y:0}} end={{x:1,y:0}} style={styles.questActionBtnGrad}>
                          <Text style={[styles.questActionText,{color:activeChapter.color}]}>
                            {done?(claimed?'✓ Récupéré':'→ Récupérer'):quest.type==='dialogue'?'💬 Dialogue':'→ Voir la quête'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── LISTE CHAPITRES ──
  const totalDone   = CHAPTERS.reduce((a,ch)=>a+ch.quests.filter(q=>isQuestComplete(q)).length,0);
  const totalQuests = CHAPTERS.reduce((a,ch)=>a+ch.quests.length,0);

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Animated.Text style={[styles.title,{
          opacity:fadeAnim,
          transform:[{translateY:fadeAnim.interpolate({inputRange:[0,1],outputRange:[-16,0]})}],
        }]}>📖 MODE HISTOIRE</Animated.Text>

        {/* Progression globale */}
        <LinearGradient colors={['#1a0a00','#07090f']} style={styles.globalProgress}>
          <View style={styles.globalProgressHeader}>
            <Text style={styles.globalProgressLabel}>PROGRESSION</Text>
            <Text style={styles.globalProgressCount}>{totalDone}/{totalQuests}</Text>
          </View>
          <View style={styles.globalBarBg}>
            <View style={[styles.globalBarFill,{width:`${(totalDone/totalQuests)*100}%`}]}/>
          </View>
          <Text style={styles.globalProgressSub}>
            {totalDone===totalQuests?'🎉 Histoire complète !':'Continue ton aventure...'}
          </Text>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chaptersScroll}>
          {CHAPTERS.map(chapter=>{
            const unlocked = isChapterUnlocked(chapter);
            const {done,total} = getChapterProgress(chapter);
            const pct = total>0?done/total:0;
            const allDone = done===total;

            return (
              <TouchableOpacity key={chapter.id}
                onPress={()=>{if(unlocked){setActiveChapter(chapter);setPhase('chapter');animateIn();}}}
                disabled={!unlocked}
                style={[styles.chapterCard,{borderColor:unlocked?chapter.color+'44':'#1e2d4a',opacity:unlocked?1:0.5}]}
              >
                <LinearGradient colors={unlocked?chapter.bgGradient:['#0d1220','#07090f']} style={styles.chapterCardGrad}>
                  {/* Numéro */}
                  <View style={[styles.chapterNumBox,{backgroundColor:unlocked?chapter.color+'22':'#1e2d4a22',borderColor:unlocked?chapter.color+'44':'#1e2d4a'}]}>
                    <Text style={styles.chapterCardEmoji}>{chapter.emoji}</Text>
                    <Text style={[styles.chapterCardNum,{color:unlocked?chapter.color:'#4a6080'}]}>CH.{chapter.id}</Text>
                  </View>

                  {/* Infos */}
                  <View style={styles.chapterCardCenter}>
                    <Text style={[styles.chapterCardTitle,{color:unlocked?chapter.color:'#4a6080'}]}>{chapter.title}</Text>
                    <Text style={styles.chapterCardSub}>{chapter.subtitle}</Text>
                    <View style={styles.chapterBarBg}>
                      <View style={[styles.chapterBarFill,{width:`${pct*100}%`,backgroundColor:chapter.color}]}/>
                    </View>
                    <Text style={[styles.chapterCardProg,{color:unlocked?chapter.color+'88':'#4a6080'}]}>
                      {done}/{total} quêtes
                    </Text>
                  </View>

                  {/* Statut */}
                  <View style={styles.chapterCardRight}>
                    {!unlocked ? <Text style={styles.lockIcon}>🔒</Text>
                      : allDone ? <View style={[styles.doneBadge,{backgroundColor:chapter.color+'22',borderColor:chapter.color+'44'}]}><Text style={[styles.doneIcon,{color:chapter.color}]}>✓</Text></View>
                      : done>0 ? <View style={[styles.inProgressBadge,{backgroundColor:chapter.color+'22',borderColor:chapter.color+'44'}]}><Text style={[styles.inProgressText,{color:chapter.color}]}>▶</Text></View>
                      : <Text style={[styles.arrowIcon,{color:chapter.color}]}>›</Text>
                    }
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  title:{fontSize:22,fontWeight:'900',color:'#fff',letterSpacing:5,textAlign:'center',paddingTop:16,marginBottom:10,textShadowColor:'#ffa50066',textShadowRadius:10},
  // Global progress
  globalProgress:{borderWidth:1,borderColor:'#ffa50033',borderRadius:16,padding:14,marginBottom:14,gap:8},
  globalProgressHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  globalProgressLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,textTransform:'uppercase',fontWeight:'700'},
  globalProgressCount:{fontSize:16,fontWeight:'900',color:'#ffa500'},
  globalBarBg:{height:6,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  globalBarFill:{height:'100%',borderRadius:4,backgroundColor:'#ffa500'},
  globalProgressSub:{fontSize:11,color:'#4a6080'},
  // Chapters
  chaptersScroll:{gap:12,paddingBottom:24},
  chapterCard:{borderWidth:1,borderRadius:20,overflow:'hidden'},
  chapterCardGrad:{flexDirection:'row',alignItems:'center',padding:16,gap:12},
  chapterNumBox:{width:56,height:56,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center',gap:2},
  chapterCardEmoji:{fontSize:24},
  chapterCardNum:{fontSize:8,fontWeight:'900',letterSpacing:2},
  chapterCardCenter:{flex:1,gap:4},
  chapterCardTitle:{fontSize:15,fontWeight:'900',letterSpacing:0.5},
  chapterCardSub:{fontSize:11,color:'#4a6080'},
  chapterBarBg:{height:4,backgroundColor:'#1e2d4a22',borderRadius:4,overflow:'hidden',marginTop:4},
  chapterBarFill:{height:'100%',borderRadius:4},
  chapterCardProg:{fontSize:10,fontWeight:'700',marginTop:2},
  chapterCardRight:{width:30,alignItems:'center'},
  lockIcon:{fontSize:20,opacity:0.6},
  doneIcon:{fontSize:16,fontWeight:'900'},
  doneBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:5,alignItems:'center'},
  inProgressBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:5,alignItems:'center'},
  inProgressText:{fontSize:14,fontWeight:'900'},
  arrowIcon:{fontSize:28,fontWeight:'900'},
  // Chapter detail
  backBtn:{paddingTop:16,paddingBottom:8},
  backBtnText:{fontSize:14,fontWeight:'700'},
  chapterScroll:{gap:16,paddingBottom:32},
  chapterEmoji:{fontSize:60,textAlign:'center',marginTop:8},
  chapterTitleBig:{fontSize:22,fontWeight:'900',letterSpacing:2,textAlign:'center'},
  chapterSubBig:{fontSize:13,color:'#4a6080',textAlign:'center',letterSpacing:1},
  chapterDescBig:{color:'#6a84a0',fontSize:14,textAlign:'center',fontStyle:'italic',lineHeight:22},
  questsList:{gap:12},
  questCard:{borderWidth:1,borderRadius:18,padding:14,gap:10},
  questCardHeader:{flexDirection:'row',alignItems:'center',gap:10},
  questNumBox:{width:36,height:36,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},
  questNum:{fontSize:14,fontWeight:'900'},
  questCardInfo:{flex:1,gap:2},
  questCardTitle:{fontSize:15,fontWeight:'800',letterSpacing:1},
  questCardObj:{fontSize:11,color:'#6a84a0'},
  questCardProg:{fontSize:11,fontWeight:'700',marginTop:2},
  questStatus:{width:36,height:36,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},
  questStatusText:{fontSize:16,fontWeight:'900'},
  questBarBg:{height:5,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden'},
  questBarFill:{height:'100%',borderRadius:4},
  questRewards:{flexDirection:'row',gap:6,flexWrap:'wrap'},
  rewardTag:{backgroundColor:'#ffd70015',borderWidth:1,borderColor:'#ffd70033',borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  rewardTagText:{fontSize:10,color:'#ffd700',fontWeight:'700'},
  questActionBtn:{borderWidth:1,borderRadius:12,overflow:'hidden',marginTop:4},
  questActionBtnGrad:{alignItems:'center',paddingVertical:11},
  questActionText:{fontSize:13,fontWeight:'800',letterSpacing:1},
  // Dialogue
  dialogueHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:16,paddingBottom:8},
  dialogueChapterName:{fontSize:12,fontWeight:'800',letterSpacing:2},
  skipBtn:{padding:4},
  skipText:{color:'#4a6080',fontSize:11},
  dialogueQuestCount:{color:'#4a6080',fontSize:11},
  dialogueProgressBar:{height:3,backgroundColor:'#1e2d4a',borderRadius:4,overflow:'hidden',marginBottom:16},
  dialogueProgressFill:{height:'100%',borderRadius:4},
  dialogueArea:{flex:1,justifyContent:'center',gap:16,paddingVertical:20},
  charArea:{},
  charAreaLeft:{alignSelf:'flex-start'},
  charAreaRight:{alignSelf:'flex-end'},
  charBubble:{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1.5,borderRadius:14,paddingHorizontal:12,paddingVertical:8,shadowRadius:6,shadowOpacity:0.4},
  charEmoji:{fontSize:20},
  charName:{fontSize:12,fontWeight:'900',letterSpacing:1.5,textTransform:'uppercase'},
  dialogueBubble:{borderWidth:1.5,borderRadius:18,padding:18,maxWidth:'85%',shadowRadius:8,shadowOpacity:0.3},
  dialogueBubbleLeft:{alignSelf:'flex-start',borderTopLeftRadius:4},
  dialogueBubbleRight:{alignSelf:'flex-end',borderTopRightRadius:4},
  dialogueText:{color:'#e8f0ff',fontSize:16,lineHeight:28,fontStyle:'italic',letterSpacing:0.3},
  nextBtn:{borderWidth:1,borderRadius:16,overflow:'hidden'},
  nextBtnGrad:{alignItems:'center',paddingVertical:16},
  nextBtnText:{fontSize:15,fontWeight:'800',letterSpacing:2},
  dotsRow:{flexDirection:'row',gap:4,justifyContent:'center',alignItems:'center',paddingVertical:8},
  dot:{height:6,borderRadius:3,transition:'width 0.3s'},
  // Reward
  rewardArea:{flex:1,alignItems:'center',justifyContent:'center',gap:16,padding:24},
  rewardBig:{fontSize:64},
  rewardTitle:{color:'#fff',fontSize:24,fontWeight:'900',letterSpacing:3},
  rewardQuestName:{fontSize:14,letterSpacing:1},
  rewardBox:{width:'100%',borderWidth:1,borderRadius:20,padding:20,alignItems:'center',gap:12,backgroundColor:'#0d1220'},
  rewardLabel:{fontSize:9,color:'#4a6080',letterSpacing:4,textTransform:'uppercase',fontWeight:'700'},
  rewardRow:{flexDirection:'row',alignItems:'center',gap:16},
  rewardCrystals:{fontSize:28,fontWeight:'900',letterSpacing:2},
  rewardXp:{fontSize:18,color:'#00e5ff',fontWeight:'700'},
  rewardCreature:{alignItems:'center',gap:6},
  rewardCreatureName:{fontSize:16,fontWeight:'900',letterSpacing:2},
  rewardCreatureRarity:{fontSize:10,color:'#4a6080',letterSpacing:2},
  claimBtn:{width:'100%',borderWidth:1,borderRadius:16,overflow:'hidden'},
  claimBtnGrad:{alignItems:'center',paddingVertical:16},
  claimBtnText:{fontSize:15,fontWeight:'800',letterSpacing:2},
  disabled:{opacity:0.5},
});
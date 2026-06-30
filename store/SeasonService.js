// store/seasonService.js — Système de saisons mensuelles
import { db } from '../config/firebase';
import { ref, get, set, onValue } from 'firebase/database';

// ─── Helpers saison ───────────────────────────────────────────────
export function getCurrentSeasonId() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; // ex: "2026-06"
}

export function getSeasonLabel(seasonId) {
  const [year, month] = seasonId.split('-');
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${months[parseInt(month)-1]} ${year}`;
}

export function getTimeUntilSeasonEnd() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth()+1, 1);
  const diff = nextMonth - now;
  const days = Math.floor(diff/86400000);
  const hours = Math.floor((diff%86400000)/3600000);
  return { days, hours, totalMs: diff };
}

// ─── Titres de saison selon le rang ───────────────────────────────
export function getSeasonTitle(rank) {
  if (rank===1)  return { title:'👑 Champion de Saison', color:'#ffd700' };
  if (rank<=3)   return { title:'🏆 Légende de Saison',  color:'#c0c0c0' };
  if (rank<=10)  return { title:'⭐ Élite de Saison',     color:'#00e5ff' };
  if (rank<=50)  return { title:'◆ Vétéran de Saison',   color:'#bf5fff' };
  if (rank<=100) return { title:'● Compétiteur',         color:'#39ff8f' };
  return null;
}

export function getSeasonRewards(rank) {
  if (rank===1)  return { crystals:500, title:'👑 Champion de Saison' };
  if (rank===2)  return { crystals:350, title:'🥈 Vice-Champion' };
  if (rank===3)  return { crystals:250, title:'🥉 3e place' };
  if (rank<=10)  return { crystals:150, title:'⭐ Top 10' };
  if (rank<=50)  return { crystals:75,  title:'◆ Top 50' };
  if (rank<=100) return { crystals:30,  title:'● Top 100' };
  return { crystals:10, title:null };
}

// ─── Archive de fin de saison (appelé par l'admin ou un cron) ────
export async function archiveSeasonAndReset(currentLeaderboard) {
  const seasonId = getCurrentSeasonId();
  const sorted = Object.entries(currentLeaderboard||{})
    .map(([id,v])=>({id,...v}))
    .sort((a,b)=>(b.score||0)-(a.score||0));

  // Sauvegarder l'archive
  const archive = {};
  sorted.forEach((p,i)=>{
    archive[p.id] = { name:p.name, score:p.score, rank:i+1, wins:p.wins||0 };
  });
  await set(ref(db,`seasons/${seasonId}/finalLeaderboard`), archive).catch(()=>{});
  await set(ref(db,`seasons/${seasonId}/endedAt`), Date.now()).catch(()=>{});

  // Donner les récompenses à chaque joueur (dans leur inbox)
  for (let i=0;i<sorted.length;i++) {
    const rank = i+1;
    const reward = getSeasonRewards(rank);
    if (reward.crystals>0) {
      const msgRef = ref(db,`inbox/${sorted[i].id}/season_${seasonId}`);
      await set(msgRef, {
        type:'system',
        title:`🏆 Récompenses de saison — ${getSeasonLabel(seasonId)}`,
        description:`Tu as terminé #${rank} avec ${sorted[i].score} points !${reward.title?` Titre débloqué : ${reward.title}`:''}`,
        crystals: reward.crystals,
        xp: 0,
        claimed:false,
        createdAt: Date.now(),
        expiresAt: Date.now()+30*86400000,
      }).catch(()=>{});
    }
    if (reward.title) {
      await set(ref(db,`players/${sorted[i].id}/seasonTitles/${seasonId}`), reward.title).catch(()=>{});
    }
  }

  // Reset le leaderboard actuel (scores remis à 0, mais garde les decks/collections)
  // On ne supprime PAS le leaderboard, on le déplace juste — un nouveau se reconstruit au fil du jeu
  return { seasonId, totalPlayers: sorted.length };
}

// ─── Charger l'historique des saisons passées ─────────────────────
export function listenPastSeasons(callback) {
  return onValue(ref(db,'seasons'), snap=>{
    if (!snap.exists()) { callback([]); return; }
    const seasons = Object.entries(snap.val())
      .map(([id,v])=>({id,...v}))
      .filter(s=>s.endedAt)
      .sort((a,b)=>b.id.localeCompare(a.id));
    callback(seasons);
  });
}

export function listenMySeasonTitles(uid, callback) {
  return onValue(ref(db,`players/${uid}/seasonTitles`), snap=>{
    callback(snap.exists() ? snap.val() : {});
  });
}
// screens/WorldScreen.js — Open World 3D amélioré
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/useGameStore';
import { ALL_CREATURES, CREATURE_LIST } from '../data/creatures';
import { SPRITES } from '../components/CreatureCard';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Spawns ──────────────────────────────────────────────────────
const WORLD_SPAWNS = [
  // Zone Forêt
  { id: 'florix',    x: -8,  z: -6  }, { id: 'thornix',   x: -12, z: -3  },
  { id: 'lumikos',   x: -6,  z: -10 }, { id: 'lumivex',   x: -14, z: -8  },
  { id: 'lumirex',   x: -10, z: -12 },
  // Zone Lac
  { id: 'aquila',    x: 8,   z: -12 }, { id: 'aquafrost', x: 12,  z: -8  },
  { id: 'glacix',    x: 6,   z: -15 },
  // Zone Plaines
  { id: 'voltrax',   x: 3,   z: 8   }, { id: 'pyrox',     x: -2,  z: 12  },
  { id: 'luminos',   x: 0,   z: -2  },
  // Zone Cratère
  { id: 'pyraflor',  x: 18,  z: -2  }, { id: 'stormyx',   x: 20,  z: -6  },
  // Zone Cristal
  { id: 'crystara',  x: -14, z: 22  }, { id: 'glacix',    x: -10, z: 18  },
  // Zone Ombre
  { id: 'umbrax',    x: 14,  z: 20  }, { id: 'spectrox',  x: 18,  z: 16  },
  // Zones éloignées
  { id: 'bouldrak',  x: -8,  z: 18  }, { id: 'terrak',    x: -18, z: 8   },
  { id: 'ventis',    x: 22,  z: -10 }, { id: 'lumivex',   x: -20, z: -14 },
  { id: 'aquila',    x: 24,  z: 4   }, { id: 'florix',    x: -22, z: 14  },
  { id: 'voltrax',   x: 10,  z: 26  }, { id: 'thornix',   x: -4,  z: 28  },
];

// ─── Zones ───────────────────────────────────────────────────────
const ZONES = [
  { name:'🌲 Forêt de Lumière',    color:'#1a4a10', border:'#2a6a20', x:-10, z:-7,  w:16, h:14 },
  { name:'💧 Lac des Reflets',     color:'#0a2040', border:'#104060', x:6,   z:-14, w:14, h:12 },
  { name:'🌾 Plaines Dorées',      color:'#2a2a10', border:'#404020', x:-2,  z:6,   w:16, h:14 },
  { name:'🌋 Cratère Solaire',     color:'#3a1000', border:'#5a2000', x:16,  z:-5,  w:14, h:12 },
  { name:'💎 Monts de Cristal',    color:'#0a1828', border:'#103048', x:-13, z:15,  w:14, h:14 },
  { name:'🌑 Vallée d\'Ombre',     color:'#120018', border:'#200028', x:12,  z:13,  w:14, h:12 },
  { name:'🏜️ Désert de Cendre',    color:'#2a1a08', border:'#402808', x:22,  z:8,   w:12, h:12 },
  { name:'❄️ Toundra Glaciale',    color:'#0a1420', border:'#142030', x:-24, z:-6,  w:12, h:12 },
  { name:'🌿 Marécage Mystique',   color:'#0a180a', border:'#142414', x:-6,  z:22,  w:12, h:10 },
  { name:'⚡ Plaines Électriques', color:'#181808', border:'#282818', x:8,   z:22,  w:12, h:10 },
];

// ─── Décorations ─────────────────────────────────────────────────
const TREES = [
  {x:-14,z:-8,s:1.2},{x:-8,z:-12,s:1},{x:-16,z:-4,s:1.4},{x:-10,z:-14,s:1},
  {x:-4,z:-8,s:0.8},{x:-18,z:-10,s:1.3},{x:-12,z:-6,s:1},{x:-6,z:-14,s:1.1},
  {x:-14,z:-2,s:0.9},{x:-8,z:-16,s:1.2},{x:-20,z:-8,s:1},{x:-16,z:-14,s:0.8},
  {x:-22,z:-4,s:1.3},{x:-18,z:-18,s:1},{x:-10,z:-18,s:1.1},
];
const PINE_TREES = [
  {x:-25,z:-4,s:1},{x:-26,z:-8,s:1.2},{x:-24,z:-12,s:0.9},{x:-22,z:-2,s:1.1},
];
const ROCKS = [
  {x:-8,z:18,s:1},{x:-10,z:20,s:0.8},{x:-6,z:22,s:1.2},{x:-12,z:16,s:0.9},
  {x:20,z:10,s:1.3},{x:22,z:14,s:0.8},{x:24,z:8,s:1},
];
const CRYSTALS = [
  {x:-14,z:17,h:1.2},{x:-12,z:19,h:1.5},{x:-10,z:21,h:1},{x:-8,z:23,h:1.8},
  {x:-16,z:15,h:1.3},{x:-18,z:19,h:1},{x:-12,z:23,h:1.4},
];
const VOLCANOES = [
  {x:17,z:-4,s:1.2},{x:20,z:-2,s:0.9},{x:18,z:-8,s:1},
];
const WATER_TILES = [
  {x:7,z:-13,r:2.5},{x:10,z:-11,r:2},{x:8,z:-16,r:1.8},{x:12,z:-14,r:2.2},
  {x:6,z:-10,r:1.5},{x:14,z:-12,r:1.8},
];
const MUSHROOMS = [
  {x:-5,z:22,s:1},{x:-7,z:24,s:0.8},{x:-3,z:26,s:1.2},
  {x:10,z:23,s:0.9},{x:12,z:25,s:1.1},
];
const LIGHTNING_RODS = [
  {x:9,z:23},{x:12,z:24},{x:11,z:22},
];

// ─── Projection 3D → 2D ──────────────────────────────────────────
function project(x, y, z, camX, camY, camZ, rotY, W, H) {
  const dx = x-camX, dy = y-camY, dz = z-camZ;
  const cos = Math.cos(rotY), sin = Math.sin(rotY);
  const rx = dx*cos + dz*sin;
  const ry = dy;
  const rz = -dx*sin + dz*cos;
  if (rz <= 0.1) return null;
  const fov = 420;
  return { x: W/2+(rx/rz)*fov, y: H/2-(ry/rz)*fov, size: fov/rz, depth: rz };
}

// ─── Sprite dessinateur ──────────────────────────────────────────
function drawCreatureSprite(ctx, id, px, py, size) {
  const sc = Math.min(size * 0.055, 3.5);
  if (sc < 0.3) return;

  const c = ALL_CREATURES[id];
  const color = c?.rarityColor || '#00e5ff';
  const col = parseInt(color.replace('#',''), 16);
  const r = (col >> 16) & 255, g = (col >> 8) & 255, b = col & 255;
  const rgba = (a) => `rgba(${r},${g},${b},${a})`;

  // Ombre au sol
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(px, py+sc*10, sc*10, sc*4, 0, 0, Math.PI*2);
  ctx.fill();

  // Halo lumineux
  const grd = ctx.createRadialGradient(px,py,0, px,py,sc*22);
  grd.addColorStop(0, rgba(0.4));
  grd.addColorStop(1, rgba(0));
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(px,py,sc*22,0,Math.PI*2); ctx.fill();

  // Corps principal (arrondi)
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(px,py,sc*9,0,Math.PI*2); ctx.fill();

  // Ventre
  ctx.fillStyle = `rgba(255,255,255,0.25)`;
  ctx.beginPath(); ctx.ellipse(px,py+sc*2,sc*5,sc*6,0,0,Math.PI*2); ctx.fill();

  // Oreilles selon le type
  const type = c?.type || '';
  if (type.includes('Feu') || type.includes('Ombre')) {
    // Oreilles pointues
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(px-sc*8,py-sc*8); ctx.lineTo(px-sc*4,py-sc*16); ctx.lineTo(px-sc*1,py-sc*9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px+sc*8,py-sc*8); ctx.lineTo(px+sc*4,py-sc*16); ctx.lineTo(px+sc*1,py-sc*9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(0.5);
    ctx.beginPath(); ctx.moveTo(px-sc*7,py-sc*9); ctx.lineTo(px-sc*4,py-sc*14); ctx.lineTo(px-sc*2,py-sc*10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px+sc*7,py-sc*9); ctx.lineTo(px+sc*4,py-sc*14); ctx.lineTo(px+sc*2,py-sc*10); ctx.closePath(); ctx.fill();
  } else if (type.includes('Glace') || type.includes('Eau') || type.includes('Cristal')) {
    // Oreilles arrondies
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(px-sc*8,py-sc*10,sc*4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+sc*8,py-sc*10,sc*4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = rgba(0.4);
    ctx.beginPath(); ctx.arc(px-sc*8,py-sc*10,sc*2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+sc*8,py-sc*10,sc*2.5,0,Math.PI*2); ctx.fill();
  } else {
    // Oreilles standard
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(px-sc*8,py-sc*11,sc*3.5,sc*6,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px+sc*8,py-sc*11,sc*3.5,sc*6,0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = rgba(0.5);
    ctx.beginPath(); ctx.ellipse(px-sc*8,py-sc*11,sc*2,sc*4,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px+sc*8,py-sc*11,sc*2,sc*4,0.3,0,Math.PI*2); ctx.fill();
  }

  // Tête
  ctx.fillStyle = `rgba(255,255,255,0.15)`;
  ctx.beginPath(); ctx.arc(px,py-sc*4,sc*7,0,Math.PI*2); ctx.fill();

  // Yeux
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath(); ctx.arc(px-sc*3,py-sc*5,sc*2.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(px+sc*3,py-sc*5,sc*2.5,0,Math.PI*2); ctx.fill();

  // Iris colorés
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(px-sc*3,py-sc*5,sc*1.8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(px+sc*3,py-sc*5,sc*1.8,0,Math.PI*2); ctx.fill();

  // Pupilles
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(px-sc*3,py-sc*5,sc*1,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(px+sc*3,py-sc*5,sc*1,0,Math.PI*2); ctx.fill();

  // Reflets yeux
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(px-sc*3.5,py-sc*5.5,sc*0.7,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(px+sc*2.5,py-sc*5.5,sc*0.7,0,Math.PI*2); ctx.fill();

  // Bouche
  ctx.strokeStyle = rgba(0.7); ctx.lineWidth = sc*0.8;
  ctx.beginPath(); ctx.arc(px,py-sc*2,sc*2,0.2,Math.PI-0.2); ctx.stroke();

  // Joues
  ctx.fillStyle = 'rgba(255,180,180,0.35)';
  ctx.beginPath(); ctx.ellipse(px-sc*6,py-sc*3,sc*3,sc*2,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(px+sc*6,py-sc*3,sc*3,sc*2,0,0,Math.PI*2); ctx.fill();

  // Gemme / marque selon rareté
  if (c?.rarity === 'legendary') {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(px,py-sc*16); ctx.lineTo(px+sc*3,py-sc*12);
    ctx.lineTo(px,py-sc*11); ctx.lineTo(px-sc*3,py-sc*12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(px,py-sc*16); ctx.lineTo(px+sc*3,py-sc*12); ctx.lineTo(px,py-sc*13); ctx.closePath(); ctx.fill();
  } else if (c?.rarity === 'rare' || c?.rarity === 'shiny') {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(px,py-sc*14,sc*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(px-sc*0.8,py-sc*14.8,sc*1,0,Math.PI*2); ctx.fill();
  }

  // Anneau animé pour les créatures rares/légendaires
  if (c?.rarity === 'legendary' || c?.rarity === 'shiny') {
    ctx.strokeStyle = color; ctx.lineWidth = sc*1.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(px,py,sc*14,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ─── Canvas 3D ────────────────────────────────────────────────────
const World3DCanvas = React.forwardRef(({ onEncounter }, ref) => {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    player: { x: 0, y: 0, z: 5 },
    camAngle: 0,
    keys: {},
    spawns: WORLD_SPAWNS.map((s,i) => ({
      ...s, uid:`s${i}`, captured:false,
      color:  ALL_CREATURES[s.id]?.rarityColor || '#00e5ff',
      name:   ALL_CREATURES[s.id]?.name || s.id,
      rarity: ALL_CREATURES[s.id]?.rarity || 'common',
      bobOff: Math.random()*Math.PI*2,
    })),
    tick: 0,
    encounter:     null,
    encounterShown:false,
    fleeTimeout:   false,
    zone:          null,
    particles:     [],
  });

  React.useImperativeHandle(ref, () => stateRef.current);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const s = stateRef.current;

    const onDown = e => { s.keys[e.key]=true; e.preventDefault(); };
    const onUp   = e => { s.keys[e.key]=false; };
    if (Platform.OS==='web') {
      window.addEventListener('keydown', onDown);
      window.addEventListener('keyup',   onUp);
    }

    let animId;

    function spawnParticle(x, y, color) {
      s.particles.push({ x, y, color, life: 1, vx:(Math.random()-0.5)*2, vy:-Math.random()*2 });
    }

    function drawScene() {
      s.tick++;
      const k=s.keys, SPEED=0.12, TURN=0.04;

      if (k['ArrowLeft'] ||k['a']||k['A']) s.camAngle+=TURN;
      if (k['ArrowRight']||k['d']||k['D']) s.camAngle-=TURN;
      if (k['ArrowUp']   ||k['w']||k['W']) {
        s.player.x -= Math.sin(s.camAngle)*SPEED;
        s.player.z += Math.cos(s.camAngle)*SPEED;
      }
      if (k['ArrowDown'] ||k['s']||k['S']) {
        s.player.x += Math.sin(s.camAngle)*SPEED;
        s.player.z -= Math.cos(s.camAngle)*SPEED;
      }
      s.player.x = Math.max(-38,Math.min(38,s.player.x));
      s.player.z = Math.max(-38,Math.min(38,s.player.z));

      const camDist=9, camHeight=5.5;
      const camX = s.player.x + Math.sin(s.camAngle)*camDist;
      const camY = s.player.y + camHeight;
      const camZ = s.player.z - Math.cos(s.camAngle)*camDist;

      const zone = ZONES.find(z =>
        s.player.x>=z.x-z.w/2&&s.player.x<=z.x+z.w/2&&
        s.player.z>=z.z-z.h/2&&s.player.z<=z.z+z.h/2
      );
      s.zone = zone;

      // ── CIEL DYNAMIQUE ──
      const skyTop = `hsl(${220+Math.sin(s.tick*0.002)*20},60%,${4+Math.sin(s.tick*0.001)*2}%)`;
      const skyBot = `hsl(${210+Math.sin(s.tick*0.002)*15},50%,${8+Math.sin(s.tick*0.001)*3}%)`;
      const sky = ctx.createLinearGradient(0,0,0,H*0.52);
      sky.addColorStop(0,skyTop); sky.addColorStop(1,skyBot);
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

      // Aurora boréale
      const auroraAlpha = 0.08+Math.sin(s.tick*0.005)*0.04;
      const aurora = ctx.createLinearGradient(0,H*0.1,0,H*0.4);
      aurora.addColorStop(0,'rgba(0,229,255,0)');
      aurora.addColorStop(0.3,`rgba(0,229,255,${auroraAlpha})`);
      aurora.addColorStop(0.6,`rgba(191,95,255,${auroraAlpha*0.7})`);
      aurora.addColorStop(1,'rgba(191,95,255,0)');
      ctx.fillStyle=aurora;
      for(let ax=0;ax<W;ax+=60){
        const wave=Math.sin(s.tick*0.01+ax*0.02)*20;
        ctx.beginPath();
        ctx.ellipse(ax+30,H*0.25+wave,35,25,0,0,Math.PI*2);
        ctx.fill();
      }

      // Étoiles animées
      for(let i=0;i<80;i++){
        const sx=((i*137.5)%W), sy=((i*89.3)%(H*0.48));
        const twinkle=0.2+Math.sin(s.tick*0.03+i*0.7)*0.3;
        ctx.fillStyle=`rgba(255,255,255,${twinkle})`;
        const starSize=i%7===0?2:i%3===0?1.5:1;
        ctx.fillRect(sx,sy,starSize,starSize);
      }

      // Lune
      const moonX=W*0.85, moonY=H*0.12;
      const moonGrd=ctx.createRadialGradient(moonX,moonY,2,moonX,moonY,22);
      moonGrd.addColorStop(0,'rgba(255,248,220,0.95)');
      moonGrd.addColorStop(1,'rgba(255,248,220,0)');
      ctx.fillStyle=moonGrd;
      ctx.beginPath(); ctx.arc(moonX,moonY,22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,248,220,0.7)';
      ctx.beginPath(); ctx.arc(moonX,moonY,14,0,Math.PI*2); ctx.fill();

      // Horizon lumineux
      const horizonGrd=ctx.createLinearGradient(0,H*0.42,0,H*0.52);
      horizonGrd.addColorStop(0,'rgba(0,100,180,0.15)');
      horizonGrd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=horizonGrd; ctx.fillRect(0,H*0.42,W,H*0.1);

      // Sol dégradé avec texture
      const groundGrd=ctx.createLinearGradient(0,H*0.50,0,H);
      groundGrd.addColorStop(0,'#0d1a0d');
      groundGrd.addColorStop(0.3,'#0a140a');
      groundGrd.addColorStop(1,'#050905');
      ctx.fillStyle=groundGrd; ctx.fillRect(0,H*0.50,W,H*0.5);

      // Herbe à l'horizon
      const grassGrd=ctx.createLinearGradient(0,H*0.49,0,H*0.54);
      grassGrd.addColorStop(0,'rgba(20,60,20,0.6)');
      grassGrd.addColorStop(1,'rgba(10,30,10,0)');
      ctx.fillStyle=grassGrd; ctx.fillRect(0,H*0.49,W,H*0.05);

      // Brume à l'horizon
      const fogGrd=ctx.createLinearGradient(0,H*0.45,0,H*0.55);
      fogGrd.addColorStop(0,'rgba(0,229,255,0)');
      fogGrd.addColorStop(0.5,`rgba(0,229,255,0.04)`);
      fogGrd.addColorStop(1,'rgba(0,229,255,0)');
      ctx.fillStyle=fogGrd; ctx.fillRect(0,H*0.45,W,H*0.1);

      // ── Collecte objets 3D ──
      const objects=[];

      // Zones
      ZONES.forEach(zone=>{
        const corners=[
          [zone.x-zone.w/2,0,zone.z-zone.h/2],[zone.x+zone.w/2,0,zone.z-zone.h/2],
          [zone.x+zone.w/2,0,zone.z+zone.h/2],[zone.x-zone.w/2,0,zone.z+zone.h/2],
        ];
        const proj=corners.map(([x,y,z])=>project(x,y,z,camX,camY,camZ,s.camAngle,W,H));
        if(proj.some(p=>!p)) return;
        const depth=corners.reduce((a,c)=>a+Math.sqrt((c[0]-camX)**2+(c[2]-camZ)**2),0)/4;
        objects.push({type:'zone',zone,proj,depth});
      });

      // Grille
      for(let gx=-38;gx<=38;gx+=4){
        for(let gz=-38;gz<=38;gz+=4){
          const p1=project(gx,0,gz,camX,camY,camZ,s.camAngle,W,H);
          const p2=project(gx+4,0,gz,camX,camY,camZ,s.camAngle,W,H);
          const p3=project(gx,0,gz+4,camX,camY,camZ,s.camAngle,W,H);
          if(!p1||!p2||!p3) continue;
          objects.push({type:'grid',p1,p2,p3,depth:Math.sqrt((gx+2-camX)**2+(gz+2-camZ)**2)});
        }
      }

      // Eau
      WATER_TILES.forEach(w=>{
        const p=project(w.x,0.05,w.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>45) return;
        objects.push({type:'water',p,r:w.r,depth:p.depth});
      });

      // Arbres
      TREES.forEach(t=>{
        const p=project(t.x,0,t.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>50) return;
        objects.push({type:'tree',p,s:t.s||1,depth:p.depth});
      });

      // Pins
      PINE_TREES.forEach(t=>{
        const p=project(t.x,0,t.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>50) return;
        objects.push({type:'pine',p,s:t.s||1,depth:p.depth});
      });

      // Rochers
      ROCKS.forEach(r=>{
        const p=project(r.x,0,r.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>50) return;
        objects.push({type:'rock',p,s:r.s||1,depth:p.depth});
      });

      // Cristaux
      CRYSTALS.forEach(c=>{
        const p=project(c.x,0,c.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>50) return;
        objects.push({type:'crystal',p,h:c.h||1,depth:p.depth});
      });

      // Volcans
      VOLCANOES.forEach(v=>{
        const p=project(v.x,0,v.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>50) return;
        objects.push({type:'volcano',p,s:v.s||1,depth:p.depth});
      });

      // Champignons
      MUSHROOMS.forEach(m=>{
        const p=project(m.x,0,m.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>50) return;
        objects.push({type:'mushroom',p,s:m.s||1,depth:p.depth});
      });

      // Éclairs
      LIGHTNING_RODS.forEach(l=>{
        const p=project(l.x,0,l.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>50) return;
        objects.push({type:'lightning',p,depth:p.depth});
      });

      // Spawns
      s.spawns.forEach(spawn=>{
        if(spawn.captured) return;
        const bob=Math.sin(s.tick*0.04+spawn.bobOff)*0.35;
        const p=project(spawn.x,0.6+bob,spawn.z,camX,camY,camZ,s.camAngle,W,H);
        if(!p||p.depth>55) return;
        const dist=Math.sqrt((spawn.x-s.player.x)**2+(spawn.z-s.player.z)**2);
        objects.push({type:'creature',spawn,p,depth:p.depth,dist,bob});
      });

      // Joueur
      {
        const p=project(s.player.x,0.8,s.player.z,camX,camY,camZ,s.camAngle,W,H);
        if(p) objects.push({type:'player',p,depth:p.depth});
      }

      // ── TRIER ET DESSINER ──
      objects.sort((a,b)=>b.depth-a.depth);

      objects.forEach(obj=>{
        const {type}=obj;

        if(type==='zone'){
          const pts=obj.proj;
          ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
          pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
          ctx.fillStyle=obj.zone.color; ctx.globalAlpha=0.88; ctx.fill();
          // Bordure zone lumineuse
          ctx.strokeStyle=obj.zone.border; ctx.lineWidth=1.5; ctx.globalAlpha=0.6; ctx.stroke();
          ctx.globalAlpha=1;
          // Texture subtile (points aléatoires)
          const cx2=(pts[0].x+pts[2].x)/2, cy2=(pts[0].y+pts[2].y)/2;
          ctx.fillStyle='rgba(255,255,255,0.03)';
          for(let i=0;i<5;i++){
            const tx=pts[0].x+(Math.random()*(pts[2].x-pts[0].x));
            const ty=pts[0].y+(Math.random()*(pts[2].y-pts[0].y));
            ctx.beginPath(); ctx.arc(tx,ty,1+Math.random()*2,0,Math.PI*2); ctx.fill();
          }
        }

        else if(type==='grid'){
          const op=Math.max(0,0.06-obj.depth*0.0015);
          if(op<=0) return;
          ctx.strokeStyle=`rgba(255,255,255,${op})`; ctx.lineWidth=0.5;
          ctx.beginPath(); ctx.moveTo(obj.p1.x,obj.p1.y); ctx.lineTo(obj.p2.x,obj.p2.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(obj.p1.x,obj.p1.y); ctx.lineTo(obj.p3.x,obj.p3.y); ctx.stroke();
        }

        else if(type==='water'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.04,2.5)*obj.r;
          const pulse=Math.sin(s.tick*0.06)*0.15+0.85;
          const wGrd=ctx.createRadialGradient(x,y,0,x,y,sc*18);
          wGrd.addColorStop(0,'rgba(40,120,220,0.8)');
          wGrd.addColorStop(0.6,'rgba(20,80,180,0.6)');
          wGrd.addColorStop(1,'rgba(10,40,100,0)');
          ctx.fillStyle=wGrd; ctx.globalAlpha=pulse;
          ctx.beginPath(); ctx.ellipse(x,y,sc*18,sc*8,0,0,Math.PI*2); ctx.fill();
          // Reflet
          ctx.fillStyle='rgba(150,200,255,0.2)';
          ctx.beginPath(); ctx.ellipse(x-sc*4,y-sc*2,sc*6,sc*3,-0.3,0,Math.PI*2); ctx.fill();
          ctx.globalAlpha=1;
        }

        else if(type==='tree'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.04,2.5)*obj.s;
          const sway=Math.sin(s.tick*0.02+obj.p.x)*sc*0.5;
          // Tronc
          const tg=ctx.createLinearGradient(x-sc*3,y,x+sc*3,y);
          tg.addColorStop(0,'#2a1400'); tg.addColorStop(0.5,'#4a2800'); tg.addColorStop(1,'#2a1400');
          ctx.fillStyle=tg; ctx.fillRect(x-sc*3,y,sc*6,sc*20);
          // Feuillage 3 couches
          [[0,'#0d3008',14],[sc*1,'#1a5010',12],[sc*2,'#2a7020',10]].forEach(([dy,col,r])=>{
            ctx.fillStyle=col;
            ctx.beginPath(); ctx.moveTo(x+sway,y-sc*28-dy); ctx.lineTo(x-sc*r+sway,y-dy); ctx.lineTo(x+sc*r+sway,y-dy); ctx.closePath(); ctx.fill();
          });
          // Surbrillance
          ctx.fillStyle='rgba(100,200,80,0.15)';
          ctx.beginPath(); ctx.ellipse(x-sc*3+sway,y-sc*22,sc*4,sc*6,-0.2,0,Math.PI*2); ctx.fill();
        }

        else if(type==='pine'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.04,2.5)*obj.s;
          const sway=Math.sin(s.tick*0.015+obj.p.x+1)*sc*0.3;
          ctx.fillStyle='#2a1400'; ctx.fillRect(x-sc*2,y,sc*4,sc*16);
          [[0,'#0a2a18',8],[sc*2.5,'#0d3a20',6.5],[sc*5,'#104828',5]].forEach(([dy,col,r])=>{
            ctx.fillStyle=col;
            ctx.beginPath(); ctx.moveTo(x+sway,y-sc*32-dy); ctx.lineTo(x-sc*r+sway,y-dy); ctx.lineTo(x+sc*r+sway,y-dy); ctx.closePath(); ctx.fill();
          });
        }

        else if(type==='rock'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.045,2.5)*obj.s;
          ctx.fillStyle='#2a2820';
          ctx.beginPath(); ctx.ellipse(x,y,sc*16,sc*10,0,0,Math.PI*2); ctx.fill();
          const rg=ctx.createLinearGradient(x-sc*16,y-sc*10,x+sc*16,y+sc*5);
          rg.addColorStop(0,'#5a5848'); rg.addColorStop(0.5,'#4a4838'); rg.addColorStop(1,'#2a2820');
          ctx.fillStyle=rg;
          ctx.beginPath(); ctx.ellipse(x-sc*2,y-sc*2,sc*14,sc*9,-0.2,0,Math.PI*2); ctx.fill();
          ctx.fillStyle='rgba(255,255,255,0.12)';
          ctx.beginPath(); ctx.ellipse(x-sc*5,y-sc*5,sc*5,sc*3,-0.3,0,Math.PI*2); ctx.fill();
        }

        else if(type==='crystal'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.045,2.5)*obj.h;
          const pulse=0.8+Math.sin(s.tick*0.04+obj.p.x)*0.2;
          ctx.globalAlpha=pulse;
          // Cristal principal
          ctx.fillStyle='#4080c0';
          ctx.beginPath(); ctx.moveTo(x,y-sc*26); ctx.lineTo(x+sc*7,y-sc*6); ctx.lineTo(x+sc*5,y+sc*4); ctx.lineTo(x-sc*5,y+sc*4); ctx.lineTo(x-sc*7,y-sc*6); ctx.closePath(); ctx.fill();
          // Face lumineuse
          ctx.fillStyle='rgba(150,200,255,0.5)';
          ctx.beginPath(); ctx.moveTo(x,y-sc*26); ctx.lineTo(x+sc*7,y-sc*6); ctx.lineTo(x,y-sc*8); ctx.closePath(); ctx.fill();
          // Glow
          const cGrd=ctx.createRadialGradient(x,y-sc*14,0,x,y-sc*14,sc*16);
          cGrd.addColorStop(0,'rgba(80,150,255,0.3)'); cGrd.addColorStop(1,'rgba(80,150,255,0)');
          ctx.fillStyle=cGrd; ctx.beginPath(); ctx.arc(x,y-sc*14,sc*16,0,Math.PI*2); ctx.fill();
          ctx.globalAlpha=1;
        }

        else if(type==='volcano'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.045,2.5)*obj.s;
          // Cone
          const vg=ctx.createLinearGradient(x-sc*20,y,x+sc*20,y);
          vg.addColorStop(0,'#1a0500'); vg.addColorStop(0.5,'#3a0800'); vg.addColorStop(1,'#1a0500');
          ctx.fillStyle=vg;
          ctx.beginPath(); ctx.moveTo(x,y-sc*38); ctx.lineTo(x-sc*22,y+sc*10); ctx.lineTo(x+sc*22,y+sc*10); ctx.closePath(); ctx.fill();
          // Lave animée
          const lPulse=0.6+Math.sin(s.tick*0.08)*0.4;
          ctx.fillStyle=`rgba(255,${60+Math.sin(s.tick*0.05)*40},0,${lPulse})`;
          ctx.beginPath(); ctx.ellipse(x,y-sc*36,sc*6,sc*5,0,0,Math.PI*2); ctx.fill();
          // Fumée
          if(s.tick%20===0) spawnParticle(x,y-sc*40,'rgba(100,100,100,');
          ctx.fillStyle='rgba(60,60,60,0.3)';
          ctx.beginPath(); ctx.arc(x+Math.sin(s.tick*0.02)*sc*3,y-sc*44,sc*6,0,Math.PI*2); ctx.fill();
        }

        else if(type==='mushroom'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.04,2)*obj.s;
          ctx.fillStyle='#3a2010'; ctx.fillRect(x-sc*2,y-sc*4,sc*4,sc*12);
          ctx.fillStyle='#cc3340';
          ctx.beginPath(); ctx.ellipse(x,y-sc*8,sc*10,sc*8,0,Math.PI,Math.PI*2); ctx.fill();
          ctx.fillStyle='rgba(255,255,255,0.7)';
          [[-4,-5],[2,-9],[6,-4]].forEach(([dx,dy])=>{
            ctx.beginPath(); ctx.arc(x+sc*dx,y+sc*dy,sc*1.5,0,Math.PI*2); ctx.fill();
          });
        }

        else if(type==='lightning'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.04,2);
          ctx.fillStyle='#888'; ctx.fillRect(x-sc*1.5,y-sc*18,sc*3,sc*18);
          if(s.tick%60<3){
            ctx.strokeStyle='rgba(255,255,0,0.9)'; ctx.lineWidth=sc*1.5;
            ctx.beginPath();
            ctx.moveTo(x,y-sc*18);
            for(let i=0;i<5;i++) ctx.lineTo(x+(Math.random()-0.5)*sc*8,y-sc*(18-i*4));
            ctx.stroke();
          }
        }

        else if(type==='creature'){
          const {x,y,size}=obj.p;
          const inRange=obj.dist<3;

          // Dessine le sprite
          drawCreatureSprite(ctx, obj.spawn.id, x, y, size);

          // Nom si proche
          if(obj.dist<10&&size>3){
            const color=obj.spawn.color;
            ctx.font=`bold ${Math.round(9+size*0.3)}px system-ui`;
            ctx.textAlign='center';
            ctx.globalAlpha=Math.min(1,(10-obj.dist)/7);
            // Fond du texte
            const tw=ctx.measureText(obj.spawn.name).width;
            ctx.fillStyle='rgba(0,0,0,0.5)';
            ctx.fillRect(x-tw/2-4,y-size*0.6-18,tw+8,16);
            ctx.fillStyle=color; ctx.fillText(obj.spawn.name,x,y-size*0.6-6);
            ctx.globalAlpha=1; ctx.textAlign='left';
          }

          // Indicateur portée
          if(inRange){
            ctx.strokeStyle=obj.spawn.color; ctx.lineWidth=2;
            ctx.globalAlpha=0.7+Math.sin(s.tick*0.2)*0.3;
            ctx.setLineDash([5,4]);
            ctx.beginPath(); ctx.arc(x,y,Math.min(size*0.08,4)*18,0,Math.PI*2); ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha=1;
          }

          // Détection
          if(inRange&&!s.encounter&&!s.encounterShown&&!s.fleeTimeout){
            s.encounter=obj.spawn; s.encounterShown=true;
            if(onEncounter) onEncounter(obj.spawn);
          }
        }

        else if(type==='player'){
          const {x,y,size}=obj.p; const sc=Math.min(size*0.05,3.2);
          // Aura
          const aura=ctx.createRadialGradient(x,y,0,x,y,sc*30);
          aura.addColorStop(0,'rgba(0,229,255,0.18)'); aura.addColorStop(1,'rgba(0,229,255,0)');
          ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(x,y,sc*30,0,Math.PI*2); ctx.fill();
          // Sprite joueur (Lumikos)
          drawCreatureSprite(ctx,'lumikos',x,y,size*1.1);
          // Rayon capture
          ctx.strokeStyle='rgba(0,229,255,0.15)'; ctx.lineWidth=1;
          ctx.setLineDash([6,6]);
          ctx.beginPath(); ctx.arc(x,y,sc*55,0,Math.PI*2); ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // ── Particules ──
      s.particles=s.particles.filter(p=>p.life>0);
      s.particles.forEach(p=>{
        ctx.fillStyle=p.color+p.life+')';
        ctx.beginPath(); ctx.arc(p.x,p.y,3*p.life,0,Math.PI*2); ctx.fill();
        p.x+=p.vx; p.y+=p.vy; p.life-=0.02;
      });

      // ── HUD ──
      // Barre de zone
      if(s.zone){
        ctx.font='bold 13px system-ui'; ctx.textAlign='center';
        const lw=ctx.measureText(s.zone.name).width+28;
        ctx.fillStyle='rgba(0,0,0,0.5)';
        ctx.strokeStyle='rgba(0,229,255,0.5)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.roundRect(W/2-lw/2,14,lw,32,16); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#00e5ff'; ctx.fillText(s.zone.name,W/2,35);
        ctx.textAlign='left';
      }

      // Coords + boussole
      ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='11px monospace';
      ctx.textAlign='right';
      ctx.fillText(`x:${Math.round(s.player.x)} z:${Math.round(s.player.z)}`,W-10,20);
      const compassDir=['N','NE','E','SE','S','SO','O','NO'][Math.round(((s.camAngle%(Math.PI*2))/(Math.PI*2)*8+8))%8];
      ctx.fillText(`↑ ${compassDir}`,W-10,36);
      ctx.textAlign='left';

      // Minimap améliorée
      const mmS=90, mmX=W-mmS-10, mmY=H-mmS-10;
      ctx.fillStyle='rgba(4,8,15,0.9)';
      ctx.strokeStyle='rgba(0,229,255,0.4)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(mmX,mmY,mmS,mmS,10); ctx.fill(); ctx.stroke();
      const mmScale=mmS/80;
      ZONES.forEach(z=>{
        ctx.fillStyle=z.color; ctx.globalAlpha=0.75;
        ctx.fillRect(mmX+(z.x-z.w/2+40)*mmScale,mmY+(z.z-z.h/2+40)*mmScale,z.w*mmScale,z.h*mmScale);
      });
      ctx.globalAlpha=1;
      s.spawns.forEach(sp=>{
        if(sp.captured) return;
        const c=ALL_CREATURES[sp.id];
        ctx.fillStyle=sp.color;
        ctx.beginPath(); ctx.arc(mmX+(sp.x+40)*mmScale,mmY+(sp.z+40)*mmScale,2.5,0,Math.PI*2); ctx.fill();
      });
      // Joueur sur minimap
      ctx.fillStyle='#00e5ff';
      const px2=mmX+(s.player.x+40)*mmScale, pz2=mmY+(s.player.z+40)*mmScale;
      ctx.beginPath(); ctx.arc(px2,pz2,4,0,Math.PI*2); ctx.fill();
      // Direction joueur
      ctx.strokeStyle='#00e5ff'; ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(px2,pz2);
      ctx.lineTo(px2-Math.sin(s.camAngle)*10, pz2+Math.cos(s.camAngle)*10);
      ctx.stroke();

      animId=requestAnimationFrame(drawScene);
    }

    animId=requestAnimationFrame(drawScene);
    return ()=>{
      cancelAnimationFrame(animId);
      if(Platform.OS==='web'){ window.removeEventListener('keydown',onDown); window.removeEventListener('keyup',onUp); }
    };
  }, []);

  const s=stateRef.current;
  const dpadPress  =dir=>{s.keys[dir]=true;};
  const dpadRelease=dir=>{s.keys[dir]=false;};

  return (
    <View style={{flex:1}}>
      <canvas ref={canvasRef} width={SW} height={SH-72} style={{display:'block',width:SW,height:SH-72}}/>
      <View style={styles.dpad}>
        <View style={styles.dpadRow}>
          <View style={styles.dpadEmpty}/>
          <TouchableOpacity style={styles.dpadBtn} onPressIn={()=>dpadPress('ArrowUp')} onPressOut={()=>dpadRelease('ArrowUp')}><Text style={styles.dpadText}>↑</Text></TouchableOpacity>
          <View style={styles.dpadEmpty}/>
        </View>
        <View style={styles.dpadRow}>
          <TouchableOpacity style={styles.dpadBtn} onPressIn={()=>dpadPress('ArrowLeft')} onPressOut={()=>dpadRelease('ArrowLeft')}><Text style={styles.dpadText}>←</Text></TouchableOpacity>
          <View style={styles.dpadEmpty}/>
          <TouchableOpacity style={styles.dpadBtn} onPressIn={()=>dpadPress('ArrowRight')} onPressOut={()=>dpadRelease('ArrowRight')}><Text style={styles.dpadText}>→</Text></TouchableOpacity>
        </View>
        <View style={styles.dpadRow}>
          <View style={styles.dpadEmpty}/>
          <TouchableOpacity style={styles.dpadBtn} onPressIn={()=>dpadPress('ArrowDown')} onPressOut={()=>dpadRelease('ArrowDown')}><Text style={styles.dpadText}>↓</Text></TouchableOpacity>
          <View style={styles.dpadEmpty}/>
        </View>
      </View>
      {Platform.OS==='web'&&<View style={styles.keysHint}><Text style={styles.keysHintText}>WASD / ↑↓ avancer · ←→ tourner</Text></View>}
    </View>
  );
});

// ─── WorldScreen ─────────────────────────────────────────────────
export default function WorldScreen() {
  const { crystals, addToCollection, addCrystals, incrementSummon } = useGameStore();
  const [encounter, setEncounter] = useState(null);
  const [phase, setPhase]         = useState('world');
  const worldRef = useRef(null);

  function handleEncounter(spawn) { setEncounter(spawn); setPhase('encounter'); }

  function handleCapture() {
    if(!encounter||crystals<3) return;
    const creature=ALL_CREATURES[encounter.id];
    if(!creature) return;
    addToCollection({...creature}); addCrystals(-3); incrementSummon();
    const s=worldRef.current;
    if(s){
      const sp=s.spawns.find(x=>x.uid===encounter.uid);
      if(sp) sp.captured=true;
      s.encounter=null; s.encounterShown=false; s.fleeTimeout=false;
    }
    setPhase('caught');
  }

  function handleFlee() {
    const s=worldRef.current;
    if(s){
      s.player.x+=Math.sin(s.camAngle)*6;
      s.player.z-=Math.cos(s.camAngle)*6;
      s.player.x=Math.max(-35,Math.min(35,s.player.x));
      s.player.z=Math.max(-35,Math.min(35,s.player.z));
      s.encounter=null; s.encounterShown=false; s.fleeTimeout=true;
      setTimeout(()=>{ if(worldRef.current){ worldRef.current.fleeTimeout=false; worldRef.current.encounterShown=false; } },4000);
    }
    setPhase('world'); setEncounter(null);
  }

  if(phase==='encounter'&&encounter){
    const creature=ALL_CREATURES[encounter.id];
    const EncSprite=SPRITES[encounter.id?.replace('_shiny','')]||SPRITES.lumikos;
    const EncounterScreen = React.memo(()=>{
      const scaleAnim = React.useRef(new Animated.Value(0)).current;
      const glowAnim  = React.useRef(new Animated.Value(0)).current;
      const slideAnim = React.useRef(new Animated.Value(40)).current;
      const shakeAnim = React.useRef(new Animated.Value(0)).current;

      React.useEffect(()=>{
        Animated.parallel([
          Animated.spring(scaleAnim,{toValue:1,friction:4,useNativeDriver:true}),
          Animated.timing(slideAnim,{toValue:0,duration:400,useNativeDriver:true}),
        ]).start();
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim,{toValue:1,duration:900,useNativeDriver:true}),
            Animated.timing(glowAnim,{toValue:0,duration:900,useNativeDriver:true}),
          ])
        ).start();
        if(encounter.rarity==='legendary'){
          Animated.loop(
            Animated.sequence([
              Animated.timing(shakeAnim,{toValue:4, duration:80,useNativeDriver:true}),
              Animated.timing(shakeAnim,{toValue:-4,duration:80,useNativeDriver:true}),
              Animated.timing(shakeAnim,{toValue:0, duration:80,useNativeDriver:true}),
              Animated.delay(2000),
            ])
          ).start();
        }
      },[]);

      return (
        <LinearGradient colors={creature?.bgGradient||['#07090f','#0d1220']} style={styles.container}>
          <SafeAreaView style={styles.safe}>
            <View style={styles.encounterArea}>
              {/* Badge apparition */}
              <Animated.View style={[styles.encounterBadge,{
                backgroundColor:encounter.color+'22',borderColor:encounter.color+'55',
                opacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]}),
                transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.98,1.04]})}],
              }]}>
                <Text style={[styles.encounterBadgeText,{color:encounter.color}]}>
                  {encounter.rarity==='legendary'?'🌟 LÉGENDAIRE !':encounter.rarity==='exclusive'?'⭐ EXCLUSIF !':encounter.rarity==='rare'?'◆ RARE':encounter.rarity==='shiny'?'✨ SHINY':'✦ Une créature apparaît !'}
                </Text>
              </Animated.View>

              {/* Sprite animé */}
              <Animated.View style={{
                transform:[{scale:scaleAnim},{translateX:shakeAnim}],
              }}>
                <Animated.View style={{
                  shadowColor:encounter.color,shadowRadius:30,shadowOpacity:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.3,0.8]}),
                  alignItems:'center',
                }}>
                  {EncSprite ? <EncSprite size={130}/> : (
                    <Text style={{fontSize:80}}>
                      {encounter.rarity==='legendary'?'🌟':encounter.rarity==='rare'?'◆':'✦'}
                    </Text>
                  )}
                </Animated.View>
              </Animated.View>

              {/* Infos créature */}
              <Animated.View style={[styles.encounterCard,{
                borderColor:encounter.color+'44',
                opacity:slideAnim.interpolate({inputRange:[0,40],outputRange:[1,0]}),
                transform:[{translateY:slideAnim}],
              }]}>
                <LinearGradient colors={creature?.bgGradient||['#0d1220','#07090f']} style={styles.encounterCardGrad}>
                  <View style={[StyleSheet.absoluteFill,{borderRadius:20,overflow:'hidden'}]}>
                    <LinearGradient colors={['rgba(255,255,255,0.05)','rgba(255,255,255,0)']}
                      start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}/>
                  </View>
                  <Text style={[styles.encounterName,{color:encounter.color}]}>{encounter.name}</Text>
                  <View style={styles.encounterTagRow}>
                    <View style={[styles.typeTag,{backgroundColor:encounter.color+'22',borderColor:encounter.color+'44'}]}>
                      <Text style={[styles.typeTagText,{color:encounter.color}]}>{creature?.type}</Text>
                    </View>
                    <View style={[styles.typeTag,{backgroundColor:encounter.color+'15',borderColor:encounter.color+'33'}]}>
                      <Text style={[styles.typeTagText,{color:encounter.color}]}>{creature?.rarityLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.encounterDesc}>{creature?.description}</Text>
                  <View style={styles.encounterStats}>
                    {[['PV',creature?.stats.hp,'#39ff8f'],['ATK',creature?.stats.atk,'#ff4fa3'],['DEF',creature?.stats.def,'#00e5ff'],['VIT',creature?.stats.spd,'#ffd700']].map(([l,v,c])=>(
                      <View key={l} style={[styles.statChip,{borderColor:c+'44',backgroundColor:c+'10'}]}>
                        <Text style={[styles.statChipLabel,{color:c+'99'}]}>{l}</Text>
                        <Text style={[styles.statChipVal,{color:c}]}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Boutons */}
              <View style={styles.encounterBtns}>
                <TouchableOpacity onPress={handleCapture}
                  disabled={crystals<3}
                  style={[styles.captureBtn,{borderColor:encounter.color+'77'},crystals<3&&styles.disabled]}>
                  <LinearGradient colors={[encounter.color+'66',encounter.color+'33']}
                    start={{x:0,y:0}} end={{x:1,y:0}} style={styles.captureBtnGrad}>
                    <Text style={[styles.captureBtnText,{color:'#fff'}]}>
                      {crystals>=3?`✦ CAPTURER`:`Pas assez de cristaux`}
                    </Text>
                    <Text style={[styles.captureBtnSub,{color:'#ffffffaa'}]}>
                      {crystals>=3?`Coûte 3 💎`:`${crystals}/3 💎`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFlee} style={styles.fleeBtn}>
                  <Text style={styles.fleeBtnText}>← Fuir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    });
    return <EncounterScreen/>;
  }

  if(phase==='caught'&&encounter){
    const CaughtScreen = React.memo(()=>{
      const scaleAnim = React.useRef(new Animated.Value(0)).current;
      const glowAnim  = React.useRef(new Animated.Value(0)).current;
      React.useEffect(()=>{
        Animated.spring(scaleAnim,{toValue:1,friction:3,useNativeDriver:true}).start();
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim,{toValue:1,duration:600,useNativeDriver:true}),
            Animated.timing(glowAnim,{toValue:0,duration:600,useNativeDriver:true}),
          ])
        ).start();
      },[]);
      return (
        <LinearGradient colors={ALL_CREATURES[encounter.id]?.bgGradient||['#07090f','#0d1220']} style={styles.container}>
          <SafeAreaView style={styles.safe}>
            <View style={styles.encounterArea}>
              <Animated.Text style={[styles.caughtStar,{
                color:encounter.color,
                opacity:glowAnim,
                transform:[{scale:glowAnim.interpolate({inputRange:[0,1],outputRange:[0.95,1.05]})}],
              }]}>✦ ✦ ✦</Animated.Text>
              <Text style={[styles.caughtTitle,{color:encounter.color}]}>CAPTURÉ !</Text>
              <Animated.View style={{transform:[{scale:scaleAnim}]}}>
                {(SPRITES[encounter.id?.replace('_shiny','')]||SPRITES.lumikos)({size:110})}
              </Animated.View>
              <Text style={[styles.encounterName,{color:encounter.color}]}>{encounter.name}</Text>
              <Text style={styles.encounterDesc}>{ALL_CREATURES[encounter.id]?.description}</Text>
              <Text style={styles.caughtXp}>+20 XP · Ajouté à ta collection</Text>
              <TouchableOpacity onPress={()=>{setPhase('world');setEncounter(null);}}
                style={[styles.captureBtn,{borderColor:encounter.color+'44',marginTop:8}]}>
                <LinearGradient colors={[encounter.color+'33',encounter.color+'11']} style={styles.captureBtnGrad}>
                  <Text style={[styles.captureBtnText,{color:encounter.color}]}>↺ Retour au monde</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    });
    return <CaughtScreen/>;
  }

  return (
    <View style={styles.container}>
      <World3DCanvas ref={worldRef} onEncounter={handleEncounter}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#04080f'}, safe:{flex:1},
  dpad:{position:'absolute',bottom:20,left:16},
  dpadRow:{flexDirection:'row'},
  dpadBtn:{width:46,height:46,borderRadius:12,margin:2,backgroundColor:'rgba(0,0,0,0.5)',borderWidth:1,borderColor:'rgba(0,229,255,0.4)',alignItems:'center',justifyContent:'center'},
  dpadEmpty:{width:46,height:46,margin:2},
  dpadText:{color:'#00e5ff',fontSize:20,fontWeight:'900'},
  keysHint:{position:'absolute',bottom:6,left:0,right:0,alignItems:'center'},
  keysHintText:{color:'rgba(255,255,255,0.2)',fontSize:10,letterSpacing:1},
  encounterArea:{flex:1,alignItems:'center',justifyContent:'center',gap:8,padding:24},
  encounterBadge:{borderWidth:1,borderRadius:12,paddingHorizontal:14,paddingVertical:6},
  encounterBadgeText:{fontSize:12,fontWeight:'900',letterSpacing:2},
  encounterCard:{width:'100%',borderWidth:1,borderRadius:20,overflow:'hidden'},
  encounterCardGrad:{padding:16,gap:10,alignItems:'center'},
  encounterTagRow:{flexDirection:'row',gap:8},
  typeTag:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:4},
  typeTagText:{fontSize:10,fontWeight:'700',letterSpacing:1},
  caughtStar:{fontSize:22,letterSpacing:8,textAlign:'center'},
  caughtXp:{color:'#00e5ff',fontSize:12,fontWeight:'700'},
  encounterTitle:{color:'#00e5ff',fontSize:13,letterSpacing:4,textTransform:'uppercase'},
  encounterName:{fontSize:30,fontWeight:'900',letterSpacing:3},
  encounterType:{fontSize:12,color:'#4a6080',letterSpacing:2},
  rarityTag:{fontSize:11,fontWeight:'700',letterSpacing:2},
  encounterDesc:{color:'#6a84a0',fontSize:13,textAlign:'center',fontStyle:'italic',paddingHorizontal:20},
  encounterStats:{flexDirection:'row',gap:8,marginTop:4},
  statChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:6,alignItems:'center',gap:2},
  statChipLabel:{fontSize:8,fontWeight:'700',letterSpacing:1},
  statChipVal:{fontSize:15,fontWeight:'900'},
  encounterBtns:{gap:10,width:'100%',marginTop:8},
  captureBtn:{borderRadius:14,overflow:'hidden',borderWidth:1},
  captureBtnGrad:{alignItems:'center',paddingVertical:16},
  captureBtnText:{fontSize:15,fontWeight:'800',letterSpacing:2},
  captureBtnSub:{fontSize:10,fontWeight:'600',marginTop:2},
  fleeBtn:{alignItems:'center',padding:12},
  fleeBtnText:{color:'#4a6080',fontSize:13},
  caughtTitle:{fontSize:26,fontWeight:'900',letterSpacing:4},
  disabled:{opacity:0.4},
});
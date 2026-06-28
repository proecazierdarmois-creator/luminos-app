// screens/MapScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path, Rect, Line, G } from 'react-native-svg';
import { useGameStore } from '../store/useGameStore';
import { SPRITES } from '../components/CreatureCard';
import { CREATURES, rollCreature } from '../data/creatures';

const { width, height } = Dimensions.get('window');
const MAP_W = width - 32;
const MAP_H = 260;

// ─── Zones de la carte ───────────────────────────────────────────
const ZONES = [
  {
    id: 'forest',
    name: 'Forêt de Lumière',
    color: '#39ff8f',
    x: MAP_W * 0.05, y: MAP_H * 0.45,
    rx: MAP_W * 0.18, ry: MAP_H * 0.22,
    creatures: ['lumikos', 'lumivex'],
    hours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5], // nuit
    emoji: '🌲',
  },
  {
    id: 'plains',
    name: 'Plaines Dorées',
    color: '#ffd700',
    x: MAP_W * 0.38, y: MAP_H * 0.55,
    rx: MAP_W * 0.22, ry: MAP_H * 0.20,
    creatures: ['lumikos', 'lumirex'],
    hours: [6, 7, 8, 9, 10, 11, 12], // matin
    emoji: '🌾',
  },
  {
    id: 'volcano',
    name: 'Cratère Solaire',
    color: '#ff4fa3',
    x: MAP_W * 0.72, y: MAP_H * 0.38,
    rx: MAP_W * 0.16, ry: MAP_H * 0.20,
    creatures: ['lumirex'],
    hours: [5, 6, 7, 18, 19, 20], // aube et crépuscule
    emoji: '🌋',
  },
  {
    id: 'cosmos',
    name: 'Sanctuaire Cosmique',
    color: '#bf5fff',
    x: MAP_W * 0.55, y: MAP_H * 0.18,
    rx: MAP_W * 0.14, ry: MAP_H * 0.16,
    creatures: ['luminos'],
    hours: [0, 1, 2, 3], // minuit uniquement
    emoji: '🌌',
  },
  {
    id: 'lake',
    name: 'Lac des Reflets',
    color: '#00e5ff',
    x: MAP_W * 0.22, y: MAP_H * 0.22,
    rx: MAP_W * 0.14, ry: MAP_H * 0.14,
    creatures: ['lumikos'],
    hours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], // jour
    emoji: '💧',
  },
];

function getActiveZones(hour) {
  return ZONES.filter(z => z.hours.includes(hour));
}

function getTimeLabel(hour) {
  if (hour >= 5  && hour < 8)  return { label: 'Aube',       emoji: '🌅', color: '#ffa500' };
  if (hour >= 8  && hour < 12) return { label: 'Matin',      emoji: '☀️',  color: '#ffd700' };
  if (hour >= 12 && hour < 17) return { label: 'Après-midi', emoji: '🌤',  color: '#00e5ff' };
  if (hour >= 17 && hour < 20) return { label: 'Crépuscule', emoji: '🌇',  color: '#ff4fa3' };
  if (hour >= 20 || hour < 5)  return { label: 'Nuit',       emoji: '🌙',  color: '#bf5fff' };
  return { label: '', emoji: '', color: '#fff' };
}

// ─── MapScreen ────────────────────────────────────────────────────
export default function MapScreen() {
  const { addToCollection, crystals } = useGameStore();
  const [hour, setHour] = useState(new Date().getHours());
  const [selectedZone, setSelectedZone] = useState(null);
  const [encounter, setEncounter] = useState(null); // créature rencontrée
  const [phase, setPhase] = useState('map'); // map | encounter | caught
  const [timeOffset, setTimeOffset] = useState(0); // pour tester les heures (debug)

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setHour((new Date().getHours() + timeOffset) % 24);
    }, 10000);
    return () => clearInterval(interval);
  }, [timeOffset]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const currentHour = (hour + timeOffset) % 24;
  const activeZones = getActiveZones(currentHour);
  const timeInfo = getTimeLabel(currentHour);

  function handleZoneTap(zone) {
    if (!activeZones.find(z => z.id === zone.id)) return;
    setSelectedZone(zone);
  }

  function handleExplore() {
    if (!selectedZone) return;
    // Tire une créature de la zone
    const pool = selectedZone.creatures;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const creature = { ...CREATURES[id] };
    setEncounter(creature);
    setPhase('encounter');
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }

  function handleCatch() {
    if (!encounter) return;
    addToCollection(encounter);
    setPhase('caught');
  }

  function handleFlee() {
    setPhase('map');
    setEncounter(null);
    setSelectedZone(null);
  }

  const EncounterSprite = encounter ? SPRITES[encounter.id] : null;

  return (
    <LinearGradient colors={['#07090f', '#0d1220', '#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>CARTE MONDE</Text>

        {/* Heure actuelle */}
        <View style={[styles.timeBar, { borderColor: timeInfo.color + '44', backgroundColor: timeInfo.color + '15' }]}>
          <Text style={styles.timeEmoji}>{timeInfo.emoji}</Text>
          <Text style={[styles.timeLabel, { color: timeInfo.color }]}>{timeInfo.label}</Text>
          <Text style={styles.timeHour}>{String(currentHour).padStart(2, '0')}h00</Text>
          {/* Debug: changer l'heure */}
          <TouchableOpacity onPress={() => setTimeOffset(o => (o + 3) % 24)} style={styles.timeBtn}>
            <Text style={styles.timeBtnText}>+3h (debug)</Text>
          </TouchableOpacity>
        </View>

        {phase === 'map' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Carte SVG */}
            <View style={styles.mapContainer}>
              <Svg width={MAP_W} height={MAP_H}>
                {/* Fond carte */}
                <Rect width={MAP_W} height={MAP_H} rx="16" fill="#0a1428" />
                {/* Grille subtile */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <Line key={`h${i}`} x1="0" y1={MAP_H/8*i} x2={MAP_W} y2={MAP_H/8*i} stroke="#ffffff08" strokeWidth="0.5"/>
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                  <Line key={`v${i}`} x1={MAP_W/12*i} y1="0" x2={MAP_W/12*i} y2={MAP_H} stroke="#ffffff08" strokeWidth="0.5"/>
                ))}

                {/* Zones */}
                {ZONES.map(zone => {
                  const active = activeZones.find(z => z.id === zone.id);
                  const sel = selectedZone?.id === zone.id;
                  return (
                    <G key={zone.id}>
                      {/* Glow halo si active */}
                      {active && (
                        <Ellipse
                          cx={zone.x} cy={zone.y}
                          rx={zone.rx * 1.3} ry={zone.ry * 1.3}
                          fill={zone.color} opacity="0.08"
                        />
                      )}
                      <Ellipse
                        cx={zone.x} cy={zone.y}
                        rx={zone.rx} ry={zone.ry}
                        fill={zone.color}
                        opacity={active ? (sel ? 0.35 : 0.18) : 0.06}
                        stroke={zone.color}
                        strokeWidth={sel ? 2 : 1}
                        strokeOpacity={active ? 0.7 : 0.2}
                        onPress={() => handleZoneTap(zone)}
                      />
                      {/* Label */}
                      <Path
                        d={`M ${zone.x} ${zone.y}`}
                        stroke="none" fill="none"
                      />
                    </G>
                  );
                })}
              </Svg>

              {/* Zone labels (overlay) */}
              {ZONES.map(zone => {
                const active = activeZones.find(z => z.id === zone.id);
                return (
                  <TouchableOpacity
                    key={zone.id}
                    onPress={() => handleZoneTap(zone)}
                    style={[
                      styles.zoneLabel,
                      {
                        left: zone.x - 36,
                        top: zone.y - 16,
                        opacity: active ? 1 : 0.3,
                        borderColor: zone.color + (selectedZone?.id === zone.id ? 'cc' : '44'),
                        backgroundColor: zone.color + (selectedZone?.id === zone.id ? '33' : '11'),
                      }
                    ]}
                  >
                    <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Légende zones actives */}
            <View style={styles.legendBox}>
              <Text style={styles.legendTitle}>ZONES ACTIVES MAINTENANT</Text>
              {activeZones.length === 0 && (
                <Text style={styles.legendEmpty}>Aucune zone active à cette heure</Text>
              )}
              {activeZones.map(zone => (
                <TouchableOpacity
                  key={zone.id}
                  onPress={() => setSelectedZone(zone)}
                  style={[
                    styles.legendRow,
                    selectedZone?.id === zone.id && { backgroundColor: zone.color + '18' }
                  ]}
                >
                  <Text style={styles.legendEmoji}>{zone.emoji}</Text>
                  <View style={styles.legendInfo}>
                    <Text style={[styles.legendName, { color: zone.color }]}>{zone.name}</Text>
                    <Text style={styles.legendCreatures}>
                      {zone.creatures.map(id => CREATURES[id].name).join(' · ')}
                    </Text>
                  </View>
                  <View style={[styles.activeDot, { backgroundColor: zone.color }]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Panel zone sélectionnée */}
            {selectedZone && activeZones.find(z => z.id === selectedZone.id) && (
              <LinearGradient
                colors={['#0d1220', '#07090f']}
                style={[styles.zonePanel, { borderColor: selectedZone.color + '44' }]}
              >
                <Text style={[styles.zonePanelName, { color: selectedZone.color }]}>
                  {selectedZone.emoji} {selectedZone.name}
                </Text>
                <View style={styles.zonePanelCreatures}>
                  {selectedZone.creatures.map(id => {
                    const c = CREATURES[id];
                    const Sprite = SPRITES[id];
                    return (
                      <View key={id} style={styles.zonePanelCreature}>
                        <Sprite size={50} />
                        <Text style={[styles.zonePanelCName, { color: c.rarityColor }]}>{c.name}</Text>
                      </View>
                    );
                  })}
                </View>
                <TouchableOpacity onPress={handleExplore} style={styles.exploreBtn}>
                  <LinearGradient
                    colors={[selectedZone.color + '55', selectedZone.color + '22']}
                    style={styles.exploreBtnGrad}
                  >
                    <Text style={[styles.exploreBtnText, { color: selectedZone.color }]}>
                      🔍 Explorer la zone
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </ScrollView>
        )}

        {/* ── Encounter ── */}
        {phase === 'encounter' && encounter && (
          <View style={styles.encounterArea}>
            <Text style={styles.encounterTitle}>Une créature apparaît !</Text>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <EncounterSprite size={140} />
            </Animated.View>
            <Text style={[styles.encounterName, { color: encounter.rarityColor }]}>{encounter.name}</Text>
            <Text style={[styles.encounterRarity, { color: encounter.rarityColor + 'aa' }]}>{encounter.rarityLabel}</Text>
            <View style={styles.encounterBtns}>
              <TouchableOpacity onPress={handleCatch} style={[styles.catchBtn, { borderColor: encounter.rarityColor + '88' }]}>
                <LinearGradient colors={[encounter.rarityColor + '44', encounter.rarityColor + '22']} style={styles.catchBtnGrad}>
                  <Text style={[styles.catchBtnText, { color: encounter.rarityColor }]}>✦ Capturer (3 💎)</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFlee} style={styles.fleeBtn}>
                <Text style={styles.fleeBtnText}>← Fuir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Caught ── */}
        {phase === 'caught' && encounter && (
          <View style={styles.encounterArea}>
            <Text style={styles.caughtTitle}>Capturé !</Text>
            {React.createElement(SPRITES[encounter.id], { size: 130 })}
            <Text style={[styles.encounterName, { color: encounter.rarityColor }]}>{encounter.name}</Text>
            <Text style={styles.caughtDesc}>{encounter.description}</Text>
            <TouchableOpacity
              onPress={() => { setPhase('map'); setEncounter(null); setSelectedZone(null); }}
              style={[styles.catchBtn, { borderColor: '#00e5ff44', marginTop: 16 }]}
            >
              <LinearGradient colors={['#00e5ff22', '#00e5ff11']} style={styles.catchBtnGrad}>
                <Text style={[styles.catchBtnText, { color: '#00e5ff' }]}>↺ Retour à la carte</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 6, textAlign: 'center', paddingTop: 16, marginBottom: 10 },
  timeBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12,
  },
  timeEmoji: { fontSize: 18 },
  timeLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 1, flex: 1 },
  timeHour: { color: '#4a6080', fontSize: 13 },
  timeBtn: { backgroundColor: '#ffffff0a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  timeBtnText: { color: '#4a6080', fontSize: 10 },
  // Map
  mapContainer: { width: MAP_W, height: MAP_H, position: 'relative', marginBottom: 12 },
  zoneLabel: {
    position: 'absolute', width: 36, height: 32,
    borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  zoneEmoji: { fontSize: 16 },
  // Legend
  legendBox: {
    backgroundColor: '#0d1220', borderWidth: 1, borderColor: '#1e2d4a',
    borderRadius: 14, padding: 14, gap: 8, marginBottom: 12,
  },
  legendTitle: { fontSize: 9, color: '#4a6080', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  legendEmpty: { color: '#4a6080', fontSize: 12, fontStyle: 'italic' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 6 },
  legendEmoji: { fontSize: 20 },
  legendInfo: { flex: 1 },
  legendName: { fontSize: 13, fontWeight: '700' },
  legendCreatures: { fontSize: 11, color: '#4a6080' },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  // Zone panel
  zonePanel: {
    borderWidth: 1, borderRadius: 16, padding: 16,
    gap: 12, marginBottom: 20,
  },
  zonePanelName: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  zonePanelCreatures: { flexDirection: 'row', gap: 16 },
  zonePanelCreature: { alignItems: 'center', gap: 4 },
  zonePanelCName: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  exploreBtn: { borderRadius: 12, overflow: 'hidden' },
  exploreBtnGrad: { alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  exploreBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  // Encounter
  encounterArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  encounterTitle: { color: '#00e5ff', fontSize: 14, letterSpacing: 4, textTransform: 'uppercase' },
  encounterName: { fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  encounterRarity: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  encounterBtns: { gap: 10, width: '100%', marginTop: 10 },
  catchBtn: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  catchBtnGrad: { alignItems: 'center', paddingVertical: 14 },
  catchBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  fleeBtn: { alignItems: 'center', padding: 12 },
  fleeBtnText: { color: '#4a6080', fontSize: 13 },
  // Caught
  caughtTitle: { color: '#39ff8f', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  caughtDesc: { color: '#6a84a0', fontSize: 13, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
});

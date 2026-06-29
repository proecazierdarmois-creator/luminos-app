// components/CreatureCard.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Ellipse, Path, Polygon, Circle, Line, G,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

// ─── SVG Créatures ───────────────────────────────────────────────
function LumikosSprite({ size = 90 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      <Ellipse cx="20" cy="72" rx="9" ry="6" fill="#a0d8ef" transform="rotate(-25 20 72)" />
      <Ellipse cx="12" cy="78" rx="6" ry="4" fill="#7ee8fa" />
      <Ellipse cx="8" cy="82" rx="4" ry="4" fill="white" opacity="0.7" />
      <Ellipse cx="58" cy="72" rx="30" ry="26" fill="#a0d8ef" />
      <Ellipse cx="58" cy="76" rx="18" ry="15" fill="#e8f8ff" />
      <Ellipse cx="39" cy="43" rx="8" ry="13" fill="#a0d8ef" transform="rotate(-20 39 43)" />
      <Ellipse cx="40" cy="43" rx="4" ry="8" fill="#7ee8fa" opacity="0.9" transform="rotate(-20 40 43)" />
      <Ellipse cx="77" cy="43" rx="8" ry="13" fill="#a0d8ef" transform="rotate(20 77 43)" />
      <Ellipse cx="76" cy="43" rx="4" ry="8" fill="#7ee8fa" opacity="0.9" transform="rotate(20 76 43)" />
      <Ellipse cx="58" cy="54" rx="25" ry="22" fill="#b8e8f8" />
      <Polygon points="58,39 63,46 58,49 53,46" fill="#7ee8fa" />
      <Polygon points="58,41 61,46 58,48 55,46" fill="white" opacity="0.7" />
      <Ellipse cx="40" cy="59" rx="6" ry="4" fill="#ffb3c6" opacity="0.45" />
      <Ellipse cx="76" cy="59" rx="6" ry="4" fill="#ffb3c6" opacity="0.45" />
      <Ellipse cx="48" cy="53" rx="6" ry="7" fill="#1a2a4a" />
      <Ellipse cx="48" cy="53" rx="4" ry="5" fill="#3a5fa8" />
      <Ellipse cx="48" cy="53" rx="2" ry="2.5" fill="#0a1220" />
      <Ellipse cx="46" cy="51" rx="1.3" ry="1.6" fill="white" opacity="0.9" />
      <Ellipse cx="68" cy="53" rx="6" ry="7" fill="#1a2a4a" />
      <Ellipse cx="68" cy="53" rx="4" ry="5" fill="#3a5fa8" />
      <Ellipse cx="68" cy="53" rx="2" ry="2.5" fill="#0a1220" />
      <Ellipse cx="66" cy="51" rx="1.3" ry="1.6" fill="white" opacity="0.9" />
      <Ellipse cx="58" cy="61" rx="2.5" ry="1.6" fill="#7bbdda" />
      <Path d="M52 65 Q58 70 64 65" stroke="#7bbdda" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Ellipse cx="45" cy="94" rx="9" ry="6" fill="#a0d8ef" />
      <Ellipse cx="71" cy="94" rx="9" ry="6" fill="#a0d8ef" />
    </Svg>
  );
}

function LumivexSprite({ size = 90 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      <Ellipse cx="22" cy="55" rx="18" ry="10" fill="#39ff8f" opacity="0.5" transform="rotate(-15 22 55)" />
      <Ellipse cx="94" cy="55" rx="18" ry="10" fill="#39ff8f" opacity="0.5" transform="rotate(15 94 55)" />
      <Ellipse cx="15" cy="75" rx="12" ry="8" fill="#5cdba0" transform="rotate(-30 15 75)" />
      <Ellipse cx="8" cy="82" rx="9" ry="9" fill="#39ff8f" />
      <Ellipse cx="58" cy="70" rx="28" ry="24" fill="#5cdba0" />
      <Ellipse cx="58" cy="75" rx="17" ry="14" fill="#e0fff4" />
      <Ellipse cx="37" cy="38" rx="8" ry="16" fill="#5cdba0" transform="rotate(-15 37 38)" />
      <Ellipse cx="38" cy="38" rx="4" ry="10" fill="#39ff8f" opacity="0.9" transform="rotate(-15 38 38)" />
      <Ellipse cx="79" cy="38" rx="8" ry="16" fill="#5cdba0" transform="rotate(15 79 38)" />
      <Ellipse cx="78" cy="38" rx="4" ry="10" fill="#39ff8f" opacity="0.9" transform="rotate(15 78 38)" />
      <Ellipse cx="58" cy="52" rx="26" ry="23" fill="#72e0b0" />
      <Polygon points="58,36 65,44 58,48 51,44" fill="#39ff8f" />
      <Polygon points="58,38 63,44 58,47 53,44" fill="white" opacity="0.7" />
      <Ellipse cx="39" cy="57" rx="7" ry="5" fill="#7fffd4" opacity="0.5" />
      <Ellipse cx="77" cy="57" rx="7" ry="5" fill="#7fffd4" opacity="0.5" />
      <Ellipse cx="47" cy="51" rx="7" ry="7.5" fill="#0d2010" />
      <Ellipse cx="47" cy="51" rx="5" ry="5.5" fill="#1a6040" />
      <Ellipse cx="47" cy="51" rx="2.5" ry="3" fill="#0a1208" />
      <Ellipse cx="45" cy="49" rx="1.5" ry="1.8" fill="white" opacity="0.9" />
      <Ellipse cx="69" cy="51" rx="7" ry="7.5" fill="#0d2010" />
      <Ellipse cx="69" cy="51" rx="5" ry="5.5" fill="#1a6040" />
      <Ellipse cx="69" cy="51" rx="2.5" ry="3" fill="#0a1208" />
      <Ellipse cx="67" cy="49" rx="1.5" ry="1.8" fill="white" opacity="0.9" />
      <Ellipse cx="58" cy="60" rx="2.5" ry="1.6" fill="#2a8060" />
      <Path d="M51 64 Q58 70 65 64" stroke="#2a8060" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Ellipse cx="44" cy="90" rx="10" ry="6" fill="#5cdba0" />
      <Ellipse cx="72" cy="90" rx="10" ry="6" fill="#5cdba0" />
    </Svg>
  );
}

function LumirexSprite({ size = 90 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      <Line x1="58" y1="10" x2="58" y2="2" stroke="#ffd700" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <Line x1="74" y1="14" x2="80" y2="8" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <Line x1="42" y1="14" x2="36" y2="8" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <Polygon points="48,32 53,22 58,28 63,22 68,32" fill="#ffd700" />
      <Polygon points="48,32 53,24 58,29 63,24 68,32" fill="#ffe87a" opacity="0.8"/>
      <Ellipse cx="14" cy="72" rx="14" ry="9" fill="#f0b030" transform="rotate(-30 14 72)" />
      <Ellipse cx="8" cy="80" rx="9" ry="9" fill="#ffd700" />
      <Ellipse cx="16" cy="50" rx="22" ry="12" fill="#ffd700" opacity="0.4" transform="rotate(-20 16 50)" />
      <Ellipse cx="100" cy="50" rx="22" ry="12" fill="#ffd700" opacity="0.4" transform="rotate(20 100 50)" />
      <Ellipse cx="58" cy="72" rx="30" ry="25" fill="#e8a820" />
      <Ellipse cx="58" cy="77" rx="19" ry="15" fill="#fff8e0" />
      <Ellipse cx="36" cy="37" rx="9" ry="17" fill="#e8a820" transform="rotate(-15 36 37)" />
      <Ellipse cx="37" cy="37" rx="5" ry="11" fill="#ffd700" opacity="0.9" transform="rotate(-15 37 37)" />
      <Ellipse cx="80" cy="37" rx="9" ry="17" fill="#e8a820" transform="rotate(15 80 37)" />
      <Ellipse cx="79" cy="37" rx="5" ry="11" fill="#ffd700" opacity="0.9" transform="rotate(15 79 37)" />
      <Ellipse cx="58" cy="52" rx="28" ry="25" fill="#f0b830" />
      <Polygon points="58,33 67,44 58,50 49,44" fill="#fff480" />
      <Polygon points="58,35 65,44 58,49 51,44" fill="white" opacity="0.6" />
      <Ellipse cx="37" cy="57" rx="8" ry="6" fill="#ffd070" opacity="0.6" />
      <Ellipse cx="79" cy="57" rx="8" ry="6" fill="#ffd070" opacity="0.6" />
      <Ellipse cx="47" cy="50" rx="7.5" ry="8" fill="#2a1000" />
      <Ellipse cx="47" cy="50" rx="5" ry="5.5" fill="#a06010" />
      <Ellipse cx="47" cy="50" rx="2.5" ry="3" fill="#1a0800" />
      <Ellipse cx="45" cy="48" rx="1.5" ry="1.8" fill="white" opacity="0.9" />
      <Ellipse cx="69" cy="50" rx="7.5" ry="8" fill="#2a1000" />
      <Ellipse cx="69" cy="50" rx="5" ry="5.5" fill="#a06010" />
      <Ellipse cx="69" cy="50" rx="2.5" ry="3" fill="#1a0800" />
      <Ellipse cx="67" cy="48" rx="1.5" ry="1.8" fill="white" opacity="0.9" />
      <Ellipse cx="58" cy="60" rx="3" ry="2" fill="#c07020" />
      <Path d="M50 64 Q58 72 66 64" stroke="#c07020" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Ellipse cx="43" cy="93" rx="11" ry="7" fill="#e8a820" />
      <Ellipse cx="73" cy="93" rx="11" ry="7" fill="#e8a820" />
    </Svg>
  );
}

function LuminosSprite({ size = 90 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      <Circle cx="58" cy="55" r="48" fill="none" stroke="#ffa500" strokeWidth="0.5" opacity="0.3"/>
      <Circle cx="58" cy="55" r="38" fill="none" stroke="#ffd700" strokeWidth="0.8" opacity="0.2"/>
      <Circle cx="20" cy="20" r="2" fill="#ffa500" opacity="0.8"/>
      <Circle cx="96" cy="18" r="1.5" fill="#ffd700" opacity="0.8"/>
      <Circle cx="15" cy="85" r="1.5" fill="#ffa500" opacity="0.7"/>
      <Circle cx="100" cy="80" r="2" fill="#bf5fff" opacity="0.8"/>
      <Ellipse cx="10" cy="50" rx="28" ry="15" fill="#bf5fff" opacity="0.3" transform="rotate(-25 10 50)" />
      <Ellipse cx="10" cy="50" rx="18" ry="10" fill="#ffa500" opacity="0.3" transform="rotate(-25 10 50)" />
      <Ellipse cx="106" cy="50" rx="28" ry="15" fill="#bf5fff" opacity="0.3" transform="rotate(25 106 50)" />
      <Ellipse cx="106" cy="50" rx="18" ry="10" fill="#ffa500" opacity="0.3" transform="rotate(25 106 50)" />
      <Ellipse cx="58" cy="22" rx="26" ry="6" fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.5"/>
      <Polygon points="40,32 46,18 52,26 58,14 64,26 70,18 76,32" fill="#ffa500" />
      <Polygon points="40,32 46,20 52,27 58,16 64,27 70,20 76,32" fill="#ffd700" opacity="0.7"/>
      <Circle cx="52" cy="22" r="2.5" fill="#bf5fff"/>
      <Circle cx="58" cy="16" r="3" fill="white"/>
      <Circle cx="64" cy="22" r="2.5" fill="#bf5fff"/>
      <Ellipse cx="12" cy="70" rx="16" ry="10" fill="#bf5fff" opacity="0.7" transform="rotate(-30 12 70)" />
      <Ellipse cx="6" cy="79" rx="10" ry="10" fill="#ffa500" />
      <Ellipse cx="6" cy="79" rx="14" ry="14" fill="#ffa500" opacity="0.2" />
      <Ellipse cx="58" cy="72" rx="30" ry="25" fill="#4a2a80" />
      <Ellipse cx="58" cy="77" rx="19" ry="15" fill="#1a0a30" />
      <Circle cx="50" cy="70" r="1" fill="#bf5fff" opacity="0.8"/>
      <Circle cx="62" cy="66" r="1.2" fill="#ffd700" opacity="0.7"/>
      <Circle cx="70" cy="74" r="0.8" fill="white" opacity="0.6"/>
      <Ellipse cx="36" cy="37" rx="10" ry="18" fill="#4a2a80" transform="rotate(-15 36 37)" />
      <Ellipse cx="37" cy="37" rx="5" ry="12" fill="#bf5fff" opacity="0.9" transform="rotate(-15 37 37)" />
      <Ellipse cx="80" cy="37" rx="10" ry="18" fill="#4a2a80" transform="rotate(15 80 37)" />
      <Ellipse cx="79" cy="37" rx="5" ry="12" fill="#bf5fff" opacity="0.9" transform="rotate(15 79 37)" />
      <Ellipse cx="58" cy="52" rx="28" ry="25" fill="#5a3490" />
      <Polygon points="58,30 68,44 58,52 48,44" fill="#bf5fff"/>
      <Polygon points="58,32 65,44 58,50 51,44" fill="white" opacity="0.5"/>
      <Ellipse cx="58" cy="41" rx="10" ry="9" fill="#bf5fff" opacity="0.3"/>
      <Ellipse cx="37" cy="57" rx="8" ry="6" fill="#bf5fff" opacity="0.5"/>
      <Ellipse cx="79" cy="57" rx="8" ry="6" fill="#bf5fff" opacity="0.5"/>
      <Ellipse cx="47" cy="50" rx="8" ry="8.5" fill="#10003a"/>
      <Ellipse cx="47" cy="50" rx="5.5" ry="6" fill="#5020a0"/>
      <Ellipse cx="47" cy="50" rx="2.5" ry="3" fill="#0a0018"/>
      <Ellipse cx="45.5" cy="48.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      <Ellipse cx="69" cy="50" rx="8" ry="8.5" fill="#10003a"/>
      <Ellipse cx="69" cy="50" rx="5.5" ry="6" fill="#5020a0"/>
      <Ellipse cx="69" cy="50" rx="2.5" ry="3" fill="#0a0018"/>
      <Ellipse cx="67.5" cy="48.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      <Ellipse cx="58" cy="61" rx="3" ry="2" fill="#8040c0"/>
      <Path d="M50 65 Q58 73 66 65" stroke="#8040c0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <Ellipse cx="43" cy="93" rx="11" ry="7" fill="#4a2a80"/>
      <Ellipse cx="73" cy="93" rx="11" ry="7" fill="#4a2a80"/>
    </Svg>
  );
}


// ─── Sprites Exclusifs ────────────────────────────────────────────

export function AstralisSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Nébuleuse fond */}
      <Circle cx="58" cy="55" r="50" fill="#aaeeff" opacity="0.06"/>
      <Circle cx="58" cy="55" r="38" fill="#80d4ff" opacity="0.05"/>
      {/* Étoiles orbitales */}
      {[0,40,80,120,160,200,240,280,320].map((deg,i)=>{
        const r=deg*Math.PI/180, x=58+42*Math.cos(r), y=55+42*Math.sin(r);
        return <Circle key={i} cx={x} cy={y} r={i%3===0?2.5:1.5} fill={i%2===0?"#aaeeff":"#ffffff"} opacity={0.5+i*0.05}/>;
      })}
      {/* Anneaux cosmiques */}
      <Ellipse cx="58" cy="30" rx="34" ry="10" fill="none" stroke="#80d4ff" strokeWidth="1.5" opacity="0.5"/>
      <Ellipse cx="58" cy="28" rx="26" ry="7" fill="none" stroke="#aaeeff" strokeWidth="1" opacity="0.4"/>
      {/* Ailes cosmiques translucides */}
      <Path d="M28 52 Q4 28 8 6 Q24 22 32 50Z" fill="#204060" opacity="0.7"/>
      <Path d="M30 50 Q10 28 16 8 Q26 24 34 48Z" fill="#aaeeff" opacity="0.2"/>
      <Path d="M88 52 Q112 28 108 6 Q92 22 84 50Z" fill="#204060" opacity="0.7"/>
      <Path d="M86 50 Q106 28 100 8 Q90 24 82 48Z" fill="#aaeeff" opacity="0.2"/>
      {/* Étoiles sur ailes */}
      <Circle cx="20" cy="30" r="2" fill="#aaeeff" opacity="0.7"/>
      <Circle cx="96" cy="28" r="2" fill="#aaeeff" opacity="0.7"/>
      <Circle cx="15" cy="45" r="1.5" fill="#ffffff" opacity="0.6"/>
      <Circle cx="100" cy="42" r="1.5" fill="#ffffff" opacity="0.6"/>
      {/* Queue nébuleuse */}
      <Path d="M18 80 Q6 64 10 48 Q16 62 14 78Z" fill="#102030" opacity="0.9"/>
      <Polygon points="6,50 2,42 10,46" fill="#aaeeff" opacity="0.8"/>
      {/* Corps */}
      <Ellipse cx="58" cy="73" rx="32" ry="26" fill="#102840"/>
      <Ellipse cx="58" cy="77" rx="20" ry="16" fill="#ddf8ff"/>
      {/* Constellation sur corps */}
      <Circle cx="44" cy="70" r="1.5" fill="#aaeeff" opacity="0.8"/>
      <Circle cx="52" cy="65" r="1" fill="#ffffff" opacity="0.7"/>
      <Circle cx="66" cy="68" r="1.5" fill="#aaeeff" opacity="0.8"/>
      <Circle cx="72" cy="74" r="1" fill="#ffffff" opacity="0.6"/>
      <Path d="M44 70 L52 65 L66 68 L72 74" stroke="#aaeeff" strokeWidth="0.5" opacity="0.4"/>
      {/* Couronne étoilée */}
      <Polygon points="44,32 48,16 52,28 58,14 64,28 68,16 72,32" fill="#204060"/>
      <Polygon points="44,32 48,18 52,28 58,16 64,28 68,18 72,32" fill="#aaeeff" opacity="0.5"/>
      <Circle cx="48" cy="20" r="3" fill="#80d4ff"/>
      <Circle cx="58" cy="15" r="4" fill="white" opacity="0.9"/>
      <Circle cx="68" cy="20" r="3" fill="#80d4ff"/>
      {/* Oreilles pointues cosmiques */}
      <Polygon points="38,40 34,18 46,38" fill="#102840"/>
      <Polygon points="40,38 36,20 45,37" fill="#aaeeff" opacity="0.4"/>
      <Polygon points="78,40 82,18 70,38" fill="#102840"/>
      <Polygon points="76,38 80,20 71,37" fill="#aaeeff" opacity="0.4"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="24" fill="#142a3a"/>
      <Ellipse cx="49" cy="44" rx="12" ry="9" fill="#60a8d0" opacity="0.3"/>
      {/* Prisme frontal nébuleuse */}
      <Polygon points="58,32 66,44 58,50 50,44" fill="#aaeeff"/>
      <Polygon points="58,34 64,44 58,49 52,44" fill="white" opacity="0.6"/>
      <Circle cx="58" cy="41" r="5" fill="#aaeeff" opacity="0.4"/>
      {/* Joues */}
      <Ellipse cx="38" cy="57" rx="8" ry="5" fill="#80d4ff" opacity="0.4"/>
      <Ellipse cx="78" cy="57" rx="8" ry="5" fill="#80d4ff" opacity="0.4"/>
      <Circle cx="36" cy="56" r="1.5" fill="white" opacity="0.6"/>
      <Circle cx="80" cy="56" r="1.5" fill="white" opacity="0.6"/>
      {/* Yeux cosmos */}
      <Ellipse cx="47" cy="51" rx="8.5" ry="9" fill="#040818"/>
      <Ellipse cx="47" cy="51" rx="6" ry="6.5" fill="#204870"/>
      <Ellipse cx="47" cy="51" rx="3" ry="3.5" fill="#020408"/>
      <Ellipse cx="45" cy="49" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      <Circle cx="49" cy="53" r="1" fill="#aaeeff" opacity="0.8"/>
      <Ellipse cx="69" cy="51" rx="8.5" ry="9" fill="#040818"/>
      <Ellipse cx="69" cy="51" rx="6" ry="6.5" fill="#204870"/>
      <Ellipse cx="69" cy="51" rx="3" ry="3.5" fill="#020408"/>
      <Ellipse cx="67" cy="49" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      <Ellipse cx="58" cy="62" rx="3" ry="2" fill="#204060"/>
      <Path d="M50 66 Q58 73 66 66" stroke="#204060" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="95" rx="11" ry="6" fill="#102840"/>
      <Ellipse cx="72" cy="95" rx="11" ry="6" fill="#102840"/>
    </Svg>
  );
}

export function PhanterosSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Lune Halloween */}
      <Circle cx="90" cy="18" r="12" fill="#ff6b00" opacity="0.2"/>
      <Circle cx="90" cy="18" r="8" fill="#ff8800" opacity="0.3"/>
      {/* Aura orange-noire */}
      <Circle cx="58" cy="60" r="48" fill="#ff4400" opacity="0.06"/>
      {/* Grandes ailes de chauve-souris */}
      <Path d="M28 52 Q4 30 8 8 Q24 22 32 50Z" fill="#1a0800" opacity="0.95"/>
      <Path d="M26 52 Q6 34 12 12 Q24 26 30 50Z" fill="#ff4400" opacity="0.15"/>
      <Path d="M20 62 Q2 50 6 36 Q14 44 22 60Z" fill="#1a0800" opacity="0.8"/>
      <Path d="M88 52 Q112 30 108 8 Q92 22 84 50Z" fill="#1a0800" opacity="0.95"/>
      <Path d="M90 52 Q110 34 104 12 Q92 26 86 50Z" fill="#ff4400" opacity="0.15"/>
      <Path d="M96 62 Q114 50 110 36 Q102 44 94 60Z" fill="#1a0800" opacity="0.8"/>
      {/* Nervures ailes */}
      <Path d="M28 52 Q18 38 22 18 Q26 32 30 50" stroke="#ff4400" strokeWidth="1" fill="none" opacity="0.5"/>
      <Path d="M20 62 Q10 52 14 40 Q16 50 22 60" stroke="#ff4400" strokeWidth="1" fill="none" opacity="0.4"/>
      {/* Queue fantôme */}
      <Path d="M22 82 Q10 68 14 52 Q20 64 18 80Z" fill="#1a0800" opacity="0.9"/>
      {/* Corps sombre */}
      <Ellipse cx="58" cy="73" rx="33" ry="26" fill="#1a0800"/>
      <Ellipse cx="58" cy="77" rx="21" ry="16" fill="#3a1000"/>
      {/* Rayures citrouille */}
      <Path d="M40 70 Q50 64 60 70 Q70 64 80 70" stroke="#ff4400" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Oreilles pointues chauve-souris */}
      <Polygon points="38,42 30,16 46,40" fill="#1a0800"/>
      <Polygon points="40,40 34,18 44,39" fill="#ff4400" opacity="0.3"/>
      <Polygon points="78,42 86,16 70,40" fill="#1a0800"/>
      <Polygon points="76,40 82,18 72,39" fill="#ff4400" opacity="0.3"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="24" fill="#220a00"/>
      <Ellipse cx="49" cy="43" rx="11" ry="8" fill="#ff4400" opacity="0.15"/>
      {/* Citrouille sur front */}
      <Circle cx="58" cy="38" r="9" fill="#ff6b00"/>
      <Polygon points="52,32 55,28 58,32 61,28 64,32 61,36 55,36" fill="#1a0800" opacity="0.7"/>
      <Circle cx="55" cy="36" r="2" fill="#1a0800"/>
      <Circle cx="61" cy="36" r="2" fill="#1a0800"/>
      <Path d="M54 40 Q58 43 62 40" stroke="#1a0800" strokeWidth="1.5" fill="none"/>
      {/* Joues */}
      <Ellipse cx="38" cy="57" rx="7" ry="5" fill="#ff4400" opacity="0.3"/>
      <Ellipse cx="78" cy="57" rx="7" ry="5" fill="#ff4400" opacity="0.3"/>
      {/* Yeux malveillants */}
      <Polygon points="40,48 48,44 48,54 40,54" fill="#ff6b00"/>
      <Polygon points="42,48 47,45 47,53 42,53" fill="#1a0800"/>
      <Polygon points="68,48 76,44 76,54 68,54" fill="#ff6b00"/>
      <Polygon points="68,48 74,45 74,53 68,53" fill="#1a0800"/>
      <Circle cx="44" cy="49" r="1.5" fill="#ffaa00" opacity="0.9"/>
      <Circle cx="72" cy="49" r="1.5" fill="#ffaa00" opacity="0.9"/>
      {/* Sourire effrayant */}
      <Path d="M46 64 Q50 70 58 66 Q66 70 70 64" stroke="#ff4400" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <Circle cx="50" cy="66" r="1.5" fill="#ff6b00" opacity="0.8"/>
      <Circle cx="66" cy="66" r="1.5" fill="#ff6b00" opacity="0.8"/>
      <Circle cx="58" cy="68" r="1.5" fill="#ff6b00" opacity="0.6"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="95" rx="11" ry="6" fill="#1a0800"/>
      <Ellipse cx="72" cy="95" rx="11" ry="6" fill="#1a0800"/>
    </Svg>
  );
}

export function DrakovyrSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura légendaire rouge sang */}
      <Circle cx="58" cy="55" r="50" fill="#aa0000" opacity="0.1"/>
      <Circle cx="58" cy="55" r="40" fill="#ff2200" opacity="0.06"/>
      {/* Rayons de feu primordial */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i)=>(
        <Path key={i}
          d={`M58 55 L${58+Math.cos(deg*Math.PI/180)*28} ${55+Math.sin(deg*Math.PI/180)*28}`}
          stroke="#ff2200" strokeWidth="1" opacity="0.25"
        />
      ))}
      {/* Immenses ailes draconiques */}
      <Path d="M22 55 Q-2 25 4 2 Q20 18 28 52Z" fill="#660000" opacity="0.95"/>
      <Path d="M24 53 Q4 26 10 4 Q22 20 30 50Z" fill="#ff3300" opacity="0.3"/>
      <Path d="M18 68 Q0 55 4 38 Q12 48 20 65Z" fill="#550000" opacity="0.9"/>
      <Path d="M94 55 Q118 25 112 2 Q96 18 88 52Z" fill="#660000" opacity="0.95"/>
      <Path d="M92 53 Q112 26 106 4 Q94 20 86 50Z" fill="#ff3300" opacity="0.3"/>
      <Path d="M98 68 Q116 55 112 38 Q104 48 96 65Z" fill="#550000" opacity="0.9"/>
      {/* Nervures ailes */}
      {[0.2,0.4,0.6,0.8].map((t,i)=>(
        <Path key={i} d={`M${22+t*10} ${55-t*20} Q${12-t*8} ${42-t*14} ${16-t*8} ${24-t*18}`}
          stroke="#ff4400" strokeWidth="1.2" fill="none" opacity="0.5"/>
      ))}
      {/* Queue massive avec épines */}
      <Path d="M15 80 Q2 62 6 44 Q14 58 12 78Z" fill="#550000" opacity="0.95"/>
      <Polygon points="2,46 -4,38 6,44" fill="#cc0000"/>
      <Polygon points="8,62 2,54 10,58" fill="#cc0000"/>
      <Polygon points="14,72 8,64 16,68" fill="#aa0000"/>
      {/* Corps colossal */}
      <Ellipse cx="58" cy="73" rx="36" ry="28" fill="#440000"/>
      <Ellipse cx="58" cy="77" rx="23" ry="18" fill="#882222"/>
      {/* Écailles sur corps */}
      <Ellipse cx="42" cy="68" rx="9" ry="6" fill="#330000" opacity="0.6" transform="rotate(-15 42 68)"/>
      <Ellipse cx="62" cy="64" rx="9" ry="6" fill="#330000" opacity="0.5" transform="rotate(10 62 64)"/>
      <Ellipse cx="76" cy="72" rx="8" ry="5" fill="#330000" opacity="0.5" transform="rotate(-10 76 72)"/>
      {/* Crête dorsale imposante */}
      <Polygon points="42,28 46,8 50,28" fill="#cc0000"/>
      <Polygon points="49,24 53,4 57,24" fill="#ff2200"/>
      <Polygon points="56,22 60,2 64,22" fill="#ff2200"/>
      <Polygon points="63,24 67,6 71,24" fill="#cc0000"/>
      <Polygon points="70,28 74,10 78,28" fill="#aa0000"/>
      {/* Couronne flammes */}
      <Path d="M42,28 Q46,16 50,24 Q52,10 56,20 Q58,6 62,18 Q64,8 68,20 Q70,14 74,26 Q68,18 62,24 Q58,10 54,22 Q50,14 46,24 Q44,18 42,28Z" fill="#ff4400" opacity="0.8"/>
      {/* Cornes tordues */}
      <Polygon points="36,36 28,10 42,34" fill="#330000"/>
      <Path d="M36 34 Q32 22 30 12" stroke="#ff2200" strokeWidth="2" fill="none" opacity="0.6"/>
      <Polygon points="80,36 88,10 74,34" fill="#330000"/>
      <Path d="M80 34 Q84 22 86 12" stroke="#ff2200" strokeWidth="2" fill="none" opacity="0.6"/>
      {/* Tête draconique */}
      <Ellipse cx="58" cy="51" rx="28" ry="25" fill="#550000"/>
      <Ellipse cx="47" cy="42" rx="12" ry="9" fill="#882222" opacity="0.4"/>
      {/* Gemme sang */}
      <Polygon points="58,28 68,42 58,50 48,42" fill="#cc0000"/>
      <Polygon points="58,30 66,42 58,49 50,42" fill="#ff4444" opacity="0.5"/>
      <Circle cx="58" cy="40" r="5" fill="#ff0000" opacity="0.4"/>
      {/* Narines fumantes */}
      <Circle cx="50" cy="62" r="3" fill="#220000"/>
      <Circle cx="66" cy="62" r="3" fill="#220000"/>
      <Ellipse cx="50" cy="59" rx="3" ry="5" fill="#ff2200" opacity="0.6"/>
      <Ellipse cx="66" cy="59" rx="3" ry="5" fill="#ff2200" opacity="0.6"/>
      {/* Joues */}
      <Ellipse cx="37" cy="57" rx="8" ry="6" fill="#880000" opacity="0.4"/>
      <Ellipse cx="79" cy="57" rx="8" ry="6" fill="#880000" opacity="0.4"/>
      {/* Yeux anciens */}
      <Ellipse cx="46" cy="50" rx="9" ry="9.5" fill="#0a0000"/>
      <Ellipse cx="46" cy="50" rx="6.5" ry="7" fill="#880000"/>
      <Ellipse cx="46" cy="50" rx="3" ry="3.5" fill="#040000"/>
      <Ellipse cx="44" cy="48" rx="2.2" ry="2.5" fill="#ff4444" opacity="0.8"/>
      <Ellipse cx="70" cy="50" rx="9" ry="9.5" fill="#0a0000"/>
      <Ellipse cx="70" cy="50" rx="6.5" ry="7" fill="#880000"/>
      <Ellipse cx="70" cy="50" rx="3" ry="3.5" fill="#040000"/>
      <Ellipse cx="68" cy="48" rx="2.2" ry="2.5" fill="#ff4444" opacity="0.8"/>
      {/* Gueule */}
      <Path d="M46 65 Q58 74 70 65" stroke="#440000" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <Ellipse cx="58" cy="63" rx="7" ry="4" fill="#ff2200" opacity="0.3"/>
      {/* Pieds */}
      <Ellipse cx="42" cy="97" rx="12" ry="7" fill="#440000"/>
      <Ellipse cx="74" cy="97" rx="12" ry="7" fill="#440000"/>
    </Svg>
  );
}

export function FrostaelSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Flocons de neige */}
      {[0,60,120,180,240,300].map((deg,i)=>{
        const r=deg*Math.PI/180, x=58+46*Math.cos(r), y=55+46*Math.sin(r);
        return <Circle key={i} cx={x} cy={y} r={2} fill="white" opacity={0.5}/>;
      })}
      {/* Aura hivernale */}
      <Circle cx="58" cy="55" r="48" fill="#aaddff" opacity="0.07"/>
      {/* Cristaux de neige géants */}
      <Path d="M58 10 L58 22 M52 12 L64 20 M52 20 L64 12" stroke="#aaddff" strokeWidth="2" opacity="0.6"/>
      <Path d="M58 94 L58 106 M52 96 L64 104 M52 104 L64 96" stroke="#aaddff" strokeWidth="2" opacity="0.4"/>
      {/* Grandes ailes enneigées */}
      <Path d="M28 52 Q6 30 10 8 Q26 24 32 50Z" fill="#2255aa" opacity="0.8"/>
      <Path d="M30 50 Q12 30 18 10 Q28 26 34 48Z" fill="#aaddff" opacity="0.3"/>
      <Path d="M88 52 Q110 30 106 8 Q90 24 84 50Z" fill="#2255aa" opacity="0.8"/>
      <Path d="M86 50 Q104 30 98 10 Q88 26 82 48Z" fill="#aaddff" opacity="0.3"/>
      {/* Flocons sur ailes */}
      <Circle cx="18" cy="28" r="3" fill="white" opacity="0.5"/>
      <Circle cx="98" cy="26" r="3" fill="white" opacity="0.5"/>
      <Circle cx="14" cy="44" r="2" fill="#aaddff" opacity="0.6"/>
      <Circle cx="102" cy="42" r="2" fill="#aaddff" opacity="0.6"/>
      {/* Queue cristal givre */}
      <Path d="M18 80 Q6 64 10 48 Q16 62 14 78Z" fill="#1144aa" opacity="0.9"/>
      <Polygon points="6,50 2,42 10,46" fill="white" opacity="0.8"/>
      {/* Corps */}
      <Ellipse cx="58" cy="73" rx="33" ry="26" fill="#1144aa"/>
      <Ellipse cx="58" cy="77" rx="21" ry="16" fill="#eef8ff"/>
      {/* Armure givre */}
      <Ellipse cx="44" cy="68" rx="10" ry="6" fill="#aaddff" opacity="0.3" transform="rotate(-15 44 68)"/>
      <Ellipse cx="72" cy="66" rx="9" ry="6" fill="#aaddff" opacity="0.3" transform="rotate(15 72 66)"/>
      {/* Flocons sur corps */}
      <Circle cx="52" cy="70" r="1.5" fill="white" opacity="0.6"/>
      <Circle cx="64" cy="74" r="1.5" fill="white" opacity="0.5"/>
      <Circle cx="70" cy="68" r="1" fill="#aaddff" opacity="0.7"/>
      {/* Couronne flocon */}
      <Path d="M58 18 L58 30 M50 20 L66 28 M50 28 L66 20" stroke="#aaddff" strokeWidth="2.5" opacity="0.9"/>
      <Circle cx="58" cy="18" r="4" fill="#aaddff"/>
      <Circle cx="50" cy="20" r="3" fill="white" opacity="0.8"/>
      <Circle cx="66" cy="20" r="3" fill="white" opacity="0.8"/>
      <Circle cx="50" cy="28" r="3" fill="white" opacity="0.8"/>
      <Circle cx="66" cy="28" r="3" fill="white" opacity="0.8"/>
      {/* Oreilles arrondies hivernales */}
      <Ellipse cx="38" cy="40" rx="10" ry="14" fill="#1144aa" transform="rotate(-10 38 40)"/>
      <Ellipse cx="39" cy="40" rx="6" ry="9" fill="#aaddff" opacity="0.5" transform="rotate(-10 39 40)"/>
      <Ellipse cx="78" cy="40" rx="10" ry="14" fill="#1144aa" transform="rotate(10 78 40)"/>
      <Ellipse cx="77" cy="40" rx="6" ry="9" fill="#aaddff" opacity="0.5" transform="rotate(10 77 40)"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="24" fill="#1655bb"/>
      <Ellipse cx="48" cy="43" rx="12" ry="9" fill="#66aaee" opacity="0.35"/>
      {/* Flocon frontal */}
      <Path d="M58 34 L58 48 M52 36 L64 46 M52 46 L64 36" stroke="#aaddff" strokeWidth="2" opacity="0.9"/>
      <Circle cx="58" cy="34" r="3.5" fill="white" opacity="0.9"/>
      {/* Joues neigeuses */}
      <Ellipse cx="38" cy="57" rx="8" ry="5" fill="#aaddff" opacity="0.45"/>
      <Ellipse cx="78" cy="57" rx="8" ry="5" fill="#aaddff" opacity="0.45"/>
      <Circle cx="36" cy="56" r="2" fill="white" opacity="0.6"/>
      <Circle cx="80" cy="56" r="2" fill="white" opacity="0.6"/>
      {/* Yeux doux hivernaux */}
      <Ellipse cx="47" cy="51" rx="8.5" ry="9" fill="#001830"/>
      <Ellipse cx="47" cy="51" rx="6" ry="6.5" fill="#1155aa"/>
      <Ellipse cx="47" cy="51" rx="3" ry="3.5" fill="#000c18"/>
      <Ellipse cx="45" cy="49" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      <Circle cx="49" cy="53" r="1" fill="#aaddff" opacity="0.7"/>
      <Ellipse cx="69" cy="51" rx="8.5" ry="9" fill="#001830"/>
      <Ellipse cx="69" cy="51" rx="6" ry="6.5" fill="#1155aa"/>
      <Ellipse cx="69" cy="51" rx="3" ry="3.5" fill="#000c18"/>
      <Ellipse cx="67" cy="49" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      <Ellipse cx="58" cy="62" rx="3" ry="2" fill="#224466"/>
      <Path d="M50 66 Q58 73 66 66" stroke="#224466" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="95" rx="11" ry="6" fill="#1144aa"/>
      <Ellipse cx="72" cy="95" rx="11" ry="6" fill="#1144aa"/>
    </Svg>
  );
}

export function SolaryxSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura solaire */}
      <Circle cx="58" cy="55" r="50" fill="#ffaa00" opacity="0.1"/>
      <Circle cx="58" cy="55" r="38" fill="#ffdd00" opacity="0.06"/>
      {/* Rayons solaires */}
      {[0,22,45,67,90,112,135,157,180,202,225,247,270,292,315,337].map((deg,i)=>(
        <Path key={i}
          d={`M58 55 L${58+Math.cos(deg*Math.PI/180)*50} ${55+Math.sin(deg*Math.PI/180)*50}`}
          stroke="#ffaa00" strokeWidth={i%2===0?1.5:0.8} opacity={i%4===0?0.4:0.2}
        />
      ))}
      {/* Grandes ailes de phénix */}
      <Path d="M24 52 Q2 22 8 2 Q24 18 30 50Z" fill="#aa4400" opacity="0.9"/>
      <Path d="M26 50 Q8 24 14 4 Q26 20 32 48Z" fill="#ff6600" opacity="0.4"/>
      <Path d="M18 65 Q0 52 4 36 Q12 46 20 62Z" fill="#882200" opacity="0.85"/>
      <Path d="M10 80 Q-2 68 4 55 Q10 64 12 76Z" fill="#661100" opacity="0.7"/>
      <Path d="M92 52 Q114 22 108 2 Q92 18 86 50Z" fill="#aa4400" opacity="0.9"/>
      <Path d="M90 50 Q108 24 102 4 Q90 20 84 48Z" fill="#ff6600" opacity="0.4"/>
      <Path d="M98 65 Q116 52 112 36 Q104 46 96 62Z" fill="#882200" opacity="0.85"/>
      <Path d="M106 80 Q118 68 112 55 Q106 64 104 76Z" fill="#661100" opacity="0.7"/>
      {/* Plumes de feu sur ailes */}
      <Circle cx="16" cy="28" r="3" fill="#ffaa00" opacity="0.6"/>
      <Circle cx="10" cy="44" r="2.5" fill="#ffcc00" opacity="0.5"/>
      <Circle cx="100" cy="26" r="3" fill="#ffaa00" opacity="0.6"/>
      <Circle cx="106" cy="42" r="2.5" fill="#ffcc00" opacity="0.5"/>
      {/* Queue phénix flamboyante */}
      <Path d="M15 80 Q2 62 6 44 Q14 58 12 78Z" fill="#880000" opacity="0.95"/>
      <Polygon points="2,46 -4,38 6,44" fill="#ffaa00"/>
      <Polygon points="8,60 2,52 10,56" fill="#ff6600"/>
      <Polygon points="14,72 8,64 14,68" fill="#ffaa00" opacity="0.8"/>
      {/* Corps doré */}
      <Ellipse cx="58" cy="72" rx="34" ry="27" fill="#882200"/>
      <Ellipse cx="58" cy="76" rx="22" ry="17" fill="#ffcc66"/>
      {/* Écailles solaires */}
      <Ellipse cx="44" cy="68" rx="10" ry="6" fill="#cc4400" opacity="0.5" transform="rotate(-15 44 68)"/>
      <Ellipse cx="66" cy="64" rx="10" ry="6" fill="#cc4400" opacity="0.4" transform="rotate(12 66 64)"/>
      <Ellipse cx="78" cy="72" rx="8" ry="5" fill="#cc4400" opacity="0.4"/>
      {/* Couronne phénix */}
      <Path d="M38,30 Q42,14 46,22 Q48,8 52,18 Q54,4 58,14 Q62,4 66,16 Q68,6 72,18 Q76,14 80,28 Q72,18 66,22 Q62,8 58,16 Q54,8 52,20 Q48,10 44,20 Q40,16 38,30Z" fill="#ff6600" opacity="0.9"/>
      <Path d="M38,30 Q42,16 46,23 Q48,10 52,19" stroke="#ffdd00" strokeWidth="1.5" fill="none" opacity="0.7"/>
      {/* Crête phénix */}
      <Polygon points="44,30 48,10 52,30" fill="#ff4400"/>
      <Polygon points="51,28 55,8 59,28" fill="#ffaa00"/>
      <Polygon points="58,28 62,8 66,28" fill="#ff4400"/>
      <Polygon points="65,30 69,12 73,30" fill="#ff4400" opacity="0.8"/>
      {/* Oreilles feu */}
      <Polygon points="36,38 28,12 44,36" fill="#660000"/>
      <Polygon points="38,36 32,14 42,35" fill="#ff6600" opacity="0.4"/>
      <Polygon points="80,38 88,12 72,36" fill="#660000"/>
      <Polygon points="78,36 84,14 74,35" fill="#ff6600" opacity="0.4"/>
      {/* Tête */}
      <Ellipse cx="58" cy="51" rx="28" ry="25" fill="#aa3300"/>
      <Ellipse cx="47" cy="42" rx="12" ry="9" fill="#ff7744" opacity="0.35"/>
      {/* Soleil frontal */}
      <Circle cx="58" cy="38" r="8" fill="#ffaa00"/>
      {[0,45,90,135,180,225,270,315].map((deg,i)=>(
        <Path key={i}
          d={`M${58+Math.cos(deg*Math.PI/180)*8} ${38+Math.sin(deg*Math.PI/180)*8} L${58+Math.cos(deg*Math.PI/180)*13} ${38+Math.sin(deg*Math.PI/180)*13}`}
          stroke="#ffdd00" strokeWidth="2" opacity="0.8"
        />
      ))}
      <Circle cx="58" cy="38" r="5" fill="#ffdd44"/>
      <Circle cx="58" cy="38" r="2.5" fill="white" opacity="0.9"/>
      {/* Joues dorées */}
      <Ellipse cx="37" cy="57" rx="8" ry="5" fill="#ffaa00" opacity="0.4"/>
      <Ellipse cx="79" cy="57" rx="8" ry="5" fill="#ffaa00" opacity="0.4"/>
      <Circle cx="35" cy="56" r="2" fill="#ffdd00" opacity="0.7"/>
      <Circle cx="81" cy="56" r="2" fill="#ffdd00" opacity="0.7"/>
      {/* Yeux phénix */}
      <Ellipse cx="46" cy="50" rx="9" ry="9.5" fill="#100000"/>
      <Ellipse cx="46" cy="50" rx="6.5" ry="7" fill="#cc4400"/>
      <Ellipse cx="46" cy="50" rx="3.2" ry="3.8" fill="#050000"/>
      <Ellipse cx="44" cy="48" rx="2.2" ry="2.5" fill="#ffdd00" opacity="0.9"/>
      <Circle cx="48" cy="52" r="1" fill="#ff6600" opacity="0.7"/>
      <Ellipse cx="70" cy="50" rx="9" ry="9.5" fill="#100000"/>
      <Ellipse cx="70" cy="50" rx="6.5" ry="7" fill="#cc4400"/>
      <Ellipse cx="70" cy="50" rx="3.2" ry="3.8" fill="#050000"/>
      <Ellipse cx="68" cy="48" rx="2.2" ry="2.5" fill="#ffdd00" opacity="0.9"/>
      {/* Bouche */}
      <Path d="M48 65 Q58 73 68 65" stroke="#660000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <Ellipse cx="58" cy="63" rx="5" ry="3" fill="#ff6600" opacity="0.3"/>
      {/* Pieds */}
      <Ellipse cx="42" cy="97" rx="12" ry="7" fill="#882200"/>
      <Ellipse cx="74" cy="97" rx="12" ry="7" fill="#882200"/>
    </Svg>
  );
}

export const SPRITES = {
  lumikos:   LumikosSprite,
  lumivex:   LumivexSprite,
  lumirex:   LumirexSprite,
  luminos:   LuminosSprite,
  pyrox:     PyroxSprite,
  pyrax:     PyraxSprite,
  pyralord:  PyralordSprite,
  aquilon:   AquilonSprite,
  aquarex:   AquarexSprite,
  floriva:   FlorivaSprite,
  glacirath: GlacirathSprite,
  voltaris:  VoltarisSprite,
  aquila:    AquilaSprite,
  terrak:    TerrakSprite,
  ventis:    VentisSprite,
  umbrax:    UmbraxSprite,
  florix:    FlorixSprite,
  glacix:    GlacixSprite,
  voltrax:   VoltraxSprite,
  spectrox:  SpectroxSprite,
  bouldrak:  BouldrakSprite,
  pyraflor:  PyraflorSprite,
  aquafrost: AquafrostSprite,
  thornix:   ThornixSprite,
  stormyx:   StormyxSprite,
  crystara:  CrystaraSprite,
  astralis:  AstralisSprite,
  phanteros: PhanterosSprite,
  drakovyr:  DrakovyrSprite,
  frostael:  FrostaelSprite,
  solaryx:   SolaryxSprite,
};

// ─── CreatureCard ─────────────────────────────────────────────────
export default function CreatureCard({ creature, size = 'medium', style }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const Sprite = SPRITES[creature.id] || LumikosSprite;
  const spriteSize = size === 'large' ? 120 : size === 'small' ? 60 : 90;
  const cardW = size === 'large' ? width - 48 : size === 'small' ? 140 : 160;

  return (
    <LinearGradient
      colors={creature.bgGradient}
      style={[styles.card, { width: cardW, borderColor: creature.rarityColor + '44' }, style]}
    >
      {/* rarity badge */}
      <View style={[styles.rarityBadge, { borderColor: creature.rarityColor + '66', backgroundColor: creature.rarityColor + '18' }]}>
        <Text style={[styles.rarityText, { color: creature.rarityColor }]}>{creature.rarityLabel}</Text>
      </View>

      {/* number */}
      <Text style={styles.number}>{creature.number}</Text>

      {/* sprite */}
      <Animated.View style={{ transform: [{ translateY: floatAnim }], marginVertical: 8 }}>
        <Sprite size={spriteSize} />
      </Animated.View>

      {/* name */}
      <Text style={styles.name}>{creature.name}</Text>
      <Text style={styles.jp}>{creature.jp}</Text>

      {/* type */}
      <View style={[styles.typeBadge, { borderColor: creature.rarityColor + '55', backgroundColor: creature.rarityColor + '15' }]}>
        <Text style={[styles.typeText, { color: creature.rarityColor }]}>{creature.type}</Text>
      </View>

      {/* stats */}
      {size !== 'small' && (
        <View style={styles.statsRow}>
          <StatPill label="PV"  value={creature.stats.hp}  color="#39ff8f" />
          <StatPill label="ATK" value={creature.stats.atk} color="#ff4fa3" />
          <StatPill label="VIT" value={creature.stats.spd} color="#ffd700" />
        </View>
      )}
    </LinearGradient>
  );
}

function StatPill({ label, value, color }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statLabel, { color: color + 'aa' }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  rarityBadge: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  rarityText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  number: { fontSize: 10, color: '#4a6080', letterSpacing: 1, alignSelf: 'flex-start' },
  name: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 2, marginTop: 2 },
  jp: { fontSize: 11, color: '#4a6080', letterSpacing: 3, marginBottom: 4 },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginVertical: 6,
  },
  typeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  statPill: { alignItems: 'center', backgroundColor: '#ffffff08', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: 14, fontWeight: '900' },
});

// ─── Nouveaux sprites ─────────────────────────────────────────────

export function PyroxSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Queue pointue */}
      <Polygon points="15,85 25,70 20,95" fill="#ff6b35"/>
      <Polygon points="18,82 25,70 22,90" fill="#ffa500" opacity="0.7"/>
      {/* Corps trappu */}
      <Ellipse cx="62" cy="74" rx="32" ry="26" fill="#cc4420"/>
      <Ellipse cx="62" cy="78" rx="20" ry="16" fill="#ff8855"/>
      {/* Ailes de dragon repliées */}
      <Ellipse cx="34" cy="60" rx="14" ry="8" fill="#aa3310" transform="rotate(-30 34 60)" opacity="0.8"/>
      <Ellipse cx="90" cy="60" rx="14" ry="8" fill="#aa3310" transform="rotate(30 90 60)" opacity="0.8"/>
      {/* Cornes */}
      <Polygon points="48,34 44,18 52,32" fill="#ff4400"/>
      <Polygon points="72,34 76,18 68,32" fill="#ff4400"/>
      {/* Tête */}
      <Ellipse cx="60" cy="52" rx="26" ry="22" fill="#dd5530"/>
      <Ellipse cx="52" cy="44" rx="10" ry="8" fill="#ff7755" opacity="0.5"/>
      {/* Crête dos */}
      <Polygon points="52,36 55,26 58,36" fill="#ff4400" opacity="0.9"/>
      <Polygon points="58,34 61,24 64,34" fill="#ff4400" opacity="0.9"/>
      <Polygon points="64,36 67,27 70,36" fill="#ff4400" opacity="0.8"/>
      {/* Yeux */}
      <Ellipse cx="50" cy="50" rx="7" ry="7" fill="#1a0800"/>
      <Ellipse cx="50" cy="50" rx="4.5" ry="5" fill="#ff2200"/>
      <Ellipse cx="50" cy="50" rx="2" ry="2.5" fill="#0a0000"/>
      <Ellipse cx="48.5" cy="48.5" rx="1.3" ry="1.5" fill="white" opacity="0.9"/>
      <Ellipse cx="70" cy="50" rx="7" ry="7" fill="#1a0800"/>
      <Ellipse cx="70" cy="50" rx="4.5" ry="5" fill="#ff2200"/>
      <Ellipse cx="70" cy="50" rx="2" ry="2.5" fill="#0a0000"/>
      <Ellipse cx="68.5" cy="48.5" rx="1.3" ry="1.5" fill="white" opacity="0.9"/>
      {/* Narines avec flamme */}
      <Circle cx="54" cy="60" r="2" fill="#330800"/>
      <Circle cx="66" cy="60" r="2" fill="#330800"/>
      <Ellipse cx="54" cy="57" rx="2" ry="3" fill="#ffa500" opacity="0.7"/>
      <Ellipse cx="66" cy="57" rx="2" ry="3" fill="#ffa500" opacity="0.7"/>
      {/* Bouche féroce */}
      <Path d="M50 65 Q60 72 70 65" stroke="#aa2200" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Pieds griffus */}
      <Ellipse cx="44" cy="96" rx="10" ry="6" fill="#cc4420"/>
      <Polygon points="38,93 36,100 40,93" fill="#ff4400"/>
      <Polygon points="42,94 40,101 44,94" fill="#ff4400"/>
      <Ellipse cx="76" cy="96" rx="10" ry="6" fill="#cc4420"/>
      <Polygon points="72,93 70,100 74,93" fill="#ff4400"/>
      <Polygon points="78,94 76,101 80,94" fill="#ff4400"/>
    </Svg>
  );
}

export function AquilaSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Queue en tourbillon */}
      <Path d="M20 85 Q10 70 20 60 Q30 50 20 40" stroke="#00aaff" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6"/>
      <Path d="M20 85 Q12 70 20 60 Q28 50 20 40" stroke="#80d4ff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8"/>
      {/* Bulles d'eau */}
      <Circle cx="30" cy="30" r="5" fill="#00aaff" opacity="0.3"/>
      <Circle cx="85" cy="25" r="4" fill="#80d4ff" opacity="0.3"/>
      <Circle cx="90" cy="70" r="3" fill="#00aaff" opacity="0.3"/>
      {/* Corps arrondi */}
      <Ellipse cx="62" cy="74" rx="30" ry="25" fill="#0077cc"/>
      <Ellipse cx="62" cy="78" rx="20" ry="16" fill="#aaeeff"/>
      <Ellipse cx="52" cy="66" rx="12" ry="9" fill="#55bbff" opacity="0.4"/>
      {/* Nageoires latérales */}
      <Ellipse cx="34" cy="68" rx="16" ry="8" fill="#0055aa" transform="rotate(-20 34 68)" opacity="0.7"/>
      <Ellipse cx="90" cy="68" rx="16" ry="8" fill="#0055aa" transform="rotate(20 90 68)" opacity="0.7"/>
      {/* Oreilles rondes */}
      <Ellipse cx="40" cy="40" rx="9" ry="12" fill="#0077cc" transform="rotate(-10 40 40)"/>
      <Ellipse cx="41" cy="40" rx="5" ry="8" fill="#55bbff" opacity="0.8" transform="rotate(-10 41 40)"/>
      <Ellipse cx="80" cy="40" rx="9" ry="12" fill="#0077cc" transform="rotate(10 80 40)"/>
      <Ellipse cx="79" cy="40" rx="5" ry="8" fill="#55bbff" opacity="0.8" transform="rotate(10 79 40)"/>
      {/* Tête */}
      <Ellipse cx="60" cy="52" rx="27" ry="24" fill="#0088dd"/>
      <Ellipse cx="50" cy="43" rx="12" ry="9" fill="#55bbff" opacity="0.4"/>
      {/* Gemme eau */}
      <Ellipse cx="60" cy="38" rx="6" ry="8" fill="#00ddff"/>
      <Ellipse cx="60" cy="38" rx="3" ry="5" fill="white" opacity="0.6"/>
      {/* Joues */}
      <Ellipse cx="40" cy="57" rx="7" ry="5" fill="#80d4ff" opacity="0.5"/>
      <Ellipse cx="80" cy="57" rx="7" ry="5" fill="#80d4ff" opacity="0.5"/>
      {/* Yeux grands doux */}
      <Ellipse cx="49" cy="51" rx="8" ry="9" fill="#001830"/>
      <Ellipse cx="49" cy="51" rx="5.5" ry="6.5" fill="#0044aa"/>
      <Ellipse cx="49" cy="51" rx="2.5" ry="3" fill="#001020"/>
      <Ellipse cx="47" cy="49" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      <Circle cx="51" cy="53" r="1" fill="white" opacity="0.5"/>
      <Ellipse cx="71" cy="51" rx="8" ry="9" fill="#001830"/>
      <Ellipse cx="71" cy="51" rx="5.5" ry="6.5" fill="#0044aa"/>
      <Ellipse cx="71" cy="51" rx="2.5" ry="3" fill="#001020"/>
      <Ellipse cx="69" cy="49" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      {/* Nez + bouche mignonne */}
      <Ellipse cx="60" cy="61" rx="3" ry="2" fill="#005588"/>
      <Path d="M53 66 Q60 72 67 66" stroke="#005588" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Pieds palmés */}
      <Ellipse cx="46" cy="95" rx="10" ry="6" fill="#0077cc"/>
      <Ellipse cx="74" cy="95" rx="10" ry="6" fill="#0077cc"/>
    </Svg>
  );
}

export function TerrakSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle, Rect } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Cristaux sur le dos */}
      <Polygon points="48,28 52,14 56,28" fill="#e8c870" opacity="0.9"/>
      <Polygon points="54,26 58,10 62,26" fill="#ffd700" opacity="0.9"/>
      <Polygon points="60,28 64,15 68,28" fill="#e8c870" opacity="0.9"/>
      <Polygon points="40,32 43,20 46,32" fill="#c8a850" opacity="0.8"/>
      <Polygon points="66,32 69,20 72,32" fill="#c8a850" opacity="0.8"/>
      {/* Corps massif et trapu */}
      <Ellipse cx="58" cy="76" rx="36" ry="28" fill="#7a5c20"/>
      <Ellipse cx="58" cy="80" rx="24" ry="18" fill="#c8a060"/>
      <Ellipse cx="48" cy="68" rx="14" ry="10" fill="#9a7c40" opacity="0.4"/>
      {/* Texture rocher */}
      <Circle cx="44" cy="72" r="3" fill="#6a4c10" opacity="0.5"/>
      <Circle cx="70" cy="68" r="4" fill="#6a4c10" opacity="0.4"/>
      <Circle cx="58" cy="84" r="3" fill="#6a4c10" opacity="0.3"/>
      {/* Bras courts et trapus */}
      <Ellipse cx="24" cy="74" rx="12" ry="9" fill="#7a5c20" transform="rotate(20 24 74)"/>
      <Ellipse cx="92" cy="74" rx="12" ry="9" fill="#7a5c20" transform="rotate(-20 92 74)"/>
      {/* Griffes */}
      <Polygon points="16,76 12,82 18,77" fill="#c8a850"/>
      <Polygon points="20,80 16,86 22,81" fill="#c8a850"/>
      <Polygon points="96,76 100,82 94,77" fill="#c8a850"/>
      <Polygon points="100,80 104,86 98,81" fill="#c8a850"/>
      {/* Tête carrée */}
      <Ellipse cx="58" cy="54" rx="28" ry="24" fill="#8a6c30"/>
      <Ellipse cx="48" cy="46" rx="12" ry="9" fill="#aa8c50" opacity="0.4"/>
      {/* Cristaux sur la tête */}
      <Polygon points="52,36 55,26 58,36" fill="#ffd700" opacity="0.8"/>
      <Polygon points="58,34 61,24 64,34" fill="#e8c870" opacity="0.8"/>
      {/* Sourcils froncés */}
      <Path d="M43 44 L53 48" stroke="#4a3010" strokeWidth="3" strokeLinecap="round"/>
      <Path d="M67 44 L57 48" stroke="#4a3010" strokeWidth="3" strokeLinecap="round"/>
      {/* Yeux petits et durs */}
      <Ellipse cx="49" cy="52" rx="6" ry="6" fill="#1a1000"/>
      <Ellipse cx="49" cy="52" rx="4" ry="4" fill="#8a6000"/>
      <Ellipse cx="49" cy="52" rx="2" ry="2" fill="#0a0800"/>
      <Ellipse cx="47.5" cy="50.5" rx="1.2" ry="1.4" fill="white" opacity="0.9"/>
      <Ellipse cx="69" cy="52" rx="6" ry="6" fill="#1a1000"/>
      <Ellipse cx="69" cy="52" rx="4" ry="4" fill="#8a6000"/>
      <Ellipse cx="69" cy="52" rx="2" ry="2" fill="#0a0800"/>
      <Ellipse cx="67.5" cy="50.5" rx="1.2" ry="1.4" fill="white" opacity="0.9"/>
      {/* Nez large */}
      <Ellipse cx="58" cy="61" rx="5" ry="3" fill="#5a3c10"/>
      <Circle cx="55" cy="61" r="2" fill="#3a2000"/>
      <Circle cx="61" cy="61" r="2" fill="#3a2000"/>
      {/* Bouche sérieuse */}
      <Path d="M50 67 Q58 64 66 67" stroke="#4a3010" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Pieds larges */}
      <Ellipse cx="42" cy="98" rx="13" ry="7" fill="#7a5c20"/>
      <Ellipse cx="74" cy="98" rx="13" ry="7" fill="#7a5c20"/>
    </Svg>
  );
}

export function VentisSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Traînes de vent */}
      <Path d="M15 55 Q25 40 35 55 Q45 70 55 55" stroke="#a0c8ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4"/>
      <Path d="M95 45 Q85 30 75 45 Q65 60 55 45" stroke="#e0f0ff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>
      <Path d="M20 80 Q35 65 50 80" stroke="#a0c8ff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3"/>
      {/* Grandes ailes effilées */}
      <Path d="M38 58 Q15 35 10 20 Q25 30 38 55" fill="#6090cc" opacity="0.6"/>
      <Path d="M38 58 Q20 38 18 25 Q30 35 40 55" fill="#a0c8ff" opacity="0.4"/>
      <Path d="M78 58 Q95 35 100 20 Q85 30 78 55" fill="#6090cc" opacity="0.6"/>
      <Path d="M78 58 Q90 38 92 25 Q80 35 76 55" fill="#a0c8ff" opacity="0.4"/>
      {/* Corps svelte */}
      <Ellipse cx="58" cy="72" rx="26" ry="22" fill="#4070aa"/>
      <Ellipse cx="58" cy="76" rx="16" ry="14" fill="#c0d8f0"/>
      <Ellipse cx="50" cy="64" rx="10" ry="8" fill="#80a8d8" opacity="0.4"/>
      {/* Queue tourbillon */}
      <Path d="M30 88 Q20 78 25 68 Q30 58 25 50" stroke="#a0c8ff" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.5"/>
      <Path d="M30 88 Q22 78 26 68 Q30 60 26 52" stroke="#e0f0ff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7"/>
      {/* Oreilles pointues */}
      <Polygon points="42,38 38,20 48,36" fill="#4070aa"/>
      <Polygon points="43,36 40,22 47,35" fill="#a0c8ff" opacity="0.7"/>
      <Polygon points="74,38 78,20 68,36" fill="#4070aa"/>
      <Polygon points="73,36 76,22 69,35" fill="#a0c8ff" opacity="0.7"/>
      {/* Tête allongée */}
      <Ellipse cx="58" cy="52" rx="24" ry="22" fill="#5080bb"/>
      <Ellipse cx="50" cy="44" rx="10" ry="8" fill="#80a8d8" opacity="0.4"/>
      {/* Marquage de vent sur front */}
      <Path d="M48 40 Q55 35 62 40 Q56 38 50 42" stroke="#e0f0ff" strokeWidth="1.5" fill="none" opacity="0.8"/>
      {/* Yeux perçants */}
      <Ellipse cx="48" cy="51" rx="7.5" ry="7" fill="#101828"/>
      <Ellipse cx="48" cy="51" rx="5" ry="5" fill="#2050a0"/>
      <Ellipse cx="48" cy="51" rx="2.2" ry="2.5" fill="#080f18"/>
      <Ellipse cx="46.5" cy="49.5" rx="1.5" ry="1.8" fill="white" opacity="0.95"/>
      <Ellipse cx="68" cy="51" rx="7.5" ry="7" fill="#101828"/>
      <Ellipse cx="68" cy="51" rx="5" ry="5" fill="#2050a0"/>
      <Ellipse cx="68" cy="51" rx="2.2" ry="2.5" fill="#080f18"/>
      <Ellipse cx="66.5" cy="49.5" rx="1.5" ry="1.8" fill="white" opacity="0.95"/>
      {/* Nez fin */}
      <Ellipse cx="58" cy="60" rx="2.5" ry="1.5" fill="#304870"/>
      {/* Sourire malicieux */}
      <Path d="M51 64 Q58 70 65 64" stroke="#304870" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Pieds légers */}
      <Ellipse cx="46" cy="92" rx="9" ry="5" fill="#4070aa"/>
      <Ellipse cx="70" cy="92" rx="9" ry="5" fill="#4070aa"/>
    </Svg>
  );
}

export function UmbraxSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura d'ombre */}
      <Circle cx="58" cy="60" r="50" fill="#8844cc" opacity="0.06"/>
      <Circle cx="58" cy="60" r="42" fill="#6622aa" opacity="0.08"/>
      {/* Tentacules d'ombre */}
      <Path d="M20 80 Q10 65 18 50 Q22 60 20 80" fill="#440088" opacity="0.7"/>
      <Path d="M96 78 Q106 63 98 48 Q94 58 96 78" fill="#440088" opacity="0.7"/>
      <Path d="M28 95 Q18 82 22 70" stroke="#6622aa" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6"/>
      <Path d="M88 95 Q98 82 94 70" stroke="#6622aa" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* Queue fantôme */}
      <Path d="M25 88 Q15 72 22 58 Q28 68 25 88" fill="#550099" opacity="0.8"/>
      <Path d="M26 86 Q18 72 23 60 Q27 68 26 86" fill="#aa44ff" opacity="0.4"/>
      {/* Corps fantomatique */}
      <Ellipse cx="58" cy="74" rx="32" ry="26" fill="#330066"/>
      <Ellipse cx="58" cy="78" rx="20" ry="16" fill="#110022"/>
      {/* Étoiles sur corps */}
      <Circle cx="48" cy="72" r="1.2" fill="#cc88ff" opacity="0.8"/>
      <Circle cx="64" cy="68" r="1" fill="#aa66ff" opacity="0.7"/>
      <Circle cx="70" cy="76" r="0.8" fill="#cc88ff" opacity="0.6"/>
      <Circle cx="50" cy="80" r="1" fill="#ffffff" opacity="0.5"/>
      {/* Ailes d'ombre */}
      <Path d="M30 62 Q12 42 15 25 Q28 38 34 60" fill="#550099" opacity="0.7"/>
      <Path d="M32 60 Q16 42 20 28 Q30 40 36 58" fill="#8844cc" opacity="0.4"/>
      <Path d="M86 62 Q104 42 101 25 Q88 38 82 60" fill="#550099" opacity="0.7"/>
      <Path d="M84 60 Q100 42 96 28 Q86 40 80 58" fill="#8844cc" opacity="0.4"/>
      {/* Oreilles déchirées */}
      <Polygon points="38,38 32,18 46,35" fill="#440088"/>
      <Polygon points="40,36 36,20 45,34" fill="#8844cc" opacity="0.5"/>
      <Polygon points="78,38 84,18 70,35" fill="#440088"/>
      <Polygon points="76,36 80,20 71,34" fill="#8844cc" opacity="0.5"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="24" fill="#441188"/>
      <Ellipse cx="49" cy="44" rx="11" ry="8" fill="#6633aa" opacity="0.3"/>
      {/* Gemme du néant */}
      <Polygon points="58,32 66,44 58,50 50,44" fill="#110022"/>
      <Polygon points="58,34 64,44 58,49 52,44" fill="#8844cc" opacity="0.6"/>
      <Circle cx="58" cy="41" r="5" fill="#cc88ff" opacity="0.3"/>
      {/* Joues violettes */}
      <Ellipse cx="38" cy="57" rx="8" ry="5" fill="#8844cc" opacity="0.4"/>
      <Ellipse cx="78" cy="57" rx="8" ry="5" fill="#8844cc" opacity="0.4"/>
      {/* Yeux vides et intenses */}
      <Ellipse cx="47" cy="51" rx="8.5" ry="9" fill="#08000f"/>
      <Ellipse cx="47" cy="51" rx="6" ry="6.5" fill="#6622aa"/>
      <Ellipse cx="47" cy="51" rx="3" ry="3.5" fill="#020005"/>
      <Ellipse cx="45" cy="49" rx="2" ry="2.2" fill="#cc88ff" opacity="0.9"/>
      <Circle cx="49" cy="53" r="0.8" fill="#8844cc" opacity="0.6"/>
      <Ellipse cx="69" cy="51" rx="8.5" ry="9" fill="#08000f"/>
      <Ellipse cx="69" cy="51" rx="6" ry="6.5" fill="#6622aa"/>
      <Ellipse cx="69" cy="51" rx="3" ry="3.5" fill="#020005"/>
      <Ellipse cx="67" cy="49" rx="2" ry="2.2" fill="#cc88ff" opacity="0.9"/>
      {/* Sourire mystérieux */}
      <Path d="M50 64 Q58 72 66 64" stroke="#6622aa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <Circle cx="52" cy="65" r="1" fill="#aa66ff" opacity="0.6"/>
      <Circle cx="64" cy="65" r="1" fill="#aa66ff" opacity="0.6"/>
      {/* Pieds fantômes */}
      <Ellipse cx="44" cy="96" rx="11" ry="6" fill="#330066" opacity="0.8"/>
      <Ellipse cx="72" cy="96" rx="11" ry="6" fill="#330066" opacity="0.8"/>
    </Svg>
  );
}

// ─── Sprites V9 ───────────────────────────────────────────────────

export function FlorixSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle, Polygon } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Feuilles-oreilles */}
      <Ellipse cx="36" cy="35" rx="10" ry="18" fill="#4a9020" transform="rotate(-25 36 35)"/>
      <Ellipse cx="37" cy="35" rx="5" ry="12" fill="#76c442" opacity="0.9" transform="rotate(-25 37 35)"/>
      <Path d="M36 35 Q33 22 38 18" stroke="#76c442" strokeWidth="1.5" fill="none"/>
      <Ellipse cx="80" cy="35" rx="10" ry="18" fill="#4a9020" transform="rotate(25 80 35)"/>
      <Ellipse cx="79" cy="35" rx="5" ry="12" fill="#76c442" opacity="0.9" transform="rotate(25 79 35)"/>
      <Path d="M80 35 Q83 22 78 18" stroke="#76c442" strokeWidth="1.5" fill="none"/>
      {/* Queue feuille */}
      <Ellipse cx="18" cy="80" rx="12" ry="7" fill="#4a9020" transform="rotate(-30 18 80)"/>
      <Path d="M18 80 Q10 72 14 65" stroke="#76c442" strokeWidth="2" fill="none"/>
      {/* Corps */}
      <Ellipse cx="58" cy="74" rx="30" ry="25" fill="#5a9030"/>
      <Ellipse cx="58" cy="78" rx="19" ry="15" fill="#c8f080"/>
      <Ellipse cx="48" cy="65" rx="12" ry="9" fill="#7ab840" opacity="0.4"/>
      {/* Fleur sur tête */}
      <Circle cx="58" cy="36" r="8" fill="#ffdd00"/>
      <Circle cx="48" cy="32" r="5" fill="#ff8844" opacity="0.8"/>
      <Circle cx="68" cy="32" r="5" fill="#ff8844" opacity="0.8"/>
      <Circle cx="52" cy="42" r="5" fill="#ff8844" opacity="0.8"/>
      <Circle cx="64" cy="42" r="5" fill="#ff8844" opacity="0.8"/>
      <Circle cx="58" cy="36" r="5" fill="#ffee44"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="26" ry="23" fill="#6aaa38"/>
      <Ellipse cx="49" cy="44" rx="11" ry="8" fill="#8acc50" opacity="0.4"/>
      {/* Yeux */}
      <Ellipse cx="48" cy="51" rx="7" ry="7.5" fill="#1a2800"/>
      <Ellipse cx="48" cy="51" rx="4.5" ry="5" fill="#2a6010"/>
      <Ellipse cx="48" cy="51" rx="2" ry="2.5" fill="#0a1400"/>
      <Ellipse cx="46.5" cy="49.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="68" cy="51" rx="7" ry="7.5" fill="#1a2800"/>
      <Ellipse cx="68" cy="51" rx="4.5" ry="5" fill="#2a6010"/>
      <Ellipse cx="68" cy="51" rx="2" ry="2.5" fill="#0a1400"/>
      <Ellipse cx="66.5" cy="49.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      {/* Joues */}
      <Ellipse cx="39" cy="57" rx="7" ry="5" fill="#88dd44" opacity="0.4"/>
      <Ellipse cx="77" cy="57" rx="7" ry="5" fill="#88dd44" opacity="0.4"/>
      {/* Nez bouche */}
      <Ellipse cx="58" cy="60" rx="2.5" ry="1.6" fill="#3a6018"/>
      <Path d="M51 64 Q58 70 65 64" stroke="#3a6018" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="95" rx="10" ry="6" fill="#5a9030"/>
      <Ellipse cx="72" cy="95" rx="10" ry="6" fill="#5a9030"/>
    </Svg>
  );
}

export function GlacixSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Cristaux de glace sur le dos */}
      <Polygon points="50,30 54,14 58,30" fill="#c0eeff" opacity="0.9"/>
      <Polygon points="56,28 60,10 64,28" fill="#aaddff" opacity="0.9"/>
      <Polygon points="44,34 47,20 50,34" fill="#c0eeff" opacity="0.8"/>
      <Polygon points="62,34 65,20 68,34" fill="#c0eeff" opacity="0.8"/>
      {/* Aura glace */}
      <Circle cx="58" cy="60" r="44" fill="#80d4ff" opacity="0.06"/>
      {/* Queue cristal */}
      <Polygon points="15,85 22,68 28,85 22,95" fill="#80d4ff" opacity="0.8"/>
      <Polygon points="17,83 22,70 27,83" fill="#c0eeff" opacity="0.6"/>
      {/* Corps */}
      <Ellipse cx="58" cy="74" rx="31" ry="25" fill="#3090b8"/>
      <Ellipse cx="58" cy="78" rx="20" ry="15" fill="#c0eeff"/>
      <Ellipse cx="48" cy="65" rx="12" ry="9" fill="#60b8d8" opacity="0.4"/>
      {/* Plaques de cristal sur corps */}
      <Polygon points="45,70 52,62 59,70 52,78" fill="#aaddff" opacity="0.3"/>
      <Polygon points="57,68 64,60 71,68 64,76" fill="#aaddff" opacity="0.3"/>
      {/* Oreilles pointues cristal */}
      <Polygon points="38,42 34,20 48,40" fill="#3090b8"/>
      <Polygon points="40,40 36,22 47,39" fill="#80d4ff" opacity="0.7"/>
      <Polygon points="78,42 82,20 68,40" fill="#3090b8"/>
      <Polygon points="76,40 80,22 69,39" fill="#80d4ff" opacity="0.7"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="26" ry="23" fill="#4090c0"/>
      <Ellipse cx="49" cy="44" rx="11" ry="8" fill="#80c8e8" opacity="0.4"/>
      {/* Gemme cristal front */}
      <Polygon points="58,36 64,44 58,48 52,44" fill="#c0eeff"/>
      <Polygon points="58,38 62,44 58,47 54,44" fill="white" opacity="0.7"/>
      {/* Joues */}
      <Ellipse cx="39" cy="57" rx="7" ry="5" fill="#80d4ff" opacity="0.4"/>
      <Ellipse cx="77" cy="57" rx="7" ry="5" fill="#80d4ff" opacity="0.4"/>
      {/* Yeux */}
      <Ellipse cx="48" cy="51" rx="7" ry="7.5" fill="#001828"/>
      <Ellipse cx="48" cy="51" rx="4.5" ry="5" fill="#1060a0"/>
      <Ellipse cx="48" cy="51" rx="2" ry="2.5" fill="#000810"/>
      <Ellipse cx="46.5" cy="49.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="68" cy="51" rx="7" ry="7.5" fill="#001828"/>
      <Ellipse cx="68" cy="51" rx="4.5" ry="5" fill="#1060a0"/>
      <Ellipse cx="68" cy="51" rx="2" ry="2.5" fill="#000810"/>
      <Ellipse cx="66.5" cy="49.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="58" cy="60" rx="2.5" ry="1.6" fill="#205870"/>
      <Path d="M51 64 Q58 70 65 64" stroke="#205870" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="95" rx="10" ry="6" fill="#3090b8"/>
      <Ellipse cx="72" cy="95" rx="10" ry="6" fill="#3090b8"/>
    </Svg>
  );
}

export function VoltraxSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle, Line } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Éclairs autour */}
      <Path d="M20 30 L26 40 L22 40 L28 52" stroke="#ffe033" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <Path d="M90 35 L84 45 L88 45 L82 57" stroke="#ffe033" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <Path d="M55 8 L58 18 L55 18 L58 28" stroke="#fff080" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
      {/* Queue éclair */}
      <Polygon points="15,75 22,60 26,70 32,55 28,68 35,58 25,80" fill="#ffe033"/>
      <Polygon points="17,73 22,62 25,70 30,57 27,68 33,60 24,78" fill="#fff080" opacity="0.6"/>
      {/* Corps svelte */}
      <Ellipse cx="62" cy="74" rx="28" ry="23" fill="#c8a800"/>
      <Ellipse cx="62" cy="78" rx="18" ry="14" fill="#fff8c0"/>
      {/* Rayures électriques */}
      <Path d="M44 68 L50 62 L54 68 L58 62 L62 68" stroke="#ffe033" strokeWidth="2" fill="none" opacity="0.6"/>
      {/* Pattes rapides */}
      <Ellipse cx="46" cy="94" rx="9" ry="5" fill="#c8a800"/>
      <Ellipse cx="76" cy="94" rx="9" ry="5" fill="#c8a800"/>
      {/* Traîne de vitesse */}
      <Path d="M16 74 Q30 70 44 74" stroke="#ffe033" strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round"/>
      <Path d="M14 80 Q28 76 42 80" stroke="#ffe033" strokeWidth="2" fill="none" opacity="0.3" strokeLinecap="round"/>
      {/* Oreilles pointues en éclair */}
      <Polygon points="42,40 38,22 46,32 50,18 48,36" fill="#c8a800"/>
      <Polygon points="78,40 82,22 74,32 70,18 72,36" fill="#c8a800"/>
      {/* Tête */}
      <Ellipse cx="60" cy="52" rx="26" ry="23" fill="#d8b810"/>
      <Ellipse cx="51" cy="44" rx="11" ry="8" fill="#ffe860" opacity="0.4"/>
      {/* Marque éclair sur front */}
      <Path d="M56 38 L60 44 L57 44 L61 50" stroke="#ff8800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Joues étincelles */}
      <Ellipse cx="41" cy="57" rx="7" ry="5" fill="#ffe033" opacity="0.5"/>
      <Ellipse cx="79" cy="57" rx="7" ry="5" fill="#ffe033" opacity="0.5"/>
      <Circle cx="39" cy="56" r="1.5" fill="#fff080" opacity="0.8"/>
      <Circle cx="81" cy="56" r="1.5" fill="#fff080" opacity="0.8"/>
      {/* Yeux vifs */}
      <Ellipse cx="50" cy="51" rx="7" ry="7" fill="#1a1000"/>
      <Ellipse cx="50" cy="51" rx="4.5" ry="5" fill="#804000"/>
      <Ellipse cx="50" cy="51" rx="2" ry="2.5" fill="#0a0800"/>
      <Ellipse cx="48.5" cy="49.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="70" cy="51" rx="7" ry="7" fill="#1a1000"/>
      <Ellipse cx="70" cy="51" rx="4.5" ry="5" fill="#804000"/>
      <Ellipse cx="70" cy="51" rx="2" ry="2.5" fill="#0a0800"/>
      <Ellipse cx="68.5" cy="49.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="60" cy="60" rx="2.5" ry="1.6" fill="#604000"/>
      <Path d="M53 64 Q60 70 67 64" stroke="#604000" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </Svg>
  );
}

export function SpectroxSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle, Polygon } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura fantôme */}
      <Circle cx="58" cy="60" r="46" fill="#cc77ff" opacity="0.07"/>
      <Circle cx="58" cy="60" r="38" fill="#cc77ff" opacity="0.05"/>
      {/* Corps fantomatique ondulé */}
      <Path d="M28 55 Q28 90 38 98 Q48 106 58 98 Q68 106 78 98 Q88 90 88 55 Q88 30 58 30 Q28 30 28 55Z" fill="#8844cc"/>
      <Path d="M32 55 Q32 86 40 94 Q50 102 58 94 Q66 102 76 94 Q84 86 84 55 Q84 34 58 34 Q32 34 32 55Z" fill="#9955dd"/>
      {/* Bas fantôme avec ondulations */}
      <Path d="M28 82 Q34 90 40 82 Q46 74 52 82 Q58 90 64 82 Q70 74 76 82 Q82 90 88 82 L88 98 Q78 106 68 98 Q58 106 48 98 Q38 106 28 98Z" fill="#8844cc"/>
      {/* Ventre */}
      <Ellipse cx="58" cy="62" rx="20" ry="18" fill="#cc99ff" opacity="0.25"/>
      {/* Bras fantômes */}
      <Path d="M28 55 Q15 50 12 40 Q18 42 22 52" fill="#8844cc" opacity="0.7"/>
      <Path d="M88 55 Q101 50 104 40 Q98 42 94 52" fill="#8844cc" opacity="0.7"/>
      {/* Yeux brillants */}
      <Ellipse cx="47" cy="50" rx="9" ry="10" fill="#200040"/>
      <Ellipse cx="47" cy="50" rx="6" ry="7" fill="#aa55ff"/>
      <Ellipse cx="47" cy="50" rx="3" ry="3.5" fill="#100020"/>
      <Ellipse cx="45" cy="48" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      <Circle cx="49" cy="52" r="1" fill="#cc88ff" opacity="0.6"/>
      <Ellipse cx="69" cy="50" rx="9" ry="10" fill="#200040"/>
      <Ellipse cx="69" cy="50" rx="6" ry="7" fill="#aa55ff"/>
      <Ellipse cx="69" cy="50" rx="3" ry="3.5" fill="#100020"/>
      <Ellipse cx="67" cy="48" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      {/* Bouche fantôme */}
      <Path d="M49 62 Q53 58 58 62 Q63 58 67 62" stroke="#cc77ff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Particules fantômes */}
      <Circle cx="30" cy="35" r="3" fill="#cc77ff" opacity="0.5"/>
      <Circle cx="88" cy="30" r="2" fill="#cc77ff" opacity="0.4"/>
      <Circle cx="25" cy="65" r="2" fill="#aa55ff" opacity="0.5"/>
      <Circle cx="95" cy="60" r="2.5" fill="#cc77ff" opacity="0.4"/>
      <Circle cx="58" cy="20" r="2" fill="#cc77ff" opacity="0.6"/>
    </Svg>
  );
}

export function BouldrakSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle, Rect } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Rochers flottants */}
      <Ellipse cx="20" cy="30" rx="8" ry="6" fill="#605030" opacity="0.7"/>
      <Ellipse cx="92" cy="35" rx="7" ry="5" fill="#605030" opacity="0.6"/>
      {/* Corps masif carré */}
      <Rect x="22" y="58" width="72" height="42" rx="8" fill="#5a4020"/>
      <Rect x="26" y="62" width="64" height="34" rx="6" fill="#7a6040"/>
      {/* Texture rocher */}
      <Circle cx="40" cy="72" r="5" fill="#4a3010" opacity="0.5"/>
      <Circle cx="65" cy="68" r="6" fill="#4a3010" opacity="0.4"/>
      <Circle cx="80" cy="78" r="4" fill="#4a3010" opacity="0.4"/>
      <Circle cx="48" cy="84" r="4" fill="#4a3010" opacity="0.3"/>
      {/* Plaques métalliques */}
      <Rect x="30" y="66" width="20" height="12" rx="3" fill="#888060" opacity="0.5"/>
      <Rect x="62" y="72" width="18" height="10" rx="3" fill="#888060" opacity="0.5"/>
      {/* Bras courts massifs */}
      <Rect x="8" y="62" width="18" height="24" rx="6" fill="#5a4020"/>
      <Rect x="90" y="62" width="18" height="24" rx="6" fill="#5a4020"/>
      {/* Griffes */}
      <Polygon points="10,82 6,90 12,84" fill="#a08040"/>
      <Polygon points="18,84 14,92 20,86" fill="#a08040"/>
      <Polygon points="96,82 100,90 94,84" fill="#a08040"/>
      <Polygon points="100,84 104,92 98,86" fill="#a08040"/>
      {/* Tête carrée massive */}
      <Rect x="28" y="28" width="60" height="50" rx="10" fill="#6a5030"/>
      <Rect x="32" y="32" width="52" height="42" rx="8" fill="#8a7040"/>
      {/* Cristaux sur crâne */}
      <Polygon points="45,30 48,16 51,30" fill="#c8a850" opacity="0.9"/>
      <Polygon points="53,28 56,12 59,28" fill="#e8c870" opacity="0.9"/>
      <Polygon points="61,30 64,17 67,30" fill="#c8a850" opacity="0.9"/>
      {/* Sourcils énormes */}
      <Rect x="34" y="42" width="16" height="5" rx="3" fill="#3a2808"/>
      <Rect x="66" y="42" width="16" height="5" rx="3" fill="#3a2808"/>
      {/* Yeux petits */}
      <Ellipse cx="44" cy="53" rx="6" ry="6" fill="#1a1000"/>
      <Ellipse cx="44" cy="53" rx="4" ry="4" fill="#7a5000"/>
      <Ellipse cx="44" cy="53" rx="1.8" ry="2" fill="#0a0800"/>
      <Ellipse cx="42.5" cy="51.5" rx="1.2" ry="1.4" fill="white" opacity="0.9"/>
      <Ellipse cx="72" cy="53" rx="6" ry="6" fill="#1a1000"/>
      <Ellipse cx="72" cy="53" rx="4" ry="4" fill="#7a5000"/>
      <Ellipse cx="72" cy="53" rx="1.8" ry="2" fill="#0a0800"/>
      <Ellipse cx="70.5" cy="51.5" rx="1.2" ry="1.4" fill="white" opacity="0.9"/>
      {/* Nez large bouche */}
      <Ellipse cx="58" cy="62" rx="6" ry="4" fill="#4a3010"/>
      <Circle cx="54" cy="62" r="2" fill="#2a1808"/>
      <Circle cx="62" cy="62" r="2" fill="#2a1808"/>
      <Path d="M50 68 Q58 65 66 68" stroke="#3a2808" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </Svg>
  );
}

export function PyraflorSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle, Polygon } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Pétales de feu autour */}
      <Ellipse cx="30" cy="30" rx="14" ry="8" fill="#ff6020" opacity="0.7" transform="rotate(-40 30 30)"/>
      <Ellipse cx="86" cy="30" rx="14" ry="8" fill="#ff8840" opacity="0.7" transform="rotate(40 86 30)"/>
      <Ellipse cx="20" cy="60" rx="12" ry="7" fill="#ff4400" opacity="0.6" transform="rotate(-10 20 60)"/>
      <Ellipse cx="96" cy="60" rx="12" ry="7" fill="#ff6600" opacity="0.6" transform="rotate(10 96 60)"/>
      {/* Tige */}
      <Path d="M58 95 Q58 75 58 60" stroke="#4a8020" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <Path d="M58 80 Q45 70 35 72" stroke="#4a8020" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <Path d="M58 75 Q71 65 81 68" stroke="#4a8020" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Feuilles */}
      <Ellipse cx="42" cy="72" rx="14" ry="7" fill="#5a9030" transform="rotate(-20 42 72)"/>
      <Ellipse cx="74" cy="68" rx="14" ry="7" fill="#5a9030" transform="rotate(20 74 68)"/>
      {/* Corps fleur */}
      <Circle cx="58" cy="52" r="28" fill="#cc5518"/>
      <Circle cx="58" cy="52" r="22" fill="#ff7730"/>
      <Circle cx="58" cy="52" r="14" fill="#ffaa40"/>
      <Circle cx="58" cy="52" r="8" fill="#ffdd60"/>
      {/* Pétales internes */}
      {[0,60,120,180,240,300].map((deg,i) => {
        const rad = deg * Math.PI / 180;
        const x = 58 + 22 * Math.cos(rad);
        const y = 52 + 22 * Math.sin(rad);
        return <Circle key={i} cx={x} cy={y} r="7" fill="#ff5510" opacity="0.7"/>;
      })}
      {/* Yeux sur la fleur */}
      <Ellipse cx="50" cy="50" rx="6" ry="6.5" fill="#1a0800"/>
      <Ellipse cx="50" cy="50" rx="4" ry="4.5" fill="#cc4400"/>
      <Ellipse cx="50" cy="50" rx="1.8" ry="2" fill="#0a0400"/>
      <Ellipse cx="48.5" cy="48.5" rx="1.3" ry="1.5" fill="white" opacity="0.9"/>
      <Ellipse cx="66" cy="50" rx="6" ry="6.5" fill="#1a0800"/>
      <Ellipse cx="66" cy="50" rx="4" ry="4.5" fill="#cc4400"/>
      <Ellipse cx="66" cy="50" rx="1.8" ry="2" fill="#0a0400"/>
      <Ellipse cx="64.5" cy="48.5" rx="1.3" ry="1.5" fill="white" opacity="0.9"/>
      <Path d="M52 57 Q58 63 64 57" stroke="#aa3300" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Flammes au sommet */}
      <Path d="M50 28 Q52 18 55 24 Q56 14 58 22 Q60 12 62 22 Q65 16 66 26 Q60 20 58 28 Q56 22 50 28Z" fill="#ff6600" opacity="0.8"/>
    </Svg>
  );
}

export function AquafrostSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle, Polygon } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Nageoire dorsale cristal */}
      <Polygon points="58,20 48,40 68,40" fill="#20a8c0" opacity="0.8"/>
      <Polygon points="58,22 50,39 66,39" fill="#80d8e8" opacity="0.5"/>
      {/* Cristaux de glace */}
      <Polygon points="35,30 38,18 41,30" fill="#80d4ff" opacity="0.7"/>
      <Polygon points="75,28 78,16 81,28" fill="#80d4ff" opacity="0.7"/>
      {/* Queue dauphin avec cristaux */}
      <Path d="M20 80 Q10 65 15 55 Q22 65 20 80Z" fill="#20a8c0"/>
      <Path d="M20 80 Q8 75 12 62 Q18 70 20 80Z" fill="#40c8e0" opacity="0.7"/>
      <Polygon points="12 62 8 55 16 58" fill="#80d4ff" opacity="0.6"/>
      {/* Corps */}
      <Ellipse cx="60" cy="70" rx="32" ry="24" fill="#1888a8"/>
      <Ellipse cx="60" cy="74" rx="21" ry="15" fill="#a8eef8"/>
      <Ellipse cx="50" cy="62" rx="13" ry="9" fill="#40b8d0" opacity="0.4"/>
      {/* Nageoires latérales */}
      <Path d="M30 68 Q15 55 18 45 Q26 55 32 65Z" fill="#1888a8" opacity="0.8"/>
      <Path d="M90 68 Q105 55 102 45 Q94 55 88 65Z" fill="#1888a8" opacity="0.8"/>
      {/* Tête */}
      <Ellipse cx="60" cy="52" rx="27" ry="24" fill="#2098b8"/>
      <Ellipse cx="51" cy="44" rx="12" ry="9" fill="#50c0d8" opacity="0.4"/>
      {/* Cristal frontal */}
      <Polygon points="60,36 66,46 60,50 54,46" fill="#80d4ff"/>
      <Polygon points="60,38 64,46 60,49 56,46" fill="white" opacity="0.7"/>
      {/* Joues */}
      <Ellipse cx="40" cy="57" rx="8" ry="5" fill="#40c8e0" opacity="0.5"/>
      <Ellipse cx="80" cy="57" rx="8" ry="5" fill="#40c8e0" opacity="0.5"/>
      {/* Yeux */}
      <Ellipse cx="49" cy="51" rx="7.5" ry="8" fill="#001828"/>
      <Ellipse cx="49" cy="51" rx="5" ry="5.5" fill="#0060a0"/>
      <Ellipse cx="49" cy="51" rx="2.2" ry="2.5" fill="#000810"/>
      <Ellipse cx="47.5" cy="49.5" rx="1.5" ry="1.8" fill="white" opacity="0.95"/>
      <Ellipse cx="71" cy="51" rx="7.5" ry="8" fill="#001828"/>
      <Ellipse cx="71" cy="51" rx="5" ry="5.5" fill="#0060a0"/>
      <Ellipse cx="71" cy="51" rx="2.2" ry="2.5" fill="#000810"/>
      <Ellipse cx="69.5" cy="49.5" rx="1.5" ry="1.8" fill="white" opacity="0.95"/>
      <Ellipse cx="60" cy="61" rx="3" ry="2" fill="#104858"/>
      <Path d="M53 65 Q60 71 67 65" stroke="#104858" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </Svg>
  );
}

export function ThornixSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle, Polygon } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Épines sur le dos */}
      {[42,50,58,66,74].map((x,i) => (
        <Polygon key={i} points={`${x},38 ${x-4},50 ${x+4},50`} fill="#4a7010" opacity="0.9"/>
      ))}
      {/* Queue épineuse */}
      <Path d="M18 82 Q10 68 16 56" stroke="#5a8820" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <Polygon points="10 62 6 54 14 58" fill="#88cc44"/>
      <Polygon points="14 72 8 66 16 68" fill="#88cc44"/>
      {/* Corps */}
      <Ellipse cx="60" cy="74" rx="31" ry="25" fill="#4a7810"/>
      <Ellipse cx="60" cy="78" rx="20" ry="16" fill="#c8ee80"/>
      <Ellipse cx="50" cy="66" rx="13" ry="9" fill="#6aaa28" opacity="0.4"/>
      {/* Épines sur corps */}
      <Polygon points="38,68 34,58 42,62" fill="#3a6008" opacity="0.8"/>
      <Polygon points="80,66 84,56 76,60" fill="#3a6008" opacity="0.8"/>
      <Polygon points="55,76 51,66 59,70" fill="#3a6008" opacity="0.7"/>
      <Polygon points="68,72 72,62 64,66" fill="#3a6008" opacity="0.7"/>
      {/* Oreilles avec épines */}
      <Ellipse cx="38" cy="40" rx="9" ry="14" fill="#4a7810" transform="rotate(-15 38 40)"/>
      <Polygon points="34,26 38,14 42,26" fill="#3a6008"/>
      <Ellipse cx="78" cy="40" rx="9" ry="14" fill="#4a7810" transform="rotate(15 78 40)"/>
      <Polygon points="74,26 78,14 82,26" fill="#3a6008"/>
      {/* Tête */}
      <Ellipse cx="58" cy="53" rx="26" ry="23" fill="#5a9020"/>
      <Ellipse cx="49" cy="45" rx="11" ry="8" fill="#7ac040" opacity="0.4"/>
      {/* Gemme poison */}
      <Circle cx="58" cy="40" r="6" fill="#88cc44"/>
      <Circle cx="58" cy="40" r="3.5" fill="#aee060"/>
      <Circle cx="58" cy="40" r="1.5" fill="white" opacity="0.7"/>
      {/* Joues */}
      <Ellipse cx="39" cy="58" rx="7" ry="5" fill="#88cc44" opacity="0.4"/>
      <Ellipse cx="77" cy="58" rx="7" ry="5" fill="#88cc44" opacity="0.4"/>
      {/* Yeux */}
      <Ellipse cx="48" cy="52" rx="7" ry="7.5" fill="#181e00"/>
      <Ellipse cx="48" cy="52" rx="4.5" ry="5" fill="#3a6010"/>
      <Ellipse cx="48" cy="52" rx="2" ry="2.5" fill="#0a1000"/>
      <Ellipse cx="46.5" cy="50.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="68" cy="52" rx="7" ry="7.5" fill="#181e00"/>
      <Ellipse cx="68" cy="52" rx="4.5" ry="5" fill="#3a6010"/>
      <Ellipse cx="68" cy="52" rx="2" ry="2.5" fill="#0a1000"/>
      <Ellipse cx="66.5" cy="50.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="58" cy="61" rx="2.5" ry="1.6" fill="#2a4808"/>
      <Path d="M51 65 Q58 71 65 65" stroke="#2a4808" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </Svg>
  );
}

export function StormyxSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle, Polygon, Line } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Nuages de tempête */}
      <Ellipse cx="20" cy="25" rx="16" ry="10" fill="#484830" opacity="0.6"/>
      <Ellipse cx="90" cy="20" rx="14" ry="9" fill="#484830" opacity="0.5"/>
      <Ellipse cx="55" cy="12" rx="18" ry="8" fill="#585840" opacity="0.5"/>
      {/* Éclairs multiples */}
      <Path d="M22 35 L28 46 L24 46 L30 58" stroke="#ffee00" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <Path d="M86 30 L80 42 L84 42 L78 54" stroke="#ffee00" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <Path d="M54 20 L58 32 L55 32 L59 44" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9"/>
      {/* Grandes ailes tempête */}
      <Path d="M35 58 Q10 35 5 15 Q22 28 36 55Z" fill="#5a5020" opacity="0.8"/>
      <Path d="M36 56 Q15 36 12 18 Q26 30 38 53Z" fill="#aaaa40" opacity="0.4"/>
      <Path d="M81 58 Q106 35 111 15 Q94 28 80 55Z" fill="#5a5020" opacity="0.8"/>
      <Path d="M80 56 Q101 36 104 18 Q90 30 78 53Z" fill="#aaaa40" opacity="0.4"/>
      {/* Queue tourbillon */}
      <Path d="M20 82 Q8 70 12 58 Q18 66 16 78 Q22 70 28 76" stroke="#888820" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <Path d="M20 82 Q10 70 14 60 Q18 68 16 78" stroke="#ffee00" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* Corps puissant */}
      <Ellipse cx="60" cy="73" rx="30" ry="25" fill="#6a6820"/>
      <Ellipse cx="60" cy="77" rx="19" ry="15" fill="#eeee80"/>
      <Ellipse cx="50" cy="65" rx="13" ry="9" fill="#8a8840" opacity="0.4"/>
      {/* Oreilles pointues avec éclairs */}
      <Polygon points="40,40 36,18 50,38" fill="#6a6820"/>
      <Path d="M40 36 L44 26 L42 26 L46 18" stroke="#ffee00" strokeWidth="1.5" fill="none"/>
      <Polygon points="76,40 80,18 66,38" fill="#6a6820"/>
      <Path d="M76 36 L72 26 L74 26 L70 18" stroke="#ffee00" strokeWidth="1.5" fill="none"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="24" fill="#7a7830"/>
      <Ellipse cx="49" cy="44" rx="12" ry="9" fill="#aaaa50" opacity="0.4"/>
      {/* Couronne d'éclairs */}
      <Path d="M48 36 L52 44 L49 44 L53 52" stroke="#ffee00" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <Path d="M64 36 L60 44 L63 44 L59 52" stroke="#ffee00" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Yeux tempête */}
      <Ellipse cx="47" cy="51" rx="8" ry="8.5" fill="#101000"/>
      <Ellipse cx="47" cy="51" rx="5.5" ry="6" fill="#6a6000"/>
      <Ellipse cx="47" cy="51" rx="2.5" ry="3" fill="#080800"/>
      <Ellipse cx="45.5" cy="49.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      <Circle cx="49" cy="53" r="1" fill="#ffee00" opacity="0.6"/>
      <Ellipse cx="69" cy="51" rx="8" ry="8.5" fill="#101000"/>
      <Ellipse cx="69" cy="51" rx="5.5" ry="6" fill="#6a6000"/>
      <Ellipse cx="69" cy="51" rx="2.5" ry="3" fill="#080800"/>
      <Ellipse cx="67.5" cy="49.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      {/* Joues orageuses */}
      <Ellipse cx="37" cy="57" rx="8" ry="5" fill="#ffee00" opacity="0.3"/>
      <Ellipse cx="79" cy="57" rx="8" ry="5" fill="#ffee00" opacity="0.3"/>
      <Circle cx="35" cy="56" r="1.5" fill="#ffee00" opacity="0.7"/>
      <Circle cx="81" cy="56" r="1.5" fill="#ffee00" opacity="0.7"/>
      <Ellipse cx="58" cy="61" rx="3" ry="2" fill="#4a4800"/>
      <Path d="M50 65 Q58 73 66 65" stroke="#4a4800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="94" rx="11" ry="6" fill="#6a6820"/>
      <Ellipse cx="74" cy="94" rx="11" ry="6" fill="#6a6820"/>
    </Svg>
  );
}

export function CrystaraSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Circle, Polygon } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura cristal */}
      <Circle cx="58" cy="58" r="48" fill="#aaeeff" opacity="0.06"/>
      <Circle cx="58" cy="58" r="40" fill="#aaeeff" opacity="0.04"/>
      {/* Cristaux orbitaux */}
      <Polygon points="15,25 18,12 21,25 18,35" fill="#80d4ff" opacity="0.8"/>
      <Polygon points="95,30 98,17 101,30 98,40" fill="#aaeeff" opacity="0.8"/>
      <Polygon points="12,65 15,54 18,65 15,73" fill="#80d4ff" opacity="0.7"/>
      <Polygon points="96,68 99,57 102,68 99,76" fill="#aaeeff" opacity="0.7"/>
      <Polygon points="45,10 48,2 51,10 48,18" fill="#c0f0ff" opacity="0.8"/>
      <Polygon points="63,8 66,0 69,8 66,16" fill="#aaeeff" opacity="0.8"/>
      {/* Ailes de cristal */}
      <Path d="M32 56 Q10 38 8 18 Q24 30 34 52Z" fill="#40b8d0" opacity="0.5"/>
      <Path d="M33 54 Q14 38 14 20 Q26 32 35 50Z" fill="#aaeeff" opacity="0.3"/>
      <Path d="M84 56 Q106 38 108 18 Q92 30 82 52Z" fill="#40b8d0" opacity="0.5"/>
      <Path d="M83 54 Q102 38 102 20 Q90 32 81 50Z" fill="#aaeeff" opacity="0.3"/>
      {/* Halo de cristal */}
      <Ellipse cx="58" cy="24" rx="28" ry="7" fill="none" stroke="#80d4ff" strokeWidth="2" opacity="0.6"/>
      {/* Couronne cristal */}
      <Polygon points="44,34 48,18 52,28 58,16 64,28 68,18 72,34" fill="#40b8d0"/>
      <Polygon points="44,34 48,20 52,29 58,18 64,29 68,20 72,34" fill="#aaeeff" opacity="0.6"/>
      <Circle cx="48" cy="22" r="3" fill="#80d4ff"/>
      <Circle cx="58" cy="17" r="3.5" fill="white" opacity="0.9"/>
      <Circle cx="68" cy="22" r="3" fill="#80d4ff"/>
      {/* Queue cristal */}
      <Path d="M18 80 Q8 65 14 52 Q20 62 18 78Z" fill="#20a0c0" opacity="0.8"/>
      <Polygon points="10 56 6 48 14 52" fill="#80d4ff" opacity="0.7"/>
      {/* Corps translucide */}
      <Ellipse cx="58" cy="74" rx="30" ry="25" fill="#1888a8" opacity="0.9"/>
      <Ellipse cx="58" cy="78" rx="19" ry="15" fill="#ddf8ff"/>
      {/* Reflets cristal corps */}
      <Ellipse cx="48" cy="68" rx="10" ry="7" fill="#80d4ff" opacity="0.2"/>
      <Circle cx="62" cy="65" r="4" fill="#aaeeff" opacity="0.2"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="24" fill="#2898b8"/>
      <Ellipse cx="49" cy="44" rx="12" ry="9" fill="#60c8e0" opacity="0.4"/>
      {/* Grand cristal prisme frontal */}
      <Polygon points="58,32 68,46 58,52 48,46" fill="#80d4ff"/>
      <Polygon points="58,34 66,46 58,51 50,46" fill="white" opacity="0.6"/>
      <Polygon points="58,34 68,46 58,43" fill="#aaeeff" opacity="0.4"/>
      <Ellipse cx="58" cy="42" rx="10" ry="9" fill="#80d4ff" opacity="0.3"/>
      {/* Joues cristal */}
      <Ellipse cx="37" cy="57" rx="9" ry="6" fill="#80d4ff" opacity="0.4"/>
      <Ellipse cx="79" cy="57" rx="9" ry="6" fill="#80d4ff" opacity="0.4"/>
      {/* Yeux profonds */}
      <Ellipse cx="47" cy="51" rx="8.5" ry="9" fill="#002030"/>
      <Ellipse cx="47" cy="51" rx="6" ry="6.5" fill="#2080a0"/>
      <Ellipse cx="47" cy="51" rx="3" ry="3.5" fill="#001020"/>
      <Ellipse cx="45" cy="49" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      <Circle cx="49" cy="53" r="0.8" fill="#80d4ff" opacity="0.7"/>
      <Ellipse cx="69" cy="51" rx="8.5" ry="9" fill="#002030"/>
      <Ellipse cx="69" cy="51" rx="6" ry="6.5" fill="#2080a0"/>
      <Ellipse cx="69" cy="51" rx="3" ry="3.5" fill="#001020"/>
      <Ellipse cx="67" cy="49" rx="2" ry="2.2" fill="white" opacity="0.95"/>
      <Ellipse cx="58" cy="62" rx="3" ry="2" fill="#105868"/>
      <Path d="M50 66 Q58 73 66 66" stroke="#105868" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Pieds cristal */}
      <Ellipse cx="44" cy="95" rx="11" ry="6" fill="#1888a8"/>
      <Ellipse cx="72" cy="95" rx="11" ry="6" fill="#1888a8"/>
    </Svg>
  );
}

// ─── Sprites Évolutions V2 ────────────────────────────────────────

export function PyraxSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura feu bleue */}
      <Circle cx="58" cy="60" r="46" fill="#ff4400" opacity="0.07"/>
      {/* Grandes ailes de dragon */}
      <Path d="M30 58 Q8 30 12 10 Q25 25 35 55Z" fill="#cc2200" opacity="0.8"/>
      <Path d="M32 56 Q12 32 18 14 Q28 28 36 53Z" fill="#ff6600" opacity="0.4"/>
      <Path d="M86 58 Q108 30 104 10 Q91 25 81 55Z" fill="#cc2200" opacity="0.8"/>
      <Path d="M84 56 Q104 32 98 14 Q88 28 80 53Z" fill="#ff6600" opacity="0.4"/>
      {/* Queue enroulée */}
      <Path d="M20 82 Q10 68 16 55 Q22 65 18 80Z" fill="#cc2200" opacity="0.9"/>
      {/* Corps plus grand */}
      <Ellipse cx="58" cy="74" rx="33" ry="27" fill="#dd3300"/>
      <Ellipse cx="58" cy="78" rx="21" ry="17" fill="#ff9955"/>
      {/* Crête dorsale bleue */}
      <Polygon points="46,38 50,22 54,38" fill="#0066ff" opacity="0.9"/>
      <Polygon points="53,35 57,18 61,35" fill="#0088ff" opacity="0.9"/>
      <Polygon points="60,38 64,22 68,38" fill="#0066ff" opacity="0.8"/>
      {/* Cornes */}
      <Polygon points="44,36 40,18 48,34" fill="#ff2200"/>
      <Polygon points="72,36 76,18 68,34" fill="#ff2200"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="23" fill="#ee4411"/>
      <Ellipse cx="48" cy="43" rx="11" ry="8" fill="#ff7744" opacity="0.4"/>
      {/* Flammes bleues aux narines */}
      <Circle cx="52" cy="62" r="2.5" fill="#220000"/>
      <Circle cx="64" cy="62" r="2.5" fill="#220000"/>
      <Ellipse cx="52" cy="59" rx="2.5" ry="4" fill="#0066ff" opacity="0.8"/>
      <Ellipse cx="64" cy="59" rx="2.5" ry="4" fill="#0066ff" opacity="0.8"/>
      {/* Yeux bleu ardent */}
      <Ellipse cx="48" cy="50" rx="7.5" ry="7" fill="#110000"/>
      <Ellipse cx="48" cy="50" rx="5" ry="5" fill="#0044ff"/>
      <Ellipse cx="48" cy="50" rx="2.2" ry="2.5" fill="#000011"/>
      <Ellipse cx="46.5" cy="48.5" rx="1.5" ry="1.8" fill="white" opacity="0.9"/>
      <Ellipse cx="68" cy="50" rx="7.5" ry="7" fill="#110000"/>
      <Ellipse cx="68" cy="50" rx="5" ry="5" fill="#0044ff"/>
      <Ellipse cx="68" cy="50" rx="2.2" ry="2.5" fill="#000011"/>
      <Ellipse cx="66.5" cy="48.5" rx="1.5" ry="1.8" fill="white" opacity="0.9"/>
      {/* Bouche */}
      <Path d="M49 65 Q58 73 67 65" stroke="#aa1100" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Écailles sur corps */}
      <Ellipse cx="46" cy="76" rx="5" ry="3" fill="#aa2200" opacity="0.5" transform="rotate(-10 46 76)"/>
      <Ellipse cx="70" cy="72" rx="5" ry="3" fill="#aa2200" opacity="0.5" transform="rotate(10 70 72)"/>
      {/* Pieds griffus */}
      <Ellipse cx="44" cy="97" rx="10" ry="6" fill="#cc3300"/>
      <Polygon points="37,94 33,101 39,95" fill="#ff4400"/>
      <Polygon points="42,95 38,102 44,96" fill="#ff4400"/>
      <Ellipse cx="72" cy="97" rx="10" ry="6" fill="#cc3300"/>
      <Polygon points="79,94 83,101 77,95" fill="#ff4400"/>
      <Polygon points="74,95 78,102 72,96" fill="#ff4400"/>
    </Svg>
  );
}

export function PyralordSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle, Line } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura légendaire */}
      <Circle cx="58" cy="55" r="50" fill="#ff2200" opacity="0.08"/>
      <Circle cx="58" cy="55" r="42" fill="#ffd700" opacity="0.05"/>
      {/* Rayons de feu */}
      {[0,45,90,135,180,225,270,315].map((deg,i)=>(
        <Path key={i}
          d={`M58 55 L${58+Math.cos(deg*Math.PI/180)*22} ${55+Math.sin(deg*Math.PI/180)*22}`}
          stroke="#ff4400" strokeWidth="1" opacity="0.3"
        />
      ))}
      {/* Grandes ailes majestueuses */}
      <Path d="M28 55 Q4 25 8 4 Q22 18 32 52Z" fill="#990000" opacity="0.9"/>
      <Path d="M30 53 Q10 26 16 8 Q26 22 34 50Z" fill="#ff3300" opacity="0.5"/>
      <Path d="M88 55 Q112 25 108 4 Q94 18 84 52Z" fill="#990000" opacity="0.9"/>
      <Path d="M86 53 Q106 26 100 8 Q90 22 82 50Z" fill="#ff3300" opacity="0.5"/>
      {/* Membrane aile avec nervures */}
      <Path d="M28 55 Q15 40 20 20 Q24 35 30 52" stroke="#ff6600" strokeWidth="1" fill="none" opacity="0.6"/>
      <Path d="M88 55 Q101 40 96 20 Q92 35 86 52" stroke="#ff6600" strokeWidth="1" fill="none" opacity="0.6"/>
      {/* Queue longue avec pointe */}
      <Path d="M18 80 Q6 65 10 50 Q16 62 15 78Z" fill="#880000" opacity="0.9"/>
      <Polygon points="6,50 2,44 10,48" fill="#ffd700"/>
      {/* Corps massif */}
      <Ellipse cx="58" cy="72" rx="35" ry="28" fill="#cc2200"/>
      <Ellipse cx="58" cy="76" rx="22" ry="18" fill="#ff8844"/>
      {/* Plaques dorsales dorées */}
      <Polygon points="44,33 48,14 52,33" fill="#ffd700"/>
      <Polygon points="51,30 55,10 59,30" fill="#ffa500"/>
      <Polygon points="58,30 62,10 66,30" fill="#ffd700"/>
      <Polygon points="65,33 69,16 73,33" fill="#ffd700" opacity="0.8"/>
      {/* Couronne de feu */}
      <Path d="M42,30 Q46,18 50,26 Q52,14 55,24 Q57,10 60,22 Q62,12 65,24 Q68,18 72,28 Q66,22 60,28 Q57,16 54,26 Q51,18 46,28 Q44,22 42,30Z" fill="#ff6600" opacity="0.9"/>
      <Path d="M42,30 Q46,20 50,27 Q52,16 55,25 Q57,12 60,23 Q62,14 65,25 Q68,20 72,28" stroke="#ffd700" strokeWidth="1.5" fill="none"/>
      {/* Cornes royales */}
      <Polygon points="40,36 34,12 44,34" fill="#880000"/>
      <Polygon points="42,34 37,14 44,33" fill="#ffd700" opacity="0.5"/>
      <Polygon points="76,36 82,12 72,34" fill="#880000"/>
      <Polygon points="74,34 79,14 72,33" fill="#ffd700" opacity="0.5"/>
      {/* Tête */}
      <Ellipse cx="58" cy="50" rx="28" ry="25" fill="#dd3300"/>
      <Ellipse cx="48" cy="41" rx="12" ry="9" fill="#ff6633" opacity="0.4"/>
      {/* Gemme frontale */}
      <Polygon points="58,30 64,40 58,46 52,40" fill="#ffd700"/>
      <Polygon points="58,32 62,40 58,44 54,40" fill="#fff8" opacity="0.6"/>
      {/* Yeux légendaires */}
      <Ellipse cx="46" cy="49" rx="8.5" ry="9" fill="#100000"/>
      <Ellipse cx="46" cy="49" rx="6" ry="6.5" fill="#ff2200"/>
      <Ellipse cx="46" cy="49" rx="3" ry="3.5" fill="#050000"/>
      <Ellipse cx="44" cy="47" rx="2" ry="2.2" fill="#ffd700" opacity="0.9"/>
      <Ellipse cx="70" cy="49" rx="8.5" ry="9" fill="#100000"/>
      <Ellipse cx="70" cy="49" rx="6" ry="6.5" fill="#ff2200"/>
      <Ellipse cx="70" cy="49" rx="3" ry="3.5" fill="#050000"/>
      <Ellipse cx="68" cy="47" rx="2" ry="2.2" fill="#ffd700" opacity="0.9"/>
      {/* Flamme sortant de la bouche */}
      <Path d="M48 64 Q55 58 62 64" stroke="#ff4400" strokeWidth="2.5" fill="none"/>
      <Ellipse cx="55" cy="62" rx="6" ry="4" fill="#ffd700" opacity="0.4"/>
      {/* Pieds */}
      <Ellipse cx="42" cy="96" rx="11" ry="7" fill="#bb2200"/>
      <Ellipse cx="74" cy="96" rx="11" ry="7" fill="#bb2200"/>
    </Svg>
  );
}

export function AquilonSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura eau */}
      <Circle cx="58" cy="60" r="46" fill="#0066ff" opacity="0.07"/>
      {/* Nageoires latérales grandes */}
      <Path d="M28 62 Q8 44 10 26 Q24 40 32 60Z" fill="#004499" opacity="0.85"/>
      <Path d="M30 60 Q14 44 16 28 Q26 42 34 58Z" fill="#0066cc" opacity="0.4"/>
      <Path d="M88 62 Q108 44 106 26 Q92 40 84 60Z" fill="#004499" opacity="0.85"/>
      <Path d="M86 60 Q102 44 100 28 Q90 42 82 58Z" fill="#0066cc" opacity="0.4"/>
      {/* Queue tourbillon puissante */}
      <Path d="M18 82 Q6 66 10 50 Q18 62 16 80Z" fill="#0055bb" opacity="0.9"/>
      <Path d="M20 82 Q8 70 14 56 Q18 68 16 80Z" fill="#00aaff" opacity="0.5"/>
      {/* Bulles d'eau */}
      <Circle cx="25" cy="30" r="6" fill="#0088ff" opacity="0.25"/>
      <Circle cx="88" cy="25" r="5" fill="#00aaff" opacity="0.25"/>
      <Circle cx="20" cy="55" r="4" fill="#0066ff" opacity="0.2"/>
      {/* Corps puissant */}
      <Ellipse cx="58" cy="73" rx="34" ry="27" fill="#0055aa"/>
      <Ellipse cx="58" cy="77" rx="22" ry="17" fill="#aaeeff"/>
      {/* Dorsale requin */}
      <Polygon points="58,22 48,42 68,42" fill="#003388" opacity="0.9"/>
      <Polygon points="58,24 50,40 66,40" fill="#0055cc" opacity="0.5"/>
      {/* Cristaux eau sur dos */}
      <Polygon points="46,38 50,24 54,38" fill="#00ddff" opacity="0.8"/>
      <Polygon points="62,38 66,24 70,38" fill="#00ddff" opacity="0.8"/>
      {/* Oreilles aérodynamiques */}
      <Polygon points="38,40 34,20 46,38" fill="#004499"/>
      <Polygon points="40,38 36,22 45,37" fill="#0088ff" opacity="0.5"/>
      <Polygon points="78,40 82,20 70,38" fill="#004499"/>
      <Polygon points="76,38 80,22 71,37" fill="#0088ff" opacity="0.5"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="27" ry="24" fill="#0066bb"/>
      <Ellipse cx="48" cy="43" rx="12" ry="9" fill="#4499ff" opacity="0.4"/>
      {/* Gemme eau */}
      <Polygon points="58,32 66,44 58,50 50,44" fill="#00ddff"/>
      <Polygon points="58,34 64,44 58,49 52,44" fill="white" opacity="0.6"/>
      {/* Joues bleues */}
      <Ellipse cx="38" cy="57" rx="8" ry="5" fill="#0099ff" opacity="0.5"/>
      <Ellipse cx="78" cy="57" rx="8" ry="5" fill="#0099ff" opacity="0.5"/>
      {/* Yeux profonds */}
      <Ellipse cx="47" cy="51" rx="8" ry="8.5" fill="#001133"/>
      <Ellipse cx="47" cy="51" rx="5.5" ry="6" fill="#0033aa"/>
      <Ellipse cx="47" cy="51" rx="2.5" ry="3" fill="#000811"/>
      <Ellipse cx="45.5" cy="49.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      <Ellipse cx="69" cy="51" rx="8" ry="8.5" fill="#001133"/>
      <Ellipse cx="69" cy="51" rx="5.5" ry="6" fill="#0033aa"/>
      <Ellipse cx="69" cy="51" rx="2.5" ry="3" fill="#000811"/>
      <Ellipse cx="67.5" cy="49.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      {/* Bouche */}
      <Path d="M50 63 Q58 70 66 63" stroke="#003388" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="96" rx="11" ry="6" fill="#0055aa"/>
      <Ellipse cx="72" cy="96" rx="11" ry="6" fill="#0055aa"/>
    </Svg>
  );
}

export function AquarexSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura légendaire bleue */}
      <Circle cx="58" cy="55" r="50" fill="#0044cc" opacity="0.09"/>
      <Circle cx="58" cy="55" r="40" fill="#00aaff" opacity="0.05"/>
      {/* Tourbillon d eau autour */}
      <Path d="M15 40 Q10 55 18 68 Q14 55 20 42Z" fill="#0055cc" opacity="0.3"/>
      <Path d="M100 40 Q106 55 98 68 Q102 55 96 42Z" fill="#0055cc" opacity="0.3"/>
      {/* Grandes nageoires royales */}
      <Path d="M24 58 Q4 36 6 12 Q20 28 28 55Z" fill="#002266" opacity="0.9"/>
      <Path d="M26 56 Q8 36 12 14 Q22 30 30 53Z" fill="#0055aa" opacity="0.4"/>
      <Path d="M92 58 Q112 36 110 12 Q96 28 88 55Z" fill="#002266" opacity="0.9"/>
      <Path d="M90 56 Q108 36 104 14 Q94 30 86 53Z" fill="#0055aa" opacity="0.4"/>
      {/* Nervures ailes */}
      {[0.3,0.5,0.7].map((t,i)=>(
        <Path key={i} d={`M${24+t*4} ${58-t*16} Q${16-t*4} ${46-t*12} ${20-t*4} ${28-t*16}`}
          stroke="#4499ff" strokeWidth="1" fill="none" opacity="0.5"/>
      ))}
      {/* Queue majestueuse */}
      <Path d="M14 80 Q2 62 6 44 Q14 58 12 78Z" fill="#002266" opacity="0.95"/>
      <Polygon points="2,44 -4,36 6,42" fill="#00ddff"/>
      <Polygon points="8,60 2,52 10,56" fill="#00aaff" opacity="0.6"/>
      {/* Corps colossal */}
      <Ellipse cx="58" cy="72" rx="36" ry="29" fill="#003399"/>
      <Ellipse cx="58" cy="76" rx="24" ry="19" fill="#ddf8ff"/>
      {/* Armure cristaux sur corps */}
      <Ellipse cx="44" cy="68" rx="10" ry="7" fill="#00aaff" opacity="0.25" transform="rotate(-15 44 68)"/>
      <Ellipse cx="72" cy="64" rx="10" ry="7" fill="#00aaff" opacity="0.25" transform="rotate(15 72 64)"/>
      {/* Couronne de dorsales */}
      <Polygon points="44,32 48,14 52,32" fill="#00ccff"/>
      <Polygon points="51,28 55,8 59,28" fill="#00aaee"/>
      <Polygon points="58,28 62,8 66,28" fill="#00ccff"/>
      <Polygon points="65,32 69,14 73,32" fill="#00ccff" opacity="0.8"/>
      {/* Halo eau */}
      <Ellipse cx="58" cy="22" rx="30" ry="8" fill="none" stroke="#00aaff" strokeWidth="1.5" opacity="0.5"/>
      {/* Oreilles-aileron */}
      <Polygon points="36,38 30,14 46,36" fill="#002266"/>
      <Polygon points="38,36 34,16 45,35" fill="#0066ff" opacity="0.5"/>
      <Polygon points="80,38 86,14 70,36" fill="#002266"/>
      <Polygon points="78,36 82,16 71,35" fill="#0066ff" opacity="0.5"/>
      {/* Tête */}
      <Ellipse cx="58" cy="51" rx="29" ry="25" fill="#0044bb"/>
      <Ellipse cx="47" cy="42" rx="13" ry="10" fill="#66bbff" opacity="0.35"/>
      {/* Grand prisme frontal */}
      <Polygon points="58,28 70,44 58,52 46,44" fill="#00ddff"/>
      <Polygon points="58,30 68,44 58,51 48,44" fill="white" opacity="0.55"/>
      <Polygon points="58,30 70,44 58,42" fill="#00aaff" opacity="0.4"/>
      {/* Joues */}
      <Ellipse cx="36" cy="56" rx="9" ry="6" fill="#0099ff" opacity="0.4"/>
      <Ellipse cx="80" cy="56" rx="9" ry="6" fill="#0099ff" opacity="0.4"/>
      {/* Yeux légendaires */}
      <Ellipse cx="46" cy="50" rx="9" ry="9.5" fill="#000a20"/>
      <Ellipse cx="46" cy="50" rx="6.5" ry="7" fill="#0055dd"/>
      <Ellipse cx="46" cy="50" rx="3.2" ry="3.8" fill="#000510"/>
      <Ellipse cx="44" cy="48" rx="2.2" ry="2.5" fill="white" opacity="0.95"/>
      <Circle cx="48" cy="52" r="1" fill="#00ddff" opacity="0.7"/>
      <Ellipse cx="70" cy="50" rx="9" ry="9.5" fill="#000a20"/>
      <Ellipse cx="70" cy="50" rx="6.5" ry="7" fill="#0055dd"/>
      <Ellipse cx="70" cy="50" rx="3.2" ry="3.8" fill="#000510"/>
      <Ellipse cx="68" cy="48" rx="2.2" ry="2.5" fill="white" opacity="0.95"/>
      {/* Bouche royale */}
      <Path d="M48 65 Q58 73 68 65" stroke="#002266" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <Ellipse cx="58" cy="63" rx="5" ry="3" fill="#00aaff" opacity="0.3"/>
      {/* Pieds royaux */}
      <Ellipse cx="42" cy="97" rx="12" ry="7" fill="#003399"/>
      <Ellipse cx="74" cy="97" rx="12" ry="7" fill="#003399"/>
    </Svg>
  );
}

export function FlorivaSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura nature-lumière */}
      <Circle cx="58" cy="60" r="46" fill="#44bb22" opacity="0.07"/>
      {/* Grandes feuilles-ailes */}
      <Ellipse cx="30" cy="48" rx="18" ry="10" fill="#228800" opacity="0.85" transform="rotate(-30 30 48)"/>
      <Ellipse cx="32" cy="46" rx="10" ry="5" fill="#55cc22" opacity="0.5" transform="rotate(-30 32 46)"/>
      <Ellipse cx="86" cy="48" rx="18" ry="10" fill="#228800" opacity="0.85" transform="rotate(30 86 48)"/>
      <Ellipse cx="84" cy="46" rx="10" ry="5" fill="#55cc22" opacity="0.5" transform="rotate(30 84 46)"/>
      {/* Nervures feuilles */}
      <Path d="M30 48 Q22 40 26 28" stroke="#55cc22" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <Path d="M86 48 Q94 40 90 28" stroke="#55cc22" strokeWidth="1.5" fill="none" opacity="0.6"/>
      {/* Queue fleurie */}
      <Ellipse cx="18" cy="80" rx="14" ry="8" fill="#228800" transform="rotate(-30 18 80)"/>
      <Circle cx="12" cy="74" r="6" fill="#ffcc00"/>
      <Circle cx="10" cy="72" r="3" fill="#ffee44"/>
      {/* Tige lumineuse */}
      <Path d="M58 95 Q58 75 58 58" stroke="#338800" strokeWidth="7" fill="none" strokeLinecap="round"/>
      {/* Feuilles latérales */}
      <Ellipse cx="42" cy="74" rx="16" ry="8" fill="#338800" transform="rotate(-20 42 74)"/>
      <Path d="M42 74 Q35 68 38 60" stroke="#55cc22" strokeWidth="1.5" fill="none"/>
      <Ellipse cx="74" cy="70" rx="16" ry="8" fill="#338800" transform="rotate(20 74 70)"/>
      <Path d="M74 70 Q81 64 78 56" stroke="#55cc22" strokeWidth="1.5" fill="none"/>
      {/* Grande fleur lumineuse */}
      {[0,60,120,180,240,300].map((deg,i)=>{
        const rad=deg*Math.PI/180;
        const x=58+22*Math.cos(rad), y=50+22*Math.sin(rad);
        return <Circle key={i} cx={x} cy={y} r="8" fill={i%2===0?"#ffcc00":"#ff9900"} opacity="0.8"/>;
      })}
      <Circle cx="58" cy="50" r="14" fill="#ffee44"/>
      <Circle cx="58" cy="50" r="8" fill="#ffffff" opacity="0.9"/>
      {/* Lumière dorée rayonnante */}
      {[0,45,90,135,180,225,270,315].map((deg,i)=>(
        <Path key={i}
          d={`M58 50 L${58+Math.cos(deg*Math.PI/180)*32} ${50+Math.sin(deg*Math.PI/180)*32}`}
          stroke="#ffd700" strokeWidth="1.5" opacity="0.3"
        />
      ))}
      {/* Corps */}
      <Ellipse cx="58" cy="73" rx="30" ry="24" fill="#339900"/>
      <Ellipse cx="58" cy="77" rx="19" ry="15" fill="#ccff88"/>
      {/* Tête */}
      <Ellipse cx="58" cy="53" rx="26" ry="23" fill="#44aa22"/>
      <Ellipse cx="48" cy="44" rx="11" ry="8" fill="#77dd44" opacity="0.4"/>
      {/* Petite couronne florale */}
      {[0,72,144,216,288].map((deg,i)=>{
        const rad=deg*Math.PI/180, x=58+10*Math.cos(rad), y=36+10*Math.sin(rad);
        return <Circle key={i} cx={x} cy={y} r="4" fill={i%2===0?"#ffcc00":"#ff8844"}/>;
      })}
      <Circle cx="58" cy="36" r="5" fill="#ffee44"/>
      {/* Joues */}
      <Ellipse cx="38" cy="58" rx="7" ry="5" fill="#88ee44" opacity="0.45"/>
      <Ellipse cx="78" cy="58" rx="7" ry="5" fill="#88ee44" opacity="0.45"/>
      {/* Yeux doux lumineux */}
      <Ellipse cx="47" cy="52" rx="7.5" ry="8" fill="#112200"/>
      <Ellipse cx="47" cy="52" rx="5" ry="5.5" fill="#22aa00"/>
      <Ellipse cx="47" cy="52" rx="2.2" ry="2.5" fill="#080f00"/>
      <Ellipse cx="45.5" cy="50.5" rx="1.5" ry="1.8" fill="white" opacity="0.9"/>
      <Circle cx="49" cy="54" r="1" fill="#88ff44" opacity="0.6"/>
      <Ellipse cx="69" cy="52" rx="7.5" ry="8" fill="#112200"/>
      <Ellipse cx="69" cy="52" rx="5" ry="5.5" fill="#22aa00"/>
      <Ellipse cx="69" cy="52" rx="2.2" ry="2.5" fill="#080f00"/>
      <Ellipse cx="67.5" cy="50.5" rx="1.5" ry="1.8" fill="white" opacity="0.9"/>
      {/* Bouche */}
      <Path d="M51 62 Q58 68 65 62" stroke="#226600" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Pieds */}
      <Ellipse cx="44" cy="93" rx="10" ry="6" fill="#339900"/>
      <Ellipse cx="72" cy="93" rx="10" ry="6" fill="#339900"/>
    </Svg>
  );
}

export function GlacirathSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle, Rect } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura glace */}
      <Circle cx="58" cy="60" r="48" fill="#55bbff" opacity="0.07"/>
      {/* Cristaux orbitaux */}
      <Polygon points="18,25 22,10 26,25 22,36" fill="#aaddff" opacity="0.8"/>
      <Polygon points="96,30 100,15 104,30 100,41" fill="#88ccff" opacity="0.8"/>
      <Polygon points="12,60 16,48 20,60 16,70" fill="#aaddff" opacity="0.7"/>
      <Polygon points="98,65 102,54 106,65 102,74" fill="#88ccff" opacity="0.7"/>
      {/* Grands bras rocheux */}
      <Rect x="6" y="58" width="22" height="28" rx="8" fill="#3388aa"/>
      <Rect x="88" y="58" width="22" height="28" rx="8" fill="#3388aa"/>
      {/* Griffes glace */}
      <Polygon points="8,84 4,92 10,86" fill="#aaddff"/>
      <Polygon points="16,86 12,94 18,88" fill="#aaddff"/>
      <Polygon points="98,84 102,92 96,86" fill="#aaddff"/>
      <Polygon points="106,86 110,94 104,88" fill="#aaddff"/>
      {/* Corps massif carré */}
      <Rect x="18" y="52" width="76" height="46" rx="10" fill="#2266aa"/>
      <Rect x="22" y="56" width="68" height="38" rx="8" fill="#4488bb"/>
      {/* Armure cristaux */}
      <Polygon points="28,60 34,48 40,60" fill="#88ddff" opacity="0.6"/>
      <Polygon points="44,58 50,44 56,58" fill="#aaeeff" opacity="0.6"/>
      <Polygon points="60,58 66,44 72,58" fill="#88ddff" opacity="0.6"/>
      <Polygon points="76,60 82,48 88,60" fill="#aaeeff" opacity="0.5"/>
      {/* Cristaux sur crâne */}
      <Polygon points="40,28 44,10 48,28" fill="#aaeeff" opacity="0.9"/>
      <Polygon points="48,24 52,6 56,24" fill="#88ddff" opacity="0.95"/>
      <Polygon points="55,22 59,4 63,22" fill="#aaeeff" opacity="0.95"/>
      <Polygon points="63,24 67,8 71,24" fill="#88ddff" opacity="0.9"/>
      {/* Tête massive */}
      <Rect x="24" y="24" width="68" height="54" rx="12" fill="#2277bb"/>
      <Rect x="28" y="28" width="60" height="46" rx="10" fill="#3388cc"/>
      {/* Texture glacée */}
      <Ellipse cx="40" cy="60" r="6" fill="#1155aa" opacity="0.4"/>
      <Ellipse cx="76" cy="56" r="7" fill="#1155aa" opacity="0.3"/>
      <Ellipse cx="58" cy="68" r="5" fill="#1155aa" opacity="0.3"/>
      {/* Sourcils glacés */}
      <Rect x="30" y="38" width="20" height="6" rx="3" fill="#0a2233"/>
      <Rect x="66" y="38" width="20" height="6" rx="3" fill="#0a2233"/>
      {/* Yeux perçants */}
      <Ellipse cx="42" cy="50" rx="7" ry="6.5" fill="#001122"/>
      <Ellipse cx="42" cy="50" rx="4.5" ry="4.5" fill="#0055aa"/>
      <Ellipse cx="42" cy="50" rx="2" ry="2.2" fill="#000811"/>
      <Ellipse cx="40.5" cy="48.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      <Ellipse cx="74" cy="50" rx="7" ry="6.5" fill="#001122"/>
      <Ellipse cx="74" cy="50" rx="4.5" ry="4.5" fill="#0055aa"/>
      <Ellipse cx="74" cy="50" rx="2" ry="2.2" fill="#000811"/>
      <Ellipse cx="72.5" cy="48.5" rx="1.4" ry="1.6" fill="white" opacity="0.9"/>
      {/* Nez large */}
      <Ellipse cx="58" cy="60" rx="7" ry="4" fill="#113355"/>
      <Circle cx="54" cy="60" r="2.5" fill="#0a2233"/>
      <Circle cx="62" cy="60" r="2.5" fill="#0a2233"/>
      {/* Bouche */}
      <Path d="M48 67 Q58 64 68 67" stroke="#0a2233" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </Svg>
  );
}

export function VoltarisSprite({ size = 90 }) {
  const S = require('react-native-svg');
  const Svg = S.default, { Ellipse, Path, Polygon, Circle } = S;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      {/* Aura cosmique électrique */}
      <Circle cx="58" cy="55" r="50" fill="#ffcc00" opacity="0.08"/>
      <Circle cx="58" cy="55" r="38" fill="#ff8800" opacity="0.05"/>
      {/* Éclairs cosmiques */}
      <Path d="M15 25 L22 38 L18 38 L25 52" stroke="#ffcc00" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <Path d="M95 20 L88 34 L92 34 L85 48" stroke="#ffcc00" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <Path d="M52 6 L56 18 L53 18 L57 30" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9"/>
      <Path d="M64 8 L60 20 L63 20 L59 32" stroke="#ffcc00" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
      {/* Anneaux orbitaux d éclairs */}
      <Ellipse cx="58" cy="25" rx="32" ry="9" fill="none" stroke="#ffcc00" strokeWidth="1.5" opacity="0.4"/>
      {/* Grandes ailes tempête */}
      <Path d="M30 55 Q6 28 10 6 Q26 22 34 52Z" fill="#886600" opacity="0.85"/>
      <Path d="M32 53 Q10 28 16 8 Q28 24 36 50Z" fill="#ffcc00" opacity="0.4"/>
      <Path d="M86 55 Q110 28 106 6 Q90 22 82 52Z" fill="#886600" opacity="0.85"/>
      <Path d="M84 53 Q106 28 100 8 Q88 24 80 50Z" fill="#ffcc00" opacity="0.4"/>
      {/* Traits éclair sur ailes */}
      <Path d="M30 55 Q20 42 24 24 Q27 38 32 52" stroke="#ffee00" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <Path d="M86 55 Q96 42 92 24 Q89 38 84 52" stroke="#ffee00" strokeWidth="1.5" fill="none" opacity="0.6"/>
      {/* Queue éclair cosmique */}
      <Polygon points="14,72 20,55 26,68 32,52 26,65 32,58 22,78" fill="#ffcc00"/>
      <Polygon points="16,70 20,57 25,68 30,54 25,65 30,60 20,76" fill="#ffee88" opacity="0.5"/>
      {/* Corps svelte puissant */}
      <Ellipse cx="58" cy="74" rx="30" ry="24" fill="#aa8800"/>
      <Ellipse cx="58" cy="78" rx="20" ry="15" fill="#ffffaa"/>
      {/* Rayures cosmiques */}
      <Path d="M40 68 L46 60 L52 68 L58 60 L64 68 L70 60" stroke="#ffcc00" strokeWidth="2" fill="none" opacity="0.6"/>
      {/* Oreilles éclairs */}
      <Polygon points="38,38 32,14 48,36" fill="#aa8800"/>
      <Path d="M38 34 L42 22 L40 22 L44 12" stroke="#ffcc00" strokeWidth="1.5" fill="none"/>
      <Polygon points="78,38 84,14 68,36" fill="#aa8800"/>
      <Path d="M78 34 L74 22 L76 22 L72 12" stroke="#ffcc00" strokeWidth="1.5" fill="none"/>
      {/* Tête */}
      <Ellipse cx="58" cy="52" rx="26" ry="23" fill="#bb9900"/>
      <Ellipse cx="48" cy="43" rx="11" ry="8" fill="#eecc44" opacity="0.4"/>
      {/* Éclairs sur front */}
      <Path d="M48 36 L52 44 L49 44 L53 52" stroke="#ffee00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <Path d="M64 36 L60 44 L63 44 L59 52" stroke="#ffee00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Joues cosmiques */}
      <Ellipse cx="38" cy="57" rx="8" ry="5" fill="#ffcc00" opacity="0.5"/>
      <Ellipse cx="78" cy="57" rx="8" ry="5" fill="#ffcc00" opacity="0.5"/>
      <Circle cx="36" cy="56" r="2" fill="#ffee88" opacity="0.8"/>
      <Circle cx="80" cy="56" r="2" fill="#ffee88" opacity="0.8"/>
      {/* Étoiles cosmiques sur joues */}
      <Circle cx="42" cy="60" r="1.5" fill="#ffffff" opacity="0.6"/>
      <Circle cx="74" cy="60" r="1.5" fill="#ffffff" opacity="0.6"/>
      {/* Yeux cosmiques */}
      <Ellipse cx="47" cy="51" rx="8" ry="8.5" fill="#110800"/>
      <Ellipse cx="47" cy="51" rx="5.5" ry="6" fill="#886600"/>
      <Ellipse cx="47" cy="51" rx="2.5" ry="3" fill="#060400"/>
      <Ellipse cx="45.5" cy="49.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      <Circle cx="49" cy="53" r="1.2" fill="#ffcc00" opacity="0.7"/>
      <Ellipse cx="69" cy="51" rx="8" ry="8.5" fill="#110800"/>
      <Ellipse cx="69" cy="51" rx="5.5" ry="6" fill="#886600"/>
      <Ellipse cx="69" cy="51" rx="2.5" ry="3" fill="#060400"/>
      <Ellipse cx="67.5" cy="49.5" rx="1.8" ry="2" fill="white" opacity="0.95"/>
      {/* Bouche */}
      <Path d="M50 64 Q58 71 66 64" stroke="#664400" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Pieds rapides */}
      <Ellipse cx="44" cy="94" rx="11" ry="6" fill="#aa8800"/>
      <Ellipse cx="72" cy="94" rx="11" ry="6" fill="#aa8800"/>
    </Svg>
  );
}
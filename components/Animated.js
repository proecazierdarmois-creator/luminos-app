// components/Animated.js — Composants animés réutilisables
import React, { useRef, useEffect } from 'react';
import {
  Animated, TouchableOpacity, View, Text, StyleSheet, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');

// ─── 1. BOUTON ANIMÉ ─────────────────────────────────────────────
// Remplace TouchableOpacity partout — effet de scale + glow au press
export function AnimatedButton({
  onPress, children, style, colors, disabled, glowColor = '#00e5ff',
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    Animated.parallel([
      Animated.spring(scale, { toValue:0.95, friction:5, useNativeDriver:true }),
      Animated.timing(glow,  { toValue:1, duration:100, useNativeDriver:false }),
    ]).start();
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.spring(scale, { toValue:1, friction:4, useNativeDriver:true }),
      Animated.timing(glow,  { toValue:0, duration:200, useNativeDriver:false }),
    ]).start();
  }

  const shadowColor = glow.interpolate({
    inputRange:[0,1], outputRange:['transparent', glowColor],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[
        style,
        { transform:[{scale}], shadowColor:glowColor, shadowRadius:glow.interpolate({inputRange:[0,1],outputRange:[0,12]}), shadowOpacity:glow, elevation:8 },
        disabled && {opacity:0.4},
      ]}>
        {colors
          ? <LinearGradient colors={colors} style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:1,y:0}}/>
          : null
        }
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── 2. CARTE ANIMÉE ─────────────────────────────────────────────
// Apparition en fade+slide depuis le bas, avec scale au press
export function AnimatedCard({
  onPress, children, style, delay = 0, disabled = false,
}) {
  const scale    = useRef(new Animated.Value(1)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue:1, duration:400, useNativeDriver:true }),
        Animated.spring(translateY, { toValue:0, friction:6,   useNativeDriver:true }),
      ]).start();
    }, delay);
  }, []);

  function handlePressIn() {
    Animated.spring(scale, { toValue:0.97, friction:5, useNativeDriver:true }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue:1, friction:4, useNativeDriver:true }).start();
  }

  if (!onPress) {
    return (
      <Animated.View style={[style, { opacity, transform:[{translateY},{scale}] }]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[style, { opacity, transform:[{translateY},{scale}] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── 3. CARTE CRÉATURE ANIMÉE ────────────────────────────────────
// Float + shimmer + glow au hover
export function AnimatedCreatureCard({ children, color = '#00e5ff', style }) {
  const float   = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue:-8, duration:2000, useNativeDriver:true }),
        Animated.timing(float, { toValue:0,  duration:2000, useNativeDriver:true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue:1, duration:1200, useNativeDriver:true }),
        Animated.timing(shimmer, { toValue:0, duration:1200, useNativeDriver:true }),
      ])
    ).start();
  }, []);

  function handlePressIn() {
    Animated.spring(scale, { toValue:1.06, friction:3, useNativeDriver:true }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue:1, friction:4, useNativeDriver:true }).start();
  }

  return (
    <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
      <Animated.View style={[style, { transform:[{translateY:float},{scale}] }]}>
        {/* Shimmer overlay */}
        <Animated.View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:color,
            opacity:shimmer.interpolate({inputRange:[0,1],outputRange:[0,0.06]}),
            borderRadius:16,
          }
        ]}/>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── 4. TRANSITION D'ÉCRAN ───────────────────────────────────────
// Wrapper pour faire apparaître un écran avec fade+slide
export function ScreenTransition({ children, style }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue:1, duration:500, useNativeDriver:true }),
      Animated.spring(translateY, { toValue:0, friction:8,   useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style||{flex:1}, { opacity, transform:[{translateY}] }]}>
      {children}
    </Animated.View>
  );
}

// ─── 5. BADGE PULSANT ────────────────────────────────────────────
// Badge qui pulse pour attirer l'attention
export function PulseBadge({ children, color = '#ff4fa3', style }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale,   { toValue:1.12, friction:3, useNativeDriver:true }),
          Animated.timing(opacity, { toValue:0.8,  duration:400, useNativeDriver:true }),
        ]),
        Animated.parallel([
          Animated.spring(scale,   { toValue:1, friction:5, useNativeDriver:true }),
          Animated.timing(opacity, { toValue:1, duration:400, useNativeDriver:true }),
        ]),
        Animated.delay(1500),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { transform:[{scale}], opacity }]}>
      {children}
    </Animated.View>
  );
}

// ─── 6. COMPTEUR ANIMÉ ───────────────────────────────────────────
// Nombre qui s'incrémente avec animation
export function AnimatedNumber({ value, color = '#fff', fontSize = 24, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = React.useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue:value, duration:800, useNativeDriver:false }).start();
    const listener = anim.addListener(({ value: v }) => setDisplayed(Math.round(v)));
    return () => anim.removeListener(listener);
  }, [value]);

  return (
    <Text style={[style, { fontSize, fontWeight:'900', color }]}>
      {displayed.toLocaleString()}
    </Text>
  );
}

// ─── 7. LISTE ANIMÉE ─────────────────────────────────────────────
// Chaque item apparaît avec un délai en cascade
export function AnimatedListItem({ children, index = 0, style }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue:1, duration:300, useNativeDriver:true }),
        Animated.spring(translateX, { toValue:0, friction:7,   useNativeDriver:true }),
      ]).start();
    }, index * 60);
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform:[{translateX}] }]}>
      {children}
    </Animated.View>
  );
}

// ─── 8. TOAST NOTIFICATION ───────────────────────────────────────
// Notification qui apparaît en haut et disparaît
export function Toast({ message, visible, color = '#39ff8f' }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue:0,  friction:6, useNativeDriver:true }),
        Animated.timing(opacity,    { toValue:1, duration:200, useNativeDriver:true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue:-80, duration:300, useNativeDriver:true }),
        Animated.timing(opacity,    { toValue:0,   duration:300, useNativeDriver:true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[
      styles.toast,
      { borderColor:color+'44', backgroundColor:color+'22', transform:[{translateY}], opacity },
    ]}>
      <Text style={[styles.toastText, { color }]}>{message}</Text>
    </Animated.View>
  );
}

// ─── 9. SHIMMER LOADING ──────────────────────────────────────────
// Placeholder animé pendant le chargement
export function ShimmerBox({ width, height, borderRadius = 8 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue:1, duration:800, useNativeDriver:true }),
        Animated.timing(anim, { toValue:0, duration:800, useNativeDriver:true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      width, height, borderRadius,
      backgroundColor:'#1e2d4a',
      opacity:anim.interpolate({ inputRange:[0,1], outputRange:[0.4,0.8] }),
    }}/>
  );
}

// ─── 10. RIPPLE BUTTON ───────────────────────────────────────────
// Bouton avec effet ripple au centre
export function RippleButton({ onPress, children, style, color = '#ffffff' }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const btnScale= useRef(new Animated.Value(1)).current;

  function handlePress() {
    scale.setValue(0);
    opacity.setValue(0.4);
    Animated.parallel([
      Animated.timing(scale,    { toValue:1.5, duration:400, useNativeDriver:true }),
      Animated.timing(opacity,  { toValue:0,   duration:400, useNativeDriver:true }),
      Animated.sequence([
        Animated.spring(btnScale, { toValue:0.96, friction:5, useNativeDriver:true }),
        Animated.spring(btnScale, { toValue:1,    friction:4, useNativeDriver:true }),
      ]),
    ]).start();
    onPress?.();
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={[style,{overflow:'hidden'}]}>
      <Animated.View style={[StyleSheet.absoluteFill, {
        backgroundColor:color,
        opacity, transform:[{scale}],
        borderRadius:999,
      }]}/>
      <Animated.View style={{ transform:[{scale:btnScale}] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toast:{
    position:'absolute', top:16, left:24, right:24, zIndex:999,
    borderWidth:1, borderRadius:14, padding:14, alignItems:'center',
    shadowColor:'#000', shadowOpacity:0.3, shadowRadius:10, elevation:10,
  },
  toastText:{ fontSize:13, fontWeight:'800', letterSpacing:1 },
});
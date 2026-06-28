// screens/AuthScreen.js — Écran de connexion amélioré
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Path, Polygon, Circle, G } from 'react-native-svg';
import { useAuth } from '../store/AuthContext';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Étoiles animées ──────────────────────────────────────────────
function Stars() {
  const stars = Array.from({length:30}, (_,i) => ({
    x: Math.random()*SW,
    y: Math.random()*(SH*0.5),
    size: 1+Math.random()*2.5,
    delay: Math.random()*3000,
    duration: 1500+Math.random()*2000,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s,i) => <Star key={i} {...s}/>)}
    </View>
  );
}

function Star({ x, y, size, delay, duration }) {
  const anim = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue:1,   duration, useNativeDriver:true }),
          Animated.timing(anim, { toValue:0.2, duration, useNativeDriver:true }),
        ])
      ).start();
    }, delay);
  }, []);
  return (
    <Animated.View style={{
      position:'absolute', left:x, top:y,
      width:size, height:size, borderRadius:size/2,
      backgroundColor:'white', opacity:anim,
    }}/>
  );
}

// ─── Particules de lumière ────────────────────────────────────────
function FloatingOrb({ x, y, color, size, duration, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue:1, duration, useNativeDriver:true }),
          Animated.timing(anim, { toValue:0, duration, useNativeDriver:true }),
        ])
      ).start();
    }, delay);
  }, []);
  return (
    <Animated.View style={{
      position:'absolute', left:x, top:y,
      width:size, height:size, borderRadius:size/2,
      backgroundColor:color,
      opacity: anim.interpolate({inputRange:[0,0.5,1],outputRange:[0,0.6,0]}),
      transform:[{
        translateY: anim.interpolate({inputRange:[0,1],outputRange:[0,-40]}),
      },{
        scale: anim.interpolate({inputRange:[0,0.5,1],outputRange:[0.5,1.2,0.5]}),
      }],
    }}/>
  );
}

// ─── Logo Luminos animé ───────────────────────────────────────────
function LuminosLogo() {
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Apparition
    Animated.spring(scaleAnim, { toValue:1, friction:4, tension:40, useNativeDriver:true }).start();

    // Flottement
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue:-12, duration:2000, useNativeDriver:true }),
        Animated.timing(floatAnim, { toValue:0,   duration:2000, useNativeDriver:true }),
      ])
    ).start();

    // Rotation lente de l'anneau
    Animated.loop(
      Animated.timing(rotateAnim, { toValue:1, duration:8000, useNativeDriver:true })
    ).start();

    // Glow pulsant
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue:1, duration:1500, useNativeDriver:true }),
        Animated.timing(glowAnim, { toValue:0, duration:1500, useNativeDriver:true }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});

  return (
    <Animated.View style={{
      alignItems:'center',
      transform:[{translateY:floatAnim},{scale:scaleAnim}],
    }}>
      {/* Glow externe */}
      <Animated.View style={{
        position:'absolute',
        width:160, height:160, borderRadius:80,
        backgroundColor:'#00e5ff',
        opacity: glowAnim.interpolate({inputRange:[0,1],outputRange:[0.05,0.15]}),
        transform:[{scale: glowAnim.interpolate({inputRange:[0,1],outputRange:[0.8,1.3]})}],
      }}/>

      {/* Anneau tournant */}
      <Animated.View style={{
        position:'absolute',
        width:130, height:130, borderRadius:65,
        borderWidth:1.5, borderColor:'#00e5ff44',
        transform:[{rotate}],
      }}>
        {/* Points sur l'anneau */}
        {[0,90,180,270].map((deg,i) => (
          <View key={i} style={{
            position:'absolute',
            width:6, height:6, borderRadius:3,
            backgroundColor: i===0?'#00e5ff':i===1?'#bf5fff':i===2?'#ffd700':'#39ff8f',
            top: 62+Math.cos(deg*Math.PI/180)*62,
            left: 62+Math.sin(deg*Math.PI/180)*62,
          }}/>
        ))}
      </Animated.View>

      {/* Sprite Lumikos */}
      <Svg width={110} height={110} viewBox="0 0 110 110">
        <Ellipse cx="20" cy="72" rx="9" ry="6" fill="#a0d8ef" transform="rotate(-25 20 72)" />
        <Ellipse cx="12" cy="78" rx="6" ry="4" fill="#7ee8fa" />
        <Ellipse cx="58" cy="72" rx="30" ry="26" fill="#a0d8ef" />
        <Ellipse cx="58" cy="76" rx="18" ry="15" fill="#e8f8ff" />
        <Ellipse cx="39" cy="43" rx="8" ry="13" fill="#a0d8ef" transform="rotate(-20 39 43)" />
        <Ellipse cx="40" cy="43" rx="4" ry="8" fill="#7ee8fa" opacity="0.9" transform="rotate(-20 40 43)" />
        <Ellipse cx="77" cy="43" rx="8" ry="13" fill="#a0d8ef" transform="rotate(20 77 43)" />
        <Ellipse cx="76" cy="43" rx="4" ry="8" fill="#7ee8fa" opacity="0.9" transform="rotate(20 76 43)" />
        <Ellipse cx="58" cy="54" rx="25" ry="22" fill="#b8e8f8" />
        <Polygon points="58,39 63,46 58,49 53,46" fill="#7ee8fa" />
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
    </Animated.View>
  );
}

// ─── AuthScreen ───────────────────────────────────────────────────
export default function AuthScreen() {
  const { signInEmail, signUpEmail, signInGoogle, signInGithub, error, setError } = useAuth();
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [focusedInput, setFocusedInput]   = useState(null);

  const formAnim  = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(titleAnim, { toValue:1, friction:5, useNativeDriver:true }),
        Animated.timing(formAnim, { toValue:1, duration:600, useNativeDriver:true }),
      ]),
    ]).start();
  }, []);

  const orbs = [
    {x:20,  y:80,  color:'#00e5ff', size:20, duration:3000, delay:0},
    {x:SW-40, y:120, color:'#bf5fff', size:16, duration:3500, delay:500},
    {x:SW/2-10, y:60, color:'#ffd700', size:12, duration:2800, delay:1000},
    {x:40,  y:200, color:'#39ff8f', size:14, duration:4000, delay:1500},
    {x:SW-60, y:250, color:'#ff4fa3', size:10, duration:3200, delay:800},
  ];

  async function handleSubmit() {
    if (loading) return;
    setLoading(true); setError(null);
    if (mode==='login') {
      await signInEmail(email.trim(), password);
    } else {
      if (!name.trim()) { setError('Entre ton nom de joueur.'); setLoading(false); return; }
      await signUpEmail(email.trim(), password, name.trim());
    }
    setLoading(false);
  }

  async function handleGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true); await signInGoogle(); setGoogleLoading(false);
  }

  async function handleGithub() {
    if (githubLoading) return;
    setGithubLoading(true); await signInGithub(); setGithubLoading(false);
  }

  return (
    <LinearGradient colors={['#04060d','#07090f','#0a0d18']} style={styles.container}>
      {/* Étoiles */}
      <Stars/>

      {/* Orbes flottants */}
      {orbs.map((o,i) => <FloatingOrb key={i} {...o}/>)}

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={styles.kav}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo animé */}
            <Animated.View style={{
              alignItems:'center', gap:12, marginBottom:8,
              opacity: titleAnim,
              transform:[{translateY: titleAnim.interpolate({inputRange:[0,1],outputRange:[-30,0]})}],
            }}>
              <LuminosLogo/>
              <Text style={styles.gameTitle}>LUMINOS</Text>
              <View style={styles.taglineRow}>
                {['Collect','·','Evolve','·','Illuminate'].map((w,i)=>(
                  <Text key={i} style={[styles.taglineWord,w==='·'&&{color:'#1e2d4a'}]}>{w}</Text>
                ))}
              </View>
            </Animated.View>

            {/* Formulaire */}
            <Animated.View style={{
              width:'100%', gap:16,
              opacity: formAnim,
              transform:[{translateY: formAnim.interpolate({inputRange:[0,1],outputRange:[40,0]})}],
            }}>

              {/* Tab switcher */}
              <View style={styles.tabRow}>
                {['login','signup'].map(m=>(
                  <TouchableOpacity key={m} onPress={()=>{setMode(m);setError(null);}}
                    style={[styles.tabBtn,mode===m&&styles.tabActive]}>
                    <Text style={[styles.tabText,mode===m&&styles.tabTextActive]}>
                      {m==='login'?'CONNEXION':'INSCRIPTION'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Champs */}
              <View style={styles.form}>
                {mode==='signup' && (
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>✦ NOM DE JOUEUR</Text>
                    <TextInput
                      style={[styles.input,focusedInput==='name'&&styles.inputFocused]}
                      value={name} onChangeText={setName}
                      placeholder="Ex: LuminosMaster42"
                      placeholderTextColor="#2a3a50"
                      autoCapitalize="words" maxLength={20}
                      onFocus={()=>setFocusedInput('name')}
                      onBlur={()=>setFocusedInput(null)}
                    />
                  </View>
                )}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>✉ EMAIL</Text>
                  <TextInput
                    style={[styles.input,focusedInput==='email'&&styles.inputFocused]}
                    value={email} onChangeText={setEmail}
                    placeholder="ton@email.com"
                    placeholderTextColor="#2a3a50"
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                    onFocus={()=>setFocusedInput('email')}
                    onBlur={()=>setFocusedInput(null)}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>🔒 MOT DE PASSE</Text>
                  <TextInput
                    style={[styles.input,focusedInput==='pass'&&styles.inputFocused]}
                    value={password} onChangeText={setPassword}
                    placeholder="6 caractères minimum"
                    placeholderTextColor="#2a3a50"
                    secureTextEntry
                    onFocus={()=>setFocusedInput('pass')}
                    onBlur={()=>setFocusedInput(null)}
                  />
                </View>

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ {error}</Text>
                  </View>
                )}

                {/* Bouton principal */}
                <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitBtn}>
                  <LinearGradient
                    colors={loading?['#1e2d4a','#1e2d4a']:['#00e5ff44','#bf5fff44']}
                    start={{x:0,y:0}} end={{x:1,y:0}}
                    style={styles.submitGrad}
                  >
                    <Text style={[styles.submitText,loading&&{color:'#4a6080'}]}>
                      {loading ? '⟳ Chargement...' : mode==='login' ? '→ SE CONNECTER' : '→ CRÉER MON COMPTE'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Séparateur */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine}/>
                  <Text style={styles.dividerText}>ou continuer avec</Text>
                  <View style={styles.dividerLine}/>
                </View>

                {/* Google */}
                <TouchableOpacity onPress={handleGoogle} disabled={googleLoading} style={styles.googleBtn}>
                  <View style={styles.socialBtnInner}>
                    <Svg width={18} height={18} viewBox="0 0 24 24">
                      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </Svg>
                    <Text style={styles.googleText}>
                      {googleLoading ? 'Connexion...' : 'Google'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* GitHub */}
                <TouchableOpacity onPress={handleGithub} disabled={githubLoading} style={styles.githubBtn}>
                  <View style={styles.socialBtnInner}>
                    <Svg width={18} height={18} viewBox="0 0 24 24">
                      <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" fill="white"/>
                    </Svg>
                    <Text style={styles.githubText}>
                      {githubLoading ? 'Connexion...' : 'GitHub'}
                    </Text>
                  </View>
                </TouchableOpacity>

              </View>
            </Animated.View>

            <Text style={styles.footer}>
              En continuant, tu acceptes les règles du jeu LUMINOS ✦
            </Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1},
  safe:{flex:1},
  kav:{flex:1},
  scroll:{alignItems:'center',paddingHorizontal:24,paddingVertical:32,gap:20},
  gameTitle:{
    fontSize:42,fontWeight:'900',color:'#fff',letterSpacing:14,
    textShadowColor:'#00e5ff44',textShadowOffset:{width:0,height:0},textShadowRadius:20,
  },
  taglineRow:{flexDirection:'row',gap:6},
  taglineWord:{fontSize:11,color:'#4a6080',letterSpacing:2,fontWeight:'600'},
  tabRow:{
    flexDirection:'row',width:'100%',
    backgroundColor:'#0a0f1a',borderWidth:1,borderColor:'#1e2d4a',
    borderRadius:16,padding:4,gap:4,
  },
  tabBtn:{flex:1,alignItems:'center',paddingVertical:12,borderRadius:12},
  tabActive:{backgroundColor:'#00e5ff15',borderWidth:1,borderColor:'#00e5ff33'},
  tabText:{color:'#4a6080',fontSize:11,fontWeight:'800',letterSpacing:2},
  tabTextActive:{color:'#00e5ff'},
  form:{width:'100%',gap:14},
  inputWrap:{gap:6},
  inputLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700'},
  input:{
    backgroundColor:'#080c14',borderWidth:1,borderColor:'#1e2d4a',
    borderRadius:14,paddingHorizontal:16,paddingVertical:15,
    color:'#fff',fontSize:15,
  },
  inputFocused:{borderColor:'#00e5ff55',backgroundColor:'#0a1220'},
  errorBox:{backgroundColor:'#ff444418',borderWidth:1,borderColor:'#ff444444',borderRadius:12,padding:12},
  errorText:{color:'#ff6666',fontSize:13,textAlign:'center'},
  submitBtn:{borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#00e5ff22'},
  submitGrad:{alignItems:'center',paddingVertical:18},
  submitText:{color:'#00e5ff',fontSize:15,fontWeight:'900',letterSpacing:3},
  divider:{flexDirection:'row',alignItems:'center',gap:12},
  dividerLine:{flex:1,height:1,backgroundColor:'#1e2d4a'},
  dividerText:{color:'#4a6080',fontSize:11,whiteSpace:'nowrap'},
  googleBtn:{backgroundColor:'#fff',borderRadius:14,overflow:'hidden'},
  githubBtn:{backgroundColor:'#161b22',borderRadius:14,overflow:'hidden',borderWidth:1,borderColor:'#30363d'},
  socialBtnInner:{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:14,gap:10},
  googleText:{color:'#333',fontSize:14,fontWeight:'700'},
  githubText:{color:'#fff',fontSize:14,fontWeight:'700'},
  footer:{color:'#2a3a50',fontSize:10,textAlign:'center',lineHeight:16,marginTop:8},
});
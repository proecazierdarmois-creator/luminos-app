// screens/NotifSettingsScreen.js — Paramètres notifications
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated, Switch, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import {
  registerPushToken, saveNotifPrefs, getNotifPrefs,
  sendLocalNotification,
} from '../store/notificationService';

const NOTIF_TYPES = [
  { id:'eclipse',    emoji:'🌑', title:'Éclipse',         desc:'Alerte quand une Éclipse commence' },
  { id:'tournament', emoji:'🏆', title:'Tournoi',          desc:'Résultat et récompenses du tournoi' },
  { id:'reward',     emoji:'🎁', title:'Récompenses',      desc:'Rappel si des récompenses t\'attendent' },
  { id:'guild',      emoji:'⚔️', title:'Défis de guilde', desc:'Nouveau défi disponible dans ta guilde' },
];

export default function NotifSettingsScreen() {
  const navigation = useNavigation();
  const authCtx = useAuth();
  const uid = authCtx?.user?.uid || 'guest';

  const [prefs, setPrefs]         = useState({ eclipse:true, tournament:true, reward:true, guild:true });
  const [token, setToken]         = useState(null);
  const [permStatus, setPermStatus] = useState('unknown');
  const [saving, setSaving]       = useState(false);
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleAnim, { toValue:1, duration:500, useNativeDriver:true }).start();
    getNotifPrefs(uid).then(setPrefs);
    if (Platform.OS !== 'web') {
      registerPushToken(uid).then(t => {
        setToken(t);
        setPermStatus(t ? 'granted' : 'denied');
      });
    } else {
      setPermStatus('web');
    }
  }, []);

  async function handleToggle(id) {
    const newPrefs = { ...prefs, [id]: !prefs[id] };
    setPrefs(newPrefs);
    setSaving(true);
    await saveNotifPrefs(uid, newPrefs);
    setSaving(false);
  }

  async function handleTestNotif() {
    await sendLocalNotification({
      title: '🔔 Test LUMINOS',
      body: 'Les notifications fonctionnent correctement !',
    });
  }

  const statusColor = permStatus === 'granted' ? '#39ff8f' : permStatus === 'web' ? '#ffd700' : '#ff4444';
  const statusLabel = permStatus === 'granted' ? '✓ Activées' : permStatus === 'web' ? '⚠ Web — limité' : '✕ Refusées';
  const statusDesc  = permStatus === 'granted'
    ? 'Tu recevras les notifications push sur cet appareil.'
    : permStatus === 'web'
    ? 'Les notifications web sont limitées. Pour les notifs complètes, utilise l\'app Android.'
    : 'Tu as refusé les notifications. Modifie les permissions dans les paramètres de ton appareil.';

  return (
    <LinearGradient colors={['#07090f','#0d1220','#07090f']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>

        <Animated.Text style={[styles.title, {
          opacity: titleAnim,
          transform: [{ translateY: titleAnim.interpolate({ inputRange:[0,1], outputRange:[-16,0] }) }],
        }]}>🔔 NOTIFICATIONS</Animated.Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Statut permission */}
          <LinearGradient
            colors={permStatus==='granted'?['#0a1a0a','#07090f']:permStatus==='web'?['#1a1000','#07090f']:['#1a0000','#07090f']}
            style={[styles.statusCard, { borderColor: statusColor+'44' }]}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
            <Text style={styles.statusDesc}>{statusDesc}</Text>
            {permStatus === 'denied' && (
              <Text style={styles.statusHint}>
                iOS/Android : Réglages → LUMINOS → Notifications{'\n'}
                Puis relance l'app.
              </Text>
            )}
          </LinearGradient>

          {/* Préférences */}
          <Text style={styles.sectionLabel}>PRÉFÉRENCES</Text>
          {NOTIF_TYPES.map(n => (
            <LinearGradient key={n.id} colors={['#0d1220','#07090f']}
              style={[styles.notifRow, { borderColor: prefs[n.id] ? '#00e5ff22' : '#1e2d4a' }]}>
              <Text style={styles.notifEmoji}>{n.emoji}</Text>
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifDesc}>{n.desc}</Text>
              </View>
              <Switch
                value={prefs[n.id]}
                onValueChange={() => handleToggle(n.id)}
                trackColor={{ false:'#1e2d4a', true:'#00e5ff44' }}
                thumbColor={prefs[n.id] ? '#00e5ff' : '#4a6080'}
              />
            </LinearGradient>
          ))}

          {/* Test notif */}
          {permStatus === 'granted' && (
            <>
              <Text style={styles.sectionLabel}>TEST</Text>
              <TouchableOpacity onPress={handleTestNotif}
                style={[styles.testBtn, { borderColor:'#bf5fff44', backgroundColor:'#bf5fff15' }]}>
                <Text style={[styles.testBtnText, { color:'#bf5fff' }]}>🔔 Envoyer une notification test</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Token info */}
          {token && (
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>TOKEN PUSH</Text>
              <Text style={styles.tokenVal} numberOfLines={2}>{token}</Text>
            </View>
          )}

          {saving && <Text style={styles.savingText}>Sauvegarde...</Text>}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safe:{flex:1,paddingHorizontal:16},
  backBtn:{paddingTop:12,paddingBottom:4},
  backBtnText:{color:'#00e5ff',fontSize:14,fontWeight:'700'},
  title:{fontSize:20,fontWeight:'900',color:'#fff',letterSpacing:4,textAlign:'center',marginBottom:10},
  scroll:{gap:12,paddingBottom:32},
  // Status
  statusCard:{borderWidth:1.5,borderRadius:18,padding:16,gap:8},
  statusLabel:{fontSize:16,fontWeight:'900'},
  statusDesc:{color:'#6a84a0',fontSize:12,lineHeight:18},
  statusHint:{color:'#4a6080',fontSize:11,lineHeight:16,fontStyle:'italic'},
  // Section
  sectionLabel:{fontSize:9,color:'#4a6080',letterSpacing:3,fontWeight:'700'},
  // Notif row
  notifRow:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderRadius:16,padding:14},
  notifEmoji:{fontSize:24,width:36,textAlign:'center'},
  notifInfo:{flex:1,gap:3},
  notifTitle:{color:'#c8daf0',fontSize:14,fontWeight:'800'},
  notifDesc:{color:'#4a6080',fontSize:11,lineHeight:16},
  // Test
  testBtn:{borderWidth:1,borderRadius:14,padding:14,alignItems:'center'},
  testBtnText:{fontSize:13,fontWeight:'800'},
  // Token
  tokenBox:{backgroundColor:'#0d1220',borderWidth:1,borderColor:'#1e2d4a',borderRadius:12,padding:12,gap:4},
  tokenLabel:{fontSize:8,color:'#4a6080',letterSpacing:2,fontWeight:'700'},
  tokenVal:{color:'#2a4060',fontSize:9,fontFamily:'monospace'},
  savingText:{color:'#4a6080',fontSize:11,textAlign:'center',fontStyle:'italic'},
});
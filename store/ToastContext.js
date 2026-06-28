// store/ToastContext.js — Notifications globales
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');
const ToastContext = createContext(null);

const TOAST_TYPES = {
  success:    { color:'#39ff8f', bg:['#0a1a0a','#07090f'], emoji:'✓' },
  error:      { color:'#ff4444', bg:['#1a0000','#07090f'], emoji:'✕' },
  warning:    { color:'#ffd700', bg:['#1a1000','#07090f'], emoji:'⚠' },
  info:       { color:'#00e5ff', bg:['#0d1a2e','#07090f'], emoji:'ℹ' },
  reward:     { color:'#ffd700', bg:['#1a1000','#07090f'], emoji:'🎁' },
  tournament: { color:'#ffd700', bg:['#1a1000','#07090f'], emoji:'🏆' },
  quest:      { color:'#00e5ff', bg:['#0d1a2e','#07090f'], emoji:'📋' },
  guild:      { color:'#ff6b35', bg:['#180800','#07090f'], emoji:'⚔️' },
};

function Toast({ toast, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  const type = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  React.useEffect(()=>{
    Animated.parallel([
      Animated.spring(slideAnim,{toValue:0,friction:6,useNativeDriver:true}),
      Animated.timing(opacAnim,{toValue:1,duration:250,useNativeDriver:true}),
    ]).start();
    const timer = setTimeout(()=>dismiss(), toast.duration||3000);
    return ()=>clearTimeout(timer);
  },[]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideAnim,{toValue:-120,duration:250,useNativeDriver:true}),
      Animated.timing(opacAnim,{toValue:0,duration:250,useNativeDriver:true}),
    ]).start(()=>onDismiss(toast.id));
  }

  return (
    <Animated.View style={[styles.toastWrap,{
      transform:[{translateY:slideAnim}],
      opacity:opacAnim,
    }]}>
      <TouchableOpacity onPress={dismiss} activeOpacity={0.9}>
        <LinearGradient colors={type.bg} style={[styles.toast,{borderColor:type.color+'55'}]}>
          <View style={[styles.toastIcon,{backgroundColor:type.color+'22',borderColor:type.color+'44'}]}>
            <Text style={[styles.toastEmoji,{color:type.color}]}>{toast.emoji||type.emoji}</Text>
          </View>
          <View style={styles.toastContent}>
            <Text style={[styles.toastTitle,{color:type.color}]}>{toast.title}</Text>
            {toast.message&&<Text style={styles.toastMsg}>{toast.message}</Text>}
            {(toast.crystals||toast.xp)&&(
              <View style={styles.toastRewards}>
                {toast.crystals>0&&<Text style={styles.toastCrystals}>+{toast.crystals} 💎</Text>}
                {toast.xp>0&&<Text style={styles.toastXp}>+{toast.xp} XP</Text>}
              </View>
            )}
          </View>
          <TouchableOpacity onPress={dismiss} style={styles.toastClose}>
            <Text style={[styles.toastCloseText,{color:type.color+'88'}]}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((opts) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev=>[{id,...opts},...prev].slice(0,3));
    return id;
  },[]);

  const dismissToast = useCallback((id) => {
    setToasts(prev=>prev.filter(t=>t.id!==id));
  },[]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t,i)=>(
          <Toast key={t.id} toast={t} onDismiss={dismissToast}/>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  container:{position:'absolute',top:0,left:0,right:0,zIndex:9999,alignItems:'center',paddingTop:60,gap:8,pointerEvents:'box-none'},
  toastWrap:{width:SW-32,maxWidth:400},
  toast:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1.5,borderRadius:16,padding:12,shadowColor:'#000',shadowRadius:12,shadowOpacity:0.4,shadowOffset:{width:0,height:4}},
  toastIcon:{width:40,height:40,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},
  toastEmoji:{fontSize:18,fontWeight:'900'},
  toastContent:{flex:1,gap:2},
  toastTitle:{fontSize:13,fontWeight:'900',color:'#fff'},
  toastMsg:{fontSize:11,color:'#6a84a0',lineHeight:16},
  toastRewards:{flexDirection:'row',gap:8,marginTop:2},
  toastCrystals:{color:'#ffd700',fontSize:11,fontWeight:'800'},
  toastXp:{color:'#00e5ff',fontSize:11,fontWeight:'800'},
  toastClose:{padding:4},
  toastCloseText:{fontSize:14,fontWeight:'900'},
});
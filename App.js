// App.js — V16 avec Admin + Firebase Sync
import React from 'react';
import { ToastProvider } from './store/ToastContext';
import { inject } from '@vercel/analytics';
inject();
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './store/AuthContext';
import { ThemeProvider, useTheme } from './store/ThemeContext';
import { I18nProvider } from './i18n/index';

import AuthScreen        from './screens/AuthScreen';
import CollectionScreen  from './screens/CollectionScreen';
import SummonScreen      from './screens/SummonScreen';
import BattleScreen      from './screens/BattleScreen';
import EvolutionScreen   from './screens/EvolutionScreen';
import WorldScreen       from './screens/WorldScreen';
import EclipseScreen     from './screens/EclipseScreen';
import ProfileScreen     from './screens/ProfileScreen';
import ShinyScreen       from './screens/ShinyScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import TournamentScreen  from './screens/TournamentScreen';
import QuestScreen       from './screens/QuestScreen';
import ShopScreen        from './screens/ShopScreen';
import BreedingScreen    from './screens/BreedingScreen';
import FriendsScreen     from './screens/FriendsScreen';
import GuildScreen           from './screens/GuildScreen';
import GuildChallengeScreen  from './screens/GuildChallengeScreen';
import StoryScreen      from './screens/StoryScreen';
import AdminScreen       from './screens/AdminScreen';
import HomeScreen        from './screens/HomeScreen';
import NewsScreen        from './screens/NewsScreen';
import InboxScreen       from './screens/InboxScreen';

const Tab = createBottomTabNavigator();
const ADMIN_UID = 'NpKZ4aF5kVMlZTN3W8Wy3GCNOhK2';

function TabIcon({ icon, label, focused, color }) {
  return (
    <View style={{ alignItems: 'center', gap: 1, paddingTop: 4 }}>
      <Text style={{ fontSize: 11, opacity: focused ? 1 : 0.35 }}>{icon}</Text>
      <Text style={{ fontSize: 4.5, color: focused ? color : '#4a6080', letterSpacing: 0.2, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isAdmin  = user?.uid === ADMIN_UID;
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBorder,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home"          component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="ACCUEIL"   focused={focused} color="#00e5ff" /> }} />
      <Tab.Screen name="News"          component={NewsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📰" label="NEWS"      focused={focused} color="#ffa500" /> }} />
      <Tab.Screen name="Profile"      component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="PROFIL"    focused={focused} color="#00e5ff" /> }} />
      <Tab.Screen name="Story"        component={StoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📖" label="HISTOIRE"  focused={focused} color="#ffa500" /> }} />
      <Tab.Screen name="Guilds"       component={GuildScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚔️" label="GUILDES"   focused={focused} color="#ff6b35" /> }} />
      <Tab.Screen name="GuildChallenge" component={GuildChallengeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏆" label="DÉFIS"     focused={focused} color="#ff4fa3" /> }} />
      <Tab.Screen name="Friends"      component={FriendsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="AMIS"      focused={focused} color="#39ff8f" /> }} />
      {isAdmin && (
        <Tab.Screen name="Admin"      component={AdminScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="ADMIN"   focused={focused} color="#ffd700" /> }} />
      )}
      <Tab.Screen name="World"        component={WorldScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🌍" label="MONDE"     focused={focused} color="#39ff8f" /> }} />
      <Tab.Screen name="Breeding"     component={BreedingScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🥚" label="ÉLEVAGE"   focused={focused} color="#ff69b4" /> }} />
      <Tab.Screen name="Quests"       component={QuestScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="QUÊTES"    focused={focused} color="#39ff8f" /> }} />
      <Tab.Screen name="Shop"         component={ShopScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🛍️" label="BOUTIQUE"  focused={focused} color="#ffd700" /> }} />
      <Tab.Screen name="Leaderboard"  component={LeaderboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏆" label="TOP 100"   focused={focused} color="#ffd700" /> }} />
      <Tab.Screen name="Tournament"   component={TournamentScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚔️" label="TOURNOI"   focused={focused} color="#ff4fa3" /> }} />
      <Tab.Screen name="Collection"   component={CollectionScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📖" label="COLLEC"    focused={focused} color="#00e5ff" /> }} />
      <Tab.Screen name="Summon"       component={SummonScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="✦"  label="INVOQUER"  focused={focused} color="#00ccff" /> }} />
      <Tab.Screen name="Shiny"        component={ShinyScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="✨" label="SHINY"     focused={focused} color="#ff69b4" /> }} />
      <Tab.Screen name="Evolution"    component={EvolutionScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚗️" label="ÉVOLUER"   focused={focused} color="#ffd700" /> }} />
      <Tab.Screen name="Eclipse"      component={EclipseScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🌑" label="ÉCLIPSE"   focused={focused} color="#bf5fff" /> }} />
      <Tab.Screen name="Inbox" component={InboxScreen}
        options={{ tabBarButton:()=>null, tabBarStyle:{display:'none'} }}/>
      <Tab.Screen name="Battle"       component={BattleScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🗡️" label="COMBAT"    focused={focused} color="#ff6b35" /> }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:'#07090f', alignItems:'center', justifyContent:'center' }}>
        <Text style={{ fontSize: 32, fontWeight:'900', color:'#fff', letterSpacing:8, marginBottom:24 }}>LUMINOS</Text>
        <ActivityIndicator color="#00e5ff" size="large" />
      </View>
    );
  }
  return user ? <MainTabs /> : <AuthScreen />;
}

function AppWithI18n() {
  const { user } = useAuth();
  return (
    <I18nProvider uid={user?.uid}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </I18nProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppWithI18n />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
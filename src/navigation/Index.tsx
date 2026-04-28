import React from 'react'
import { Text, ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { RootStackParamList, PatientTabParamList } from '../types'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import HomeScreen from '../screens/patient/HomeScreen'
import SearchScreen from '../screens/patient/SearchScreen'
import AppointmentsScreen from '../screens/patient/AppointmentsScreen'
import ProfileScreen from '../screens/patient/ProfileScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<PatientTabParamList>()

export type RootNavProp = NativeStackNavigationProp<RootStackParamList>

function PatientTabs() {
  const { colors } = useThemeStore()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontFamily: 'Syne_700Bold',
          fontSize: 10,
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color }: { color: string; size: number }) => (
          <Text style={{ color, fontSize: 16 }}>•</Text>
        ),
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const { colors } = useThemeStore()

  // Show blank screen while checking stored token
  // Prevents flash of login screen on returning users
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgBase },
          animation: 'fade_from_bottom',
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={PatientTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
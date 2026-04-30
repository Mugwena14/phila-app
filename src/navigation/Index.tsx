import React from 'react'
import { View, Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { RootStackParamList, PatientTabParamList } from '../types'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import HomeScreen from '../screens/patient/HomeScreen'
import SearchScreen from '../screens/patient/SearchScreen'
import AppointmentsScreen from '../screens/patient/AppointmentsScreen'
import ProfileScreen from '../screens/patient/ProfileScreen'
import DoctorProfileScreen from '../screens/patient/DoctorProfileScreen'
import BookingConfirmScreen from '../screens/patient/BookingConfirmScreen'
import BookingSuccessScreen from '../screens/patient/BookingSuccessScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<PatientTabParamList>()

export type RootNavProp = NativeStackNavigationProp<RootStackParamList>

function PatientTabs() {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()

  // Extra bottom padding so nav never gets hidden behind home button
  const bottomPad = Math.max(insets.bottom, 8)

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderStrong,
          borderTopWidth: 1,
          paddingBottom: bottomPad,
          paddingTop: 10,
          height: 56 + bottomPad,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }: { color: string; focused: boolean; size: number }) => {
          const size = 22
          switch (route.name) {
            case 'Home':
              return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            case 'Search':
              return <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
            case 'Appointments':
              return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            case 'Profile':
              return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            default:
              return <Ionicons name="ellipse-outline" size={size} color={color} />
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const { colors } = useThemeStore()

  if (isLoading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgBase },
          animation: 'fade_from_bottom',
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={PatientTabs} />
            <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
            <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
            <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
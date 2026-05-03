import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'

// Patient screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import HomeScreen from '../screens/patient/HomeScreen'
import SearchScreen from '../screens/patient/SearchScreen'
import AppointmentsScreen from '../screens/patient/AppointmentsScreen'
import ProfileScreen from '../screens/patient/ProfileScreen'
import DoctorProfileScreen from '../screens/patient/DoctorProfileScreen'
import BookingConfirmScreen from '../screens/patient/BookingConfirmScreen'
import BookingSuccessScreen from '../screens/patient/BookingSuccessScreen'

// Doctor screens
import DoctorTodayScreen from '../screens/doctor/DoctorTodayScreen'
import DoctorScheduleScreen from '../screens/doctor/DoctorScheduleScreen'
import DoctorPatientsScreen from '../screens/doctor/DoctorPatientsScreen'
import DoctorProfileHomeScreen from '../screens/doctor/DoctorProfileHomeScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function PatientTabs() {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()
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
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const size = 22
          switch (route.name) {
            case 'Home':       return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            case 'Search':     return <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
            case 'Appointments': return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            case 'Profile':    return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            default:           return <Ionicons name="ellipse-outline" size={size} color={color} />
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function DoctorTabs() {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()
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
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const size = 22
          switch (route.name) {
            case 'Today':    return <Ionicons name={focused ? 'pulse' : 'pulse-outline'} size={size} color={color} />
            case 'Schedule': return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            case 'Patients': return <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
            case 'DoctorProfile': return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            default: return <Ionicons name="ellipse-outline" size={size} color={color} />
          }
        },
      })}
    >
      <Tab.Screen name="Today" component={DoctorTodayScreen} options={{ tabBarLabel: 'Today' }} />
      <Tab.Screen name="Schedule" component={DoctorScheduleScreen} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Patients" component={DoctorPatientsScreen} options={{ tabBarLabel: 'Patients' }} />
      <Tab.Screen name="DoctorProfile" component={DoctorProfileHomeScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  )
}

export default function Navigation() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const { colors } = useThemeStore()
  const isDoctor = user?.role === 'doctor'

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
        ) : isDoctor ? (
          <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
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
import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
}

const defaultAuth: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: async () => {},
  logout: async () => {},
}

const AuthContext = createContext<AuthContextType>(defaultAuth)

const TOKEN_KEY = 'phila_token'
const USER_KEY  = 'phila_user'   // ← persist user so role survives restart

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser]                     = useState<User | null>(null)
  const [token, setToken]                   = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading]           = useState<boolean>(true)

  useEffect(() => {
    const loadFromStorage = async (): Promise<void> => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ])

        if (storedToken) {
          setToken(storedToken)
          setIsAuthenticated(true)

          // Restore cached user immediately so role is available
          if (storedUser) {
            try { setUser(JSON.parse(storedUser)) } catch {}
          }

          // Then refresh from backend in background
          try {
            const { authApi } = await import('../api/auth')
            const freshUser = await authApi.me()
            setUser(freshUser)
            // Update cached user with fresh data
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser))
          } catch {
            // Token expired or network issue — keep cached user
            // Navigation will handle 401 on next API call
          }
        }
      } catch {
        // SecureStore unavailable
      } finally {
        setIsLoading(false)
      }
    }
    void loadFromStorage()
  }, [])

  const setAuth = async (newUser: User, newToken: string): Promise<void> => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, newToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser)),  // ← persist user
    ])
    setUser(newUser)
    setToken(newToken)
    setIsAuthenticated(true)
  }

  const logout = async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),  // ← clear user on logout
    ])
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthStore(): AuthContextType {
  return useContext(AuthContext)
}
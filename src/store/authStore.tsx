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

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadFromStorage = async (): Promise<void> => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY)
        if (stored !== null) {
          setToken(stored)
          setIsAuthenticated(true)
        }
      } catch {
        // SecureStore unavailable on first launch
      } finally {
        setIsLoading(false)
      }
    }
    void loadFromStorage()
  }, [])

  const setAuth = async (newUser: User, newToken: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken)
    setUser(newUser)
    setToken(newToken)
    setIsAuthenticated(true)
  }

  const logout = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthStore(): AuthContextType {
  return useContext(AuthContext)
}
import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiClient } from '@/api/client'

type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_TOKEN_STORAGE_KEY = 'authToken'

type AuthResponse = {
  token: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  )

  const saveToken = (nextToken: string) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken)
    setToken(nextToken)
  }

  const clearToken = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    setToken(null)
  }

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })

    saveToken(data.token)
  }

  const register = async (name: string, email: string, password: string) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    })

    saveToken(data.token)
  }

  const value: AuthContextValue = {
    token,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout: clearToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

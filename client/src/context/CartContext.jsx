import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { cartApi } from '../lib/api'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  const refreshCart = useCallback(() => {
    if (!user) {
      setCartCount(0)
      return
    }
    cartApi
      .getCart()
      .then((cart) => {
        const total = (cart?.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)
        setCartCount(total)
      })
      .catch(() => setCartCount(0))
  }, [user])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

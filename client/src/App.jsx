import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Products from './pages/Products'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Admin from './pages/Admin'
import AdminMemberList from './pages/AdminMemberList'
import AdminOrderList from './pages/AdminOrderList'
import AdminProductNew from './pages/AdminProductNew'
import AdminProductEdit from './pages/AdminProductEdit'
import AdminProducts from './pages/AdminProducts'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Order from './pages/Order'
import OrderComplete from './pages/OrderComplete'
import OrderReturn from './pages/OrderReturn'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import BookingStatus from './pages/BookingStatus'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products">
            <Route index element={<Products />} />
            <Route path=":id" element={<ProductDetail />} />
          </Route>
          <Route path="signup" element={<Signup />} />
          <Route path="login" element={<Login />} />
          <Route path="cart" element={<Cart />} />
          <Route path="order" element={<Order />} />
          <Route path="order/return" element={<OrderReturn />} />
          <Route path="order/complete" element={<OrderComplete />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/status" element={<BookingStatus />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin/members" element={<AdminMemberList />} />
          <Route path="admin/orders" element={<AdminOrderList />} />
          <Route path="admin/products" element={<AdminProducts />} />
          <Route path="admin/products/new" element={<AdminProductNew />} />
          <Route path="admin/products/:id/edit" element={<AdminProductEdit />} />
        </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}

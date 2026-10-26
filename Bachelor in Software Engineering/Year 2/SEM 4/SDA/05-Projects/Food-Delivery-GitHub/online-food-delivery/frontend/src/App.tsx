import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Browse from './pages/Browse'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'
import Tracking from './pages/Tracking'
import AdminConsole from './pages/AdminConsole'
import DriverConsole from './pages/DriverConsole'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Browse />} />
        <Route path="/restaurants/:id" element={<Menu />} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/payment/:orderId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/track/:orderId" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
        <Route path="/admin" element={<RoleRoute role="ADMIN"><AdminConsole /></RoleRoute>} />
        <Route path="/driver" element={<RoleRoute role="DRIVER"><DriverConsole /></RoleRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

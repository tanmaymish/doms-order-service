import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { NavBar } from './components/NavBar';
import { CartDrawer } from './components/CartDrawer';
import { Storefront } from './pages/Storefront';
import { OrderTracking } from './pages/OrderTracking';
import { ControlTower } from './pages/ControlTower';

function AppShell() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-full">
      <NavBar onCartClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/orders" element={<OrderTracking />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
        <Route path="/control-tower" element={<ControlTower />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppShell />
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
}

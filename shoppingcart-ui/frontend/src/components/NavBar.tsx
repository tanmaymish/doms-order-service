import { NavLink } from 'react-router-dom';
import { Code2, Moon, PackageSearch, RadioTower, ShoppingCart, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { DEMO_MODE } from '../lib/api';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-accent-500/15 text-accent-600 dark:text-accent-300' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
  }`;

export function NavBar({ onCartClick }: { onCartClick: () => void }) {
  const { theme, toggle } = useTheme();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-cyan-glow text-white text-xs font-bold">D</span>
          <span>DOMS</span>
          {DEMO_MODE && (
            <span className="ml-1 rounded-full bg-cyan-glow/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-glow ring-1 ring-cyan-glow/30">
              Live Demo
            </span>
          )}
        </NavLink>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          <NavLink to="/" end className={linkClass}>
            <PackageSearch size={15} /> Storefront
          </NavLink>
          <NavLink to="/control-tower" className={linkClass}>
            <RadioTower size={15} /> Control Tower
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <a
            href="https://github.com/tanmaymish/doms-order-service"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] sm:flex"
          >
            <Code2 size={15} /> Source
          </a>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={onCartClick}
            className="relative rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
            aria-label="Open cart"
          >
            <ShoppingCart size={16} />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

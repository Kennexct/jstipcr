import { LayoutDashboard, PackageSearch, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';

export function BottomNav() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Hub', path: '/' },
    { icon: TrendingUp, label: 'Wishlist', path: '/explore' },
    { icon: PackageSearch, label: 'Catalog', path: '/owner/inventory' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium tracking-tight">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute -top-1 h-1 w-8 rounded-full bg-primary"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}


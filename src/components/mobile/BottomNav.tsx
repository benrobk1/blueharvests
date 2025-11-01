import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/consumer/shop', id: 'home' },
  { icon: ShoppingBag, label: 'Shop', path: '/consumer/shop', id: 'shop' },
  { icon: Package, label: 'Orders', path: '/consumer/orders', id: 'orders' },
  { icon: User, label: 'Profile', path: '/consumer/profile', id: 'profile' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoModeContextType {
  isDemoMode: boolean;
  dataSeeded: boolean;
  currentDemoAccount: string | null;
  enableDemoMode: () => Promise<any>;
  disableDemoMode: () => void;
  setCurrentDemoAccount: (email: string) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
};

interface DemoModeProviderProps {
  children: ReactNode;
}

export const DemoModeProvider = ({ children }: DemoModeProviderProps) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [dataSeeded, setDataSeeded] = useState(false);
  const [currentDemoAccount, setCurrentDemoAccount] = useState<string | null>(null);

  // Load demo mode state from localStorage on mount
  useEffect(() => {
    const storedDemoMode = localStorage.getItem('demoMode');
    if (storedDemoMode) {
      try {
        const parsed = JSON.parse(storedDemoMode);
        setIsDemoMode(parsed.enabled || false);
        setDataSeeded(parsed.dataSeeded || false);
        setCurrentDemoAccount(parsed.lastAccount || null);
      } catch (e) {
        console.error('Failed to parse demo mode state:', e);
      }
    }
  }, []);

  // Save demo mode state to localStorage whenever it changes
  useEffect(() => {
    if (isDemoMode || dataSeeded) {
      localStorage.setItem('demoMode', JSON.stringify({
        enabled: isDemoMode,
        dataSeeded,
        enabledAt: new Date().toISOString(),
        lastAccount: currentDemoAccount,
      }));
    } else {
      localStorage.removeItem('demoMode');
    }
  }, [isDemoMode, dataSeeded, currentDemoAccount]);

  const enableDemoMode = async () => {
    try {
      toast.loading('Seeding demo data...', {
        description: 'This will take 30-60 seconds. All demo accounts and data will be ready...',
      });

      // Get the current session to ensure auth token is fresh
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const { data, error } = await supabase.functions.invoke('seed-full-demo', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      setIsDemoMode(true);
      setDataSeeded(true);
      
      toast.dismiss();
      toast.success('Demo Mode Enabled!', {
        description: 'All demo accounts are ready. Use the quick login buttons to switch between roles.',
      });
      
      return data; // Return the data so consumers can use it
    } catch (error: any) {
      toast.dismiss();
      toast.error('Failed to enable demo mode', {
        description: error.message,
      });
      throw error;
    }
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    setCurrentDemoAccount(null);
    
    // Sign out current user
    supabase.auth.signOut();
    
    toast.success('Demo Mode Disabled', {
      description: 'App has returned to normal mode. You have been signed out.',
    });
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        dataSeeded,
        currentDemoAccount,
        enableDemoMode,
        disableDemoMode,
        setCurrentDemoAccount,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

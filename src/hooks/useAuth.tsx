import { createContext, useContext, useEffect, useState } from 'react';
import { backend } from '@/lib/backend/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: any | null;
  session: any | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: any }>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin';
  const isAuthenticated = !!user;

  useEffect(() => {
    // Set up auth state listener FIRST
    const subscription = backend.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching to avoid auth state listener issues
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    backend.auth.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await backend
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await backend.auth.signIn(email, password);
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.error.message
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in."
        });
      }
      
      return { error: result.error };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const result = await backend.auth.signUp(email, password, {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      });
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: result.error.message
        });
      } else if (result.user && !result.session) {
        toast({
          title: "Check your email!",
          description: "Please check your email for a confirmation link."
        });
      } else {
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully."
        });
      }
      
      return { error: result.error };
    } catch (error: any) {
      toast({
        variant: "destructive", 
        title: "Registration failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await backend.auth.signOut();
      
      toast({
        title: "Goodbye!",
        description: "You have been successfully logged out."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out"
      });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const result = await backend.auth.changePassword(currentPassword, newPassword);

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Password change failed",
          description: result.error.message || "Failed to change password"
        });
      } else {
        toast({
          title: "Password changed",
          description: "Your password has been successfully updated."
        });
      }

      return { error: result.error };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change password"
      });
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    changePassword,
    isAdmin,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
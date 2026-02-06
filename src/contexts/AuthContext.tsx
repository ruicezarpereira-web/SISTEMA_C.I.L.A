 import { createContext, useContext, useEffect, useState, ReactNode } from "react";
 import { User, Session } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
type UserRole = 'admin' | 'rh' | null;

interface UserProfile {
  nome: string;
  email: string;
  deve_trocar_senha: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isAdmin: boolean;
  isRH: boolean;
  deveTrocarSenha: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome, email, deve_trocar_senha')
        .eq('user_id', userId)
        .single();
 
       if (profileData) {
         setProfile(profileData);
       }
 
       const { data: roleData } = await supabase
         .from('user_roles')
         .select('role')
         .eq('user_id', userId)
         .single();
 
       if (roleData) {
         setRole(roleData.role as UserRole);
       }
     } catch (error) {
       console.error('Error fetching user data:', error);
     }
   };
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       async (event, session) => {
         setSession(session);
         setUser(session?.user ?? null);
 
         if (session?.user) {
           setTimeout(() => fetchUserProfile(session.user.id), 0);
         } else {
           setProfile(null);
           setRole(null);
         }
         setIsLoading(false);
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setSession(session);
       setUser(session?.user ?? null);
       if (session?.user) {
         fetchUserProfile(session.user.id);
       }
       setIsLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const signIn = async (email: string, password: string) => {
     try {
       const { error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
 
       if (error) throw error;
 
       // Log login activity
       await supabase.from('logs_atividade').insert({
         tipo_acao: 'LOGIN',
         usuario: email,
         detalhes: 'Login realizado com sucesso',
       });
 
       return { error: null };
     } catch (error) {
       return { error: error as Error };
     }
   };
 
   const signUp = async (email: string, password: string, nome: string) => {
     try {
       const { error } = await supabase.auth.signUp({
         email,
         password,
         options: {
           emailRedirectTo: window.location.origin,
           data: { nome },
         },
       });
 
       if (error) throw error;
       return { error: null };
     } catch (error) {
       return { error: error as Error };
     }
   };
 
   const signOut = async () => {
     if (user) {
       await supabase.from('logs_atividade').insert({
         tipo_acao: 'LOGOUT',
         usuario: profile?.email || user.email,
         detalhes: 'Logout realizado',
       });
     }
     await supabase.auth.signOut();
   };
 
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        isAdmin: role === 'admin',
        isRH: role === 'rh',
        deveTrocarSenha: profile?.deve_trocar_senha ?? false,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
 
 export function useAuth() {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
 }
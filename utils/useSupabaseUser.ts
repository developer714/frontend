import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

export function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);
  return user;
} 
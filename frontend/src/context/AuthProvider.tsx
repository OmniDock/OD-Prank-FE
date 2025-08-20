import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextValue {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		let isMounted = true;
		async function init() {
			const { data } = await supabase.auth.getSession();
			if (!isMounted) return;
			setSession(data.session);
			setUser(data.session?.user ?? null);
			setLoading(false);
		}
		init();

		const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
			setSession(newSession);
			setUser(newSession?.user ?? null);
		});

		return () => {
			isMounted = false;
			authListener.subscription.unsubscribe();
		};
	}, []);

	const value = useMemo<AuthContextValue>(() => ({
		user,
		session,
		loading,
		signOut: async () => {
			await supabase.auth.signOut();
		},
	}), [user, session, loading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

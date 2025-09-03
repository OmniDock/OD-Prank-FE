import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import DefaultLayout from "@/layouts/default";
import { supabase } from "@/lib/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const location = useLocation() as any;

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
		setLoading(false);
		if (signInError) {
			setError(signInError.message);
			return;
		}
		const redirectTo = location.state?.from?.pathname ?? "/dashboard";
		navigate(redirectTo, { replace: true });
	}

	return (
		<DefaultLayout>
			<div className="max-w-md mx-auto py-16">
				<h1 className="text-2xl font-semibold mb-6">Sign In</h1>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<Input type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					<Input type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					{error ? <p className="text-danger text-sm">{error}</p> : null}
					<Button type="submit" color="primary" size="sm" isLoading={loading}>Sign In</Button>
				</form>
				<p className="mt-4 text-sm">
					Don&apos;t have an account? <Link href="/signup">Sign up</Link>
				</p>
			</div>
		</DefaultLayout>
	);
}

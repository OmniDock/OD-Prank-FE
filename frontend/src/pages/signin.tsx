import React, { useState, useEffect } from "react";
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
	const [pendingScenario, setPendingScenario] = useState<string | null>(null);

	useEffect(() => {
		// Check for pending scenario from landing page
		const scenario = sessionStorage.getItem('pendingScenario');
		if (scenario) {
			setPendingScenario(scenario);
		}

		// Add entrance animation
		document.body.classList.add('page-entering');
		return () => {
			document.body.classList.remove('page-entering');
		};
	}, []);

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
		// If there's a pending scenario, navigate to dashboard with it
		if (pendingScenario) {
			sessionStorage.removeItem('pendingScenario');
			navigate("/dashboard", { state: { pendingScenario }, replace: true });
		} else {
			const redirectTo = location.state?.from?.pathname ?? "/dashboard";
			navigate(redirectTo, { replace: true });
		}
	}

	return (
		<DefaultLayout>
			<div className="max-w-md mx-auto py-16 animate-fade-in-up">
				<h1 className="text-2xl font-semibold mb-6">Sign In</h1>
				{pendingScenario && (
					<div className="mb-6 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
						<p className="text-sm text-primary-700 dark:text-primary-300">
							Sign in to create your prank scenario
						</p>
					</div>
				)}
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

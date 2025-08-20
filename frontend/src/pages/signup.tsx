import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import DefaultLayout from "@/layouts/default";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setMessage(null);
		const { error: signUpError } = await supabase.auth.signUp({ email, password });
		setLoading(false);
		if (signUpError) {
			setError(signUpError.message);
			return;
		}
		setMessage("Check your email to confirm your account or sign in if email confirmation is disabled.");
	}

	return (
		<DefaultLayout>
			<div className="max-w-md mx-auto py-16">
				<h1 className="text-2xl font-semibold mb-6">Sign Up</h1>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<Input type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					<Input type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					{error ? <p className="text-danger text-sm">{error}</p> : null}
					{message ? <p className="text-success text-sm">{message}</p> : null}
					<Button type="submit" color="primary" isLoading={loading}>Create Account</Button>
				</form>
				<p className="mt-4 text-sm">
					Already have an account? <Link href="/signin">Sign in</Link>
				</p>
			</div>
		</DefaultLayout>
	);
}

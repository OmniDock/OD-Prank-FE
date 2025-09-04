import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { supabase } from "@/lib/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
	EyeIcon, 
	EyeSlashIcon, 
	EnvelopeIcon, 
	LockClosedIcon,
	SparklesIcon
} from "@heroicons/react/24/outline";
import AuthLayout from "@/layouts/auth";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isVisible, setIsVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const location = useLocation() as any;

	const toggleVisibility = () => setIsVisible(!isVisible);

	const FromPricing = localStorage.getItem("FromPricing");
	console.log("FromPricing", FromPricing);



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
		if (FromPricing) {
			// Clear the flag and redirect to checkout page
			localStorage.removeItem("FromPricing");
			navigate("/checkout", { replace: true });
			return;
		}
		const redirectTo = location.state?.from?.pathname ?? "/dashboard";
		navigate(redirectTo, { replace: true });
	}

	async function signInWithGoogle() {
		setGoogleLoading(true);
		setError(null);
		
		// Determine redirect URL based on FromPricing flag
		const redirectUrl = FromPricing 
			? `${window.location.origin}/checkout`
			: `${window.location.origin}/dashboard`;
		
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: redirectUrl,
				queryParams: {
					access_type: 'offline',
					prompt: 'consent',
				}
			}
		});
		
		if (error) {
			setError(error.message);
			setGoogleLoading(false);
		} else if (FromPricing) {
			// Clear the flag after successful OAuth redirect setup
			localStorage.removeItem("FromPricing");
		}
	}

	return (
		<AuthLayout>
			<AnimatedBackground variant="phones" density={12} />
			
			<div className="relative flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-12">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="w-full max-w-md"
				>
					<Card className="shadow-primary-500/40 shadow-2xl border-default-100 bg-gradient-surface glass-card">
						<CardBody className="p-8">
							{/* Header with animation */}
							<motion.div 
								className="text-center mb-8"
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
							>
								<div className="flex justify-center mb-4">
									<div className="p-3 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900">
										<SparklesIcon className="w-8 h-8 text-primary" />
									</div>
								</div>
								<h1 className="text-3xl font-bold">
									Welcome Back
								</h1>
								<p className="text-default-500 mt-2">
									Sign in to continue your pranking journey
								</p>
							</motion.div>

							{/* Google Sign In with better styling */}
							<motion.div
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
							>
								<Button
									fullWidth
									variant="flat"
									size="lg"
									startContent={
										<svg className="w-5 h-5" viewBox="0 0 24 24">
											<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
											<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
											<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
											<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
										</svg>
									}
									onClick={signInWithGoogle}
									isLoading={googleLoading}
									className="font-medium bg-default-50 hover:bg-default-100 transition-colors"
								>
									Continue with Google
								</Button>
							</motion.div>

							{/* Divider with better styling */}
							<div className="relative my-6">
								<Divider className="bg-default-200" />
								<span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-default-400 uppercase tracking-wider">
									Sign in with email
								</span>
							</div>

							{/* Email/Password Form with animations */}
							<motion.form 
								onSubmit={onSubmit} 
								className="flex flex-col gap-4"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.3 }}
							>
								<Input
									type="email"
									label="Email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									startContent={
										<EnvelopeIcon className="w-4 h-4 text-default-400 pointer-events-none flex-shrink-0" />
									}
									variant="bordered"
									size="lg"
									classNames={{
										input: "text-small",
										inputWrapper: "border-default-200 data-[hover=true]:border-default-400"
									}}
									required
								/>
								
								<Input
									label="Password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									startContent={
										<LockClosedIcon className="w-4 h-4 text-default-400 pointer-events-none flex-shrink-0" />
									}
									endContent={
										<button
											className="focus:outline-none"
											type="button"
											onClick={toggleVisibility}
											aria-label="toggle password visibility"
										>
											{isVisible ? (
												<EyeSlashIcon className="w-4 h-4 text-default-400 pointer-events-none" />
											) : (
												<EyeIcon className="w-4 h-4 text-default-400 pointer-events-none" />
											)}
										</button>
									}
									type={isVisible ? "text" : "password"}
									variant="bordered"
									size="lg"
									classNames={{
										input: "text-small",
										inputWrapper: "border-default-200 data-[hover=true]:border-default-400"
									}}
									required
								/>

								{/* Forgot Password Link */}
								<div className="flex justify-end">
									<Link 
										href="/forgot-password" 
										size="sm" 
										className="text-primary hover:underline"
									>
										Forgot password?
									</Link>
								</div>

								{/* Error Message with animation */}
								{error && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger dark:text-danger-400 px-4 py-3 rounded-lg text-sm"
									>
										{error}
									</motion.div>
								)}

								{/* Submit Button with gradient */}
								<Button 
									type="submit" 
									size="lg" 
									isLoading={loading}
									fullWidth
									className="bg-gradient-primary text-white" 
									>
									Sign In
								</Button>
							</motion.form>

							{/* Sign Up Link with animation */}
							<motion.p 
								className="text-center mt-6 text-sm text-default-500"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								Don't have an account?{" "}
								<Link 
									href="/signup" 
									className="text-primary font-semibold hover:underline"
								>
									Create one
								</Link>
							</motion.p>
						</CardBody>
					</Card>
				</motion.div>
			</div>
		</AuthLayout>
	);
}

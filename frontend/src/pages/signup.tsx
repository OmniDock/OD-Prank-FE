import React, { useState, useMemo } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { 
	EyeIcon, 
	EyeSlashIcon, 
	EnvelopeIcon, 
	LockClosedIcon,
	CheckCircleIcon,
	UserPlusIcon
} from "@heroicons/react/24/outline";
import { PhoneIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import AuthLayout from "@/layouts/auth";

export default function SignUpPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isVisible, setIsVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	//const [googleLoading, setGoogleLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const toggleVisibility = () => setIsVisible(!isVisible);
	
	// Memoize floating icons positions to prevent regeneration on every render
	const floatingPhones = useMemo(() => 
		Array.from({ length: 12 }, (_, i) => ({
			id: i,
			left: Math.random() * 100,
			top: Math.random() * 100,
			delay: Math.random() * 10,
			duration: 15 + Math.random() * 10
		})), []
	);
	
	const floatingChats = useMemo(() => 
		Array.from({ length: 10 }, (_, i) => ({
			id: i,
			left: Math.random() * 100,
			top: Math.random() * 100,
			delay: Math.random() * 10 + 5,
			duration: 20 + Math.random() * 10
		})), []
	);

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
		setMessage("Check your email to confirm your account!");
	}

	// async function signUpWithGoogle() {
	// 	setGoogleLoading(true);
	// 	setError(null);
		
	// 	const { error } = await supabase.auth.signInWithOAuth({
	// 		provider: 'google',
	// 		options: {
	// 			redirectTo: `${window.location.origin}/dashboard`,
	// 			queryParams: {
	// 				access_type: 'offline',
	// 				prompt: 'consent',
	// 			}
	// 		}
	// 	});
		
	// 	if (error) {
	// 		setError(error.message);
	// 		setGoogleLoading(false);
	// 	}
	// }

	return (
		<AuthLayout>
			{/* Same background as landing page */}
			<div className="fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 opacity-20" />
				<div 
					className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
					}}
				/>

				{/* Floating phone icons */}
				{floatingPhones.map((phone) => (
					<div
						key={`phone-${phone.id}`}
						className="absolute opacity-[0.03] dark:opacity-[0.06] animate-float"
						style={{
							left: `${phone.left}%`,
							top: `${phone.top}%`,
							animationDelay: `${phone.delay}s`,
							animationDuration: `${phone.duration}s`
						}}
					>
						<PhoneIcon className="w-12 h-12 text-purple-600 dark:text-purple-400" />
					</div>
				))}
				
				{/* Chat bubble icons */}
				{floatingChats.map((chat) => (
					<div
						key={`chat-${chat.id}`}
						className="absolute opacity-[0.03] dark:opacity-[0.06] animate-float"
						style={{
							left: `${chat.left}%`,
							top: `${chat.top}%`,
							animationDelay: `${chat.delay}s`,
							animationDuration: `${chat.duration}s`
						}}
					>
						<ChatBubbleLeftRightIcon className="w-10 h-10 text-pink-600 dark:text-pink-400" />
					</div>
				))}
			</div>
			
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
									<div className="p-3 rounded-full bg-gradient-to-br from-secondary-100 to-primary-100 dark:from-secondary-900 dark:to-primary-900">
										<UserPlusIcon className="w-8 h-8 text-secondary" />
									</div>
								</div>
								<h1 className="text-3xl font-bold">
									Create Account
								</h1>
								<p className="text-default-500 mt-2">
									Join the ultimate pranking platform
								</p>
							</motion.div>

							{/* Google Sign Up with better styling */}
							{/* <motion.div
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
									onClick={signUpWithGoogle}
									isLoading={googleLoading}
									className="font-medium bg-default-50 hover:bg-default-100 transition-colors"
								>
									Sign up with Google
								</Button>
							</motion.div> */}

							{/* Divider with better styling */}
							<div className="relative my-6">
								<Divider className="bg-default-200" />
								<span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-default-400 uppercase tracking-wider">
									 sign up with email
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
									placeholder="Create a strong password"
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

								{/* Password Requirements */}
								<div className="text-xs text-default-400 -mt-2 pl-1">
									Use at least 6 characters
								</div>

								{/* Success Message with animation */}
								{message && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
									>
										<CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
										{message}
									</motion.div>
								)}

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
									Create Account
								</Button>

								{/* Terms with better styling */}
								<p className="text-xs text-default-400 text-center">
									By signing up, you agree to our{" "}
									<Link href="/terms" size="sm" className="text-primary hover:underline">
										Terms
									</Link>{" "}
									and{" "}
									<Link href="/privacy" size="sm" className="text-primary hover:underline">
										Privacy Policy
									</Link>
								</p>
							</motion.form>

							{/* Sign In Link with animation */}
							<motion.p 
								className="text-center mt-6 text-sm text-default-500"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								Already have an account?{" "}
								<Link 
									href="/signin" 
									className="text-primary font-semibold hover:underline"
								>
									Sign in
								</Link>
							</motion.p>
						</CardBody>
					</Card>
				</motion.div>
			</div>
		</AuthLayout>
	);
}

import { supabase } from "@/lib/supabaseClient";

const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL as string) ?? "";

export type ApiRequestOptions = RequestInit & { auth?: boolean };

export async function apiFetch(input: string, options: ApiRequestOptions = {}) {
	const { auth = true, headers, ...rest } = options;
	let authHeaders: HeadersInit = headers ?? {};

	if (auth) {
		const { data } = await supabase.auth.getSession();
		const accessToken = data.session?.access_token;
		if (accessToken) {
			authHeaders = {
				...authHeaders,
				Authorization: `Bearer ${accessToken}`,
			};
		}
	}

	const url = input.startsWith("http") ? input : `${backendBaseUrl}${input}`;
	const response = await fetch(url, {
		...rest,
		headers: {
			"Content-Type": "application/json",
			...authHeaders,
		},
	});

	if (!response.ok) {
		let message = `Request failed with status ${response.status}`;
		try {
			const ct = response.headers.get("content-type") || "";
			if (ct.includes("application/json")) {
				const data = await response.json();
				message = data?.detail || data?.error || message;
			} else {
				message = `${message}\n${await response.text()}`;
			}
		} catch {}
		throw new Error(message);
	}
	return response;
}

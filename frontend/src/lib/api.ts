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
		// Optionally handle 401/403 or throw an error
		throw new Error(`Request failed with status ${response.status}`);
	}
	return response;
}

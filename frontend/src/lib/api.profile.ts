import { apiFetch } from "@/lib/api";

export async function getProfile(): Promise<any> {
  const res = await apiFetch("/profile");
  console.log("res", res);
  return res.json();
}

export async function getCredits(): Promise<any> {
  const res = await apiFetch("/profile/get-credits");
  return res.json();
}
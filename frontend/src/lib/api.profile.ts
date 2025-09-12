import { apiFetch } from "@/lib/api";

export async function getProfile(): Promise<any> {
  const res = await apiFetch("/profile");
  console.log("res", res);
  return res.json();
}
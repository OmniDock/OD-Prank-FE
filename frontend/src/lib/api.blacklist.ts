import { apiFetch } from "@/lib/api";

export async function addToBlacklist(phoneNumber: string, region: string = "DE"): Promise<{ phone_number_e164: string }>{
  const res = await apiFetch("/blacklist/add", {
    method: "POST",
    body: JSON.stringify({ phone_number: phoneNumber, region }),
    auth: false,
  });
  const data = await res.json();
  return { phone_number_e164: data.phone_number_e164 };
}



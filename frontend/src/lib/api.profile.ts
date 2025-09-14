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


export async function updateCredits(prank_credit_amount: number, call_credit_amount: number): Promise<any> {
  const res = await apiFetch("/profile/update-credits", {
    method: "POST",
    body: JSON.stringify({ 'prank_credit_amount': prank_credit_amount, 'call_credit_amount': call_credit_amount }),
  });
  return res.json();
}
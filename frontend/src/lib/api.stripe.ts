import { apiFetch } from './api';

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  data: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  const response = await apiFetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  return response.json();
}

export interface CreateCustomerRequest {
  email: string;
  name?: string;
  phone?: string;
}

export interface CreateCustomerResponse {
  customerId: string;
  email: string;
}

export async function createCustomer(
  data: CreateCustomerRequest
): Promise<CreateCustomerResponse> {
  const response = await apiFetch('/api/stripe/create-customer', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  return response.json();
}




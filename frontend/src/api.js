import axios from "axios";
import {
  MOCK_ANIMALS,
  MOCK_PLANS,
  MOCK_USER,
  mockHealthForImei,
  mockTelemetryForImei,
} from "./utils/mockData";

// Use VITE_API_URL (production) or VITE_API_BASE_URL (legacy) or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper: try the live backend, but fall back to mock data when it is unreachable.
async function withMockFallback(promiseFactory, mockValue) {
  try {
    const res = await promiseFactory();
    // If the backend returned an empty payload, prefer the mock so the UI is not blank.
    if (res?.data == null || (Array.isArray(res.data) && res.data.length === 0)) {
      return mockValue;
    }
    return res.data;
  } catch (err) {
    // Silent fallback — keep the dashboard fully interactive in preview/demo mode.
    return mockValue;
  }
}

export function requestOtp(payload) {
  if (typeof payload === 'string') {
    return apiClient.post("/send-otp", { email_or_mobile: payload });
  }
  if (payload.email_or_mobile) {
    return apiClient.post("/send-otp", payload);
  }
  return apiClient.post("/send-otp", {
    email_or_mobile: payload.email,
    email: payload.email,
    full_name: payload.full_name,
    national_id: payload.national_id,
    mobile: payload.mobile,
    city: payload.city,
    asset_type: payload.asset_type
  });
}

export async function verifyOtp(emailOrMobile, code) {
  const res = await apiClient.post("/verify-otp", {
    email_or_mobile: emailOrMobile,
    code: code
  });
  const { access_token, user, is_admin } = res.data;
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("user", JSON.stringify({ ...user, is_admin }));
  return res.data;
}

export function fetchCurrentUser() {
  return apiClient.get("/me");
}

export function fetchAnimals() {
  return apiClient.get("/animals");
}

export async function listMyAnimals() {
  return withMockFallback(() => apiClient.get("/animals"), MOCK_ANIMALS);
}

export async function getTelemetryByIMEI(imei) {
  return withMockFallback(
    () => apiClient.get(`/telemetry/device/${imei}`),
    mockTelemetryForImei(imei),
  );
}

export function fetchLatestTelemetry(animalId) {
  return apiClient.get(`/animals/${animalId}/latest-telemetry`);
}

export function fetchTelemetryHistory(animalId, limit = 10) {
  return apiClient.get(`/animals/${animalId}/telemetry`, { params: { limit } });
}

export function adminCreateUser(payload) {
  return apiClient.post("/admin/users", payload);
}

export function adminRegisterAnimal(payload) {
  return apiClient.post("/admin/animals", payload);
}

export function adminListDevices() {
  return apiClient.get("/admin/devices");
}

export async function devTestLogin() {
  if (!import.meta.env.DEV) {
    throw new Error("Test login is disabled in production");
  }
  const res = await apiClient.post("/dev/test-login");
  const { access_token, user, is_admin } = res.data;
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("user", JSON.stringify({ ...user, is_admin }));
  return res.data;
}

// ========== SUBSCRIPTION API ==========

export async function getSubscriptionPlans() {
  const data = await withMockFallback(() => apiClient.get("/subscription/plans"), MOCK_PLANS);
  // Defensive: always return an array so callers can safely .map()
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.plans)) return data.plans;
  if (Array.isArray(data?.data)) return data.data;
  return MOCK_PLANS;
}

export async function createSubscription(planId) {
  const res = await apiClient.post("/subscription/subscribe", { plan_id: planId });
  return res.data;
}

export async function getMySubscription() {
  return withMockFallback(
    () => apiClient.get("/subscription/my-subscription"),
    { plan: MOCK_PLANS[1], status: "active" },
  );
}

// ========== SIMULATION MODE ==========

export async function startSimulation() {
  const res = await apiClient.post("/admin/simulation/start");
  return res.data;
}

export async function simulateMovement() {
  const res = await apiClient.post("/admin/simulation/update-location");
  return res.data;
}

// ========== HEALTH MONITORING ==========

export async function getLatestHealth(imei) {
  return withMockFallback(
    () => apiClient.get(`/health/${imei}/latest`),
    mockHealthForImei(imei),
  );
}

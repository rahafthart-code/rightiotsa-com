import axios from "axios";

// Use VITE_API_URL (production) or VITE_API_BASE_URL (legacy) or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function requestOtp(payload) {
  // Support multiple formats:
  // 1. String (email or mobile) - for login
  // 2. Object with email_or_mobile - for hybrid login
  // 3. Object with email, full_name, etc - for registration
  
  if (typeof payload === 'string') {
    return apiClient.post("/send-otp", { email_or_mobile: payload });
  }
  
  // If payload has email_or_mobile (hybrid login)
  if (payload.email_or_mobile) {
    return apiClient.post("/send-otp", payload);
  }
  
  // Registration format (with all fields)
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
  const res = await apiClient.get("/animals");
  return res.data;
}

export async function getTelemetryByIMEI(imei) {
  const res = await apiClient.get(`/telemetry/device/${imei}`);
  return res.data;
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
  const res = await apiClient.post("/dev/test-login");
  const { access_token, user, is_admin } = res.data;
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("user", JSON.stringify({ ...user, is_admin }));
  return res.data;
}

// ========== SUBSCRIPTION API ==========

export async function getSubscriptionPlans() {
  const res = await apiClient.get("/subscription/plans");
  return res.data;
}

export async function createSubscription(planId) {
  const res = await apiClient.post("/subscription/subscribe", { plan_id: planId });
  return res.data;
}export async function getMySubscription() {
  const res = await apiClient.get("/subscription/my-subscription");
  return res.data;
}

// ========== SIMULATION MODE ==========

export async function startSimulation() {
  const res = await apiClient.post("/admin/simulation/start");
  return res.data;
}

export async function simulateMovement() {
  const res = await apiClient.post("/admin/simulation/update-location");
  return res.data;
}// ========== HEALTH MONITORING ==========

export async function getLatestHealth(imei) {
  const res = await apiClient.get(`/health/${imei}/latest`);
  return res.data;
}
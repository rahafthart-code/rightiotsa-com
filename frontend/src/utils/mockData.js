// Mock data used as a fallback when the backend is unreachable.
// Keeps the dashboard fully interactive in preview/demo environments.

export const MOCK_USER = {
  id: 1,
  email: "demo@right.sa",
  full_name: "المالك التجريبي",
  is_admin: true,
};

const SPECIES = ["Camel", "Camel", "Camel", "Horse", "Horse", "Falcon"];
const NAMES = {
  Camel: ["وضحى", "شاهين", "مهرة", "فاطمة", "سعدان", "غزال"],
  Horse: ["العاصفة", "النجم", "الأمير", "صهيل"],
  Falcon: ["شاهين", "حر", "وكري"],
};

// Riyadh-area base coordinates so the map renders meaningfully.
const BASE = { lat: 24.7136, lng: 46.6753 };

function rand(seed) {
  // deterministic pseudo-random
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const MOCK_ANIMALS = SPECIES.map((species, i) => {
  const namesForSpecies = NAMES[species];
  return {
    id: i + 1,
    name: namesForSpecies[i % namesForSpecies.length],
    species,
    device_imei: `86000000000${100 + i}`,
    owner_id: 1,
    asset_type: species,
  };
});

function jitter(seed) {
  return (rand(seed) - 0.5) * 0.05;
}

export function mockTelemetryForImei(imei) {
  const seed = imei.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const records = [];
  const now = Date.now();
  for (let i = 0; i < 24; i++) {
    records.push({
      id: i,
      device_imei: imei,
      lat: BASE.lat + jitter(seed + i),
      lng: BASE.lng + jitter(seed + i * 3),
      speed: Math.round(rand(seed + i) * 8),
      battery: Math.max(60, 100 - i),
      signal: 4 - (i % 3),
      timestamp: new Date(now - i * 15 * 60 * 1000).toISOString(),
    });
  }
  return records;
}

export function mockHealthForImei(imei) {
  const seed = imei.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = rand(seed);
  return {
    device_imei: imei,
    temperature: 37 + r * 1.5, // 37–38.5
    heart_rate: 60 + Math.round(r * 25),
    activity_level: 40 + Math.round(r * 50),
    timestamp: new Date().toISOString(),
  };
}

export const MOCK_PLANS = [
  {
    id: 1,
    name: "Basic",
    name_ar: "الأساسي",
    price: 499,
    currency: "SAR",
    interval: "year",
    features: ["GPS Tracking", "Geofence", "Alerts"],
    features_en: ["GPS Tracking", "Geofence", "Smart Alerts"],
    features_ar: ["تتبع GPS", "نطاق آمن", "تنبيهات ذكية"],
  },
  {
    id: 2,
    name: "Premium",
    name_ar: "المميز",
    price: 999,
    currency: "SAR",
    interval: "year",
    features: ["All Basic", "Health Monitoring", "Vet Reports"],
    features_en: ["All Basic features", "Health Monitoring", "Vet Reports"],
    features_ar: ["كل مزايا الأساسي", "مراقبة صحية", "تقارير بيطرية"],
  },
];

export const DEMO_FLAG = "demo_mode";

// When demo mode is OFF, clear any previously-seeded mock user so /dashboard
// truly requires a real Supabase session. When demo mode is ON (user clicked
// "Demo Login"), keep the mock user in localStorage so guards can bypass.
export function ensureMockUser() {
  try {
    if (localStorage.getItem(DEMO_FLAG) === "1") return;
    const u = localStorage.getItem("user");
    if (u) {
      const parsed = JSON.parse(u);
      if (parsed?.email === MOCK_USER.email) {
        localStorage.removeItem("user");
      }
    }
    if (localStorage.getItem("access_token") === "mock-preview-token") {
      localStorage.removeItem("access_token");
    }
  } catch {
    // ignore
  }
}

// Activate demo / bypass mode: seed mock user + access token and flip flag.
// All protected guards short-circuit when demo_mode === "1".
export function enableDemoMode() {
  try {
    localStorage.setItem(DEMO_FLAG, "1");
    localStorage.setItem("user", JSON.stringify(MOCK_USER));
    localStorage.setItem("access_token", "mock-preview-token");
  } catch {
    // ignore
  }
}

export function isDemoMode() {
  try {
    return localStorage.getItem(DEMO_FLAG) === "1";
  } catch {
    return false;
  }
}

export function disableDemoMode() {
  try {
    localStorage.removeItem(DEMO_FLAG);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
  } catch {
    // ignore
  }
}

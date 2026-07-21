import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { getConnectivityStatus, getConnectivityColors } from "../utils/connectivity";
import SimulationControl from "../components/SimulationControl";

// NOTE: This page pre-dates the real `/admin/*` panel (see
// frontend/src/admin/pages/*), which already covers customers, devices and
// subscriptions against the live schema. "Create user" and "register device"
// below used to call a FastAPI backend that no longer exists and that had no
// live deployment; there is currently no edge function that mints or looks up
// a Supabase auth user by email (that requires the service-role Admin API).
// Rather than guess at that design, both actions are disabled with an
// explicit message — see the open question raised for adminCreateUser /
// adminRegisterAnimal in the FastAPI-retirement task.
export default function AdminPortal() {
  const { t } = useTranslation();
  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    is_active: true,
  });
  const [deviceForm, setDeviceForm] = useState({
    owner_email: "",
    name: "",
    species: "Camel",
    device_imei: "",
  });
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    setLoadingDevices(true);
    setError("");
    try {
      const { data: rows, error: err } = await supabase
        .from("sensor_devices")
        .select("id, device_id, owner_id, asset_id, device_type, status, battery_pct, signal_strength, last_seen_at")
        .order("updated_at", { ascending: false });
      if (err) throw err;

      const assetIds = [...new Set((rows || []).map((r) => r.asset_id))].filter(Boolean);
      const ownerIds = [...new Set((rows || []).map((r) => r.owner_id))].filter(Boolean);
      const [{ data: assetRows }, { data: profileRows }] = await Promise.all([
        assetIds.length
          ? supabase.from("assets").select("id, name, species").in("id", assetIds)
          : Promise.resolve({ data: [] }),
        ownerIds.length
          ? supabase.from("profiles").select("user_id, full_name").in("user_id", ownerIds)
          : Promise.resolve({ data: [] }),
      ]);
      const assetMap = new Map((assetRows || []).map((a) => [a.id, a]));
      const profileMap = new Map((profileRows || []).map((p) => [p.user_id, p]));

      setDevices(
        (rows || []).map((d) => ({
          ...d,
          animal_name: assetMap.get(d.asset_id)?.name || "—",
          species: assetMap.get(d.asset_id)?.species || null,
          owner_name: profileMap.get(d.owner_id)?.full_name || "—",
          last_status: d.status,
        }))
      );
    } catch (err) {
      setError(err.message || t('failedToLoad'));
    } finally {
      setLoadingDevices(false);
    }
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }

  function handleCreateUser(e) {
    e.preventDefault();
    setError(t('featureNotAvailable') || "Not available yet — no admin account-creation API is wired up.");
  }

  function handleRegisterDevice(e) {
    e.preventDefault();
    setError(t('featureNotAvailable') || "Not available yet — use the Admin panel's Devices/Customers pages instead.");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            {t('adminPortalTitle')}
          </h1>
          <p className="text-xs text-slate-400">
            {t('adminPortalSubtitle')}
          </p>
        </div>
        {toast && (
          <div className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200">
            {toast}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      )}

      {/* Simulation Control Panel */}
      <SimulationControl />

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-3">
            {t('addNewUser')}
          </h2>
          <form onSubmit={handleCreateUser} className="std-form space-y-3 text-xs">
            <div>
              <label className="block mb-1 text-slate-300">{t('fullName')}</label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, full_name: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
                placeholder={t('fullNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-300">{t('email')}</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
                placeholder={t('emailPlaceholderAdmin')}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={userForm.is_active}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/70"
              />
              <label
                htmlFor="is_active"
                className="text-slate-300"
              >
                {t('activeAccount')}
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-emerald-950 shadow-sm hover:bg-emerald-400 transition-colors"
            >
              {t('createUser')}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-3">
            {t('registerDeviceAnimal')}
          </h2>
          <form onSubmit={handleRegisterDevice} className="std-form space-y-3 text-xs">
            <div>
              <label className="block mb-1 text-slate-300">{t('ownerEmail')}</label>
              <input
                type="email"
                value={deviceForm.owner_email}
                onChange={(e) =>
                  setDeviceForm((prev) => ({
                    ...prev,
                    owner_email: e.target.value,
                  }))
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
                placeholder={t('ownerEmailPlaceholder')}
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-300">{t('animalName')}</label>
              <input
                type="text"
                value={deviceForm.name}
                onChange={(e) =>
                  setDeviceForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
                placeholder={t('animalNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-300">{t('species')}</label>
              <select
                value={deviceForm.species}
                onChange={(e) =>
                  setDeviceForm((prev) => ({ ...prev, species: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
              >
                <option value="Camel">{t('camel')}</option>
                <option value="Falcon">{t('falcon')}</option>
                <option value="Horse">{t('horse')}</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-300">{t('deviceIMEI')}</label>
              <input
                type="text"
                value={deviceForm.device_imei}
                onChange={(e) =>
                  setDeviceForm((prev) => ({
                    ...prev,
                    device_imei: e.target.value,
                  }))
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
                placeholder={t('deviceIMEIPlaceholder')}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-emerald-950 shadow-sm hover:bg-emerald-400 transition-colors"
            >
              {t('registerDevice')}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
              {t('activeDevices')}
            </h2>
            <p className="text-[11px] text-slate-400">
              {t('activeDevicesSubtitle')}
            </p>
          </div>
          {loadingDevices && (
            <span className="text-[11px] text-slate-400">{t('refreshing')}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t('deviceId') || t('imei')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('animal')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('owner')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('species')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('connectivityStatus')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('lastStatus')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('lastSeen')}</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-4 text-center text-slate-500"
                  >
                    {t('noDevices')}
                  </td>
                </tr>
              ) : (
                devices.map((d) => {
                  const connectivity = getConnectivityStatus(d.last_seen_at);
                  const statusColors = getConnectivityColors(connectivity);
                  
                  return (
                    <tr
                      key={d.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="px-4 py-2 text-slate-100 font-mono">{d.device_id}</td>
                      <td className="px-4 py-2 text-slate-100">{d.animal_name}</td>
                      <td className="px-4 py-2 text-slate-200">{d.owner_name}</td>
                      <td className="px-4 py-2 text-slate-200">{d.species ? (t(d.species.toLowerCase()) || d.species) : "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors}`}>
                          {t(connectivity)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-200">
                        {d.last_status || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {d.last_seen_at
                          ? new Date(d.last_seen_at).toLocaleString()
                          : t('never')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

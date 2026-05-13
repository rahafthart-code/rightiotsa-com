import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Heart, Thermometer, Activity } from "lucide-react";
import { useLatestReading } from "../hooks/useLatestReading";

/**
 * LiveVitalsChart — animated real-time waveform for heart rate (ECG-style)
 * and body temperature. Subscribes to live `sensor_readings` for the asset
 * via `useLatestReading` and keeps a rolling buffer plotted in pure SVG.
 *
 * Props:
 *  - assetId: string (required) — uses useLatestReading internally
 *  - reading: optional override reading (skips the hook)
 *  - height: chart svg height (default 180)
 */
const BUFFER = 60; // points
const W = 600;

export default function LiveVitalsChart({ assetId, reading: readingProp, height = 180 }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const liveReading = useLatestReading(assetId);
  const reading = readingProp ?? liveReading;

  // Rolling buffers
  const [hrBuf, setHrBuf] = useState(() => Array(BUFFER).fill(40));
  const [tempBuf, setTempBuf] = useState(() => Array(BUFFER).fill(38));
  const [pulseTick, setPulseTick] = useState(0);
  const lastReadingId = useRef(null);
  const rafRef = useRef(null);

  // Push new reading into buffer; if no fresh reading, gently drift toward last
  useEffect(() => {
    const id = reading?.recorded_at;
    if (!id || id === lastReadingId.current) return;
    lastReadingId.current = id;
    const hr = Number(reading.heart_rate) || 40;
    const tp = Number(reading.temperature) || 38;
    setHrBuf((b) => [...b.slice(1), hr]);
    setTempBuf((b) => [...b.slice(1), tp]);
    setPulseTick((p) => p + 1);
  }, [reading]);

  // Animation tick: simulates ECG-like pulse between real readings by adding
  // subtle micro-variations driven by the most recent heart rate.
  useEffect(() => {
    let mounted = true;
    let last = performance.now();
    const tick = (now) => {
      if (!mounted) return;
      if (now - last > 220) {
        last = now;
        setHrBuf((b) => {
          const baseline = b[b.length - 1] || 40;
          // ECG-style spike every ~5 ticks
          const tNext = b.length;
          const spike = tNext % 5 === 0 ? baseline * 1.6 : baseline + (Math.random() - 0.5) * 2;
          return [...b.slice(1), spike];
        });
        setTempBuf((b) => {
          const baseline = b[b.length - 1] || 38;
          return [...b.slice(1), baseline + (Math.random() - 0.5) * 0.05];
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const PAD = 28;
  const innerW = W - PAD * 2;
  const innerH = height - PAD * 2;

  const hrMin = Math.min(...hrBuf, 30);
  const hrMax = Math.max(...hrBuf, 80);
  const tMin = Math.min(...tempBuf, 36);
  const tMax = Math.max(...tempBuf, 40);

  const xAt = (i) => PAD + (i / (BUFFER - 1)) * innerW;
  const yHr = (v) => PAD + innerH - ((v - hrMin) / (hrMax - hrMin || 1)) * innerH;
  const yT = (v) => PAD + innerH - ((v - tMin) / (tMax - tMin || 1)) * innerH;

  const buildPath = (vals, yFn) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yFn(v).toFixed(1)}`).join(" ");

  const hrPath = buildPath(hrBuf, yHr);
  const tPath = buildPath(tempBuf, yT);
  const lastHr = Math.round(reading?.heart_rate ?? hrBuf[hrBuf.length - 1] ?? 0);
  const lastTemp = Number(reading?.temperature ?? tempBuf[tempBuf.length - 1] ?? 0).toFixed(1);

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: "var(--color-danger-bg, #fee2e2)", color: "var(--color-danger, #dc2626)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--color-danger, #dc2626)" }}
            />
            LIVE
          </span>
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            {isAr ? "بيانات حيوية لحظية" : "Live vitals"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span
            className="inline-flex items-center gap-1 font-bold"
            style={{ color: "var(--color-danger, #dc2626)" }}
          >
            <Heart size={12} key={pulseTick} className="animate-ping-slow" />
            {lastHr} {isAr ? "ن/د" : "bpm"}
          </span>
          <span
            className="inline-flex items-center gap-1 font-bold"
            style={{ color: "var(--color-royal-green, #006c35)" }}
          >
            <Thermometer size={12} />
            {lastTemp}°C
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ maxHeight: height + 20 }}>
        <defs>
          <linearGradient id="hrFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-danger, #dc2626)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-danger, #dc2626)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + innerH * p}
            y2={PAD + innerH * p}
            stroke="var(--color-border, #e5e7eb)"
            strokeDasharray="2 4"
            strokeWidth="0.5"
          />
        ))}

        {/* Heart-rate area */}
        <path
          d={`${hrPath} L ${xAt(BUFFER - 1)} ${PAD + innerH} L ${xAt(0)} ${PAD + innerH} Z`}
          fill="url(#hrFill)"
        />
        {/* Heart-rate waveform */}
        <path
          d={hrPath}
          fill="none"
          stroke="var(--color-danger, #dc2626)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Temperature line */}
        <path
          d={tPath}
          fill="none"
          stroke="var(--color-royal-green, #006c35)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="4 3"
        />

        {/* Trailing pulse dot */}
        <circle
          cx={xAt(BUFFER - 1)}
          cy={yHr(hrBuf[hrBuf.length - 1])}
          r="4"
          fill="var(--color-danger, #dc2626)"
          className="animate-pulse"
        />
      </svg>

      <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
        <Activity size={11} />
        {reading?.recorded_at
          ? `${isAr ? "آخر تحديث" : "Updated"}: ${new Date(reading.recorded_at).toLocaleTimeString(
              isAr ? "ar-SA" : "en-US",
              { hour: "2-digit", minute: "2-digit", second: "2-digit" }
            )}`
          : isAr
          ? "بانتظار البيانات..."
          : "Waiting for data..."}
      </div>
    </div>
  );
}

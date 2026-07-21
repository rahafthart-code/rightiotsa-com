"""
volt_api.py — Right InsurTech IoT Bridge
يعمل على Raspberry Pi / خادم مرتبط بالحساسات.
يرسل قراءات الحساسات إلى Edge Function `iot-ingest` كل INTERVAL ثانية.

Environment variables required:
  SUPABASE_EDGE_URL   إما الإندبوينت لكل جهاز:
                      https://<project>.supabase.co/functions/v1/iot-ingest
                      أو بوابة VOLT الموحّدة بالمفتاح المشترك:
                      https://<project>.supabase.co/functions/v1/volt-webhook
  DEVICE_API_KEY      المفتاح الخاص بهذا الجهاز (لـ iot-ingest)
  VOLT_API_KEY        المفتاح المشترك (لـ volt-webhook) — أحدهما مطلوب
  DEVICE_SERIAL       الرقم التسلسلي للجهاز (مطلوب مع volt-webhook)
  READ_INTERVAL       (اختياري) المدة بين القراءات بالثواني، الافتراضي 30
"""
import requests
import time
import os
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# ─── إعدادات ──────────────────────────────────────────────
# ─── إعدادات ──────────────────────────────────────────────
EDGE_URL       = os.getenv('SUPABASE_EDGE_URL')      # iot-ingest أو volt-webhook
DEVICE_API_KEY = os.getenv('DEVICE_API_KEY')         # مفتاح الجهاز الفردي
VOLT_API_KEY   = os.getenv('VOLT_API_KEY')           # مفتاح بوابة VOLT المشترك
DEVICE_SERIAL  = os.getenv('DEVICE_SERIAL', '')      # مطلوب لـ volt-webhook
INTERVAL       = int(os.getenv('READ_INTERVAL', '30'))

if not EDGE_URL or not (DEVICE_API_KEY or VOLT_API_KEY):
    raise SystemExit('SUPABASE_EDGE_URL وأحد المفتاحين (DEVICE_API_KEY أو VOLT_API_KEY) مطلوبان')


@dataclass
class SensorReading:
    heart_rate:       float
    temperature:      float
    respiration_rate: float
    activity_score:   float
    gps_lat:          float
    gps_lng:          float
    env_temp:         float
    env_humidity:     float
    battery_level:    int
    signal_strength:  int
    recorded_at:      str


def read_sensors() -> SensorReading:
    """
    استبدل هذا الكود بقراءة الحساسات الفعلية:
    - heart_rate: حساس نبض (مثل MAX30102)
    - temperature: مقياس حرارة (DS18B20)
    - gps: وحدة GPS (NEO-6M)
    - env_temp/humidity: DHT22
    """
    import random  # احذفه عند الربط الفعلي
    return SensorReading(
        heart_rate       = round(random.uniform(36, 48), 1),
        temperature      = round(random.uniform(37.0, 38.5), 2),
        respiration_rate = round(random.uniform(12, 24), 1),
        activity_score   = round(random.uniform(30, 80), 1),
        gps_lat          = 24.6877,
        gps_lng          = 46.7219,
        env_temp         = round(random.uniform(22, 38), 1),
        env_humidity     = round(random.uniform(30, 60), 1),
        battery_level    = random.randint(60, 100),
        signal_strength  = random.randint(60, 100),
        recorded_at      = datetime.now(timezone.utc).isoformat(),
    )


def send_reading(reading: SensorReading) -> Optional[dict]:
    try:
        # اختر الترويسة بحسب الإندبوينت
        if VOLT_API_KEY and 'volt-webhook' in (EDGE_URL or ''):
            headers = {
                'Content-Type':    'application/json',
                'X-Volt-Api-Key':  VOLT_API_KEY,
            }
            payload = {'reading': {**asdict(reading), 'device_serial': DEVICE_SERIAL}}
        else:
            headers = {
                'Content-Type':      'application/json',
                'X-Device-Api-Key':  DEVICE_API_KEY or '',
            }
            payload = asdict(reading)

        res = requests.post(EDGE_URL, json=payload, timeout=10, headers=headers)
        res.raise_for_status()
        data = res.json()
        result = data.get('result') or {}
        smoothed = result.get('smoothed') or result.get('stability')
        status   = result.get('status', 'n/a')
        if smoothed is not None:
            logging.info(f"✓ Sent | stability: {float(smoothed):.1f}% | status: {status}")
        else:
            logging.info(f"✓ Sent | response: {data}")
        return data
    except requests.RequestException as e:
        logging.error(f"✗ Send failed: {e}")
        return None


def main():
    logging.info(f"volt_api started | interval: {INTERVAL}s | endpoint: {EDGE_URL}")
    while True:
        reading = read_sensors()
        send_reading(reading)
        time.sleep(INTERVAL)


if __name__ == '__main__':
    main()

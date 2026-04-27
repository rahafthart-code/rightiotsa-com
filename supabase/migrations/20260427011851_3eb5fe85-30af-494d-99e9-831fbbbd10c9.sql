-- 1) Create asset_passports table
CREATE TABLE IF NOT EXISTS public.asset_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL UNIQUE REFERENCES public.assets(id) ON DELETE CASCADE,
  official_name text,
  microchip_id text UNIQUE,
  bloodline text,
  birth_date date,
  gender text CHECK (gender IN ('male','female')),
  color_markings text,
  height_cm numeric(5,1),
  weight_kg numeric(6,2),
  issuing_authority text,
  passport_no text UNIQUE,
  veterinarian_id text,
  vaccinations jsonb DEFAULT '[]'::jsonb,
  issued_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_passports_asset ON public.asset_passports(asset_id);
CREATE INDEX IF NOT EXISTS idx_passports_passport_no ON public.asset_passports(passport_no);
CREATE INDEX IF NOT EXISTS idx_passports_microchip ON public.asset_passports(microchip_id);

-- 2) Enable RLS
ALTER TABLE public.asset_passports ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Owners full management of their assets' passports; admin/CEO view all
CREATE POLICY "Owners manage their passports"
  ON public.asset_passports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_passports.asset_id
        AND (
          a.owner_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_passports.asset_id
        AND (
          a.owner_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

CREATE POLICY "CEO views all passports"
  ON public.asset_passports
  FOR SELECT
  USING (public.has_role(auth.uid(), 'ceo'::app_role));

-- 4) Auto-update updated_at trigger
DROP TRIGGER IF EXISTS asset_passports_updated_at ON public.asset_passports;
CREATE TRIGGER asset_passports_updated_at
  BEFORE UPDATE ON public.asset_passports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
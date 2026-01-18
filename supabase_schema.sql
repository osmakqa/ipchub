-- 1. TB Registry Table (reports_tb)
-- This script ensures all columns match the React state keys exactly using quoted identifiers for case-sensitivity.
CREATE TABLE IF NOT EXISTS public.reports_tb (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    "dateReported" date DEFAULT CURRENT_DATE,
    "validationStatus" text DEFAULT 'pending',
    "validatedBy" text,
    "hospitalNumber" text,
    "lastName" text,
    "firstName" text,
    "middleName" text,
    "dob" date,
    "age" text,
    "sex" text,
    "barangay" text,
    "city" text,
    "dateOfAdmission" date,
    "area" text,
    "movementHistory" jsonb DEFAULT '[]'::jsonb,
    "xpertResults" jsonb DEFAULT '[]'::jsonb,
    "smearResults" jsonb DEFAULT '[]'::jsonb,
    "cxrDate" date,
    "classification" text,
    "anatomicalSite" text,
    "drugSusceptibility" text,
    "treatmentHistory" text,
    "emergencySurgicalProcedure" text,
    "outcome" text,
    "outcomeDate" date,
    "treatmentStarted" text,
    "treatmentStartDate" date,
    "comorbidities" jsonb DEFAULT '[]'::jsonb,
    "hivTestResult" text,
    "startedOnArt" text,
    "reporterName" text,
    "designation" text
);

-- Enable RLS and Policies for reports_tb
ALTER TABLE public.reports_tb ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert TB" ON public.reports_tb;
CREATE POLICY "Allow public insert TB" ON public.reports_tb FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public select TB" ON public.reports_tb;
CREATE POLICY "Allow public select TB" ON public.reports_tb FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public update TB" ON public.reports_tb;
CREATE POLICY "Allow public update TB" ON public.reports_tb FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete TB" ON public.reports_tb;
CREATE POLICY "Allow public delete TB" ON public.reports_tb FOR DELETE USING (true);

-- 2. Audit Daily Census Table (census_logs)
CREATE TABLE IF NOT EXISTS public.census_logs (
    date date PRIMARY KEY,
    overall integer, icu integer, nicu integer, picu integer, medicine integer, cohort integer,
    "overallVent" integer, "overallIfc" integer, "overallCentral" integer,
    "icuVent" integer, "icuIfc" integer, "icuCentral" integer,
    "nicuVent" integer, "nicuIfc" integer, "nicuCentral" integer,
    "picuVent" integer, "picuIfc" integer, "picuCentral" integer,
    "medVent" integer, "medIfc" integer, "medCentral" integer,
    "cohortVent" integer, "cohortIfc" integer, "cohortCentral" integer,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.census_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access Census" ON public.census_logs FOR ALL USING (true);

-- 3. Hand Hygiene Audit Table (audit_hand_hygiene)
CREATE TABLE IF NOT EXISTS public.audit_hand_hygiene (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    date date,
    area text,
    "auditeeName" text,
    "auditeeRole" text,
    moments jsonb DEFAULT '[]'::jsonb,
    "totalMomentsObserved" integer,
    "actionsPerformed" integer,
    "actionsMissed" integer
);

ALTER TABLE public.audit_hand_hygiene ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access HH" ON public.audit_hand_hygiene FOR ALL USING (true);

-- 4. Clinical Bundles Table (audit_bundles)
CREATE TABLE IF NOT EXISTS public.audit_bundles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    date date,
    "dateLogged" timestamptz,
    area text,
    "patientName" text,
    "bundleType" text,
    "nurseInCharge" text,
    "cauti_drainageIntact" text, "cauti_catheterSecured" text, "cauti_urineBagPosition" text, "cauti_meatalCare" text,
    "vap_headElevated" text, "vap_oralCare" text, "vap_pepticProphylaxis" text, "vap_dvtProphylaxis" text,
    "clabsi_handHygiene" text, "clabsi_scrubConnector" text, "clabsi_dressingClean" text
);

ALTER TABLE public.audit_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access Bundles" ON public.audit_bundles FOR ALL USING (true);

-- 5. Environmental Audit Table (audit_area)
CREATE TABLE IF NOT EXISTS public.audit_area (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    date date,
    "dateLogged" timestamptz,
    area text,
    category text,
    answers jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.audit_area ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access Area" ON public.audit_area FOR ALL USING (true);

-- 6. Action Plans Table (action_plans)
CREATE TABLE IF NOT EXISTS public.action_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    action text,
    "targetDate" date,
    "personResponsible" text,
    category text,
    area text,
    status text DEFAULT 'pending'
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access Actions" ON public.action_plans FOR ALL USING (true);

-- 7. Audit Schedule Table (audit_schedules)
CREATE TABLE IF NOT EXISTS public.audit_schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    date date,
    type text,
    area text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access Schedule" ON public.audit_schedules FOR ALL USING (true);

-- REFRESH PostgREST cache (optional command if running in separate transactions)
NOTIFY pgrst, 'reload schema';
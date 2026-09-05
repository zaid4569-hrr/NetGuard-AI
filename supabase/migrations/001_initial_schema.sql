-- ==============================================================================
-- NETGUARD AI — SUPABASE POSTGRESQL ENTERPRISE SCHEMA WITH ROW LEVEL SECURITY
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    organization_name VARCHAR(255) DEFAULT 'Enterprise SecOps',
    active_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferred_vendors TEXT[] DEFAULT ARRAY['Cisco', 'Fortinet', 'Juniper'],
    security_priorities TEXT[] DEFAULT ARRAY['Hardening', 'Compliance', 'Access Control'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'analyst' CHECK (role IN ('owner', 'admin', 'analyst', 'auditor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, user_id)
);

-- 5. AUDITS
CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    total_devices INTEGER DEFAULT 0,
    overall_score NUMERIC(5,2) DEFAULT 0.0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    info_count INTEGER DEFAULT 0,
    executive_summary TEXT,
    ai_insights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. AUDIT DEVICES
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    hostname VARCHAR(255),
    vendor VARCHAR(50) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'Network Device',
    os_version VARCHAR(100),
    security_score NUMERIC(5,2) DEFAULT 0.0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. AUDIT FINDINGS
CREATE TABLE IF NOT EXISTS public.findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    rule_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    status VARCHAR(30) DEFAULT 'Open' CHECK (status IN ('Open', 'Acknowledged', 'Resolved', 'Ignored')),
    evidence TEXT NOT NULL,
    explanation TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    remediation_script TEXT,
    cis_reference VARCHAR(100),
    nist_reference VARCHAR(100),
    iso27001_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(20) DEFAULT 'PDF',
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user belongs to workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Workspaces: Members can view their workspaces
CREATE POLICY "Workspace members can view workspaces"
    ON public.workspaces FOR SELECT
    USING (public.is_workspace_member(id) OR owner_id = auth.uid());

CREATE POLICY "Authenticated users can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Workspace Members
CREATE POLICY "Members can view workspace rosters"
    ON public.workspace_members FOR SELECT
    USING (public.is_workspace_member(workspace_id));

-- Audits: Isolated by workspace membership
CREATE POLICY "Users can view audits in their workspaces"
    ON public.audits FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Users can create audits in their workspaces"
    ON public.audits FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Users can delete audits in their workspaces"
    ON public.audits FOR DELETE
    USING (public.is_workspace_member(workspace_id));

-- Devices: Isolated by workspace
CREATE POLICY "Users can view devices in their workspaces"
    ON public.devices FOR SELECT
    USING (public.is_workspace_member(workspace_id));

-- Findings: Isolated by workspace
CREATE POLICY "Users can view findings in their workspaces"
    ON public.findings FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Users can update findings status in their workspaces"
    ON public.findings FOR UPDATE
    USING (public.is_workspace_member(workspace_id));

-- Reports: Isolated by workspace
CREATE POLICY "Users can view reports in their workspaces"
    ON public.reports FOR SELECT
    USING (public.is_workspace_member(workspace_id));

-- 9. AUTO-CREATE PROFILE ON AUTH USER REGISTRATION (TRIGGER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ws_id UUID;
BEGIN
    -- Create default personal workspace
    INSERT INTO public.workspaces (name, owner_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'Default') || '''s Workspace', NEW.id)
    RETURNING id INTO new_ws_id;

    -- Create user profile
    INSERT INTO public.profiles (id, email, full_name, active_workspace_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Security Operator'),
        new_ws_id
    );

    -- Add as owner in workspace members
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_ws_id, NEW.id, 'owner');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

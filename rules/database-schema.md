# 🗄️ Database Schema - iCreateTechs

Complete PostgreSQL schema for all modules and sub-modules based on the sprint plan.

---

## 📊 Schema Organization

- **public** - Application tables (main schema)
- **auth** - Supabase Auth (managed by Supabase)
- **storage** - Supabase Storage (managed by Supabase)

---

## 🔐 Core Platform Module

### `users` (Extended profile)

Extends Supabase auth.users with application-specific data

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  github_username TEXT,
  twitter_username TEXT,
  website_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_github_username ON public.users(github_username);
```

### `workspaces`

Top-level container for projects and collaboration

```sql
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON public.workspaces(slug);
```

### `workspace_members`

Collaboration and team management

```sql
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES public.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
```

### `projects`

Individual coding projects within workspaces

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  repository_url TEXT,
  language TEXT,
  framework TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'team')),
  settings JSONB DEFAULT '{}',
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX idx_projects_slug ON public.projects(workspace_id, slug);
CREATE INDEX idx_projects_last_accessed ON public.projects(last_accessed_at DESC);
```

### `conversations`

Chat threads per project for AI assistance

```sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_project ON public.conversations(project_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);
```

### `messages`

Individual messages within conversations

```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_tokens ON public.messages(tokens_used);
```

---

## 🔑 Authentication Module

### `oauth_connections`

Third-party OAuth provider connections

```sql
CREATE TABLE public.oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'google', 'gitlab', 'bitbucket')),
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_oauth_connections_user ON public.oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON public.oauth_connections(provider);
```

### `user_sessions_extended`

Extended session tracking beyond Supabase auth

```sql
CREATE TABLE public.user_sessions_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON public.user_sessions_extended(user_id);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions_extended(last_activity_at DESC);
```

---

## 💳 Billing Module

### `subscription_plans`

Available subscription tiers

```sql
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER NOT NULL, -- in cents
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}', -- {ai_tokens: 100000, projects: 10, storage_gb: 5}
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);
```

### `customers`

Stripe customer mapping

```sql
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  billing_address JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_user ON public.customers(user_id);
CREATE INDEX idx_customers_stripe ON public.customers(stripe_customer_id);
```

### `subscriptions`

Active subscriptions

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions(current_period_end);
```

### `usage_records`

Track billable usage (AI tokens, API calls, etc.)

```sql
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('ai_tokens', 'api_calls', 'storage_gb', 'executions')),
  amount DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_records_user ON public.usage_records(user_id, recorded_at DESC);
CREATE INDEX idx_usage_records_workspace ON public.usage_records(workspace_id, recorded_at DESC);
CREATE INDEX idx_usage_records_type ON public.usage_records(resource_type, recorded_at DESC);
```

### `invoices`

Payment history

```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON public.invoices(customer_id, created_at DESC);
CREATE INDEX idx_invoices_status ON public.invoices(status);
```

---

## 🤖 AI & Agents Module

### `ai_jobs`

Background AI processing jobs

```sql
CREATE TABLE public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('chat', 'refactor', 'explain', 'generate', 'analyze')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'canceled')),
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  tokens_used INTEGER,
  model TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_jobs_user ON public.ai_jobs(user_id, created_at DESC);
CREATE INDEX idx_ai_jobs_project ON public.ai_jobs(project_id);
CREATE INDEX idx_ai_jobs_status ON public.ai_jobs(status);
```

### `code_analyses`

Stored code analysis results

```sql
CREATE TABLE public.code_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('explain', 'complexity', 'security', 'performance')),
  result JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_code_analyses_project ON public.code_analyses(project_id);
CREATE INDEX idx_code_analyses_file ON public.code_analyses(project_id, file_path);
CREATE INDEX idx_code_analyses_expires ON public.code_analyses(expires_at);
```

---

## 💻 IDE / Editor Module

### `files`

Project files and folders

```sql
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  content TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  language TEXT,
  parent_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  storage_path TEXT, -- for Supabase Storage
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, path)
);

CREATE INDEX idx_files_project ON public.files(project_id);
CREATE INDEX idx_files_parent ON public.files(parent_id);
CREATE INDEX idx_files_path ON public.files(project_id, path);
```

### `file_versions`

Version history for files

```sql
CREATE TABLE public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  size_bytes INTEGER,
  changed_by UUID REFERENCES public.users(id),
  change_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file_id, version_number)
);

CREATE INDEX idx_file_versions_file ON public.file_versions(file_id, version_number DESC);
```

### `editor_sessions`

Active editor sessions and state

```sql
CREATE TABLE public.editor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  open_files JSONB DEFAULT '[]', -- [{file_id, cursor_position, scroll_position}]
  active_file_id UUID REFERENCES public.files(id),
  layout_state JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX idx_editor_sessions_user ON public.editor_sessions(user_id);
CREATE INDEX idx_editor_sessions_project ON public.editor_sessions(project_id);
```

### `terminal_sessions`

Terminal command history and output

```sql
CREATE TABLE public.terminal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  output TEXT,
  exit_code INTEGER,
  duration_ms INTEGER,
  working_directory TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_terminal_sessions_project ON public.terminal_sessions(project_id, created_at DESC);
CREATE INDEX idx_terminal_sessions_user ON public.terminal_sessions(user_id, created_at DESC);
```

### `git_repositories`

Git integration tracking

```sql
CREATE TABLE public.git_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab', 'bitbucket')),
  repo_url TEXT NOT NULL,
  repo_full_name TEXT, -- e.g., "username/repo"
  default_branch TEXT DEFAULT 'main',
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('idle', 'syncing', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_git_repositories_project ON public.git_repositories(project_id);
```

---

## 🏗️ Infrastructure Module

### `background_jobs`

Inngest job tracking

```sql
CREATE TABLE public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('ai_processing', 'code_execution', 'file_processing', 'sync', 'cleanup')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retrying')),
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_background_jobs_status ON public.background_jobs(status, priority DESC);
CREATE INDEX idx_background_jobs_scheduled ON public.background_jobs(scheduled_for);
CREATE INDEX idx_background_jobs_type ON public.background_jobs(job_type, status);
```

### `code_executions`

Judge0/Docker execution results

```sql
CREATE TABLE public.code_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  source_code TEXT NOT NULL,
  stdin TEXT,
  stdout TEXT,
  stderr TEXT,
  compile_output TEXT,
  status TEXT NOT NULL,
  exit_code INTEGER,
  execution_time_ms DECIMAL,
  memory_kb INTEGER,
  token TEXT, -- Judge0 token
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_code_executions_user ON public.code_executions(user_id, created_at DESC);
CREATE INDEX idx_code_executions_project ON public.code_executions(project_id);
```

### `api_logs`

API request/response logging

```sql
CREATE TABLE public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  request_body JSONB,
  response_body JSONB,
  duration_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_logs_user ON public.api_logs(user_id, created_at DESC);
CREATE INDEX idx_api_logs_endpoint ON public.api_logs(endpoint, created_at DESC);
CREATE INDEX idx_api_logs_status ON public.api_logs(status_code, created_at DESC);
```

---

## 📊 Observability Module

### `error_logs`

Application error tracking (Sentry integration)

```sql
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  project_id UUID REFERENCES public.projects(id),
  sentry_issue_id TEXT,
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT CHECK (severity IN ('fatal', 'error', 'warning', 'info')),
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_user ON public.error_logs(user_id, created_at DESC);
CREATE INDEX idx_error_logs_project ON public.error_logs(project_id);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity, created_at DESC);
CREATE INDEX idx_error_logs_sentry ON public.error_logs(sentry_issue_id);
```

### `analytics_events`

Feature usage and user behavior tracking

```sql
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(event_category, created_at DESC);
```

### `performance_metrics`

Application performance monitoring

```sql
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api_latency', 'db_query', 'page_load', 'ai_response')),
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_name ON public.performance_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_performance_metrics_type ON public.performance_metrics(metric_type, recorded_at DESC);
```

---

## 🔌 External APIs Module

### `api_integrations`

Third-party API configurations

```sql
CREATE TABLE public.api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'firecrawl', 'openai', 'anthropic', 'vercel')),
  api_key_encrypted TEXT,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id, provider)
);

CREATE INDEX idx_api_integrations_user ON public.api_integrations(user_id);
CREATE INDEX idx_api_integrations_workspace ON public.api_integrations(workspace_id);
```

### `webhook_logs`

Incoming webhook tracking (Stripe, GitHub, etc.)

```sql
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  response JSONB,
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_provider ON public.webhook_logs(provider, created_at DESC);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);
```

---

## 🚀 Deployment Module

### `deployments`

Deployment history and status

```sql
CREATE TABLE public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'deploying', 'success', 'failed', 'canceled')),
  commit_sha TEXT,
  branch TEXT,
  deploy_url TEXT,
  logs TEXT,
  build_time_ms INTEGER,
  deployed_by UUID REFERENCES public.users(id),
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deployments_project ON public.deployments(project_id, created_at DESC);
CREATE INDEX idx_deployments_environment ON public.deployments(environment, status);
```

### `environment_variables`

Project environment configuration

```sql
CREATE TABLE public.environment_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production', 'all')),
  is_secret BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, key, environment)
);

CREATE INDEX idx_environment_variables_project ON public.environment_variables(project_id);
```

---

## 🔒 Row Level Security (RLS) Policies

### Enable RLS on all tables

```sql
-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
-- ... (apply to all tables)
```

### Example RLS Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can view projects in their workspaces
CREATE POLICY "Users can view workspace projects"
  ON public.projects FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create projects in workspaces they're members of
CREATE POLICY "Users can create projects in their workspaces"
  ON public.projects FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );
```

---

## 🔄 Database Functions & Triggers

### Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to all relevant tables)
```

### Sync user profile with auth.users

```sql
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();
```

---

## 📈 Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_files_project_path ON public.files(project_id, path);
CREATE INDEX idx_usage_records_user_date ON public.usage_records(user_id, recorded_at DESC);
CREATE INDEX idx_ai_jobs_status_created ON public.ai_jobs(status, created_at DESC);
CREATE INDEX idx_deployments_project_env ON public.deployments(project_id, environment, created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_projects_settings ON public.projects USING GIN(settings);
CREATE INDEX idx_users_preferences ON public.users USING GIN(preferences);
CREATE INDEX idx_analytics_events_properties ON public.analytics_events USING GIN(properties);
```

---

## 🎯 Migration Strategy

### Sprint 1 - Core Tables

- users, workspaces, workspace_members
- projects, conversations, messages
- Basic RLS policies

### Sprint 2 - IDE Tables

- files, file_versions
- editor_sessions

### Sprint 3 - Execution

- code_executions, terminal_sessions

### Sprint 4-5 - AI Tables

- ai_jobs, code_analyses

### Sprint 6 - Billing

- subscription_plans, customers, subscriptions
- usage_records, invoices

### Sprint 7 - External APIs

- git_repositories, api_integrations
- oauth_connections

### Sprint 8 - Observability

- error_logs, analytics_events, performance_metrics
- deployments, environment_variables

---

## 📝 Notes

1. **Encryption**: Fields marked `*_encrypted` should use `pgcrypto` extension
2. **Storage**: Large files should use Supabase Storage with references in `files.storage_path`
3. **Partitioning**: Consider partitioning `analytics_events`, `api_logs`, `usage_records` by date for performance
4. **Retention**: Set up automated cleanup jobs for old logs and analytics (90-day retention)
5. **Backups**: Configure Supabase automated backups (point-in-time recovery)

---

**Total Tables**: 38 tables across 9 modules
**Ready for Supabase Migration!** 🚀

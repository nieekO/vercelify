export interface VercelifyProject {
  id: string;
  name: string;
  environment: 'production' | 'preview' | 'development';
  createdAt: string;
  coolifyProjectUuid: string;
  appServiceUuid: string;
  supabaseServiceUuid: string;
  appUrl: string;
  supabaseStudioUrl: string;
  supabaseAnonKey: string;
  gitRepo: string;
  gitBranch: string;
  buildCommand: string;
  outputDir: string;
  port: number;
}

export interface CoolifyServer {
  uuid: string;
  name: string;
  ip: string;
  is_reachable: boolean;
  is_usable: boolean;
  settings?: {
    is_metrics_enabled?: boolean;
    is_sentinel_enabled?: boolean;
  };
}

export interface CoolifyDeployment {
  uuid: string;
  status: string;
  commit_message?: string;
  commit_hash?: string;
  branch?: string;
  created_at: string;
  finished_at?: string;
  application_uuid?: string;
}

export interface CoolifyService {
  uuid: string;
  name: string;
  status: string;
  type?: string;
  fqdn?: string;
}

export interface ServerMetrics {
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  disk_usage: number;
  disk_total: number;
  uptime?: number;
}

export interface EnvVar {
  id?: number | string;
  key: string;
  value: string;
  isManaged?: boolean;
}

export interface CreateProjectPayload {
  name: string;
  gitRepo: string;
  gitBranch: string;
  environment: 'production' | 'development';
  buildCommand: string;
  outputDir: string;
  port: number;
  createSupabase: boolean;
}

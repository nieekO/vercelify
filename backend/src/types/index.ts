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

export interface CreateProjectRequest {
  name: string;
  gitRepo: string;
  gitBranch: string;
  environment: 'production' | 'development';
  buildCommand: string;
  outputDir: string;
  port: number;
  createSupabase: boolean;
}

export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

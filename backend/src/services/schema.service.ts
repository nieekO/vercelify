import { Client } from 'pg';
import axios from 'axios';
import { coolifyGet, coolifyPut, coolifyPost } from './coolify.service';

/**
 * Determines which schemas to create based on the project name suffix:
 *   [app]-dev  → [app]-dev  AND [app]-test  (shared dev/test Supabase instance)
 *   [app]-test → [app]-dev  AND [app]-test
 *   [app]-prod → [app]-prod
 *   (other)    → [name]
 */
export function getSchemasForProject(projectName: string): string[] {
  const name = projectName.toLowerCase().trim();
  if (name.endsWith('-prod')) return [name];
  if (name.endsWith('-dev') || name.endsWith('-test')) {
    const base = name.replace(/-(?:dev|test)$/, '');
    return [`${base}-dev`, `${base}-test`];
  }
  return [name];
}

export async function setupSupabaseSchemas(
  serviceUuid: string,
  projectName: string,
  kongUrl: string,
  serviceRoleKey: string,
  envVars: Record<string, string>,
  onStatus?: (msg: string) => void
): Promise<string[]> {
  const schemas = getSchemasForProject(projectName);
  onStatus?.(`Setting up ${schemas.length} schema(s): ${schemas.join(', ')}`);

  // Try pg-meta API first (primary — works over HTTP from apps-01 to infra-01)
  const metaOk = await tryMetaApi(kongUrl, serviceRoleKey, schemas, onStatus);

  // Fall back to direct PostgreSQL connection
  if (!metaOk) {
    const dbUrl = resolveDbUrl(envVars);
    if (dbUrl) {
      await tryDirectPostgres(dbUrl, schemas, onStatus);
    } else {
      onStatus?.('No DB URL found — schemas skipped');
      return schemas;
    }
  }

  // Update PostgREST exposed schemas in the Supabase service config
  await updateExposedSchemas(serviceUuid, schemas, onStatus);

  return schemas;
}

// ─── pg-meta API via Kong ────────────────────────────────────────────────────

async function tryMetaApi(
  kongUrl: string,
  serviceRoleKey: string,
  schemas: string[],
  onStatus?: (msg: string) => void
): Promise<boolean> {
  const base = kongUrl.replace(/\/$/, '');
  const headers = {
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
  };

  try {
    for (const schema of schemas) {
      onStatus?.(`Creating schema "${schema}" via pg-meta...`);

      // Try POST /pg/schemas (preferred — Supabase pg-meta endpoint)
      const created = await axios
        .post(`${base}/pg/schemas`, { name: schema, owner: 'postgres' }, { headers, timeout: 15000 })
        .then(() => true)
        .catch(() => false);

      if (!created) {
        // Try /pg/query as fallback (available in some Supabase versions)
        await axios.post(
          `${base}/pg/query`,
          { query: buildSchemaSQL(schema) },
          { headers, timeout: 15000 }
        );
      } else {
        // Schema created via meta API — run grants separately via /pg/query
        await axios
          .post(`${base}/pg/query`, { query: buildGrantSQL(schema) }, { headers, timeout: 15000 })
          .catch(() => null);
      }
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Direct PostgreSQL connection ────────────────────────────────────────────

async function tryDirectPostgres(
  dbUrl: string,
  schemas: string[],
  onStatus?: (msg: string) => void
): Promise<void> {
  const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    for (const schema of schemas) {
      onStatus?.(`Creating schema "${schema}" via pg...`);
      await client.query(buildSchemaSQL(schema));
    }
  } finally {
    await client.end().catch(() => null);
  }
}

function resolveDbUrl(envVars: Record<string, string>): string | null {
  const keys = ['SERVICE_URL_SUPABASEDB', 'DATABASE_URL', 'SUPABASE_DB_URL', 'POSTGRES_URL'];
  for (const k of keys) {
    if (envVars[k]?.startsWith('postgres')) return envVars[k];
  }
  const pw = envVars['SERVICE_SUPABASEDB_PASSWORD'] || envVars['POSTGRES_PASSWORD'];
  if (pw) return `postgresql://postgres:${encodeURIComponent(pw)}@${process.env.COOLIFY_INFRA_SERVER_UUID || '138.199.209.224'}:5432/postgres`;
  return null;
}

// ─── PostgREST exposed schemas ───────────────────────────────────────────────

async function updateExposedSchemas(
  serviceUuid: string,
  newSchemas: string[],
  onStatus?: (msg: string) => void
): Promise<void> {
  try {
    onStatus?.('Updating PostgREST exposed schemas...');
    const data = await coolifyGet(`/services/${serviceUuid}/environment-variables`);
    const items: Array<{ id?: number; key: string; value: string }> = Array.isArray(data) ? data : data?.data ?? [];

    const existing = items.find(i => i.key === 'PGRST_DB_SCHEMAS');
    const current = existing?.value ?? 'public,storage,graphql_public';
    const merged = [...new Set([...current.split(',').map(s => s.trim()), ...newSchemas])].join(',');

    if (merged === current) return;

    if (existing?.id) {
      await coolifyPut(`/services/${serviceUuid}/environment-variables/${existing.id}`, {
        key: 'PGRST_DB_SCHEMAS',
        value: merged,
      }).catch(() => null);
    } else {
      await coolifyPost(`/services/${serviceUuid}/environment-variables`, {
        key: 'PGRST_DB_SCHEMAS',
        value: merged,
      }).catch(() => null);
    }

    // Restart the service so PostgREST picks up the new schema list
    await coolifyPost(`/services/${serviceUuid}/restart`).catch(() => null);
    onStatus?.(`PGRST_DB_SCHEMAS updated → ${merged}`);
  } catch {
    onStatus?.('Could not update PGRST_DB_SCHEMAS (non-fatal)');
  }
}

// ─── SQL helpers ─────────────────────────────────────────────────────────────

function buildSchemaSQL(schema: string): string {
  const q = `"${schema}"`;
  return `
    CREATE SCHEMA IF NOT EXISTS ${q};
    ${buildGrantSQL(schema)}
  `;
}

function buildGrantSQL(schema: string): string {
  const q = `"${schema}"`;
  return `
    GRANT USAGE ON SCHEMA ${q} TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA ${q} GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA ${q} GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA ${q} GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA ${q} TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA ${q} TO anon, authenticated, service_role;
  `;
}

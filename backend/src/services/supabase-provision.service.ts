import { coolifyPost, coolifyGet, coolifyPut } from './coolify.service';

const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_MS = 10 * 60 * 1000;

export interface SupabaseProvisionResult {
  serviceUuid: string;
  studioUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  kongUrl: string;
}

export async function provisionSupabase(
  projectName: string,
  environment: string,
  onStatus?: (msg: string) => void
): Promise<SupabaseProvisionResult> {
  const name = `${projectName}-supabase-${environment}`;
  onStatus?.(`Creating Supabase service: ${name}`);

  const created = await coolifyPost('/services', {
    type: 'supabase',
    name,
    project_uuid: process.env.COOLIFY_DEFAULT_PROJECT_UUID,
    server_uuid: process.env.COOLIFY_INFRA_SERVER_UUID,
    environment_name: 'production',
    instant_deploy: true,
  });

  const serviceUuid: string = created.uuid;
  onStatus?.(`Supabase service created (${serviceUuid}), waiting for healthy state...`);

  await waitForServiceHealthy(serviceUuid, onStatus);

  onStatus?.('Fetching Supabase environment variables...');
  const envVars = await getServiceEnvVars(serviceUuid);

  const kongUrl = envVars['SERVICE_URL_SUPABASEKONG'] || envVars['SERVICE_FQDN_SUPABASEKONG'] || '';
  const studioUrl = envVars['SERVICE_URL_SUPABASESTUDIO'] || envVars['SERVICE_FQDN_SUPABASESTUDIO'] || kongUrl;
  const anonKey = envVars['SERVICE_SUPABASEANON_KEY'] || envVars['ANON_KEY'] || '';
  const serviceRoleKey = envVars['SERVICE_SUPABASESERVICE_ROLE_KEY'] || envVars['SERVICE_ROLE_KEY'] || '';

  return { serviceUuid, studioUrl, anonKey, serviceRoleKey, kongUrl };
}

async function waitForServiceHealthy(uuid: string, onStatus?: (msg: string) => void): Promise<void> {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const service = await coolifyGet(`/services/${uuid}`);
    const status: string = service.status || service.health_status || '';
    onStatus?.(`Supabase status: ${status}`);
    if (status.toLowerCase().includes('running') || status.toLowerCase().includes('healthy')) {
      return;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error('Supabase service did not become healthy within 10 minutes');
}

async function getServiceEnvVars(uuid: string): Promise<Record<string, string>> {
  try {
    const data = await coolifyGet(`/services/${uuid}/environment-variables`);
    const result: Record<string, string> = {};
    const items = Array.isArray(data) ? data : data?.data || [];
    for (const item of items) {
      if (item.key) result[item.key] = item.value || '';
    }
    return result;
  } catch {
    return {};
  }
}

export async function setAppEnvVars(
  appUuid: string,
  kongUrl: string,
  anonKey: string,
  serviceRoleKey: string
): Promise<void> {
  const vars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: kongUrl },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: anonKey },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: serviceRoleKey },
  ];
  for (const v of vars) {
    await coolifyPost(`/applications/${appUuid}/environment-variables`, v).catch(() =>
      coolifyPut(`/applications/${appUuid}/environment-variables`, v).catch(() => null)
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

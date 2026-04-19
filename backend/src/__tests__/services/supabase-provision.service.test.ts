jest.mock('../../services/coolify.service');
jest.mock('../../services/schema.service');

import { coolifyPost, coolifyGet, coolifyPut } from '../../services/coolify.service';
import { setupSupabaseSchemas } from '../../services/schema.service';
import { provisionSupabase, setAppEnvVars } from '../../services/supabase-provision.service';

const mockCoolifyPost = coolifyPost as jest.Mock;
const mockCoolifyGet = coolifyGet as jest.Mock;
const mockCoolifyPut = coolifyPut as jest.Mock;
const mockSetupSchemas = setupSupabaseSchemas as jest.Mock;

const HEALTHY_SERVICE = { status: 'running', uuid: 'svc-uuid' };

const ENV_VARS = [
  { key: 'SERVICE_URL_SUPABASEKONG', value: 'http://kong.test' },
  { key: 'SERVICE_URL_SUPABASESTUDIO', value: 'http://studio.test' },
  { key: 'SERVICE_SUPABASEANON_KEY', value: 'anon-key-value' },
  { key: 'SERVICE_SUPABASESERVICE_ROLE_KEY', value: 'svc-role-key' },
];

beforeEach(() => {
  mockCoolifyPost.mockResolvedValue({ uuid: 'svc-uuid' });
  mockCoolifyGet
    .mockResolvedValueOnce(HEALTHY_SERVICE)         // first poll → running
    .mockResolvedValueOnce({ data: ENV_VARS });     // env vars
  mockSetupSchemas.mockResolvedValue(['myapp']);
  mockCoolifyPut.mockResolvedValue({});
});

describe('provisionSupabase', () => {
  it('creates service, waits for healthy, fetches env vars, sets up schemas', async () => {
    const onStatus = jest.fn();
    const result = await provisionSupabase('myapp', 'production', onStatus);

    expect(mockCoolifyPost).toHaveBeenCalledWith('/services', expect.objectContaining({
      type: 'supabase', name: 'myapp-supabase-production',
    }));
    expect(result.serviceUuid).toBe('svc-uuid');
    expect(result.kongUrl).toBe('http://kong.test');
    expect(result.studioUrl).toBe('http://studio.test');
    expect(result.anonKey).toBe('anon-key-value');
    expect(result.serviceRoleKey).toBe('svc-role-key');
    expect(result.schemas).toEqual(['myapp']);
    expect(onStatus).toHaveBeenCalled();
  });

  it('polls until service becomes healthy', async () => {
    mockCoolifyGet.mockReset();
    mockCoolifyGet
      .mockResolvedValueOnce({ status: 'starting' })
      .mockResolvedValueOnce({ status: 'starting' })
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ data: ENV_VARS });

    jest.useFakeTimers();
    const promise = provisionSupabase('myapp', 'dev', undefined);
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result.serviceUuid).toBe('svc-uuid');
    jest.useRealTimers();
  });

  it('recognises "healthy" status string', async () => {
    mockCoolifyGet.mockReset();
    mockCoolifyGet
      .mockResolvedValueOnce({ status: 'healthy' })
      .mockResolvedValueOnce({ data: ENV_VARS });

    const result = await provisionSupabase('myapp', 'production', undefined);
    expect(result.serviceUuid).toBe('svc-uuid');
  });

  it('throws after timeout when service never becomes healthy', async () => {
    mockCoolifyGet.mockReset();
    const dateSpy = jest.spyOn(Date, 'now');
    dateSpy
      .mockReturnValueOnce(0)       // deadline = MAX_WAIT_MS
      .mockReturnValue(999999999);  // always past deadline

    mockCoolifyGet.mockResolvedValue({ status: 'starting' });

    await expect(provisionSupabase('myapp', 'prod', undefined))
      .rejects.toThrow('did not become healthy within 10 minutes');
  });

  it('uses fallback env var keys for kong/studio/anon/serviceRole', async () => {
    mockCoolifyGet.mockReset();
    const fallbackEnv = [
      { key: 'SERVICE_FQDN_SUPABASEKONG', value: 'http://kong-fallback.test' },
      { key: 'SERVICE_FQDN_SUPABASESTUDIO', value: 'http://studio-fallback.test' },
      { key: 'ANON_KEY', value: 'anon-fallback' },
      { key: 'SERVICE_ROLE_KEY', value: 'svc-fallback' },
    ];
    mockCoolifyGet
      .mockResolvedValueOnce(HEALTHY_SERVICE)
      .mockResolvedValueOnce({ data: fallbackEnv });

    const result = await provisionSupabase('myapp', 'production', undefined);
    expect(result.kongUrl).toBe('http://kong-fallback.test');
    expect(result.studioUrl).toBe('http://studio-fallback.test');
  });

  it('handles getServiceEnvVars error gracefully → empty strings', async () => {
    mockCoolifyGet.mockReset();
    mockCoolifyGet
      .mockResolvedValueOnce(HEALTHY_SERVICE)
      .mockRejectedValueOnce(new Error('env fetch failed'));

    const result = await provisionSupabase('myapp', 'production', undefined);
    expect(result.kongUrl).toBe('');
    expect(result.anonKey).toBe('');
  });

  it('uses status from health_status field when status missing', async () => {
    mockCoolifyGet.mockReset();
    mockCoolifyGet
      .mockResolvedValueOnce({ health_status: 'running' })
      .mockResolvedValueOnce({ data: ENV_VARS });

    const result = await provisionSupabase('myapp', 'prod', undefined);
    expect(result.serviceUuid).toBe('svc-uuid');
  });
});

describe('setAppEnvVars', () => {
  it('POSTs all three env vars to the application', async () => {
    await setAppEnvVars('app-uuid', 'http://kong', 'anon-key', 'svc-key');
    expect(mockCoolifyPost).toHaveBeenCalledTimes(3);
    expect(mockCoolifyPost).toHaveBeenCalledWith(
      '/applications/app-uuid/environment-variables',
      { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'http://kong' },
    );
  });

  it('falls back to PUT when POST fails', async () => {
    mockCoolifyPost.mockRejectedValue(new Error('conflict'));
    mockCoolifyPut.mockResolvedValue({});

    await setAppEnvVars('app-uuid', 'http://kong', 'anon', 'svc');
    expect(mockCoolifyPut).toHaveBeenCalledTimes(3);
  });

  it('silently ignores when both POST and PUT fail', async () => {
    mockCoolifyPost.mockRejectedValue(new Error('fail'));
    mockCoolifyPut.mockRejectedValue(new Error('fail too'));

    await expect(setAppEnvVars('app-uuid', 'http://kong', 'a', 's')).resolves.toBeUndefined();
  });
});

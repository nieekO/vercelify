import axios from 'axios';

jest.mock('axios');
jest.mock('pg');
jest.mock('../../services/coolify.service');

import { Client } from 'pg';
import {
  getSchemasForProject,
  setupSupabaseSchemas,
} from '../../services/schema.service';
import {
  coolifyGet,
  coolifyPut,
  coolifyPost,
} from '../../services/coolify.service';

const mockAxiosPost = axios.post as jest.Mock;
const mockCoolifyGet = coolifyGet as jest.Mock;
const mockCoolifyPut = coolifyPut as jest.Mock;
const mockCoolifyPost = coolifyPost as jest.Mock;
const MockClient = Client as jest.MockedClass<typeof Client>;

// Default happy-path mocks
beforeEach(() => {
  mockAxiosPost.mockResolvedValue({ data: {} });
  mockCoolifyGet.mockResolvedValue([]);
  mockCoolifyPut.mockResolvedValue({});
  mockCoolifyPost.mockResolvedValue({});
  MockClient.mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({}),
    end: jest.fn().mockResolvedValue(undefined),
  } as never));
});

// ── getSchemasForProject ───────────────────────────────────────────────────────

describe('getSchemasForProject', () => {
  it('returns one schema for -prod suffix', () => {
    expect(getSchemasForProject('myapp-prod')).toEqual(['myapp-prod']);
  });

  it('returns dev+test schemas for -dev suffix', () => {
    expect(getSchemasForProject('myapp-dev')).toEqual(['myapp-dev', 'myapp-test']);
  });

  it('returns dev+test schemas for -test suffix', () => {
    expect(getSchemasForProject('myapp-test')).toEqual(['myapp-dev', 'myapp-test']);
  });

  it('returns [name] for unrecognised suffix', () => {
    expect(getSchemasForProject('myapp')).toEqual(['myapp']);
  });

  it('lowercases and trims input', () => {
    expect(getSchemasForProject('  MyApp-PROD  ')).toEqual(['myapp-prod']);
  });
});

// ── setupSupabaseSchemas — meta API path ───────────────────────────────────────

describe('setupSupabaseSchemas — meta API (primary path)', () => {
  it('creates schemas via POST /pg/schemas and runs grants', async () => {
    const onStatus = jest.fn();
    mockAxiosPost
      .mockResolvedValueOnce({ data: {} }) // POST /pg/schemas succeeds
      .mockResolvedValueOnce({ data: {} }); // POST /pg/query grants succeeds

    const schemas = await setupSupabaseSchemas(
      'service-uuid', 'myapp', 'http://kong', 'svc-key', {}, onStatus,
    );

    expect(schemas).toEqual(['myapp']);
    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining('/pg/schemas'),
      expect.objectContaining({ name: 'myapp' }),
      expect.anything(),
    );
    expect(onStatus).toHaveBeenCalledWith(expect.stringContaining('schema'));
  });

  it('falls back to /pg/query when POST /pg/schemas fails', async () => {
    mockAxiosPost
      .mockRejectedValueOnce(new Error('not found'))   // POST /pg/schemas fails
      .mockResolvedValueOnce({ data: {} });             // POST /pg/query succeeds

    const schemas = await setupSupabaseSchemas(
      'service-uuid', 'myapp', 'http://kong', 'svc-key', {}, undefined,
    );
    expect(schemas).toEqual(['myapp']);
  });

  it('swallows grant errors silently (catch → null)', async () => {
    mockAxiosPost
      .mockResolvedValueOnce({ data: {} })             // POST /pg/schemas ok
      .mockRejectedValueOnce(new Error('grant failed')); // grant POST fails

    const schemas = await setupSupabaseSchemas(
      'service-uuid', 'myapp', 'http://kong', 'svc-key', {}, undefined,
    );
    expect(schemas).toEqual(['myapp']);
  });

  it('returns false from meta (both requests fail) → tries postgres path', async () => {
    mockAxiosPost.mockRejectedValue(new Error('total failure'));
    const envVars = { SERVICE_URL_SUPABASEDB: 'postgresql://localhost/db' };

    const mockPgClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue({}),
      end: jest.fn().mockResolvedValue(undefined),
    };
    MockClient.mockImplementation(() => mockPgClient as never);

    const schemas = await setupSupabaseSchemas(
      'service-uuid', 'myapp', 'http://kong', 'svc-key', envVars, undefined,
    );
    expect(schemas).toEqual(['myapp']);
    expect(mockPgClient.connect).toHaveBeenCalled();
  });
});

// ── resolveDbUrl — all branches ────────────────────────────────────────────────

describe('resolveDbUrl — via setupSupabaseSchemas fallback path', () => {
  beforeEach(() => {
    mockAxiosPost.mockRejectedValue(new Error('meta fail'));
  });

  const cases: Array<[string, Record<string, string>]> = [
    ['SERVICE_URL_SUPABASEDB', { SERVICE_URL_SUPABASEDB: 'postgresql://a/db' }],
    ['DATABASE_URL',           { DATABASE_URL: 'postgresql://b/db' }],
    ['SUPABASE_DB_URL',        { SUPABASE_DB_URL: 'postgresql://c/db' }],
    ['POSTGRES_URL',           { POSTGRES_URL: 'postgresql://d/db' }],
  ];

  it.each(cases)('uses %s when present', async (_label, envVars) => {
    const pg = { connect: jest.fn().mockResolvedValue(undefined), query: jest.fn().mockResolvedValue({}), end: jest.fn().mockResolvedValue(undefined) };
    MockClient.mockImplementation(() => pg as never);
    await setupSupabaseSchemas('s', 'app', 'http://k', 'k', envVars);
    expect(pg.connect).toHaveBeenCalled();
  });

  it('builds URL from SERVICE_SUPABASEDB_PASSWORD', async () => {
    const envVars = { SERVICE_SUPABASEDB_PASSWORD: 'secret' };
    const pg = { connect: jest.fn().mockResolvedValue(undefined), query: jest.fn().mockResolvedValue({}), end: jest.fn().mockResolvedValue(undefined) };
    MockClient.mockImplementation(() => pg as never);
    await setupSupabaseSchemas('s', 'app', 'http://k', 'k', envVars);
    expect(MockClient).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: expect.stringContaining('postgres'),
    }));
  });

  it('builds URL from POSTGRES_PASSWORD when SERVICE_SUPABASEDB_PASSWORD missing', async () => {
    const envVars = { POSTGRES_PASSWORD: 'pw' };
    const pg = { connect: jest.fn().mockResolvedValue(undefined), query: jest.fn().mockResolvedValue({}), end: jest.fn().mockResolvedValue(undefined) };
    MockClient.mockImplementation(() => pg as never);
    await setupSupabaseSchemas('s', 'app', 'http://k', 'k', envVars);
    expect(MockClient).toHaveBeenCalled();
  });

  it('calls onStatus and returns when no DB URL can be resolved', async () => {
    const onStatus = jest.fn();
    await setupSupabaseSchemas('s', 'app', 'http://k', 'k', {}, onStatus);
    expect(onStatus).toHaveBeenCalledWith(expect.stringContaining('No DB URL'));
  });
});

// ── tryDirectPostgres — pg client errors ──────────────────────────────────────

describe('tryDirectPostgres — pg client error handling', () => {
  beforeEach(() => {
    mockAxiosPost.mockRejectedValue(new Error('meta fail'));
  });

  it('calls client.end even when query throws', async () => {
    const mockEnd = jest.fn().mockResolvedValue(undefined);
    const pg = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockRejectedValue(new Error('query failed')),
      end: mockEnd,
    };
    MockClient.mockImplementation(() => pg as never);

    await expect(
      setupSupabaseSchemas('s', 'app', 'http://k', 'k', { DATABASE_URL: 'postgresql://x/db' }),
    ).rejects.toThrow('query failed');
    expect(mockEnd).toHaveBeenCalled();
  });

  it('swallows client.end() errors via catch(() => null)', async () => {
    const pg = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockRejectedValue(new Error('fail')),
      end: jest.fn().mockRejectedValue(new Error('end fail')),
    };
    MockClient.mockImplementation(() => pg as never);

    await expect(
      setupSupabaseSchemas('s', 'app', 'http://k', 'k', { DATABASE_URL: 'postgresql://x/db' }),
    ).rejects.toThrow('fail');
  });
});

// ── updateExposedSchemas — all branches ───────────────────────────────────────

describe('updateExposedSchemas — via setupSupabaseSchemas (meta ok)', () => {
  beforeEach(() => {
    mockAxiosPost.mockResolvedValue({ data: {} }); // meta ok
  });

  it('PUTs when existing PGRST_DB_SCHEMAS has an id', async () => {
    mockCoolifyGet.mockResolvedValue([
      { id: 42, key: 'PGRST_DB_SCHEMAS', value: 'public,storage,graphql_public' },
    ]);
    await setupSupabaseSchemas('svc', 'newschema', 'http://k', 'k', {});
    expect(mockCoolifyPut).toHaveBeenCalledWith(
      expect.stringContaining('PGRST_DB_SCHEMAS'.toLowerCase().replace('_', '')),
      expect.anything(),
    );
  });

  it('POSTs when existing PGRST_DB_SCHEMAS has no id', async () => {
    mockCoolifyGet.mockResolvedValue([
      { key: 'PGRST_DB_SCHEMAS', value: 'public,storage,graphql_public' },
    ]);
    await setupSupabaseSchemas('svc', 'newschema', 'http://k', 'k', {});
    expect(mockCoolifyPost).toHaveBeenCalled();
  });

  it('returns early when merged === current (schemas already present)', async () => {
    mockCoolifyGet.mockResolvedValue([
      { id: 1, key: 'PGRST_DB_SCHEMAS', value: 'public,storage,graphql_public,myschema' },
    ]);
    await setupSupabaseSchemas('svc', 'myschema', 'http://k', 'k', {});
    expect(mockCoolifyPut).not.toHaveBeenCalled();
    expect(mockCoolifyPost).not.toHaveBeenCalled();
  });

  it('handles coolifyGet error gracefully', async () => {
    mockCoolifyGet.mockRejectedValue(new Error('network error'));
    const onStatus = jest.fn();
    await setupSupabaseSchemas('svc', 'myschema', 'http://k', 'k', {}, onStatus);
    expect(onStatus).toHaveBeenCalledWith(expect.stringContaining('non-fatal'));
  });
});

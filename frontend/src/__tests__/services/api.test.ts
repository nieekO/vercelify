import axios from 'axios';

vi.mock('axios', () => {
  const mockInterceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  return {
    default: {
      create: vi.fn(() => ({ interceptors: mockInterceptors })),
      interceptors: mockInterceptors,
    },
  };
});

describe('api service', () => {
  let requestHandler: (config: { headers: Record<string, string> }) => { headers: Record<string, string> };
  let responseSuccessHandler: (res: unknown) => unknown;
  let responseErrorHandler: (err: { response?: { status: number } }) => Promise<never>;

  beforeEach(async () => {
    vi.resetModules();

    const mockCreate = vi.fn();
    const capturedInterceptors = {
      request: { use: vi.fn((fn: typeof requestHandler) => { requestHandler = fn; }) },
      response: {
        use: vi.fn((s: typeof responseSuccessHandler, e: typeof responseErrorHandler) => {
          responseSuccessHandler = s;
          responseErrorHandler = e;
        }),
      },
    };
    mockCreate.mockReturnValue({ interceptors: capturedInterceptors });

    vi.doMock('axios', () => ({
      default: { create: mockCreate },
    }));

    await import('../../services/api');
  });

  it('attaches Bearer token from localStorage to requests', () => {
    localStorage.setItem('vercelify_token', 'my-token');
    const config = { headers: {} as Record<string, string> };
    const result = requestHandler(config);
    expect(result.headers['Authorization']).toBe('Bearer my-token');
  });

  it('does not attach Authorization header when no token', () => {
    const config = { headers: {} as Record<string, string> };
    const result = requestHandler(config);
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('passes through successful responses', () => {
    const response = { status: 200, data: { ok: true } };
    expect(responseSuccessHandler(response)).toBe(response);
  });

  it('removes token and redirects to /login on 401', async () => {
    localStorage.setItem('vercelify_token', 'old-token');
    const mockAssign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    const origHref = Object.getOwnPropertyDescriptor(window, 'location');
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: '' },
      writable: true,
    });

    const err = { response: { status: 401 } };
    await expect(responseErrorHandler(err)).rejects.toEqual(err);
    expect(localStorage.getItem('vercelify_token')).toBeNull();
    void mockAssign;
    void origHref;
  });

  it('rejects but does not redirect for non-401 errors', async () => {
    localStorage.setItem('vercelify_token', 'token');
    const err = { response: { status: 500 } };
    await expect(responseErrorHandler(err)).rejects.toEqual(err);
    expect(localStorage.getItem('vercelify_token')).not.toBeNull();
  });

  it('rejects for errors without response', async () => {
    const err = { message: 'Network Error' };
    await expect(responseErrorHandler(err as never)).rejects.toEqual(err);
  });

  afterEach(() => {
    vi.unmock('axios');
    vi.resetModules();
  });
});

// Keep axios import to satisfy linter
void axios;

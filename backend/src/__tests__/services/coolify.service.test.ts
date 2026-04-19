import { AxiosError, AxiosResponse } from 'axios';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockPatch = jest.fn();
const mockCreate = jest.fn(() => ({
  get: mockGet, post: mockPost, put: mockPut,
  delete: mockDelete, patch: mockPatch,
}));

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  default: { create: mockCreate },
  create: mockCreate,
}));

// Re-require after mock is set up so getCoolifyClient picks up the mock
jest.resetModules();
const {
  coolifyGet, coolifyPost, coolifyPut, coolifyDelete, coolifyPatch,
} = jest.requireActual('../../services/coolify.service') as typeof import('../../services/coolify.service');

function makeAxiosError(status: number, data: unknown): AxiosError {
  const err = new AxiosError('Request failed');
  err.response = {
    status, data, headers: {}, config: { headers: {} } as never, statusText: 'Error',
  } as AxiosResponse;
  return err;
}

describe('coolify.service', () => {
  describe('coolifyGet', () => {
    it('returns response data on success', async () => {
      mockGet.mockResolvedValue({ data: { ok: true } });
      const result = await coolifyGet('/test');
      expect(result).toEqual({ ok: true });
    });

    it('throws formatted error when AxiosError with response.message', async () => {
      mockGet.mockRejectedValue(makeAxiosError(422, { message: 'Already exists' }));
      await expect(coolifyGet('/test')).rejects.toThrow('Coolify API 422: Already exists');
    });

    it('throws formatted error when AxiosError with response.error', async () => {
      mockGet.mockRejectedValue(makeAxiosError(500, { error: 'Server failure' }));
      await expect(coolifyGet('/test')).rejects.toThrow('Coolify API 500: Server failure');
    });

    it('throws formatted error using JSON.stringify when no message/error', async () => {
      mockGet.mockRejectedValue(makeAxiosError(400, { code: 'UNKNOWN' }));
      await expect(coolifyGet('/test')).rejects.toThrow('Coolify API 400:');
    });

    it('re-throws non-Axios errors', async () => {
      mockGet.mockRejectedValue(new Error('Network failure'));
      await expect(coolifyGet('/test')).rejects.toThrow('Network failure');
    });
  });

  describe('coolifyPost', () => {
    it('returns response data on success', async () => {
      mockPost.mockResolvedValue({ data: { uuid: 'abc' } });
      const result = await coolifyPost('/services', { name: 'test' });
      expect(result).toEqual({ uuid: 'abc' });
    });

    it('throws on error', async () => {
      mockPost.mockRejectedValue(makeAxiosError(404, { message: 'Not found' }));
      await expect(coolifyPost('/missing')).rejects.toThrow('Coolify API 404: Not found');
    });
  });

  describe('coolifyPut', () => {
    it('returns response data on success', async () => {
      mockPut.mockResolvedValue({ data: { updated: true } });
      const result = await coolifyPut('/resource/1', { key: 'val' });
      expect(result).toEqual({ updated: true });
    });

    it('throws on error', async () => {
      mockPut.mockRejectedValue(makeAxiosError(403, { message: 'Forbidden' }));
      await expect(coolifyPut('/resource/1')).rejects.toThrow('Coolify API 403: Forbidden');
    });
  });

  describe('coolifyDelete', () => {
    it('returns response data on success', async () => {
      mockDelete.mockResolvedValue({ data: { deleted: true } });
      const result = await coolifyDelete('/resource/1');
      expect(result).toEqual({ deleted: true });
    });

    it('throws on error', async () => {
      mockDelete.mockRejectedValue(makeAxiosError(404, { message: 'Not found' }));
      await expect(coolifyDelete('/resource/1')).rejects.toThrow('Coolify API 404: Not found');
    });
  });

  describe('coolifyPatch', () => {
    it('returns response data on success', async () => {
      mockPatch.mockResolvedValue({ data: { patched: true } });
      const result = await coolifyPatch('/resource/1', { field: 'x' });
      expect(result).toEqual({ patched: true });
    });

    it('throws on error', async () => {
      mockPatch.mockRejectedValue(makeAxiosError(500, { error: 'Internal error' }));
      await expect(coolifyPatch('/resource/1')).rejects.toThrow('Coolify API 500: Internal error');
    });
  });
});

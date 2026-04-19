jest.mock('axios', () => {
  const get = jest.fn();
  const post = jest.fn();
  const put = jest.fn();
  const del = jest.fn();
  const patch = jest.fn();
  const client = { get, post, put, delete: del, patch };
  return {
    ...jest.requireActual('axios'),
    default: { create: jest.fn(() => client) },
    create: jest.fn(() => client),
    _mockClient: client,
  };
});

import { AxiosError, AxiosResponse } from 'axios';
import {
  coolifyGet, coolifyPost, coolifyPut, coolifyDelete, coolifyPatch,
} from '../../services/coolify.service';

type MockClient = { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock; patch: jest.Mock };
type MockAxiosModule = { create: jest.Mock; _mockClient: MockClient };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axiosMock = require('axios') as MockAxiosModule;
const { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete, patch: mockPatch } = axiosMock._mockClient;

beforeEach(() => {
  // resetMocks clears create's implementation; re-establish it so getCoolifyClient() works
  axiosMock.create.mockReturnValue(axiosMock._mockClient);
});

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

import axios, { AxiosInstance, AxiosError } from 'axios';

let client: AxiosInstance;

function getCoolifyClient(): AxiosInstance {
  if (!client) {
    client = axios.create({
      baseURL: process.env.COOLIFY_API_URL,
      headers: {
        Authorization: `Bearer ${process.env.COOLIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }
  return client;
}

function extractError(err: unknown): never {
  if (err instanceof AxiosError && err.response) {
    const body = err.response.data;
    const msg = body?.message || body?.error || JSON.stringify(body);
    throw new Error(`Coolify API ${err.response.status}: ${msg}`);
  }
  throw err;
}

export async function coolifyGet(path: string) {
  try {
    const res = await getCoolifyClient().get(path);
    return res.data;
  } catch (err) { extractError(err); }
}

export async function coolifyPost(path: string, data?: unknown) {
  try {
    const res = await getCoolifyClient().post(path, data);
    return res.data;
  } catch (err) { extractError(err); }
}

export async function coolifyPut(path: string, data?: unknown) {
  try {
    const res = await getCoolifyClient().put(path, data);
    return res.data;
  } catch (err) { extractError(err); }
}

export async function coolifyDelete(path: string) {
  try {
    const res = await getCoolifyClient().delete(path);
    return res.data;
  } catch (err) { extractError(err); }
}

export async function coolifyPatch(path: string, data?: unknown) {
  try {
    const res = await getCoolifyClient().patch(path, data);
    return res.data;
  } catch (err) { extractError(err); }
}

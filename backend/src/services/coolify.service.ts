import axios, { AxiosInstance } from 'axios';

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

export async function coolifyGet(path: string) {
  const res = await getCoolifyClient().get(path);
  return res.data;
}

export async function coolifyPost(path: string, data?: unknown) {
  const res = await getCoolifyClient().post(path, data);
  return res.data;
}

export async function coolifyPut(path: string, data?: unknown) {
  const res = await getCoolifyClient().put(path, data);
  return res.data;
}

export async function coolifyDelete(path: string) {
  const res = await getCoolifyClient().delete(path);
  return res.data;
}

export async function coolifyPatch(path: string, data?: unknown) {
  const res = await getCoolifyClient().patch(path, data);
  return res.data;
}

export async function api(path, { body, headers, ...options } = {}) {
  const request = () =>
    fetch(`/api${path}`, {
      credentials: 'include',
      headers:
        body === undefined
          ? headers
          : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    });

  let res = await request();

  // Access token lasts 15 minutes: refresh once and retry.
  if (res.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) res = await request();
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(
      json.error?.message ?? json.message ?? 'Something went wrong.'
    );
    error.status = res.status;
    error.code = json.error?.code;
    error.fields = json.error?.fields ?? {};
    throw error;
  }
  return json;
}

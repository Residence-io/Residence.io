const api = process.env.SMOKE_API_URL ?? 'http://localhost:3001/api/v1';
const web = process.env.SMOKE_WEB_URL ?? 'http://localhost:3000';
const password = process.env.RESIDENCE_SEED_PASSWORD;

if (!password)
  throw new Error('RESIDENCE_SEED_PASSWORD is required for smoke tests.');

async function expectOk(url, init) {
  const response = await fetch(url, init);
  if (!response.ok)
    throw new Error(
      `${init?.method ?? 'GET'} ${url} returned ${response.status}.`,
    );
  return response;
}

async function login(identifier) {
  const response = await expectOk(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const payload = await response.json();
  if (payload?.user?.username !== identifier)
    throw new Error(`Login returned an unexpected user for ${identifier}.`);
  const cookies = response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0]);
  if (cookies.length < 2)
    throw new Error('Login did not establish the expected session cookies.');
  return cookies.join('; ');
}

await expectOk(`${api}/health/live`);
await expectOk(`${api}/health/ready`);

const administratorCookie = await login('superadmin');
await expectOk(`${api}/auth/me`, { headers: { cookie: administratorCookie } });
await expectOk(`${api}/reports/dashboard/admin`, {
  headers: { cookie: administratorCookie },
});

const residentCookie = await login('resident');
await expectOk(`${api}/auth/me`, { headers: { cookie: residentCookie } });
await expectOk(`${api}/residents/me`, { headers: { cookie: residentCookie } });
await expectOk(`${api}/reports/dashboard/me`, {
  headers: { cookie: residentCookie },
});
await expectOk(`${web}/login`);

process.stdout.write(
  'Residence.io seeded authentication and critical-route smoke test passed.\n',
);

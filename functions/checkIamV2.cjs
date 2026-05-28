const {GoogleAuth} = require('google-auth-library');
const fetch = require('node-fetch');
(async () => {
  const auth = new GoogleAuth({scopes: ['https://www.googleapis.com/auth/cloud-platform']});
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const url = 'https://cloudfunctions.googleapis.com/v2/projects/ics-npos/locations/southamerica-east1/functions/api:getIamPolicy';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.token || token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.text();
  console.log('STATUS', res.status);
  console.log(data);
})().catch(err => { console.error(err); process.exit(1); });

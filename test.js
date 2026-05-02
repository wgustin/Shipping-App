const fetch = require('node-fetch');

async function test() {
  const EHUB_API_KEY = process.env.EHUB_API_KEY;
  if (!EHUB_API_KEY) {
    console.log("No API key");
    return;
  }
  
  const endpoints = [
    '/api/v2/labels',
    '/api/v2/shipments',
    '/api/v2/orders',
    '/labels',
    '/shipments',
    '/v2/labels',
    '/v2/shipments'
  ];

  for (const ep of endpoints) {
    const res = await fetch(`https://api.ehub.com${ep}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EHUB_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(ep, res.status, await res.text().catch(() => ''));
  }
}

test();

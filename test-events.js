const http = require('http');

let passed = 0, failed = 0;

function req(method, path, body, token, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = {};
    if (payload) headers['Content-Type'] = contentType;
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    const r = http.request({ method, headers, hostname: 'localhost', port: 5000, path }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { 
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } 
        catch { resolve({ status: res.statusCode, body: data }); } 
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function assert(label, condition, detail) {
  if (condition) { console.log('  PASS  ' + label); passed++; }
  else { console.log('  FAIL  ' + label + (detail ? '  [got: ' + detail + ']' : '')); failed++; }
}

(async () => {
  console.log('── Setup: Create Test Users ──');
  
  // Create Organizer A
  const org1Email = 'orga_' + Date.now() + '@example.com';
  const org1Res = await req('POST', '/api/auth/register', { name: 'Org A', email: org1Email, password: 'password123', role: 'organizer' });
  const org1Token = org1Res.body.token;
  
  // Create Organizer B
  const org2Email = 'orgb_' + Date.now() + '@example.com';
  const org2Res = await req('POST', '/api/auth/register', { name: 'Org B', email: org2Email, password: 'password123', role: 'organizer' });
  const org2Token = org2Res.body.token;

  // Create Customer
  const custEmail = 'cust_' + Date.now() + '@example.com';
  const custRes = await req('POST', '/api/auth/register', { name: 'Customer', email: custEmail, password: 'password123', role: 'customer' });
  const custToken = custRes.body.token;
  
  let eventId = '';

  console.log('\n── Test 1: Organizer can create event ──────────────────────');
  const eventPayload = {
    title: 'Test Event',
    description: 'A great event',
    date: '2027-12-31',
    time: '20:00',
    venue: 'Test Arena',
    city: 'Test City',
    ticketTypes: JSON.stringify([{ name: 'VIP', price: 100, quantity: 50 }])
  };
  const r1 = await req('POST', '/api/events', eventPayload, org1Token);
  assert('Status 201', r1.status === 201, r1.status);
  assert('Event created with ID', typeof r1.body._id === 'string');
  eventId = r1.body._id || '';

  console.log('\n── Test 2: Customer cannot create event ────────────────────');
  const r2 = await req('POST', '/api/events', eventPayload, custToken);
  assert('Status 403 (Forbidden)', r2.status === 403, r2.status);

  console.log('\n── Test 3: Unauthenticated user cannot create event ────────');
  const r3 = await req('POST', '/api/events', eventPayload, null);
  assert('Status 401 (Unauthorized)', r3.status === 401, r3.status);

  console.log('\n── Test 4: Organizer can see their own events ──────────────');
  const r4 = await req('GET', '/api/events/my-events', null, org1Token);
  assert('Status 200', r4.status === 200, r4.status);
  assert('Returns array', Array.isArray(r4.body));
  assert('Event is in list', r4.body.some(e => e._id === eventId));

  // Publish event so it appears publicly
  await req('PATCH', `/api/events/${eventId}/publish`, null, org1Token);

  console.log('\n── Test 5: Public user can view events ─────────────────────');
  const r5 = await req('GET', '/api/events', null, null);
  assert('Status 200', r5.status === 200, r5.status);
  assert('Event is visible publicly', r5.body.some(e => e._id === eventId));

  console.log('\n── Test 6: Public user can view single event details ───────');
  const r6 = await req('GET', `/api/events/${eventId}`, null, null);
  assert('Status 200', r6.status === 200, r6.status);
  assert('Correct event returned', r6.body._id === eventId);
  assert('Populated organizer name', !!r6.body.organizer?.name);

  console.log('\n── Test 7: Organizer can update their own event ────────────');
  const r7 = await req('PUT', `/api/events/${eventId}`, { title: 'Updated Test Event' }, org1Token);
  assert('Status 200', r7.status === 200, r7.status);
  assert('Title updated', r7.body.title === 'Updated Test Event');

  console.log('\n── Test 8: Organizer cannot update another organizer\'s event');
  const r8 = await req('PUT', `/api/events/${eventId}`, { title: 'Hacked Event' }, org2Token);
  assert('Status 403 (Forbidden)', r8.status === 403, r8.status);

  console.log('\n── Test 9: Organizer can delete their own event ────────────');
  const r9 = await req('DELETE', `/api/events/${eventId}`, null, org1Token);
  assert('Status 200', r9.status === 200, r9.status);

  console.log('\n── Test 10: Deleted event no longer appears publicly ───────');
  const r10 = await req('GET', `/api/events/${eventId}`, null, null);
  assert('Status 404 (Not Found)', r10.status === 404, r10.status);

  console.log('\n═══════════════════════════════════════════════════════════');
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} passed` + (failed ? `  (${failed} FAILED)` : '  ✓ All clear'));
  process.exit(failed > 0 ? 1 : 0);
})();

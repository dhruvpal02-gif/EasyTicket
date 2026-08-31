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
  console.log('── Setup: Create Test Users, Event, & Ticket ──');
  
  const orgEmail = 'org_' + Date.now() + '@example.com';
  const orgRes = await req('POST', '/api/auth/register', { name: 'Organizer', email: orgEmail, password: 'password123', role: 'organizer' });
  const orgToken = orgRes.body.token;

  const org2Email = 'org2_' + Date.now() + '@example.com';
  const org2Res = await req('POST', '/api/auth/register', { name: 'Organizer 2', email: org2Email, password: 'password123', role: 'organizer' });
  const org2Token = org2Res.body.token;

  const cust1Email = 'cust1_' + Date.now() + '@example.com';
  const cust1Res = await req('POST', '/api/auth/register', { name: 'Customer 1', email: cust1Email, password: 'password123', role: 'customer' });
  const cust1Token = cust1Res.body.token;
  
  const cust2Email = 'cust2_' + Date.now() + '@example.com';
  const cust2Res = await req('POST', '/api/auth/register', { name: 'Customer 2', email: cust2Email, password: 'password123', role: 'customer' });
  const cust2Token = cust2Res.body.token;
  
  const eventRes = await req('POST', '/api/events', {
    title: 'QR Test Event', description: 'Testing QR', date: '2028-03-01', time: '20:00', venue: 'V', city: 'C',
    ticketTypes: JSON.stringify([{ name: 'General', price: 100, quantity: 10 }])
  }, orgToken);
  
  const eventId = eventRes.body._id;
  const ticketTypeId = eventRes.body.ticketTypes[0]._id;

  const ticketRes = await req('POST', '/api/tickets', {
    eventId, ticketTypeId, quantity: 1, attendeeName: 'Customer 1', attendeeEmail: 'c1@test.com', attendeePhone: '123'
  }, cust1Token);
  const ticketId = ticketRes.body._id;

  console.log('\n── Test 1: Customer can access their own ticket ────────────');
  const r1 = await req('GET', `/api/tickets/${ticketId}`, null, cust1Token);
  assert('Status 200', r1.status === 200, r1.status);

  console.log('\n── Test 2: Pending ticket does not receive a valid QR ──────');
  assert('qrCodeDataUri is null', r1.body.qrCodeDataUri === null, 'Was not null');
  assert('Raw qrToken is NOT exposed in JSON payload', r1.body.qrToken === undefined, 'qrToken was exposed');

  console.log('\n── Test 3: Organizer can access a ticket for their own event');
  const r3 = await req('GET', `/api/tickets/${ticketId}`, null, orgToken);
  assert('Status 200', r3.status === 200, r3.status);

  console.log('\n── Test 4: Organizer cannot access another organizer\'s ticket');
  const r4 = await req('GET', `/api/tickets/${ticketId}`, null, org2Token);
  assert('Status 403 (Forbidden)', r4.status === 403, r4.status);

  console.log('\n── Test 5: Customer cannot access another customer\'s ticket ');
  const r5 = await req('GET', `/api/tickets/${ticketId}`, null, cust2Token);
  assert('Status 403 (Forbidden)', r5.status === 403, r5.status);

  console.log('\n── Test 6: Paid customer ticket returns valid QR data ──────');
  // Pay for it
  await req('POST', `/api/tickets/${ticketId}/pay`, { paymentMethod: 'upi' }, cust1Token);
  const r6 = await req('GET', `/api/tickets/${ticketId}`, null, cust1Token);
  assert('Status 200', r6.status === 200, r6.status);
  assert('qrCodeDataUri is returned as base64', typeof r6.body.qrCodeDataUri === 'string' && r6.body.qrCodeDataUri.startsWith('data:image/png;base64,'), 'Missing or invalid QR');

  console.log('\n── Test 7: Failed ticket does not receive a valid QR ───────');
  // Create a second ticket and fail it
  const ticket2Res = await req('POST', '/api/tickets', {
    eventId, ticketTypeId, quantity: 1, attendeeName: 'C', attendeeEmail: 'c@test.com', attendeePhone: '1'
  }, cust1Token);
  await req('POST', `/api/tickets/${ticket2Res.body._id}/fail`, null, cust1Token);
  const r7 = await req('GET', `/api/tickets/${ticket2Res.body._id}`, null, cust1Token);
  assert('qrCodeDataUri is null on failed ticket', r7.body.qrCodeDataUri === null, 'Was not null');

  console.log('\n── Test 8: Viewing the QR does not mark the ticket as used ─');
  assert('Status is still confirmed, not used', r6.body.status === 'confirmed', r6.body.status);

  console.log('\n═══════════════════════════════════════════════════════════');
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} passed` + (failed ? `  (${failed} FAILED)` : '  ✓ All clear'));
  process.exit(failed > 0 ? 1 : 0);
})();

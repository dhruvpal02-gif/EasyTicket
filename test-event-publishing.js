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
  console.log('── Setup: Create Test Users & Event ──');
  
  const orgEmail = 'org_' + Date.now() + '@example.com';
  const orgRes = await req('POST', '/api/auth/register', { name: 'Organizer', email: orgEmail, password: 'password123', role: 'organizer' });
  const orgToken = orgRes.body.token;

  const org2Email = 'org2_' + Date.now() + '@example.com';
  const org2Res = await req('POST', '/api/auth/register', { name: 'Organizer 2', email: org2Email, password: 'password123', role: 'organizer' });
  const org2Token = org2Res.body.token;

  const custEmail = 'cust_' + Date.now() + '@example.com';
  const custRes = await req('POST', '/api/auth/register', { name: 'Customer', email: custEmail, password: 'password123', role: 'customer' });
  const custToken = custRes.body.token;

  // Create event
  const eventRes = await req('POST', '/api/events', {
    title: 'Draft Test Event', description: 'Testing publishing', date: '2028-05-01', time: '20:00', venue: 'V', city: 'C',
    ticketTypes: JSON.stringify([{ name: 'General', price: 100, quantity: 10 }])
  }, orgToken);
  
  const eventId = eventRes.body._id;

  console.log('\n── Test 1: Newly created event is unpublished (Draft) ──────');
  assert('isPublished is false', eventRes.body.isPublished === false);

  console.log('\n── Test 2: Unpublished event does not appear in public listing');
  const r2 = await req('GET', '/api/events');
  assert('Event not in public listing', !r2.body.some(e => e._id === eventId));

  console.log('\n── Test 3: Unauthorized user (customer) cannot view unpublished event');
  const r3 = await req('GET', `/api/events/${eventId}`, null, custToken);
  assert('Status 404', r3.status === 404, r3.status);

  console.log('\n── Test 4: Organizer can preview their own draft event ───────');
  const r4 = await req('GET', `/api/events/${eventId}`, null, orgToken);
  assert('Status 200', r4.status === 200, r4.status);

  console.log('\n── Test 5: Customer cannot publish an event ──────────────────');
  const r5 = await req('PATCH', `/api/events/${eventId}/publish`, null, custToken);
  assert('Status 403', r5.status === 403, r5.status);

  console.log('\n── Test 6: Organizer cannot publish another organizer\'s event ─');
  const r6 = await req('PATCH', `/api/events/${eventId}/publish`, null, org2Token);
  assert('Status 403', r6.status === 403, r6.status);

  console.log('\n── Test 7: Cannot get QR code for unpublished event ──────────');
  const r7 = await req('GET', `/api/events/${eventId}/qr`, null, orgToken);
  assert('Status 400', r7.status === 400, r7.status);

  console.log('\n── Test 8: Organizer can publish their own event ─────────────');
  const r8 = await req('PATCH', `/api/events/${eventId}/publish`, null, orgToken);
  assert('Status 200', r8.status === 200, r8.status);
  assert('isPublished is true', r8.body.event.isPublished === true);

  console.log('\n── Test 9: Published event appears in public listing ─────────');
  const r9 = await req('GET', '/api/events');
  assert('Event is in public listing', r9.body.some(e => e._id === eventId));

  console.log('\n── Test 10: Published event has valid Event QR data ──────────');
  const r10 = await req('GET', `/api/events/${eventId}/qr`, null, orgToken);
  assert('Status 200', r10.status === 200, r10.status);
  assert('Has URL', typeof r10.body.url === 'string');
  console.log('  Event URL returned:', r10.body.url);
  assert('Has QR Data URI', typeof r10.body.qrCodeDataUri === 'string' && r10.body.qrCodeDataUri.startsWith('data:image/png;base64,'));

  console.log('\n── Test 11: Customer can now view the published event ────────');
  const r11 = await req('GET', `/api/events/${eventId}`, null, custToken);
  assert('Status 200', r11.status === 200, r11.status);

  console.log('\n═══════════════════════════════════════════════════════════');
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} passed` + (failed ? `  (${failed} FAILED)` : '  ✓ All clear'));
  process.exit(failed > 0 ? 1 : 0);
})();

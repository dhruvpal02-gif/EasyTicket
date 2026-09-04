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
  
  // Create Organizer
  const orgEmail = 'org_' + Date.now() + '@example.com';
  const orgRes = await req('POST', '/api/auth/register', { name: 'Organizer', email: orgEmail, password: 'password123', role: 'organizer' });
  const orgToken = orgRes.body.token;

  // Create Customer 1
  const cust1Email = 'cust1_' + Date.now() + '@example.com';
  const cust1Res = await req('POST', '/api/auth/register', { name: 'Customer 1', email: cust1Email, password: 'password123', role: 'customer' });
  const cust1Token = cust1Res.body.token;

  // Create Customer 2
  const cust2Email = 'cust2_' + Date.now() + '@example.com';
  const cust2Res = await req('POST', '/api/auth/register', { name: 'Customer 2', email: cust2Email, password: 'password123', role: 'customer' });
  const cust2Token = cust2Res.body.token;
  
  // Organizer Creates Event
  const eventPayload = {
    title: 'Ticket Test Event',
    description: 'Testing bookings',
    date: '2028-01-01',
    time: '18:00',
    venue: 'Test Stadium',
    city: 'Test City',
    ticketTypes: JSON.stringify([{ name: 'VIP', price: 100, quantity: 9 }]) // Only 9 available!
  };
  const eventRes = await req('POST', '/api/events', eventPayload, orgToken);
  const eventId = eventRes.body._id;
  const ticketTypeId = eventRes.body.ticketTypes[0]._id;

  let ticketId = '';

  console.log('\n── Test 1: Customer can create a booking ───────────────────');
  // Need to send as multipart since we use runUploadIfMultipart, OR application/json. We'll use JSON.
  const bookingPayload = {
    eventId,
    ticketTypeId,
    quantity: 2,
    attendeeName: 'Customer 1',
    attendeeEmail: 'c1@test.com',
    attendeePhone: '1234567890'
  };
  const r1 = await req('POST', '/api/tickets', bookingPayload, cust1Token);
  assert('Status 201', r1.status === 201, r1.status);
  assert('Calculated correct total (100 * 2)', r1.body.totalAmount === 200, r1.body.totalAmount);
  ticketId = r1.body._id;

  console.log('\n── Test 2: Organizer cannot create a booking ───────────────');
  const r2 = await req('POST', '/api/tickets', bookingPayload, orgToken);
  assert('Status 403 (Forbidden)', r2.status === 403, r2.status);

  console.log('\n── Test 3: Guest user can create booking without login ───────');
  const r3 = await req('POST', '/api/tickets', bookingPayload, null);
  assert('Status 201', r3.status === 201, r3.status);
  assert('Received guestToken', typeof r3.body.guestToken === 'string');
  const guestToken = r3.body.guestToken;

  console.log('\n── Test 4: Quantity greater than inventory is rejected ─────');
  const r4 = await req('POST', '/api/tickets', { ...bookingPayload, quantity: 4 }, cust1Token); // only 3 left
  assert('Status 400', r4.status === 400, r4.status);
  assert('Error message', r4.body.message.includes('Not enough tickets'), r4.body.message);

  console.log('\n── Test 5: Customer can see their own tickets ──────────────');
  const r5 = await req('GET', '/api/tickets/my-tickets', null, cust1Token);
  assert('Status 200', r5.status === 200, r5.status);
  assert('Has ticket in list', r5.body.some(t => t._id === ticketId));

  console.log('\n── Test 6: Customer cannot see another customer\'s ticket ────');
  const r6 = await req('GET', `/api/tickets/${ticketId}`, null, cust2Token);
  assert('Status 403 (Forbidden)', r6.status === 403, r6.status);

  console.log('\n── Test 7: Organizer can see tickets for their own event ───');
  const r7 = await req('GET', `/api/tickets/event/${eventId}`, null, orgToken);
  assert('Status 200', r7.status === 200, r7.status);
  assert('Sees the ticket booked by cust1', r7.body.some(t => t._id === ticketId));

  console.log('\n── Test 8: Inventory correctly updated (multiple bookings) ─');
  // Buy remaining 3 tickets
  const r8 = await req('POST', '/api/tickets', { ...bookingPayload, quantity: 3 }, cust2Token);
  assert('Status 201 (Booked remaining)', r8.status === 201, r8.status);
  
  // Try to buy 1 more
  const r9 = await req('POST', '/api/tickets', { ...bookingPayload, quantity: 1 }, cust1Token);
  assert('Status 400 (Sold out rejected)', r9.status === 400, r9.status);

  console.log('\n═══════════════════════════════════════════════════════════');
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} passed` + (failed ? `  (${failed} FAILED)` : '  ✓ All clear'));
  process.exit(failed > 0 ? 1 : 0);
})();

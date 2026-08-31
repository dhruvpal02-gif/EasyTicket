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
  
  const eventRes = await req('POST', '/api/events', {
    title: 'Verify Test Event', description: 'Testing verification', date: '2028-04-01', time: '20:00', venue: 'V', city: 'C',
    ticketTypes: JSON.stringify([{ name: 'General', price: 100, quantity: 10 }])
  }, orgToken);
  
  const eventId = eventRes.body._id;
  const ticketTypeId = eventRes.body.ticketTypes[0]._id;

  // Ticket 1: Will be Paid
  const ticket1Res = await req('POST', '/api/tickets', {
    eventId, ticketTypeId, quantity: 1, attendeeName: 'Customer 1', attendeeEmail: 'c1@test.com', attendeePhone: '123'
  }, cust1Token);
  const ticket1Id = ticket1Res.body.ticketId;
  const ticket1DbId = ticket1Res.body._id;

  // We need to fetch the raw qrToken directly from DB since our GET API hides it
  // For testing, we'll extract it using a direct DB call or a temporary mock since this script is external.
  // Actually, we can get it from the createTicket response! createTicket DOES return it.
  const ticket1Token = ticket1Res.body.qrToken;
  
  // Pay for Ticket 1
  await req('POST', `/api/tickets/${ticket1DbId}/pay`, { paymentMethod: 'upi' }, cust1Token);

  // Ticket 2: Pending
  const ticket2Res = await req('POST', '/api/tickets', {
    eventId, ticketTypeId, quantity: 1, attendeeName: 'Customer 1', attendeeEmail: 'c1@test.com', attendeePhone: '123'
  }, cust1Token);
  const ticket2Id = ticket2Res.body.ticketId;
  const ticket2Token = ticket2Res.body.qrToken;

  console.log('\n── Test 1: Organizer can verify a valid ticket for their own event ──');
  const r1 = await req('POST', '/api/tickets/verify', { ticketId: ticket1Id, qrToken: ticket1Token }, orgToken);
  assert('Status 200', r1.status === 200, r1.status);
  assert('Response is valid: true', r1.body.valid === true);
  assert('Returns correct attendee', r1.body.ticket.attendeeName === 'Customer 1');
  assert('Does NOT return qrToken', r1.body.ticket.qrToken === undefined);
  assert('Does NOT return password/JWTs', r1.body.ticket.password === undefined);

  console.log('\n── Test 2: Correct ticketId + incorrect qrToken → invalid ───────────');
  const r2 = await req('POST', '/api/tickets/verify', { ticketId: ticket1Id, qrToken: 'wrongtoken' }, orgToken);
  assert('Status 400', r2.status === 400, r2.status);

  console.log('\n── Test 3: Organizer cannot verify another organizer\'s ticket ────────');
  const r3 = await req('POST', '/api/tickets/verify', { ticketId: ticket1Id, qrToken: ticket1Token }, org2Token);
  assert('Status 403', r3.status === 403, r3.status);

  console.log('\n── Test 4: Customer cannot use the verification endpoint ────────────');
  const r4 = await req('POST', '/api/tickets/verify', { ticketId: ticket1Id, qrToken: ticket1Token }, cust1Token);
  assert('Status 403', r4.status === 403, r4.status);

  console.log('\n── Test 5: Unauthenticated user cannot verify ───────────────────────');
  const r5 = await req('POST', '/api/tickets/verify', { ticketId: ticket1Id, qrToken: ticket1Token }, null);
  assert('Status 401', r5.status === 401, r5.status);

  console.log('\n── Test 6: Invalid ticketId → invalid ───────────────────────────────');
  const r6 = await req('POST', '/api/tickets/verify', { ticketId: 'TKT-FAKE', qrToken: ticket1Token }, orgToken);
  assert('Status 404', r6.status === 404, r6.status);

  console.log('\n── Test 7: Pending payment ticket → invalid ─────────────────────────');
  const r7 = await req('POST', '/api/tickets/verify', { ticketId: ticket2Id, qrToken: ticket2Token }, orgToken);
  assert('Status 400', r7.status === 400, r7.status);
  assert('Message explains pending status', r7.body.message.includes('pending'), r7.body.message);

  console.log('\n── Test 8: Valid ticket remains unchanged after verification ────────');
  // Re-verify ticket 1 to ensure it didn't change status to 'used'
  const r8 = await req('POST', '/api/tickets/verify', { ticketId: ticket1Id, qrToken: ticket1Token }, orgToken);
  assert('Status is still confirmed', r8.body.ticket.status === 'confirmed', r8.body.ticket.status);

  console.log('\n═══════════════════════════════════════════════════════════');
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} passed` + (failed ? `  (${failed} FAILED)` : '  ✓ All clear'));
  process.exit(failed > 0 ? 1 : 0);
})();

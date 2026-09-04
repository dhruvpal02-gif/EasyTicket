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
  
  const orgEmail = 'org_' + Date.now() + '@example.com';
  const orgRes = await req('POST', '/api/auth/register', { name: 'Organizer', email: orgEmail, password: 'password123', role: 'organizer' });
  const orgToken = orgRes.body.token;

  const org2Email = 'org2_' + Date.now() + '@example.com';
  const org2Res = await req('POST', '/api/auth/register', { name: 'Organizer 2', email: org2Email, password: 'password123', role: 'organizer' });
  const org2Token = org2Res.body.token;

  const cust1Email = 'cust1_' + Date.now() + '@example.com';
  const cust1Res = await req('POST', '/api/auth/register', { name: 'Customer 1', email: cust1Email, password: 'password123', role: 'customer' });
  const cust1Token = cust1Res.body.token;

  // ── Single-entry event (default / concert) ──
  console.log('\n── Setup: Single-Entry Event (concert) ──');
  const singleEventRes = await req('POST', '/api/events', {
    title: 'Concert Event', description: 'Single entry', date: '2028-04-01', time: '20:00', venue: 'Arena', city: 'City',
    ticketTypes: JSON.stringify([{ name: 'General', price: 100, quantity: 10 }]),
    eventTemplate: 'concert', entryPolicy: 'single'
  }, orgToken);
  const singleEventId = singleEventRes.body._id;
  const singleTypeId = singleEventRes.body.ticketTypes[0]._id;

  // ── Multiple-entry event (mela) ──
  console.log('── Setup: Multiple-Entry Event (mela) ──');
  const multiEventRes = await req('POST', '/api/events', {
    title: 'Mela Event', description: 'Multiple entry', date: '2028-05-01', time: '10:00', venue: 'Grounds', city: 'City',
    ticketTypes: JSON.stringify([{ name: 'Pass', price: 50, quantity: 10 }]),
    eventTemplate: 'mela', entryPolicy: 'multiple'
  }, orgToken);
  const multiEventId = multiEventRes.body._id;
  const multiTypeId = multiEventRes.body.ticketTypes[0]._id;

  // ── Create and pay tickets ──
  console.log('── Setup: Create & Pay Tickets ──');
  
  // Single-entry ticket
  const t1Res = await req('POST', '/api/tickets', {
    eventId: singleEventId, ticketTypeId: singleTypeId, quantity: 1,
    attendeeName: 'Alice', attendeeEmail: 'alice@test.com', attendeePhone: '111'
  }, cust1Token);
  const t1Id = t1Res.body.ticketId;
  const t1DbId = t1Res.body._id;
  const t1QrToken = t1Res.body.qrToken;
  await req('POST', `/api/tickets/${t1DbId}/pay`, { paymentMethod: 'upi' }, cust1Token);

  // Multi-entry ticket
  const t2Res = await req('POST', '/api/tickets', {
    eventId: multiEventId, ticketTypeId: multiTypeId, quantity: 1,
    attendeeName: 'Bob', attendeeEmail: 'bob@test.com', attendeePhone: '222'
  }, cust1Token);
  const t2Id = t2Res.body.ticketId;
  const t2DbId = t2Res.body._id;
  const t2QrToken = t2Res.body.qrToken;
  await req('POST', `/api/tickets/${t2DbId}/pay`, { paymentMethod: 'card' }, cust1Token);

  // Unpaid ticket for testing
  const t3Res = await req('POST', '/api/tickets', {
    eventId: singleEventId, ticketTypeId: singleTypeId, quantity: 1,
    attendeeName: 'Charlie', attendeeEmail: 'charlie@test.com', attendeePhone: '333'
  }, cust1Token);
  const t3Id = t3Res.body.ticketId;
  const t3QrToken = t3Res.body.qrToken;

  // ════════════════════════════════════════════════════════════════════════════
  // SINGLE-ENTRY TESTS
  // ════════════════════════════════════════════════════════════════════════════

  console.log('\n── Test 1: First scan of single-entry ticket succeeds ──');
  const r1 = await req('POST', '/api/tickets/verify', { ticketId: t1Id, qrToken: t1QrToken }, orgToken);
  assert('Status 200', r1.status === 200, r1.status);
  assert('valid: true', r1.body.valid === true);
  assert('entryPolicy: single', r1.body.entryPolicy === 'single');
  assert('scanCount: 1', r1.body.scanCount === 1);
  assert('isScanned: true', r1.body.ticket.isScanned === true);
  assert('scannedAt is set', !!r1.body.ticket.scannedAt);
  assert('Returns attendeeName', r1.body.ticket.attendeeName === 'Alice');
  assert('Does NOT return qrToken', r1.body.ticket.qrToken === undefined);

  console.log('\n── Test 2: Second scan of single-entry ticket is REJECTED ──');
  const r2 = await req('POST', '/api/tickets/verify', { ticketId: t1Id, qrToken: t1QrToken }, orgToken);
  assert('Status 400', r2.status === 400, r2.status);
  assert('Error: Ticket Already Used', r2.body.error === 'Ticket Already Used');
  assert('Returns scannedAt', !!r2.body.scannedAt);

  // ════════════════════════════════════════════════════════════════════════════
  // MULTIPLE-ENTRY TESTS
  // ════════════════════════════════════════════════════════════════════════════

  console.log('\n── Test 3: First scan of multiple-entry ticket succeeds ──');
  const r3 = await req('POST', '/api/tickets/verify', { ticketId: t2Id, qrToken: t2QrToken }, orgToken);
  assert('Status 200', r3.status === 200, r3.status);
  assert('valid: true', r3.body.valid === true);
  assert('entryPolicy: multiple', r3.body.entryPolicy === 'multiple');
  assert('scanCount: 1', r3.body.scanCount === 1);
  assert('isScanned is still false', r3.body.ticket.isScanned === false);

  console.log('\n── Test 4: Second scan of multiple-entry ticket ALSO succeeds ──');
  const r4 = await req('POST', '/api/tickets/verify', { ticketId: t2Id, qrToken: t2QrToken }, orgToken);
  assert('Status 200', r4.status === 200, r4.status);
  assert('scanCount: 2', r4.body.scanCount === 2);

  console.log('\n── Test 5: Third scan increments scanCount ──');
  const r5 = await req('POST', '/api/tickets/verify', { ticketId: t2Id, qrToken: t2QrToken }, orgToken);
  assert('Status 200', r5.status === 200, r5.status);
  assert('scanCount: 3', r5.body.scanCount === 3);

  // ════════════════════════════════════════════════════════════════════════════
  // SECURITY & EDGE CASE TESTS
  // ════════════════════════════════════════════════════════════════════════════

  console.log('\n── Test 6: Wrong qrToken → rejected ──');
  const r6 = await req('POST', '/api/tickets/verify', { ticketId: t2Id, qrToken: 'wrongtoken' }, orgToken);
  assert('Status 400', r6.status === 400, r6.status);

  console.log('\n── Test 7: Other organizer cannot verify ──');
  const r7 = await req('POST', '/api/tickets/verify', { ticketId: t2Id, qrToken: t2QrToken }, org2Token);
  assert('Status 403', r7.status === 403, r7.status);

  console.log('\n── Test 8: Customer cannot verify ──');
  const r8 = await req('POST', '/api/tickets/verify', { ticketId: t2Id, qrToken: t2QrToken }, cust1Token);
  assert('Status 403', r8.status === 403, r8.status);

  console.log('\n── Test 9: Unauthenticated cannot verify ──');
  const r9 = await req('POST', '/api/tickets/verify', { ticketId: t2Id, qrToken: t2QrToken }, null);
  assert('Status 401', r9.status === 401, r9.status);

  console.log('\n── Test 10: Fake ticketId → 404 ──');
  const r10 = await req('POST', '/api/tickets/verify', { ticketId: 'TKT-FAKE', qrToken: 'any' }, orgToken);
  assert('Status 404', r10.status === 404, r10.status);

  console.log('\n── Test 11: Unpaid ticket → rejected ──');
  const r11 = await req('POST', '/api/tickets/verify', { ticketId: t3Id, qrToken: t3QrToken }, orgToken);
  assert('Status 400', r11.status === 400, r11.status);
  assert('Message includes pending', r11.body.message.includes('pending'), r11.body.message);

  console.log('\n── Test 12: Event schema has correct entryPolicy ──');
  assert('Single event has entryPolicy=single', singleEventRes.body.entryPolicy === 'single');
  assert('Multi event has entryPolicy=multiple', multiEventRes.body.entryPolicy === 'multiple');
  assert('Single event has eventTemplate=concert', singleEventRes.body.eventTemplate === 'concert');
  assert('Multi event has eventTemplate=mela', multiEventRes.body.eventTemplate === 'mela');

  console.log('\n═══════════════════════════════════════════════════════════');
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} passed` + (failed ? `  (${failed} FAILED)` : '  ✓ All clear'));
  process.exit(failed > 0 ? 1 : 0);
})();

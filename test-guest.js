import http from 'http';
import https from 'https';

const baseUrl = 'http://localhost:5000';

const req = (method, path, body = null, token = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const client = url.protocol === 'https:' ? https : http;
    const request = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
};

const assert = (desc, condition, actual = null) => {
  if (condition) {
    console.log(`  PASS  ${desc}`);
  } else {
    console.error(`  FAIL  ${desc}`);
    if (actual !== null) console.error(`        Actual:`, actual);
    process.exitCode = 1;
  }
};

(async () => {
  try {
    console.log('── Setup: Create Test Organizer & Published Event ──');
    const orgRes = await req('POST', '/api/auth/register', {
      name: 'Guest Flow Org', email: `guestorg_${Date.now()}@test.com`, password: 'password123', role: 'organizer'
    });
    const orgToken = orgRes.body.token;

    const eventRes = await req('POST', '/api/events', {
      title: 'Guest Event', description: 'desc', date: '2026-10-10', time: '10:00', venue: 'Hall', city: 'City',
      ticketTypes: JSON.stringify([{ name: 'VIP', price: 100, quantity: 50 }])
    }, orgToken);
    const eventId = eventRes.body._id;
    const ticketTypeId = eventRes.body.ticketTypes[0]._id;

    await req('PATCH', `/api/events/${eventId}/publish`, null, orgToken);

    console.log('\n── Test 1: Guest can book without token ────────────');
    const r1 = await req('POST', '/api/tickets', {
      eventId, ticketTypeId, quantity: 2,
      attendeeName: 'Guest User', attendeeEmail: 'guest@test.com', attendeePhone: '0000000000'
    });
    assert('Status 201', r1.status === 201, r1.status);
    assert('Returns guestToken', typeof r1.body.guestToken === 'string');
    const ticketId = r1.body._id;
    const guestToken = r1.body.guestToken;

    console.log('\n── Test 2: Guest cannot view ticket without guestToken ──');
    const r2 = await req('GET', `/api/tickets/${ticketId}`);
    assert('Status 403', r2.status === 403, r2.status);

    console.log('\n── Test 3: Guest can view ticket WITH guestToken ──────');
    const r3 = await req('GET', `/api/tickets/${ticketId}`, null, null, { 'X-Guest-Token': guestToken });
    assert('Status 200', r3.status === 200, r3.status);
    assert('Ticket matches', r3.body.ticketId === r1.body.ticketId);

    console.log('\n── Test 4: Guest can pay WITH guestToken ─────────────');
    const r4 = await req('POST', `/api/tickets/${ticketId}/pay`, { paymentMethod: 'card' }, null, { 'X-Guest-Token': guestToken });
    assert('Status 200', r4.status === 200, r4.status);
    assert('Payment paid', r4.body.ticket.paymentStatus === 'paid');
    assert('Status confirmed', r4.body.ticket.status === 'confirmed');

    console.log('\n── Test 5: Paid guest ticket returns Ticket QR ────────');
    const r5 = await req('GET', `/api/tickets/${ticketId}`, null, null, { 'X-Guest-Token': guestToken });
    assert('Has QR URI', !!r5.body.qrCodeDataUri);
    assert('Does not leak qrToken text', r5.body.qrToken === undefined);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(process.exitCode === 1 ? 'Results: FAILED' : 'Results: ✓ All clear');
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
})();

# Phase 8: Guest Booking Flow (Optional Login)

The goal was to make customer login optional, allowing users to scan a QR code, book a ticket, and receive a digital ticket without creating an account. Security was maintained by replacing the reliance on JWTs with unique, cryptographically secure guest tokens.

## Changes Made
1. **Model Update (`Ticket.js`)**
   - Modified `customer` field to `required: false`.
   - Added `guestToken` string field.

2. **Routes & Middleware (`ticketRoutes.js`)**
   - Replaced strict `protect` middleware with `optionalAuth` for:
     - `POST /api/tickets` (Create Booking)
     - `GET /api/tickets/:id` (View Ticket Details)
     - `POST /api/tickets/:id/pay` (Process Payment)
     - `POST /api/tickets/:id/fail` (Fail Payment)

3. **Backend Logic (`ticketController.js`)**
   - **`createTicket`**: If a user is not logged in (`!req.user`), a secure 32-byte `guestToken` is generated using Node's `crypto` module, saved with the ticket, and returned directly to the client. Organizers are still explicitly rejected.
   - **Authorization logic**: Refactored `getTicketById`, `processPayment`, and `failPayment`. They now check if the request matches either a valid `req.user` (customer or organizer ownership rules) OR if a valid `X-Guest-Token` header matches the ticket's saved `guestToken`.

4. **Frontend Updates (`client/src`)**
   - **Routing**: Moved `BookingPage`, `PaymentPage`, and `TicketDetailsPage` outside of `<PrivateRoute>` in `App.jsx`.
   - **Discovery**: Removed forced redirect to `/login` from `EventDetailPage.jsx` when clicking "Get Ticket".
   - **State Persistence**: 
     - `BookingPage` captures `data.guestToken` and passes it via URL params: `/payment/:id?guestToken=abc`.
     - `PaymentPage` parses the token from `useSearchParams()` and attaches it to `X-Guest-Token` headers for payment API calls.
     - `TicketDetailsPage` similarly uses the token to fetch ticket details and intentionally hides the "Back to My Tickets" link if the user is a guest.

5. **Testing & QA (`test-guest.js`)**
   - Updated `test-tickets.js` inventory logic and unauthenticated payment tests.
   - Wrote a new integration test script `test-guest.js` specifically verifying:
     - Creation without JWT.
     - 403 blocks for token-less access.
     - Secure execution of payments and QR generation with the correct guest token.
   - Built the frontend successfully (`npm run build`).

## Final Status
All 14 backend test scripts, including the newly added guest workflows, are fully passing. The customer booking flow now operates smoothly for both logged-in users and guests.

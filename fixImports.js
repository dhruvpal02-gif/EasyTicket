const fs = require('fs');

const files = [
  'client/src/pages/EventDetailPage.jsx',
  'client/src/pages/MyTicketsPage.jsx',
  'client/src/pages/OrganizerDashboard.jsx',
  'client/src/pages/PaymentPage.jsx',
  'client/src/pages/TicketDetailsPage.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import PageLoader')) {
    content = "import PageLoader from '../components/PageLoader';\n" + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Added to', file);
  }
}

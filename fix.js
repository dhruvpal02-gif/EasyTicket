const fs = require('fs');

function replaceInFile(path, search, replace, addImport) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  if (addImport && content.indexOf('PageLoader') === -1) {
    content = content.replace("import api from '../services/api';", "import api from '../services/api';\nimport PageLoader from '../components/PageLoader';");
  }
  fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('client/src/pages/MyTicketsPage.jsx', '{loading && <p className="mytickets-status">Loading your tickets...</p>}', '{loading && <PageLoader text="Loading your tickets..." fullScreen={false} />}', true);
replaceInFile('client/src/pages/EventDetailPage.jsx', 'if (loading) return <div className="page-container"><p>Loading event…</p></div>;', 'if (loading) return <PageLoader text="Loading event..." />;', true);
replaceInFile('client/src/pages/OrganizerDashboard.jsx', 'if (loading) return <div className="page-container"><p>Loading dashboard...</p></div>;', 'if (loading) return <PageLoader text="Loading dashboard..." />;', true);
replaceInFile('client/src/pages/PaymentPage.jsx', 'if (loading) return <div className="page-container"><p>Loading payment...</p></div>;', 'if (loading) return <PageLoader text="Loading payment..." />;', true);
replaceInFile('client/src/pages/TicketDetailsPage.jsx', 'if (loading) return <div className="p-8 text-center text-gray-500 font-sans">Loading ticket...</div>;', 'if (loading) return <PageLoader text="Loading ticket..." />;', true);

const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CreateEventPage.jsx', 'utf8');

// Add isOngoing state
content = content.replace(
  "const [requireAttendeePhoto, setRequireAttendeePhoto] = useState(draft?.requireAttendeePhoto ?? false);",
  "const [requireAttendeePhoto, setRequireAttendeePhoto] = useState(draft?.requireAttendeePhoto ?? false);\n  const [isOngoing, setIsOngoing] = useState(draft?.isOngoing ?? false);"
);

// Update draft saving
content = content.replace(
  "const draftData = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step };",
  "const draftData = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step, isOngoing };"
);

content = content.replace(
  "}, [form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step]);",
  "}, [form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step, isOngoing]);"
);

content = content.replace(
  "const draft = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step };",
  "const draft = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step, isOngoing };"
);

// Conditional requireAttendeePhoto
content = content.replace(
  "              <div className=\"form-group\" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>\n                <input \n                  type=\"checkbox\" \n                  id=\"requireAttendeePhoto\"",
  "              {eventTemplate !== 'mela' && (\n              <div className=\"form-group\" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>\n                <input \n                  type=\"checkbox\" \n                  id=\"requireAttendeePhoto\""
);
content = content.replace(
  "                  Require attendee photo upload for this event\n                </label>\n              </div>\n            </section>",
  "                  Require attendee photo upload for this event\n                </label>\n              </div>\n              )}\n            </section>"
);


// Conditionally render the endDate and endTime row
const endDateRow = \
              <div className="form-row" style={{ marginTop: '1rem' }}>
\;

const newEndDateRow = \
              {eventTemplate === 'zoo' && (
                <div className="form-group" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="isOngoing" checked={isOngoing} onChange={(e) => setIsOngoing(e.target.checked)} style={{ width: '1rem', height: '1rem', cursor: 'pointer' }} />
                  <label htmlFor="isOngoing" style={{ fontSize: '0.9rem', color: '#475569', cursor: 'pointer', fontWeight: 500, margin: 0 }}>
                    Ongoing Event (No End Date)
                  </label>
                </div>
              )}
              {eventTemplate !== 'mela' && !isOngoing && (
              <div className="form-row" style={{ marginTop: '1rem' }}>
\;

content = content.replace(endDateRow, newEndDateRow);

// Close the conditional block for endDate row
content = content.replace(
  "                </div>\n              </div>\n            <div className=\"form-row\">\n              <div className=\"form-group\">\n                <label htmlFor=\"venue\">Venue Name</label>",
  "                </div>\n              </div>\n              )}\n            <div className=\"form-row\">\n              <div className=\"form-group\">\n                <label htmlFor=\"venue\">Venue Name</label>"
);


// Update validate function to allow missing endDate/endTime if mela or isOngoing
content = content.replace(
  "    if (!form.title || !form.description || !form.date || !form.time || !form.endDate || !form.endTime || !form.venue || !form.city || !form.category) {",
  "    const requiresEnd = eventTemplate !== 'mela' && !isOngoing;\n    if (!form.title || !form.description || !form.date || !form.time || !form.venue || !form.city || !form.category || (requiresEnd && (!form.endDate || !form.endTime))) {"
);

// Fix the Group Pass in datalist
content = content.replace(
  "<option value=\"Backstage Pass\" />\n                        </datalist>",
  "<option value=\"Backstage Pass\" />\n                          <option value=\"Group Pass\" />\n                        </datalist>"
);


fs.writeFileSync('client/src/pages/CreateEventPage.jsx', content, 'utf8');


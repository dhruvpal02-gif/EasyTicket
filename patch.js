const fs = require('fs');
let code = fs.readFileSync('client/src/pages/CreateEventPage.jsx', 'utf8');

// 1. Add isOngoing state and persist it
const stateRegex = /const \[requireAttendeePhoto, setRequireAttendeePhoto\] = useState\(draft\?\.requireAttendeePhoto \?\? false\);/;
code = code.replace(
  stateRegex,
  "const [requireAttendeePhoto, setRequireAttendeePhoto] = useState(draft?.requireAttendeePhoto ?? false);\n  const [isOngoing, setIsOngoing] = useState(draft?.isOngoing ?? false);"
);

const useEffectRegex = /const draftData = \{ form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step \};/g;
code = code.replace(
  useEffectRegex,
  "const draftData = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step, isOngoing };"
);

// 2. Add 'Ongoing Event' checkbox and hide end date/time
const dateHtmlRegex = /<div className="form-row" style=\{\{ marginTop: '1rem' \}\}>[\s\S]*?<div className="form-group">[\s\S]*?<label htmlFor="endDate">End Date<\/label>[\s\S]*?<\/div>\s*<\/div>/;

const endDateHtml = 
                {eventTemplate === 'zoo' && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={isOngoing} onChange={(e) => setIsOngoing(e.target.checked)} style={{ width: 'auto' }} />
                      Ongoing Event (No End Date)
                    </label>
                  </div>
                )}
                {eventTemplate !== 'mela' && !isOngoing && (
                  <div className="form-row" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="endDate">End Date</label>
                      <div style={{ position: 'relative' }}>
                        <input type="date" id="endDate" name="endDate" value={form.endDate} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required={!isOngoing && eventTemplate !== 'mela'} style={{ width: '100%', paddingRight: '2.5rem' }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="endTime">End Time</label>
                      <div style={{ position: 'relative' }}>
                        <input type="time" id="endTime" name="endTime" value={form.endTime} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required={!isOngoing && eventTemplate !== 'mela'} style={{ width: '100%', paddingRight: '2.5rem' }} />
                      </div>
                    </div>
                  </div>
                )}
;

code = code.replace(dateHtmlRegex, endDateHtml);

// 3. Fix Ticket Type Description (Hide in Simple Mode)
const descRegex = /<div className="form-group">\s*<label>Description \(Optional\)<\/label>[\s\S]*?<\/div>/;
const hiddenDescHtml = 
                    {eventTemplate !== 'mela' && (
                      <div className="form-group">
                        <label>Description (Optional)</label>
                        <input type="text" value={ticket.description} onChange={(e) => handleTicketChange(index, 'description', e.target.value)} placeholder="e.g. Includes front row access" />
                      </div>
                    )}
;
code = code.replace(descRegex, hiddenDescHtml.trim());

// 4. Update the datalist input
const datalistRegex = /<input list={	icketNames-\$\{index\}} value=\{ticket\.name\} onChange=\{\(e\) => handleTicketChange\(index, 'name', e\.target\.value\)\} placeholder="e\.g\. VIP, General Admission" required \/>[\s\S]*?<\/datalist>/;
const fixedDatalist = 
                        <input type="text" list={\	icketNames-\\} value={ticket.name} onChange={(e) => handleTicketChange(index, 'name', e.target.value)} placeholder="e.g. VIP, General Admission" required />
                        <datalist id={\	icketNames-\\}>
                          <option value="Regular" />
                          <option value="VIP" />
                          <option value="VVIP" />
                          <option value="Early Bird" />
                          <option value="Student Pass" />
                          <option value="Backstage Pass" />
                          <option value="Group Pass" />
                        </datalist>
;
code = code.replace(datalistRegex, fixedDatalist.trim());

fs.writeFileSync('client/src/pages/CreateEventPage.jsx', code, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('client/src/pages/CreateEventPage.jsx', 'utf8');

// 1. Update validation
code = code.replace(
  'if (!form.title || !form.description || !form.date || !form.time || !form.venue || !form.city) {',
  'if (!form.title || !form.description || !form.date || !form.time || !form.endDate || !form.endTime || !form.venue || !form.city) {'
);

// 2. Add Category Dropdown
const categoryDropdown = 
              <div className="form-group">
                <label htmlFor="category">Event Category</label>
                <select id="category" name="category" value={form.category} onChange={handleChange} required className="w-full">
                  <option value="General">General</option>
                  <option value="Tech">Tech</option>
                  <option value="Sports">Sports</option>
                  <option value="Music">Music</option>
                  <option value="Food">Food</option>
                </select>
              </div>
;
code = code.replace(
  '<div className="form-row">\n                  <div className="form-group">\n                    <label htmlFor="date">Date</label>',
  categoryDropdown + '\n              <div className="form-row">\n                  <div className="form-group">\n                    <label htmlFor="date">Start Date</label>'
);
code = code.replace(
  '<label htmlFor="time">Time</label>',
  '<label htmlFor="time">Start Time</label>'
);

// 3. Add End Date and End Time
const endDateHtml = 
                <div className="form-row mt-4">
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <div style={{ position: 'relative' }}>
                      <input type="date" id="endDate" name="endDate" value={form.endDate} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required style={{ width: '100%', paddingRight: '2.5rem' }} />
                      <span className="pointer-events-none" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px', color: '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="endTime">End Time</label>
                    <div style={{ position: 'relative' }}>
                      <input type="time" id="endTime" name="endTime" value={form.endTime} onChange={handleChange} onClick={(e) => e.target.showPicker && e.target.showPicker()} required style={{ width: '100%', paddingRight: '2.5rem' }} />
                      <span className="pointer-events-none" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px', color: '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
;
code = code.replace(
  '</div>\n                  </div>\n                </div>\n              <div className="form-row">',
  '</div>\n                  </div>\n                </div>\n' + endDateHtml + '              <div className="form-row">'
);

fs.writeFileSync('client/src/pages/CreateEventPage.jsx', code, 'utf8');

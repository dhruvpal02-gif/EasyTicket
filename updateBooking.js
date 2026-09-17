const fs = require('fs');
let code = fs.readFileSync('client/src/pages/BookingPage.jsx', 'utf8');

// 1. Add attendeeDetails state
code = code.replace(
  'const [attendeePhoto, setAttendeePhoto] = useState(null);',
  'const [attendeePhoto, setAttendeePhoto] = useState(null);\n  const [attendeeDetails, setAttendeeDetails] = useState({});\n  const handleDetailsChange = (e) => setAttendeeDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));'
);

// 2. Append attendeeDetails to formData
code = code.replace(
  'if (attendeePhoto) {',
  'formData.append(\\\'attendeeDetails\\\', JSON.stringify(attendeeDetails));\n      if (attendeePhoto) {'
);

// 3. Add dynamic rendering in the form UI
const dynamicRenderHtml = 
              {event.category === 'Tech' && (
                <>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input type="text" name="companyName" value={attendeeDetails.companyName || ''} onChange={handleDetailsChange} required className="form-control" placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="form-group">
                    <label>Job Role</label>
                    <input type="text" name="jobRole" value={attendeeDetails.jobRole || ''} onChange={handleDetailsChange} required className="form-control" placeholder="e.g. Software Engineer" />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn URL</label>
                    <input type="url" name="linkedinUrl" value={attendeeDetails.linkedinUrl || ''} onChange={handleDetailsChange} className="form-control" placeholder="https://linkedin.com/in/..." />
                  </div>
                </>
              )}
              {event.category === 'Sports' && (
                <>
                  <div className="form-group">
                    <label>T-Shirt Size</label>
                    <select name="tshirtSize" value={attendeeDetails.tshirtSize || ''} onChange={handleDetailsChange} required className="form-control">
                      <option value="">Select Size</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input type="text" name="emergencyContact" value={attendeeDetails.emergencyContact || ''} onChange={handleDetailsChange} required className="form-control" placeholder="e.g. Name and Phone" />
                  </div>
                </>
              )}
              {event.category === 'Music' && (
                <>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" name="ageVerification" checked={attendeeDetails.ageVerification === 'true'} onChange={(e) => handleDetailsChange({ target: { name: 'ageVerification', value: e.target.checked ? 'true' : 'false' } })} required style={{ width: 'auto' }} />
                      I confirm I am 18+ years old
                    </label>
                  </div>
                </>
              )}
              {event.category === 'Food' && (
                <>
                  <div className="form-group">
                    <label>Dietary Preferences</label>
                    <select name="dietaryPreference" value={attendeeDetails.dietaryPreference || ''} onChange={handleDetailsChange} required className="form-control">
                      <option value="">Select Preference</option>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>
                </>
              )}
;

code = code.replace(
  '{event.requireAttendeePhoto && (',
  dynamicRenderHtml + '\n              {event.requireAttendeePhoto && ('
);

fs.writeFileSync('client/src/pages/BookingPage.jsx', code, 'utf8');

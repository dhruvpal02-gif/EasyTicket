const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CreateEventPage.jsx', 'utf8');

// Use a regex to find the state declarations and the two useEffects, and replace them.
const stateReplacement = 
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('draftEvent');
      return draft ? JSON.parse(draft) : null;
    } catch { return null; }
  };
  const draft = loadDraft();

  const [step, setStep] = useState(draft?.step ?? 1); // 1 = Template Selection, 2 = Form Details
  const [form, setForm] = useState(draft?.form ?? {
    title: '',
    description: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    category: 'General',
    venue: '',
    city: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');

  const [ticketTypes, setTicketTypes] = useState(draft?.ticketTypes ?? [
    { name: 'Regular', price: 0, quantity: 100, description: 'Standard admission' }
  ]);

  const [eventTemplate, setEventTemplate] = useState(draft?.eventTemplate ?? 'mela');
  const [entryPolicy, setEntryPolicy] = useState(draft?.entryPolicy ?? 'multiple');
  const [requireAttendeePhoto, setRequireAttendeePhoto] = useState(draft?.requireAttendeePhoto ?? false);

  // Auto-save draft on change
  useEffect(() => {
    const draftData = { form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step };
    localStorage.setItem('draftEvent', JSON.stringify(draftData));
  }, [form, ticketTypes, eventTemplate, entryPolicy, requireAttendeePhoto, step]);
;

// Just string manipulation
let startIndex = content.indexOf('const [step, setStep] = useState(1);');
let endIndex = content.indexOf('const handleChange = (e) => {');
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + stateReplacement + '\\n  ' + content.substring(endIndex);
  fs.writeFileSync('client/src/pages/CreateEventPage.jsx', content, 'utf8');
  console.log('Successfully updated state and effects');
} else {
  console.log('Could not find start or end index');
}

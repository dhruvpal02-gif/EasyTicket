import { useState, useEffect } from 'react';
import api from '../services/api';
import EventCard from '../components/EventCard';
import './HomePage.css';

const HomePage = () => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/api/events');
        setEvents(data);
      } catch {
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="home-hero">
        <h1>Discover Events Near You 🎟️</h1>
        <p>Browse and book tickets for local events</p>
        <input
          className="home-search"
          type="text"
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="home-status">Loading events…</p>}
      {error   && <div className="alert alert-error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <p className="home-status">
          {search ? `No events found for "${search}".` : 'No events available yet.'}
        </p>
      )}

      {!loading && !error && (
        <div className="events-grid">
          {filtered.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, CreditCard, Upload } from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (profilePicture) formData.append('profilePicture', profilePicture);

      await api.patch('/api/auth/profile', formData);
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Profile
          </h2>
        </div>
      </div>

      {message && <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg text-sm">{message}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>}

      <div className="bg-white shadow rounded-lg mb-6">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-3xl shadow-inner overflow-hidden border-2 border-indigo-200">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : user?.profilePicture ? (
                  <img src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_API_URL}/${user.profilePicture}`} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="mt-4 relative">
                <input type="file" id="profilePicture" accept="image/*" onChange={handleImageChange} className="visually-hidden hidden" />
                <label htmlFor="profilePicture" className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </label>
              </div>
            </div>

            <div className="flex-grow w-full space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address (Read-only)</label>
                <input type="email" value={user?.email || ''} readOnly className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden flex justify-between items-center p-6 border-l-4 border-indigo-500">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Payout & Bank Details
          </h3>
          <p className="mt-1 text-sm text-gray-500">Manage your bank accounts for receiving event payouts.</p>
        </div>
        <Link to="/profile/bank" className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Edit Bank Details
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage;

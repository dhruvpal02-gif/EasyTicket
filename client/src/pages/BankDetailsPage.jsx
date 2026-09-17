import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CreditCard, Hash } from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const BankDetailsPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.bankDetails) {
      setForm({
        accountName: user.bankDetails.accountName || '',
        bankName: user.bankDetails.bankName || '',
        accountNumber: user.bankDetails.accountNumber || '',
        ifscCode: user.bankDetails.ifscCode || ''
      });
    }
  }, [user]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await api.patch('/api/auth/bank-details', form);
      await refreshUser();
      setMessage('Bank details updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bank details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
      </div>
      
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Bank Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            These details are used for your ticket sales payouts.
          </p>
        </div>
      </div>

      {message && <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg text-sm">{message}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>}

      <div className="bg-white shadow rounded-lg mb-6">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">Account Holder Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" name="accountName" id="accountName" value={form.accountName} onChange={handleChange} required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="e.g. John Doe" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">Bank Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" name="bankName" id="bankName" value={form.bankName} onChange={handleChange} required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="e.g. Chase Bank" />
              </div>
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" name="accountNumber" id="accountNumber" value={form.accountNumber} onChange={handleChange} required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="e.g. 1234567890" />
              </div>
            </div>

            <div>
              <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">IFSC / Routing Code</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" name="ifscCode" id="ifscCode" value={form.ifscCode} onChange={handleChange} required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="e.g. ABCD0123456" />
              </div>
            </div>
            
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Payout Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDetailsPage;

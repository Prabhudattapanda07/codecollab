import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [savedCode, setSavedCode] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSavedCode = async () => {
      if (!localStorage.getItem('token')) return;
      try {
        setLoadingSaved(true);
        const response = await api.get('/room/my-saved-code');
        setSavedCode(response.data.savedCode || []);
      } catch (err) {
        toast.error('Could not load saved code');
        setSavedCode([]);
      } finally {
        setLoadingSaved(false);
      }
    };
    fetchSavedCode();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const totalSaved = savedCode.length;
  const uniqueRooms = new Set(savedCode.map((c) => c.roomId)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300">
      {/* Header */}
      <nav className="bg-dark-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">CodeCollab</h1>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-gray-400 hover:text-white transition duration-200"
              >
                Back to dashboard
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Profile Card */}
          <div className="md:col-span-1 bg-dark-200 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Profile</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Name</p>
                <p className="text-white font-medium truncate">{user?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400">Email</p>
                <p className="text-white font-medium break-all">{user?.email || '—'}</p>
              </div>
            </div>
          </div>

          {/* Stats + Recent Activity */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-dark-200 rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Activity</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-300 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Saved snippets</p>
                  <p className="text-3xl font-bold text-white">{totalSaved}</p>
                </div>
                <div className="bg-dark-300 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Rooms with saved code</p>
                  <p className="text-3xl font-bold text-white">{uniqueRooms}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-200 rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Recent rooms</h2>
              {loadingSaved ? (
                <p className="text-gray-400 text-sm">Loading...</p>
              ) : uniqueRooms === 0 ? (
                <p className="text-gray-400 text-sm">
                  No saved rooms yet. Save code in any room to see it here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[...new Set(savedCode.map((c) => c.roomId))].slice(0, 12).map((roomId) => (
                    <button
                      key={roomId}
                      onClick={() => navigate(`/room/${roomId}`)}
                      className="px-3 py-1 rounded-full bg-dark-300 text-sm text-gray-200 hover:bg-dark-400 transition duration-200 font-mono"
                    >
                      {roomId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

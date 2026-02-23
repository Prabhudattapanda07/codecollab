import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Dashboard = () => {
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

  const handleCopySavedCode = async (item) => {
    try {
      await navigator.clipboard.writeText(item.code || '');
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleDownloadSavedCode = (item) => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      typescript: 'ts',
      HTML: 'html',
    };
    const ext = extensions[item.language] || 'txt';
    const filename = `room-${item.roomId || 'code'}.${ext}`;
    const blob = new Blob([item.code || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleJoinRoom = () => {
    navigate('/join-room');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300">
      {/* Header */}
      <nav className="bg-dark-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">CodeCollab</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/profile')}
                className="px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition duration-200 text-sm"
              >
                Profile
              </button>
              <span className="hidden sm:inline text-gray-300">Hi, {user?.name}</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 fade-in">
          <h2 className="text-5xl font-bold text-white mb-4">
            Real-Time Collaborative Coding
          </h2>
          <p className="text-xl text-gray-400">
            Create or join a room to start coding with your team
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Room Card */}
          <div className="bg-dark-200 rounded-xl shadow-2xl p-8 hover:shadow-3xl transition duration-300 fade-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Create Room</h3>
              <p className="text-gray-400 mb-6">
                Start a new coding session and invite your team members to collaborate
              </p>
              <button
                onClick={handleCreateRoom}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium"
              >
                Create New Room
              </button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="bg-dark-200 rounded-xl shadow-2xl p-8 hover:shadow-3xl transition duration-300 fade-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Join Room</h3>
              <p className="text-gray-400 mb-6">
                Enter a room ID to join an existing coding session with your team
              </p>
              <button
                onClick={handleJoinRoom}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Join Existing Room
              </button>
            </div>
          </div>
        </div>

        {/* Your saved code */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-6">Your saved code</h3>
          {loadingSaved ? (
            <div className="text-center text-gray-400 py-8">Loading saved code...</div>
          ) : savedCode.length === 0 ? (
            <div className="bg-dark-200 rounded-xl p-8 text-center text-gray-400">
              <p>No saved code yet. Create or join a room and save your code to see it here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedCode.map((item) => {
                const preview = (item.code || '').split('\n').slice(0, 3).join('\n');
                const previewText = preview.length > 120 ? preview.slice(0, 120) + '...' : preview;
                const updated = item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—';
                return (
                  <div
                    key={item._id}
                    className="bg-dark-200 rounded-xl p-5 border border-dark-400 hover:border-dark-500 transition duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm font-semibold text-green-400">{item.roomId}</span>
                      <span className="text-xs text-gray-500 uppercase">{item.language || 'javascript'}</span>
                    </div>
                    <pre className="text-gray-400 text-xs overflow-hidden h-20 mb-3 whitespace-pre-wrap break-words font-mono bg-dark-300 rounded p-2">
                      {previewText || '// No code'}
                    </pre>
                    <p className="text-xs text-gray-500 mb-3">Updated: {updated}</p>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => navigate(`/room/${item.roomId}`)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
                      >
                        Open room
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCopySavedCode(item)}
                          className="flex-1 px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition duration-200 text-xs"
                        >
                          Copy code
                        </button>
                        <button
                          onClick={() => handleDownloadSavedCode(item)}
                          className="flex-1 px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition duration-200 text-xs"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-dark-200 p-6 rounded-lg fade-in">
              <div className="text-dark-500 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Real-Time Editing</h4>
              <p className="text-gray-400 text-sm">Collaborate with your team in real-time using our advanced code editor</p>
            </div>

            <div className="bg-dark-200 p-6 rounded-lg fade-in">
              <div className="text-dark-500 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Live Chat</h4>
              <p className="text-gray-400 text-sm">Communicate with team members instantly while coding together</p>
            </div>

            <div className="bg-dark-200 p-6 rounded-lg fade-in">
              <div className="text-dark-500 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Code Execution</h4>
              <p className="text-gray-400 text-sm">Run your code instantly and see results in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

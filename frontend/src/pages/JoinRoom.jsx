import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const JoinRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinRoom = async (e) => {
    e.preventDefault();

    if (!roomId.trim()) {
      toast.error('Please enter a Room ID');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/join-room', { roomId: roomId.trim() });

      if (response.data.success) {
        toast.success('Joined room successfully!');
        navigate(`/room/${roomId.trim()}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-dark-200 rounded-xl shadow-2xl p-8 fade-in">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-gray-400 hover:text-white transition duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">Join Room</h2>
          <p className="text-gray-400">
            Enter the Room ID shared by your teammate to join the coding session
          </p>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
              Room ID
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room ID (e.g., A1B2C3D4)"
              className="appearance-none relative block w-full px-4 py-3 border border-dark-400 placeholder-gray-500 text-white bg-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 uppercase"
              maxLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining Room...' : 'Join Room'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-dark-300 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Need a Room ID?</h3>
          <p className="text-sm text-gray-400 mb-3">
            Ask your teammate to share the Room ID they received when creating the room.
          </p>
          <p className="text-xs text-gray-500">
            Room IDs are 8-character alphanumeric codes (e.g., A1B2C3D4)
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const CreateRoom = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    setLoading(true);

    try {
      const response = await api.post('room/create');

      if (response.data.success) {
        const roomId = response.data.room.roomId;
        toast.success(`Room created: ${roomId}`);
        navigate(`/room/${roomId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
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

        <div className="text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">Create New Room</h2>
          <p className="text-gray-400 mb-8">
            Click the button below to create a new collaborative coding room. You'll receive a unique Room ID that you can share with your team.
          </p>

          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Room...' : 'Create Room'}
          </button>

          <div className="mt-8 p-4 bg-dark-300 rounded-lg">
            <h3 className="text-white font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-400 text-left space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                A unique Room ID will be generated
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                You'll be redirected to the coding room
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Share the Room ID with your team to collaborate
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-100 to-dark-300 px-4">
      <div className="max-w-md w-full space-y-8 bg-dark-200 p-8 rounded-xl shadow-2xl fade-in">
        <div>
          <h2 className="text-center text-4xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-center text-gray-400">
            Sign in to continue coding
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-dark-400 placeholder-gray-500 text-white bg-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-500 focus:border-transparent transition duration-200"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-dark-400 placeholder-gray-500 text-white bg-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-500 focus:border-transparent transition duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-dark-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-dark-500 hover:text-blue-400 transition duration-200">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

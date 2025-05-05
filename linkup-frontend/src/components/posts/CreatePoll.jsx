import { useState } from 'react';
import { XCircleIcon, PlusCircleIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../contexts/AuthContext';

const CreatePoll = ({ onPollCreated = () => {}, onCancel }) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [content, setContent] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validateForm = () => {
    if (!question.trim()) {
      setError('Poll question is required');
      return false;
    }
    
    if (options.some(option => !option.trim())) {
      setError('All poll options must have content');
      return false;
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(options.map(opt => opt.trim()));
    if (uniqueOptions.size !== options.length) {
      setError('Poll options must be unique');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const pollData = {
        content,
        question,
        options: options.filter(opt => opt.trim()),
        end_date: endDate || null
      };

      const response = await postsAPI.createPoll(pollData);
      setQuestion('');
      setOptions(['', '']);
      setContent('');
      setEndDate('');
      onPollCreated(response.data);
    } catch (err) {
      console.error('Failed to create poll:', err);
      setError(err.response?.data?.detail || 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center space-x-3 mb-4">
        {user.profile_picture ? (
          <img
            src={user.profile_picture}
            alt={`${user.full_name}`}
            className="w-10 h-10 rounded-full object-cover border-4 border-blue-600"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
            <span className="text-l text-slate-300">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div className="text-slate-200 font-medium">{user?.full_name}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add some context to your poll (optional)"
          className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 min-h-[60px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="space-y-2 mb-4">
          {options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 bg-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="ml-2 text-slate-400 hover:text-red-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={addOption}
            disabled={options.length >= 10}
            className="flex items-center text-blue-500 hover:text-blue-400 disabled:text-slate-500"
          >
            <PlusCircleIcon className="h-5 w-5 mr-1" />
            <span>Add option{options.length >= 10 ? ' (max 10)' : ''}</span>
          </button>
        </div>
        
        <div className="mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-slate-400" />
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="ml-2 text-slate-400 text-sm">End date (optional)</span>
        </div>

        {error && (
          <div className="mt-3 text-red-500 text-sm">{error}</div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-300 hover:text-white focus:outline-none"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || !question.trim() || options.some(opt => !opt.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Poll...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePoll; 
import { useState } from 'react';
import { postsAPI } from '../../services/postsApi';
import { ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const PollDisplay = ({ poll, postId, onPollVote, disabled = false }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState('');
  
  // Find if user has already voted
  const userVotedOption = poll.options.find(option => option.has_voted);
  const hasVoted = !!userVotedOption;
  
  const handleVote = async () => {
    if (!selectedOption || isVoting || disabled || hasVoted) return;
    
    setIsVoting(true);
    setError('');
    
    try {
      const response = await postsAPI.votePoll(postId, selectedOption);
      onPollVote(response.data);
    } catch (err) {
      console.error('Failed to vote:', err);
      setError(err.response?.data?.detail || 'Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };
  
  const renderOptionBar = (option) => {
    const width = `${option.percentage}%`;
    const isSelected = userVotedOption?.id === option.id;
    
    return (
      <div 
        key={option.id} 
        className={`mb-3 relative cursor-pointer ${!hasVoted && !disabled ? 'hover:bg-slate-700' : ''}`}
        onClick={() => {
          if (!hasVoted && !disabled) {
            setSelectedOption(option.id);
          }
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            {!hasVoted && !disabled ? (
              <div 
                className={`w-4 h-4 rounded-full border-2 border-slate-500 mr-2 flex items-center justify-center
                  ${selectedOption === option.id ? 'border-blue-500' : ''}`}
              >
                {selectedOption === option.id && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
            ) : (
              <div className={`w-4 h-4 mr-2 ${isSelected ? 'text-blue-500' : 'text-slate-500'}`}>
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
            <span className="text-slate-200">{option.text}</span>
          </div>
          <span className="text-slate-400 text-sm">{option.percentage}%</span>
        </div>
        
        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              isSelected ? 'bg-blue-600' : 'bg-slate-500'
            }`}
            style={{ width }}
          ></div>
        </div>
        
        <div className="text-xs text-slate-400 mt-1">
          {option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 mt-3">
      <h3 className="text-slate-200 font-medium mb-4">{poll.question}</h3>
      
      <div className="space-y-1 mb-4">
        {poll.options.map(option => renderOptionBar(option))}
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mb-3">{error}</div>
      )}
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-slate-400 text-sm flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          {poll.is_ended ? (
            <span>Poll ended</span>
          ) : poll.end_date ? (
            <span>Ends {format(new Date(poll.end_date), 'MMM d, yyyy')}</span>
          ) : (
            <span>No end date</span>
          )}
        </div>
        
        <div className="text-slate-400 text-sm">
          {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
        </div>
        
        {!hasVoted && !disabled && !poll.is_ended && (
          <button
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className={`px-4 py-1 rounded-full text-sm font-medium 
              ${!selectedOption || isVoting
                ? 'bg-slate-700 text-slate-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'}
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
          >
            {isVoting ? 'Voting...' : 'Vote'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollDisplay; 
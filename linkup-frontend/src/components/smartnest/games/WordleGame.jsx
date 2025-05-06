import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { fetchCurrentGame, submitGuess, fetchLeaderboard } from '../../../services/gameService';
import { toast } from 'react-hot-toast';
import { Spinner } from '../../ui/Spinner';

// Keyboard layout
const keyboardRows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace']
];

const WordleGame = () => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guessResults, setGuessResults] = useState([]);
  const [keyStatuses, setKeyStatuses] = useState({});
  const [isGameOver, setIsGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  
  // Initialize empty rows for display
  const maxGuesses = 6;
  const wordLength = 5;
  
  // Load game state
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const gameData = await fetchCurrentGame();
        setGameState(gameData);
        
        // Initialize guess results from previous attempts
        if (gameData.guesses && gameData.guesses.length > 0) {
          setGuessResults(Array(gameData.guesses.length).fill(null));
          
          // Process each previous guess to get the visual feedback
          const promises = gameData.guesses.map(async (guessObj) => {
            try {
              const result = await submitGuess(guessObj.guess);
              return { guess: guessObj.guess, ...result };
            } catch (error) {
              console.error('Error processing previous guess:', error);
              return null;
            }
          });
          
          const results = await Promise.all(promises);
          setGuessResults(results.filter(r => r !== null));
          
          // Update keyboard statuses based on previous guesses
          const newKeyStatuses = {};
          results.forEach(result => {
            if (result && result.result) {
              result.result.forEach(({ letter, status }) => {
                // Only update status if it's better than current status
                if (!newKeyStatuses[letter] || 
                    (newKeyStatuses[letter] === 'absent' && status !== 'absent') ||
                    (newKeyStatuses[letter] === 'present' && status === 'correct')) {
                  newKeyStatuses[letter] = status;
                }
              });
            }
          });
          setKeyStatuses(newKeyStatuses);
        }
        
        // Check if game is already over
        setIsGameOver(gameData.is_solved || gameData.attempts >= maxGuesses);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading game:', error);
        toast.error('Failed to load game');
        setLoading(false);
      }
    };
    
    loadGame();
  }, []);
  
  // Load leaderboard when needed
  const loadLeaderboard = useCallback(async () => {
    if (showLeaderboard && !leaderboardData) {
      try {
        setLeaderboardLoading(true);
        const data = await fetchLeaderboard();
        setLeaderboardData(data);
        setLeaderboardLoading(false);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Failed to load leaderboard');
        setLeaderboardLoading(false);
      }
    }
  }, [showLeaderboard, leaderboardData]);
  
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);
  
  // Handle key presses
  const handleKeyPress = useCallback((key) => {
    if (!gameState || isGameOver) return;
    
    if (key === 'Enter') {
      if (currentGuess.length === 5) {
        submitCurrentGuess();
      } else {
        toast.error('Word must be 5 letters');
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(prev => prev.substring(0, prev.length - 1));
    } else if (/^[a-z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, gameState, isGameOver]);
  
  // Handle physical keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleKeyPress('Enter');
      } else if (e.key === 'Backspace') {
        handleKeyPress('Backspace');
      } else {
        const key = e.key.toLowerCase();
        if (/^[a-z]$/.test(key)) {
          handleKeyPress(key);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);
  
  // Submit current guess
  const submitCurrentGuess = async () => {
    if (currentGuess.length !== 5) return;
    
    try {
      const result = await submitGuess(currentGuess);
      
      // Update guess results
      setGuessResults(prev => [...prev, { guess: currentGuess, ...result }]);
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        attempts: result.attempts,
        is_solved: result.correct ? true : prev.is_solved
      }));
      
      // Update keyboard statuses
      const newKeyStatuses = { ...keyStatuses };
      result.result.forEach(({ letter, status }) => {
        // Only update status if it's better than current status
        if (!newKeyStatuses[letter] || 
            (newKeyStatuses[letter] === 'absent' && status !== 'absent') ||
            (newKeyStatuses[letter] === 'present' && status === 'correct')) {
          newKeyStatuses[letter] = status;
        }
      });
      setKeyStatuses(newKeyStatuses);
      
      // Check game end conditions
      if (result.correct || result.attempts >= maxGuesses) {
        setIsGameOver(true);
        
        // Show success or failure message
        if (result.correct) {
          toast.success(`Congratulations! You solved it in ${result.attempts} ${result.attempts === 1 ? 'try' : 'tries'}!`);
        } else {
          toast.error('Game over! You used all your attempts.');
        }
      }
      
      // Clear current guess
      setCurrentGuess('');
      
    } catch (error) {
      console.error('Error submitting guess:', error);
      
      if (error.response && error.response.data) {
        toast.error(error.response.data.detail || 'Failed to submit guess');
      } else {
        toast.error('Failed to submit guess');
      }
    }
  };
  
  // Render a grid cell
  const renderCell = (rowIndex, colIndex) => {
    // Submitted guesses from previous turns
    if (rowIndex < guessResults.length) {
      const result = guessResults[rowIndex];
      if (result && result.result) {
        const letter = result.guess[colIndex];
        const status = result.result[colIndex].status;
        
        let bgColor = 'bg-slate-700/50'; // Default
        if (status === 'correct') {
          bgColor = 'bg-green-600';
        } else if (status === 'present') {
          bgColor = 'bg-yellow-600';
        } else {
          bgColor = 'bg-slate-700';
        }
        
        return (
          <div
            key={`cell-${rowIndex}-${colIndex}`}
            className={`w-12 h-12 flex items-center justify-center border-2 border-slate-600 rounded font-bold text-white ${bgColor}`}
          >
            {letter.toUpperCase()}
          </div>
        );
      }
    }
    
    // Current guess that hasn't been submitted yet
    if (rowIndex === guessResults.length && colIndex < currentGuess.length) {
      return (
        <div
          key={`cell-${rowIndex}-${colIndex}`}
          className="w-12 h-12 flex items-center justify-center border-2 border-slate-400 rounded font-bold text-white bg-slate-700/70"
        >
          {currentGuess[colIndex].toUpperCase()}
        </div>
      );
    }
    
    // Empty future cells or remaining cells in current guess
    return (
      <div
        key={`cell-${rowIndex}-${colIndex}`}
        className={`w-12 h-12 flex items-center justify-center border-2 
          ${rowIndex === guessResults.length ? 'border-slate-500/50' : 'border-slate-700/50'} 
          rounded`}
      />
    );
  };
  
  // Render the keyboard
  const renderKeyboard = () => {
    return (
      <div className="mt-8">
        {keyboardRows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex justify-center mb-2">
            {rowIndex === 1 && <div className="w-2"></div>}
            {row.map(key => {
              let bgColor = 'bg-slate-700 hover:bg-slate-600';
              let width = 'w-9';
              
              if (key === 'Enter') {
                bgColor = 'bg-blue-700 hover:bg-blue-600';
                width = 'w-16';
              } else if (key === 'Backspace') {
                width = 'w-16';
              } else if (keyStatuses[key]) {
                if (keyStatuses[key] === 'correct') {
                  bgColor = 'bg-green-600 hover:bg-green-500';
                } else if (keyStatuses[key] === 'present') {
                  bgColor = 'bg-yellow-600 hover:bg-yellow-500';
                } else if (keyStatuses[key] === 'absent') {
                  bgColor = 'bg-slate-800 hover:bg-slate-700';
                }
              }
              
              return (
                <button
                  key={`key-${key}`}
                  className={`${width} h-12 mx-0.5 flex items-center justify-center ${bgColor} rounded uppercase font-medium text-white transition-colors`}
                  onClick={() => handleKeyPress(key)}
                  disabled={isGameOver}
                >
                  {key === 'Backspace' ? '⌫' : key}
                </button>
              );
            })}
            {rowIndex === 1 && <div className="w-2"></div>}
          </div>
        ))}
      </div>
    );
  };
  
  // Render leaderboard
  const renderLeaderboard = () => {
    if (leaderboardLoading) {
      return (
        <div className="mt-4 flex justify-center">
          <Spinner size="medium" text="Loading leaderboard..." />
        </div>
      );
    }
    
    if (!leaderboardData || leaderboardData.leaderboard.length === 0) {
      return (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-center">
          <p className="text-slate-400">No leaderboard data available yet.</p>
        </div>
      );
    }
    
    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold text-slate-300 mb-3">Today's Leaderboard</h3>
        <div className="bg-slate-800/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50 text-left">
                <th className="py-2 px-4 text-slate-300 font-medium">Rank</th>
                <th className="py-2 px-4 text-slate-300 font-medium">Player</th>
                <th className="py-2 px-4 text-slate-300 font-medium text-center">Attempts</th>
                <th className="py-2 px-4 text-slate-300 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.leaderboard.map((entry, index) => {
                const isCurrentUser = leaderboardData.user_entry && entry.id === leaderboardData.user_entry.id;
                const formattedTime = entry.time_taken 
                  ? `${Math.floor(entry.time_taken / 60)}m ${Math.floor(entry.time_taken % 60)}s`
                  : '-';
                
                return (
                  <tr 
                    key={entry.id} 
                    className={`border-t border-slate-700/50 ${isCurrentUser ? 'bg-blue-900/30' : ''}`}
                  >
                    <td className="py-2 px-4 text-slate-400">{entry.rank}</td>
                    <td className="py-2 px-4 text-slate-300 font-medium">
                      {entry.user.first_name || entry.user.username}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-400">(You)</span>}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {entry.is_solved ? (
                        <span className="text-green-400 font-medium">{entry.attempts}</span>
                      ) : (
                        <span className="text-red-400 font-medium">X</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-slate-400 text-right">{formattedTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="large" text="Loading Wordle..." />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link to="/smartnest/games" className="flex items-center text-blue-400 hover:text-blue-300">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          <span>Back to Games</span>
        </Link>
        <h1 className="text-3xl font-bold text-emerald-400">Wordle</h1>
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className={`flex items-center px-3 py-1.5 rounded ${
            showLeaderboard 
              ? 'bg-amber-700/50 text-amber-300' 
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <TrophyIcon className="h-4 w-4 mr-1" />
          <span>Leaderboard</span>
        </button>
      </div>
      
      {/* Game status */}
      <div className="flex justify-between items-center mb-4">
        <div className="bg-slate-800/50 px-3 py-1.5 rounded-md flex items-center">
          <ClockIcon className="h-4 w-4 text-slate-400 mr-1" />
          <span className="text-sm text-slate-300">
            Attempts: {gameState?.attempts || 0}/{maxGuesses}
          </span>
        </div>
        
        {isGameOver && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-3 py-1.5 bg-blue-700/50 text-blue-300 rounded hover:bg-blue-700"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            <span>Refresh</span>
          </button>
        )}
      </div>
      
      {showLeaderboard ? (
        renderLeaderboard()
      ) : (
        <>
          {/* Game board */}
          <div className="flex flex-col items-center mb-8">
            <div className="grid grid-rows-6 gap-2 mb-6">
              {Array.from({ length: maxGuesses }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="grid grid-cols-5 gap-2">
                  {Array.from({ length: wordLength }).map((_, colIndex) => (
                    renderCell(rowIndex, colIndex)
                  ))}
                </div>
              ))}
            </div>
            
            {/* Game end messages */}
            {isGameOver && (
              <div className={`w-full py-3 px-4 rounded-lg text-center mb-4 
                ${gameState?.is_solved ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}
              >
                {gameState?.is_solved ? (
                  <p className="font-semibold">
                    Congratulations! You solved the word in {gameState.attempts} {gameState.attempts === 1 ? 'attempt' : 'attempts'}.
                  </p>
                ) : (
                  <p className="font-semibold">
                    Game over! Better luck tomorrow.
                  </p>
                )}
              </div>
            )}
            
            {/* Keyboard */}
            {renderKeyboard()}
          </div>
        </>
      )}
    </div>
  );
};

export default WordleGame; 
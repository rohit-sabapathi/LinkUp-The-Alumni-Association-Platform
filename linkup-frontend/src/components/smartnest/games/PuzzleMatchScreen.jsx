import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { fetchMatch, submitPuzzleAnswer } from '../../../services/gameService';

// Safely import confetti with fallback
let confetti;
try {
  // Try to import the confetti library
  confetti = require('canvas-confetti').default;
} catch (error) {
  // Fallback function if the library isn't available
  confetti = () => {
    console.warn('Confetti animation unavailable - canvas-confetti library not loaded');
    return null;
  };
}

const PuzzleMatchScreen = ({ match, onMatchComplete }) => {
  const { currentUser } = useAuth();
  const [currentMatch, setCurrentMatch] = useState(match);
  const [timeRemaining, setTimeRemaining] = useState(match?.puzzle?.time_limit || 120);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingState, setLoadingState] = useState('ready'); // 'ready', 'countdown', 'playing'
  const [countdownValue, setCountdownValue] = useState(3);
  const [opponent, setOpponent] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const answerInputRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const matchPollingRef = useRef(null);

  // Define handleTimeUp at the top of the component, before any useEffect that references it
  const handleTimeUp = () => {
    // Logic for when time runs out
    setResult({
      status: 'timeout',
      message: 'Time is up!'
    });
  };

  // Setup opponent
  useEffect(() => {
    if (currentMatch && currentMatch.player_a && currentUser) {
      // Make sure both player_a and player_b exist (if needed) before setting opponent
      if (currentMatch.player_a.id === currentUser.id) {
        // We are player_a, so opponent is player_b (if it exists)
        setOpponent(currentMatch.player_b || null);
      } else if (currentMatch.player_b) {
        // We are player_b, so opponent is player_a
        setOpponent(currentMatch.player_a);
      } else {
        // Something is wrong, no opponent found
        setOpponent(null);
      }
    }
  }, [currentMatch, currentUser]);

  // Fetch full match data if it appears incomplete
  useEffect(() => {
    const loadFullMatchData = async () => {
      if (currentMatch && currentMatch.id) {
        // Make sure we have both players before proceeding
        if (currentMatch.status === 'active' && (!currentMatch.player_b || !currentMatch.player_a)) {
          console.log('Match appears incomplete, fetching full data...');
          try {
            const fullMatch = await fetchMatch(currentMatch.id);
            if (fullMatch && fullMatch.player_b && fullMatch.player_a) {
              console.log('Updated with full match data');
              setCurrentMatch(fullMatch);
            } else if (fullMatch.status === 'waiting') {
              // If status changed to waiting, we should go back to waiting screen
              if (onMatchComplete) {
                onMatchComplete();
              }
            } else {
              // If after 3 seconds we still don't have two players, go back to lobby
              setTimeout(() => {
                if (onMatchComplete) {
                  console.log('Still missing opponent after timeout, returning to lobby');
                  onMatchComplete();
                }
              }, 3000);
            }
          } catch (error) {
            console.error('Error fetching full match data:', error);
          }
        }
      }
    };
    
    loadFullMatchData();
  }, [currentMatch, onMatchComplete]);

  // SIMPLER COUNTDOWN IMPLEMENTATION
  useEffect(() => {
    // Only run if we're in 'ready' state with a valid match
    if (loadingState !== 'ready' || !currentMatch || 
        !currentMatch.id || !currentMatch.player_a || !currentMatch.player_b || 
        currentMatch.status !== 'active') {
      return;
    }
    
    console.log('Starting countdown for match');
    let timeouts = [];
    
    // Start countdown
    setLoadingState('countdown');
    setCountdownValue(3);
    
    // After 1 second: count 2
    const t1 = setTimeout(() => {
      console.log('Countdown: 2');
      setCountdownValue(2);
    }, 1000);
    timeouts.push(t1);
    
    // After 2 seconds: count 1
    const t2 = setTimeout(() => {
      console.log('Countdown: 1');
      setCountdownValue(1);
    }, 2000);
    timeouts.push(t2);
    
    // After 3 seconds: start game
    const t3 = setTimeout(() => {
      console.log('Starting game');
      
      // Try to play a sound to indicate game start (this may not work due to browser restrictions)
      try {
        const audio = new Audio();
        audio.src = 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAGhgCAgICAgICAgICAgMDAwMDAwMDAwMDAwP////////////////////////////////8AAAA5TEFNRTMuOTlyAc0AAAAAAAAAABSAJAJAQgAAgAAAA+aD2SICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAANIAAAAETEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDEFAPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        audio.play();
      } catch (e) {
        console.log('Could not play audio cue');
      }
      
      // Show confetti to indicate game start
      showConfetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.3 }
      });
      
      setLoadingState('playing');
    }, 3000);
    timeouts.push(t3);
    
    // Cleanup function
    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [loadingState, currentMatch]);

  // Set up game timer when we enter playing state
  useEffect(() => {
    if (loadingState === 'playing' && !result && !timerIntervalRef.current) {
      console.log('Starting game timer with', timeRemaining, 'seconds');
      
      // Start the game timer
      const timerInterval = setInterval(() => {
        setTimeRemaining(prev => {
          // Only log every 10 seconds to reduce console spam
          if (prev % 10 === 0) {
            console.log(`Timer: ${prev} seconds remaining`);
          }
          
          if (prev <= 1) {
            clearInterval(timerInterval);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerIntervalRef.current = timerInterval;
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }
  }, [loadingState, result, handleTimeUp]);

  // Poll for match updates
  useEffect(() => {
    let interval;
    if (currentMatch && currentMatch.id && loadingState === 'playing' && !result && !matchPollingRef.current) {
      console.log('Starting match polling for match ID:', currentMatch.id);
      
      interval = setInterval(async () => {
        try {
          const updatedMatch = await fetchMatch(currentMatch.id);
          
          // Only update if there are actual changes to avoid re-renders
          if (JSON.stringify(updatedMatch) !== JSON.stringify(currentMatch)) {
            console.log('Updating match data from polling');
            setCurrentMatch(updatedMatch);
            
            // Check if match is completed
            if (updatedMatch.status === 'completed') {
              clearInterval(interval);
              handleMatchComplete(updatedMatch);
            }
          }
        } catch (error) {
          console.error('Error polling match:', error);
          // If we get a 404, the match might have been deleted or doesn't exist
          if (error.response && error.response.status === 404) {
            clearInterval(interval);
            setResult({
              status: 'error',
              message: 'Match not found. It may have been cancelled.'
            });
          }
        }
      }, 3000);
      
      matchPollingRef.current = interval;
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (matchPollingRef.current && interval !== matchPollingRef.current) {
        clearInterval(matchPollingRef.current);
        matchPollingRef.current = null;
      }
    };
  }, [currentMatch?.id, loadingState, result]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (matchPollingRef.current) clearInterval(matchPollingRef.current);
    };
  }, []);

  // Safe confetti function that won't crash if the library is missing
  const showConfetti = (options = {}) => {
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: options.particleCount || 100,
          spread: options.spread || 70,
          origin: options.origin || { y: 0.6 },
          ...options
        });
      }
    } catch (error) {
      console.warn('Failed to show confetti animation:', error);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!answer.trim() || isSubmitting) return;
    
    // Validate that we have a valid match ID before submitting
    if (!currentMatch || !currentMatch.id) {
      setResult({
        status: 'error',
        message: 'Error: Match ID not found. Please return to lobby and try again.'
      });
      return;
    }
    
    // Validate that match is active with two players
    if (currentMatch.status !== 'active' || !currentMatch.player_a || !currentMatch.player_b) {
      setResult({
        status: 'error',
        message: 'Error: Match is not properly set up with two players.'
      });
      return;
    }
    
    // Prevent submitting if we've already submitted a correct answer
    const userHasCorrectAnswer = currentMatch.answers && 
      currentMatch.answers.some(a => 
        a.user && a.user.id === currentUser.id && a.is_correct
      );
    
    if (userHasCorrectAnswer) {
      setResult({
        status: 'info',
        message: 'You have already submitted a correct answer. Waiting for the match to complete...'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await submitPuzzleAnswer(currentMatch.id, answer);
      
      if (response.is_correct) {
        // Trigger confetti if correct
        showConfetti({
          particleCount: 100,
          spread: 70
        });
        
        setResult({
          status: 'correct',
          message: 'Correct answer! Waiting to see if you won...'
        });
        
        // Poll for match completion if correct answer
        let pollCount = 0;
        const maxPolls = 10; // Maximum number of polls (10 × 1 second = 10 seconds)
        
        const pollForCompletion = async () => {
          try {
            const updatedMatch = await fetchMatch(currentMatch.id);
            setCurrentMatch(updatedMatch);
            
            if (updatedMatch.status === 'completed') {
              handleMatchComplete(updatedMatch);
              return;
            }
            
            // Check if we've reached max polls
            pollCount++;
            if (pollCount >= maxPolls) {
              // If match still not completed after max polls, force check completion
              if (updatedMatch.winner) {
                handleMatchComplete(updatedMatch);
              } else {
                // If no winner, check if we were first
                const ourAnswer = updatedMatch.answers.find(a => a.user.id === currentUser.id && a.is_correct);
                const opponentAnswer = updatedMatch.answers.find(a => 
                  a.user.id !== currentUser.id && a.is_correct
                );
                
                if (ourAnswer && (!opponentAnswer || 
                    new Date(ourAnswer.submitted_at) < new Date(opponentAnswer.submitted_at))) {
                  // We answered correctly first
                  handleMatchComplete({
                    ...updatedMatch,
                    winner: {id: currentUser.id}
                  });
                } else if (opponentAnswer) {
                  // Opponent answered correctly first
                  handleMatchComplete(updatedMatch);
                }
              }
              return;
            }
            
            // Continue polling if match not completed
            setTimeout(pollForCompletion, 1000);
          } catch (error) {
            console.error('Error polling for match completion:', error);
          }
        };
        
        if (response.match_completed) {
          // If match already completed, fetch final state and complete
          const updatedMatch = await fetchMatch(currentMatch.id);
          setCurrentMatch(updatedMatch);
          handleMatchComplete(updatedMatch);
        } else {
          // Start polling for completion
          setTimeout(pollForCompletion, 1000);
        }
      } else {
        setResult({
          status: 'incorrect',
          message: 'Incorrect answer. Try again!'
        });
        // Clear the answer field for another try
        setAnswer('');
        setTimeout(() => {
          setResult(null);
          if (answerInputRef.current) {
            answerInputRef.current.focus();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setResult({
        status: 'error',
        message: 'Error submitting answer. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMatchComplete = (match) => {
    // Stop the timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (matchPollingRef.current) {
      clearInterval(matchPollingRef.current);
    }
    
    // Default to match ended without winner if match or winner is undefined
    let resultStatus = 'end';
    let resultMessage = 'Match ended without a winner.';
    
    // Safely check if the current user is the winner
    if (match && match.winner && currentUser) {
      const isWinner = match.winner.id === currentUser.id;
      
      if (isWinner) {
        resultStatus = 'win';
        resultMessage = 'Congratulations! You won the match!';
        
        // Trigger confetti if winner
        showConfetti({
          particleCount: 200,
          spread: 100
        });
      } else if (match.winner) {
        resultStatus = 'lose';
        resultMessage = 'Your opponent solved the puzzle faster.';
      }
    }
    
    setResult({
      status: resultStatus,
      message: resultMessage
    });
    
    // Auto return to lobby after 5 seconds
    setTimeout(() => {
      if (onMatchComplete) {
        onMatchComplete();
      }
    }, 5000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render method - handle incomplete data case
  const isMatchDataValid = () => {
    return currentMatch && 
           currentMatch.id && 
           currentMatch.puzzle && 
           currentMatch.player_a && 
           (currentMatch.status === 'waiting' || currentMatch.player_b);
  };

  // Handle incomplete match case
  useEffect(() => {
    // Only run if we're in 'ready' state with a match that's missing players
    if (loadingState !== 'ready' || !currentMatch || !currentMatch.id ||
        currentMatch.status !== 'active' || (currentMatch.player_a && currentMatch.player_b)) {
      return;
    }
    
    console.log('Match is incomplete - missing players, will wait briefly');
    
    // Set a timeout to transition to incomplete_data state if players don't connect
    const timeout = setTimeout(() => {
      console.log('Match still incomplete after waiting, showing error');
      setLoadingState('incomplete_data');
      
      // Set another timeout to return to lobby
      const returnTimeout = setTimeout(() => {
        console.log('Returning to lobby due to incomplete match');
        if (onMatchComplete) {
          onMatchComplete();
        }
      }, 5000);
      
      return () => clearTimeout(returnTimeout);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [loadingState, currentMatch, onMatchComplete]);

  // If match data is not valid, show appropriate loading UI
  if (!isMatchDataValid()) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center justify-center py-10">
          <div className="bg-blue-500/10 p-6 rounded-full mb-6 animate-pulse">
            <ClockIcon className="h-16 w-16 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-blue-300 mb-4">Loading Match Data...</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Please wait while we prepare your puzzle battle.
          </p>
          
          <div className="flex flex-col gap-3">
            {loadingState === 'incomplete_data' && (
              <div>
                <p className="text-amber-400 mb-4">
                  It's taking longer than expected to load the match data.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Refresh Page
                </button>
              </div>
            )}
            
            {/* Recovery button that's always shown */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-amber-400 mb-3">
                If the game seems stuck, try these recovery options:
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  Refresh Page
                </button>
                <button 
                  onClick={() => {
                    if (onMatchComplete) {
                      onMatchComplete();
                    }
                  }}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle countdown state rendering
  if (loadingState === 'countdown') {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-green-500/10 p-8 rounded-full mb-8">
            <div className="text-6xl font-bold text-green-400">{countdownValue}</div>
          </div>
          <h2 className="text-2xl font-bold text-green-300 mb-6">Get Ready!</h2>
          <div className="bg-slate-700/50 p-4 rounded-lg text-left max-w-md">
            <h3 className="text-amber-300 font-medium mb-2">You'll be solving:</h3>
            <p className="text-slate-300">{currentMatch.puzzle.type} Puzzle ({currentMatch.puzzle.difficulty})</p>
            <p className="text-slate-400 text-sm mt-2">Time limit: {currentMatch.puzzle.time_limit} seconds</p>
          </div>
          
          {/* Debug info for countdown - this helps identify stuck countdowns */}
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
            <p>Match ID: {currentMatch.id} | Countdown value: {countdownValue}</p>
            <p>Match status: {currentMatch.status} | Players: {currentMatch.player_a ? '✓' : '✗'}/{currentMatch.player_b ? '✓' : '✗'}</p>
          </div>
          
          {/* Recovery options */}
          <div className="mt-8 pt-4 border-t border-slate-700 max-w-md w-full">
            <details className="text-left">
              <summary className="cursor-pointer text-amber-400 hover:text-amber-300 text-sm mb-2">
                Having trouble? Click here for options
              </summary>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setLoadingState('playing')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition text-sm font-medium"
                >
                  Force Start Game
                </button>
                <div className="flex gap-3 justify-center mt-1">
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition text-sm"
                  >
                    Refresh Page
                  </button>
                  <button 
                    onClick={() => {
                      if (onMatchComplete) {
                        onMatchComplete();
                      }
                    }}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition text-sm"
                  >
                    Return to Lobby
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // Render results screen
  if (result) {
    let bgColor, textColor, icon;
    
    switch (result.status) {
      case 'win':
        bgColor = 'bg-emerald-900/30';
        textColor = 'text-emerald-300';
        icon = <CheckCircleIcon className="h-16 w-16 text-emerald-400 mb-4" />;
        break;
      case 'lose':
        bgColor = 'bg-red-900/30';
        textColor = 'text-red-300';
        icon = <XCircleIcon className="h-16 w-16 text-red-400 mb-4" />;
        break;
      case 'correct':
        bgColor = 'bg-blue-900/30';
        textColor = 'text-blue-300';
        icon = <CheckCircleIcon className="h-16 w-16 text-blue-400 mb-4" />;
        break;
      case 'incorrect':
        bgColor = 'bg-orange-900/30';
        textColor = 'text-orange-300';
        icon = <XCircleIcon className="h-16 w-16 text-orange-400 mb-4" />;
        break;
      default:
        bgColor = 'bg-slate-800/50';
        textColor = 'text-slate-300';
        icon = null;
    }
    
    return (
      <div className={`rounded-xl p-10 ${bgColor} flex flex-col items-center justify-center min-h-[400px]`}>
        {icon}
        <h2 className={`text-2xl font-bold ${textColor} mb-4`}>
          {result.status === 'win' ? 'You Won!' : 
           result.status === 'lose' ? 'You Lost!' : 
           result.status === 'correct' ? 'Correct Answer!' : 
           result.status === 'incorrect' ? 'Incorrect Answer' : 'Match Ended'}
        </h2>
        <p className="text-lg text-slate-300 text-center mb-6">{result.message}</p>
        
        {(result.status === 'win' || result.status === 'lose') && (
          <>
            <div className="bg-slate-800/50 p-4 rounded-lg mb-6 max-w-md w-full">
              <h3 className="text-slate-300 font-medium mb-2">Puzzle Solution</h3>
              <p className="text-amber-300">{currentMatch.puzzle.explanation || currentMatch.puzzle.answer}</p>
            </div>
            <p className="text-slate-400 text-sm">Returning to lobby in a few seconds...</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Info */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-slate-400">You</div>
          <div className="text-lg text-amber-300 font-medium truncate">
            {currentUser ? (currentUser.username || currentUser.email) : 'You'}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-slate-400">Time Left</div>
          <div className={`text-xl font-bold ${timeRemaining < 30 ? 'text-red-400 animate-pulse' : 'text-blue-300'}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-slate-400">Opponent</div>
          <div className="text-lg text-green-300 font-medium truncate">
            {opponent ? (opponent.username || 'Opponent') : 'Waiting...'}
          </div>
        </div>
      </div>
      
      {/* Puzzle */}
      <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 p-6 rounded-xl border border-amber-800/30">
        <h3 className="text-xl text-amber-300 font-medium mb-3">Puzzle</h3>
        <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
          <p className="text-slate-200 text-lg">{currentMatch.puzzle.question}</p>
        </div>
        
        {/* Multiple choice options */}
        {currentMatch.puzzle.type === 'debug' && currentMatch.puzzle.options && (
          <div className="mb-6 space-y-2">
            {currentMatch.puzzle.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setAnswer(option)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  answer === option 
                    ? 'bg-amber-700/50 text-white border border-amber-500/50' 
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        
        {/* Answer form */}
        <form onSubmit={handleSubmitAnswer} className="flex flex-col space-y-4">
          <div>
            <label htmlFor="answer" className="block text-sm text-slate-400 mb-1">
              Your Answer
            </label>
            <input
              ref={answerInputRef}
              type="text"
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              disabled={isSubmitting}
            />
          </div>
          
          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className={`flex items-center justify-center space-x-2 py-3 px-6 rounded-lg ${
              !answer.trim() || isSubmitting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            } transition-colors`}
          >
            <span>Submit Answer</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default PuzzleMatchScreen; 
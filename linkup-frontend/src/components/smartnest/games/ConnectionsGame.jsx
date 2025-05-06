import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon, XMarkIcon, CheckIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { fetchCurrentConnectionsGame, submitConnectionsGuess, fetchConnectionsSolution } from '../../../services/gameService';

const ConnectionsGame = () => {
  const [gameState, setGameState] = useState(null);
  const [words, setWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [foundGroups, setFoundGroups] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [solution, setSolution] = useState(null);
  const [showingSolution, setShowingSolution] = useState(false);
  const [domain, setDomain] = useState('computer_science');
  const [domainName, setDomainName] = useState('Computer Science');
  const [hints, setHints] = useState([]);
  const [showingHints, setShowingHints] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get domain from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const domainParam = params.get('domain');
    if (domainParam) {
      setDomain(domainParam);
      // Set a readable domain name
      switch(domainParam) {
        case 'computer_science':
          setDomainName('Computer Science');
          break;
        case 'electrical_electronics':
          setDomainName('Electrical & Electronics');
          break;
        case 'mechanical':
          setDomainName('Mechanical');
          break;
        case 'aeronautical':
          setDomainName('Aeronautical');
          break;
        default:
          setDomainName('Connections');
      }
    }
  }, [location]);

  // Load game state
  const loadGame = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchCurrentConnectionsGame(domain);
      
      setGameState(data.game);
      setWords(shuffleArray([...data.words]));
      
      // Set hints
      if (data.hints) {
        setHints(data.hints);
      }
      
      // Set up found groups from saved state
      if (data.game && data.game.groups_found) {
        setFoundGroups(data.game.groups_found);
      }
      
      // Check if game is already over
      if (data.game && (data.game.is_solved || data.game.mistakes >= 4)) {
        setIsGameOver(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      toast.error('Failed to load game');
      setIsLoading(false);
    }
  }, [domain]);

  // Load game when domain changes
  useEffect(() => {
    loadGame();
  }, [loadGame, domain]);

  // Shuffle the words array
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Check if a word is in a found group
  const isWordInFoundGroup = (wordObj) => {
    // If no found groups, return false
    if (foundGroups.length === 0) {
      return false;
    }
    
    // If solution is loaded, check against solution data
    if (solution) {
      // Check each found group
      for (const groupId of foundGroups) {
        const group = solution.groups.find(g => g.id === groupId);
        if (group && group.words.includes(wordObj.word)) {
          return groupId;
        }
      }
      return false;
    }
    
    // If solution isn't loaded yet but we have found groups,
    // We need a fallback mechanism to identify found words
    // This is imperfect but helps prevent selections before solution loads
    const existingFoundWords = words.filter(w => {
      // Try to determine if this word was part of a found group based on API response
      return foundGroups.includes(w.groupId);
    });
    
    return existingFoundWords.some(w => w.id === wordObj.id) ? true : false;
  };

  // Handle word selection
  const handleWordClick = (wordId) => {
    if (isGameOver || submitting) return;
    
    // Check if this word belongs to an already found group
    const wordObj = words.find(w => w.id === wordId);
    if (!wordObj) return;
    
    const foundGroupId = isWordInFoundGroup(wordObj);
    if (foundGroupId) {
      // Word is already part of a found group
      return;
    }
    
    // If already selected, deselect it
    if (selectedWords.includes(wordId)) {
      setSelectedWords(selectedWords.filter(id => id !== wordId));
      return;
    }
    
    // Can't select more than 4 words
    if (selectedWords.length >= 4) return;
    
    // Add to selected
    setSelectedWords([...selectedWords, wordId]);
  };

  // Handle deselect all button
  const handleDeselectAll = () => {
    setSelectedWords([]);
  };

  // Handle shuffle button
  const handleShuffle = () => {
    if (submitting) return;
    
    // Get words that are not part of found groups
    const availableWords = words.filter(word => {
      const foundGroupId = isWordInFoundGroup(word);
      return foundGroupId === false;
    });
    
    // Shuffle only available words
    const shuffledAvailable = shuffleArray(availableWords);
    
    // Create a new array with the same order but with shuffled available words
    let newWords = [];
    let availableIndex = 0;
    
    words.forEach(word => {
      const foundGroupId = isWordInFoundGroup(word);
      if (foundGroupId !== false) {
        // This word is in a found group, keep it in place
        newWords.push(word);
      } else {
        // This word is not in a found group, replace with next shuffled word
        newWords.push(shuffledAvailable[availableIndex]);
        availableIndex++;
      }
    });
    
    setWords(newWords);
    setSelectedWords([]);
  };

  // Handle back to domain selection
  const handleBackToDomains = () => {
    navigate('/smartnest/games');
  };

  // Toggle hint visibility
  const toggleHint = (hintId) => {
    setShowingHints(prev => ({
      ...prev,
      [hintId]: !prev[hintId]
    }));
  };

  // Handle submit guess
  const handleSubmit = async () => {
    if (isGameOver || submitting || selectedWords.length !== 4) return;
    
    try {
      setSubmitting(true);
      const result = await submitConnectionsGuess(selectedWords, domain);
      
      if (result.correct) {
        // Success! Found a group
        toast.success(`Group found: ${result.group.name}`);
        
        // Add confetti effect
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Update found groups
        setFoundGroups([...foundGroups, result.group.id]);
        
        // Mark found words with their group ID for easier tracking
        const foundWordIds = selectedWords;
        const updatedWords = words.map(word => {
          if (foundWordIds.includes(word.id)) {
            return { ...word, groupId: result.group.id };
          }
          return word;
        });
        setWords(updatedWords);
        
        // If all groups found, game is over
        if (result.game_over) {
          setIsGameOver(true);
          toast.success('Congratulations! You solved all connections!');
          
          // More celebratory confetti
          confetti({
            particleCount: 200,
            spread: 180,
            origin: { y: 0.6 }
          });
        }
      } else {
        // Wrong guess
        toast.error('That\'s not a valid group. Try again!');
        
        // If too many mistakes, game is over
        if (result.game_over) {
          setIsGameOver(true);
          toast.error('Game over! Too many mistakes.');
        }
      }
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        mistakes: result.mistakes,
        is_solved: result.game_over && result.correct
      }));
      
      // Clear selection
      setSelectedWords([]);
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting guess:', error);
      toast.error('Failed to submit guess');
      setSubmitting(false);
    }
  };

  // Load solution when game is over
  useEffect(() => {
    if (isGameOver && !solution) {
      const loadSolution = async () => {
        try {
          const data = await fetchConnectionsSolution(domain);
          setSolution(data);
        } catch (error) {
          console.error('Error loading solution:', error);
        }
      };
      
      loadSolution();
    }
  }, [isGameOver, solution, domain]);

  // Toggle solution visibility
  const toggleSolution = () => {
    if (isGameOver) {
      setShowingSolution(!showingSolution);
    }
  };

  // Get color class for a found group
  const getGroupColorClass = (groupId) => {
    if (!solution) return '';
    
    const group = solution?.groups.find(g => g.id === groupId);
    if (!group) return '';
    
    // Map difficulty levels to TailwindCSS color classes
    const difficultyColors = {
      'easy': 'bg-yellow-300 text-yellow-900',
      'medium': 'bg-green-300 text-green-900',
      'hard': 'bg-blue-300 text-blue-900',
      'very_hard': 'bg-purple-300 text-purple-900'
    };
    
    return difficultyColors[group.difficulty] || 'bg-slate-300 text-slate-900';
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <Link to="/smartnest/games" className="flex items-center text-blue-400 hover:text-blue-300">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back to Games</span>
          </Link>
          <h1 className="text-3xl font-bold text-purple-400">Connection Grid</h1>
        </div>
        
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-pulse text-purple-300">Loading game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={handleBackToDomains} 
          className="flex items-center text-blue-400 hover:text-blue-300"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          <span>Back to Domains</span>
        </button>
        <h1 className="text-3xl font-bold text-purple-400">
          {domainName} Connections
        </h1>
      </div>
      
      {/* Game instructions */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
        <p className="text-slate-300 text-center">
          Find groups of four words that share a common connection in {domainName.toLowerCase()}. Select four words and click Submit to check your answer.
        </p>
      </div>
      
      {/* Game status */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="text-slate-300">
            Mistakes: {gameState?.mistakes || 0}/4
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-slate-300">
            Groups found: {foundGroups.length}/4
          </span>
        </div>
      </div>
      
      {/* Hints section */}
      {!isGameOver && hints.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hints.map(hint => (
              <div key={hint.id} className="text-center">
                <button
                  onClick={() => toggleHint(hint.id)}
                  className={`p-2 mx-auto flex items-center justify-center
                    ${showingHints[hint.id] 
                      ? 'text-yellow-400' 
                      : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <LightBulbIcon className="h-10 w-10" />
                </button>
                {showingHints[hint.id] && (
                  <div className="mt-2 text-sm text-yellow-300 bg-yellow-900/30 p-2 rounded">
                    {hint.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Solution toggle */}
      {isGameOver && solution && (
        <div className="mb-4">
          <button 
            onClick={toggleSolution}
            className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg transition-colors"
          >
            {showingSolution ? 'Hide Solution' : 'Show Solution'}
          </button>
        </div>
      )}
      
      {/* Solution display */}
      {isGameOver && showingSolution && solution && (
        <div className="mb-6 space-y-4">
          <h2 className="text-xl font-semibold text-purple-300">Solution</h2>
          <div className="grid gap-4">
            {solution.groups.map(group => (
              <div 
                key={group.id} 
                className={`p-3 rounded-lg ${getGroupColorClass(group.id)}`}
              >
                <div className="font-semibold mb-1">{group.name}</div>
                <div className="text-sm mb-1">{group.description}</div>
                {group.hint && (
                  <div className="text-sm italic mb-1">Hint: {group.hint}</div>
                )}
                <div className="flex flex-wrap gap-2">
                  {group.words.map((word, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-white/20 rounded"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs opacity-75">
                  {foundGroups.includes(group.id) ? 'Found by you!' : 'Not found'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Game board */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {words.map((wordObj) => {
          const isSelected = selectedWords.includes(wordObj.id);
          const foundGroupId = isWordInFoundGroup(wordObj);
          const isFound = foundGroupId !== false;
          
          return (
            <button
              key={wordObj.id}
              onClick={() => handleWordClick(wordObj.id)}
              disabled={isFound || isGameOver}
              className={`
                h-20 flex items-center justify-center font-medium rounded-lg p-2 text-center
                ${isFound 
                  ? getGroupColorClass(foundGroupId) + ' cursor-not-allowed opacity-90' 
                  : isSelected 
                    ? 'bg-indigo-600/50 text-white' 
                    : 'bg-slate-100/10 text-slate-200 hover:bg-slate-100/20'
                }
                transition-colors
              `}
            >
              {wordObj.word}
            </button>
          );
        })}
      </div>
      
      {/* Mistakes remaining indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Mistakes Remaining:</span>
          <div className="flex space-x-1">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full ${i < (4 - (gameState?.mistakes || 0)) ? 'bg-slate-600' : 'bg-transparent border border-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleShuffle}
          disabled={isGameOver || submitting}
          className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Shuffle
        </button>
        
        <button
          onClick={handleDeselectAll}
          disabled={selectedWords.length === 0 || isGameOver || submitting}
          className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Deselect All
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={selectedWords.length !== 4 || isGameOver || submitting}
          className="flex items-center px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckIcon className="h-4 w-4 mr-1" />
          Submit
        </button>
      </div>
      
      {/* Game end message */}
      {isGameOver && (
        <div className={`mt-6 p-4 rounded-lg text-center ${gameState?.is_solved ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
          <h2 className="text-xl font-bold mb-2">
            {gameState?.is_solved 
              ? 'Congratulations!' 
              : 'Game Over'}
          </h2>
          <p>
            {gameState?.is_solved 
              ? `You found all the connections!` 
              : `You found ${foundGroups.length} out of 4 connections.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectionsGame; 
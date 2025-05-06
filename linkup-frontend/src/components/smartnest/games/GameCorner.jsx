import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PuzzlePieceIcon,
  SparklesIcon,
  AcademicCapIcon,
  BoltIcon,
  CogIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { fetchConnectionsDomains } from '../../../services/gameService';

const GameCorner = () => {
  const [showDomains, setShowDomains] = useState(false);
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If showing domains, fetch them
    if (showDomains) {
      const loadDomains = async () => {
        setIsLoading(true);
        try {
          const domainsData = await fetchConnectionsDomains();
          setDomains(domainsData);
        } catch (error) {
          console.error('Failed to load domains:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadDomains();
    }
  }, [showDomains]);

  const handleConnectionsClick = (e) => {
    e.preventDefault();
    setShowDomains(true);
  };

  const handleDomainSelect = (domainId) => {
    navigate(`/smartnest/games/connections?domain=${domainId}`);
  };

  const getDomainIcon = (domainId) => {
    switch(domainId) {
      case 'computer_science':
        return <AcademicCapIcon className="h-12 w-12 text-blue-400" />;
      case 'electrical_electronics':
        return <BoltIcon className="h-12 w-12 text-yellow-400" />;
      case 'mechanical':
        return <CogIcon className="h-12 w-12 text-red-400" />;
      case 'aeronautical':
        return <RocketLaunchIcon className="h-12 w-12 text-green-400" />;
      default:
        return <PuzzlePieceIcon className="h-12 w-12 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-green-400">Game Corner</h1>
      </div>
      
      {showDomains ? (
        <div className="space-y-6">
          <div className="flex items-center">
            <button
              onClick={() => setShowDomains(false)}
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              ← Back to Games
            </button>
            <h2 className="text-2xl font-semibold text-purple-300 ml-4">Select Domain for Connections</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-purple-300">Loading domains...</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {domains.map(domain => (
                <button
                  key={domain.id}
                  onClick={() => handleDomainSelect(domain.id)}
                  disabled={domain.completed}
                  className={`p-6 text-left ${domain.completed 
                    ? 'bg-slate-800/50 cursor-not-allowed opacity-70' 
                    : 'bg-gradient-to-br hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-600 transition-all duration-300'} 
                    ${domain.id === 'computer_science' ? 'from-blue-900/50 to-indigo-900/50 border-blue-800/50' : ''}
                    ${domain.id === 'electrical_electronics' ? 'from-yellow-900/50 to-amber-900/50 border-yellow-800/50' : ''}
                    ${domain.id === 'mechanical' ? 'from-red-900/50 to-pink-900/50 border-red-800/50' : ''}
                    ${domain.id === 'aeronautical' ? 'from-green-900/50 to-emerald-900/50 border-green-800/50' : ''}
                    rounded-xl border`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full ${domain.id === 'computer_science' ? 'bg-blue-500/10' : ''} 
                      ${domain.id === 'electrical_electronics' ? 'bg-yellow-500/10' : ''} 
                      ${domain.id === 'mechanical' ? 'bg-red-500/10' : ''} 
                      ${domain.id === 'aeronautical' ? 'bg-green-500/10' : ''}`}
                    >
                      {getDomainIcon(domain.id)}
                    </div>
                    <h2 className="text-xl font-semibold text-slate-200">{domain.name}</h2>
                    {domain.completed ? (
                      <div className="text-green-400">Completed ✓</div>
                    ) : domain.in_progress ? (
                      <div className="text-amber-400">In progress...</div>
                    ) : (
                      <p className="text-slate-400">Find connections between words in {domain.name.toLowerCase()}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Wordle Game Card */}
          <Link 
            to="/smartnest/games/wordle"
            className="group p-6 bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl border border-emerald-800/50 hover:border-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <SparklesIcon className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-300">Wordle</h2>
              <p className="text-slate-400">Challenge yourself with the daily 5-letter word puzzle</p>
            </div>
          </Link>

          {/* NY Connections Game Card */}
          <a 
            href="#"
            onClick={handleConnectionsClick}
            className="group p-6 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl border border-purple-800/50 hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <PuzzlePieceIcon className="h-10 w-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-purple-300">Connection Grid</h2>
              <p className="text-slate-400">Find the hidden connections between words in your field of expertise</p>
            </div>
          </a>
        </div>
      )}
    </div>
  );
};

export default GameCorner; 
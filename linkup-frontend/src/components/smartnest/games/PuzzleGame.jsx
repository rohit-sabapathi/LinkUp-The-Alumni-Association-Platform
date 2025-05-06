import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';

const PuzzleGame = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link to="/smartnest/games" className="flex items-center text-blue-400 hover:text-blue-300">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          <span>Back to Games</span>
        </Link>
        <h1 className="text-3xl font-bold text-orange-400">Puzzle Battle Arena</h1>
      </div>
      
      <div className="bg-slate-800/50 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center justify-center py-10">
          <div className="bg-amber-500/10 p-6 rounded-full mb-6">
            <ClockIcon className="h-16 w-16 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-amber-300 mb-2">Coming Soon!</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            The Puzzle Battle Arena is currently in development. Soon you'll be able to challenge other alumni in exciting puzzle competitions!
          </p>
          <Link 
            to="/smartnest/games"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
          >
            Check Back Later
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PuzzleGame; 
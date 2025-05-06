import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PuzzlePieceIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const GameCorner = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-green-400">Game Corner</h1>
      </div>
      
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

        {/* Puzzle Battle Arena Card (Placeholder) */}
        <Link 
          to="/smartnest/games/puzzle"
          className="group p-6 bg-gradient-to-br from-orange-900/50 to-amber-900/50 rounded-xl border border-orange-800/50 hover:border-orange-600 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
              <PuzzlePieceIcon className="h-10 w-10 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-orange-300">Puzzle Battle Arena</h2>
            <p className="text-slate-400">Coming soon: Test your puzzle-solving skills against other alumni</p>
            <span className="px-3 py-1 bg-amber-900/50 text-amber-300 text-xs rounded-full">Coming Soon</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default GameCorner; 
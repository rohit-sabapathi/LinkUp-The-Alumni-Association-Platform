import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const KnowledgeHub = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-400 mb-8">Knowledge Hub</h1>
      
      <div className="grid gap-6">
        {/* Articles and Case Study Card */}
        <Link 
          to="/smartnest/knowledge-hub/articles"
          className="group p-6 bg-gradient-to-br from-amber-900/50 to-orange-900/50 rounded-xl border border-amber-800/50 hover:border-amber-600 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <BookOpenIcon className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold text-amber-300">Articles and Case Study</h2>
            <p className="text-slate-400">Read and share valuable articles and case studies from the alumni community</p>
          </div>
        </Link>
        
        {/* More cards can be added here in the future */}
      </div>
    </div>
  );
};

export default KnowledgeHub; 
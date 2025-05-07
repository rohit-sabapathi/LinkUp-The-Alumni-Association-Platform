import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

const KnowledgeHub = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-400 mb-8">Knowledge Hub</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
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
        
        {/* Discussion Forum Card */}
        <Link 
          to="/smartnest/knowledge-hub/discussion-forum"
          className="group p-6 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-xl border border-blue-800/50 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-blue-300">Discussion Forum: Ask & Discuss</h2>
            <p className="text-slate-400">Post questions and discuss career-related topics with alumni and students</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default KnowledgeHub; 
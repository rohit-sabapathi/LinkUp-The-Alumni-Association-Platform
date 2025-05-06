import { Link } from 'react-router-dom';
import { UserGroupIcon, AcademicCapIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ChatBot from '../chatbot';
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
const SmartNest = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">SmartNest</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Project Collaboration Card */}
        <Link 
          to="/smartnest/projects"
          className="group p-6 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-xl border border-blue-800/50 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <UserGroupIcon className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-blue-300">Project Collaboration</h2>
            <p className="text-slate-400">Connect with fellow alumni for innovative project collaborations</p>
          </div>
        </Link>

        {/* Knowledge Sharing & Mentorship Card */}
        <Link 
          to="/smartnest/mentorship"
          className="group p-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-800/50 hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <AcademicCapIcon className="h-10 w-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-purple-300">Knowledge Sharing & Mentorship</h2>
            <p className="text-slate-400">Share expertise and guide others through mentorship programs</p>
          </div>
        </Link>

        {/* Game Corner Card */}
        <Link 
          to="/smartnest/games"
          className="group p-6 bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl border border-green-800/50 hover:border-green-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <SparklesIcon className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-green-300">Game Corner</h2>
            <p className="text-slate-400">Take a break and have fun with brain-stimulating games</p>
          </div>
        </Link>
        
        <ChatBot apiKey={groqApiKey} />
      </div>
    </div>
    
  );
};

export default SmartNest; 
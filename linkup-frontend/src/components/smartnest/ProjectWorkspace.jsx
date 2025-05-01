import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ShareIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const ProjectWorkspace = () => {
  const { workspaceId } = useParams();
  const [activeTab, setActiveTab] = useState('chat');
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulating workspace data fetch
  useEffect(() => {
    // This would be replaced with an actual API call
    const mockWorkspace = {
      id: workspaceId,
      title: 'Project Workspace',
      description: 'Collaborative environment for team members',
      createdAt: new Date().toISOString(),
      members: [
        { id: 1, name: 'John Doe', avatar: null, role: 'Admin' },
        { id: 2, name: 'Jane Smith', avatar: null, role: 'Member' }
      ]
    };
    
    setTimeout(() => {
      setWorkspace(mockWorkspace);
      setLoading(false);
    }, 500);
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div className="text-slate-400">Loading workspace...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'chat', label: 'Team Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'tracking', label: 'Project Tracking', icon: ChartBarIcon },
    { id: 'sharing', label: 'Resource Sharing', icon: ShareIcon },
    { id: 'team', label: 'Team Members', icon: UserGroupIcon },
    { id: 'settings', label: 'Workspace Settings', icon: Cog6ToothIcon }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Workspace header */}
        <div className="p-4 border-b border-slate-700">
          <Link to="/smartnest/projects" className="flex items-center text-slate-400 hover:text-slate-200 mb-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
          <h1 className="text-xl font-semibold text-slate-200 truncate">{workspace.title}</h1>
          <p className="text-sm text-slate-400 mt-1 truncate">{workspace.description}</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
        
        {/* User section */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/80">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
              JD
            </div>
            <div>
              <div className="text-slate-200 font-medium">John Doe</div>
              <div className="text-slate-500 text-sm">Project Admin</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Tab header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-200">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h2>
          <div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
              Invite Members
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0 mb-4 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-medium text-slate-300">Team Discussion</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-center items-center">
                  <div className="text-slate-400">
                    <p className="text-center mb-2">Chat functionality coming soon...</p>
                    <p className="text-center text-sm">Your team conversations will appear here</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="p-3 border-b border-slate-700 flex items-center">
                  <button className="p-2 text-slate-400 hover:text-indigo-400">
                    <PaperClipIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-indigo-400">
                    <DocumentTextIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex">
                  <input 
                    type="text"
                    placeholder="Type a message..."
                    className="flex-grow px-4 py-3 bg-transparent border-0 text-slate-200 focus:outline-none"
                    disabled
                  />
                  <button className="px-4 py-3 bg-indigo-600 text-white rounded-r-lg opacity-50 cursor-not-allowed">
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 h-[calc(100vh-220px)] p-6 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <p className="mb-2">Project tracking functionality coming soon...</p>
                <p className="text-sm max-w-md mx-auto">Track tasks, deadlines, milestones and progress for your project</p>
              </div>
            </div>
          )}
          
          {/* Sharing Tab */}
          {activeTab === 'sharing' && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 h-[calc(100vh-220px)] p-6 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <p className="mb-2">Resource sharing functionality coming soon...</p>
                <p className="text-sm max-w-md mx-auto">Share documents, links, code repositories and other resources with your team</p>
              </div>
            </div>
          )}
          
          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 h-[calc(100vh-220px)] p-6 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <p className="mb-2">Team management functionality coming soon...</p>
                <p className="text-sm max-w-md mx-auto">View, add, and manage team members for your project</p>
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 h-[calc(100vh-220px)] p-6 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <p className="mb-2">Workspace settings coming soon...</p>
                <p className="text-sm max-w-md mx-auto">Customize your workspace preferences, notifications, and permissions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspace; 
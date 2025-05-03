import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CometChatApp from "../CometChat/App";
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
import { toast } from 'react-hot-toast';
import CometChatApp from '../CometChat/App';
import ResourceSharing from '../resources/ResourceSharing';
import { fetchWorkspaceBySlug, fetchProjectMembers } from '../../services/projectService';

// Custom ErrorBoundary to handle chat errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex justify-center items-center h-full p-6">
          <div className="text-slate-400 text-center">
            <p className="mb-2">Component error occurred</p>
            <p className="text-sm">Try refreshing the page</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProjectWorkspace = () => {
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const [activeTab, setActiveTab] = useState('chat');
  const [workspace, setWorkspace] = useState(null);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      setLoading(true);
      try {
        // Fetch workspace by slug
        const workspaceData = await fetchWorkspaceBySlug(workspaceSlug);
        setWorkspace(workspaceData);
        
        // Get project ID - check multiple possible sources
        const projectId = workspaceData.project_id || workspaceData.project;
        
        if (projectId) {
          console.log('Found project ID:', projectId);
          try {
            const membersData = await fetchProjectMembers(projectId);
            setMembers(membersData);
            setProject(projectId);
            setError(null);
          } catch (memberError) {
            console.error('Error fetching project members:', memberError);
            // Continue showing the workspace even if members can't be loaded
            setError(null);
          }
        } else {
          console.error('Workspace data missing project ID:', workspaceData);
          
          // Try to extract project ID from the slug
          const slugParts = workspaceSlug.split('-');
          const idFragment = slugParts[slugParts.length - 1];
          console.log('Attempting to use ID fragment from slug:', idFragment);
          
          // We'll continue showing the workspace even without members
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching workspace:', error);
        setError(error.detail || 'Failed to load workspace');
        toast.error(error.detail || 'Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };
    
    if (workspaceSlug) {
      fetchWorkspaceData();
    }
  }, [workspaceSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center">
        <div className="text-slate-400 mb-4">
          {error || "Workspace not found or you don't have access to it."}
        </div>
        <button 
          onClick={() => navigate('/smartnest/projects')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Projects
        </button>
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
        
        {/* User section - show first member if available or default user */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/80">
          <div className="flex items-center">
            {members && members.length > 0 ? (
              <>
                <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                  {members[0].user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-slate-200 font-medium">
                    {members[0].user.full_name || members[0].user.username}
                  </div>
                  <div className="text-slate-500 text-sm capitalize">{members[0].role}</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                  U
                </div>
                <div>
                  <div className="text-slate-200 font-medium">User</div>
                  <div className="text-slate-500 text-sm">Project Member</div>
                </div>
              </>
            )}
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
  <div className="h-full flex flex-col overflow-hidden">
    <div className="flex-1 min-h-0 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <h3 className="font-medium text-slate-300">Team Discussion</h3>
      </div>
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary fallback={
          <div className="flex justify-center items-center h-full p-6">
            <div className="text-slate-400 text-center">
              <p className="mb-2">Component error occurred</p>
              <p className="text-sm">Try refreshing the page</p>
            </div>
          </div>
        }>
          <div className="w-full h-full overflow-hidden">
            <CometChatApp />
          </div>
        </ErrorBoundary>
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
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 h-[calc(100vh-220px)] p-6">
              <ErrorBoundary>
                <ResourceSharing workspace={workspace} />
              </ErrorBoundary>
            </div>
          )}
          
          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Team Members</h3>
              {members && members.length > 0 ? (
                <div className="space-y-4">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                          {member.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-slate-200 font-medium">{member.user.full_name || member.user.username}</div>
                          <div className="text-slate-500 text-sm capitalize">{member.role}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-8">
                  <p>No team members found</p>
                </div>
              )}
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
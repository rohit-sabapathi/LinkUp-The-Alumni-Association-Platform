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
  DocumentTextIcon,
  CalendarIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import ResourceSharing from '../resources/ResourceSharing';
import KanbanBoard from '../kanban/KanbanBoard';
import ProgressLogs from '../progress/ProgressLogs';
import ProjectGanttChart from '../gantt/ProjectGanttChart';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    { id: 'progress', label: 'Progress Logs', icon: DocumentTextIcon },
    { id: 'timeline', label: 'Timeline View', icon: CalendarIcon },
    { id: 'sharing', label: 'Resource Sharing', icon: ShareIcon },
    { id: 'team', label: 'Team Members', icon: UserGroupIcon }
  ];

  return (
    <div className="h-screen bg-slate-900 text-white flex overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-72'
        } group bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 ease-in-out relative hover:shadow-lg h-full`}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 ${
            isSidebarCollapsed ? '-right-4' : '-right-5'
          } bg-slate-700 border border-slate-600 rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-600 transition-all duration-200 z-10`}
        >
          {isSidebarCollapsed ? (
            <ChevronRightIcon className="w-6 h-6 text-slate-300" />
          ) : (
            <ChevronLeftIcon className="w-6 h-6 text-slate-300" />
          )}
        </button>

        {/* Workspace header */}
        <div className={`py-3 px-4 border-b border-slate-700 ${isSidebarCollapsed ? 'text-center' : ''}`}>
          {isSidebarCollapsed ? (
            <Link 
              to="/smartnest/projects" 
              className="w-8 h-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Back to Projects"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link to="/smartnest/projects" className="flex items-center text-slate-400 hover:text-slate-200 mb-2">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Projects
              </Link>
              <h1 className="text-lg font-semibold text-slate-200 truncate">
                {workspace.title}
              </h1>
              <p className="text-sm text-slate-400 truncate">
                {workspace.description}
              </p>
            </>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
                title={isSidebarCollapsed ? tab.label : undefined}
              >
                <tab.icon className={`w-5 h-5 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                <span className={isSidebarCollapsed ? 'hidden' : ''}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
        
        {/* User section */}
        <div className="py-2 px-4 border-t border-slate-700 bg-slate-800/80">
          <div className="flex items-center">
            {members && members.length > 0 ? (
              <>
                <div className={`w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`}>
                  {members[0].user.username.charAt(0).toUpperCase()}
                </div>
                {!isSidebarCollapsed && (
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {members[0].user.full_name || members[0].user.username}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">{members[0].role}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={`w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`}>
                  U
                </div>
                {!isSidebarCollapsed && (
                  <div>
                    <div className="text-sm font-medium text-slate-200">User</div>
                    <div className="text-xs text-slate-500">Project Member</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Tab header */}
        <div className="py-4 px-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold text-slate-200">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h2>
          <div>
            <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm">
              Invite Members
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col m-4">
                <div className="p-3 border-b border-slate-700 shrink-0">
                  <h3 className="font-medium text-slate-300">Team Discussion</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ErrorBoundary>
                    <div className="w-full h-full">
                      <CometChatApp />
                    </div>
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}
          
          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="h-full p-4">
              <div className="h-full bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                <ErrorBoundary>
                  <KanbanBoard workspaceSlug={workspaceSlug} />
                </ErrorBoundary>
              </div>
            </div>
          )}
          
          {/* Progress Logs Tab */}
          {activeTab === 'progress' && (
            <div className="h-full p-4">
              <div className="h-full bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                <ErrorBoundary>
                  <ProgressLogs workspaceSlug={workspaceSlug} />
                </ErrorBoundary>
              </div>
            </div>
          )}
          
          {/* Timeline Tab (Gantt Chart) */}
          {activeTab === 'timeline' && (
            <div className="h-full p-4">
              <div className="h-full bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                <ErrorBoundary>
                  <ProjectGanttChart workspaceSlug={workspaceSlug} />
                </ErrorBoundary>
              </div>
            </div>
          )}
          
          {/* Sharing Tab */}
          {activeTab === 'sharing' && (
            <div className="h-full p-4">
              <div className="h-full bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                <ErrorBoundary>
                  <ResourceSharing workspace={workspace} />
                </ErrorBoundary>
              </div>
            </div>
          )}
          
          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="h-full p-4 overflow-y-auto">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Team Members</h3>
                {members && members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-slate-700 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                            {member.user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200">{member.user.full_name || member.user.username}</div>
                            <div className="text-xs text-slate-500 capitalize">{member.role}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-6">
                    <p>No team members found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspace; 
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
  ChevronLeftIcon,
  XMarkIcon,
  UserPlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import ResourceSharing from '../resources/ResourceSharing';
import KanbanBoard from '../kanban/KanbanBoard';
import ProgressLogs from '../progress/ProgressLogs';
import ProjectGanttChart from '../gantt/ProjectGanttChart';
import { 
  fetchWorkspaceBySlug, 
  fetchProjectMembers, 
  fetchSuggestedUsers, 
  fetchAllUsers, 
  inviteUserToProject,
  fetchProjectById
} from '../../services/projectService';

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
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTab, setInviteTab] = useState('suggested');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitingUser, setInvitingUser] = useState(null);

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
  
  // Fetch suggested users and all users when invite modal is opened
  useEffect(() => {
    const fetchUsersForInvite = async () => {
      if (showInviteModal && project) {
        setInviteLoading(true);
        try {
          // Fetch suggested users (with matching skills)
          const suggestedData = await fetchSuggestedUsers(project);
          setSuggestedUsers(suggestedData);
          
          // Fetch all users
          const allUsersData = await fetchAllUsers(project);
          setAllUsers(allUsersData);
        } catch (error) {
          console.error('Error fetching users for invitation:', error);
          toast.error('Failed to load users for invitation');
        } finally {
          setInviteLoading(false);
        }
      }
    };
    
    fetchUsersForInvite();
  }, [showInviteModal, project]);

  const handleInviteUser = async (userId) => {
    setInvitingUser(userId);
    try {
      const response = await inviteUserToProject(project, {
        user_id: userId,
        message: `You're invited to join the project: ${workspace.title}`,
        role: 'member'
      });
      
      toast.success('Invitation sent successfully!');
      
      // Remove the invited user from the lists
      setSuggestedUsers(prev => prev.filter(user => user.id !== userId));
      setAllUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error.detail || 'Failed to send invitation');
    } finally {
      setInvitingUser(null);
    }
  };
  
  const openInviteModal = () => {
    setShowInviteModal(true);
    setInviteTab('suggested');
  };
  
  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteTab('suggested');
    setSuggestedUsers([]);
    setAllUsers([]);
  };

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
            <button 
              onClick={openInviteModal}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm flex items-center"
            >
              <UserPlusIcon className="w-4 h-4 mr-1" />
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
      
      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-slate-100">Invite Members</h3>
              <button 
                onClick={closeInviteModal}
                className="p-1 rounded-full hover:bg-slate-700"
              >
                <XMarkIcon className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            {/* Tabs Navigation */}
            <div className="border-b border-slate-700">
              <nav className="flex">
                <button
                  onClick={() => setInviteTab('suggested')}
                  className={`py-3 px-6 font-medium text-sm ${
                    inviteTab === 'suggested'
                      ? 'border-b-2 border-indigo-500 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Suggested Users
                </button>
                <button
                  onClick={() => setInviteTab('all')}
                  className={`py-3 px-6 font-medium text-sm ${
                    inviteTab === 'all'
                      ? 'border-b-2 border-indigo-500 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Users
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {inviteLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <>
                  {/* Suggested Users Tab */}
                  {inviteTab === 'suggested' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-slate-200">Users with Matching Skills</h4>
                        <span className="text-sm text-slate-400">
                          {suggestedUsers.length} user{suggestedUsers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {suggestedUsers.length > 0 ? (
                        <div className="space-y-3">
                          {suggestedUsers.map(user => (
                            <div 
                              key={user.id} 
                              className="flex justify-between items-center p-4 border border-slate-700 rounded-lg hover:bg-slate-700/30"
                            >
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                                  {user.profile_picture ? (
                                    <img 
                                      src={user.profile_picture} 
                                      alt={user.username} 
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    user.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="text-slate-200 font-medium">
                                    {user.full_name || user.username}
                                  </div>
                                  <div className="text-slate-500 text-sm">
                                    {user.matching_skill_count} skill{user.matching_skill_count !== 1 ? 's' : ''} match
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="flex mr-4">
                                  {user.matching_skills.slice(0, 3).map((skill, idx) => (
                                    <span 
                                      key={idx} 
                                      className="mr-1 bg-indigo-900/30 text-indigo-300 px-2 py-0.5 text-xs rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {user.matching_skills.length > 3 && (
                                    <span className="text-slate-500 text-xs">
                                      +{user.matching_skills.length - 3} more
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleInviteUser(user.id)}
                                  disabled={invitingUser === user.id}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
                                >
                                  {invitingUser === user.id ? (
                                    <span className="flex items-center">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                      Inviting...
                                    </span>
                                  ) : (
                                    <span>Invite</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-8">
                          <p>No suggested users found with matching skills.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* All Users Tab */}
                  {inviteTab === 'all' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-slate-200">All Available Users</h4>
                        <span className="text-sm text-slate-400">
                          {allUsers.length} user{allUsers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {allUsers.length > 0 ? (
                        <div className="space-y-3">
                          {allUsers.map(user => (
                            <div 
                              key={user.id} 
                              className="flex justify-between items-center p-4 border border-slate-700 rounded-lg hover:bg-slate-700/30"
                            >
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                                  {user.profile_picture ? (
                                    <img 
                                      src={user.profile_picture} 
                                      alt={user.username} 
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    user.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="text-slate-200 font-medium">
                                    {user.full_name || user.username}
                                  </div>
                                  {user.matching_skill_count > 0 ? (
                                    <div className="text-indigo-400 text-sm">
                                      {user.matching_skill_count} skill{user.matching_skill_count !== 1 ? 's' : ''} match
                                    </div>
                                  ) : (
                                    <div className="text-slate-500 text-sm">No matching skills</div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleInviteUser(user.id)}
                                disabled={invitingUser === user.id}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
                              >
                                {invitingUser === user.id ? (
                                  <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                    Inviting...
                                  </span>
                                ) : (
                                  <span>Invite</span>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-8">
                          <p>No users available to invite.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkspace; 
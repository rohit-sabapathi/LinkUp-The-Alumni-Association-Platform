import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  FolderIcon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon as XIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import SkillsInput from '../common/SkillsInput';
import { 
  fetchProjects, 
  createProject, 
  fetchProjectById,
  fetchUserProjects,
  fetchWorkspaceBySlug,
  createJoinRequest,
  fetchUserJoinRequests,
  fetchProjectJoinRequests,
  updateJoinRequestStatus,
  fetchUserWorkspaces,
  fetchUserInvitations,
  respondToInvitation,
  createFundingRequest,
  fetchFundingRequests,
  fetchMyFundingRequests,
  updateFundingStatus,
  contributeToFunding,
  closeFundingRequest,
  deleteFundingRequest,
  fetchCompletedFundingRequests
} from '../../services/projectService';
import { useAuth } from '../../contexts/AuthContext';

const ProjectCollaboration = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [isCurrentUserProject, setIsCurrentUserProject] = useState(false);
  
  // Join request states
  const [showJoinRequestForm, setShowJoinRequestForm] = useState(false);
  const [joinRequestFormData, setJoinRequestFormData] = useState({
    message: '',
    skills: [],
    expertise: '',
    motivation: ''
  });
  const [userJoinRequests, setUserJoinRequests] = useState([]);
  const [receivedJoinRequests, setReceivedJoinRequests] = useState([]);
  const [adminProjects, setAdminProjects] = useState([]);

  // Project form state
  const [projectForm, setProjectForm] = useState({
    title: '',
    shortDescription: '',
    detailedDescription: '',
    projectType: '',
    skills: [],
    maxTeamMembers: 3,
    openForCollaboration: true,
    githubLink: '',
    projectImage: null
  });

  // Add a new state variable for view mode
  const [projectViewMode, setProjectViewMode] = useState('cards');

  // Add a state variable to track if user has a pending join request
  const [hasPendingJoinRequest, setHasPendingJoinRequest] = useState(false);

  // Add this import at the top to get the current user ID from auth state
  const { user: currentUser } = useAuth();

  // Add state for project invitations
  const [invitations, setInvitations] = useState([]);
  const [respondingInvitation, setRespondingInvitation] = useState(null);

  // Add these new state variables after the existing state declarations
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [fundingForm, setFundingForm] = useState({
    projectId: '',
    title: '',
    description: '',
    amount: '',
    qrCode: null
  });
  const [fundingRequests, setFundingRequests] = useState([]);
  const [selectedFunding, setSelectedFunding] = useState(null);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [contributionForm, setContributionForm] = useState({
    amount: '',
    note: ''
  });
  const [completedFundingRequests, setCompletedFundingRequests] = useState([]);

  // Fetch projects on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all projects for reference
        const projectsData = await fetchProjects();
        setProjects(projectsData);
        
        // Fetch user's projects (both created and participated)
        const userProjectsData = await fetchUserProjects();
        console.log('User projects data:', userProjectsData);
        
        // Get the current user ID
        const currentUserId = currentUser?.id || localStorage.getItem('user_id');
        
        // Process projects to include both created and member projects
        const detailedUserProjects = [];
        for (const project of userProjectsData) {
          try {
            const projectDetails = await fetchProjectById(project.id);
            detailedUserProjects.push(projectDetails);
          } catch (error) {
            console.error(`Error fetching details for project ${project.id}:`, error);
            detailedUserProjects.push(project);
          }
        }
        
        console.log('Detailed user projects:', detailedUserProjects);
        setUserProjects(detailedUserProjects);

        // Extract workspaces directly from the projects
        const extractedWorkspaces = [];
        
        for (const project of detailedUserProjects) {
          console.log(`Checking project ${project.id} for workspace:`, project);
          
          // Check if the user is a creator or member of this project
          const isCreator = project.creator && project.creator.id === currentUserId;
          const isMember = project.members && project.members.some(member => 
            member.user.id === currentUserId
          );
          
          // Only include workspaces for projects where user is creator or member
          if ((isCreator || isMember) && project.workspace) {
            const workspace = {
              id: project.workspace.id,
              title: project.workspace.title || project.title,
              description: project.workspace.description || project.short_description,
              slug: project.workspace.slug,
              project_id: project.id,
              created_at: project.workspace.created_at || project.created_at
            };
            console.log('Extracted workspace:', workspace);
            extractedWorkspaces.push(workspace);
          }
        }
        
        console.log('Final workspaces:', extractedWorkspaces);
        setWorkspaces(extractedWorkspaces);
        
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentUser]);

  // Fetch user's join requests
  useEffect(() => {
    if (activeTab === 'request-status') {
      const fetchJoinRequests = async () => {
        setLoading(true);
        try {
          // Fetch user's join requests (outgoing)
          const userRequests = await fetchUserJoinRequests();
          setUserJoinRequests(userRequests);
          
          // Find projects where user is admin
          const adminProjectsList = userProjects.filter(project => 
            project.creator && project.creator.id === localStorage.getItem('user_id')
          );
          
          setAdminProjects(adminProjectsList);
          
          // Fetch incoming join requests for admin projects
          const incomingRequests = [];
          for (const project of adminProjectsList) {
            try {
              const projectRequests = await fetchProjectJoinRequests(project.id);
              incomingRequests.push(...projectRequests.map(req => ({
                ...req,
                project_data: project
              })));
            } catch (error) {
              console.error(`Error fetching requests for project ${project.id}:`, error);
            }
          }
          
          setReceivedJoinRequests(incomingRequests);
        } catch (error) {
          console.error('Error fetching join requests:', error);
          toast.error('Failed to load join requests');
        } finally {
          setLoading(false);
        }
      };
      
      fetchJoinRequests();
    }
  }, [activeTab, userProjects]);

  // Define refreshJoinRequestData with useCallback to prevent dependency issues
  const refreshJoinRequestData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Fetch user's join requests (outgoing)
      const userRequests = await fetchUserJoinRequests();
      setUserJoinRequests(userRequests);
      
      // Get the current user ID
      const currentUserId = currentUser?.id || localStorage.getItem('user_id');
      console.log("CURRENT USER ID:", currentUserId);
      
      // IMPORTANT: Log all projects to debug creator identification
      console.log("ALL USER PROJECTS:", userProjects.map(p => ({
        id: p.id,
        title: p.title,
        creatorId: p.creator?.id,
        creatorName: p.creator?.username
      })));
      
      // Find projects where the current user is the creator
      const createdProjects = [];
      for (const project of userProjects) {
        const projectCreatorId = project.creator?.id;
        console.log(`Checking project ${project.id} (${project.title}) - Creator: ${projectCreatorId}, Current: ${currentUserId}`);
        
        if (projectCreatorId === currentUserId) {
          console.log(`✅ User is creator of project: ${project.title}`);
          createdProjects.push(project);
        } else {
          console.log(`❌ User is NOT creator of project: ${project.title}`);
        }
      }
      
      console.log("CREATED PROJECTS:", createdProjects.map(p => p.title));
      setAdminProjects(createdProjects);
      
      // Directly fetch project requests without filtering
      try {
        let allIncomingRequests = [];
        
        for (const project of createdProjects) {
          console.log(`🔍 Fetching requests for project ${project.id} (${project.title})`);
          
          // Make direct API call to fetch join requests for this project
          try {
            const projectRequests = await fetchProjectJoinRequests(project.id);
            console.log(`📨 Received ${projectRequests.length} requests for project ${project.title}`);
            
            if (projectRequests.length > 0) {
              allIncomingRequests = [
                ...allIncomingRequests,
                ...projectRequests.map(req => ({
                  ...req,
                  project_data: project
                }))
              ];
            }
          } catch (reqError) {
            console.error(`Error fetching requests for project ${project.id}:`, reqError);
          }
        }
        
        console.log("TOTAL INCOMING REQUESTS:", allIncomingRequests.length);
        console.log("REQUEST DETAILS:", allIncomingRequests);
        
        // Update received join requests
        setReceivedJoinRequests(allIncomingRequests);
      } catch (error) {
        console.error('Error fetching join requests:', error);
      }
    } catch (error) {
      console.error('Error refreshing join requests:', error);
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  }, [userProjects, loading, currentUser]);

  // Update the useEffect for request-status tab
  // Remove the old useEffect that has activeTab and userProjects dependencies
  // and replace with this
  useEffect(() => {
    if (activeTab === 'request-status') {
      // Only load join request data if we have user projects data
      if (userProjects.length > 0) {
        refreshJoinRequestData();
      }
    }
  }, [activeTab, userProjects.length]); // Only depend on length to avoid excessive rerenders

  // Fetch user's invitations
  useEffect(() => {
    if (activeTab === 'request-status') {
      const fetchInvitationsData = async () => {
        setLoading(true);
        try {
          const invitationsData = await fetchUserInvitations();
          setInvitations(invitationsData);
        } catch (error) {
          console.error('Error fetching invitations:', error);
          toast.error('Failed to load project invitations');
        } finally {
          setLoading(false);
        }
      };
      
      fetchInvitationsData();
    }
  }, [activeTab]);

  // Update the useEffect for funding tab
  useEffect(() => {
    if (activeTab === 'funding') {
      const loadFundingData = async () => {
        setLoading(true);
        try {
          const [allFunding, myFunding, completedFunding] = await Promise.all([
            fetchFundingRequests(),
            fetchMyFundingRequests(),
            fetchCompletedFundingRequests()
          ]);
          setFundingRequests(allFunding);
          setCompletedFundingRequests(completedFunding);
        } catch (error) {
          console.error('Error fetching funding requests:', error);
          toast.error('Failed to load funding requests');
        } finally {
          setLoading(false);
        }
      };
      
      loadFundingData();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'workspaces', label: 'Workspaces' },
    { id: 'request-status', label: 'Request Status' },
    { id: 'funding', label: 'Funding' }
  ];

  const projectTypes = [
    'Startup',
    'Research',
    'Social Impact',
    'Open Source',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProjectForm({
      ...projectForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSkillsChange = (newSkills) => {
    setProjectForm({
      ...projectForm,
      skills: newSkills
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProjectForm({
        ...projectForm,
        projectImage: e.target.files[0]
      });
    }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      console.log('Submitting project form data:', projectForm);
      const newProject = await createProject(projectForm);
      console.log('Project created successfully:', newProject);
      
      // Update projects list
      setProjects(prevProjects => [...prevProjects, newProject]);
      
      // Fetch the full project details to ensure we have the workspace
      let fullProjectDetails = newProject;
      try {
        fullProjectDetails = await fetchProjectById(newProject.id);
        console.log('Fetched full project details:', fullProjectDetails);
      } catch (error) {
        console.error('Error fetching full project details:', error);
      }
      
      // Add the new project to user projects
      setUserProjects(prevProjects => [...prevProjects, fullProjectDetails]);
      
      // If workspace exists on the project, add it to workspaces
      if (fullProjectDetails.workspace) {
        const newWorkspace = {
          id: fullProjectDetails.workspace.id,
          title: fullProjectDetails.workspace.title || fullProjectDetails.title,
          description: fullProjectDetails.workspace.description || fullProjectDetails.short_description,
          slug: fullProjectDetails.workspace.slug,
          project_id: fullProjectDetails.id,
          created_at: fullProjectDetails.workspace.created_at || fullProjectDetails.created_at
        };
        console.log('Adding new workspace to list:', newWorkspace);
        setWorkspaces(prevWorkspaces => [...prevWorkspaces, newWorkspace]);
      }
      
      // Reset form and hide it
      setProjectForm({
        title: '',
        shortDescription: '',
        detailedDescription: '',
        projectType: '',
        skills: [],
        maxTeamMembers: 3,
        openForCollaboration: true,
        githubLink: '',
        projectImage: null
      });
      
      setShowProjectForm(false);
      toast.success('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const viewProjectDetails = async (project) => {
    try {
      setLoading(true);
      // Check if project id exists before making the API call
      if (!project || !project.id) {
        console.error('Invalid project data:', project);
        toast.error('Invalid project data');
        setLoading(false);
        return;
      }
      
      // Fetch full project details
      const projectDetails = await fetchProjectById(project.id);
      setCurrentProject(projectDetails);
      
      // Get the current user ID
      const currentUserId = currentUser?.id || localStorage.getItem('user_id');
      
      // Check if the current user is the creator of the project
      const creatorId = projectDetails.creator?.id || null;
      const userCreatedProject = (creatorId === currentUserId);
      
      // Check if the user is a member of the project
      const isProjectMember = projectDetails.members && projectDetails.members.some(
        member => member.user.id === currentUserId
      );
      
      console.log("Project creator ID:", creatorId);
      console.log("Current user ID:", currentUserId);
      console.log("User created project:", userCreatedProject);
      console.log("User is member:", isProjectMember);
      
      setIsCurrentUserProject(userCreatedProject || isProjectMember);
      
      // Check if the user has already requested to join this project
      try {
        const userRequests = await fetchUserJoinRequests();
        const hasExistingRequest = userRequests.some(
          req => req.project === project.id && req.status === 'pending'
        );
        setHasPendingJoinRequest(hasExistingRequest);
      } catch (error) {
        console.error('Error checking join requests:', error);
      }
      
      setShowProjectDetails(true);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const closeProjectDetails = () => {
    setCurrentProject(null);
    setShowProjectDetails(false);
  };
  
  const openWorkspace = (workspaceSlug) => {
    // Navigate to workspace using the slug
    navigate(`/workspace/${workspaceSlug}`);
  };

  // Handle join request form change
  const handleJoinRequestInputChange = (e) => {
    const { name, value } = e.target;
    setJoinRequestFormData({
      ...joinRequestFormData,
      [name]: value
    });
  };
  
  // Handle skills change for join request form
  const handleJoinRequestSkillsChange = (newSkills) => {
    setJoinRequestFormData({
      ...joinRequestFormData,
      skills: newSkills
    });
  };
  
  // Submit join request
  const submitJoinRequest = async (e) => {
    e.preventDefault();
    
    if (!currentProject) {
      toast.error('No project selected for collaboration request');
      return;
    }
    
    setLoading(true);
    try {
      const response = await createJoinRequest(currentProject.id, joinRequestFormData);
      
      toast.success('Collaboration request submitted successfully!');
      setShowJoinRequestForm(false);
      setJoinRequestFormData({
        message: '',
        skills: [],
        expertise: '',
        motivation: ''
      });
      
      // Update user join requests
      setUserJoinRequests(prev => [...prev, response]);
      
      // Set the hasPendingJoinRequest flag to true
      setHasPendingJoinRequest(true);
      
      // Refresh join request data
      refreshJoinRequestData();
    } catch (error) {
      console.error('Error submitting join request:', error);
      toast.error(error.detail || 'Failed to submit collaboration request');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle request status update (accept/reject)
  const handleRequestStatusUpdate = async (requestId, newStatus) => {
    setLoading(true);
    try {
      await updateJoinRequestStatus(requestId, newStatus);
      
      // Update received join requests list
      setReceivedJoinRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus } 
            : req
        )
      );
      
      // Also refresh the data to ensure everything is in sync
      await refreshJoinRequestData();
      
      toast.success(`Request ${newStatus === 'accepted' ? 'accepted' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setLoading(false);
    }
  };
  
  // Request to collaborate
  const requestCollaboration = (project) => {
    setCurrentProject(project);
    setShowJoinRequestForm(true);
    setJoinRequestFormData({
      message: '',
      skills: [],
      expertise: '',
      motivation: ''
    });
  };

  // Handle responding to an invitation
  const handleInvitationResponse = async (invitationId, status) => {
    setRespondingInvitation(invitationId);
    try {
      await respondToInvitation(invitationId, status);
      
      // Update the status in the UI
      setInvitations(prevInvitations => 
        prevInvitations.map(invitation => 
          invitation.id === invitationId 
            ? { ...invitation, status } 
            : invitation
        )
      );
      
      // If accepted, refresh the workspaces
      if (status === 'accepted') {
        toast.success('Invitation accepted! You are now a member of the project.');
        // Refresh the user projects and workspaces
        try {
          const userProjectsData = await fetchUserProjects();
          setUserProjects(userProjectsData);
          
          // Extract workspaces from the projects
          const workspacePromises = userProjectsData.map(async project => {
            if (project.workspace) {
              return {
                id: project.workspace.id,
                title: project.workspace.title || project.title,
                description: project.workspace.description || project.short_description,
                slug: project.workspace.slug,
                project_id: project.id,
                created_at: project.workspace.created_at || project.created_at
              };
            }
            return null;
          });
          
          const workspacesData = (await Promise.all(workspacePromises)).filter(Boolean);
          setWorkspaces(workspacesData);
        } catch (error) {
          console.error('Error refreshing data after accepting invitation:', error);
        }
      } else {
        toast.success('Invitation declined.');
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to process your response');
    } finally {
      setRespondingInvitation(null);
    }
  };

  // Add this new function after the existing functions
  const handleFundingInputChange = (e) => {
    const { name, value } = e.target;
    setFundingForm({
      ...fundingForm,
      [name]: value
    });
  };

  const handleQRCodeChange = (e) => {
    if (e.target.files[0]) {
      setFundingForm({
        ...fundingForm,
        qrCode: e.target.files[0]
      });
    }
  };

  const handleSubmitFunding = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Create FormData object
      const formData = new FormData();
      formData.append('project', fundingForm.projectId);
      formData.append('title', fundingForm.title);
      formData.append('description', fundingForm.description);
      formData.append('amount', fundingForm.amount.toString());
      if (fundingForm.qrCode) {
        formData.append('qr_code', fundingForm.qrCode);
      }

      const newFundingRequest = await createFundingRequest(formData);
      setFundingRequests(prev => [...prev, newFundingRequest]);
      setShowFundingForm(false);
      setFundingForm({
        projectId: '',
        title: '',
        description: '',
        amount: '',
        qrCode: null
      });
      toast.success('Funding request created successfully!');
    } catch (error) {
      console.error('Error creating funding request:', error);
      toast.error(error.detail || 'Failed to create funding request');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await contributeToFunding(selectedFunding.id, contributionForm);
      // Refresh funding requests
      const [allFunding, myFunding] = await Promise.all([
        fetchFundingRequests(),
        fetchMyFundingRequests()
      ]);
      setFundingRequests(allFunding);
      setShowContributionForm(false);
      setSelectedFunding(null);
      setContributionForm({ amount: '', note: '' });
      toast.success('Contribution successful!');
    } catch (error) {
      console.error('Error contributing:', error);
      toast.error(error.detail || 'Failed to contribute');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseFunding = async (fundingId) => {
    try {
      setLoading(true);
      await closeFundingRequest(fundingId);
      // Refresh funding data
      const [allFunding, completedFunding] = await Promise.all([
        fetchFundingRequests(),
        fetchCompletedFundingRequests()
      ]);
      setFundingRequests(allFunding);
      setCompletedFundingRequests(completedFunding);
      toast.success('Funding request closed successfully');
    } catch (error) {
      console.error('Error closing funding request:', error);
      toast.error('Failed to close funding request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFunding = async (fundingId) => {
    if (!window.confirm('Are you sure you want to delete this funding request?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteFundingRequest(fundingId);
      // Refresh funding data
      const [allFunding, completedFunding] = await Promise.all([
        fetchFundingRequests(),
        fetchCompletedFundingRequests()
      ]);
      setFundingRequests(allFunding);
      setCompletedFundingRequests(completedFunding);
      toast.success('Funding request deleted successfully');
    } catch (error) {
      console.error('Error deleting funding request:', error);
      toast.error('Failed to delete funding request');
    } finally {
      setLoading(false);
    }
  };

  // Render project details view
  if (showProjectDetails && currentProject) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={closeProjectDetails}
            className="mr-4 p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="text-2xl font-bold text-slate-100">Project Details</h1>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left column - Project image and basic info */}
            <div className="md:col-span-1 space-y-6">
              {currentProject.project_image ? (
                <div className="rounded-lg overflow-hidden border border-slate-700">
                  <img 
                    src={currentProject.project_image} 
                    alt={currentProject.title} 
                    className="w-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-slate-700/30 border border-slate-700 flex items-center justify-center h-48">
                  <FolderIcon className="w-16 h-16 text-slate-500" />
                </div>
              )}
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Project Type</h3>
                <p className="text-indigo-400 text-md font-medium">{currentProject.project_type}</p>
              </div>
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Created On</h3>
                <p className="text-slate-300">{new Date(currentProject.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Max Team Members</h3>
                <p className="text-slate-300">{currentProject.max_team_members}</p>
              </div>
              
              {currentProject.github_link && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">GitHub Repository</h3>
                  <a 
                    href={currentProject.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {currentProject.github_link}
                  </a>
                </div>
              )}
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Open for Collaboration</h3>
                <p className="text-slate-300">{currentProject.open_for_collaboration ? 'Yes' : 'No'}</p>
              </div>
              
              {/* Workspace or Collaboration button */}
              {isCurrentUserProject && currentProject.workspace && (
                <button
                  onClick={() => openWorkspace(currentProject.workspace.slug)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <span>Open Workspace</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </button>
              )}
              
              {!isCurrentUserProject && currentProject.open_for_collaboration && !hasPendingJoinRequest && (
                <button
                  onClick={() => requestCollaboration(currentProject)}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <span>Request to Collaborate</span>
                  <UserGroupIcon className="w-4 h-4" />
                </button>
              )}

              {!isCurrentUserProject && currentProject.open_for_collaboration && hasPendingJoinRequest && (
                <div className="w-full py-3 px-4 bg-yellow-600/40 text-yellow-300 rounded-lg flex items-center justify-center space-x-2">
                  <span>Request Pending</span>
                </div>
              )}

              {!isCurrentUserProject && !currentProject.open_for_collaboration && (
                <div className="w-full py-3 px-4 bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center space-x-2">
                  <span>Closed for Collaboration</span>
                </div>
              )}
            </div>
            
            {/* Right column - Project title and details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">{currentProject.title}</h2>
                <p className="text-slate-400">{currentProject.short_description}</p>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Detailed Description</h3>
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-300 whitespace-pre-line">{currentProject.detailed_description}</p>
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProject.skills && currentProject.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-indigo-900/30 text-indigo-300 px-3 py-1.5 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {(!currentProject.skills || currentProject.skills.length === 0) && (
                    <p className="text-slate-500">No specific skills listed</p>
                  )}
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Team</h3>
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                  {currentProject.members && currentProject.members.length > 0 ? (
                    <div className="space-y-4">
                      {currentProject.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between">
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
                    <p className="text-slate-400 text-center">No team members yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Request Form Modal */}
        {showJoinRequestForm && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-slate-100">Request to Collaborate</h3>
                <button 
                  onClick={() => setShowJoinRequestForm(false)}
                  className="p-1 rounded-full hover:bg-slate-700"
                >
                  <XMarkIcon className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={submitJoinRequest} className="p-6 space-y-6">
                <div>
                  <p className="text-slate-300 mb-4">
                    You're requesting to join <span className="font-medium text-indigo-400">{currentProject.title}</span>
                  </p>
                </div>
                
                <div>
                  <label htmlFor="motivation" className="block text-sm font-medium text-slate-300 mb-1">
                    Why do you want to join this project? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    value={joinRequestFormData.motivation}
                    onChange={handleJoinRequestInputChange}
                    required
                    rows="3"
                    placeholder="Explain why you're interested in this project"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="expertise" className="block text-sm font-medium text-slate-300 mb-1">
                    What expertise can you bring? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="expertise"
                    name="expertise"
                    value={joinRequestFormData.expertise}
                    onChange={handleJoinRequestInputChange}
                    required
                    rows="3"
                    placeholder="Describe your relevant experience and skills"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-slate-300 mb-1">
                    Relevant Skills
                  </label>
                  <SkillsInput
                    selectedSkills={joinRequestFormData.skills}
                    onSkillsChange={handleJoinRequestSkillsChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">
                    Additional Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={joinRequestFormData.message}
                    onChange={handleJoinRequestInputChange}
                    rows="2"
                    placeholder="Any additional information you'd like to share"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinRequestForm(false)}
                    className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular Project Collaboration view
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-100 mb-8 text-center">Project Collaboration</h1>
      
      {/* Tabs Navigation */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex justify-center space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 inline-flex items-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/50 rounded-xl p-8">
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* All Projects Tab */}
        {!loading && activeTab === 'projects' && (
          <div className="space-y-8">
            {!showProjectForm && (
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setShowProjectForm(true)}
                  className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create New Project
                </button>
                <button 
                  onClick={() => setProjectViewMode('list')}
                  className="flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
                >
                  <FolderIcon className="w-5 h-5 mr-2" />
                  View All Projects
                </button>
              </div>
            )}

            {/* Project Form */}
            {showProjectForm && (
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-100">Create New Project</h2>
                  <button 
                    onClick={() => setShowProjectForm(false)}
                    className="p-1 hover:bg-slate-700 rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmitProject} className="space-y-6">
                  {/* Project Basics */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-indigo-400 border-b border-slate-700 pb-2">1. Project Basics</h3>
                    
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                        Project Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={projectForm.title}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., AI Resume Screener, Smart Irrigation System"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="shortDescription" className="block text-sm font-medium text-slate-300 mb-1">
                        Short Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="shortDescription"
                        name="shortDescription"
                        value={projectForm.shortDescription}
                        onChange={handleInputChange}
                        required
                        placeholder="A 1-2 line summary that shows on the project card"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="detailedDescription" className="block text-sm font-medium text-slate-300 mb-1">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="detailedDescription"
                        name="detailedDescription"
                        value={projectForm.detailedDescription}
                        onChange={handleInputChange}
                        required
                        rows="4"
                        placeholder="Full idea, problem being solved, goals, etc."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>

                  {/* Project Type & Skills */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-indigo-400 border-b border-slate-700 pb-2">2. Project Type & Skills</h3>
                    
                    <div>
                      <label htmlFor="projectType" className="block text-sm font-medium text-slate-300 mb-1">
                        Project Type / Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="projectType"
                        name="projectType"
                        value={projectForm.projectType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="" disabled>Select project type</option>
                        {projectTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="skills" className="block text-sm font-medium text-slate-300 mb-1">
                        Skills Required
                      </label>
                      <SkillsInput
                        selectedSkills={projectForm.skills}
                        onSkillsChange={handleSkillsChange}
                      />
                    </div>
                  </div>

                  {/* Team & Collaboration */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-indigo-400 border-b border-slate-700 pb-2">3. Team & Collaboration</h3>
                    
                    <div>
                      <label htmlFor="maxTeamMembers" className="block text-sm font-medium text-slate-300 mb-1">
                        Max Team Members
                      </label>
                      <input
                        type="number"
                        id="maxTeamMembers"
                        name="maxTeamMembers"
                        value={projectForm.maxTeamMembers}
                        onChange={handleInputChange}
                        min="1"
                        max="20"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="openForCollaboration"
                        name="openForCollaboration"
                        checked={projectForm.openForCollaboration}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-600 bg-slate-800"
                      />
                      <label htmlFor="openForCollaboration" className="ml-2 text-sm font-medium text-slate-300">
                        Open for Collaboration?
                      </label>
                    </div>

                    <div>
                      <label htmlFor="githubLink" className="block text-sm font-medium text-slate-300 mb-1">
                        GitHub Link (optional)
                      </label>
                      <input
                        type="url"
                        id="githubLink"
                        name="githubLink"
                        value={projectForm.githubLink}
                        onChange={handleInputChange}
                        placeholder="https://github.com/yourusername/project"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="projectImage" className="block text-sm font-medium text-slate-300 mb-1">
                        Upload Project Image / Banner (optional)
                      </label>
                      <input
                        type="file"
                        id="projectImage"
                        name="projectImage"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProjectForm(false)}
                      className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Projects List */}
            {!loading && activeTab === 'projects' && !showProjectForm && (
              <>
                {/* List View Mode */}
                {projectViewMode === 'list' && (
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-slate-100">All Projects</h2>
                      <button 
                        onClick={() => setProjectViewMode('cards')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      >
                        Back to Your Projects
                      </button>
                    </div>
                    
                    <div className="overflow-hidden bg-slate-800/30 rounded-xl border border-slate-700">
                      <div className="grid grid-cols-12 bg-slate-800 p-4 border-b border-slate-700 text-sm font-medium text-slate-300">
                        <div className="col-span-4">Project Name</div>
                        <div className="col-span-3">Type</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-2">Open</div>
                        <div className="col-span-1">Action</div>
                      </div>
                      
                      <div className="divide-y divide-slate-700">
                {projects.map(project => (
                          <div 
                            key={project.id} 
                            className="grid grid-cols-12 p-4 hover:bg-slate-700/30 transition-colors"
                          >
                            <div className="col-span-4 font-medium text-slate-200 truncate">{project.title}</div>
                            <div className="col-span-3 text-indigo-400">{project.project_type}</div>
                            <div className="col-span-2 text-slate-400 text-sm">
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                            <div className="col-span-2">
                              {project.open_for_collaboration ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                                  Open
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400">
                                  Closed
                                </span>
                              )}
                            </div>
                            <div className="col-span-1 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewProjectDetails(project);
                                }}
                                className="text-indigo-400 hover:text-indigo-300"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {projects.length === 0 && (
                      <div className="text-center text-slate-400 py-12">
                        No projects available.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cards View Mode - Show user's created projects */}
                {projectViewMode === 'cards' && (
                  <div>
                    {userProjects.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                        {userProjects.map(project => (
                  <div
                    key={project.id}
                    className="bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition-all duration-200 cursor-pointer"
                    onClick={() => viewProjectDetails(project)}
                  >
                    {project.project_image && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={project.project_image} 
                          alt={project.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-slate-200 mb-2">{project.title}</h3>
                      <p className="text-slate-400 text-sm mb-3">{project.short_description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills && project.skills.slice(0, 3).map((skill, index) => (
                          <span 
                            key={index} 
                            className="bg-indigo-900/30 text-indigo-300 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skills && project.skills.length > 3 && (
                          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded">
                            +{project.skills.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewProjectDetails(project);
                          }}
                          className="text-indigo-400 text-sm font-medium hover:text-indigo-300 flex items-center"
                        >
                          View Details
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                    ) : (
                      <div className="text-center text-slate-400 py-8">
                        <p>You haven't created any projects yet.</p>
                        <button 
                          onClick={() => setShowProjectForm(true)}
                          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Create Your First Project
                        </button>
              </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {!loading && projects.length === 0 && !showProjectForm && (
              <div className="text-center text-slate-400">
                No projects available. Create one to get started!
              </div>
            )}
          </div>
        )}

        {/* Workspaces Tab */}
        {!loading && activeTab === 'workspaces' && (
          <div>
            {workspaces && workspaces.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map(workspace => (
                  <div
                    key={workspace.id}
                    className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition-all duration-200 cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">{workspace.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{workspace.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">
                        {new Date(workspace.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => openWorkspace(workspace.slug)}
                        className="text-indigo-400 text-sm font-medium hover:text-indigo-300 flex items-center"
                      >
                        Open Workspace
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <p>You don't have any workspaces yet. Create a project to get started!</p>
                <button 
                  onClick={() => {
                    setActiveTab('projects');
                    setShowProjectForm(true);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        )}

        {/* Request Status Tab */}
        {!loading && activeTab === 'request-status' && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {/* Project Invitations */}
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-4">Project Invitations</h2>
                  
                  {invitations.length > 0 ? (
                    <div className="space-y-4">
                      {invitations.map(invitation => (
                        <div 
                          key={invitation.id} 
                          className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden"
                        >
                          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 text-sm">Invitation to join</span>
                              <h3 className="text-lg font-medium text-slate-200">{invitation.project_data.title}</h3>
                            </div>
                            <div>
                              {invitation.status === 'pending' ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
                                    disabled={respondingInvitation === invitation.id}
                                  >
                                    {respondingInvitation === invitation.id ? (
                                      <span className="flex items-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                        Processing...
                                      </span>
                                    ) : (
                                      <>
                                        <CheckIcon className="w-4 h-4 mr-1" />
                                        Accept
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleInvitationResponse(invitation.id, 'rejected')}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
                                    disabled={respondingInvitation === invitation.id}
                                  >
                                    {respondingInvitation === invitation.id ? (
                                      <span className="flex items-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                        Processing...
                                      </span>
                                    ) : (
                                      <>
                                        <XIcon className="w-4 h-4 mr-1" />
                                        Decline
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  invitation.status === 'accepted' 
                                    ? 'bg-green-900/30 text-green-400' 
                                    : 'bg-red-900/30 text-red-400'
                                }`}>
                                  {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-4 grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center mb-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                                  {invitation.invited_by.profile_picture ? (
                                    <img 
                                      src={invitation.invited_by.profile_picture}
                                      alt={invitation.invited_by.username}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    invitation.invited_by.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="text-slate-200 font-medium">
                                    {invitation.invited_by.full_name || invitation.invited_by.username}
                                  </div>
                                  <div className="text-slate-500 text-sm">
                                    Invited you {new Date(invitation.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              
                              {invitation.message && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-slate-400 mb-1">Message</h4>
                                  <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg text-sm">
                                    {invitation.message}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-slate-400 mb-1">Project Type</h4>
                                <p className="text-indigo-400 font-medium">
                                  {invitation.project_data.project_type}
                                </p>
                              </div>
                              
                              {invitation.project_data.skills && invitation.project_data.skills.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-slate-400 mb-1">Project Skills</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {invitation.project_data.skills.map((skill, idx) => (
                                      <span 
                                        key={idx} 
                                        className="bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded-full text-xs"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-400 mb-1">Your Role</h4>
                                <p className="text-slate-300 capitalize">
                                  {invitation.role}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 border-t border-slate-700">
                            <button
                              onClick={() => {
                                const project = {
                                  id: invitation.project
                                };
                                viewProjectDetails(project);
                              }}
                              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                            >
                              <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1" />
                              View Project Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-8 text-center">
                      <p className="text-slate-400">You don't have any project invitations.</p>
                    </div>
                  )}
                </div>
                
                {/* Requests Sent */}
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-4">Your Collaboration Requests</h2>
                  
                  {userJoinRequests.length > 0 ? (
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                      <div className="grid grid-cols-12 bg-slate-800 p-4 border-b border-slate-700 text-sm font-medium text-slate-300">
                        <div className="col-span-3">Project</div>
                        <div className="col-span-3">Requested On</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-3">Action</div>
                      </div>
                      
                      <div className="divide-y divide-slate-700">
                        {userJoinRequests.map(request => (
                          <div key={request.id} className="grid grid-cols-12 p-4 items-center">
                            <div className="col-span-3 font-medium text-slate-200">{request.project_title}</div>
                            <div className="col-span-3 text-slate-400 text-sm">
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                            <div className="col-span-3">
                              {request.status === 'pending' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400">
                                  Pending
                                </span>
                              )}
                              {request.status === 'accepted' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                                  Accepted
                                </span>
                              )}
                              {request.status === 'rejected' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400">
                                  Declined
                                </span>
                              )}
                            </div>
                            <div className="col-span-3">
                              <button
                                onClick={() => {
                                  // Find and view the project details
                                  const project = projects.find(p => p.id === request.project);
                                  if (project) {
                                    viewProjectDetails(project);
                                  }
                                }}
                                className="text-indigo-400 hover:text-indigo-300 text-sm"
                              >
                                View Project
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-8 text-center">
                      <p className="text-slate-400">You haven't sent any collaboration requests yet.</p>
                    </div>
                  )}
                </div>
                
                {/* Requests Received (for project admins) */}
                {adminProjects.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 mb-4">Collaboration Requests Received</h2>
                    
                    {receivedJoinRequests.length > 0 ? (
                      <div className="space-y-6">
                        {receivedJoinRequests.map(request => (
                          <div key={request.id} className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                            {/* ... existing code ... */}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-8 text-center">
                        <p className="text-slate-400">You haven't received any collaboration requests yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Funding Tab */}
        {!loading && activeTab === 'funding' && (
          <div className="space-y-6">
            {!showFundingForm && (
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowFundingForm(true)}
                  className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Funding Request
                </button>
              </div>
            )}

            {showFundingForm ? (
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-100">Create Funding Request</h2>
                  <button 
                    onClick={() => setShowFundingForm(false)}
                    className="p-1 hover:bg-slate-700 rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmitFunding} className="space-y-6">
                  <div>
                    <label htmlFor="projectId" className="block text-sm font-medium text-slate-300 mb-1">
                      Select Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="projectId"
                      name="projectId"
                      value={fundingForm.projectId}
                      onChange={handleFundingInputChange}
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="" disabled>Select a project</option>
                      {userProjects.map(project => (
                        <option key={project.id} value={project.id}>{project.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                      Funding Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={fundingForm.title}
                      onChange={handleFundingInputChange}
                      required
                      placeholder="e.g., Initial Development Funding"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={fundingForm.description}
                      onChange={handleFundingInputChange}
                      required
                      rows="4"
                      placeholder="Describe why you need funding and how it will be used"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">
                      Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={fundingForm.amount}
                      onChange={handleFundingInputChange}
                      required
                      min="1"
                      placeholder="Enter amount in Rupees"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="qrCode" className="block text-sm font-medium text-slate-300 mb-1">
                      Payment QR Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      id="qrCode"
                      name="qrCode"
                      onChange={handleQRCodeChange}
                      required
                      accept="image/*"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-slate-400">Upload your payment QR code image</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFundingForm(false)}
                      className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Funding Request'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-100">Active Funding Requests</h2>
                
                {fundingRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fundingRequests.map((funding) => (
                      <div
                        key={funding.id}
                        className="bg-slate-900/50 rounded-xl border border-slate-700 p-6 cursor-pointer hover:border-slate-500 transition-all duration-200"
                        onClick={() => setSelectedFunding(funding)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-slate-200">{funding.title}</h3>
                          {funding.project?.creator?.id === currentUser?.id && (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseFunding(funding.id);
                                }}
                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                              >
                                Close
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFunding(funding.id);
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-slate-400">Amount: ₹{funding.amount}</span>
                          <span className="text-slate-400">Collected: ₹{funding.collected_amount}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${funding.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-slate-400">
                          {(funding.progress_percentage || 0).toFixed(1)}% funded
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <p>No active funding requests available.</p>
                    <button 
                      onClick={() => setShowFundingForm(true)}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Create Funding Request
                    </button>
                  </div>
                )}

                {/* Completed Funding Requests Section */}
                {completedFundingRequests.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-xl font-bold text-slate-100 mb-6">Completed Funding Requests</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedFundingRequests.map((funding) => (
                        <div
                          key={funding.id}
                          className="bg-slate-900/50 rounded-xl border border-slate-700 p-6"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-slate-200">{funding.title}</h3>
                            <span className={`px-2 py-1 rounded text-sm ${
                              funding.status === 'completed' 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-yellow-900/30 text-yellow-400'
                            }`}>
                              {funding.status === 'completed' ? 'Completed' : 'Closed'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-400">Amount: ₹{funding.amount}</span>
                            <span className="text-slate-400">Collected: ₹{funding.collected_amount}</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{ width: `${funding.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-sm text-slate-400">
                            {(funding.progress_percentage || 0).toFixed(1)}% funded
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFunding && !showContributionForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-semibold text-white">{selectedFunding.title}</h3>
                        <button
                          onClick={() => setSelectedFunding(null)}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <p className="text-gray-300 mb-4">{selectedFunding.description}</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">Total Amount</p>
                          <p className="text-lg font-semibold text-white">₹{selectedFunding.amount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Collected Amount</p>
                          <p className="text-lg font-semibold text-white">₹{selectedFunding.collected_amount}</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${selectedFunding.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-400 mb-4">
                        {(selectedFunding.progress_percentage || 0).toFixed(1)}% funded
                      </div>
                      <button
                        onClick={() => setShowContributionForm(true)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Provide
                      </button>
                    </div>
                  </div>
                )}

                {showContributionForm && selectedFunding && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-white">Contribute to {selectedFunding.title}</h3>
                        <button
                          onClick={() => {
                            setShowContributionForm(false);
                            setSelectedFunding(null);
                          }}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <form onSubmit={handleContribute} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={contributionForm.amount}
                            onChange={(e) => setContributionForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            required
                            min="1"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Note (Optional)
                          </label>
                          <textarea
                            value={contributionForm.note}
                            onChange={(e) => setContributionForm(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            rows="3"
                          />
                        </div>
                        {selectedFunding.qr_code_url && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-300 mb-2">Scan QR Code to Pay</p>
                            <img
                              src={selectedFunding.qr_code_url}
                              alt="Payment QR Code"
                              className="w-48 h-48 mx-auto"
                            />
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Confirm Contribution'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCollaboration; 
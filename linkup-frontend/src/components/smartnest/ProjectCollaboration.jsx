import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  FolderIcon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import SkillsInput from '../common/SkillsInput';
import { 
  fetchProjects, 
  createProject, 
  fetchProjectById,
  fetchUserProjects,
  fetchWorkspaceBySlug
} from '../../services/projectService';

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

  // Fetch projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        // Fetch all projects for the "View Projects" tab
        const projectsData = await fetchProjects();
        setProjects(projectsData);
        
        // Fetch user's projects separately
        const userProjectsData = await fetchUserProjects();
        setUserProjects(userProjectsData);

        // Extract workspaces from user projects
        const extractedWorkspaces = userProjectsData
          .filter(project => project.workspace_slug)
          .map(project => ({
            id: project.id,
            title: project.title,
            description: project.short_description,
            slug: project.workspace_slug,
            project_id: project.id,
            created_at: project.created_at
          }));
        
        setWorkspaces(extractedWorkspaces);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, []);

  const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'workspaces', label: 'Workspaces' },
    { id: 'request-status', label: 'Request Status' }
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
      setUserProjects(prevProjects => [...prevProjects, newProject]);
      
      // If workspace was created, update workspaces list
      if (newProject.workspace_slug) {
        const newWorkspace = {
          id: newProject.id,
          title: newProject.title,
          description: newProject.short_description,
          slug: newProject.workspace_slug,
          project_id: newProject.id,
          created_at: newProject.created_at
        };
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
      
      // Check if the current user is the creator of the project
      const userCreatedProject = userProjects.some(p => p.id === project.id);
      setIsCurrentUserProject(userCreatedProject);
      
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
              
              {!isCurrentUserProject && currentProject.open_for_collaboration && (
                <button
                  // onClick={() => requestCollaboration(currentProject.id)} - We'll implement this later
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <span>Request to Collaborate</span>
                  <UserGroupIcon className="w-4 h-4" />
                </button>
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
                
                {/* Cards View Mode - Show user's projects */}
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
            {workspaces.length > 0 ? (
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
          <div className="text-slate-300 text-center py-8">
            <p>Join request status feature coming soon!</p>
            <p className="text-sm text-slate-400 mt-2">
              This will show your pending, accepted, and rejected project join requests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCollaboration; 
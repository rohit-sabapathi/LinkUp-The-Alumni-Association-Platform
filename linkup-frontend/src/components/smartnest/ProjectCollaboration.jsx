import { useState } from 'react';
import { 
  PlusIcon, 
  FolderIcon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import SkillsInput from '../common/SkillsInput';

const ProjectCollaboration = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

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

  const handleSubmitProject = (e) => {
    e.preventDefault();
    
    // Create a new project
    const newProject = {
      id: Date.now().toString(),
      ...projectForm,
      projectImage: projectForm.projectImage ? URL.createObjectURL(projectForm.projectImage) : null,
      createdAt: new Date().toISOString()
    };
    
    // Add to projects list
    setProjects([...projects, newProject]);
    
    // Create workspace for the project
    const newWorkspace = {
      id: `workspace-${newProject.id}`,
      projectId: newProject.id,
      title: newProject.title,
      description: newProject.shortDescription
    };
    
    // Add to workspaces list
    setWorkspaces([...workspaces, newWorkspace]);
    
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
  };

  const viewProjectDetails = (project) => {
    setCurrentProject(project);
    setShowProjectDetails(true);
  };

  const closeProjectDetails = () => {
    setCurrentProject(null);
    setShowProjectDetails(false);
  };
  
  const openWorkspace = (workspace) => {
    // Open workspace in a new tab with a unique URL
    const workspaceUrl = `/workspace/${workspace.id}`;
    window.open(workspaceUrl, '_blank');
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
              {currentProject.projectImage ? (
                <div className="rounded-lg overflow-hidden border border-slate-700">
                  <img 
                    src={currentProject.projectImage} 
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
                <p className="text-indigo-400 text-md font-medium">{currentProject.projectType}</p>
              </div>
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Created On</h3>
                <p className="text-slate-300">{new Date(currentProject.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Max Team Members</h3>
                <p className="text-slate-300">{currentProject.maxTeamMembers}</p>
              </div>
              
              {currentProject.githubLink && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">GitHub Repository</h3>
                  <a 
                    href={currentProject.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {currentProject.githubLink}
                  </a>
                </div>
              )}
              
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Open for Collaboration</h3>
                <p className="text-slate-300">{currentProject.openForCollaboration ? 'Yes' : 'No'}</p>
              </div>
              
              {/* Workspace button */}
              <button
                onClick={() => {
                  const workspace = workspaces.find(w => w.projectId === currentProject.id);
                  if (workspace) openWorkspace(workspace);
                }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Open Workspace</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Right column - Project title and details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">{currentProject.title}</h2>
                <p className="text-slate-400">{currentProject.shortDescription}</p>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Detailed Description</h3>
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-300 whitespace-pre-line">{currentProject.detailedDescription}</p>
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProject.skills.map(skill => (
                    <span 
                      key={skill} 
                      className="bg-indigo-900/30 text-indigo-300 px-3 py-1.5 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {currentProject.skills.length === 0 && (
                    <p className="text-slate-500">No specific skills listed</p>
                  )}
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Team</h3>
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700 flex items-center justify-center h-40">
                  <p className="text-slate-400">No team members yet</p>
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
        {/* Projects Tab */}
        {activeTab === 'projects' && (
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
                <button className="flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200">
                  <FolderIcon className="w-5 h-5 mr-2" />
                  View Projects
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
                    >
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Projects List */}
            {projects.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className="bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition-all duration-200 cursor-pointer"
                    onClick={() => viewProjectDetails(project)}
                  >
                    {project.projectImage && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={project.projectImage} 
                          alt={project.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-slate-200 mb-2">{project.title}</h3>
                      <p className="text-slate-400 text-sm mb-3">{project.shortDescription}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills.slice(0, 3).map(skill => (
                          <span 
                            key={skill} 
                            className="bg-indigo-900/30 text-indigo-300 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skills.length > 3 && (
                          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded">
                            +{project.skills.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">
                          {new Date(project.createdAt).toLocaleDateString()}
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
            )}
            
            {projects.length === 0 && !showProjectForm && (
              <div className="text-center text-slate-400">
                Select an action to get started with projects
              </div>
            )}
          </div>
        )}

        {/* Workspaces Tab */}
        {activeTab === 'workspaces' && (
          <div>
            {workspaces.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map(workspace => (
                  <div
                    key={workspace.id}
                    className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all duration-200"
                  >
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">{workspace.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{workspace.description}</p>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => openWorkspace(workspace)}
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
                <p>No workspaces available. Create a project to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Request Status Tab */}
        {activeTab === 'request-status' && (
          <div>
            <p className="text-slate-300">Request Status tab content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCollaboration; 
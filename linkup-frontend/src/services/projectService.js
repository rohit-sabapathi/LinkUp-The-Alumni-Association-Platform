import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/projects`;

// Create axios instance with auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Project API functions
export const fetchProjects = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add filters to query params
  if (filters.projectType) queryParams.append('project_type', filters.projectType);
  if (filters.skills) queryParams.append('skills', filters.skills.join(','));
  if (filters.userProjects) queryParams.append('user_projects', 'true');
  if (filters.openOnly) queryParams.append('open_only', 'true');
  if (filters.search) queryParams.append('search', filters.search);
  
  try {
    const response = await axios.get(`${API_URL}/?${queryParams.toString()}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch projects' };
  }
};

export const fetchUserProjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/projects/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch user projects' };
  }
};

export const fetchProjectById = async (projectId) => {
  if (!projectId) {
    throw { detail: 'Invalid project ID' };
  }
  
  try {
    const response = await axios.get(`${API_URL}/${projectId}/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch project details' };
  }
};

export const createProject = async (projectData) => {
  const formData = new FormData();
  
  // Add all fields to formData
  Object.keys(projectData).forEach(key => {
    if (key === 'skills' && Array.isArray(projectData[key])) {
      formData.append(key, JSON.stringify(projectData[key]));
    } else if (key === 'projectImage' && projectData[key]) {
      formData.append('project_image', projectData[key]);
    } else if (key === 'shortDescription') {
      formData.append('short_description', projectData[key]);
    } else if (key === 'detailedDescription') {
      formData.append('detailed_description', projectData[key]);
    } else if (key === 'projectType') {
      formData.append('project_type', projectData[key]);
    } else if (key === 'maxTeamMembers') {
      formData.append('max_team_members', projectData[key]);
    } else if (key === 'openForCollaboration') {
      formData.append('open_for_collaboration', projectData[key]);
    } else if (key === 'githubLink') {
      formData.append('github_link', projectData[key]);
    } else {
      formData.append(key, projectData[key]);
    }
  });
  
  try {
    const response = await axios.post(API_URL + '/', formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to create project' };
  }
};

// Workspace API functions
export const fetchWorkspaceBySlug = async (workspaceSlug) => {
  try {
    const response = await axios.get(`${API_URL}/workspace/${workspaceSlug}/`, {
      headers: getAuthHeader()
    });
    
    // Extract project ID from the slug itself
    // Workspace slugs follow the pattern: name-name-projectid
    // The projectid part is usually the first 8 chars of the UUID
    const data = response.data;
    
    // If we already have a project field with a valid ID, use it
    if (!data.project_id) {
      if (typeof data.project === 'string') {
        data.project_id = data.project;
      } else if (data.project && data.project.id) {
        data.project_id = data.project.id;
      } else {
        // Extract project ID from the slug as a fallback
        const slugParts = workspaceSlug.split('-');
        if (slugParts.length > 0) {
          // The last part is likely the project ID fragment
          const idFragment = slugParts[slugParts.length - 1];
          
          // Try to find the full project ID by querying all projects
          try {
            const projectsResponse = await fetchProjects();
            const matchingProject = projectsResponse.find(project => 
              project.id.includes(idFragment)
            );
            
            if (matchingProject) {
              data.project_id = matchingProject.id;
              console.log('Found project ID from fragment:', data.project_id);
            }
          } catch (error) {
            console.error('Error finding project by ID fragment:', error);
          }
        }
      }
    }
    
    return data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch workspace' };
  }
};

export const fetchProjectWorkspace = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/${projectId}/workspace/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch project workspace' };
  }
};

// Project membership functions
export const fetchProjectMembers = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/${projectId}/members/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch project members' };
  }
};

// Join request functions
export const createJoinRequest = async (projectId, message = '') => {
  try {
    const response = await axios.post(`${API_URL}/${projectId}/join_request/`, 
      { message },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to submit join request' };
  }
};

export const fetchProjectJoinRequests = async (projectId, status = null) => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  
  try {
    const response = await axios.get(`${API_URL}/${projectId}/join_requests/?${queryParams.toString()}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch join requests' };
  }
};

export const fetchUserJoinRequests = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/join-requests/`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to fetch user join requests' };
  }
};

export const updateJoinRequestStatus = async (requestId, status) => {
  try {
    const response = await axios.patch(`${API_URL}/join-requests/${requestId}/update_status/`, 
      { status },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to update join request status' };
  }
}; 
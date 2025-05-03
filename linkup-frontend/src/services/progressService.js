import { api } from './api';

// Helper function to get workspace ID by slug
export const getWorkspaceIdBySlug = async (slug) => {
  try {
    // First try to fetch workspace directly
    const workspaceResponse = await api.get(`/projects/workspace/${slug}/`);
    if (workspaceResponse?.data?.id) {
      return workspaceResponse.data.id;
    }
    
    // If that fails, try to get it from the board endpoint
    const boardResponse = await api.get(`/projects/workspace/${slug}/board/`);
    
    // Check different possible locations of the workspace ID
    if (boardResponse?.data?.workspace) {
      if (typeof boardResponse.data.workspace === 'string') {
        return boardResponse.data.workspace;
      } else if (boardResponse.data.workspace.id) {
        return boardResponse.data.workspace.id;
      }
    }
    
    throw new Error('Unable to find workspace ID');
  } catch (error) {
    console.error('Error getting workspace ID:', error);
    throw error;
  }
}

// Fetch all progress logs for a workspace
export const fetchWorkspaceProgressLogs = async (workspaceSlug) => {
  try {
    // Make sure to use the exact URL structure as defined in the Django urls.py
    const response = await api.get(`/projects/workspace/${workspaceSlug}/progress-logs/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching progress logs:', error);
    const errorDetail = error.response?.data?.detail || 
                        error.message || 
                        'Failed to fetch progress logs';
    throw { detail: errorDetail };
  }
};

// Fetch a specific progress log by ID
export const fetchProgressLogById = async (logId) => {
  try {
    const response = await api.get(`/projects/progress-logs/${logId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching progress log:', error);
    
    // Get a detailed error message
    let errorDetail = 'Failed to fetch progress log';
    
    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 403) {
        errorDetail = "You don't have permission to access this progress log";
      } else if (error.response.status === 404) {
        errorDetail = "The requested progress log was not found";
      } else if (error.response.data?.detail) {
        errorDetail = error.response.data.detail;
      }
    } else if (error.message) {
      errorDetail = error.message;
    }
    
    throw { detail: errorDetail };
  }
};

// Fetch current week's progress log for the current user
export const fetchCurrentWeekLog = async (workspaceSlug) => {
  try {
    // Handle both workspace slugs and IDs
    let workspaceSlugOrId = workspaceSlug;
    
    // If workspaceSlug is a UUID, use it directly
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(workspaceSlug)) {
      // Not a UUID, so it's a slug - use it as is
      console.log(`Using workspace slug: ${workspaceSlug}`);
    } else {
      // It's a UUID - use it directly
      console.log(`Using workspace ID: ${workspaceSlug}`);
    }
    
    const response = await api.get(`/projects/workspace/${workspaceSlugOrId}/current-week-log/`);
    return response.data;
  } catch (error) {
    // If 404, it means no log for current week yet - this is normal, not an error
    if (error.response && error.response.status === 404) {
      console.log('No current week log found - this is normal for new users');
      return null;
    }
    
    // Log other errors but don't throw to prevent component crashes
    console.error('Error fetching current week log:', error);
    const errorDetail = error.response?.data?.detail || 
                      error.message || 
                      'Failed to fetch current week log';
                      
    // Don't throw an error, just return null to prevent component crashes
    return null;
  }
};

// Fetch tasks for a workspace (to select from when creating a progress log)
export const fetchWorkspaceTasks = async (workspaceSlug) => {
  try {
    // First get the board ID
    const boardResponse = await api.get(`/projects/workspace/${workspaceSlug}/board/`);
    const boardId = boardResponse.data.id;
    
    // Then fetch all tasks for this board
    const tasksResponse = await api.get(`/projects/tasks/?board=${boardId}`);
    return tasksResponse.data;
  } catch (error) {
    console.error('Error fetching workspace tasks:', error);
    const errorDetail = error.response?.data?.detail || 
                        error.message || 
                        'Failed to fetch workspace tasks';
    throw { detail: errorDetail };
  }
};

// Create a new progress log
export const createProgressLog = async (data) => {
  try {
    // Make a copy of data to avoid modifying the original
    const processedData = { ...data };
    
    // If data.workspace is a slug, we need to convert it to a workspace ID
    if (processedData.workspace && typeof processedData.workspace === 'string' && 
        !processedData.workspace.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        // Use the helper function to get workspace ID
        console.log(`Getting workspace ID for slug: ${processedData.workspace}`);
        const workspaceId = await getWorkspaceIdBySlug(processedData.workspace);
        if (workspaceId) {
          console.log(`Found workspace ID: ${workspaceId}`);
          processedData.workspace = workspaceId;
        } else {
          throw new Error('Could not determine workspace ID from slug');
        }
      } catch (error) {
        console.error('Error getting workspace ID:', error);
        throw error;
      }
    }
    
    // Check if a log already exists for the current week
    try {
      // Use the original workspace slug for this query
      const currentLog = await fetchCurrentWeekLog(data.workspace);
      
      if (currentLog) {
        console.log('Found existing log for current week, updating instead of creating new one:', currentLog.id);
        // Update the existing log instead of creating a new one
        return await updateProgressLog(currentLog.id, processedData);
      }
    } catch (error) {
      // If there's an error checking for existing log, just continue with create
      console.log('Error checking for existing log, will attempt to create new one:', error);
    }
    
    // Log the final data being sent
    console.log('Final data being sent to create progress log:', processedData);
    
    const response = await api.post('/projects/progress-logs/', processedData);
    return response.data;
  } catch (error) {
    console.error('Error creating progress log:', error);
    const errorDetail = error.response?.data?.detail || 
                        error.message || 
                        'Failed to create progress log';
    throw { detail: errorDetail };
  }
};

// Update an existing progress log
export const updateProgressLog = async (logId, data) => {
  try {
    // If data.workspace is a slug, we need to convert it to a workspace ID
    if (data.workspace && typeof data.workspace === 'string' && !data.workspace.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        // Get the workspace ID from the board endpoint
        console.log(`Getting workspace ID for slug: ${data.workspace}`);
        const boardResponse = await api.get(`/projects/workspace/${data.workspace}/board/`);
        console.log('Board response:', boardResponse.data);
        
        // Extract workspace ID - it can be in several possible locations
        let workspaceId = null;
        if (boardResponse.data && boardResponse.data.workspace) {
          if (typeof boardResponse.data.workspace === 'string') {
            // If workspace is directly a string ID
            workspaceId = boardResponse.data.workspace;
          } else if (boardResponse.data.workspace.id) {
            // If workspace is an object with id
            workspaceId = boardResponse.data.workspace.id;
          }
        }
        
        if (workspaceId) {
          console.log(`Found workspace ID: ${workspaceId}`);
          // Replace the slug with the actual workspace ID
          data.workspace = workspaceId;
        } else {
          console.error('Could not find workspace ID in board response');
          throw new Error('Could not determine workspace ID from slug');
        }
      } catch (error) {
        console.error('Error getting workspace ID:', error);
        throw error;
      }
    }
    
    // Log the final data being sent
    console.log('Final data being sent to update progress log:', data);
    
    const response = await api.put(`/projects/progress-logs/${logId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating progress log:', error);
    const errorDetail = error.response?.data?.detail || 
                        error.message || 
                        'Failed to update progress log';
    throw { detail: errorDetail };
  }
};

// Get the current ISO week number
export const getCurrentWeek = () => {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Get the start date of a given week number
export const getWeekStartDate = (weekNumber, year = new Date().getFullYear()) => {
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOffset = 1 - firstDayOfYear.getDay(); // Adjust to start from Monday
  const firstMondayOfYear = new Date(year, 0, dayOffset <= 0 ? dayOffset + 1 : dayOffset);
  
  // Add (weekNumber - 1) weeks to the first Monday
  const weekStart = new Date(firstMondayOfYear);
  weekStart.setDate(firstMondayOfYear.getDate() + (weekNumber - 1) * 7);
  
  return weekStart.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
}; 
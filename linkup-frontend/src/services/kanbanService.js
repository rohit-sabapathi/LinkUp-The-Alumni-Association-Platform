import axios from 'axios';
import { api } from './api';

// No need for API_URL since we're using the api instance with baseURL already configured

// Fetch board for a workspace
export const fetchBoard = async (workspaceSlug) => {
  try {
    console.log(`Fetching board for workspace slug: ${workspaceSlug}`);
    
    const response = await api.get(
      `/projects/workspace/${workspaceSlug}/board/`
    );
    
    const boardData = response.data;
    
    // Validate the board data
    if (!boardData || !boardData.id) {
      console.error('Invalid board data received:', boardData);
      throw { detail: 'Board data is invalid or incomplete' };
    }
    
    // Check if columns were returned with the board
    if (!boardData.columns || !Array.isArray(boardData.columns)) {
      console.error('Board has no columns or invalid columns data:', boardData);
      throw { detail: 'Board columns are missing or invalid' };
    }
    
    // Log column and task information for debugging
    console.log(`Board "${boardData.title}" has ${boardData.columns.length} columns`);
    boardData.columns.forEach(column => {
      const taskCount = column.tasks ? column.tasks.length : 0;
      console.log(`Column "${column.title}" has ${taskCount} tasks`);
      
      // Ensure all tasks have string IDs for draggable
      if (column.tasks && Array.isArray(column.tasks)) {
        column.tasks = column.tasks.map(task => ({
          ...task,
          id: String(task.id)
        }));
      } else {
        column.tasks = [];
      }
    });
    
    return boardData;
  } catch (error) {
    console.error('Error fetching board:', error);
    const errorDetail = error.response?.data?.detail || 
                        error.response?.data?.message ||
                        error.detail ||
                        error.message ||
                        'Failed to fetch board';
    throw { detail: errorDetail };
  }
};

// Create a new task
export const createTask = async (taskData) => {
  try {
    const formData = new FormData();
    
    // Track fields we're sending for debugging
    const debugData = {};
    
    // Append non-file fields and filter out undefined values
    for (const key in taskData) {
      // Skip undefined or null values
      if (taskData[key] === undefined || taskData[key] === null || taskData[key] === 'undefined') {
        continue;
      }
      
      // Handle file field specially
      if (key !== 'attachment' || (key === 'attachment' && taskData[key])) {
        formData.append(key, taskData[key]);
        // Track fields for debugging
        if (key !== 'attachment') {
          debugData[key] = taskData[key];
        } else {
          debugData[key] = 'File attached';
        }
      }
    }
    
    // Get column details to identify the board
    const columnId = taskData.column;
    if (!columnId) {
      throw new Error('Column ID is required');
    }
    
    console.log('Creating task with data:', debugData);
    
    // Make a direct API call with JSON data instead of FormData to reduce complexity
    console.log('Sending task creation request...');
    const response = await api.post(
      `/projects/tasks/`,
      formData,
      { 
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('Raw server response:', response);
    
    // Validate the response contains a valid task
    const responseData = response.data;
    
    // Log the response data in detail
    console.log('Response data detail:', JSON.stringify(responseData, null, 2));
    
    if (!responseData) {
      console.error('No response data received');
      throw new Error('No response data received');
    }
    
    // Check if response data has an ID
    if (!responseData.id) {
      console.warn('Task created on server but ID is missing, generating temporary ID');
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a complete task object with the temporary ID
      return {
        ...taskData,
        ...responseData,  // Include any fields the server did return
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignments: [],
        comments: [],
        comments_count: 0,
      };
    }
    
    // Task has a valid ID, return it with all needed properties
    console.log('Successfully created task with server ID:', responseData.id);
    
    // Ensure all required properties exist
    const completeTask = {
      ...responseData,
      id: String(responseData.id),  // Ensure ID is a string
      assignments: responseData.assignments || [],
      comments: responseData.comments || [],
      comments_count: responseData.comments_count || 0,
      is_blocked: responseData.is_blocked || false,
      blocked_reason: responseData.blocked_reason || '',
    };
    
    return completeTask;
  } catch (error) {
    console.error('Error creating task:', error);
    
    // Try to get more detailed error information
    const errorDetail = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to create task';
                      
    console.error('Error details:', errorDetail);
    
    // Make a more direct request to verify the task was created
    try {
      console.log('Attempting to verify if task was created...');
      const columnId = taskData.column;
      
      // Wait a moment before checking
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get tasks for this column
      const tasksResponse = await api.get(`/projects/tasks/?column=${columnId}`);
      console.log('Column tasks after attempted creation:', tasksResponse.data);
      
      // Check if a task with matching title was created
      const matchingTask = tasksResponse.data.find(t => t.title === taskData.title);
      if (matchingTask) {
        console.log('Found matching task that was created:', matchingTask);
        return matchingTask;
      }
    } catch (verifyError) {
      console.error('Error verifying task creation:', verifyError);
    }
    
    // Create a temporary task with error flag
    const tempErrorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Throw a more informative error
    throw { 
      detail: errorDetail,
      tempTask: {
        ...taskData,
        id: tempErrorId,
        error: true,
        errorMessage: errorDetail
      }
    };
  }
};

// Update a task
export const updateTask = async (taskId, taskData) => {
  try {
    const formData = new FormData();
    
    // Append non-file fields
    for (const key in taskData) {
      if (key !== 'attachment' || (key === 'attachment' && taskData[key])) {
        formData.append(key, taskData[key]);
      }
    }
    
    const response = await api.patch(
      `/projects/tasks/${taskId}/`,
      formData,
      { 
        headers: {
          'Content-Type': 'multipart/form-data'
        } 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error.response?.data || error.message);
    throw error.response?.data || { detail: 'Failed to update task' };
  }
};

// Move a task to another column
export const moveTask = async (taskId, moveData) => {
  try {
    console.log(`Moving task with ID: ${taskId}`, moveData);
    
    // Ensure we're working with a valid task ID
    if (!taskId) {
      throw new Error('Invalid task ID for move operation');
    }
    
    // Log the full payload for debugging
    console.log('Move task request:', {
      taskId: taskId,
      targetColumn: moveData.target_column,
      newOrder: moveData.order
    });
    
    const response = await api.patch(
      `/projects/tasks/${taskId}/move/`,
      moveData
    );
    
    console.log('Move task success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error moving task:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    
    throw error.response?.data || { detail: 'Failed to move task' };
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(
      `/projects/tasks/${taskId}/`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error.response?.data || error.message);
    throw error.response?.data || { detail: 'Failed to delete task' };
  }
};

// Assign a task to a user
export const assignTask = async (taskId, assignData) => {
  try {
    console.log(`Attempting to assign task ${taskId} to user ${assignData.assignee_id}`);
    
    // Log the full request for debugging
    console.log('Assignment request data:', {
      taskId,
      assignData,
      endpoint: `/projects/tasks/${taskId}/assign/`
    });
    
    const response = await api.post(
      `/projects/tasks/${taskId}/assign/`,
      assignData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Assignment success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error assigning task:', error);
    
    // Enhanced error logging to debug permission issues
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      console.error('Error response headers:', error.response.headers);
    }
    
    throw error.response?.data || { detail: 'Failed to assign task' };
  }
};

// Unassign a user from a task
export const unassignTask = async (taskId, userId) => {
  try {
    const response = await api.delete(
      `/projects/tasks/${taskId}/unassign/?user_id=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error unassigning task:', error.response?.data || error.message);
    throw error.response?.data || { detail: 'Failed to unassign task' };
  }
};

// Add a comment to a task
export const addComment = async (taskId, commentData) => {
  try {
    const response = await api.post(
      `/projects/tasks/${taskId}/comment/`,
      commentData
    );
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error.response?.data || error.message);
    throw error.response?.data || { detail: 'Failed to add comment' };
  }
};

// Fetch task comments
export const fetchTaskComments = async (taskId) => {
  try {
    const response = await api.get(
      `/projects/tasks/${taskId}/comments/`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error.response?.data || error.message);
    throw error.response?.data || { detail: 'Failed to fetch comments' };
  }
};

// Fetch members for a board's project
export const fetchTaskMembers = async (workspaceSlug) => {
  try {
    // First fetch the workspace to get project info
    console.log('Fetching workspace for slug:', workspaceSlug);
    const workspaceResponse = await api.get(`/projects/workspace/${workspaceSlug}/`);
    
    if (workspaceResponse.data && workspaceResponse.data.project) {
      const projectId = workspaceResponse.data.project;
      console.log('Fetching members for project:', projectId);
      
      // Get all members from the project
      const membersResponse = await api.get(`/projects/${projectId}/members/`);
      console.log('Received members:', membersResponse.data);
      
      // Return the raw members data - we'll process it in the TaskModal component
      return membersResponse.data;
    } else {
      console.error('No project found in workspace response:', workspaceResponse.data);
      return [];
    }
    
  } catch (error) {
    console.error('Error fetching board members:', error.response?.data || error.message);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

// Fetch board details
export const fetchBoardDetails = async (boardId) => {
  try {
    const response = await api.get(
      `/projects/boards/${boardId}/`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching board details:', error.response?.data || error.message);
    throw error.response?.data || { detail: 'Failed to fetch board details' };
  }
}; 
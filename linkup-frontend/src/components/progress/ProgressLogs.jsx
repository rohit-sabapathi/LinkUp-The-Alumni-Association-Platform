import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  XMarkIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PencilIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { 
  fetchWorkspaceProgressLogs, 
  fetchProgressLogById,
  fetchCurrentWeekLog,
  fetchWorkspaceTasks,
  createProgressLog,
  updateProgressLog,
  getCurrentWeek,
  getWeekStartDate
} from '../../services/progressService';

const ProgressLogs = ({ workspaceSlug }) => {
  const [activeView, setActiveView] = useState('timeline'); // 'timeline', 'create', 'detail'
  const [progressLogs, setProgressLogs] = useState([]);
  const [currentLog, setCurrentLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);
  
  // Form state for creating/editing logs
  const [formData, setFormData] = useState({
    summary: '',
    blockers: '',
    goals_next_week: '',
    task_updates: []
  });

  // Load progress logs and tasks on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all progress logs for the workspace
        const logsData = await fetchWorkspaceProgressLogs(workspaceSlug);
        setProgressLogs(logsData || []);
        
        // Fetch available tasks for the workspace
        const tasksData = await fetchWorkspaceTasks(workspaceSlug);
        setTasks(tasksData || []);
        
        // Try to fetch current week's log for the current user
        try {
          const currentWeekLog = await fetchCurrentWeekLog(workspaceSlug);
          // It's okay if currentWeekLog is null - it just means no log for this week yet
          setCurrentLog(currentWeekLog);
        } catch (error) {
          // No current week log is fine, user can create one
          console.log('No current week log found');
        }
        
        setError(null);
      } catch (error) {
        console.error('Error loading progress logs data:', error);
        setError(error.detail || 'Failed to load progress logs');
        toast.error(error.detail || 'Failed to load progress logs');
      } finally {
        setLoading(false);
      }
    };
    
    if (workspaceSlug) {
      loadData();
    }
  }, [workspaceSlug]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle task status changes
  const handleTaskStatusChange = (taskId, field, value) => {
    const updatedTaskUpdates = [...formData.task_updates];
    const taskIndex = updatedTaskUpdates.findIndex(t => t.task === taskId);
    
    if (taskIndex >= 0) {
      updatedTaskUpdates[taskIndex] = {
        ...updatedTaskUpdates[taskIndex],
        [field]: value
      };
    } else {
      updatedTaskUpdates.push({
        task: taskId,
        status: field === 'status' ? value : 'in_progress',
        contribution: field === 'contribution' ? value : '',
        hours_spent: field === 'hours_spent' ? parseInt(value, 10) || 0 : 0
      });
    }
    
    setFormData({
      ...formData,
      task_updates: updatedTaskUpdates
    });
  };
  
  // Remove a task from the progress log form
  const removeTaskFromForm = (taskId) => {
    setFormData({
      ...formData,
      task_updates: formData.task_updates.filter(t => t.task !== taskId)
    });
  };
  
  // Submit the form to create or update a progress log
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const currentWeek = getCurrentWeek();
      const weekStartDate = getWeekStartDate(currentWeek);
      
      // Prepare the data with the correct format - the backend expects task_updates
      const formattedData = {
        workspace: workspaceSlug,
        week_number: currentWeek,
        week_start_date: weekStartDate,
        summary: formData.summary,
        blockers: formData.blockers || "",
        goals_next_week: formData.goals_next_week || "",
      };
      
      // Only add task_updates if we have any
      if (formData.task_updates && formData.task_updates.length > 0) {
        // Ensure each task update has the required fields
        formattedData.task_updates = formData.task_updates.map(update => ({
          task: update.task,
          status: update.status || 'in_progress',
          contribution: update.contribution || '',
          hours_spent: parseInt(update.hours_spent, 10) || 0
        }));
      }
      
      console.log('Submitting progress log with data:', formattedData);
      
      let result;
      
      if (selectedLogId) {
        // Update existing log
        result = await updateProgressLog(selectedLogId, formattedData);
        toast.success('Progress log updated successfully!');
      } else {
        // First check if we already have a current week log
        const existingLog = await fetchCurrentWeekLog(workspaceSlug);
        
        if (existingLog) {
          // If current week log exists, update it instead of creating new
          console.log(`Found existing log for current week (${existingLog.id}), updating instead of creating new`);
          result = await updateProgressLog(existingLog.id, formattedData);
          toast.success('Progress log updated successfully!');
        } else {
          // Create new log
          result = await createProgressLog(formattedData);
          toast.success('Progress log created successfully!');
        }
      }
      
      console.log('Progress log saved successfully:', result);
      
      // Refresh the logs list
      const logsData = await fetchWorkspaceProgressLogs(workspaceSlug);
      setProgressLogs(logsData || []);
      
      // Reset form and go back to timeline view
      setFormData({
        summary: '',
        blockers: '',
        goals_next_week: '',
        task_updates: []
      });
      
      setCurrentLog(result);
      setSelectedLogId(null);
      setActiveView('timeline');
    } catch (error) {
      console.error('Error saving progress log:', error);
      
      let errorMessage = 'Failed to save progress log';
      
      // Check for specific error types
      if (error.response?.status === 500 && error.response?.data?.includes('UNIQUE constraint failed')) {
        errorMessage = 'You already have a progress log for this week. Please update the existing log instead.';
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show detailed error information
      console.error('Error details:', { error, errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Load a specific log for editing
  const handleEditLog = async (logId) => {
    setLoading(true);
    try {
      const logData = await fetchProgressLogById(logId);
      
      // Convert log data to form format
      setFormData({
        summary: logData.summary || '',
        blockers: logData.blockers || '',
        goals_next_week: logData.goals_next_week || '',
        task_updates: logData.tasks || []
      });
      
      setSelectedLogId(logId);
      setActiveView('create');
    } catch (error) {
      console.error('Error loading log for edit:', error);
      toast.error(error.detail || 'Failed to load progress log');
    } finally {
      setLoading(false);
    }
  };
  
  // View a specific log's details
  const handleViewLog = async (logId) => {
    setLoading(true);
    try {
      const logData = await fetchProgressLogById(logId);
      setCurrentLog(logData);
      setActiveView('detail');
    } catch (error) {
      console.error('Error loading log details:', error);
      
      // Handle permission errors specially
      if (error.detail?.includes("permission") || error.detail?.includes("access")) {
        toast.error("You don't have permission to view this progress log");
        
        // Go back to timeline view
        setActiveView('timeline');
        
        // Try to refresh the logs list to show only accessible logs
        try {
          const logsData = await fetchWorkspaceProgressLogs(workspaceSlug);
          setProgressLogs(logsData || []);
        } catch (refreshError) {
          console.error('Error refreshing logs list:', refreshError);
        }
      } else {
        // For other errors, show the message
        toast.error(error.detail || 'Failed to load progress log details');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new log - initialize form with empty values
  const handleNewLog = () => {
    setFormData({
      summary: '',
      blockers: '',
      goals_next_week: '',
      task_updates: []
    });
    setSelectedLogId(null);
    setActiveView('create');
  };
  
  // Render loading state
  if (loading && !progressLogs.length) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-slate-400 text-center">
          <p className="mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Render form view for creating/editing a progress log
  if (activeView === 'create') {
    return (
      <div className="p-6 h-full overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setActiveView('timeline')}
            className="flex items-center text-slate-400 hover:text-slate-200"
          >
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            Back to Timeline
          </button>
          <h2 className="text-xl font-semibold text-slate-200">
            {selectedLogId ? 'Edit Progress Log' : 'New Weekly Update'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Week Info */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 mb-6">
            <div className="flex items-center text-slate-400">
              <CalendarIcon className="w-5 h-5 mr-2" />
              <span>Week {getCurrentWeek()} ({getWeekStartDate(getCurrentWeek())})</span>
            </div>
          </div>
          
          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-slate-300 mb-1">
              Weekly Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Summarize what you worked on this week"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            ></textarea>
          </div>
          
          {/* Blockers */}
          <div>
            <label htmlFor="blockers" className="block text-sm font-medium text-slate-300 mb-1">
              Blockers / Challenges
            </label>
            <textarea
              id="blockers"
              name="blockers"
              value={formData.blockers}
              onChange={handleInputChange}
              rows="2"
              placeholder="Any issues that slowed you down or that you need help with"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            ></textarea>
          </div>
          
          {/* Goals for Next Week */}
          <div>
            <label htmlFor="goals_next_week" className="block text-sm font-medium text-slate-300 mb-1">
              Goals for Next Week
            </label>
            <textarea
              id="goals_next_week"
              name="goals_next_week"
              value={formData.goals_next_week}
              onChange={handleInputChange}
              rows="2"
              placeholder="What you plan to accomplish next week"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            ></textarea>
          </div>
          
          {/* Task Updates */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Task Updates
              </label>
              <div className="text-xs text-slate-500">
                Link your updates to specific tasks from the board
              </div>
            </div>
            
            <div className="space-y-3">
              {formData.task_updates.map((taskUpdate, index) => {
                const task = tasks.find(t => t.id === taskUpdate.task);
                if (!task) return null;
                
                return (
                  <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium text-slate-200">{task.title}</h4>
                      <button
                        type="button"
                        onClick={() => removeTaskFromForm(task.id)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Status</label>
                        <select
                          value={taskUpdate.status}
                          onChange={(e) => handleTaskStatusChange(task.id, 'status', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Hours Spent</label>
                        <input
                          type="number"
                          min="0"
                          value={taskUpdate.hours_spent || ''}
                          onChange={(e) => handleTaskStatusChange(task.id, 'hours_spent', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Your Contribution</label>
                        <textarea
                          value={taskUpdate.contribution || ''}
                          onChange={(e) => handleTaskStatusChange(task.id, 'contribution', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                          placeholder="Describe what you did on this task"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Task Selection Dropdown */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-dashed border-slate-700">
                <div className="flex flex-col gap-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Add Task Update
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleTaskStatusChange(e.target.value, 'status', 'in_progress');
                        e.target.value = ''; // Reset after selection
                      }
                    }}
                  >
                    <option value="">Select a task...</option>
                    {tasks
                      .filter(task => !formData.task_updates.some(t => t.task === task.id))
                      .map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveView('timeline')}
              className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : selectedLogId ? 'Update Progress Log' : 'Submit Weekly Update'}
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  // Render detailed view of a specific log
  if (activeView === 'detail' && currentLog) {
    // Get task data for each task in the log
    const getTaskData = (taskId) => tasks.find(t => t.id === taskId) || { title: 'Unknown Task' };
    
    // Format date
    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };
    
    // Status color and icon
    const getStatusDisplay = (status) => {
      switch(status) {
        case 'completed':
          return { color: 'text-green-400', bgColor: 'bg-green-900/30', icon: CheckCircleIcon };
        case 'in_progress':
          return { color: 'text-blue-400', bgColor: 'bg-blue-900/30', icon: ArrowPathIcon };
        case 'blocked':
          return { color: 'text-red-400', bgColor: 'bg-red-900/30', icon: XCircleIcon };
        default:
          return { color: 'text-slate-400', bgColor: 'bg-slate-900/30', icon: ClockIcon };
      }
    };
    
    return (
      <div className="p-6 h-full overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setActiveView('timeline')}
            className="flex items-center text-slate-400 hover:text-slate-200"
          >
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            Back to Timeline
          </button>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              Week {currentLog.week_number} ({formatDate(currentLog.week_start_date)})
            </span>
            <button
              onClick={() => handleEditLog(currentLog.id)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* User and Date */}
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
              {currentLog.user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-slate-200 font-medium">
                {currentLog.user?.full_name || currentLog.user?.username || 'User'}
              </div>
              <div className="text-slate-500 text-sm">
                Updated on {formatDate(currentLog.updated_at)}
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700">
            <h3 className="text-md font-semibold text-slate-300 mb-2">Weekly Summary</h3>
            <p className="text-slate-300 whitespace-pre-line">{currentLog.summary}</p>
          </div>
          
          {/* Tasks Updates */}
          {currentLog.tasks && currentLog.tasks.length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700">
              <h3 className="text-md font-semibold text-slate-300 mb-4">Tasks Worked On</h3>
              <div className="space-y-4">
                {currentLog.tasks.map((taskUpdate, index) => {
                  const taskData = getTaskData(taskUpdate.task);
                  const statusDisplay = getStatusDisplay(taskUpdate.status);
                  
                  return (
                    <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-slate-200 mb-2">{taskData.title}</h4>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                          <statusDisplay.icon className="w-3 h-3 mr-1" />
                          <span>{taskUpdate.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="flex items-center text-slate-400 text-sm">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          <span>{taskUpdate.hours_spent} hours spent</span>
                        </div>
                        
                        <div className="md:col-span-2 mt-2">
                          <p className="text-slate-300">{taskUpdate.contribution}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Blockers */}
          {currentLog.blockers && (
            <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700">
              <h3 className="text-md font-semibold text-slate-300 mb-2">Blockers / Challenges</h3>
              <p className="text-slate-300 whitespace-pre-line">{currentLog.blockers}</p>
            </div>
          )}
          
          {/* Goals for Next Week */}
          {currentLog.goals_next_week && (
            <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700">
              <h3 className="text-md font-semibold text-slate-300 mb-2">Goals for Next Week</h3>
              <p className="text-slate-300 whitespace-pre-line">{currentLog.goals_next_week}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Default view - Timeline of all progress logs
  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-200">Progress Timeline</h2>
        <button
          onClick={handleNewLog}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          New Weekly Update
        </button>
      </div>
      
      {/* Timeline Display */}
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-slate-300 font-medium">Weekly Progress Updates</div>
            <div className="flex gap-2">
              {/* Optional controls for filtering/view */}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-700">
          {progressLogs.length > 0 ? (
            progressLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => handleViewLog(log.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                      {log.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-slate-200 font-medium">
                        {log.user?.full_name || log.user?.username || 'User'}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        Week {log.week_number} • {new Date(log.week_start_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">
                      {log.tasks_count} tasks
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              <DocumentTextIcon className="w-10 h-10 mx-auto mb-3 text-slate-500" />
              <p className="mb-2">No progress logs yet</p>
              <p className="text-sm max-w-md mx-auto">
                Create weekly updates to track your progress and keep your team informed
              </p>
              <button
                onClick={handleNewLog}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
              >
                Create Your First Update
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressLogs; 
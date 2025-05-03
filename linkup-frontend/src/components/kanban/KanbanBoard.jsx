import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import { fetchBoard, createTask, moveTask } from '../../services/kanbanService';
import { api } from '../../services/api';

// Function to ensure consistent task ID format
const ensureStringId = (id) => {
  if (!id) return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return typeof id === 'string' ? id : String(id);
};

const KanbanBoard = ({ workspaceSlug }) => {
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [error, setError] = useState(null);
  const boardRef = useRef(null);

  useEffect(() => {
    const loadBoard = async () => {
      setLoading(true);
      setError(null);
      try {
        const boardData = await fetchBoard(workspaceSlug);
        setBoard(boardData);
        
        // Sort columns by order and ensure tasks is initialized for each column
        const sortedColumns = [...boardData.columns]
          .sort((a, b) => a.order - b.order)
          .map(column => {
            // Make sure all tasks have string IDs for Draggable
            const tasksWithStringIds = (column.tasks || []).map(task => ({
              ...task,
              id: ensureStringId(task.id)
            }));
            
            console.log(`Processed tasks for column ${column.title}:`, 
              tasksWithStringIds.map(t => ({ id: t.id, title: t.title }))
            );
            
            return {
              ...column,
              tasks: tasksWithStringIds 
            };
          });
          
        console.log('Processed columns with tasks:', sortedColumns);
        setColumns(sortedColumns);
        
        boardRef.current = {
          ...boardData,
          columns: sortedColumns
        };
      } catch (err) {
        console.error('Error loading board:', err);
        setError(err.detail || 'Failed to load the board');
        toast.error(err.detail || 'Failed to load the board');
      } finally {
        setLoading(false);
      }
    };
    
    if (workspaceSlug) {
      loadBoard();
    }
  }, [workspaceSlug]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    console.log('Drag end result:', { destination, source, draggableId });
    
    // If no destination or dropped in the same spot, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    try {
      // Find source and destination columns
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);
      
      if (!sourceColumn || !destColumn) {
        console.error('Column not found');
        return;
      }
      
      // Find the task being moved using the draggableId directly
      console.log(`Looking for task with draggableId: ${draggableId}`);
      console.log('Source column tasks:', sourceColumn.tasks.map(t => ({ id: t.id, title: t.title })));
      
      let taskToMove = sourceColumn.tasks.find(task => task.id === draggableId);
      
      if (!taskToMove) {
        console.error(`Task with ID ${draggableId} not found in column ${sourceColumn.id}`);
        
        // Attempt to find the task by using a more flexible matching approach
        const altTask = sourceColumn.tasks.find(task => 
          String(task.id).includes(draggableId) || draggableId.includes(String(task.id))
        );
        
        if (altTask) {
          console.log(`Found task with similar ID: ${altTask.id}`);
          // Use this task instead
          taskToMove = altTask;
        } else {
          // If we still can't find the task, refresh the board and return
          console.log("Can't find the task, refreshing board...");
          refreshBoard();
          return;
        }
      }
      
      // Create new columns array
      const newColumns = columns.map(column => {
        // If this is the source column
        if (column.id === source.droppableId) {
          // If source and destination are the same column
          if (source.droppableId === destination.droppableId) {
            // Create copy of tasks with the task moved to the right position
            const newTasks = Array.from(column.tasks);
            newTasks.splice(source.index, 1);
            newTasks.splice(destination.index, 0, taskToMove);
            
            // Update task order properties based on new positions
            const updatedTasks = newTasks.map((task, index) => ({
              ...task,
              order: index
            }));
            
            return { ...column, tasks: updatedTasks };
          } else {
            // Remove task from source column
            const newTasks = column.tasks.filter(task => task.id !== taskToMove.id);
            
            // Update remaining tasks' order
            const updatedTasks = newTasks.map((task, index) => ({
              ...task,
              order: index
            }));
            
            return { ...column, tasks: updatedTasks };
          }
        }
        
        // If this is the destination column and different from source
        if (column.id === destination.droppableId && source.droppableId !== destination.droppableId) {
          // Add task to destination column at the right position
          const newTasks = Array.from(column.tasks);
          
          // Update the task's column reference
          const updatedTask = {
            ...taskToMove,
            column: destination.droppableId
          };
          
          newTasks.splice(destination.index, 0, updatedTask);
          
          // Update task order properties
          const updatedTasks = newTasks.map((task, index) => ({
            ...task,
            order: index
          }));
          
          return { ...column, tasks: updatedTasks };
        }
        
        return column;
      });
      
      // Update state optimistically
      setColumns(newColumns);
      
      // Extract the UUID from the draggableId if needed
      // This handles cases where the ID might have prefixes/format differences
      let apiTaskId = draggableId;
      const uuidMatch = draggableId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
      if (uuidMatch && uuidMatch[1]) {
        apiTaskId = uuidMatch[1];
        console.log(`Extracted UUID ${apiTaskId} from draggableId ${draggableId}`);
      }
      
      // Use the server-expected task ID format for the API call
      const originalTaskId = taskToMove.original_id || apiTaskId;
      console.log(`Using task ID for API call: ${originalTaskId}`);
      
      // Send update to API
      await moveTask(originalTaskId, {
        target_column: destination.droppableId,
        order: destination.index
      });
      
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task. Please try again.');
      
      // Reset to previous state if API call fails
      if (boardRef.current) {
        const resetColumns = [...boardRef.current.columns].sort((a, b) => a.order - b.order);
        setColumns(resetColumns);
      }
    }
  };

  const handleAddTask = (columnId) => {
    setActiveColumn(columnId);
    setCurrentTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setActiveColumn(task.column);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      const columnId = activeColumn;
      
      if (currentTask) {
        // Update existing task (handled in TaskModal)
        const updatedColumns = columns.map(column => {
          if (column.id === columnId) {
            return {
              ...column,
              tasks: column.tasks.map(task => 
                task.id === currentTask.id ? { ...taskData, id: task.id } : task
              )
            };
          }
          return column;
        });
        
        setColumns(updatedColumns);
      } else {
        // Create new task with board and workspace information
        const taskPayload = {
          ...taskData,
          column: columnId,
        };
        
        // Only add board and workspace IDs if they exist and are valid
        if (board && board.id) {
          taskPayload.board = board.id;
          console.log('Adding board ID to task:', board.id);
        }
        
        if (board && board.workspace && board.workspace.id) {
          taskPayload.workspace = board.workspace.id;
          console.log('Adding workspace ID to task:', board.workspace.id);
        }
        
        try {
          // Show loading toast
          const loadingToastId = toast.loading('Creating task...');
          
          // Create the task on the server
          const newTask = await createTask(taskPayload);
          console.log('New task created on server:', newTask);
          
          // Close the loading toast
          toast.dismiss(loadingToastId);
          
          // Use the returned task ID if available, or generate a temporary ID
          const taskId = ensureStringId(newTask.id);
          console.log('Using task ID:', taskId);
          
          // Save the original ID for API calls
          const original_id = newTask.id;
          
          // Add the new task to the column
          const updatedColumns = columns.map(column => {
            if (column.id === columnId) {
              // Ensure column.tasks is initialized as an array even if it's undefined
              const columnTasks = column.tasks || [];
              
              // Create a safe task object with a valid string ID
              const safeTask = {
                ...newTask,
                id: taskId,
                original_id, // Store the original server ID
                column: columnId,
                // Add default values for any missing properties
                order: columnTasks.length,
                assignments: newTask.assignments || [],
                comments: newTask.comments || [],
                comments_count: newTask.comments_count || 0
              };
              
              console.log('Adding task to column:', safeTask);
              
              return {
                ...column,
                tasks: [...columnTasks, safeTask]
              };
            }
            return column;
          });
          
          setColumns(updatedColumns);
          toast.success('Task created successfully');
          
          // If the task was created without a valid ID or appears to be a temporary task,
          // refresh the board to ensure data consistency
          if (!newTask.id) {
            toast.loading('Synchronizing board data...', { duration: 1500 });
            
            // Wait a moment to ensure server has processed the task creation
            setTimeout(() => {
              refreshBoard();
            }, 2000);
          }
        } catch (error) {
          console.error('Error creating task:', error);
          toast.error('Failed to create task: ' + (error.detail || 'Unknown error'));
        }
      }
      
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error with task:', error);
      toast.error(error.detail || 'Failed to process task');
    }
  };

  // Add a method to refresh the board
  const refreshBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Refreshing board data...');
      const boardData = await fetchBoard(workspaceSlug);
      console.log('Received fresh board data:', boardData);
      
      // Check if we received a valid board with columns
      if (!boardData || !boardData.columns) {
        console.error('Invalid board data received:', boardData);
        setError('Invalid board data received');
        setLoading(false);
        return;
      }
      
      setBoard(boardData);
      
      // Fetch tasks for each column directly using the API
      const updatedColumns = [...boardData.columns].sort((a, b) => a.order - b.order);
      
      // Process each column to ensure tasks are properly loaded
      for (const column of updatedColumns) {
        try {
          // Explicitly fetch tasks for this column 
          console.log(`Fetching tasks for column ${column.title}...`);
          const tasksResponse = await api.get(`/projects/tasks/?column=${column.id}`);
          const columnTasks = tasksResponse.data;
          
          console.log(`Column ${column.title} tasks:`, columnTasks);
          
          // Ensure all tasks have string IDs
          column.tasks = columnTasks.map(task => {
            const stringId = ensureStringId(task.id);
            return {
              ...task,
              id: stringId,
              original_id: task.id // Store original ID for API calls
            };
          });
        } catch (err) {
          console.error(`Error fetching tasks for column ${column.title}:`, err);
          column.tasks = column.tasks || [];
        }
      }
      
      // Update the state with the full data
      setColumns(updatedColumns);
      
      // Store for reference
      boardRef.current = {
        ...boardData,
        columns: updatedColumns
      };
      
      toast.success('Board refreshed successfully');
    } catch (err) {
      console.error('Error refreshing board:', err);
      setError(err.detail || 'Failed to refresh the board');
      toast.error(err.detail || 'Failed to refresh the board');
    } finally {
      setLoading(false);
    }
  };

  // Inside the KanbanBoard component, add a new method for direct refresh
  const forceRefresh = () => {
    toast.loading('Refreshing board...', { duration: 1000 });
    refreshBoard();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400">
        <ExclamationTriangleIcon className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load board</p>
        <p className="text-sm text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="flex justify-between items-center p-3 mb-4">
        <h2 className="text-xl font-semibold text-slate-200">{board?.title || 'Project Board'}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={forceRefresh} 
            className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full space-x-4 px-2 py-1">
            {columns.map(column => (
              <KanbanColumn 
                key={column.id} 
                column={column} 
                onAddTask={() => handleAddTask(column.id)}
                onEditTask={handleEditTask}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
      
      {/* Task modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          task={currentTask}
          columnId={activeColumn}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleTaskSubmit}
          workspaceSlug={workspaceSlug}
        />
      )}
    </div>
  );
};

export default KanbanBoard; 
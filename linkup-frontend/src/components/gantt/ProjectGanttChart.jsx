import React, { useState, useEffect } from 'react';
import { Gantt, Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import "./ProjectGanttChart.css";
import { fetchWorkspaceTasks } from '../../services/progressService';
import { toast } from 'react-hot-toast';

// Define time scales for better visualization
const scales = [
  { unit: "month", step: 1, format: "MMMM yyyy" },
  { unit: "day", step: 1, format: "d" }
];

// Define columns for the left grid panel
const columns = [
  { 
    id: "text", 
    header: "Task Name", 
    width: 200, 
    tree: true,
    resize: true,
    editor: { type: "text" }  // Enable text editing
  },
  {
    id: "start",
    header: "Start Date",
    width: 120,
    align: "center",
    resize: true,
    editor: { type: "date" }  // Enable date editing
  },
  {
    id: "duration",
    header: "Duration",
    width: 100,
    align: "center",
    resize: true,
    editor: { type: "number" }  // Enable number editing
  }
];

const ProjectGanttChart = ({ workspaceSlug }) => {
  const [tasks, setTasks] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Event handlers for task operations
  const handleTaskCreate = (task) => {
    setTasks(prevTasks => [...prevTasks, task]);
    // TODO: Add API call to save new task
    toast.success('Task created successfully');
  };

  const handleTaskUpdate = (task) => {
    setTasks(prevTasks => 
      prevTasks.map(t => t.id === task.id ? task : t)
    );
    // TODO: Add API call to update task
    toast.success('Task updated successfully');
  };

  const handleTaskDelete = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    // TODO: Add API call to delete task
    toast.success('Task deleted successfully');
  };

  // Event handlers for link operations
  const handleLinkCreate = (link) => {
    setLinks(prevLinks => [...prevLinks, link]);
    // TODO: Add API call to save new link
    toast.success('Link created successfully');
  };

  const handleLinkUpdate = (link) => {
    setLinks(prevLinks => 
      prevLinks.map(l => l.id === link.id ? link : l)
    );
    // TODO: Add API call to update link
    toast.success('Link updated successfully');
  };

  const handleLinkDelete = (linkId) => {
    setLinks(prevLinks => prevLinks.filter(l => l.id !== linkId));
    // TODO: Add API call to delete link
    toast.success('Link deleted successfully');
  };

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        // Fetch tasks from the workspace
        const tasksData = await fetchWorkspaceTasks(workspaceSlug);
        
        if (!tasksData || !Array.isArray(tasksData) || tasksData.length === 0) {
          // Create sample tasks for demonstration
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          
          const day3 = new Date(today);
          day3.setDate(today.getDate() + 2);
          
          const day4 = new Date(today);
          day4.setDate(today.getDate() + 3);
          
          const day5 = new Date(today);
          day5.setDate(today.getDate() + 4);
          
          // Create a sample project with realistic tasks
          const demoTasks = [
            {
              id: "1",
              text: "Task 1",
              start: today,
              duration: 3,
              progress: 60,
              type: "task"
            },
            {
              id: "2",
              text: "Task 2",
              start: tomorrow,
              duration: 3,
              progress: 40,
              type: "task"
            },
            {
              id: "3",
              text: "Task 3",
              start: day3,
              duration: 2,
              progress: 20,
              type: "task"
            },
            {
              id: "4",
              text: "Task 4",
              start: day4,
              duration: 2,
              progress: 0,
              type: "task"
            },
            {
              id: "5",
              text: "Task 5",
              start: day5,
              duration: 1,
              progress: 0,
              type: "task"
            }
          ];
          
          // Add dependencies between tasks
          const demoLinks = [
            { id: "1", source: "1", target: "2", type: "0" },
            { id: "2", source: "2", target: "3", type: "0" },
            { id: "3", source: "3", target: "4", type: "0" },
            { id: "4", source: "4", target: "5", type: "0" }
          ];
          
          setTasks(demoTasks);
          setLinks(demoLinks);
          setLoading(false);
          return;
        }
        
        // Transform the tasks into the format expected by the Gantt chart
        const transformedTasks = tasksData.map((task, index) => {
          // Calculate start and end dates based on task data
          const today = new Date();
          
          // For tasks with due date, use that as end date
          let endDate = task.due_date ? new Date(task.due_date) : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          // For start date, use today or calculate based on estimated hours if available
          let startDate;
          if (task.estimated_hours) {
            // Approximate 8 working hours per day
            const durationDays = Math.ceil(task.estimated_hours / 8);
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - durationDays);
          } else {
            // Default to start date being 1 day before end date
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 1);
          }
          
          // Make sure we have a valid column object
          const columnTitle = task.column && typeof task.column === 'object' ? 
            task.column.title : 
            (typeof task.column === 'string' ? task.column : 'To Do');
          
          // Map task statuses to progress percentage
          let progress = 0;
          switch (columnTitle) {
            case 'To Do':
              progress = 0;
              break;
            case 'In Progress':
              progress = 50;
              break;
            case 'Review':
              progress = 80;
              break;
            case 'Completed':
              progress = 100;
              break;
            default:
              progress = 0;
          }

          // Calculate duration in whole days
          const durationMs = endDate.getTime() - startDate.getTime();
          const durationDays = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));

          return {
            id: task.id ? task.id.toString() : `task_${index}`,
            text: task.title || "Untitled Task",
            start: startDate,
            duration: durationDays,
            progress: progress,
            type: "task"
          };
        });
        
        // Calculate links between sequential tasks
        const taskLinks = [];
        if (transformedTasks.length > 1) {
          for (let i = 0; i < transformedTasks.length - 1; i++) {
            taskLinks.push({
              id: `link_${i}`,
              source: transformedTasks[i].id,
              target: transformedTasks[i + 1].id,
              type: "0"
            });
          }
        }
        
        setTasks(transformedTasks);
        setLinks(taskLinks);
        setError(null);
      } catch (err) {
        console.error('Error loading tasks for Gantt chart:', err);
        
        // Create placeholder task when there's an error
        const today = new Date();
        
        const errorTask = {
          id: "error",
          text: "Error loading tasks. Please try again.",
          start: today,
          duration: 1,
          progress: 0,
          type: "task"
        };
        
        setTasks([errorTask]);
        setLinks([]);
        
        setError(err.detail || 'Failed to load tasks for Gantt chart');
        toast.error(err.detail || 'Failed to load task data');
      } finally {
        setLoading(false);
      }
    };
    
    if (workspaceSlug) {
      loadTasks();
    }
  }, [workspaceSlug]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error && (!tasks || tasks.length === 0)) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <div className="text-center">
          <p className="mb-2 text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      <Willow>
        <div className="h-full">
          <Gantt 
            tasks={tasks} 
            links={links}
            scales={scales}
            columns={columns}
            lightboxHeader="Task Details"
            editable={true}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onLinkCreate={handleLinkCreate}
            onLinkUpdate={handleLinkUpdate}
            onLinkDelete={handleLinkDelete}
          />
        </div>
      </Willow>
    </div>
  );
};

export default ProjectGanttChart; 
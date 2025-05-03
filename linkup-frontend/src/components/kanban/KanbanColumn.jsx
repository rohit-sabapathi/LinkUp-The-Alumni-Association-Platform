import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusIcon } from '@heroicons/react/24/outline';
import TaskCard from './TaskCard';

// Function to ensure consistent task ID format - must match KanbanBoard
const ensureStringId = (id) => {
  if (!id) return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return typeof id === 'string' ? id : String(id);
};

const KanbanColumn = ({ column, onAddTask, onEditTask }) => {
  const { id, title, tasks = [] } = column;
  
  // Sort tasks by order and ensure all tasks have string IDs for Draggable
  const sortedTasks = tasks?.length 
    ? [...tasks]
        .sort((a, b) => a.order - b.order)
        .map(task => {
          // Ensure ID is a string and preserve original_id if available
          const stringId = ensureStringId(task.id);
          return {
            ...task,
            id: stringId,
            original_id: task.original_id || task.id
          };
        })
    : [];
  
  // Log tasks for debugging
  if (sortedTasks.length > 0) {
    console.log(`Column ${title} tasks:`, sortedTasks.map(t => ({ id: t.id, title: t.title })));
  }
  
  return (
    <div className="flex flex-col bg-slate-800/40 rounded-lg border border-slate-700 w-80 flex-shrink-0">
      {/* Column header */}
      <div className="p-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-medium text-slate-200 truncate">
          {title}
          <span className="ml-2 px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full">
            {tasks?.length || 0}
          </span>
        </h3>
        <button 
          onClick={onAddTask}
          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-md transition-colors"
          title="Add task"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Column content - droppable area */}
      <Droppable droppableId={id} type="TASK">
        {(provided, snapshot) => (
          <div
            className={`flex-1 p-2 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-slate-700/30' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {sortedTasks.map((task, index) => {
              // Always use the consistent string ID
              const taskId = task.id;
              
              return (
                <Draggable key={taskId} draggableId={taskId} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`mb-2 ${snapshot.isDragging ? 'opacity-60' : ''}`}
                    >
                      <TaskCard 
                        task={task}
                        onEdit={() => onEditTask(task)}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            
            {/* Empty state - show when there are no tasks */}
            {tasks?.length === 0 && (
              <div className="mt-2 text-center py-6 px-3 border border-dashed border-slate-700 rounded-lg bg-slate-800/30">
                <p className="text-slate-500 text-sm">No tasks yet</p>
                <button 
                  onClick={onAddTask}
                  className="mt-2 text-indigo-400 text-sm hover:text-indigo-300"
                >
                  + Add a task
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn; 
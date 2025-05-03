import React from 'react';
import { 
  CalendarIcon, 
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500/20 text-red-400';
    case 'high':
      return 'bg-orange-500/20 text-orange-400';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'low':
      return 'bg-green-500/20 text-green-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
};

const TaskCard = ({ task, onEdit }) => {
  const { 
    title, 
    description, 
    priority, 
    due_date, 
    is_blocked,
    comments_count,
    assignments = [],
    attachment_url,
  } = task;

  // Format due date
  const formattedDate = due_date 
    ? new Date(due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : null;
  
  // Limit assignees shown
  const displayAssignees = assignments.slice(0, 3);
  const extraAssignees = assignments.length > 3 ? assignments.length - 3 : 0;

  // Handle edit button click and prevent propagation to the card
  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <div 
      className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
    >
      {/* Task header with edit button */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-slate-200 font-medium truncate">{title}</h4>
        <div className="flex items-center gap-2">
          {priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(priority)}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          )}
          <button 
            onClick={handleEditClick}
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-md transition-colors"
            title="Edit task"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Task description preview */}
      {description && (
        <p className="text-slate-400 text-sm line-clamp-2 mb-3">{description}</p>
      )}
      
      {/* Blocked indicator */}
      {is_blocked && (
        <div className="mb-3 flex items-center text-xs text-red-400 bg-red-900/20 py-1 px-2 rounded">
          <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1.5" />
          <span>Blocked</span>
        </div>
      )}
      
      {/* Task footer - metadata */}
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex space-x-3 text-slate-400">
          {/* Due date */}
          {formattedDate && (
            <div className="flex items-center" title="Due date">
              <CalendarIcon className="w-3.5 h-3.5 mr-1" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          {/* Comments */}
          {comments_count > 0 && (
            <div className="flex items-center" title="Comments">
              <ChatBubbleLeftIcon className="w-3.5 h-3.5 mr-1" />
              <span>{comments_count}</span>
            </div>
          )}
        </div>
        
        {/* Assignees */}
        {assignments.length > 0 && (
          <div className="flex -space-x-2">
            {displayAssignees.map((assignment, index) => (
              <div 
                key={assignment.id || index} 
                className="w-6 h-6 rounded-full bg-indigo-600/30 border border-slate-800 flex items-center justify-center text-xs text-indigo-400"
                title={assignment.assignee?.full_name || assignment.assignee?.username}
              >
                {assignment.assignee?.full_name?.charAt(0) || assignment.assignee?.username?.charAt(0) || '?'}
              </div>
            ))}
            
            {extraAssignees > 0 && (
              <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-xs text-slate-400">
                +{extraAssignees}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Attachment indicator */}
      {attachment_url && (
        <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span>Attachment</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard; 
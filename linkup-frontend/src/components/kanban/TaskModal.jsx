import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  PaperClipIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { updateTask, assignTask, unassignTask, addComment, fetchTaskMembers } from '../../services/kanbanService';

const TaskModal = ({ 
  isOpen, 
  task, 
  columnId, 
  onClose, 
  onSubmit,
  workspaceSlug 
}) => {
  const isEditMode = !!task;
  
  // Task form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    is_blocked: false,
    blocked_reason: '',
    estimated_hours: '',
    attachment: null,
    attachment_name: ''
  });
  
  // Other state
  const [loading, setLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Initialize form when editing
  useEffect(() => {
    if (isEditMode && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        is_blocked: task.is_blocked || false,
        blocked_reason: task.blocked_reason || '',
        estimated_hours: task.estimated_hours || '',
        attachment: null, // Can't pre-fill file input
        attachment_name: task.attachment_name || ''
      });
      
      // Show comments if there are any
      if (task.comments_count > 0) {
        setShowComments(true);
      }
    }
  }, [isEditMode, task]);
  
  // Load available members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        if (workspaceSlug) {
          console.log('Loading members for workspace:', workspaceSlug);
          const members = await fetchTaskMembers(workspaceSlug);
          console.log('Retrieved members:', members);
          
          // Make sure we have valid member data with user objects
          if (Array.isArray(members)) {
            // Since the API might return the members array with user objects nested inside
            // we need to check the structure and extract the user objects
            const validMembers = members.map(member => {
              // If the member has a 'user' property, it's from the ProjectMember model
              if (member.user) {
                return member.user;
              }
              // If the member doesn't have a 'user' property, it might already be a user object
              return member;
            });
            
            console.log('Processed members for assignment:', validMembers);
            setAvailableMembers(validMembers);
          } else {
            console.error('Invalid members data received:', members);
            setAvailableMembers([]);
          }
        }
      } catch (error) {
        console.error('Error loading members:', error);
        setAvailableMembers([]);
      }
    };
    
    loadMembers();
  }, [workspaceSlug]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files?.length) {
      setFormData({
        ...formData,
        attachment: files[0],
        attachment_name: files[0].name
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // For edit mode, update the task
      if (isEditMode) {
        await updateTask(task.id, formData);
      }
      
      // Call the parent component's onSubmit handler
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error(error.detail || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssign = async (memberId) => {
    if (!task) return;
    
    try {
      await assignTask(task.id, { assignee_id: memberId });
      toast.success('Member assigned successfully');
      setShowAssignModal(false);
      
      // Update task in parent component
      if (task && task.assignments) {
        const updatedMember = availableMembers.find(m => m.id === memberId);
        const newAssignment = {
          id: Date.now().toString(), // Temporary ID until refreshed
          task: task.id,
          assignee: updatedMember,
          assigned_at: new Date().toISOString()
        };
        
        onSubmit({
          ...task,
          assignments: [...(task.assignments || []), newAssignment]
        });
      }
    } catch (error) {
      console.error('Error assigning member:', error);
      toast.error('Failed to assign member');
    }
  };
  
  const handleUnassign = async (userId) => {
    if (!task) return;
    
    try {
      await unassignTask(task.id, userId);
      
      // Update task in parent component
      if (task && task.assignments) {
        const updatedAssignments = task.assignments.filter(a => a.assignee.id !== userId);
        
        onSubmit({
          ...task,
          assignments: updatedAssignments
        });
      }
      
      toast.success('Member unassigned successfully');
    } catch (error) {
      console.error('Error unassigning member:', error);
      toast.error('Failed to unassign member');
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    
    setCommentLoading(true);
    try {
      const comment = await addComment(task.id, { content: newComment });
      
      // Update task with new comment
      if (task && task.comments) {
        onSubmit({
          ...task,
          comments: [...(task.comments || []), comment],
          comments_count: (task.comments_count || 0) + 1
        });
      }
      
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-slate-200">
            {isEditMode ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Task title"
              />
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Task description"
              ></textarea>
            </div>
            
            {/* Priority and Due Date (side by side) */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="due_date" className="block text-sm font-medium text-slate-300 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
            
            {/* Estimated Hours */}
            <div className="mb-4">
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-slate-300 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                id="estimated_hours"
                name="estimated_hours"
                value={formData.estimated_hours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Estimated hours to complete"
              />
            </div>
            
            {/* Blocked Status */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="is_blocked"
                  name="is_blocked"
                  checked={formData.is_blocked}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-slate-600 rounded focus:ring-indigo-500 bg-slate-700"
                />
                <label htmlFor="is_blocked" className="ml-2 text-sm font-medium text-slate-300">
                  This task is blocked
                </label>
              </div>
              
              {formData.is_blocked && (
                <textarea
                  id="blocked_reason"
                  name="blocked_reason"
                  value={formData.blocked_reason}
                  onChange={handleInputChange}
                  placeholder="What's blocking this task?"
                  rows="2"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                ></textarea>
              )}
            </div>
            
            {/* Attachment */}
            <div className="mb-4">
              <label htmlFor="attachment" className="block text-sm font-medium text-slate-300 mb-1">
                Attachment
              </label>
              <div className="flex items-center">
                <label className="flex-1 cursor-pointer px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 text-sm">
                  <span className="flex items-center">
                    <PaperClipIcon className="w-5 h-5 mr-2" />
                    {formData.attachment_name || task?.attachment_name || 'Choose a file'}
                  </span>
                  <input
                    type="file"
                    id="attachment"
                    name="attachment"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </label>
                
                {(formData.attachment_name || task?.attachment_name) && (
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, attachment: null, attachment_name: ''})}
                    className="ml-2 p-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-70"
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
          
          {/* Assignments section - only in edit mode */}
          {isEditMode && task && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-200">Assigned Members</h3>
                <button
                  onClick={() => setShowAssignModal(!showAssignModal)}
                  className="text-sm flex items-center text-indigo-400 hover:text-indigo-300"
                >
                  <UserPlusIcon className="w-5 h-5 mr-1" />
                  Assign
                </button>
              </div>
              
              {task.assignments && task.assignments.length > 0 ? (
                <div className="space-y-3">
                  {task.assignments.map(assignment => (
                    <div 
                      key={assignment.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-700"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                          {assignment.assignee?.full_name?.charAt(0) || 
                            assignment.assignee?.username?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span className="text-slate-200">{assignment.assignee?.full_name || assignment.assignee?.username}</span>
                          <p className="text-xs text-slate-400">
                            Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassign(assignment.assignee.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-600"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 bg-slate-700/30 rounded-lg border border-dashed border-slate-600">
                  <p>No assigned members</p>
                </div>
              )}
              
              {/* Assign Member Modal */}
              {showAssignModal && (
                <div className="absolute inset-0 bg-black/20 flex items-start justify-center p-4 mt-4">
                  <div className="bg-slate-900 rounded-lg p-4 w-full max-w-md">
                    <h4 className="text-lg font-medium text-slate-200 mb-4">
                      Assign to member
                    </h4>
                    
                    {/* Show available members - members who aren't already assigned */}
                    {availableMembers && availableMembers.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                        {availableMembers
                          .filter(m => !task.assignments?.some(a => a.assignee?.id === m.id))
                          .map(member => (
                            <button
                              key={member.id}
                              onClick={() => handleAssign(member.id)}
                              className="flex items-center w-full p-2 hover:bg-slate-800 rounded"
                            >
                              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-3">
                                {member.first_name?.charAt(0) || member.username?.charAt(0) || '?'}
                              </div>
                              <span className="text-slate-300">{member.full_name || member.username}</span>
                            </button>
                          ))
                        }
                      </div>
                    )}
                    
                    {/* Message when no unassigned members are left */}
                    {availableMembers && availableMembers.length > 0 && 
                     task.assignments && 
                     !availableMembers.some(m => !task.assignments.some(a => a.assignee?.id === m.id)) && (
                      <div className="text-slate-400 text-center py-4">
                        All members have been assigned
                      </div>
                    )}
                    
                    {/* Message when no members are available at all */}
                    {(!availableMembers || availableMembers.length === 0) && (
                      <div className="text-slate-400 text-center py-4">
                        No members available to assign
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => setShowAssignModal(false)}
                        className="px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Comments section - only in edit mode */}
          {isEditMode && task && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-200">
                  Comments {task.comments_count > 0 && `(${task.comments_count})`}
                </h3>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  {showComments ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showComments && (
                <>
                  {/* Comment list */}
                  {task.comments && task.comments.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {task.comments.map(comment => (
                        <div key={comment.id} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                          <div className="flex items-center mb-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 mr-2">
                              {comment.author?.full_name?.charAt(0) || comment.author?.username?.charAt(0) || '?'}
                            </div>
                            <div className="text-sm">
                              <span className="text-slate-200 font-medium">
                                {comment.author?.full_name || comment.author?.username}
                              </span>
                              <span className="text-slate-400 ml-2">
                                {new Date(comment.created_at).toLocaleDateString()} 
                                {' '}
                                {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-300 text-sm whitespace-pre-line">{comment.content}</p>
                          
                          {comment.attachment_url && (
                            <div className="mt-2 pt-2 border-t border-slate-600 text-sm">
                              <a 
                                href={comment.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center text-indigo-400 hover:text-indigo-300"
                              >
                                <PaperClipIcon className="w-4 h-4 mr-1" />
                                <span>Attachment</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-400 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 mb-4">
                      <p>No comments yet</p>
                    </div>
                  )}
                  
                  {/* New comment form */}
                  <div className="flex space-x-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows="2"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    ></textarea>
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg h-min self-end"
                    >
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 
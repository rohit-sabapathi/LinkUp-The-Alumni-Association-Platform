import React, { useState, useEffect, useRef } from 'react';
import { 
  DocumentTextIcon, 
  PhotoIcon, 
  DocumentIcon, 
  PresentationChartBarIcon,
  ViewColumnsIcon,
  ArchiveBoxIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ResourceItem = ({ resource, onView, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Get appropriate icon for the file type
  const getFileIcon = () => {
    const fileType = resource.file_type?.toLowerCase() || 
                  resource.file_url?.split('.').pop().toLowerCase() || '';
    const iconClass = "w-8 h-8";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileType)) {
      return <PhotoIcon className={`${iconClass} text-blue-400`} />;
    }
    
    if (['pdf'].includes(fileType)) {
      return <DocumentTextIcon className={`${iconClass} text-red-400`} />;
    }
    
    if (['doc', 'docx', 'txt', 'rtf'].includes(fileType)) {
      return <DocumentTextIcon className={`${iconClass} text-blue-400`} />;
    }
    
    if (['ppt', 'pptx'].includes(fileType)) {
      return <PresentationChartBarIcon className={`${iconClass} text-orange-400`} />;
    }
    
    if (['xls', 'xlsx', 'csv'].includes(fileType)) {
      return <ViewColumnsIcon className={`${iconClass} text-green-400`} />;
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) {
      return <ArchiveBoxIcon className={`${iconClass} text-purple-400`} />;
    }
    
    return <DocumentIcon className={`${iconClass} text-slate-400`} />;
  };
  
  // Handle file size display
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(0)} KB`;
    } else {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg p-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="text-md font-medium text-slate-200 truncate" title={resource.title}>
              {resource.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {formatFileSize(resource.file_size)} • {new Date(resource.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-slate-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg z-10 border border-slate-700">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(resource);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  View
                </button>
                
                <a
                  href={resource.file_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download
                </a>
                
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(resource);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {resource.description && (
        <p className="mt-2 text-sm text-slate-400 line-clamp-2">{resource.description}</p>
      )}
    </div>
  );
};

export default ResourceItem;

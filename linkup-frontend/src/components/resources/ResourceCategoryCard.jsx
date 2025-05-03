import React from 'react';
import { FolderIcon, DocumentIcon } from '@heroicons/react/24/outline';

const ResourceCategoryCard = ({ category, onClick }) => {
  return (
    <div 
      className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg p-5 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="bg-indigo-600/20 p-3 rounded-lg">
          <FolderIcon className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-slate-200 truncate">{category.name}</h3>
          {category.resources_count !== undefined && (
            <p className="mt-1 text-sm text-slate-400 flex items-center">
              <DocumentIcon className="w-4 h-4 mr-1" />
              {category.resources_count} {category.resources_count === 1 ? 'resource' : 'resources'}
            </p>
          )}
        </div>
      </div>
      {category.description && (
        <p className="mt-3 text-sm text-slate-400 line-clamp-2">{category.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Created by {category.created_by?.username || 'Unknown'}</span>
        <span>{new Date(category.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default ResourceCategoryCard; 
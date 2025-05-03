import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  ChevronLeftIcon, 
  FolderPlusIcon, 
  ArrowUpTrayIcon,
  FolderIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

import ResourceCategoryCard from './ResourceCategoryCard';
import ResourceItem from './ResourceItem';
import FileViewer from './FileViewer';
import CreateCategoryModal from './CreateCategoryModal';
import UploadResourceModal from './UploadResourceModal';
import { 
  fetchWorkspaceResourceCategories, 
  createResourceCategory,
  fetchResourceCategoryById,
  fetchCategoryResources,
  uploadResource,
  deleteResource
} from '../../services/projectService';

const ResourceSharing = ({ workspace }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);
  const [view, setView] = useState('categories'); // 'categories', 'resources', 'viewResource'
  
  useEffect(() => {
    if (workspace?.slug) {
      loadCategories();
    }
  }, [workspace]);
  
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkspaceResourceCategories(workspace.slug);
      setCategories(data);
    } catch (error) {
      console.error('Error loading resource categories:', error);
      toast.error('Failed to load resource categories');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateCategory = async (categoryData) => {
    try {
      const newCategory = await createResourceCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      toast.success('Category created successfully');
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
      throw error;
    }
  };
  
  const handleSelectCategory = async (category) => {
    setSelectedCategory(category);
    setView('resources');
    loadCategoryResources(category.id);
  };
  
  const loadCategoryResources = async (categoryId) => {
    setLoadingResources(true);
    try {
      // First, get the latest category details
      const categoryDetails = await fetchResourceCategoryById(categoryId);
      setSelectedCategory(categoryDetails);
      
      // Then, get the resources in this category
      const resourcesData = await fetchCategoryResources(categoryId);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoadingResources(false);
    }
  };
  
  const handleUploadResource = async (resourceData) => {
    try {
      const uploadData = {
        title: resourceData.title,
        description: resourceData.description,
        file: resourceData.file,
        categoryId: selectedCategory.id
      };
      
      const newResource = await uploadResource(uploadData);
      setResources(prev => [newResource, ...prev]);
      toast.success('Resource uploaded successfully');
      return newResource;
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource');
      throw error;
    }
  };
  
  const handleDeleteResource = async (resource) => {
    if (window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      try {
        await deleteResource(resource.id);
        setResources(prev => prev.filter(r => r.id !== resource.id));
        
        // If viewing this resource, go back to resources view
        if (selectedResource && selectedResource.id === resource.id) {
          setSelectedResource(null);
          setView('resources');
        }
        
        toast.success('Resource deleted successfully');
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource');
      }
    }
  };
  
  const handleViewResource = (resource) => {
    setSelectedResource(resource);
    setView('viewResource');
  };
  
  const renderContent = () => {
    // Loading state
    if (loading && view === 'categories') {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-220px)]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }
    
    // Categories view
    if (view === 'categories') {
      return (
        <>
          {/* Header with add category button */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-200">Resource Categories</h3>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
            >
              <FolderPlusIcon className="w-4 h-4 mr-1" />
              <span>New Category</span>
            </button>
          </div>
          
          {/* Categories grid */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <ResourceCategoryCard 
                  key={category.id} 
                  category={category}
                  onClick={() => handleSelectCategory(category)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-8 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-slate-800 rounded-full mb-3">
                <FolderIcon className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Resource Categories Yet</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Create categories to organize files, documents, and other resources for your team
              </p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg inline-flex items-center transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-1" />
                <span>Create First Category</span>
              </button>
            </div>
          )}
        </>
      );
    }
    
    // Resources view
    if (view === 'resources') {
      return (
        <>
          {/* Header with back and upload buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => {
                  setView('categories');
                  setSelectedCategory(null);
                }}
                className="mr-3 p-1.5 hover:bg-slate-700 rounded-full transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
              </button>
              <h3 className="text-lg font-semibold text-slate-200">{selectedCategory?.name}</h3>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
              <span>Upload</span>
            </button>
          </div>
          
          {/* Category description if available */}
          {selectedCategory?.description && (
            <p className="text-slate-400 mb-6">{selectedCategory.description}</p>
          )}
          
          {/* Loading resources */}
          {loadingResources ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Resources grid */}
              {resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map(resource => (
                    <ResourceItem 
                      key={resource.id} 
                      resource={resource}
                      onView={handleViewResource}
                      onDelete={handleDeleteResource}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-8 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-slate-800 rounded-full mb-3">
                    <DocumentTextIcon className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No Resources Yet</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    Upload documents, images, or other files to share with your team
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg inline-flex items-center transition-colors"
                  >
                    <ArrowUpTrayIcon className="w-5 h-5 mr-1" />
                    <span>Upload First Resource</span>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      );
    }
    
    // View resource
    if (view === 'viewResource' && selectedResource) {
      return (
        <>
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => {
                setView('resources');
                setSelectedResource(null);
              }}
              className="mr-3 p-1.5 hover:bg-slate-700 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-lg font-semibold text-slate-200">Resource Viewer</h3>
          </div>
          
          {/* File Viewer */}
          <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-6">
            <FileViewer file={selectedResource} />
          </div>
        </>
      );
    }
    
    return null;
  };
  
  return (
    <div className="h-full">
      {renderContent()}
      
      {/* Modals */}
      <CreateCategoryModal 
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleCreateCategory}
        workspaceId={workspace?.id}
      />
      
      <UploadResourceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUploadResource}
        categoryId={selectedCategory?.id}
      />
    </div>
  );
};

export default ResourceSharing; 
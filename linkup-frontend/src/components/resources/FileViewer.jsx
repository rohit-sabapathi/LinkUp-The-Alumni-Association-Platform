import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  PhotoIcon, 
  DocumentIcon, 
  PresentationChartBarIcon,
  ViewColumnsIcon,
  ArchiveBoxIcon 
} from '@heroicons/react/24/outline';

const FileViewer = ({ file }) => {
  const [error, setError] = useState(false);
  
  if (!file || !file.file_url) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 flex flex-col items-center justify-center">
        <DocumentIcon className="w-16 h-16 text-slate-400 mb-4" />
        <p className="text-slate-400">File not available</p>
      </div>
    );
  }
  
  const fileType = file.file_type || file.file_url.split('.').pop().toLowerCase();

  // Function to handle file download
  const handleDownload = async () => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.title || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct link
      window.open(file.file_url, '_blank');
    }
  };

  const renderFileContent = () => {
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileType)) {
      return (
        <div className="flex items-center justify-center">
          {!error ? (
            <img 
              src={file.file_url} 
              alt={file.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={() => setError(true)}
            />
          ) : (
            <div className="bg-slate-800 rounded-lg p-8 flex flex-col items-center justify-center">
              <PhotoIcon className="w-16 h-16 text-slate-400 mb-4" />
              <p className="text-slate-400">Unable to display image</p>
            </div>
          )}
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="bg-slate-800 rounded-lg p-8 flex flex-col items-center justify-center">
          <DocumentTextIcon className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-slate-300 mb-4">PDF files open in a new tab for best viewing experience</p>
          <button 
            onClick={() => window.open(file.file_url, '_blank')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
          >
            View PDF
          </button>
        </div>
      );
    }

    if (['mp4', 'webm', 'ogg'].includes(fileType)) {
      return (
        <div className="w-full flex items-center justify-center">
          <video 
            controls 
            className="max-w-full max-h-[70vh] rounded-lg"
          >
            <source src={file.file_url} type={`video/${fileType}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType)) {
      const officeViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true`;
      return (
        <div className="w-full h-[70vh] bg-slate-800 rounded-lg overflow-hidden">
          <iframe 
            src={officeViewerUrl} 
            title={file.title}
            className="w-full h-full"
            frameBorder="0"
          />
        </div>
      );
    }

    return (
      <div className="bg-slate-800 rounded-lg p-8 flex flex-col items-center justify-center">
        {getFileIcon()}
        <p className="mt-4 text-slate-300">{file.title}</p>
        <p className="text-slate-500 text-sm mb-4">This file type cannot be previewed</p>
        <button 
          onClick={handleDownload}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
        >
          Download File
        </button>
      </div>
    );
  };

  const getFileIcon = () => {
    const iconClass = "w-16 h-16";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileType)) {
      return <PhotoIcon className={`${iconClass} text-blue-400`} />;
    }

    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(fileType)) {
      return <DocumentTextIcon className={`${iconClass} text-red-400`} />;
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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-200">{file.title}</h3>
        <button 
          onClick={handleDownload}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm transition-colors"
        >
          Download
        </button>
      </div>

      {file.description && (
        <p className="text-slate-400 mb-4">{file.description}</p>
      )}

      <div className="rounded-lg overflow-hidden border border-slate-700">
        {renderFileContent()}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-slate-500">
            Uploaded by {file.uploaded_by?.username || 'Unknown'} on {new Date(file.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="text-sm text-slate-500">
          {file.file_size && (
            <span>{(file.file_size / 1024).toFixed(0)} KB</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;

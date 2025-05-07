import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createArticle, updateArticle } from '../../services/articleService';
import axiosInstance from '../../services/axios';
import { API_BASE_URL } from '../../config';

const ArticleEditor = ({ article, onBack, onSuccess }) => {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [tags, setTags] = useState(article?.tags?.map(tag => tag.name || tag) || []);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load available tags
    const fetchTags = async () => {
      setTagsLoading(true);
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/api/knowledge-hub/tags/`);
        setAvailableTags(response.data.map(tag => tag.name));
      } catch (err) {
        console.error('Error fetching tags:', err);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const articleData = {
        title,
        content,
        tags,
      };

      let response;
      if (article?.id) {
        response = await updateArticle(article.id, articleData);
      } else {
        response = await createArticle(articleData);
      }

      console.log('Article saved successfully:', response.data);
      onSuccess();
    } catch (err) {
      console.error('Error saving article:', err);
      
      // Improved error handling
      let errorMessage = 'An error occurred while saving the article. Please try again.';
      
      if (err.response) {
        // Server responded with an error status code
        if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'object' && err.response.data !== null) {
          // Handle Django validation errors (which come as an object of field errors)
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = fieldErrors || errorMessage;
        } else if (err.response.data) {
          errorMessage = err.response.data.toString();
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      // Disable MutationObserver that triggers the warning in Chrome
      matchVisual: false,
    }
  };

  // Custom CSS for Quill editor for dark theme
  const quillStyles = {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    color: 'white',
    borderRadius: '0.5rem',
    border: '1px solid rgba(51, 65, 85, 0.5)',
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(15, 23, 42, 0.7)', // slate-900 with opacity
        borderRadius: '0.75rem',
        border: '1px solid rgba(51, 65, 85, 0.5)', // slate-700 with opacity
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={onBack} 
          sx={{ 
            mr: 2, 
            color: '#e2e8f0', // slate-200
            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ color: '#e2e8f0' }}>
          {article ? 'Edit Article' : 'Create New Article'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 3 }}
          InputProps={{
            sx: {
              color: 'white', 
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3b82f6',
              },
            }
          }}
          InputLabelProps={{
            sx: { color: 'rgba(255, 255, 255, 0.7)' }
          }}
        />

        <Autocomplete
          multiple
          freeSolo
          loading={tagsLoading}
          options={availableTags}
          value={tags}
          onChange={(_, newValue) => setTags(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Add tags"
              sx={{ mb: 3 }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {tagsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
                sx: {
                  color: 'white', 
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                  },
                }
              }}
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index });
              const { key, ...otherProps } = tagProps;
              
              return (
                <Box
                  key={key}
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    m: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd', // blue-300
                    fontSize: '0.875rem',
                  }}
                  {...otherProps}
                >
                  {option}
                </Box>
              );
            })
          }
        />

        <Box sx={{ mb: 3 }}>
          {/* Add a small note for the editor */}
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#94a3b8' }}>
            Format your content with the toolbar options. You can add headings, lists, and embed media.
          </Typography>
          <div className="quill-editor-dark">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              style={{ ...quillStyles, height: '300px', marginBottom: '50px' }}
            />
          </div>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={loading}
            sx={{
              borderColor: 'rgba(226, 232, 240, 0.5)', // slate-200 with opacity
              color: '#e2e8f0', // slate-200
              '&:hover': {
                borderColor: '#e2e8f0',
                backgroundColor: 'rgba(226, 232, 240, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !title || !content}
            sx={{
              backgroundColor: '#3b82f6', // blue-500
              '&:hover': {
                backgroundColor: '#2563eb', // blue-600
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(59, 130, 246, 0.3)', // blue-500 with opacity
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : article ? 'Update Article' : 'Publish Article'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ArticleEditor; 
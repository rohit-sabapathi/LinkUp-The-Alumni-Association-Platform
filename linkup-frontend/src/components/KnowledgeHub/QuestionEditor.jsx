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
import { createQuestion, updateQuestion } from '../../services/questionService';
import axiosInstance from '../../services/axios';
import { API_BASE_URL } from '../../config';

const QuestionEditor = ({ question, onBack, onSuccess }) => {
  const [title, setTitle] = useState(question?.title || '');
  const [content, setContent] = useState(question?.content || '');
  const [tags, setTags] = useState(question?.tags?.map(tag => tag.name || tag) || []);
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
      const questionData = {
        title,
        content,
        tags,
      };

      let response;
      if (question?.id) {
        response = await updateQuestion(question.id, questionData);
      } else {
        response = await createQuestion(questionData);
      }

      console.log('Question saved successfully:', response.data);
      onSuccess();
    } catch (err) {
      console.error('Error saving question:', err);
      
      // Improved error handling
      let errorMessage = 'An error occurred while saving the question. Please try again.';
      
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
      ['link', 'image', 'code-block'],
      ['clean']
    ],
    clipboard: {
      // Toggle off the automatic handling of HTML paste content
      matchVisual: false
    },
    keyboard: {
      bindings: {}
    }
  };

  // Prevent deprecated MutationEvent warnings
  React.useEffect(() => {
    // Disable console warnings for MutationEvent deprecation warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('MutationEvent') || 
           args[0].includes('mutationobserver'))) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

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
          {question ? 'Edit Question' : 'Ask a New Question'}
        </Typography>
      </Box>

      {error && (
        <Typography 
          color="error" 
          variant="body2" 
          sx={{ mb: 2, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}
        >
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Question Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 3 }}
          placeholder="Enter your question title"
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
              '& input::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
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
          sx={{
            '& .MuiChip-root': {
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: 'white',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white'
                }
              }
            },
            '& .MuiAutocomplete-endAdornment': {
              '& .MuiButtonBase-root': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }}
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
                  '& input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }
              }}
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
            />
          )}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
          Describe your question in detail
        </Typography>
        
        <Box 
          sx={{ 
            mb: 3,
            '.ql-toolbar': {
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              color: 'white',
              borderColor: 'rgba(51, 65, 85, 0.8)',
              borderTopLeftRadius: '0.5rem',
              borderTopRightRadius: '0.5rem',
            },
            '.ql-container': {
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              color: 'white',
              borderColor: 'rgba(51, 65, 85, 0.8)',
              borderBottomLeftRadius: '0.5rem',
              borderBottomRightRadius: '0.5rem',
              fontSize: '16px',
              minHeight: '200px',
            },
            '.ql-editor': {
              minHeight: '200px',
              color: 'white',
            },
            '.ql-editor.ql-blank::before': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
            },
            // Toolbar icons
            '.ql-picker': {
              color: 'white',
            },
            '.ql-stroke': {
              stroke: 'white',
            },
            '.ql-fill': {
              fill: 'white',
            },
            '.ql-picker-options': {
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              borderColor: 'rgba(51, 65, 85, 0.8)',
            },
          }}
        >
          <ReactQuill
            value={content}
            onChange={(value) => {
              // Use a controlled approach to set the content
              setContent(value);
            }}
            modules={modules}
            placeholder="Explain your question in detail. You can format text, add links, and code blocks."
            theme="snow"
            preserveWhitespace={true}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={onBack}
            sx={{
              color: '#e2e8f0',
              borderColor: '#64748b',
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: 'rgba(100, 116, 139, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#3b82f6', // blue-500
              '&:hover': {
                backgroundColor: '#2563eb', // blue-600
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : question ? 'Update Question' : 'Post Question'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default QuestionEditor; 
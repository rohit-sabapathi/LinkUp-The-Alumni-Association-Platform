import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Chip, 
  Grid, 
  CircularProgress,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormGroup,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import QuestionCard from './QuestionCard';
import { getQuestions } from '../../services/questionService';
import { useAuth } from '../../contexts/AuthContext';

const DiscussionForum = ({ questions: initialQuestions, loading, onQuestionClick, onCreateQuestion }) => {
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  
  // Extract all unique tags from questions
  const allTags = Array.from(
    new Set(
      initialQuestions?.flatMap(question => 
        question.tags?.map(tag => tag.name) || []
      ) || []
    )
  ).sort();
  
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params = {};
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (selectedTag) {
        params.tag = selectedTag;
      }
      
      params.sort_by = sortOption;
      
      const response = await getQuestions(params);
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Error searching questions:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleTagChange = (e) => {
    setSelectedTag(e.target.value);
    handleSearch();
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    handleSearch();
  };
  
  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    handleSearch();
  };

  return (
    <Box>
      {/* Header with title and action button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
          Discussion Forum: Ask & Discuss
        </Typography>
        {user && (
          <Button
            variant="contained"
            color="primary"
            onClick={onCreateQuestion}
            sx={{
              backgroundColor: '#3b82f6', // blue-500
              '&:hover': {
                backgroundColor: '#2563eb', // blue-600
              },
            }}
          >
            Ask Question
          </Button>
        )}
      </Box>

      {/* Title only shown when we have no data yet */}
      {questions?.length === 0 && !loading && !isSearching && (
        <Typography 
          variant="h5" 
          sx={{ textAlign: 'center', my: 8, color: 'white' }}
        >
          No questions found. Be the first to ask a question!
        </Typography>
      )}
      
      {/* Search and filter options */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', // slate-900 with opacity
          borderRadius: '0.75rem',
          border: '1px solid rgba(51, 65, 85, 0.5)', // slate-700 with opacity
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search questions..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                endAdornment: isSearching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : null,
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
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="tag-select-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Filter by Tag
              </InputLabel>
              <Select
                labelId="tag-select-label"
                value={selectedTag}
                onChange={handleTagChange}
                label="Filter by Tag"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(51, 65, 85, 0.8)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(59, 130, 246, 0.4)',
                          '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.5)',
                          }
                        }
                      }
                    }
                  }
                }}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                  },
                }}
              >
                <MenuItem value="" sx={{ color: 'white' }}>All Tags</MenuItem>
                {allTags.map(tag => (
                  <MenuItem key={tag} value={tag} sx={{ color: 'white' }}>{tag}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="sort-select-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Sort By
              </InputLabel>
              <Select
                labelId="sort-select-label"
                value={sortOption}
                onChange={handleSortChange}
                label="Sort By"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(51, 65, 85, 0.8)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(59, 130, 246, 0.4)',
                          '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.5)',
                          }
                        }
                      }
                    }
                  }
                }}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                  },
                }}
              >
                <MenuItem value="recent" sx={{ color: 'white' }}>Most Recent</MenuItem>
                <MenuItem value="votes" sx={{ color: 'white' }}>Most Upvoted</MenuItem>
                <MenuItem value="unanswered" sx={{ color: 'white' }}>Unanswered</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Display popular tags */}
        {allTags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'white' }}>
              Popular tags:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {allTags.slice(0, 8).map(tag => (
                <Chip 
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => handleTagClick(tag)}
                  sx={{ 
                    backgroundColor: selectedTag === tag ? '#3b82f6' : 'rgba(51, 65, 85, 0.8)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: selectedTag === tag ? '#2563eb' : 'rgba(71, 85, 105, 0.9)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Loading indicator */}
      {(loading || isSearching) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={50} sx={{ color: '#3b82f6' }} />
        </Box>
      )}
      
      {/* List of questions */}
      {!loading && !isSearching && questions?.length > 0 && (
        <Grid container spacing={3}>
          {questions.map(question => (
            <Grid item xs={12} key={question.id}>
              <QuestionCard 
                question={question} 
                onClick={() => onQuestionClick(question)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DiscussionForum; 
import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Autocomplete,
  Chip,
  CircularProgress,
  Typography,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import ArticleCard from './ArticleCard';

const ArticleFeed = ({ articles, loading, onArticleClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Extract all unique tags from articles and normalize them
  const allTags = articles.reduce((acc, article) => {
    if (!article.tags?.length) return acc;
    
    article.tags.forEach(tag => {
      const tagName = typeof tag === 'object' ? tag.name : tag;
      if (!acc.includes(tagName)) {
        acc.push(tagName);
      }
    });
    
    return acc;
  }, []);

  const filteredArticles = articles.filter(article => {
    // Check if title matches search query
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if article has all selected tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(selectedTag => {
        return article.tags && article.tags.some(tag => {
          const tagName = typeof tag === 'object' ? tag.name : tag;
          return tagName === selectedTag;
        });
      });
    
    return matchesSearch && matchesTags;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Articles"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={allTags}
              value={selectedTags}
              onChange={(_, newValue) => setSelectedTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Tags"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
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
                    <Chip
                      key={key}
                      label={option}
                      {...otherProps}
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        borderColor: '#3b82f6',
                        color: 'white',
                        '& .MuiChip-deleteIcon': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': { color: 'white' }
                        }
                      }}
                    />
                  );
                })
              }
              sx={{
                '& .MuiAutocomplete-tag': {
                  backgroundColor: 'rgba(59, 130, 246, 0.2)'
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {filteredArticles.length === 0 ? (
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          No articles found
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredArticles.map((article) => (
            <Grid item xs={12} md={6} lg={4} key={article.id}>
              <ArticleCard
                article={article}
                onClick={() => onArticleClick(article)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ArticleFeed; 
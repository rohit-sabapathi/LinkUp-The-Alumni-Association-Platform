import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Alert } from '@mui/material';
import ArticleFeed from './ArticleFeed';
import ArticleEditor from './ArticleEditor';
import ArticleReader from './ArticleReader';
import { useAuth } from '../../contexts/AuthContext';
import { getArticles } from '../../services/articleService';

const KnowledgeHub = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await getArticles();
      setArticles(response.data || []);  // Provide empty array fallback
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles. Please try again later.');
      // Use empty array on error
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setIsCreating(false);
    setIsEditing(false);
    setArticleToEdit(null);
  };

  const handleCreateClick = () => {
    setSelectedArticle(null);
    setIsCreating(true);
    setIsEditing(false);
    setArticleToEdit(null);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    setIsCreating(false);
    setIsEditing(false);
    setArticleToEdit(null);
  };

  // This function now handles both updates and edit requests
  const handleUpdateOrEdit = (article, shouldEdit = false) => {
    if (shouldEdit && article) {
      // User wants to edit the article
      setIsEditing(true);
      setArticleToEdit(article);
      setSelectedArticle(null);
      setIsCreating(false);
    } else {
      // Just a regular update (refresh data)
      fetchArticles();
    }
  };

  // Center loading spinner using full height while loading for better UX
  if (loading && !isCreating && !isEditing && !selectedArticle) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#3b82f6' }} size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Show error alert if there was an error fetching articles */}
      {error && !isCreating && !isEditing && !selectedArticle && (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      )}

      {!selectedArticle && !isCreating && !isEditing && (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" color="primary.main" fontWeight="bold">
            Knowledge Hub
          </Typography>
          {user && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateClick}
              sx={{
                backgroundColor: '#3b82f6', // blue-500
                '&:hover': {
                  backgroundColor: '#2563eb', // blue-600
                },
              }}
            >
              Create Article
            </Button>
          )}
        </Box>
      )}

      {isCreating || isEditing ? (
        <ArticleEditor
          article={isEditing ? articleToEdit : null}
          onBack={handleBackToList}
          onSuccess={() => {
            setIsCreating(false);
            setIsEditing(false);
            setArticleToEdit(null);
            fetchArticles();
          }}
        />
      ) : selectedArticle ? (
        <ArticleReader
          article={selectedArticle}
          onBack={handleBackToList}
          onUpdate={handleUpdateOrEdit}
        />
      ) : (
        <ArticleFeed
          articles={articles}
          loading={loading}
          onArticleClick={handleArticleClick}
        />
      )}
    </Container>
  );
};

export default KnowledgeHub; 
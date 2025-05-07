import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import ArticleFeed from '../KnowledgeHub/ArticleFeed';
import ArticleEditor from '../KnowledgeHub/ArticleEditor';
import ArticleReader from '../KnowledgeHub/ArticleReader';
import { useAuth } from '../../contexts/AuthContext';
import { getArticles } from '../../services/articleService';
import { Link } from 'react-router-dom';

const ArticlesAndCaseStudy = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
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
      setArticles(response.data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles. Please try again later.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setIsCreatingArticle(false);
    setIsEditingArticle(false);
    setArticleToEdit(null);
  };

  const handleCreateArticle = () => {
    setSelectedArticle(null);
    setIsCreatingArticle(true);
    setIsEditingArticle(false);
    setArticleToEdit(null);
  };

  const handleBackToArticles = () => {
    setSelectedArticle(null);
    setIsCreatingArticle(false);
    setIsEditingArticle(false);
    setArticleToEdit(null);
  };

  const handleArticleUpdateOrEdit = (article, shouldEdit = false) => {
    if (shouldEdit && article) {
      setIsEditingArticle(true);
      setArticleToEdit(article);
      setSelectedArticle(null);
      setIsCreatingArticle(false);
    } else {
      fetchArticles();
    }
  };

  if (loading && !isCreatingArticle && !isEditingArticle && !selectedArticle) {
    return <div className="flex justify-center py-8"><CircularProgress sx={{ color: '#3b82f6' }} size={60} /></div>;
  }

  return (
    <div>
      {error && !isCreatingArticle && !isEditingArticle && !selectedArticle && (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      )}

      {/* Header with navigation and action button */}
      {!selectedArticle && !isCreatingArticle && !isEditingArticle && (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="text" 
              component={Link}
              to="/smartnest/knowledge-hub"
              sx={{ 
                color: '#e2e8f0',
                mr: 2,
                '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
              }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1" color="primary.main" fontWeight="bold">
              Articles & Case Studies
            </Typography>
          </Box>
          {user && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateArticle}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb',
                },
              }}
            >
              Create Article
            </Button>
          )}
        </Box>
      )}

      {/* Articles Content */}
      {isCreatingArticle || isEditingArticle ? (
        <ArticleEditor
          article={isEditingArticle ? articleToEdit : null}
          onBack={handleBackToArticles}
          onSuccess={() => {
            setIsCreatingArticle(false);
            setIsEditingArticle(false);
            setArticleToEdit(null);
            fetchArticles();
          }}
        />
      ) : selectedArticle ? (
        <ArticleReader
          article={selectedArticle}
          onBack={handleBackToArticles}
          onUpdate={handleArticleUpdateOrEdit}
        />
      ) : (
        <ArticleFeed
          articles={articles}
          loading={loading}
          onArticleClick={handleArticleClick}
        />
      )}
    </div>
  );
};

export default ArticlesAndCaseStudy; 
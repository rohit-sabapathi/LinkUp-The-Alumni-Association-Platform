import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Alert, Card, CardContent, CardMedia } from '@mui/material';
import ArticleFeed from './ArticleFeed';
import ArticleEditor from './ArticleEditor';
import ArticleReader from './ArticleReader';
import DiscussionForum from './DiscussionForum';
import QuestionEditor from './QuestionEditor';
import QuestionDetail from './QuestionDetail';
import { useAuth } from '../../contexts/AuthContext';
import { getArticles } from '../../services/articleService';
import { getQuestions } from '../../services/questionService';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

const KnowledgeHub = () => {
  // Articles state
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesError, setArticlesError] = useState(null);
  
  // Questions state
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  
  // UI state
  const [activeView, setActiveView] = useState('home'); // 'home', 'articles', 'discussion'
  
  const { user } = useAuth();

  const fetchArticles = async () => {
    setArticlesError(null);
    setLoadingArticles(true);
    try {
      const response = await getArticles();
      setArticles(response.data || []);  // Provide empty array fallback
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticlesError('Failed to load articles. Please try again later.');
      // Use empty array on error
      setArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };
  
  const fetchQuestions = async () => {
    setQuestionsError(null);
    setLoadingQuestions(true);
    try {
      const response = await getQuestions();
      setQuestions(response.data || []);  // Provide empty array fallback
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestionsError('Failed to load questions. Please try again later.');
      // Use empty array on error
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setIsCreatingArticle(false);
    setIsEditingArticle(false);
    setArticleToEdit(null);
    
    // Clear question state
    setSelectedQuestion(null);
    setIsCreatingQuestion(false);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
  };
  
  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setIsCreatingQuestion(false);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
    
    // Clear article state
    setSelectedArticle(null);
    setIsCreatingArticle(false);
    setIsEditingArticle(false);
    setArticleToEdit(null);
  };

  const handleCreateArticleClick = () => {
    setSelectedArticle(null);
    setIsCreatingArticle(true);
    setIsEditingArticle(false);
    setArticleToEdit(null);
    
    // Clear question state
    setSelectedQuestion(null);
    setIsCreatingQuestion(false);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
  };
  
  const handleCreateQuestionClick = () => {
    setSelectedQuestion(null);
    setIsCreatingQuestion(true);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
    
    // Clear article state
    setSelectedArticle(null);
    setIsCreatingArticle(false);
    setIsEditingArticle(false);
    setArticleToEdit(null);
  };

  const handleBackToArticles = () => {
    setSelectedArticle(null);
    setIsCreatingArticle(false);
    setIsEditingArticle(false);
    setArticleToEdit(null);
  };
  
  const handleBackToQuestions = () => {
    setSelectedQuestion(null);
    setIsCreatingQuestion(false);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
  };

  const handleBackToHome = () => {
    setActiveView('home');
    handleBackToArticles();
    handleBackToQuestions();
  };

  // This function now handles both updates and edit requests for articles
  const handleArticleUpdateOrEdit = (article, shouldEdit = false) => {
    if (shouldEdit && article) {
      // User wants to edit the article
      setIsEditingArticle(true);
      setArticleToEdit(article);
      setSelectedArticle(null);
      setIsCreatingArticle(false);
    } else {
      // Just a regular update (refresh data)
      fetchArticles();
    }
  };
  
  // This function handles both updates and edit requests for questions
  const handleQuestionUpdateOrEdit = (question, shouldEdit = false) => {
    if (shouldEdit && question) {
      // User wants to edit the question
      setIsEditingQuestion(true);
      setQuestionToEdit(question);
      setSelectedQuestion(null);
      setIsCreatingQuestion(false);
    } else {
      // Just a regular update (refresh data)
      fetchQuestions();
    }
  };
  
  const handleArticlesCardClick = () => {
    setActiveView('articles');
    fetchArticles();
  };
  
  const handleDiscussionCardClick = () => {
    setActiveView('discussion');
    fetchQuestions();
  };

  // Render the main home page with feature cards
  const renderHomePage = () => {
    return (
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" color="primary.main" fontWeight="bold" sx={{ mb: 2 }}>
            Knowledge Hub
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Articles Card */}
          <Card 
            sx={{ 
              flex: 1, 
              cursor: 'pointer',
              borderRadius: '0.75rem',
              backgroundColor: '#663c00', // Brown background for Articles
              minHeight: '200px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.3)',
              },
            }}
            onClick={handleArticlesCardClick}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, textAlign: 'center' }}>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                <MenuBookIcon sx={{ fontSize: 40, color: '#fcd34d' }} />
              </Box>
              <Typography variant="h4" component="h2" color="#fcd34d" fontWeight="bold" sx={{ mb: 2 }}>
                Articles and Case Study
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 2 }}>
                Read and share valuable articles and case studies from the alumni community
              </Typography>
            </CardContent>
          </Card>
          
          {/* Discussion Forum Card */}
          <Card 
            sx={{ 
              flex: 1, 
              cursor: 'pointer',
              borderRadius: '0.75rem',
              backgroundColor: '#083e69', // Navy background for Discussion Forum
              minHeight: '200px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.3)',
              },
            }}
            onClick={handleDiscussionCardClick}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, textAlign: 'center' }}>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                <QuestionAnswerIcon sx={{ fontSize: 40, color: '#93c5fd' }} />
              </Box>
              <Typography variant="h4" component="h2" color="#93c5fd" fontWeight="bold" sx={{ mb: 2 }}>
                Discussion Forum: Ask & Discuss
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 2 }}>
                Post questions and discuss career-related topics with alumni and students
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  };

  const renderArticlesPage = () => {
    const showLoading = loadingArticles && !isCreatingArticle && !isEditingArticle && !selectedArticle;
    
    if (showLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#3b82f6' }} size={60} />
        </Box>
      );
    }
    
    return (
      <Box>
        {articlesError && !isCreatingArticle && !isEditingArticle && !selectedArticle && (
          <Alert severity="error" sx={{ mb: 4 }}>{articlesError}</Alert>
        )}

        {/* Header with Back and Action buttons */}
        {!selectedArticle && !isCreatingArticle && !isEditingArticle && (
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="text" 
                onClick={handleBackToHome}
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
                onClick={handleCreateArticleClick}
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
            loading={loadingArticles}
            onArticleClick={handleArticleClick}
          />
        )}
      </Box>
    );
  };

  const renderDiscussionPage = () => {
    const showLoading = loadingQuestions && !isCreatingQuestion && !isEditingQuestion && !selectedQuestion;
    
    if (showLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#3b82f6' }} size={60} />
        </Box>
      );
    }
    
    return (
      <Box>
        {questionsError && !isCreatingQuestion && !isEditingQuestion && !selectedQuestion && (
          <Alert severity="error" sx={{ mb: 4 }}>{questionsError}</Alert>
        )}

        {/* Header with Back and Action buttons */}
        {!selectedQuestion && !isCreatingQuestion && !isEditingQuestion && (
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="text" 
                onClick={handleBackToHome}
                sx={{ 
                  color: '#e2e8f0',
                  mr: 2,
                  '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                }}
              >
                Back
              </Button>
              <Typography variant="h4" component="h1" color="primary.main" fontWeight="bold">
                Discussion Forum: Ask & Discuss
              </Typography>
            </Box>
            {user && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateQuestionClick}
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
        )}

        {/* Discussion Forum Content */}
        {isCreatingQuestion || isEditingQuestion ? (
          <QuestionEditor
            question={isEditingQuestion ? questionToEdit : null}
            onBack={handleBackToQuestions}
            onSuccess={() => {
              setIsCreatingQuestion(false);
              setIsEditingQuestion(false);
              setQuestionToEdit(null);
              fetchQuestions();
            }}
          />
        ) : selectedQuestion ? (
          <QuestionDetail
            question={selectedQuestion}
            onBack={handleBackToQuestions}
            onUpdate={handleQuestionUpdateOrEdit}
          />
        ) : (
          <DiscussionForum
            questions={questions}
            loading={loadingQuestions}
            onQuestionClick={handleQuestionClick}
          />
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg">
      {activeView === 'home' && renderHomePage()}
      {activeView === 'articles' && renderArticlesPage()}
      {activeView === 'discussion' && renderDiscussionPage()}
    </Container>
  );
};

export default KnowledgeHub; 
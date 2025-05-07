import React from 'react';
import DiscussionForumComponent from '../KnowledgeHub/DiscussionForum';
import QuestionEditor from '../KnowledgeHub/QuestionEditor';
import QuestionDetail from '../KnowledgeHub/QuestionDetail';
import { useState, useEffect } from 'react';
import { getQuestions } from '../../services/questionService';
import { CircularProgress, Alert, Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DiscussionForum = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await getQuestions();
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions. Please try again later.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setIsCreatingQuestion(false);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
  };

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setIsCreatingQuestion(true);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
  };

  const handleBackToQuestions = () => {
    setSelectedQuestion(null);
    setIsCreatingQuestion(false);
    setIsEditingQuestion(false);
    setQuestionToEdit(null);
  };

  const handleQuestionUpdateOrEdit = (question, shouldEdit = false) => {
    if (shouldEdit && question) {
      setIsEditingQuestion(true);
      setQuestionToEdit(question);
      setSelectedQuestion(null);
      setIsCreatingQuestion(false);
    } else {
      fetchQuestions();
    }
  };

  if (loading && !isCreatingQuestion && !isEditingQuestion && !selectedQuestion) {
    return <div className="flex justify-center py-8"><CircularProgress sx={{ color: '#3b82f6' }} size={60} /></div>;
  }

  return (
    <div>
      {error && !isCreatingQuestion && !isEditingQuestion && !selectedQuestion && (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      )}

      {/* Back button only - removed the redundant title */}
      {!selectedQuestion && !isCreatingQuestion && !isEditingQuestion && (
        <Box sx={{ mb: 4 }}>
          <Button 
            variant="text" 
            component={Link}
            to="/smartnest/knowledge-hub"
            sx={{ 
              color: '#e2e8f0',
              '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
            }}
          >
            Back
          </Button>
        </Box>
      )}

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
        <DiscussionForumComponent
          questions={questions}
          loading={loading}
          onQuestionClick={handleQuestionClick}
          onCreateQuestion={handleCreateQuestion}
        />
      )}
    </div>
  );
};

export default DiscussionForum; 
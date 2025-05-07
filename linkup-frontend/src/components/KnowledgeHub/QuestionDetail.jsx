import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  IconButton,
  Divider,
  Grid,
  TextField,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  ThumbUp,
  ThumbDown,
  VerifiedUser,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import {
  getQuestion,
  voteQuestion,
  answerQuestion,
  voteAnswer,
  markAnswerAsVerified,
  unmarkAnswerAsVerified,
  incrementQuestionView
} from '../../services/questionService';

const QuestionDetail = ({ question: initialQuestion, onBack, onUpdate }) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [loading, setLoading] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Increment view count when question is viewed
    if (question?.id) {
      incrementQuestionView(question.id).catch(err => {
        console.error('Error incrementing view count:', err);
      });
    }
    
    // Fetch the latest question data
    refreshQuestion();
  }, [question?.id]);

  const refreshQuestion = async () => {
    if (!question?.id) return;
    
    setLoading(true);
    try {
      const response = await getQuestion(question.id);
      setQuestion(response.data);
    } catch (err) {
      console.error('Error fetching question details:', err);
      setError('Failed to load question details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteQuestion = async (voteType) => {
    if (!question?.id) return;
    
    try {
      await voteQuestion(question.id, voteType);
      refreshQuestion();
    } catch (err) {
      console.error('Error voting on question:', err);
    }
  };

  const handleVoteAnswer = async (answerId, voteType) => {
    if (!question?.id || !answerId) return;
    
    try {
      await voteAnswer(question.id, answerId, voteType);
      refreshQuestion();
    } catch (err) {
      console.error('Error voting on answer:', err);
    }
  };

  const handleMarkAsVerified = async (answerId) => {
    if (!question?.id || !answerId) return;
    
    try {
      await markAnswerAsVerified(question.id, answerId);
      refreshQuestion();
    } catch (err) {
      console.error('Error marking answer as verified:', err);
    }
  };

  const handleUnmarkAsVerified = async (answerId) => {
    if (!question?.id || !answerId) return;
    
    try {
      await unmarkAnswerAsVerified(question.id, answerId);
      refreshQuestion();
    } catch (err) {
      console.error('Error unmarking answer as verified:', err);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerContent.trim()) return;
    
    setSubmittingAnswer(true);
    setError('');
    
    try {
      await answerQuestion(question.id, answerContent);
      setAnswerContent('');
      refreshQuestion();
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit your answer. Please try again.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Format the date
  const timeAgo = formatDistanceToNow(new Date(question?.created_at || Date.now()), { addSuffix: true });

  // Setup for ReactQuill
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
    keyboard: {
      bindings: {}
    }
  };

  // Add global styles for HTML content and handle MutationEvent warnings
  React.useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    // Add CSS rules to make all text in question and answer content white
    style.innerHTML = `
      .question-content p, .question-content span, .question-content li, 
      .question-content h1, .question-content h2, .question-content h3, 
      .question-content div, .question-content strong, .question-content em,
      .answer-content p, .answer-content span, .answer-content li, 
      .answer-content h1, .answer-content h2, .answer-content h3, 
      .answer-content div, .answer-content strong, .answer-content em {
        color: white !important;
      }
    `;
    // Append style to head
    document.head.appendChild(style);
    
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
    
    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
      console.warn = originalWarn;
    };
  }, []);

  if (loading && !question) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={50} sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  // For safety, sanitize HTML content
  const createMarkup = (html) => {
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'ul', 'ol', 'li', 'br', 'strong', 'em', 'code', 'pre', 'blockquote', 'span', 'div', 'img'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
    });
    
    // Add a wrapper with white text to ensure all content is visible
    return { __html: `<div style="color: white !important;">${sanitizedHtml}</div>` };
  };

  return (
    <Box>
      {/* Back button and actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
          <Typography variant="h5" sx={{ color: 'white' }}>
            Question Details
          </Typography>
        </Box>
        
        {/* Edit button - only visible to author */}
        {user && user.id === question?.author?.id && (
          <Button
            startIcon={<EditIcon />}
            onClick={() => onUpdate(question, true)}
            sx={{
              color: '#e2e8f0',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            Edit
          </Button>
        )}
      </Box>

      {/* Question content */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', // slate-900 with opacity
          borderRadius: '0.75rem',
          border: '1px solid rgba(51, 65, 85, 0.5)', // slate-700 with opacity
        }}
      >
        <Grid container spacing={2}>
          {/* Vote column */}
          <Grid item xs={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton 
                onClick={() => handleVoteQuestion('upvote')}
                sx={{ 
                  color: question?.is_upvoted ? '#3b82f6' : '#e2e8f0',
                  '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                }}
              >
                <ThumbUp />
              </IconButton>
              
              <Typography variant="h6" sx={{ my: 1, color: 'white' }}>
                {question?.upvote_count || 0}
              </Typography>
              
              <IconButton 
                onClick={() => handleVoteQuestion('downvote')}
                sx={{ 
                  color: question?.is_downvoted ? '#ef4444' : '#e2e8f0',
                  '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                }}
              >
                <ThumbDown />
              </IconButton>
              
              {/* Downvote counter */}
              <Typography variant="body2" sx={{ mt: 1, color: question?.is_downvoted ? '#ef4444' : 'white' }}>
                {question?.downvote_count || 0}
              </Typography>
            </Box>
          </Grid>
          
          {/* Content column */}
          <Grid item xs={11}>
            <Typography variant="h5" sx={{ mb: 2, color: '#f8fafc' }}>
              {question?.title ? DOMPurify.sanitize(question.title, { ALLOWED_TAGS: [] }) : ''}
            </Typography>
            
            <Box 
              className="question-content" 
              sx={{ 
                mb: 3,
                color: 'white !important',
                '& *': { color: 'white !important' },
                '& p': { color: 'white !important' },
                '& span': { color: 'white !important' },
                '& li': { color: 'white !important' },
                '& h1, & h2, & h3': { color: 'white !important' },
                '& a': { color: '#3b82f6' },
                '& pre': { 
                  backgroundColor: 'rgba(30, 41, 59, 0.7)', 
                  padding: 2, 
                  borderRadius: '0.5rem',
                  overflowX: 'auto'
                },
                '& code': {
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '0.25rem',
                  fontFamily: 'monospace'
                },
                '& ul, & ol': { paddingLeft: 3 },
                '& blockquote': {
                  borderLeft: '4px solid #3b82f6',
                  paddingLeft: 2,
                  color: '#94a3b8'
                }
              }}
              dangerouslySetInnerHTML={createMarkup(question?.content || '')}
            />
            
            {/* Tags */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {question?.tags?.map(tag => (
                <Chip
                  key={tag.id || tag.name}
                  label={tag.name}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(51, 65, 85, 0.8)',
                    color: 'white',
                  }}
                />
              ))}
            </Box>
            
            {/* Author info */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Asked {timeAgo} by
                </Typography>
                <Avatar 
                  src={question?.author?.profile_picture} 
                  alt={question?.author?.username}
                  sx={{ width: 24, height: 24 }}
                >
                  {question?.author?.first_name?.charAt(0) || question?.author?.username?.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {question?.author?.first_name} {question?.author?.last_name || ''}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: 'white' }}>
                {question?.view_count || 0} views
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Answer count */}
      <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
        {question?.answers?.length || 0} {question?.answers?.length === 1 ? 'Answer' : 'Answers'}
      </Typography>

      {/* Answers */}
      {question?.answers?.map(answer => (
        <Paper
          key={answer.id}
          sx={{ 
            p: 3, 
            mb: 3,
            backgroundColor: answer.is_verified 
              ? 'rgba(20, 83, 45, 0.3)'  // Subtle green background for verified answers
              : 'rgba(15, 23, 42, 0.7)', // Default dark background
            borderRadius: '0.75rem',
            border: answer.is_verified
              ? '1px solid rgba(34, 197, 94, 0.5)'  // Green border for verified answers
              : '1px solid rgba(51, 65, 85, 0.5)',   // Default border
          }}
        >
          <Grid container spacing={2}>
            {/* Vote column */}
            <Grid item xs={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton 
                  onClick={() => handleVoteAnswer(answer.id, 'upvote')}
                  sx={{ 
                    color: answer.is_upvoted ? '#3b82f6' : '#e2e8f0',
                    '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                  }}
                >
                  <ThumbUp />
                </IconButton>
                
                <Typography variant="h6" sx={{ my: 1, color: 'white' }}>
                  {answer.upvote_count || 0}
                </Typography>
                
                <IconButton 
                  onClick={() => handleVoteAnswer(answer.id, 'downvote')}
                  sx={{ 
                    color: answer.is_downvoted ? '#ef4444' : '#e2e8f0',
                    '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                  }}
                >
                  <ThumbDown />
                </IconButton>
                
                {/* Downvote counter */}
                <Typography variant="body2" sx={{ mt: 1, color: answer.is_downvoted ? '#ef4444' : 'white' }}>
                  {answer.downvote_count || 0}
                </Typography>
                
                {/* Verified badge */}
                {answer.is_verified && (
                  <Tooltip title="Verified Answer">
                    <VerifiedUser 
                      sx={{ 
                        color: '#22c55e', // green-500
                        mt: 1 
                      }} 
                    />
                  </Tooltip>
                )}
              </Box>
            </Grid>
            
            {/* Content column */}
            <Grid item xs={11}>
              <Box 
                className="answer-content" 
                sx={{ 
                  mb: 3,
                  color: 'white !important',
                  '& *': { color: 'white !important' },
                  '& p': { color: 'white !important' },
                  '& span': { color: 'white !important' },
                  '& li': { color: 'white !important' },
                  '& h1, & h2, & h3': { color: 'white !important' },
                  '& a': { color: '#3b82f6' },
                  '& pre': { 
                    backgroundColor: 'rgba(30, 41, 59, 0.7)', 
                    padding: 2, 
                    borderRadius: '0.5rem',
                    overflowX: 'auto'
                  },
                  '& code': {
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace'
                  },
                  '& ul, & ol': { paddingLeft: 3 },
                  '& blockquote': {
                    borderLeft: '4px solid #3b82f6',
                    paddingLeft: 2,
                    color: '#94a3b8'
                  }
                }}
                dangerouslySetInnerHTML={createMarkup(answer.content || '')}
              />
              
              {/* Author and actions row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    Answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })} by
                  </Typography>
                  <Avatar 
                    src={answer.author?.profile_picture} 
                    alt={answer.author?.username}
                    sx={{ width: 24, height: 24 }}
                  >
                    {answer.author?.first_name?.charAt(0) || answer.author?.username?.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {answer.author?.first_name} {answer.author?.last_name || ''}
                  </Typography>
                </Box>
                
                {/* Verify/Unverify answer button - only visible to question author */}
                {user && user.id === question?.author?.id && (
                  answer.is_verified ? (
                    <Button
                      size="small"
                      startIcon={<VerifiedUser />}
                      onClick={() => handleUnmarkAsVerified(answer.id)}
                      sx={{
                        color: '#ef4444', // red-500
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)' // red-500 with opacity
                        }
                      }}
                    >
                      Remove Verification
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<VerifiedUser />}
                      onClick={() => handleMarkAsVerified(answer.id)}
                      sx={{
                        color: '#22c55e', // green-500
                        '&:hover': {
                          backgroundColor: 'rgba(34, 197, 94, 0.1)' // green-500 with opacity
                        }
                      }}
                    >
                      Mark as Verified
                    </Button>
                  )
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      ))}

      {/* Submit new answer */}
      {user && (
        <Paper 
          sx={{ 
            p: 3, 
            mt: 4,
            backgroundColor: 'rgba(15, 23, 42, 0.7)', // slate-900 with opacity
            borderRadius: '0.75rem',
            border: '1px solid rgba(51, 65, 85, 0.5)', // slate-700 with opacity
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
            Your Answer
          </Typography>
          
          {error && (
            <Typography 
              color="error" 
              variant="body2" 
              sx={{ mb: 2, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', color: 'white' }}
            >
              {error}
            </Typography>
          )}
          
          <form onSubmit={handleSubmitAnswer}>
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
                  minHeight: '150px',
                },
                '.ql-editor': {
                  minHeight: '150px',
                  color: 'white !important', // Force white color for text
                },
                '.ql-editor p': {
                  color: 'white !important',
                },
                '.ql-editor span': {
                  color: 'white !important',
                },
                '.ql-editor strong': {
                  color: 'white !important',
                },
                '.ql-editor em': {
                  color: 'white !important',
                },
                '.ql-editor u': {
                  color: 'white !important',
                },
                '.ql-editor li': {
                  color: 'white !important',
                },
                '.ql-editor h1, .ql-editor h2, .ql-editor h3': {
                  color: 'white !important',
                },
                '.ql-editor.ql-blank::before': {
                  color: 'rgba(255, 255, 255, 0.4)',
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
                // Force all text to be white
                'p, h1, h2, h3, li, span': {
                  color: 'white !important',
                },
              }}
            >
              <ReactQuill
                value={answerContent}
                onChange={(value) => {
                  // Use a controlled approach to set the content
                  setAnswerContent(value);
                }}
                modules={modules}
                placeholder="Write your answer here. Be clear and specific in your explanation."
                theme="snow"
                preserveWhitespace={true}
                sx={{
                  '.ql-editor': {
                    color: 'white',
                  }
                }}
              />
            </Box>
            
            <Button 
              type="submit"
              variant="contained"
              disabled={submittingAnswer || !answerContent.trim()}
              sx={{
                backgroundColor: '#3b82f6', // blue-500
                '&:hover': {
                  backgroundColor: '#2563eb', // blue-600
                },
              }}
            >
              {submittingAnswer ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : 'Post Your Answer'}
            </Button>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default QuestionDetail; 
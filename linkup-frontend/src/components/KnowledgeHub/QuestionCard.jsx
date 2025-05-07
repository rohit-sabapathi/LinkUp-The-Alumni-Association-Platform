import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Avatar,
  Grid,
  Tooltip
} from '@mui/material';
import {
  QuestionAnswer as AnswerIcon,
  RemoveRedEye as ViewIcon,
  ThumbUp as UpvoteIcon,
  ThumbDown as DownvoteIcon,
  CheckCircle as VerifiedIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';

const QuestionCard = ({ question, onClick }) => {
  const {
    title,
    content,
    author,
    tags,
    view_count,
    upvote_count,
    downvote_count,
    created_at,
    answer_count,
  } = question;

  // Check if any answers are verified
  const hasVerifiedAnswer = question.answers?.some(answer => answer.is_verified) || false;

  // Format the date
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  // Take a snippet of the content for preview (first 150 chars)
  // Strip HTML tags for clean text display
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };
  
  const sanitizedContent = stripHtml(content || '');
  const contentPreview = sanitizedContent.length > 150 
    ? `${sanitizedContent.substring(0, 150)}...` 
    : sanitizedContent;

  // For safety, sanitize HTML content
  const createMarkup = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  return (
    <Paper
      sx={{
        p: 3,
        cursor: 'pointer',
        backgroundColor: 'rgba(15, 23, 42, 0.7)', // slate-900 with opacity
        borderRadius: '0.75rem',
        border: '1px solid rgba(51, 65, 85, 0.5)', // slate-700 with opacity
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(59, 130, 246, 0.5)', // blue-500 with opacity
        },
      }}
      onClick={onClick}
    >
      <Grid container spacing={2}>
        {/* Stats column */}
        <Grid item xs={12} sm={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Upvotes">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <UpvoteIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                <Typography variant="body2" sx={{ color: 'white' }}>{upvote_count}</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Downvotes">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DownvoteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                <Typography variant="body2" sx={{ color: 'white' }}>{downvote_count || 0}</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Answers">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AnswerIcon fontSize="small" sx={{ color: hasVerifiedAnswer ? '#22c55e' : '#e2e8f0' }} />
                <Typography variant="body2" sx={{ color: 'white' }}>{answer_count}</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Views">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ViewIcon fontSize="small" sx={{ color: '#e2e8f0' }} />
                <Typography variant="body2" sx={{ color: 'white' }}>{view_count}</Typography>
              </Box>
            </Tooltip>
            
            {hasVerifiedAnswer && (
              <Tooltip title="Has verified answer">
                <VerifiedIcon fontSize="small" sx={{ color: '#22c55e', mt: 1 }} />
              </Tooltip>
            )}
          </Box>
        </Grid>
        
        {/* Content column */}
        <Grid item xs={12} sm={10}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1, color: '#f8fafc' }}>
              {stripHtml(title)}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                color: 'rgba(248, 250, 252, 0.8)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {contentPreview}
            </Typography>
            
            {/* Tags */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags?.map(tag => (
                <Chip
                  key={tag.id || tag.name}
                  label={tag.name}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(51, 65, 85, 0.8)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(71, 85, 105, 0.9)'
                    }
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ))}
            </Box>
            
            {/* Author and time */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src={author?.profile_picture} 
                  alt={author?.username}
                  sx={{ width: 24, height: 24 }}
                >
                  {author?.first_name?.charAt(0) || author?.username?.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {author?.first_name} {author?.last_name || ''} · {timeAgo}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QuestionCard; 
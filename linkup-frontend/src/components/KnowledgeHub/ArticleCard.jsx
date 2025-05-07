import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  ThumbUpOutlined,
  CommentOutlined,
  VisibilityOutlined,
  BookmarkBorderOutlined,
} from '@mui/icons-material';

const ArticleCard = ({ article, onClick }) => {
  const {
    title,
    content,
    author,
    tags = [],
    view_count = 0,
    likes_count = 0,
    comments_count = 0,
  } = article;

  // Create a preview of the content (first 150 characters)
  const contentPreview = content ? content.replace(/<[^>]*>/g, '').slice(0, 150) + '...' : '';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        backgroundColor: 'rgba(30, 41, 59, 0.8)', // slate-800 with opacity
        borderRadius: '0.75rem',
        border: '1px solid rgba(51, 65, 85, 0.5)', // slate-700 with opacity
        '&:hover': {
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)', // blue glow
          borderColor: 'rgba(59, 130, 246, 0.5)', // blue-500 with opacity
        },
        transition: 'all 0.3s ease',
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e2e8f0' /* slate-200 */ }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={author?.profile_picture}
            alt={author?.first_name || author?.username}
            sx={{ width: 24, height: 24, mr: 1 }}
          />
          <Typography variant="body2" sx={{ color: '#94a3b8' /* slate-400 */ }}>
            {author?.first_name ? `${author.first_name} ${author.last_name || ''}` : author?.username || 'Anonymous'}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: '#94a3b8', /* slate-400 */
          }}
        >
          {contentPreview}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {tags.map((tag, index) => (
            <Chip
              key={typeof tag === 'object' ? tag.id || index : tag}
              label={typeof tag === 'object' ? tag.name : tag}
              size="small"
              sx={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)', // blue-500 with low opacity
                color: '#93c5fd', // blue-300
                borderRadius: '0.5rem',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          ))}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VisibilityOutlined fontSize="small" sx={{ mr: 0.5, color: '#64748b' /* slate-500 */ }} />
            <Typography variant="body2" sx={{ color: '#64748b' /* slate-500 */ }}>{view_count}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ThumbUpOutlined fontSize="small" sx={{ mr: 0.5, color: '#64748b' /* slate-500 */ }} />
            <Typography variant="body2" sx={{ color: '#64748b' /* slate-500 */ }}>{likes_count || 0}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CommentOutlined fontSize="small" sx={{ mr: 0.5, color: '#64748b' /* slate-500 */ }} />
            <Typography variant="body2" sx={{ color: '#64748b' /* slate-500 */ }}>{comments_count || 0}</Typography>
          </Box>
        </Box>
        <IconButton size="small" sx={{ color: '#64748b' /* slate-500 */ }}>
          <BookmarkBorderOutlined />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default ArticleCard; 
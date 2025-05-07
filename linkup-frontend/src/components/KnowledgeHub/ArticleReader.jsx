import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  ThumbUpOutlined,
  ThumbUp,
  CommentOutlined,
  BookmarkBorderOutlined,
  Bookmark,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  likeArticle,
  unlikeArticle,
  bookmarkArticle,
  unbookmarkArticle,
  deleteArticle,
  addComment,
  getArticleComments,
  getArticle
} from '../../services/articleService';

const ArticleReader = ({ article: initialArticle, onBack, onUpdate }) => {
  const { user } = useAuth();
  const [article, setArticle] = useState(initialArticle);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setArticle(initialArticle);
    // Check if user has liked and bookmarked the article
    if (user) {
      setIsLiked(initialArticle.likes?.includes(user.id) || initialArticle.is_liked);
      setIsBookmarked(initialArticle.bookmarks?.includes(user.id) || initialArticle.is_bookmarked);
    }
    
    // Load comments
    fetchComments();
  }, [initialArticle, user]);

  const fetchComments = async () => {
    try {
      const response = await getArticleComments(article.id);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const refreshArticle = async () => {
    try {
      const response = await getArticle(article.id);
      setArticle(response.data);
      return response.data;
    } catch (error) {
      console.error('Error refreshing article data:', error);
      return null;
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      if (isLiked) {
        await unlikeArticle(article.id);
        // Immediately update the UI for better responsiveness
        setArticle(prev => ({
          ...prev, 
          likes_count: Math.max(0, (prev.likes_count || 0) - 1)
        }));
      } else {
        await likeArticle(article.id);
        // Immediately update the UI for better responsiveness
        setArticle(prev => ({
          ...prev, 
          likes_count: (prev.likes_count || 0) + 1
        }));
      }
      // Toggle state immediately for better UX
      setIsLiked(!isLiked);
      
      // Then refresh the data from the server in the background
      refreshArticle().then(updatedArticle => {
        if (updatedArticle) {
          onUpdate(); // Update parent component's data
        }
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert the optimistic UI update on error
      refreshArticle();
      alert('Failed to update like status. Please try again.');
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      if (isBookmarked) {
        await unbookmarkArticle(article.id);
      } else {
        await bookmarkArticle(article.id);
      }
      // Toggle state only after successful API call
      setIsBookmarked(!isBookmarked);
      // Update article data to reflect changes
      refreshArticle().then(updatedArticle => {
        if (updatedArticle) {
          onUpdate(); // Update parent component's data
        }
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Handle API errors - don't change UI state if the API call failed
      alert('Failed to update bookmark status. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteArticle(article.id);
      onBack();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    try {
      setLoading(true);
      await addComment(article.id, { content: comment });
      setComment('');
      fetchComments();
      refreshArticle().then(updatedArticle => {
        if (updatedArticle) {
          onUpdate(); // Update parent component's data
        }
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update the onEdit function to properly handle article editing
  const handleEdit = () => {
    // Pass the article back to the parent component for editing
    // This will trigger the ArticleEditor with the article data
    if (onUpdate) {
      // We call onUpdate with a special flag to indicate editing mode
      onUpdate(article, true);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {article.title}
        </Typography>
        {user && article.author?.id === user.id && (
          <Box>
            <IconButton onClick={handleEdit}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={article.author?.profile_picture}
          alt={article.author?.name}
          sx={{ mr: 2 }}
        />
        <Typography variant="subtitle1">
          {article.author?.name || article.author?.username}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        {(article.tags || []).map((tag, index) => (
          <Chip
            key={typeof tag === 'object' ? tag.id || index : tag || index}
            label={typeof tag === 'object' ? tag.name : tag}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
      </Box>

      <Box
        sx={{ mb: 4 }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          startIcon={isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
          onClick={handleLike}
          color={isLiked ? 'primary' : 'inherit'}
        >
          {article.likes_count || 0} Likes
        </Button>
        <Button
          startIcon={isBookmarked ? <Bookmark /> : <BookmarkBorderOutlined />}
          onClick={handleBookmark}
          color={isBookmarked ? 'primary' : 'inherit'}
        >
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        Comments ({comments.length})
      </Typography>

      {user && (
        <Box component="form" onSubmit={handleComment} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !comment.trim()}
            sx={{ mt: 1 }}
          >
            Post Comment
          </Button>
        </Box>
      )}

      <Box>
        {comments.map((comment) => (
          <Box key={comment.id} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item>
                <Avatar
                  src={comment.author?.profile_picture}
                  alt={comment.author?.name || comment.author?.username}
                />
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle2">
                  {comment.author?.name || comment.author?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {comment.content}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(comment.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ArticleReader; 
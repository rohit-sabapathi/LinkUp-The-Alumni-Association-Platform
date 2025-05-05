from django.db import models
from django.conf import settings

# Create your models here.

class Post(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=5000)
    media = models.FileField(upload_to='post_media/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)
    saved_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='saved_posts', blank=True)
    is_poll = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.get_full_name()}'s post - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def like_count(self):
        return self.likes.count()
    
    @property
    def comment_count(self):
        return self.comments.count()


class Poll(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='poll')
    question = models.CharField(max_length=255)
    end_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.question
    
    @property
    def total_votes(self):
        return sum(option.votes.count() for option in self.options.all())
    
    @property
    def is_ended(self):
        from django.utils import timezone
        if self.end_date:
            return timezone.now() > self.end_date
        return False


class PollOption(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=255)
    votes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='poll_votes', blank=True)
    
    def __str__(self):
        return self.text
    
    @property
    def vote_count(self):
        return self.votes.count()
    
    @property
    def percentage(self):
        total = self.poll.total_votes
        if total > 0:
            return round((self.vote_count / total) * 100)
        return 0


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_comments', blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.get_full_name()} on {self.post}"

    @property
    def like_count(self):
        return self.likes.count()

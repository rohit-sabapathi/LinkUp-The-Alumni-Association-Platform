from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='chat_rooms_as_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='chat_rooms_as_user2', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user1', 'user2']

    def __str__(self):
        return f'Chat between {self.user1.get_full_name()} and {self.user2.get_full_name()}'

    def get_other_user(self, user):
        return self.user2 if user == self.user1 else self.user1

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    file_data = models.TextField(null=True, blank=True)  # Base64 encoded file data
    file_type = models.CharField(max_length=100, null=True, blank=True)  # MIME type
    file_name = models.CharField(max_length=255, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Message from {self.sender.get_full_name()} in {self.room}'

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message
from .serializers import MessageSerializer
import base64

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        print(f"[WebSocket] Connection attempt from user {self.user} for room {self.room_id}")

        if self.user.is_anonymous:
            print(f"[WebSocket] Anonymous user rejected")
            await self.close()
            return

        # Check if user can participate in this chat
        if not await self.can_participate():
            print(f"[WebSocket] User {self.user.id} cannot participate in room {self.room_id}")
            await self.close()
            return

        print(f"[WebSocket] User {self.user.id} connecting to room {self.room_id}")

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"[WebSocket] User {self.user.id} connected to room {self.room_id}")

    async def disconnect(self, close_code):
        print(f"[WebSocket] User {self.user.id} disconnecting from room {self.room_id}, code: {close_code}")
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            message_data = text_data_json.get('message', {})
            
            print(f"[WebSocket] Received {message_type} from user {self.user.id} in room {self.room_id}")
            
            if message_type == 'connection_test':
                print(f"[WebSocket] Connection test received from user {self.user.id}")
                await self.send(text_data=json.dumps({
                    'type': 'connection_test_response',
                    'message': {'content': 'Connection successful'}
                }))
                return

            # Save message to database
            message = await self.save_message(message_data)
            if not message:
                print(f"[WebSocket] Failed to save message from user {self.user.id}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Failed to save message'
                }))
                return

            # Get serialized message data
            message_data = await self.get_message_data(message)
            print(f"[WebSocket] Broadcasting message: {message_data}")

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )
        except json.JSONDecodeError:
            print(f"[WebSocket] Invalid JSON received: {text_data}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format'
            }))
        except Exception as e:
            print(f"[WebSocket] Error processing message: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))

    async def chat_message(self, event):
        message = event['message']
        print(f"[WebSocket] Sending message to client: {message}")

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

    @database_sync_to_async
    def can_participate(self):
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            return self.user in [room.user1, room.user2]
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_data):
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            
            # Create message
            message = Message.objects.create(
                room=room,
                sender=self.user,
                content=message_data.get('content', '')
            )

            # Handle file if present
            file_data = message_data.get('file_data')
            if file_data:
                message.file_data = file_data
                message.file_type = message_data.get('file_type')
                message.file_name = message_data.get('file_name')
                message.save()

            # Update room's updated_at timestamp
            room.save()
            
            return message
        except Exception as e:
            print(f"[WebSocket] Error saving message: {str(e)}")
            return None

    @database_sync_to_async
    def get_message_data(self, message):
        serializer = MessageSerializer(message)
        return serializer.data

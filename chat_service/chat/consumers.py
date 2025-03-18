import json
import logging
from datetime import datetime
import uuid
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django_chat.asgi import publishers
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        self.notification = publishers[0]
        super().__init__(*args, **kwargs)
    
    async def connect(self):
        try:
            await self.accept()
            if self.scope.get("error_message"):
                error = self.scope.get("error_message")
                logger.error(f"Error in chat consumer: {error}")
                await self.close(code=4001, reason=f"Error in chat consumer: {error}")
                return
            
            self.chat_with_user = self.scope['url_route']['kwargs']['username']
            self.user = self.scope.get("user")
            logger.info(f"Connecting to chat with {self.chat_with_user}")

        except Exception as e:
            logger.error(f"Error during WebSocket connection: {e}")
            await self.close(code=4000, reason="Unexpected connection error.")
    
    async def receive(self, text_data):
        try:
            message_data = json.loads(text_data)
            message = message_data.get("message", "")
            sender = self.user
            timestamp = datetime.now()

            # await self.save_message(sender, self.chat_with_user, message, timestamp)

            await self.send_message(self.chat_with_user, message, timestamp)

        except Exception as e:
            logger.error(f"Error while processing message: {e}")
            await self.send(text_data=json.dumps({"error": "Error while processing message"}))


    async def send_message(self, receiver_username, message, timestamp):
        try:
            message_data = {
                "message": message,
                "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            }
            await self.send(text_data=json.dumps(message_data))

            receiver_channel_name = f"chat_{receiver_username}"
            await self.channel_layer.send(receiver_channel_name, {
                "type": "chat.message",
                "message": message,
                "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            })
        
        except Exception as e:
            logger.error(f"Error while sending message: {e}")

    async def disconnect(self, close_code):
        try:
            logger.info(f"Disconnected from chat with {self.chat_with_user}")
        except Exception as e:
            logger.error(f"Error during WebSocket disconnection: {e}")

    # @sync_to_async
    # def save_message(self, sender, receiver_username, message, timestamp):
    #     try:
    #         receiver = User.objects.get(username=receiver_username)
    #         message_instance = Message(sender=sender, receiver=receiver, message=message, timestamp=timestamp)
    #         message_instance.save()
    #         return message_instance
    #     except Exception as e:
    #         logger.error(f"Error saving message: {e}")
    #         return None
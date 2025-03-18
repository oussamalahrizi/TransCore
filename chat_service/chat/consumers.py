import json
import logging
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None
        self.room_group_name = None
        self.user = None
        self.chat_with_user_id = None

    async def connect(self):
        try:
            await self.accept()

            if self.scope.get("error_message"):
                error = self.scope.get("error_message")
                logger.error(f"Error in chat consumer: {error}")
                await self.close(code=4001, reason=f"Error in chat consumer: {error}")
                return

            self.user = self.scope.get("user")
            if not self.user:
                logger.error("User not found in scope")
                await self.close(code=4002, reason="User not found.")
                return

            if "id" not in self.user:
                logger.error("User object does not contain 'id' field")
                await self.close(code=4003, reason="Invalid user object.")
                return

            await self.send(text_data=json.dumps({
                "type": "user_info",
                "user_id": self.user["id"], 
            }))

            logger.info("Waiting for recipient's user_id from the frontend...")

        except Exception as e:
            logger.error(f"Error during WebSocket connection: {e}")
            await self.close(code=4000, reason="Unexpected connection error.")

    async def receive(self, text_data):
        try:
            message_data = json.loads(text_data)
            message_type = message_data.get("type")

            if message_type == "user_id":
                self.chat_with_user_id = message_data.get("user_id")
                logger.info(f"Received recipient's user_id: {self.chat_with_user_id}")

                user1_id = self.user["id"]
                user2_id = self.chat_with_user_id

                min_id = min(user1_id, user2_id)
                max_id = max(user1_id, user2_id)
                self.room_name = f"chat_{min_id}_{max_id}"
                self.room_group_name = f"chat_{self.room_name}"

                logger.info(f"Sender ID: {user1_id}, Receiver ID: {user2_id}, Room Name: {self.room_name}")

                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )

                logger.info(f"Connected to chat with user ID {self.chat_with_user_id} in room {self.room_name}")

            elif message_type == "message":
                message = message_data.get("message", "")
                sender = self.user
                timestamp = datetime.now()

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "message": message,
                        "sender_id": sender["id"],
                        "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    }
                )

        except Exception as e:
            logger.error(f"Error while processing message: {e}")
            await self.send(text_data=json.dumps({"error": "Error while processing message"}))
    @database_sync_to_async
    def get_user_by_id(self, user_id):
        """
        Fetch user data by user_id from the database.
        """
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"User not found in database: {user_id}")
            return None
        except Exception as e:
            logger.error(f"Error fetching user by ID: {e}")
            return None

    async def chat_message(self, event):
        """
        Handle incoming messages from the room group and send them to the WebSocket.
        """
        logger.info(f"Sending message to WebSocket: {event}")

        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender_id": event["sender_id"],
            "timestamp": event["timestamp"],
        }))

    async def disconnect(self, close_code):
        try:
            if self.room_group_name:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
                logger.info(f"Disconnected from chat with user ID {self.chat_with_user_id}")
            else:
                logger.warning("Disconnected without a valid room_group_name")
        except Exception as e:
            logger.error(f"Error during WebSocket disconnection: {e}")
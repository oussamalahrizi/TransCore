import json
import logging
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message
from channels.exceptions import DenyConnection
import httpx
from pprint import pprint

logger = logging.getLogger(__name__)

USER_BY_USERNAME_URL = "http://auth-service/api/auth/internal/username/"
FRIENDS_CHECK_URL = "http://auth-service/api/auth/internal/friends/"
BLOCKED_CHECK_URL = "http://auth-service/api/auth/internal/blocked/"

async def fetch_user_by_username(username: str):
    try:
        timeout = httpx.Timeout(5.0, read=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(f"{USER_BY_USERNAME_URL}{username}/")
            response.raise_for_status()
            return response.json()
    except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError) as e:
        raise DenyConnection("Failed to fetch recipient info from auth")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == httpx.codes.NOT_FOUND:
            logger.error(f"User not found: {username}")
            raise DenyConnection("User Not Found.")
        logger.error(f"HTTP error fetching user info: {e}")
        raise DenyConnection("Failed to fetch user info from auth")
    except Exception as e:
        logger.error(f"Unexpected error fetching user: {e}")
        raise DenyConnection("Failed to fetch user info from auth")

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = self.room_group_name = self.user = self.chat_with_user_id = None

    async def connect(self):
        try:
            await self.accept()
            self.user = self.scope.get("user")
            if not self.user or "id" not in self.user:
                await self.close(code=4002 if not self.user else 4003, reason="User not found or invalid.")
                return
            
            other = self.scope['url_route']['kwargs'].get('username')
            try:
                if not other:
                    await self.close(code=4002, reason="Recipient not found or invalid.")
                    return
                
                self.other = await fetch_user_by_username(other)
                pprint(other)
                
                are_friends = await self.check_friendship(self.user["id"], self.other["id"])
                if not are_friends:
                    await self.close(code=4003, reason="You can only message friends.")
                    return
                    
                is_blocked = await self.check_blocked(self.user["id"], self.other["id"])
                if is_blocked:
                    await self.close(code=4003, reason="You cannot message this user.")
                    return
                    
            except DenyConnection as e:
                await self.close(code=4003, reason=str(e))
                return
            
            await self.setup_room(self.other['id'])
            await self.send(json.dumps({
                "type": "user_info",
                "user_id": self.user["id"],
                "roomname": self.room_name  
            }))            
        
        except Exception as e:
            logger.error(f"Connection error: {e}")
            await self.close(code=4000, reason="Unexpected error.")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data["type"] == "message":
                await self.handle_message(data["message"])
        except Exception as e:
            logger.error(f"Message processing error: {e}")
            await self.send(json.dumps({"type": "error", "message": "Message processing failed."}))

    async def setup_room(self, recipient_id):
        self.chat_with_user_id = recipient_id
        user1_id, user2_id = sorted([self.user["id"], recipient_id])
        self.room_name = f"chat_{user1_id}_{user2_id}"
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        logger.info(f"Connected to room: {self.room_name}")

    async def handle_message(self, message):
        if not message or not message.strip():
            logger.warning("Empty message received. Ignoring.")
            await self.send(json.dumps({
                "type": "error", 
                "message": "Message cannot be empty."
            }))
            return

        try:
            are_friends = await self.check_friendship(self.user["id"], self.chat_with_user_id)
            is_blocked = await self.check_blocked(self.user["id"], self.chat_with_user_id)
            
            if not are_friends:
                await self.send(json.dumps({
                    "type": "error",
                    "message": "You can only message friends."
                }))
                return
                
            if is_blocked:
                await self.send(json.dumps({
                    "type": "error",
                    "message": "You cannot message this user."
                }))
                return

        except Exception as e:
            logger.error(f"Error checking friendship/block status: {e}")
            await self.send(json.dumps({
                "type": "error",
                "message": "Could not verify relationship status."
            }))
            return

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        try:
            await self.save_message(
                self.user["id"], 
                self.chat_with_user_id, 
                message, 
                self.room_name, 
                timestamp
            )
            
            recipient_blocked = await self.check_blocked(self.chat_with_user_id, self.user["id"])
            if not recipient_blocked:
                await self.publish_notification(self.user["id"], self.chat_with_user_id, message)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message", 
                    "message": message, 
                    "sender_id": self.user["id"], 
                    "timestamp": timestamp
                }
            )
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send(json.dumps({
                "type": "error",
                "message": "Failed to process message."
            }))

    async def publish_notification(self, sender_id, recipient_id, message):
        """Publish a notification to RabbitMQ if recipient hasn't blocked sender"""
        try:
            data = {
                "type": "send_notification",
                "data": {
                    "user_id": str(recipient_id),
                    "message": f"New message from {self.user['username']}: {message}",
                    "color": "green"
                },
            }
            notifspub = self.scope.get("notifspub")  
            if notifspub:
                await notifspub.publish(data)
                logger.info(f"Notification published: {data}")
        except Exception as e:
            logger.error(f"Error publishing notification: {e}")

    async def chat_message(self, event):
        await self.send(json.dumps({
            'type': 'message',
            "message": event['message'],
            "sender_id": event['sender_id'],
            "timestamp": event['timestamp']
        }))

    @database_sync_to_async
    def save_message(self, sender_id, recipient_id, content, room, timestamp):
        try:
            Message.objects.create(
                sender=sender_id,
                recipient=recipient_id,
                content=content,
                room=room,
                timestamp=timestamp
            )
            logger.info(f"Message saved: sender={sender_id}, recipient={recipient_id}, room={room}")
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise

    @database_sync_to_async
    def check_friendship(self, user_id, friend_id):
        """Check if two users are friends"""
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            with httpx.Client(timeout=timeout) as client:
                response = client.get(f"{FRIENDS_CHECK_URL}{user_id}/")
                response.raise_for_status()
                friends = response.json()
                return any(str(friend.get('id')) == str(friend_id) for friend in friends)
        except Exception as e:
            logger.error(f"Error checking friendship: {e}")
            return False

    @database_sync_to_async
    def check_blocked(self, user_id, blocked_id):
        """Check if user_id has blocked blocked_id"""
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            with httpx.Client(timeout=timeout) as client:
                response = client.get(f"{BLOCKED_CHECK_URL}{user_id}/")
                response.raise_for_status()
                blocked_users = response.json()
                return any(str(blocked.get('id')) == str(blocked_id) for blocked in blocked_users)
        except Exception as e:
            logger.error(f"Error checking blocked status: {e}")
            return True 

    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            logger.info(f"Disconnected from room: {self.room_name}")
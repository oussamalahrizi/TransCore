from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ObjectDoesNotExist
from .models import Message, User, Profile
import json
from uuid import UUID
import logging
from datetime import datetime
from django.contrib.auth import get_user_model
import uuid
from .models import Notification
from django.core.cache import cache  

logger = logging.getLogger(__name__)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_with_user = self.scope['url_route']['kwargs']['username']
        self.user = self.scope.get("user")

        if not self.user or isinstance(self.user, AnonymousUser):
            logger.warning("Unauthorized WebSocket connection attempt.")
            await self.close(code=403)
            return

        self.chat_with_user_id = None
        await self.accept()

        # Send user information (name and ID) to the frontend
        await self.send_user_info()

        await self.send_log_message(f"Attempting to connect to a chat room.")

    async def send_user_info(self):
        """
        Sends the current user's name and ID to the frontend.
        """
        if self.user:
            await self.send(text_data=json.dumps({
                "type": "user_info",
                "user_id": str(self.user.id),  # Convert UUID to string if necessary
                "username": self.user.username
            }))
        else:
            logger.error("No user found in scope to send user info.")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "user_id":
                self.chat_with_user_id = data.get("user_id")
                logger.debug(f"Received user ID: {self.chat_with_user_id}")

                # Fetch the user by user_id from the Profile model
                recipient_user = await self.get_user_by_user_id(self.chat_with_user_id)
                if not recipient_user:
                    logger.error(f"User with ID {self.chat_with_user_id} not found.")
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": "User not found."
                    }))
                    return

                self.room_name = self.get_room_name(self.user.id, recipient_user.id)
                self.room_group_name = f"chat_{self.room_name}"

                # Fetch old messages asynchronously
                old_messages = await self.get_old_messages(self.room_name)
                logger.debug(f"Fetched {len(old_messages)} old messages for room {self.room_name}")

                for message in old_messages:
                    await self.send(text_data=json.dumps({
                        "type": "chat_message",
                        "sender": message.sender.username,
                        "message": message.content,
                        "timestamp": message.timestamp.strftime("%H:%M"),
                        "date": message.timestamp.strftime("%Y-%m-%d")  # Include date
                    }))

                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )

                logger.info(f"WebSocket connection established for user {self.user.username} in room {self.room_name}")
                await self.send_log_message(f"WebSocket connection established for user {self.user.username} in room {self.room_name}")

                await self.send(text_data=json.dumps({"type": "user_id_response", "user_id": self.chat_with_user_id}))

            elif message_type == "chat_message":
                message = data.get("message")
                sender = data.get("sender")
                recipient_user_id = self.chat_with_user_id

                if not message or not sender:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": "Invalid message or sender."
                    }))
                    return

                # Fetch recipient user by user_id from the Profile model
                recipient_user = await self.get_user_by_user_id(recipient_user_id)
                if not recipient_user:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": "Recipient user not found."
                    }))
                    return

                recipient_id = recipient_user.id  # Use recipient ID

                await self.store_message(sender, recipient_user.username, message)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "sender": sender,
                        "message": message,
                        "timestamp": datetime.now().strftime("%H:%M"),
                        "date": datetime.now().strftime("%Y-%m-%d")  # Include date
                    }
                )

                notification_group = f"notifications_{recipient_id}"
                logger.debug(f"Sending notification to group: {notification_group}")

                await self.channel_layer.group_send(
                    notification_group,
                    {
                        "type": "send_notification",
                        "message": f"New message from {sender}: {message}",
                        "recipient_id": recipient_id 
                    }
                )

                logger.debug(f"Notification sent to group: {notification_group}")

        except json.JSONDecodeError:
            logger.error("Invalid JSON received.")
            await self.send_log_message("Error: Invalid JSON received.")

    async def chat_message(self, event):
        sender = event['sender']
        message = event['message']
        timestamp = event['timestamp']
        date = event.get('date', datetime.now().strftime("%Y-%m-%d"))  # Add date field

        logger.debug(f"Received message from {sender}: {message} at {timestamp} on {date}")
        await self.send_log_message(f"Received message from {sender}: {message} at {timestamp} on {date}")

        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "sender": sender,
            "message": message,
            "timestamp": timestamp,
            "date": date  # Include date in the payload
        }))

    async def send_log_message(self, message):
        await self.send(text_data=json.dumps({
            "type": "log_message",
            "message": message
        }))

    def get_room_name(self, user_id, chat_with_user_id):
        try:
            if isinstance(chat_with_user_id, str):  
                chat_with_user_id = int(uuid.UUID(chat_with_user_id).int % (2**32))

            return f"{min(user_id, chat_with_user_id)}_{max(user_id, chat_with_user_id)}"
        except ValueError:
            logger.error("Invalid UUID format for chat_with_user_id")
            return None

    @sync_to_async
    def store_message(self, sender_username, recipient_username, content):
        try:
            sender = User.objects.get(username=sender_username)
            recipient = User.objects.get(username=recipient_username)
            room_name = self.get_room_name(sender.id, recipient.id)

            Message.objects.create(
                sender=sender,
                recipient=recipient,
                content=content,
                room=room_name
            )
            logger.debug(f"Message stored in database: {sender_username} -> {recipient_username}: {content}")
        except User.DoesNotExist:
            logger.error(f"User not found: sender={sender_username}, recipient={recipient_username}")
        except Exception as e:
            logger.error(f"Error storing message: {e}")

    @sync_to_async
    def get_old_messages(self, room_name):
        try:
            return list(Message.objects.filter(room=room_name).select_related('sender').order_by('timestamp')[:1000])
        except Exception as e:
            logger.error(f"Error fetching old messages: {e}")
            return []


    @sync_to_async
    def get_user_by_user_id(self, user_id):
        try:
            # Convert the user_id string to a UUID object
            user_uuid = UUID(user_id)
            # Fetch the profile by the UUID field
            profile = Profile.objects.get(uuid=user_uuid)
            return profile.user
        except (ValueError, Profile.DoesNotExist):
            logger.error(f"Profile with UUID {user_id} not found.")
            return None

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or isinstance(self.user, AnonymousUser):
            await self.close(code=403)
            logger.warning("Unauthorized WebSocket connection attempt.")
            return

        self.notification_group_name = f"notifications_{self.user.id}"

        # Add user to active users list
        await self.add_active_user(self.user.id)

        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"WebSocket connection established for user {self.user.id} in notification group {self.notification_group_name}")

        # Send any stored notifications
        await self.send_unread_notifications(self.user.id)

    async def disconnect(self, close_code):
        if self.user and not isinstance(self.user, AnonymousUser):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )

            # Remove user from active list
            await self.remove_active_user(self.user.id)

            logger.info(f"Notification WebSocket connection closed for user {self.user.id}")

    async def send_notification(self, event):
        message = event["message"]
        recipient_id = event["recipient_id"]

        if await self.is_user_active(recipient_id):
            # Send notification immediately if the user is active
            await self.send(text_data=json.dumps({
                "type": "notification",
                "message": message
            }))
        else:
            # Store notification for later
            await self.store_notification(recipient_id, message)

    @sync_to_async
    def store_notification(self, user_id, message):
        """ Store notifications for offline users. """
        Notification.objects.create(user_id=user_id, message=message)
        logger.info(f"Stored notification for user {user_id}: {message}")


    @sync_to_async
    def send_unread_notifications(self, user_id):
        """ Send unread notifications when the user connects. """
        notifications = Notification.objects.filter(user_id=user_id, read=False)
        logger.debug(f"Unread notifications for user {user_id}: {notifications}")
        unread_count = 0
        for notification in notifications:
            try:
                self.send(text_data=json.dumps({
                    "type": "notification",
                    "message": notification.message
                }))
                notification.read = True
                notification.save()
                unread_count += 1
            except Exception as e:
                logger.error(f"Error sending notification for user {user_id}: {e}")
        logger.info(f"Sent {unread_count} unread notifications to user {user_id}")

    @sync_to_async
    def add_active_user(self, user_id):
        """ Mark user as active using cache (Redis). """
        active_users = cache.get("active_users", set())
        active_users.add(user_id)
        cache.set("active_users", active_users, timeout=3600)
        logger.info(f"User {user_id} marked as active. Active users: {active_users}")

    @sync_to_async
    def remove_active_user(self, user_id):
        """ Remove user from active list. """
        active_users = cache.get("active_users", set())
        active_users.discard(user_id)
        cache.set("active_users", active_users, timeout=3600)
        logger.info(f"User {user_id} removed from active list.")

    @sync_to_async
    def is_user_active(self, user_id):
        """ Check if user is active. """
        active_users = cache.get("active_users", set())
        logger.debug(f"Active users: {active_users}")
        return user_id in active_users
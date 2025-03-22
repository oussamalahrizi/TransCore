# chat/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from .models import Message
import json

@method_decorator(csrf_exempt, name='dispatch')
class ChatRoomMessages(View):
    def get(self, request, roomname):
        messages = Message.objects.filter(room=roomname).order_by('timestamp')
        if not messages.exists():
            return JsonResponse({'messages': [], 'info': 'No messages found for this room.'})
        messages_list = [
            {
                'sender_id': msg.sender,
                'message': msg.content,
                'timestamp': msg.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }
            for msg in messages
        ]
        return JsonResponse({'messages': messages_list})

    def post(self, request, roomname):
        try:
            data = json.loads(request.body)
            sender = data.get('sender')
            recipient = data.get('recipient')  
            content = data.get('content')

            if not all([sender, recipient, content]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)

            message = Message.objects.create(
                sender=sender,
                recipient=recipient,
                content=content,
                room=roomname
            )
            return JsonResponse({
                'message': 'Message sent successfully',
                'id': message.id,
                'timestamp': message.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
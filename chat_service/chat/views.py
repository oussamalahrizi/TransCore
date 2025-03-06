from django.http import JsonResponse
from django.contrib.auth import get_user_model

User = get_user_model()

def get_messages(request):
    recipient_username = request.GET.get('recipient')
    if not recipient_username:
        return JsonResponse({'error': 'Recipient username is required'}, status=400)

    recipient = User.objects.get(username=recipient_username)
    messages = Message.objects.filter(recipient=recipient).order_by('timestamp')
    messages_data = [{
        'sender': message.sender.username,
        'recipient': message.recipient.username,
        'content': message.content,
        'timestamp': message.timestamp.isoformat()
    } for message in messages]

    return JsonResponse(messages_data, safe=False)
from django.shortcuts import render

# Create your views here.
import uuid
from django.core.cache import cache
from django.http import JsonResponse


def create_room(request):
    room_id = str(uuid.uuid4())  # Generate unique room ID
    cache.set(
        room_id,
        {"players": [], "board": [""] * 9, "turn": 0, "game_state": "WAIT"},
        timeout=600,
    )  # Store in Redis for 60 secs
    return JsonResponse(
        {"room_id": room_id, "message": "Room created and will expire in 60 seconds."}
    )


def check_room(request, room_id):
    room = cache.get(room_id)
    if room:
        return JsonResponse(
            {"room_id": room_id, "status": "active", "game_state": room}
        )
    else:
        return JsonResponse({"room_id": room_id, "status": "expired"})

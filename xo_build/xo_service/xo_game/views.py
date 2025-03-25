
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import JsonResponse
from django.db.models import Q, F, Count, Sum
from .models import Player, Match
from .serializers import PlayerSerializer, MatchSerializer
from datetime import datetime, timedelta

# ViewSets for the main models
class PlayerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    
    def get_queryset(self):
        queryset = Player.objects.all()
        player_id = self.request.query_params.get('player_id', None)
        
        if player_id:
            queryset = queryset.filter(player_id=player_id)
            
        return queryset

class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Match.objects.all().order_by('-played_at')
    serializer_class = MatchSerializer
    
    def get_queryset(self):
        queryset = Match.objects.all().order_by('-played_at')
        player_id = self.request.query_params.get('player_id', None)
        
        if player_id:
            queryset = queryset.filter(
                Q(player1__player_id=player_id) | 
                Q(player2__player_id=player_id)
            )
            
        return queryset



@api_view(['GET'])
def get_matches(request):
    matches = Match.objects.all().order_by('-played_at')
    serializer = MatchSerializer(matches, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_players(request):
    players = Player.objects.all()
    serializer = PlayerSerializer(players, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_player(request, player_id):
    try:
        player = Player.objects.get(player_id=player_id)
        serializer = PlayerSerializer(player)
        return Response(serializer.data)
    except Player.DoesNotExist:
        return JsonResponse({'error': 'Player not found'}, status=404)
    

@api_view(['GET'])
def get_match(request, match_id):
    try:
        match = Match.objects.get(id=match_id)
        serializer = MatchSerializer(match)
        return Response(serializer.data)
    except Match.DoesNotExist:
        return JsonResponse({'error': 'Match not found'}, status=404)

from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, F, Count, Sum
from .models import Player, Match, MatchSingle
from .serializers import PlayerSerializer, MatchSerializer, MatchSingleSerializer
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

class MatchSingleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MatchSingle.objects.all().order_by('-played_at')
    serializer_class = MatchSingleSerializer
    
    def get_queryset(self):
        queryset = MatchSingle.objects.all().order_by('-played_at')
        player_id = self.request.query_params.get('player_id', None)
        
        if player_id:
            queryset = queryset.filter(player1__player_id=player_id)
            
        return queryset

# API endpoints for specific game features
@api_view(['GET'])
def leaderboard(request):
    players = Player.objects.annotate(
        total_matches=F('matches_won') + F('matches_lost'),
        win_rate=F('matches_won') * 100.0 / (F('matches_won') + F('matches_lost'))
    ).filter(total_matches__gt=0).order_by('-win_rate', '-matches_won')[:10]
    
    serializer = PlayerSerializer(players, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def player_stats(request, player_id=None):
    # If no player_id provided, use the current user
    if not player_id:
        player_id = request.query_params.get('player_id', None)
        if not player_id:
            return Response({"error": "Player ID is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        player = Player.objects.get(player_id=player_id)
    except Player.DoesNotExist:
        # Create player if doesn't exist
        player = Player.objects.create(player_id=player_id)
    
    # Get recent matches
    multiplayer_matches = Match.objects.filter(
        Q(player1__player_id=player_id) | 
        Q(player2__player_id=player_id)
    ).order_by('-played_at')[:5]
    
    singleplayer_matches = MatchSingle.objects.filter(
        player1__player_id=player_id
    ).order_by('-played_at')[:5]
    
    # Get win streak
    consecutive_wins = 0
    for match in multiplayer_matches:
        if match.winner.player_id == player_id:
            consecutive_wins += 1
        else:
            break
            
    # Additional stats
    stats = {
        "player": PlayerSerializer(player).data,
        "recent_multiplayer": MatchSerializer(multiplayer_matches, many=True).data,
        "recent_singleplayer": MatchSingleSerializer(singleplayer_matches, many=True).data,
        "win_streak": consecutive_wins,
        "total_games": player.matches_won + player.matches_lost
    }
    
    return Response(stats)

@api_view(['GET'])
def match_history(request, player_id=None):
    # If no player_id provided, use the current user
    if not player_id:
        player_id = request.query_params.get('player_id', None)
        if not player_id:
            return Response({"error": "Player ID is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get all matches for this player
    multiplayer_matches = Match.objects.filter(
        Q(player1__player_id=player_id) | 
        Q(player2__player_id=player_id)
    ).order_by('-played_at')
    
    singleplayer_matches = MatchSingle.objects.filter(
        player1__player_id=player_id
    ).order_by('-played_at')
    
    result = {
        "multiplayer": MatchSerializer(multiplayer_matches, many=True).data,
        "singleplayer": MatchSingleSerializer(singleplayer_matches, many=True).data
    }
    
    return Response(result)

@api_view(['POST'])
def save_match_result(request):
    """
    API endpoint to save a match result
    
    For multiplayer matches:
    {
        "match_type": "multiplayer",
        "player1_id": "user1",
        "player2_id": "user2",
        "player1_score": 5,
        "player2_score": 3,
        "winner_id": "user1"
    }
    
    For singleplayer matches:
    {
        "match_type": "singleplayer",
        "player_id": "user1",
        "player_score": 5,
        "cpu_score": 3,
        "winner": "WIN"  // "WIN" or "LOSS"
    }
    """
    match_type = request.data.get('match_type')
    
    if match_type == 'multiplayer':
        player1_id = request.data.get('player1_id')
        player2_id = request.data.get('player2_id')
        winner_id = request.data.get('winner_id')
        player1_score = request.data.get('player1_score')
        player2_score = request.data.get('player2_score')
        
        # Validate data
        if not all([player1_id, player2_id, winner_id, player1_score is not None, player2_score is not None]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create players
        player1, _ = Player.objects.get_or_create(player_id=player1_id)
        player2, _ = Player.objects.get_or_create(player_id=player2_id)
        winner, _ = Player.objects.get_or_create(player_id=winner_id)
        
        # Update player stats
        if winner_id == player1_id:
            player1.matches_won += 1
            player2.matches_lost += 1
        else:
            player1.matches_lost += 1
            player2.matches_won += 1
            
        player1.save()
        player2.save()
        
        # Create match record
        match = Match.objects.create(
            player1=player1,
            player2=player2,
            winner=winner,
            player1_score=player1_score,
            player2_score=player2_score
        )
        
        return Response(MatchSerializer(match).data, status=status.HTTP_201_CREATED)
        
    elif match_type == 'singleplayer':
        player_id = request.data.get('player_id')
        winner = request.data.get('winner')
        player_score = request.data.get('player_score')
        cpu_score = request.data.get('cpu_score')
        
        # Validate data
        if not all([player_id, winner, player_score is not None, cpu_score is not None]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create player
        player, _ = Player.objects.get_or_create(player_id=player_id)
        
        # Update player stats
        if winner == "WIN":
            player.matches_won += 1
        else:
            player.matches_lost += 1
            
        player.save()
        
        # Create match record
        match = MatchSingle.objects.create(
            player1=player,
            winner=winner,
            player1_score=player_score,
            cpu_score=cpu_score
        )
        
        return Response(MatchSingleSerializer(match).data, status=status.HTTP_201_CREATED)
    
    else:
        return Response({"error": "Invalid match type"}, status=status.HTTP_400_BAD_REQUEST)
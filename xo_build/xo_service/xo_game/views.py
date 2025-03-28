from rest_framework.request import Request

from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .jwtMiddleware import ProxyUser
from django.shortcuts import get_object_or_404
from django.http import Http404
from .models import Player, Match
from .serializers import PlayerSerializer
from rest_framework import serializers

class GetData(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request : Request, *args, **kwargs):
        current : ProxyUser = request.user
        current_id = current.to_dict()["id"]
        try:
            player = get_object_or_404(Player, player_id=current_id)
            serializer = PlayerSerializer(instance=player)
            return Response(data=serializer.data)

        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "Not found."})
        
class GetDataID(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request : Request, *args, **kwargs):
    
        current_id = kwargs.get("player_id")
        if not current_id:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail" : "Missing ID"})
        try:
            player = get_object_or_404(Player, player_id=current_id)
            serializer = PlayerSerializer(instance=player)
            return Response(data=serializer.data)

        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "Not found."})
        

class GetMatchHistory(APIView):
    permission_classes = [IsAuthenticated]

    class MatchSerializer(serializers.ModelSerializer):
        opponent = serializers.SerializerMethodField()
        result = serializers.SerializerMethodField()
        current_player_score = serializers.SerializerMethodField()
        opponent_score = serializers.SerializerMethodField()

        class Meta:
            model = Match
            fields = ['id', 'result', 'current_player_score', 'opponent_score', 'opponent', 'played_at']

        def get_result(self, obj):
            current_id = self.context.get('current_id')
            if obj.player1.player_id == current_id:
                return 'Win' if obj.winner == current_id else 'Loss'
            return 'Loss' if obj.winner == obj.player2.player_id else 'Win'
        def get_opponent(self, obj):
            current_id = self.context.get('current_id')
            return obj.player2.player_id if obj.player1.player_id == current_id else obj.player1.player_id
        
        def get_opponent_score(self, obj):
            current_id = self.context.get('current_id')
            return 1 if current_id != obj.winner else 0
        
        def get_current_player_score(self, obj):
            current_id = self.context.get('current_id')
            return 1 if current_id == obj.winner else 0
    
    
    def get(self, request: Request, *args, **kwargs):
        current : ProxyUser = request.user
        current_id = current.to_dict()["id"]
        id =  kwargs.get('player_id')
        if id:
            current_id = id
        try:
            player = get_object_or_404(Player, player_id=current_id)
            player1Match = Match.objects.filter(player1=player) \
                .all() \
                .values_list('player1', flat=True)
            player2Match = Match.objects.filter(player2=player) \
                .all() \
                .values_list('player2', flat=True)
            matches = Match.objects.filter(player1=player) | Match.objects.filter(player2=player)
            serializer = self.MatchSerializer(matches, many=True, context={'current_id': current_id})
            return Response(data=serializer.data)

        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "Not found."})
        

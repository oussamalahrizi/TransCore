from rest_framework.request import Request

from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .jwtMiddleware import ProxyUser
from django.shortcuts import get_object_or_404
from django.http import Http404
from .models import Player, Match, MatchSingle
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
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "PLayer Data Not found."})
        
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
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "PLayer Data Not found."})
        

class GetMatchHistory(APIView):
    permission_classes = [IsAuthenticated]

    class MatchSerializer(serializers.ModelSerializer):
        opponent = serializers.SerializerMethodField()
        result = serializers.SerializerMethodField()
        current_player_score = serializers.IntegerField(source='player1_score')
        opponent_score = serializers.IntegerField(source='player2_score')

        class Meta:
            model = Match
            fields = ['id', 'result', 'current_player_score', 'opponent_score', 'opponent', 'played_at']

        def get_result(self, obj):
            current_id = self.context.get('current_id')
            if obj.player1.player_id == current_id:
                return 'Win' if obj.player1_score > obj.player2_score else 'Loss'
            return 'Win' if obj.player2_score > obj.player1_score else 'Loss'

        def get_opponent(self, obj):
            current_id = self.context.get('current_id')
            return obj.player2.player_id if obj.player1.player_id == current_id else obj.player1.player_id

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
            return Response(status=status.HTTP_404_NOT_FOUND, data={'detail' : 'Player Data Not Found'})
        
class LeaderBoard(APIView):
    permission_classes = [IsAuthenticated]


    def get(self, request : Request , *args, **kwargs):

        players = Player.objects.all().values_list('score', 'player_id')
        sorted_players = sorted(players, key=lambda x: x[0])
        sorted_players.reverse()
        data = []
        for p in sorted_players:
            data.append({
                'score' : p[0],
                'player_id' : p[1],
            })
        print(data)
        return Response(data)

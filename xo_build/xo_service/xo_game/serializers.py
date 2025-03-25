from rest_framework import serializers
from .models import Player, Match

class PlayerSerializer(serializers.ModelSerializer):
    win_rate = serializers.SerializerMethodField()
    total_matches = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = ['player_id', 'matches_won', 'matches_lost', 'win_rate', 'total_matches']
    
    def get_win_rate(self, obj):
        total = obj.matches_won + obj.matches_lost
        if total == 0:
            return 0
        return round((obj.matches_won / total) * 100, 2)
    
    def get_total_matches(self, obj):
        return obj.matches_won + obj.matches_lost

class MatchSerializer(serializers.ModelSerializer):
    player1_id = serializers.CharField(source='player1.player_id', read_only=True)
    player2_id = serializers.CharField(source='player2.player_id', read_only=True)
    winner_id = serializers.CharField(source='winner.player_id', read_only=True)
    
    class Meta:
        model = Match
        fields = ['id', 'player1_id', 'player2_id', 'winner_id', 'played_at']

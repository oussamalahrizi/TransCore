from rest_framework import serializers
from .models import Player, Match, MatchSingle

class PlayerSerializer(serializers.ModelSerializer):
    win_rate = serializers.SerializerMethodField()
    total_matches = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = "__all__"
    
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
        fields = ['id', 'player1_id', 'player2_id', 'winner_id', 
                 'player1_score', 'player2_score', 'played_at']
    def get_player1(self, obj):
        pass

class MatchSingleSerializer(serializers.ModelSerializer):
    player_id = serializers.CharField(source='player1.player_id', read_only=True)
    
    class Meta:
        model = MatchSingle
        fields = ['id', 'player_id', 'winner', 'player1_score', 
                 'cpu_score', 'played_at']
from .models import Player, Match, MatchSingle

class GameService:
    @staticmethod
    def get_or_create_player(player_id):
        """
        Get or create a player by player_id
        """
        player, created = Player.objects.get_or_create(player_id=player_id)
        return player
    
    @staticmethod
    def record_match(player1_id, player2_id, winner_id, p1_score, p2_score):
        """
        Record a match and update player stats
        """
        # Get or create players
        player1 = GameService.get_or_create_player(player1_id)
        player2 = GameService.get_or_create_player(player2_id)
        winner = GameService.get_or_create_player(winner_id)
        
        # Update player stats
        if winner_id == player1_id:
            player1.matches_won += 1
            player1.score += 20
            player2.matches_lost += 1
            if player2.score - 20 <= 0:
                player2.score = 0
            else:
                player2.score -= 20
        else:
            player2.matches_won += 1
            player2.score += 20
            player1.matches_lost += 1
            if player1.score - 20 <= 0:
                player1.score = 0
            else:
                player1.score -= 20
        
        player1.save()
        player2.save()
        
        # Create match record
        match = Match.objects.create(
            player1=player1,
            player2=player2,
            winner=winner,
            player1_score=p1_score,
            player2_score=p2_score
        )
        
        return match

    @staticmethod
    def record_single_match(player_id, is_win, player_score, cpu_score):
        """
        Record a single player match against CPU and update player stats
        """
        # Get or create player
        player = GameService.get_or_create_player(player_id)
        print(is_win)
        # Update player stats
        if is_win:
            player.matches_won += 1
            player.score += 20
            winner_status = "WIN"
        else:
            player.matches_lost += 1
            if player.score - 20 <= 0:
                player.score = 0
            else:
                player.score -= 20
            winner_status = "LOSS"
        
        player.save()
        
        # Create match record
        match = MatchSingle.objects.create(
            player1=player,
            winner=winner_status,
            player1_score=player_score,
            cpu_score=cpu_score
        )
        
        return match
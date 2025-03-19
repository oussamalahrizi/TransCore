from django.db import models

# Create your models here.


class Player(models.Model):
    player_id = models.CharField(max_length=100, unique=True, primary_key=True, editable=False)
    matches_won = models.IntegerField(default=0)
    matches_lost = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.player_id} (W:{self.matches_won}/L:{self.matches_lost})"


class Match(models.Model):
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player1_matches')
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player2_matches')
    winner = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='won_matches')
    player1_score = models.IntegerField()
    player2_score = models.IntegerField()
    played_at = models.DateTimeField(auto_now_add=True)

    

class MatchSingle(models.Model):
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='single_player')
    winner = models.CharField(max_length=10, choices=[
        ("WIN","WIN"),
        ("LOSS", "LOSS")
    ], default="WIN")
    player1_score = models.IntegerField()
    cpu_score = models.IntegerField()
    played_at = models.DateTimeField(auto_now_add=True)



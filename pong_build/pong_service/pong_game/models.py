from django.db import models

# Create your models here.


class Player(models.Model):
    player_id = models.CharField(max_length=100, unique=True, primary_key=True)
    matches_won = models.IntegerField(default=0)
    matches_lost = models.IntegerField(default=0)
    score = models.IntegerField(default=400)



class Match(models.Model):
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player2')
    winner = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='winner')
    player1_score = models.IntegerField()
    player2_score = models.IntegerField()
    played_at = models.DateTimeField(auto_now_add=True)


class MatchSingle(models.Model):
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player')
    winner = models.CharField(max_length=10, choices=[
        ("WIN","WIN"),
        ("LOSS", "LOSS")
    ], default="WIN")
    player1_score = models.IntegerField()
    cpu_score = models.IntegerField()
    played_at = models.DateTimeField(auto_now_add=True)
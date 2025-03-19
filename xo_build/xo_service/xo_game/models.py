from django.db import models

class Match(models.Model):
    player_1_id = models.IntegerField()
    player_2_id = models.IntegerField()
    winner = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Match {self.id} ({self.player_1_id} vs {self.player_2_id})"
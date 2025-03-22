import requests
from django.conf import settings

def save_game_result(game_data):
    """
    Save game result to the database through the API
    
    game_data should be a dict with:
    - match_type: 'multiplayer' or 'singleplayer'
    - player1_id: ID of player 1 (required for multiplayer)
    - player2_id: ID of player 2 (required for multiplayer)
    - player_id: ID of player (required for singleplayer)
    - player1_score: Score of player 1 (required for multiplayer)
    - player2_score: Score of player 2 (required for multiplayer)
    - player_score: Score of player (required for singleplayer)
    - cpu_score: Score of CPU (required for singleplayer)
    - winner_id: ID of winner (required for multiplayer)
    - winner: 'WIN' or 'LOSS' (required for singleplayer)
    """
    try:
        # Make an internal API request to save the game result
        # This way we use the same validation logic defined in the API
        response = requests.post(
            f"http://localhost:{settings.INTERNAL_API_PORT}/pong/api/save-match/",
            json=game_data
        )
        return response.status_code == 201
    except Exception as e:
        print(f"Error saving game result: {e}")
        return False
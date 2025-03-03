"""
    generate id store in cache for 60 secs,
    send game id in notification to both players
    /pong/game_id=123
    /tictac/game_id=123
    /check_game/ check game with game id if its valid

    {
        type : "regular" | "tournament",
        tournament_id : uuid | null,
        player1 : uuid,
        player2 : uuid,
        game_id : uuid,
        gametype : "pong" | "tictac"
    }
    
    /find_match/ 
"""

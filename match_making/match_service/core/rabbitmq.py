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
    tournament design :
    the tournament schedule randomly players 4 players example:
    player x vs player y => (x and y vary about any current match on the tournament)
        sends message through rabbitmq to establish a game id to be sent to game service
        game service stores the game result with additional type as tournament with tournament name




    game db schema for each game (pong/tictac):
    game model : {
        type : "regular" | "single" | "tournament",
        game_id : uuid,
        player1 : uuid,
        player2 : uuid,
        tournament_id : uuid | null, (type has to be tournament for this to not be null)
        winner : reference of winning player uuid,
    }
    player model : {
        player_id : uuid,
        # any additional stats
        win streak : unsigned int,
    }
    game service has to report if the game type is tournament to the tournament service,
    tournament services receives the info from game service like this :
    {
        match id : uuid,
        winner : uuid,
        tournament id : uuid,
    }
    then advance to the next round

    matchmaking consumer : 
        - listens on the following urls : 
            /find_match
            /check_game
        - listens on the broker:
            the tournament service has to publish a json object to the matchmaking service
            {
                player1 : uuid,
                player2 : uuid,
                tournament_id : uuid,
                game_type : "pong" | "tictac"
            }
            so the matchmaking service generates a game id to store in its cache, then we notify the
            concerning players

        tournament db schema :
        {
            game type : "pong" | "tictac",
            winner: uuid,
        }
        
"""


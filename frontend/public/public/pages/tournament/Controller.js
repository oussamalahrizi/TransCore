
// how data should be 
let players = [
    { id: 1, name: 'Player 1', score: 0 },
    { id: 2, name: 'Player 2', score: 0 },
    { id: 3, name: 'Player 3', score: 0 },
    { id: 4, name: 'Player 4', score: 0 }
];

let tournamentState = {
    semifinal1Winner: null,
    semifinal2Winner: null,
    finalWinner: null,
    currentRound: 'semifinal',
    matchesCompleted: 0,
    isRunning: false
};


const fetchTournamentData = async () => {
    const {data, error} = await app.utils.fetchWithAuth("/api/match/tournament/")
    if (error)
    {
        app.utils.showToast(error)
        app.Router.navigate("/")
        return
    }
    return data
}


export default async () => {
    // DOM Elements
    
    try {
        // fetch ongoing tournament
        const Players = await fetchTournamentData()
        /*
            [
                {}
            ]
        */
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        console.error("error in tournament controller", error);
        
    }
   
}; 
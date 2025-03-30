import { hideModalWithAnimation, showModalWithAnimation } from "../../modalAnimations.js"


const fetchTournamentData = async () => {
    const {data, error} = await app.utils.fetchWithAuth("/api/match/tournament/")
    if (error)
    {
        app.utils.showToast(error)
        return null
    }
    console.log(data);
    
    return data
}

const addModal = (number) => {
    var modal = document.getElementById('waiting-tr')
    if (modal)
        modal.remove()
    modal = document.createElement('div')
    modal.id = 'waiting-tr'
    modal.className = 'absolute top-0 left-0 z-500 w-full h-full min-h-screen flex justify-center items-center text-2xl text-white bg-black/75'
    modal.innerHTML = /*html*/`<h1>Waiting for ${number} players</h1>`
    const page = document.getElementById('tr_view')
    page.appendChild(modal)
}

export const fetchUserData = async (user_id) => {
    const {data, error} = await app.utils.fetchWithAuth(`/api/main/user/${user_id}/`)
    if (error)
    {
        app.utils.showToast(error)
        return null
    }
    return data.username
}

/**
  tr_data =
  {
    'semis' : [half1, half2],
    'semis_results' : [ [0,0], [0,0] ],
    'final' : [],
    'final_result' : [0, 0],
    'winner' : None,
    'status' : 'ongoing'
    }
 */

const handleOnGoing = async (data) => {
    const {
        semis,
        final,
    } = data
    console.log(data);
    
    // get dom elements
    // fill players
    const player1 = document.getElementById('player1')
    const player2 = document.getElementById('player2')
    const player3 = document.getElementById('player3')
    const player4 = document.getElementById('player4')

    player1.innerText = await fetchUserData(semis[0].players[0]) || 'Player 1'
    player2.innerText = await fetchUserData(semis[0].players[1]) || 'Player 2'
    player3.innerText = await fetchUserData(semis[1].players[0]) || 'Player 3'
    player4.innerText = await fetchUserData(semis[1].players[1]) || 'Player 4'
    
    // fill their score
    const player1_score = document.getElementById('player1-score')
    const player2_score = document.getElementById('player2-score')
    const player3_score = document.getElementById('player3-score')
    const player4_score = document.getElementById('player4-score')

    player1_score.innerText = semis[0].result[0]
    player2_score.innerText = semis[0].result[1]
    player3_score.innerText = semis[1].result[0]
    player4_score.innerText = semis[1].result[1]

    // get finals and fill scores
    const final1 = document.getElementById('winner1')
    const final1_score = document.getElementById('winner1-score')
    const final2 = document.getElementById('winner2')
    const final2_score = document.getElementById('winner2-score')

    final1_score.innerText = final.result[0]
    final2_score.innerText = final.result[1]
    final1.innerText = 'TBD'
    final2.innerText = 'TBD'
    if (final.players[0])
        final1.innerText = await fetchUserData(final.players[0]) || 'TBD'
    if (final.players[1])
        final2.innerText = await fetchUserData(final.players[1]) || 'TBD'
}

/**
 * 
 * @param {CustomEvent} e 
 */
const handleTournamentEvents = async (e) => {
    try {
        
        const data = await fetchTournamentData() || []
        if (data instanceof Array)
        {
            console.log('new Players : ', data);
            console.log(data.length);
            addModal(4 - data.length)
        }
        else
        {
            const modal = document.getElementById('waiting-tr')
            if (modal)
                modal.remove()
            // handle tournament progress
            await handleOnGoing(data)
        }
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        console.error('error in tr listerner', error);
    }
}


export default async () => {
    try {
        // setup tournament listener
        const view = document.getElementById("tr_view")
        view.addEventListener('refresh', handleTournamentEvents)
        view.dispatchEvent(new CustomEvent('refresh'))
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        console.error("error in tournament controller", error);
    }   
}; 
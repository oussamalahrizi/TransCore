

class HomeComp extends HTMLElement
{
	constructor()
	{
		this.state = {}
		this.getCookie = getCookie
	}

	checkToken()
	{
		if (this.state.access)
			return
		
	}

	connectedCallback()
	{
		
	}
}
export default /*html*/ `
	<div id="home-view" class="flex flex-col items-center bg-gray-100 min-h-screen justify-center">
		<h1 class="text-6xl font-bold mb-2">
			Home
		</h1>
		<button value="My data" id="fetch-data" class="py-2 px-4 my-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition duration-300 text-white" >Get data</button>
		<p></p>
		<button id="logout" class="py-2 px-4 text-white bg-gray-500 font-semibold rounded-lg
			hover:bg-gray-600 transition duration-300">Logout</button>
		<button id="ban-self"
			class="py-2 px-4 m-1 rounded-lg text-white font-semibold
				 bg-blue-500 hover:bg-blue-600 transition duration-300">BAN ME</button>
		<a href="/404" class="py-2 px-4 m-1 rounded-lg text-white font-semibold bg-blue-500 hover:bg-blue-600 transition duration-300">go to 404</a>
		<a href="/auth/login" class="py-2 px-4 m-1 rounded-lg text-white font-semibold bg-blue-500 hover:bg-blue-600 transition duration-300">go to auth</a>
		<a href="/non-existing" class="py-2 px-4 m-1 rounded-lg text-white font-semibold bg-blue-500 hover:bg-blue-600 transition duration-300">go to non-existing</a>
	</div>
`
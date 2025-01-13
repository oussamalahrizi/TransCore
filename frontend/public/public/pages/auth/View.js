export default /*html*/ `
	<div id="auth-view" class="bg-gray-100 min-h-screen flex items-center justify-center">
	<div class="text-center">
		<p class="text-2xl text-gray-600 mb-8">Auth Required</p>
		<div class="flex">
			<a href="/" class="bg-blue-500 mx-3 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300">
				Go Back Home
			</a>
			<a href="/404" class="bg-blue-500 mx-3 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300">
				Go 404
			</a>
			<button id="generate" class="py-2 px-4 text-white bg-gray-600 font-semibold rounded-lg
			hover:bg-gray-700">Generate</button>
		</div>
	</div>
	</div>
`;
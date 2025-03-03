
export default /*html*/`
    <div id="2fa-view" class="w-full min-h-screen flex justify-center items-center text-white">
        <div class="flex max-w-md w-full p-6 flex-col rounded-lg shadow-md bg-slate-200">    
            <form id="form" class="mx-3 flex flex-col">
                <input name="code" type="text" placeholder="Enter 6 digit verification code"
                    class="my-2 p-2 px-3 bg-gray-600 focus:outline-none rounded-lg"/>
                <button class="rounded-full bg-green-600 hover:bg-green-700 py-2" type="submit">Verify</button>
            </form>
        </div>
    </div>
`
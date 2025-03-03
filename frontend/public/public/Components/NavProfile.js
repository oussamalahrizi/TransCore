export default ({username, icon_url})=> /*html*/`
    <button id="profile-icon" class="flex hover:bg-gray-700 rounded-lg px-2">
        <img class="w-8 h-8 mr-3" src="/public/assets/icon-placeholder.svg" />
        <h1 class="text-lg font-semibold text-gray-500">${username}</h1>
    </button>
`

export const placeholder = /*html*/`
    <a href="/" class="flex hover:bg-gray-700 rounded-lg px-2">
        <img class="w-8 h-8 mr-3" src="/public/assets/icon-placeholder.svg" />
        <h1 class="text-lg font-semibold text-gray-500">User</h1>
    </a>
`

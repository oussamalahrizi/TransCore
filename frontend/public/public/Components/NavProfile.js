
export default ({username, icon_url})=> /*html*/`
    <button id="profile-icon">
        ${
            !icon_url ?
                /*html*/`<img src="/public/assets/icon-placeholder.svg" class="object-cover rounded-full" />`
            :                
                /*html*/`<img src=${icon_url} class="object-cover rounded-full" />`
        }
        <h1>${username}</h1>
    </button>
`

export const placeholder = /*html*/`
    <a href="/" class="profile-placeholder-link">
        <img src="/public/assets/icon-placeholder.svg" />
        <h1>User</h1>
    </a>
`

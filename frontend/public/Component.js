export class ReactiveElement extends HTMLElement {
    constructor() {
        super();
        this._state = {};
        this._renderScheduled = false;
        this._events = [];
        
        // Bind methods
        this.render = this.render.bind(this);
        this.updated = this.updated.bind(this);
        this.setState = this.setState.bind(this);
        this.bind_event = this.bind_event.bind(this);
    }

    setState(updater) {
        const updatedState =
            typeof updater === "function" ? updater(this._state) : updater;

        this._state = { ...this._state, ...updatedState };
        this.scheduleRender();
    }

    scheduleRender() {
        if (!this._renderScheduled) {
            this._renderScheduled = true;
            Promise.resolve().then(() => {
                this._renderScheduled = false;
                this.updated(); // Only call updated(), not render()
            });
        }
    }

    bind_event(id, type, callback) {
        const el = this.querySelector("#" + id);
        if (el) {
            const boundCallback = callback.bind(this);
            el.addEventListener(type, boundCallback);
            this._events.push({ id, type, callback: boundCallback });
        }
    }

    // Lifecycle Methods
    connectedCallback() {
        this.onCreate?.(); // Optional lifecycle hook
        this.render(); // Render once to set up initial DOM structure
        this.bind_default?.(); // Optional event binding hook
        this.updated(); // Initial state update
    }

    disconnectedCallback() {
        // Cleanup events
        this._events.forEach(event => {
            const el = this.querySelector("#" + event.id);
            el?.removeEventListener(event.type, event.callback);
        });
        this._events = [];
        this.onDestroy?.(); // Optional cleanup hook
    }

    // Hook for post-render updates
    updated() {
        // Override in child class if needed
    }

    // Default render method
    render() {
        // Should be overridden in child class
        this.innerHTML = `
            <div>Override render() method</div>
        `;
    }
}


class MyComponent extends ReactiveElement {
    constructor() {
        super();
        this._state = {
            count: 0,
            users: []
        };
    }

    bind_default() {
        this.bind_event("myButton", "click", this.handleClick);
        this.bind_event("add", "click", this.addUser);
    }

    handleClick() {
        this.setState(prev => ({ count: prev.count + 1 }));
    }

    async addUser() {
        try {
            const res = await fetch("https://randomuser.me/api/");
            const data = await res.json();
            this.setState(prev => ({
                users: [...prev.users, ...data.results]
            }));
        } catch (error) {
            console.error("Failed to fetch user:", error);
        }
    }

    updated() {
        const countEl = this.shadowRoot.querySelector("#count");
        const usersEl = this.shadowRoot.querySelector("#users");
        
        if (countEl) countEl.textContent = `Count: ${this._state.count}`;
        if (usersEl)
        {
            usersEl.innerHTML = this._state.users
                .map(user => `<div class="user-item">${user.email}</div>`)
                .join('');
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <div class="my-component">
                <button id="myButton">Click</button>
                <div id="count">Count: ${this._state.count}</div>
                <hr/>
                <button id="add">Add User</button>
                <div id="users"></div>
            </div>
        `;
    }
}

customElements.define("test-counter", MyComponent);
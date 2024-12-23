import { ReactiveElement } from "../Component.js";

export class AuthPage extends ReactiveElement {
  constructor() {
    super();
    this._state = {};
    this._renderScheduled = false;

    // Automatically bind lifecycle methods
    this.render = this.render.bind(this);
    this.updated = this.updated.bind(this);

    this.google_id =
      "497827531703-p9gdfs3jsnjm8hld9ot1uilao6lk1vup.apps.googleusercontent.com";
    this.intra_id =
      "u-s4t2ud-bb8bb45d805dea5d561774903f1d1899c73b0ac051410cd7cae382331781f8cf";
  }

  bind_default() {
    this.bind_event("login-google", "click", this.handleGoogle);
    this.bind_event("login-42", "click", this.handleIntra);
  }

  handleGoogle() {
    const params = {
      client_id: this.google_id,
      redirect_uri: 'http://localhost:8000/auth/google_callback/',
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    };

    const queryString = new URLSearchParams(params).toString();
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;
  }

  handleIntra() {
    const params = {
      client_id: this.intra_id,
      redirect_uri: 'http://localhost:8000/auth/intra_callback/',
      response_type: 'code'
    };
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `https://api.intra.42.fr/oauth/authorize?${queryString}`;
  }

  updated() {}

  
  connectedCallback() {
    super.connectedCallback();
  }

  render() {
    this.innerHTML = `
      <div class="flex justify-center items-center h-full">
        <div class="p-8 ">
          <h1 class="mb-6 text-2xl font-bold text-center">Login</h1>
          <div class="space-y-4">
            <button
              id="login-google"
              class="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline"
            >
              Login with Google
            </button>
            <button
              id="login-42"
              class="w-full px-4 py-2 font-bold text-white bg-gray-700 rounded-full hover:bg-gray-900 focus:outline-none focus:shadow-outline"
            >
              Login with 42
            </button>
          </div>
        </div>
        </div>
    `;
  }
}

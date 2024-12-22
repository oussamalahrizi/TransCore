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
      "100809627397-i5v37uvc8gu7f72qcmmb4apq80u6vcej.apps.googleusercontent.com";
    this.intra_id =
      "u-s4t2ud-bb8bb45d805dea5d561774903f1d1899c73b0ac051410cd7cae382331781f8cf";
  }

  bind_default() {
    this.bind_event("login-google", "click", this.handleGoogle);
    this.bind_event("login-42", "click", this.handleIntra);
  }

  handleGoogle() {
    alert("login with google");
  }

  handleIntra() {
    alert("login with intra 42");
  }

  updated() {}

  
  connectedCallback() {
    super.connectedCallback();
    this.handleLoggedIn(); // Fixed typo in method name
  }

  render() {
    this.innerHTML = `
      <div class=" flex flex-col items-center justify-center min-h-screen w-full bg-gray-100">
        <div class="p-8 bg-white rounded-lg shadow-md">
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

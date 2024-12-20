// export class Counter extends HTMLElement {
// 	constructor() {
// 		super();
// 		this.state = { count: 0 };
// 		this.attachShadow({ mode: 'open' });
// 		this.events = []
// 		this.increment = this.increment.bind(this);
//     	this.decrement = this.decrement.bind(this);
// 	}

// 	updateState(updater)
// 	{
// 		const updatedState =
// 			typeof updater === "function" ? updater(this.state) : updater;

//     	this.state = { ...this.state, ...updatedState };
//     	this.render();
// 		console.log("set state called");
// 	}

// 	bind_event(id, type, callback)
// 	{
// 		const el = this.shadowRoot.querySelector("#" + id);
// 		if (el) {
// 			el.addEventListener(type, callback);
// 			this.events.push({ id, type, callback });
// 		} else {
// 			console.warn(`Element with ID "${id}" not found`);
// 		}
// 	}

// 	connectedCallback()
// 	{
// 		console.log("mounted");
// 		this.render();
// 		this.bind_event("increment", "click", this.increment);
// 		this.bind_event("decrement", "click", this.decrement);
// 	}

// 	increment()
// 	{
// 		this.updateState((prev) => ({count : prev.count + 1}))
// 	}

// 	decrement()
// 	{
// 		this.updateState((prev) => ({count : prev.count - 1}))
// 	}

// 	disconnectedCallback()
// 	{
// 		this.events.forEach((event) => {
// 			const el = this.shadowRoot.querySelector("#" + event.id);
// 			if (el) {
// 			  el.removeEventListener(event.type, event.callback);
// 			}
// 		  });
// 		  console.log("unmounted");
// 	}
	
// 	render() {
// 		this.shadowRoot.innerHTML = `
// 			<style>
// 				.counter {
// 					padding: 1rem;
// 					font-family: system-ui;
// 				}
// 				button {
// 					margin: 0 0.5rem;
// 					padding: 0.5rem 1rem;
// 				}
// 			</style>
// 			<div class="counter">
// 				<h2>Counter: ${this.state.count}</h2>
// 				<button id="increment">Increment</button>
// 				<button id="decrement">Decrement</button>
// 			</div>
// 		`;
// 	}
// }

// customElements.define('counter-test', Counter);



export class ReactiveElement extends HTMLElement {
  
	constructor() {
	  super();
  
	  // Automatically bind lifecycle methods
	  this.render = this.render.bind(this);
	  this.updated = this.updated.bind(this);
	}
  
	// State getter and setter for reactivity
	setState(updater) {
	  const updatedState =
		typeof updater === "function" ? updater(this._state) : updater;
  
	  this._state = { ...this._state, ...updatedState };
	  this.scheduleRender();
	}
    
	// Schedule render to avoid redundant updates
	scheduleRender() {
	  if (!this._renderScheduled) {
		this._renderScheduled = true;
		Promise.resolve().then(() => {
		  this._renderScheduled = false;
		  this.updated();
		});
	  }
	}
  
	// Ensure rendering happens when connected to the DOM
	connectedCallback() {
	  this.render();
	  this.updated();
	}
  
	// Called after the DOM has been updated
	updated() {
	  // Optional lifecycle hook for subclasses
	}
  
	// Render method: should be overridden in subclasses
	render() {
	  this.shadowRoot.innerHTML = `
		<div>
		  <p>Override the render() method to define the component template.</p>
		</div>
	  `;
	}
  }
  
// customElements.define('reactive-element', ReactiveElement);


class Counter extends ReactiveElement {
	static observedAttributes = ['count']; // React to "count" attribute changes
  
	constructor() {
	  super();
	  this._state = { count: 0 }; // Initial state
	}
  
	// Increment and decrement logic
	increment() {
	  this.setState((prev) => ({ count: prev.count + 1 }));
	}
  
	decrement() {
	  this.setState((prev) => ({ count: prev.count - 1 }));
	}
  
	
	// Define the template
	render() {
	  this.shadowRoot.innerHTML = `
		<style>
		  .counter {
			padding: 1rem;
			font-family: system-ui;
		  }
		  button {
			margin: 0 0.5rem;
			padding: 0.5rem 1rem;
		  }
		</style>
		<div class="counter">
		  <h2 id="counter-value">Counter: ${this._state.count}</h2>
		  <button id="increment">Increment</button>
		  <button id="decrement">Decrement</button>
		</div>
	  `;
  
	  // Bind event listeners after rendering
	  this.shadowRoot.querySelector("#increment").onclick = () => this.increment();
	  this.shadowRoot.querySelector("#decrement").onclick = () => this.decrement();
	}
  
	// Optional: Lifecycle hook called after render
	updated() {
		this.shadowRoot.querySelector("#counter-value").innerHTML = `Counter : ${this._state.count}`
	  console.log("Counter updated:", this._state.count);
	}
  }
  
  customElements.define('counter-test', Counter);
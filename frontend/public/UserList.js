// // import { Component } from './Component.js';
// // import "./CounterExample.js"
// // export class UserList extends Component {
// //   onCreate() {
// //     this.setState({
// //       users: []
// //     });
// //   }

// //   connectedCallback() {
// //     super.connectedCallback();
// // 	  console.log("mounted");
// //     this.fetchUsers();
// //   }

// // 	fetchUsers() {
// // 		setTimeout(async () => {
// // 		try {
// // 			const response = await fetch('https://jsonplaceholder.typicode.com/users/');
// // 			const users = await response.json();
// // 			this.setState({ users });
// // 			console.log('state update');

// // 			} catch (error) {
// // 				console.error('Failed to fetch users:', error);
// // 			}
// // 		}, 1000);
// //   }

// //   clear()
// //   {
// // 	this.setState({users : []})
// //   }

// //   render() {
// //     return this.html`
// //       <style>
// //         .user-list {
// //           padding: 20px;
// //           display : flex;
// //           flex-direction : column;
// //           flex : 1;
// //         }
// //         .user-card {
// //           border: 1px solid #ccc;
// //           margin: 10px 0;
// //           padding: 10px;
// //           border-radius: 4px;

// //         }
// //       </style>
// //       <div class="user-list">
// //         <h2>Users</h2>
// //         <button onclick="clear">clear</button>
// //         <counter-example ></counter-example>
// //         ${this.state.users.map(user => `
// //               <div class="user-card">
// //                 <h3>${user.name}</h3>
// //                 <p>Email: ${user.email}</p>
// //                 <p>Company: ${user.company.name}</p>
// //               </div>
// //             `).join('')
// //         }
// //       </div>
// //     `;
// //   }
// // }

// import "./CounterExample.js";

// class UserList extends HTMLElement {
//   constructor() {
//     super();
//     this.state = { users: [] };
//     this.attachShadow({ mode: "open" });
//   }

//   connectedCallback() {
//     this.render();
// 	this.bind_events()
//     setTimeout(async () => {
// 		this.fetchUsers();
// 	}, 1000);
//   }

//   bind_events()
//   {
// 	this.shadowRoot.querySelector("clear", ()=>
// 	{
// 		this.setState({users : []})
// 	})
//   }

//   setState(newState) {
//     this.state = { ...this.state, ...newState };
//     this.render();
//   }

//   async fetchUsers() {
//     const response = await fetch("https://jsonplaceholder.typicode.com/users");
//     const data = await response.json();
//     this.setState({users : data});
//   }
//   disconnectedCallback() {
//     // cleanup
// 	this.shadowRoot.querySelector('#clear')
//       ?.removeEventListener('click', this.decrement);
//   }

//   render() {
//     this.shadowRoot.innerHTML = `
// 			<style>
// 				.user-list {
// 				padding: 20px;
// 				display : flex;
// 				flex-direction : column;
// 				flex : 1;
// 				}
// 				.user-card {
// 				border: 1px solid #ccc;
// 				margin: 10px 0;
// 				padding: 10px;
// 				border-radius: 4px
// 				}
// 			</style>
// 		<div class="user-list">
// 		<h2>Users</h2>
// 		<button id="clear">clear</button>
// 		<counter-test></counter-test>
// 			${this.state.users
//         .map(
//           (user) => `
// 				<div class="user-card">
// 					<p>Email: ${user.email}</p>
// 				</div>
// 				`
//         )
//         .join("")}
// 		</div>
// 		`;
//   }
// }



import {ReactiveElement} from "./CounterExample.js"

class UserList extends ReactiveElement
{
	constructor()
	{
		super();
		this._state = {users : []};
		this._renderScheduled = false;
	
		// Automatically bind lifecycle methods
		this.render = this.render.bind(this);
		this.updated = this.updated.bind(this);
	}

	async fetchUser()
	{
		const res = await fetch("https://randomuser.me/api/");
		const data = await res.json();
		this.setState({ users: data.results });
	}

	updated()
	{
		this.shadowRoot.querySelector("#user-content").innerHTML = `
			${this._state.users.length ? this._state.users
				.map(
				(user) => `
						<div class="user-card">
							<p>Email: ${user.email}</p>
						</div>
						`
				)
				.join("") : ""}
		`
	}
	render()
	{
		this.shadowRoot.innerHTML = `
		<style>
				.user-list {
				padding: 20px;
				display : flex;
				flex-direction : column;
				flex : 1;
				}
				.user-card {
				border: 1px solid #ccc;
				margin: 10px 0;
				padding: 10px;
				border-radius: 4px
				}
			</style>
		<div class="user-list">
		<h2>Users</h2>
		<button id="reset">reset</button>
		<counter-test></counter-test>
		<div id="user-content"></div>
		</div>`
		this.shadowRoot.querySelector("#reset").onclick = () => this.fetchUser();
	}
}

customElements.define("user-list", UserList);

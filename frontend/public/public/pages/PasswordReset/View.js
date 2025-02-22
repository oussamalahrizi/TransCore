// export const lwla = /*html*/ `
//     <div id="reset-pw-view" class="bg-gray-100 min-h-screen flex items-center justify-center">
//         <form id="reset-form" class="w-full flex max-w-md px-10 py-6 flex-col rounded-lg shadow-md bg-white">
//             <h2 class="text-xl font-semibold mb-4 text-center">Forgot Password</h2>
//             <input type="email" placeholder="Email" autocomplete="email" name="email" class="mb-3 p-2 border rounded">
//             <button type="submit" id="reset-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-300">
//                 Send Code
//             </button>
//             <a href="/auth/login" class="bg-transparent px-6 mt-2 justify-center flex hover:bg-gray-300 text-blue-700 font-semibold py-2 rounded-lg transition duration-300 w-full">
//                 Return to sign in
//             </a>
//         </form>
//     </div>
// `

// export const verifyView = /*html*/`
//     // <form id="verify-form" class="w-full flex max-w-md px-10 py-6 flex-col rounded-lg shadow-md bg-white">
//     //     <h2 class="text-xl font-semibold mb-4 text-center">Enter Code</h2>
//     //     <input type="text" placeholder="Enter code received in email" name="code" class="mb-3 p-2 border rounded">
//     //     <button type="submit" id="verify-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-300">
//     //         Verify
//     //     </button>
//     // </form>
// `

export default /*html*/`
    <div class="reset-container">
        <div id="reset-pw-view" class="inner-container">
            <form id="reset-form" class="reset-form-css">
                <h2 class="reset-title">Reset your password</h2>
                <p class="notes">Please enter your email</p>
                <input type="email" placeholder="Player123@gmail.com" name="email" autocomplete="email" class="reset-form-input">
                <button type="submit" id="reset-btn" class="reset-button">Send code</button>
                <div class="login-page-div">
                    <p class="notes">Go back to login page</p>
                    <a class="login-page" href="/auth/login"> Login page</a>
                </div>
            </form>
        </div>
    </div>
`

export const verifyView = /*html*/`
    <form id="verify-form" class="reset-form-css">
        <h2 class="reset-title">Reset your password</h2>
        <p class="notes">Please enter the code we sent you</p>
        <input type="text" placeholder="6 Digits code" name="code" class="reset-form-input">
        <button type="submit" id="verify-btn" class="reset-button">Verify</button>
    </form>
`
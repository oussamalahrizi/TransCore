export default /*html*/ `
    <div id="settings" class="min-h-screen flex justify-center w-full items-center">
        <div class="flex max-w-sm w-full flex-col bg-gray-100 rounded-md p-6 shadow-sm">
            <h1>2FA settings</h1>
            <div class="mt-2 max-w-md flex justify-between items-center">
                <p class="font-semibold text-lg">Enable 2FA</p>
                <button id="enable" class="py-2 px-3 rounded-md bg-black text-white">Enable</button>
            </div>   
            <div id="qrcode-container"></div>     
        <div>
    </div>
`

export const QRCodeView = /*html*/ `
    <div class="mt-6">
        <div class="bg-gray-100 p-4 rounded-md mb-4">
            <div class="flex justify-center mb-4">
                <h2>QR Code Here</h2>
            </div>
                <p class="text-sm text-center text-gray-400">Scan this QR code with your authenticator app</p>
            </div>
            <ol class="list-decimal list-inside py-2 my-2 text-sm mb-4">
                <li>Open your authenticator app</li>
                <li>Tap the "+" icon to add a new account</li>
                <li>Scan the QR code above</li>
                <li>Enter the 6-digit code from your app below</li>
            </ol>
            <div class="flex justify-between items-center space-x-2">
                <input type="text" placeholder="Enter 6-digit code" class="flex-1
                flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50" />
                <button class="py-2 px-3 rounded-md bg-black text-white">Verify</button>
            </div>
        </div>
  </div>
`
import { showToast } from "../../Components/toast.js";

export default () => {
    const view = document.getElementById("socket-container")
    const button = view.querySelector("#connect")

    const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNWQxYTA1OTAtMTE0ZS00YzlmLWEzZGUtOGY4OTM2NWZhMGY3IiwiZXhwIjoxNzM4NTkxOTI1LCJpYXQiOjE3Mzg1OTEwMjUsInR5cCI6IkJlYXJlciIsInNlc3Npb25fc3RhdGUiOiJmZDA0ODdmMy1jNjAwLTQ4ZjAtYTk4Yi00YWNmOTA4ZDZjZjIifQ.Kv_Nxdk_l7Cmqv2UjfQXwSGWgiI9If-8Ma8ZbozsGtrwQuSAAsEirUCIVGlrBt9fYz9zAaGZCo9CoN1fp2sBP8WcNNdSxhvUPh1ydYHb3jYmyxz4BYWIriPUvf--bb0NbN4Y5tYnabiO2K6L4-pxo81uQ5AeUkfmU_uKpihXx7WglOkURttCs6GLQYv_W78roCyGHvok83lZRX0feEDmCAHX8iNtbFgA6VebKDMp8OCqjoAHcDVDSyaK16cLLIOOeJiOATJX3JL9n2di0d3KKpV5OuJS3vGBsdaP1EdqMGIslgtQLIDmDqXNjWznFtKAanPnsb5338VJpiffkxKjbg"

    let ws;
    button.addEventListener("click", async () => {
        ws = new WebSocket("ws://localhost:8000/api/ws/?token=" + token)

        ws.onopen = ()=> {
            showToast("connected", 'green')
        }
        ws.onerror = (e) => {
            showToast("error: ", 'red')
        }
        ws.onclose = (e) => {
            showToast("closed "+  e.reason, 'red')
            console.log("reason : ", e.reason, "code : ", e.code);
            
        }
        ws.onmessage = (e) => {
            showToast("received message", 'green')
            console.log("message : ", JSON.stringify(e.data));
            
        }
    })

}
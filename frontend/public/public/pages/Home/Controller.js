
import { stopTokenRefresh } from "../../Router.js";

const LoadCss = (href) => {
	return new Promise(async (resolve, reject) => {
        const existingLink = document.head.querySelector(`link[href="${href}"]`);
        if (existingLink)
            return resolve()
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;

        link.onload = () => {
            console.log(`✅ CSS loaded: ${href}`);
            resolve();
        };

        link.onerror = (error) => {
            console.error(`❌ Failed to load CSS: ${href}`, error);
			document.head.removeChild(link)
            reject(new Error(`Failed to load CSS at ${href}`));
        };

        // Append the new link to the head
        document.head.appendChild(link);
        console.log(`📥 Added new CSS with href: ${href}`);
    })
}



export default  () => {
    // (async ()=> {
    //     try {
    //         const res = await fetch("http://localhost:8000/api/auth/refresh/")
    //         const data = await res.json()
    //         console.log(data);
    //     } catch (error) {
    //         console.log("err", error);
    //     }            
    // })()
    console.warn("setting temp access")
    app.utils.setCookie("access_token", "random value")
    const btn = document.getElementById("home-view").querySelector("#logout")
    btn.addEventListener("click", ()=> {
        if (app.utils.getCookie("access_token"))
        {
            app.utils.removeCookie("access_token")
            console.warn("removed access token");
        }
    })
    // const css = [
    //     "/public/pages/Home/styles/style.css"
    // ]
	// try {
    //     css.forEach(async (href)=> {
    //         await LoadCss(href)
    //     })
    //     // other logic for event handling and prerendering content
        
    // } catch (error) {
    //     console.log("Error occured");
    //     console.log(error);
    //     app.router.navigate("/404")
    // }

}
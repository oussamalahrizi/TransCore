const express = require("express");
const path = require("path");
const app = express();
const port = 3000;


app.use("/public",express.static(path.join(__dirname, "public")));

// react router acts the same updating ui with 404 on client side while the req.status is still 200 OK
// I handled when requesting static file directly resuling in 404 status
//	but when switching tabs it will render 200 with 404 content
// this will do for now
app.get("*", (req, res) => {
	if (req.url.startsWith("/public") || req.url === "/404")
	{
		console.log("not found");
		res.status(404)
	}
	res.sendFile(path.join(__dirname, "/", "index.html"));
});

app.listen(port, () => {
	console.log(`Server running on port this ${port}`);
});

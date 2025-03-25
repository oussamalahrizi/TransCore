import RemoteView from "./remote/View.js";
import RemoteController from "./remote/Controller.js";
import LocalView from "./local/View.js";
import LocalController from "./local/Controller.js";

export default {
    remote: { View: RemoteView, Controller: RemoteController },
    local: { View: LocalView, Controller: LocalController },
};
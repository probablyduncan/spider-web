import { createSpiderSocket } from "shared";
import { getGuid } from "@/shared/session";
import { SERVER_HOST } from "@/config/serverUrl";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

const socket = createSpiderSocket({ host: SERVER_HOST, guid: getGuid() });

// TODO: gate connecting/sending/rendering on the worldwide/infestation/showMessages
// settings from @/shared/settings once the real spider/message features are built.
document.addEventListener("mousemove", (e) => socket.send("spider", { x: e.clientX, y: e.clientY }));

socket.listen("spider", (payload) => console.log("spider", payload));
socket.listen("message", (payload) => console.log("message", payload));

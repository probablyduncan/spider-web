// this is where I will put all of the code until I figure out how to split it up

import createWebSocket from "./webSocket";

// this should have the canvas stuff, the render loop, the message listeners?
// everything?
// just reproducing main.ts in shared I guess?

// or no, because sometimes we want a ws connection and sometimes we dont!
// so there are a few items here:
// web client - for talking to the server
// canvas and animation loop - pass in array of spider states, and it handles the dom/context stuff
// spider state management? should be in the server?

export default function setup({ ws_host, canvas }: {
    ws_host: string;
    canvas: HTMLCanvasElement;
}) {
    const context = canvas.getContext("2d");
    if (!context) return;

    const webClient = createWebSocket(ws_host);
    
    window.addEventListener("resize", () => scaleCanvasToWindow(canvas, context));
    scaleCanvasToWindow(canvas, context);

    // add 
    webClient.listen("init", (e) => {

    });

    // add new spider
    webClient.listen("join", (e) => {

    })









}

function scaleCanvasToWindow(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
}

function clearCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}
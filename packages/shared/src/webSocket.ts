import PartySocket from "partysocket";
import type {
    ClientToServer_SpiderMessageKeys,
    ClientToServer_SpiderMessages,
    ServerToClient_SpiderMessageKeys,
    ServerToClient_SpiderMessages,
} from "./types";

type Listener<K extends ServerToClient_SpiderMessageKeys> = (
    params: Omit<Extract<ServerToClient_SpiderMessages, { type: K }>, "type">,
) => void;

export default function createWebSocket(host: string) {

    const ws = new PartySocket({
        host: host,
        party: "spider",
        room: "global",
    });

    const listeners: {
        [K in ServerToClient_SpiderMessageKeys]?: Listener<K>[];
    } = {};

    function listen<K extends ServerToClient_SpiderMessageKeys>(type: K, listener: Listener<K>): () => void {
        const list = ((listeners[type] as Listener<K>[] | undefined) ??= []);
        list.push(listener);

        // return function which removes listener
        return () => {
            const index = list.indexOf(listener);
            if (index !== -1) list.splice(index, 1);
        };
    }

    function send<K extends ClientToServer_SpiderMessageKeys>(
        type: K,
        data: Omit<Extract<ClientToServer_SpiderMessages, { type: K }>, "type">,
    ) {
        ws.send(JSON.stringify({ type, ...data }));
    }

    ws.addEventListener("open", () => {
        send("init", {});
    });

    ws.addEventListener("message", (e) => {
        try {
            const message = JSON.parse(e.data);
            listeners[(message?.type ?? "") as ServerToClient_SpiderMessageKeys]?.forEach((listener) => listener(message));
        } catch (ex) {
            console.error("Invalid message!", ex);
        }
    });

    return {
        listen,
        send,
        close: () => ws.close()
    }
}
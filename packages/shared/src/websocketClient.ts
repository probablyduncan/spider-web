import PartySocket from "partysocket";
import type {
    ClientToServer_SpiderMessageKeys,
    ClientToServer_SpiderMessages,
    ServerToClient_SpiderMessageKeys,
    ServerToClient_SpiderMessages,
    SpiderGuid,
} from "./types";

export interface SpiderSocketOptions {
    /** host only, no protocol, e.g. "localhost:8787" or "server.<account>.workers.dev" */
    host: string;
    guid: SpiderGuid;
}

type Listener<K extends ServerToClient_SpiderMessageKeys> = (
    params: Omit<Extract<ServerToClient_SpiderMessages, { type: K }>, "type">,
) => void;

/**
 * Minimal typed websocket wrapper shared between the extension content script and the website.
 */
export function createSpiderSocket(options: SpiderSocketOptions) {
    const ws = new PartySocket({
        host: options.host,
        party: "spider",
        room: "global",
    });

    const listeners: {
        [K in ServerToClient_SpiderMessageKeys]?: Listener<K>[];
    } = {};

    ws.addEventListener("open", () => send("init", { guid: options.guid }));

    ws.addEventListener("message", (e) => {
        try {
            const message = JSON.parse(e.data);
            const listenersForType = listeners[(message?.type ?? "") as ServerToClient_SpiderMessageKeys];
            listenersForType?.forEach((listener) => listener(message));
        } catch (ex) {
            console.error("Invalid message!", ex);
        }
    });

    function send<K extends ClientToServer_SpiderMessageKeys>(
        type: K,
        data: Omit<Extract<ClientToServer_SpiderMessages, { type: K }>, "type">,
    ) {
        ws.send(JSON.stringify({ type, ...data }));
    }

    function listen<K extends ServerToClient_SpiderMessageKeys>(type: K, listener: Listener<K>): () => void {
        const list = ((listeners[type] as Listener<K>[] | undefined) ??= []);
        list.push(listener);
        return () => {
            const index = list.indexOf(listener);
            if (index !== -1) list.splice(index, 1);
        };
    }

    return {
        send,
        listen,
        close: () => ws.close(),
    };
}

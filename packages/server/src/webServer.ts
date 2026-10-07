import { ConnectionContext, Server, type Connection, type WSMessage } from "partyserver";
import type { ClientToServer_SpiderMessages, ConnectionId, ConnectionInfo, ServerToClient_SpiderMessageKeys, ServerToClient_SpiderMessages } from "shared/types";

export class Spiders extends Server<Env> {
    readonly options = { hibernate: true };

    _current_connections = new Map<ConnectionId, ConnectionInfo>();

    private _buildMessageString<K extends ServerToClient_SpiderMessageKeys>(
        type: K,
        data: Omit<Extract<ServerToClient_SpiderMessages, { type: K }>, "type">,
    ) {
        return JSON.stringify({
            type,
            ...data
        } as Extract<ServerToClient_SpiderMessages, { type: K }>);
    }

    onMessage(connection: Connection, message: WSMessage): void | Promise<void> {
        if (typeof message !== "string") return;

        const data = JSON.parse(message) as ClientToServer_SpiderMessages;

        switch (data.type) {
            case "init": {

                this.broadcast(this._buildMessageString("join", {
                    id: connection.id,
                }), [connection.id]);

                connection.send(this._buildMessageString("init", {
                    connections: [...this._current_connections.values()],
                }));

                this._current_connections.set(connection.id, {
                    id: connection.id,
                    points: [],
                });

                break;
            }
            case "move": {

                // set points cache and broadcast new points to other connections
                if (this._current_connections.has(connection.id)) {
                    this._current_connections.get(connection.id)!.points = data.points;
                }
                // else {
                //     this.broadcast(this._buildMessageString("join", {
                //         id: connection.id,
                //     }), [connection.id]);
                //     this._current_connections.set(connection.id, {
                //         id: connection.id, points: data.points
                //     });
                // }

                this.broadcast(this._buildMessageString("move", {
                    id: connection.id,
                    points: data.points,
                }), [connection.id]);

                break;
            }

            case "message": {

                // broadcast message to other clients
                this.broadcast(this._buildMessageString("message", {
                    id: connection.id,
                    message: data.message,
                }), [connection.id]);

                break;
            }
        }
    }

    onClose(connection: Connection): void | Promise<void> {
        // remove from cache and broadcast leave
        this._current_connections.delete(connection.id);
        this.broadcast(this._buildMessageString("leave", { id: connection.id }));
    }

    // onError(connection: Connection, error: unknown): void | Promise<void> {
    //     // remove from cache?
    //     this._current_connections.delete(connection.id);
    //     this.broadcast(this._buildMessageString("leave", { id: connection.id }));
    // }
}

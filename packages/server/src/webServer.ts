import { Server, type Connection, type WSMessage } from "partyserver";
import type { ClientToServer_SpiderMessages, SpiderGuid } from "shared";

type SpiderConnectionState = {
    guid: SpiderGuid;
};

export class Spiders extends Server<Env> {
    readonly options = { hibernate: true };

    _spider_cache = new Map<SpiderGuid, { x: number; y: number }>();

    onMessage(connection: Connection<SpiderConnectionState>, message: WSMessage): void | Promise<void> {
        if (typeof message !== "string") return;

        const data = JSON.parse(message) as ClientToServer_SpiderMessages;

        switch (data.type) {
            case "init":
                connection.setState({ guid: data.guid });

                connection.send(
                    JSON.stringify({
                        type: "init",
                        spiders: [...this._spider_cache.keys()],
                    }),
                );

                this.broadcast(
                    JSON.stringify({
                        type: "join",
                        guid: data.guid,
                    }),
                    [connection.id],
                );

                break;

            case "spider": {
                const guid = connection.state?.guid;
                if (!guid) break;

                this._spider_cache.set(guid, { x: data.x, y: data.y });

                this.broadcast(
                    JSON.stringify({
                        type: "spider",
                        guid,
                        x: data.x,
                        y: data.y,
                    }),
                    [connection.id],
                );

                break;
            }

            case "message": {
                const guid = connection.state?.guid;
                if (!guid) break;

                this.broadcast(
                    JSON.stringify({
                        type: "message",
                        guid,
                        text: data.text,
                    }),
                    [connection.id],
                );

                break;
            }
        }
    }

    onClose(connection: Connection<SpiderConnectionState>): void | Promise<void> {
        const guid = connection.state?.guid;
        if (!guid) return;

        this._spider_cache.delete(guid);
        this.broadcast(
            JSON.stringify({
                type: "leave",
                guid,
            }),
        );
    }
}

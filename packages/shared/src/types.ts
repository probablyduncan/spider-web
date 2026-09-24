export type SpiderGuid = string;

export type ClientToServer_SpiderMessages =
    | {
        /** sent once, right after the socket opens */
        type: "init";
        guid: SpiderGuid;
    }
    | {
        /** sent on mousemove */
        type: "spider";
        x: number;
        y: number;
    }
    | {
        type: "message";
        text: string;
    };

export type ClientToServer_SpiderMessageKeys = ClientToServer_SpiderMessages["type"];

export type ServerToClient_SpiderMessages =
    | {
        /** send all current spiders to a newly identified connection */
        type: "init";
        spiders: SpiderGuid[];
    }
    | {
        /** broadcast pos to other connections */
        type: "spider";
        guid: SpiderGuid;
        x: number;
        y: number;
    }
    | {
        /** broadcast message to other connections */
        type: "message";
        guid: SpiderGuid;
        text: string;
    }
    | {
        /** broadcast new connection to other connections */
        type: "join";
        guid: SpiderGuid;
    }
    | {
        /** broadcast disconnect to other connections */
        type: "leave";
        guid: SpiderGuid;
    };

export type ServerToClient_SpiderMessageKeys = ServerToClient_SpiderMessages["type"];

export type Point = {
    x: number,
    y: number
};

type Readonly<T> =
    T extends Function ? T :
    T extends object ? { readonly [K in keyof T]: Readonly<T[K]> } :
    T;


/**
 * this is persisted across frames
 * all points should be sized to the canvas
 */
export type SpiderState = {
    /** connection id or "me" or whatever */
    id: string;
    targets: Point[];
    /** if undefined, spider will render on target */
    current: Point;
    /** the number of pixels to keep the spider away from the target */
    targetPadding?: number;
    feet: Point[];
    interpolation: {
        /** approach the target faster when further away */
        type: "ease";
        /** milliseconds to get halfway to the target */
        halfLife: number;
    } | {
        /** move at a constant speed towards the target */
        type: "linear";
        /** in pixels per millisecond */
        speed: number;
    };

    // this stuff is used outside of rendering but doesn't need to be set,
    // will be overwritten every frame
    angle: number;
    headPosition: Point;

    /** 1 is standard */
    scale: number;

    kissing: boolean;
}

export type HeartState = {
    key: `${string}+${string}=4ever`;
    char: string;
    size: number;
    center: Point;
    angle: number;
    duration: number;
    delay: number;
    progress: number;
}

/**
 * this is created each frame
 * and passed into the renderer
 * all points should be sized to the canvas
 * */
// export type RenderableSpider = Readonly<{
//     center: Point;
//     angle: number;
//     legs: {
//         foot: Point;
//         knee: Point;
//         hip: Point;
//     }[];
// }>;

export type ConnectionId = string;
export type ConnectionInfo = {
    id: ConnectionId,
    points: Point[],
    // etc
};

export type ClientToServer_SpiderMessages =
    | {
        /** sent once, right after the socket opens */
        type: "init";
    }
    | {
        /** sent debounced on mousemove */
        type: "move";
        points: Point[];
    }
    | {
        type: "message";
        message: string;
    };

export type ClientToServer_SpiderMessageKeys = ClientToServer_SpiderMessages["type"];

export type ServerToClient_SpiderMessages =
    | {
        /** send all current spiders to a newly identified connection */
        type: "init";
        connections: ConnectionInfo[];
    }
    | {
        /** broadcast pos to other connections */
        type: "move";
        id: ConnectionId;
        points: Point[];
    }
    | {
        /** broadcast message to other connections */
        type: "message";
        id: ConnectionId;
        message: string;
    }
    | {
        /** broadcast new connection to other connections */
        type: "join";
        id: ConnectionId;
    }
    | {
        /** broadcast disconnect to other connections */
        type: "leave";
        id: ConnectionId;
    };

export type ServerToClient_SpiderMessageKeys = ServerToClient_SpiderMessages["type"];

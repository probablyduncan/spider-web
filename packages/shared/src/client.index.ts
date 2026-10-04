// Browser-only canvas/animation-frame helpers. Kept out of the main "shared"
// barrel so the server (no DOM lib) never has to type-check them; only the
// extension and website (both have "DOM" in their tsconfig lib) import this.
export * from "./webStepper";
export * from "./webCanvas";
export * from "./webSocket";
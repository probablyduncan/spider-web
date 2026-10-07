import { defineManifest } from "@crxjs/vite-plugin"
import pkg from "./package.json" with { type: "json" }

export default defineManifest({
    manifest_version: 3,
    name: "A Spider on the Web",
    description: "There are a whole lot of spiders on the world wide web. Why don't you bring one along for the ride?",
    version: pkg.version,
    icons: {
        128: "public/icon128.png",
        48: "public/icon48.png",
        32: "public/icon32.png",
        16: "public/icon16.png",
    },
    action: {
        default_icon: {
            128: "public/icon128.png",
            48: "public/icon48.png",
            32: "public/icon32.png",
            16: "public/icon16.png",
        },
        default_popup: "src/config/config.html",
    },
    content_scripts: [{
        js: ["src/content/main"],
        matches: ["https://*/*"],
    }],
    permissions: [
        "storage",
        "activeTab",
    ],
})

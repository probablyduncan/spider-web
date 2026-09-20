import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: "json" }

export default defineManifest({
    manifest_version: 3,
    name: "spider-web",
    description: "there are a whole lot of spiders on the world wide web",
    version: pkg.version,
    icons: {
        48: 'public/logo.png',
    },
    action: {
        default_icon: {
            48: 'public/logo.png',
        },
        default_popup: 'src/config/config.html',
    },
    content_scripts: [{
        js: ['src/content/main'],
        matches: ['https://*/*'],
    }],
    permissions: [
        'storage',
    ],
})

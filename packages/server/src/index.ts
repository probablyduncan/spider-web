import { routePartykitRequest } from "partyserver";

// Browsers always send an Origin header on a WebSocket handshake, so this stops *other websites*
// from opening sockets to this server. It is not authentication: a non-browser client can send
// any Origin it likes.
const ALLOWED_ORIGINS = new Set([
	"https://web.duncanpetrie.com",
	// Add the extension once it connects, e.g. "chrome-extension://<extension id>".
	// Note the Origin is the *page's* when the socket is opened from a content script, so the
	// extension's socket needs to live in its background service worker for this to match.
]);

export default {
	async fetch(request, env) {
		const partykitResponse = await routePartykitRequest(request, { ...env }, {
			onBeforeConnect(req) {
				// Only enforce on the deployed host, so `wrangler dev` and tunnels keep working.
				if (!new URL(req.url).hostname.endsWith(".workers.dev")) return;

				const origin = req.headers.get("Origin");
				if (!origin || !ALLOWED_ORIGINS.has(origin)) {
					return new Response("Forbidden", { status: 403 });
				}
			},
		});
		if (partykitResponse !== null) {
			return partykitResponse;
		}

		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;

export { Spiders } from "./webServer";

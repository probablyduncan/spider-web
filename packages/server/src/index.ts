import { routePartykitRequest } from "partyserver";

// Browsers always send an Origin header on a WebSocket handshake, so this stops *other websites*
// from opening sockets to this server. It is not authentication: a non-browser client can send
// any Origin it likes.

// SITE_HOST (e.g. "spiders.duncanpetrie.com") is injected at deploy time by
// .github/workflows/deploy.yml via `wrangler deploy --var`, from packages/website/public/CNAME.
// It isn't in wrangler.jsonc, so it isn't in the generated Env type.
type DeployedEnv = Env & { SITE_HOST?: string };

export default {
	async fetch(request, env) {
		const siteHost = (env as DeployedEnv).SITE_HOST;

		const allowedOrigins = new Set<string>();
		if (siteHost) allowedOrigins.add(`https://${siteHost}`);
		// Add the extension once it connects, e.g. "chrome-extension://<extension id>".
		// Note the Origin is the *page's* when the socket is opened from a content script, so the
		// extension's socket needs to live in its background service worker for this to match.

		const partykitResponse = await routePartykitRequest(request, { ...env }, {
			onBeforeConnect(req) {
				// Only enforce on the deployed host, so `wrangler dev` and tunnels keep working.
				if (!new URL(req.url).hostname.endsWith(".workers.dev")) return;

				// Fail closed. SITE_HOST is dropped by any deploy that doesn't pass --var.
				if (!siteHost) console.error("SITE_HOST is not set; rejecting all connections. Redeploy via CI.");

				const origin = req.headers.get("Origin");
				if (!origin || !allowedOrigins.has(origin)) {
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

import { routePartykitRequest } from "partyserver";

export default {
	async fetch(request, env) {
		const partykitResponse = await routePartykitRequest(request, { ...env });
		if (partykitResponse !== null) {
			return partykitResponse;
		}

		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;

export { Spiders } from "./webServer";

import { type Context, type Handler } from "hono";
import { type AuthConfig, Auth } from "@auth/core"
import type { Session } from "@auth/core/types";

export type {
	Account,
	DefaultSession,
	Profile,
	Session,
	User,
	AuthConfig,
} from "@auth/core/types"

export function HonoAuth(authConfig: AuthConfig) {
	const requestHandler: Handler = async (c) => {
		const response = await Auth(c.req.raw, authConfig) as Response;

		response.headers?.forEach((value, key) => {
			if (value) {
				c.header(key, value, {
					append: true,
				});
			}
		});

		c.status(response.status);

		const contentType = response.headers.get("Content-Type") || "";

		switch (contentType) {
			case "application/json":
				return c.json(await response.json());
			case "text/html":
				return c.html(await response.text());
			case "text/plain":
				return c.text(await response.text());
			default:
				return c.text(await response.text());
		}
	}
	return requestHandler;
}

export type GetSessionResult = Promise<Session | null>

export async function getSession(
	context: Context,
	authConfig: Omit<AuthConfig, "raw">
): GetSessionResult {
	authConfig.secret ??= process.env.AUTH_SECRET
	authConfig.trustHost ??= true

	const request = context.req.raw;
	const url = new URL("/api/auth/session", request.url)

	const response = await Auth(
		new Request(url, { headers: request.headers }),
		authConfig
	)

	const { status = 200 } = response

	const data = await response.json();

	if (!data || !Object.keys(data).length) return null
	if (status === 200) return data;
	throw new Error(data.message)
}

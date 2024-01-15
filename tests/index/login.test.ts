import { Hono } from "hono"
import { AuthConfig, HonoAuth, getSession } from "../../src/index.js"
import CredentialsProvider from "@auth/core/providers/credentials"

export const authConfig: AuthConfig = {
	secret: "secret",
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: {
					label: "Username",
					type: "text",
					placeholder: "jsmith",
				},
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials, req) {
				const name = (credentials.username as string) || "John Smith"
				const user = {
					id: "1",
					name,
					email: name.replace(" ", "") + "@example.com",
				}

				return user
			},
		}),
	],
	trustHost: true,
}

const extractCookieValue = (cookieHeader: string | string[], name: string) => {
	const cookieStringFull = Array.isArray(cookieHeader)
		? cookieHeader.find((header) => header.includes(name))
		: cookieHeader
	return name + cookieStringFull?.split(name)[1].split(";")[0]
}

describe("Integration test with login and getSession", () => {
	let app: Hono;

	beforeEach(() => {
		app = new Hono()
	})

	it("Should return the session with username after logging in", async () => {
		let expectations = () => { }

		app.all("/api/auth/*", HonoAuth(authConfig))

		app.post("/test", async (c) => {
			const session = await getSession(c, authConfig)

			expectations = async () => {
				expect(session?.user?.name).toEqual("johnsmith")
			}

			return c.text("OK")
		})

		// Get signin page
		const response = await app.request("/api/auth/signin", {
			headers: {
				"X-Test-Header": "foo",
				Accept: "application/json",
			}
		});

		// Parse cookies for csrf token and callback url
		const csrfTokenCookie = extractCookieValue(
			response.headers.getSetCookie(),
			"authjs.csrf-token"
		)
		const callbackCookie = extractCookieValue(
			response.headers.getSetCookie(),
			"authjs.callback-url"
		)
		const csrfTokenValue = csrfTokenCookie.split("%")[0].split("=")[1]

		const responseCredentials = await app.request("/api/auth/callback/credentials", {
			method: "POST",
			headers: {
				"X-Test-Header": "foo",
				Accept: "application/json",
				Cookie: `${csrfTokenCookie}; ${callbackCookie}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				csrfToken: csrfTokenValue,
				username: "johnsmith",
				password: "ABC123",
			})
		});

		// Parse cookie for session token
		const sessionTokenCookie = extractCookieValue(
			responseCredentials.headers.getSetCookie(),
			"authjs.session-token"
		)

		await app.request("/test", {
			method: "POST",
			headers: {
				"X-Test-Header": "foo",
				Accept: "application/json",
				Cookie: `${csrfTokenCookie}; ${callbackCookie}; ${sessionTokenCookie}`,
			}
		});

		await expectations()
	})
})
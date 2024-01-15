import { jest } from "@jest/globals"
import { Hono } from "hono"

const sessionJson = {
	user: {
		name: "John Doe",
		email: "test@example.com",
		image: "",
		id: "1234",
	},
	expires: "",
}

jest.unstable_mockModule("@auth/core", () => ({
	Auth: jest.fn(() => {
		return new Response(JSON.stringify(sessionJson), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		})
	}),
}))

// dynamic import to avoid loading Auth before hoisting
const { getSession } = await import("../../src/index.js")

describe("getSession", () => {
	let app: Hono

	beforeEach(() => {
		app = new Hono()
	})

	it("Should return the mocked session from the Auth response", async () => {
		let expectations: Function = () => { }

		app.post("/", async (c) => {
			const session = await getSession(c, {
				providers: [],
				secret: "secret",
			})

			expectations = async () => {
				expect(session).toEqual(sessionJson)
			}

			return c.text("OK")
		})

		await app.request("/", {
			headers: {
				"X-Test-Header": "foo",
				Accept: "application/json",
			},
		})

		await expectations()
	})
})

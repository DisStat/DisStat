function getUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
		const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8)
		return v.toString(16)
	})
}

export const route = {
	method: 'GET',
	url: '/api/key',
	schema: {
		header: {
			type: 'object',
			properties: {
				Authorization: { type: 'string' }
			}
		},
        response: {
			401: {
				type: 'object',
				properties: {
					message: { type: 'string', default: 'You need to be logged in!' }
				}
			},
            200: {
				type: 'object',
				properties: {
					key: { type: 'string' }
				}
            }
        }
	},
	handler: (request, reply) => {
		if (!request.get("Authorization")) return reply.status(401).send({message: "You need to be logged in!"})
		if (!tokens.has(request.get("Authorization"))) return reply.status(401).send({message: "Your token is invalid!"})

		const newkey = "DS-" + getUUID().replace(/-/gi, "").slice(10)
		disstatUser.set(tokens.get(request.get("Authorization")).id, newkey, "apikey")
		reply.send({key: newkey})
	}
}

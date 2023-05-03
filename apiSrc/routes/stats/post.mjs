import db from "../../utils/postgres.mjs"
import influx from '../../utils/influxdb.mjs'
import postedStats from "../../structures/postedStats.mjs"

export const route = {
	method: 'POST',
	url: '/api/stats/post',
	schema: {
        body: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				guildCount: { type: 'number', default: 0 },
				shardCount: { type: 'number', default: 0 },
				userCount: { type: 'number', default: 0 },
				commandsRun: { type: 'number', default: 0 },
				ramUsage: { type: 'number', default: 0.0 },
				totalRam: { type: 'number', default: 0.0 },
				cpuUsage: { type: 'number', default: 0.0 },
				members: { type: 'number', default: 0 },
				topCommands: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							count: { type: 'number' }
						}
					}
				},
				// customCharts: {
				// 	type: 'array',
				// 	items: {
				// 		type: 'object',
				// 		properties: {
				// 			count: { type: 'number' }
				// 		}
				// 	}
				// }
			}
        },
		response: {
            401: {
                type: 'object',
                properties: {
                    message: { type: 'string', default: 'Incorrect token' }
                }
            },
            409: {
                type: 'object',
                properties: {
                    message: { type: 'string', default: 'The bot with the specified ID does not exist' }
                }
            },
			201: {
				type: 'object',
				properties: {
					success: { type: 'boolean', default: true },
					message: { type: 'string', default: 'The bot has been added to the database!' }
				}
			}
		}
	},
	handler: async (request, reply) => {
		if (!request.body.id) return reply.status(400).send({message: "Please specify the bot ID as a parameter!"})
		const botExisits = await db`SELECT token from bots WHERE botid = ${request.body.id}`.catch(err=>{})
		if (!botExisits[0]) return reply.status(409).send({message: "The bot with the specified ID does not exist!"})
		if (request.headers.authorization !== botExisits[0].token) return reply.status(401).send({message: "Incorrect token"})
		if (request.body.customCharts?.length > 2) return reply.status(409).send({message: "The bot with the specified ID already exists!"})

		const formattedBody = new postedStats(request.body)
		// console.log(formattedBody.getTopCommands())		

		influx.writePoints([
		    {
		        measurement: 'botStats',
		        tags: { botid: request.body.id },
		        fields: formattedBody.getMainStats(),
		    },
			{
		        measurement: 'topCommands',
		        tags: { botid: request.body.id},
		        fields: formattedBody.getTopCommands(),
		    }
		])
	}
}

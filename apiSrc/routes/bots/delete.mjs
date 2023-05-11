import db from "../../utils/postgres.mjs"
import influx from '../../utils/influxdb.mjs'

export const route = {
	method: 'DELETE',
	url: '/api/bots/delete',
	schema: {
        body: {
			type: 'object',
			properties: {
				id: { type: 'string' }
			}
        },
		response: {
            401: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            },
            404: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            },
			201: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string'}
				}
			}
		}
	},
	handler: async (request, reply) => {
		if (!request.session.discordAccessToken) return reply.code(401).send({error: true, message: "You need to be logged in to add a bot!"});

		if (!request.body.id) return reply.status(400).send({message: "Please specify the bot ID as a parameter!"})
		const botExisits = await db`SELECT ownerid from bots WHERE botid = ${request.body.id}`.catch(err=>{})
		if (!botExisits[0]) return reply.status(409).send({message: "The bot with the specified ID does not exist!"})
		if (botExisits[0].ownerid !== request.session.discordUserInfo.id)return reply.status(401).send({message: "You do not have permission to delete this bot"})
		
		db`DELETE FROM chartsettings WHERE botid = ${request.body.id}`.catch(err=>{})
		db`DELETE FROM bots WHERE botid = ${request.body.id}`.catch(err=>{})
		influx.query(`DELETE FROM botStats WHERE botid = $botid`, {
			placeholders: {
				botid: request.body.id
			}
		})

		reply.status(201).send({success: true, message: "The bot has been deleted"})
	}
}

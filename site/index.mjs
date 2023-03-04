
import fastify from 'fastify'
import routes from './API/routes/apiRoutes.mjs'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyStatic from '@fastify/static'
import path from 'path'

import redis from './utils/redis.mjs';
import redisStore from './utils/redisSession.mjs';

const { cookieSecret } = await import(process.env.NODE_ENV === "production" ? '/config/config.mjs' : './config/config.mjs');

const API = fastify();
API.register(fastifyCookie);
API.register(fastifySession, {
    secret: cookieSecret,
    store: new redisStore(redis),
    cookie: {
        path: "/",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    },
});

API.register(fastifyStatic, {
    root: path.join(path.resolve('../'), 'siteSrc'),
})

await Promise.all(
    routes.map(async endpoint => {
        API.route(endpoint)
    })
)

API.listen({ port: 8090, host: "0.0.0.0" }, (err, address) => {
    console.log(`API live on http://0.0.0.0:8090`)
    if (err) throw err
});
import fastify from 'fastify'
import routes from './routes/apiRoutes.mjs'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifySwagger from '@fastify/swagger'

import redis from './utils/redis.mjs';
import RedisStore from './utils/redisSession.mjs';

const { cookieSecret } = await import(process.env.NODE_ENV === "production" ? '/config/config.mjs' : './config/config.mjs');

const API = fastify();
API.register(fastifySwagger, {

}).after(a=>{
    routes.map(async endpoint => {
        API.route(endpoint)
    })    
})
API.register(fastifyCookie);
API.register(fastifySession, {
    secret: cookieSecret,
    store: new RedisStore(redis),
    cookie: {
        path: "/",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
});



API.listen({ port: 8090, host: "0.0.0.0" }, err => {
    if (err) throw err
    console.log(`API live on http://0.0.0.0:8090`)
});

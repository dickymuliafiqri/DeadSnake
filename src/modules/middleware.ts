/**
 * by dickymuliafiqri
 *
 * Middlewares, handle incoming events
 */

import {bot} from "../index";

bot.snake.on("message", async (ctx) => {
    // @ts-ignore
    ctx.recTime = Date.now();
})
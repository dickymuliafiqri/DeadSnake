/**
 * by dickymuliafiqri
 */

import { bot } from "..";
import si from "systeminformation";

// RegExp
const aliveRegExp: RegExp = /^\.alive$/;

bot.snake.hears(aliveRegExp, async (ctx) => {
  bot.wrapper(async () => {
    let uptime: number = Number(si.time().uptime);
    let days: number = 0;
    let hours: number = 0;
    let minutes: number = 0;
    let seconds: number = 0;

    while (uptime > 0) {
      if (uptime >= 86400) {
        ++days;
        uptime -= 86400;
      } else if (uptime >= 3600) {
        ++hours;
        uptime -= 3600;
      } else if (uptime >= 60) {
        ++minutes;
        uptime -= 60;
      } else {
        seconds = uptime;
        uptime -= uptime;
      }
    }

    bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: "<i>Getting bot/server information...</i>",
        parseMode: "html"
    })

    await bot.snake.client.editMessage(ctx.chat.id, {
      message: ctx.id,
      text: await bot
        .buildBotInfo()
        .then(
          (res) =>
            `${res}\n\n💡 Uptime ${days ? days + " days " : ""}${
              hours ? hours + " hours " : ""
            }${minutes ? minutes + " minutes " : ""} ${
              seconds.toFixed() + " seconds"
            }`
        ),
      parseMode: "html",
    });
  });
});

let desc: string = "Check server/bot status\n";
desc += "\n<code>.alive</code> -> Get bot information";

bot.addHelp("bot", desc);

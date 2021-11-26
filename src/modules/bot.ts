/**
 * by dickymuliafiqri
 */

import { bot } from "..";
import si from "systeminformation";
import { exec, spawn } from "child_process";
import { writeFile } from "fs/promises";

// RegExp
const aliveRegExp: RegExp = /^\.alive$/;
const restartRegExp: RegExp = /^\.restart$/;

bot.snake.hears(aliveRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
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
        parseMode: "html",
      });

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
    },
    {
      context: ctx
    }
  );
});

bot.snake.hears(restartRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      // Write temp.env
      await writeFile(
        `${bot.projectDir}/temp.env`,
        `RESTART_ID=${ctx.chat.id}::${ctx.id}`,
        {
          flag: "w+",
        }
      );

      // Edit message and delete modules
      await bot.snake.client
        .editMessage(ctx.chat.id, {
          message: ctx.id,
          text: "Cleaning modules...",
        })
        .then(() => {
          exec("rm -rf app/src/modules");
        });

      // Recompile code
      await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: "Compiling code...",
      });
      const compile = spawn("npx", ["tsc"]);

      // Restart the bot
      compile.on("close", async () => {
        await bot.snake.client
          .editMessage(ctx.chat.id, {
            message: ctx.id,
            text: "Restarting bot...",
          })
          .finally(() => {
            exec("pm2 restart DeadSnakeBot");
          });
      });
    },
    {
      context: ctx
    }
  );
});

let desc: string = "Check server/bot status\n";
desc += "\n<code>.alive</code> -> Get bot information";
desc += "\n<code>.restart</code> -> Restart bot";

bot.addHelp("bot", desc);

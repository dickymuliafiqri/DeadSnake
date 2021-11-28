/**
 * by dickymuliafiqri
 */

import { bot } from "..";
import si from "systeminformation";
import { default as axios } from "axios";
import { exec } from "child_process";
import { writeFile } from "fs/promises";

// RegExp
const aliveRegExp: RegExp = /^\.alive$/;
const restartRegExp: RegExp = /^\.restart$/;
const shutdownRegExp: RegExp = /^\.shutdown$/;

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

      await bot.snake.client
        .sendMessage(ctx.chat.id, {
          file: bot.botImg,
          message: await bot
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
        })
        .finally(async () => {
          await bot.snake.client.deleteMessages(ctx.chat.id, [ctx.id], {
            revoke: true,
          });
        });
    },
    {
      context: ctx,
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
      const compile = exec("npx tsc");

      // Restart the bot
      compile.on("close", async () => {
        await bot.snake.client
          .editMessage(ctx.chat.id, {
            message: ctx.id,
            text: "Restarting bot...",
          })
          .then(async () => {
            if (bot.isHeroku) {
              await axios.delete(
                `https://api.heroku.com/apps/${bot.herokuAppName}/dynos/worker`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${bot.herokuApiKey}`,
                    Accept: "application/vnd.heroku+json; version=3",
                  },
                }
              );
            } else {
              exec("npx forever restart app/src/index.js");
            }
          });
      });
    },
    {
      context: ctx,
    }
  );
});

bot.snake.hears(shutdownRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      await bot.snake.client
        .editMessage(ctx.chat.id, {
          message: ctx.id,
          text: "Good bye!",
        })
        .then(async () => {
          if (bot.isHeroku) {
            await axios.post(
              `https://api.heroku.com/apps/${bot.herokuAppName}/dynos/worker/actions/stop`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${bot.herokuApiKey}`,
                  Accept: "application/vnd.heroku+json; version=3",
                },
              }
            );
          } else {
            exec("npx forever stop app/src/index.js");
          }
        });
    },
    {
      context: ctx,
    }
  );
});

let desc: string = "Check server/bot status\n";
desc += "\n<code>.alive</code> -> Get bot information";
desc += "\n<code>.restart</code> -> Restart";
desc += "\n<code>.shutdown</code> -> Shutdown";

bot.addHelp("bot", desc);

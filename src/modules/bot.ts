/**
 * by dickymuliafiqri
 */

import { bot } from "..";
import si from "systeminformation";
import { execSync } from "child_process";
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
      // Make sure we're working on right dir
      process.chdir(bot.projectDir);

      // Write temp.env
      await writeFile(
        `${bot.projectDir}/temp.env`,
        `RESTART_ID=${ctx.chat.id}::${ctx.id}`,
        {
          flag: "w+",
        }
      );

      // Edit message and delete modules
      await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: "Cleaning modules...",
      });
      execSync("rm -rf app/src/modules");

      // Install dependencies
      await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: "Installing dependencies...",
      });
      execSync("npm install");

      // Recompile code
      await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: "Compiling code...",
      });
      execSync("npx tsc");

      // Restart the bot
      await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: "Restarting bot...",
      });

      process.exit();
    },
    {
      context: ctx,
    }
  );
});

bot.snake.hears(shutdownRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: "Good bye!",
      });
      execSync("npx forever stopall");
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

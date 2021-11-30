/**
 * by dickymuliafiqri
 *
 * Used to communicate with server console
 */

import { bot } from "..";
import { exec, spawn } from "child_process";
import { statSync } from "fs";

const fastFolderSizeSync = require("fast-folder-size/sync");

// RegExp
const lsRegExp = /^\.ls\s?(.+)?/;
const execRegExp = /^\.exec (.+)/;

bot.snake.hears(lsRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      const match: any = ctx.text?.match(lsRegExp);
      const chkDir: string = match[1] ? match[1] : bot.projectDir;
      let finalText: string = `\n<code>${chkDir}</code>`;

      const ls: Array<string> | any = await new Promise((resolve, reject) => {
        exec(`ls "${chkDir}"`, (err, stdout, stderr) => {
          if (err) reject(err);
          if (stderr) reject(stderr);

          resolve(stdout.split("\n"));
        });
      }).catch((err) => {
        if (err.message.match("No such file or directory")) {
          finalText += `\n\t└<i>${err.message}</i>`;
        } else {
          throw err;
        }
      });

      if (ls)
        for (const path of ls) {
          if (!path) continue;
          const stat = statSync(
            String(match[1]).match(/^\.?\/?/) || !match[1]
              ? `${match[1] || chkDir}/${path}`
              : path
          );

          try {
            if (stat.isDirectory()) {
              finalText += `\n\t└📁 <code>${path}</code>`;
              finalText += `\n\t  └Size: ~<i>${(fastFolderSizeSync(path) / 1000).toFixed(2)} KB</i>`;
            } else {
              finalText += `\n\t└📎 <code>${path}</code>`;
              finalText += `\n\t  └Size: ~<i>${(stat.size / 1000).toFixed(2)} KB</i>`;
            }
            finalText += `\n\t  └Created at: <i>${new Date(stat.birthtimeMs).toLocaleString()}</i>`;
          } catch (err: any) {
            finalText += `\n\t└⚠️ <i>${err.message}</i>`;
          }
        }

      if (finalText.length > 4090) finalText = finalText.substring(0, 4090) + "..."

        await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: finalText,
        parseMode: "html",
        linkPreview: false,
      });
    },
    {
      context: ctx,
    }
  );
});

bot.snake.hears(execRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      const match: any = ctx.text?.match(execRegExp);
      const cmd: Array<string> = match[1].split(" ");

        /**
         * TODO
         *
         * - Use exec instead of spawn
         */
      const term = spawn(cmd.shift() as string, [...cmd]);

      term.stdout.on("data", async (data) => {
        await bot.snake.client.sendMessage(ctx.chat.id, {
          message: String(data),
          replyTo: ctx.id,
          linkPreview: false,
        });
      });

      term.stderr.on("data", async (data) => {
        await bot.snake.client.sendMessage(ctx.chat.id, {
          message: String(data),
          replyTo: ctx.id,
          linkPreview: false,
        });
      });

      term.on("error", async (data) => {
        await bot.snake.client.sendMessage(ctx.chat.id, {
          message: String(data),
          replyTo: ctx.id,
          linkPreview: false,
        });
      });

      term.on("close", async (code) => {
        await bot.snake.client.sendMessage(ctx.chat.id, {
          message: `Child process exited with code ${code}`,
          replyTo: ctx.id,
          linkPreview: false,
        });
      });
    },
    {
      context: ctx,
    }
  );
});

let desc: string = "Communicate with console\n";
desc += "\n<code>.ls [DIR]</code> -> Get list of items inside dir";
desc += "\n<code>.exec CMD</code> -> Execute command on console";

bot.addHelp("cmd", desc);

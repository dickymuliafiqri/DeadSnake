/**
 * by dickymuliafiqri
 *
 * Used to communicate with server console
 */

import { bot } from "..";
import { exec, spawn } from "child_process";
import { lstatSync } from "fs";

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
        ls.forEach((path: string) => {
          if (!path) return;
          try {
            if (
              lstatSync(
                String(match[1]).match(/^\.?\/?/) || !match[1]
                  ? `${match[1] || chkDir}/${path}`
                  : path
              ).isDirectory()
            ) {
              finalText += `\n\t└📁 <code>${path}</code>`;
            } else {
              finalText += `\n\t└📎 <code>${path}</code>`;
            }
          } catch (err: any) {
            finalText += `\n\t└⚠️ <i>${err.message}</i>`;
          }
        });

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

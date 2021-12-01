/**
 * by dickymuliafiqri
 *
 * Download and upload file
 */

import { bot } from "../index";

// RegExp
const dlRegExp: RegExp = /^\.dl (.+)/;

const Downloader = require("nodejs-file-downloader");

// https://stackoverflow.com/a/68394450
function bytesForHuman(bytes: number) {
  let units = ["B", "KB", "MB", "GB", "TB", "PB"];

  let i = 0;

  for (i; bytes > 1024; i++) {
    bytes /= 1024;
  }

  return bytes.toFixed(1) + " " + units[i];
}

function progressText(
  percentage: number | string,
  fileSize: number,
  remaining: number,
  startTime: number
): string {
  let bar: string = "";
  for (let i = 0; i < 10; i++) {
    const progress: number = Number((Number(percentage) / 10).toFixed());
    if (i < progress) {
      bar += "-";
    } else if (i === progress) {
      bar += progress % 2 ? "c" : "C";
    } else {
      bar += i % 2 ? " " : "•";
    }
  }

  let text: string = `Progress: [${
    percentage >= 100 ? "<b>FINISH</b>" : bar
  }] ${percentage}%`;

  text += `\n\t└Size: ~${bytesForHuman(fileSize)}`;
  text += `\n\t  └Downloaded: ${bytesForHuman(fileSize - remaining)}`;
  text += `\n\t└Time collapsed: ${Date.now() - startTime} ms`;

  return text;
}

bot.snake.hears(dlRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      const startTime: number = Date.now();
      const match: any = ctx.text?.match(dlRegExp);
      const url: string = match[1];

      let finalText = "Prepare to Download File...";
      let fileName: string = "";
      let fileSize: number = 0;

      const downloader = new Downloader({
        url,
        directory: "downloads",
        maxAttempts: 3,
        onProgress: async (
          percentage: string,
          chunk: object,
          remainingSize: number
        ) => {
          // Calculate file size
          if (!fileSize) fileSize = remainingSize;

          finalText = `<b>${parseInt(percentage) < 100 ? "Downloading File..." : "File Downloaded"}</b>\n`;
          finalText += `\nName: ${fileName}`;
          finalText += `\nURL: <a href="${url}">Link</a>`;
          finalText += `\n${progressText(
            percentage,
            fileSize,
            remainingSize,
            startTime
          )}`;
        },
        onBeforeSave: (finalName: string): string | void => {
          fileName = finalName;
        },
      });

      const updateProgress = setInterval(() => {
        bot.snake.client
          .editMessage(ctx.chat.id, {
            message: ctx.id,
            text: finalText,
            parseMode: "html",
            linkPreview: false,
          })
          .catch((err: Error) => {
            bot.snake.client._log.error(err.message);
          });
      }, 7000);

      try {
        await downloader
          .download()
          .then(() => {
            finalText += `\n\nDownloaded at: <code>downloads/${fileName}</code>`;

            bot.snake.client.deleteMessages(ctx.chat.id, [ctx.id], {
              revoke: true,
            });

            bot.snake.client.sendMessage(ctx.chat.id, {
              message: finalText,
              parseMode: "html",
              linkPreview: false,
            });
          })
          .finally(() => {
            clearInterval(updateProgress);
          });
      } catch (err: any) {
        await bot.snake.client.editMessage(ctx.chat.id, {
          message: ctx.id,
          text: err.message,
        });
        throw err;
      }
    },
    {
      context: ctx,
    }
  );
});

/**
 * by dickymuliafiqri
 */

import { bot } from "..";

// RegExp
const aboutRegExp: RegExp = /^\.about$/;

bot.snake.hears(aboutRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      let finalText: string = bot.__description__;
      finalText += `\n\n<a href="${bot.__homepage__}">🏡 homepage</a>`;

      await bot.snake.client.editMessage(ctx.chat.id, {
        message: ctx.id,
        text: finalText,
        parseMode: "html",
      });
    },
    {
      context: ctx,
    }
  );
});

bot.addHelp("about", "About this project");
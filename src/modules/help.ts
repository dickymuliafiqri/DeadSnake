/**
 * by dickymuliafiqri
 *
 * Used to list all loaded modules and their short description
 */

import { bot } from "..";

// Help List
const helpList = bot.helpList;

// Regex
const helpRegExp: RegExp = /^\.help$/i;
const helpModRegExp: RegExp = /^\.help (\w+)/i;

bot.snake.hears(helpRegExp, async (ctx) => {
  let finalText: string = "";

  bot.wrapper(async () => {
    const moduleList: Array<string> = Object.keys(helpList);

    finalText = "<b>Module list</b>";
    finalText += `\nRegistered modules: ${moduleList.length}`;
    finalText += "\nHow to use: <i>.help &lt;MODULE_NAME&gt;</i>";
    finalText += "\n----------\n\n";

    moduleList.forEach((key) => {
      finalText += `${key} | `;
    });

    await bot.snake.client.editMessage(ctx.chat.id, {
      message: ctx.id,
      text: finalText,
      parseMode: "html",
    });
  }, {
    context: ctx
  });
});

bot.snake.hears(helpModRegExp, async (ctx) => {
  const match: any = ctx.text?.match(helpModRegExp);
  let finalText: string = `Module ${match[1]}`;
  bot.wrapper(async () => {
    finalText += "\n----------\n";

    if (helpList[match[1]]) finalText += `\n${helpList[match[1]]}`;
    else finalText = `There's no module with name ${match[1]}`;

    await bot.snake.client.editMessage(ctx.chat.id, {
      message: ctx.id,
      text: finalText,
      parseMode: "html",
    });
  }, {
    context: ctx
  });
});

bot.addHelp("help", "Module list and their description");

/**
 * by dickymuliafiqri
 *
 * Communicate with repo
 */

import { bot } from "../index";

// RegExp
const changelogRegExp: RegExp = /^\.cl$/;
const updateRegExp: RegExp = /^\.update$/;
const updateNowRegExp: RegExp = /^\.update now$/;

bot.snake.hears(changelogRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      const changelog = await bot.git.log({ maxCount: 10 });

      let commitList: any = {};
      changelog.all.forEach((commit) => {
        const message =
          commit.message.length > 25
            ? commit.message.substr(0, 35) + "..."
            : commit.message;
        commitList[commit.author_name] = commitList[commit.author_name]
          ? [...commitList[commit.author_name], message]
          : [message];
      });

      let finalText: string = "<b>Latest changelog</b>";
      finalText += "\n----------";

      for (const author of Object.keys(commitList)) {
        finalText += `\n\n${author}`;
        for (const commit of commitList[author]) {
          finalText += `\n\t└<i>${commit}</i>`;
        }
      }

      finalText += "\n\n<i>Changelog based on local repository</i>";
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

bot.snake.hears(updateRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      await bot.git.fetch("origin", bot.branch);
      const status = await bot.git.status();
      const updateCount: number = status.behind;

      let finalText: string = `<b>Update ${bot.__name__}</b>`;
      finalText += "\n----------\n";

      if (!updateCount) {
        finalText += "\nThere's no update, happy (trolling...) ?!";
      } else {
        finalText += "\nUpdate available!";

        const update = await bot.git.log([
          "--max-count",
          String(updateCount),
          `origin/${bot.branch}`,
        ]);
        update.all.forEach((commit) => {
          finalText += `\n- ${
            commit.message.length > 25
              ? commit.message.substr(0, 35) + "..."
              : commit.message
          }`;
          finalText += `\n\t└<i>${commit.author_name}</i>`;
          finalText += `\n\t└<i>${commit.date}</i>\n`;
        });

        finalText += "\n\nsend <code>.update now</code> to install update";
      }

      if (finalText.length > 2000)
        finalText = `${finalText.substr(0, 2000)}...`;

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

bot.snake.hears(updateNowRegExp, async (ctx) => {
  bot.wrapper(
    async () => {
      let finalText: string = "";

      // Pull from remote/origin
      const pull = async () => {
        await bot.git.pull(
          "origin",
          bot.branch,
          ["-X", "theirs"],
          (err, res) => {
            if (err) throw err;

            finalText = `<b>Updating ${bot.branch} Successful</b>`;
            finalText += "\n----------\n";

            finalText += "\nSummary";
            finalText += `\n- Changes: ${res.summary.changes}`;
            finalText += `\n- Deletions: ${res.summary.deletions}`;
            finalText += `\n- Insertions: ${res.summary.insertions}`;

            finalText += "\n\nsend <code>.restart</code> to apply update";
          }
        );
      };

      // Clean local repo before pulling from upstream
      await bot.git.clean("f", ["-d"]);

      // Reset workspace if conflict happens
      await pull().catch(async (err: Error) => {
        bot.snake.client._log.error(err.message);
        bot.snake.client.editMessage(ctx.chat.id, {
          message: ctx.id,
          text: `Failed pull origin\n${err.message}`,
          linkPreview: false,
        });

        try {
          bot.snake.client.sendMessage(ctx.chat.id, {
            message: "Trying to hard reset...",
          });
          await bot.git.reset(["--hard", bot.branch]);
          await pull();
        } catch (e: any) {
          throw e;
        }
      });

      await bot.snake.client
        .sendMessage(ctx.chat.id, {
          message: finalText,
          parseMode: "html",
          linkPreview: false,
        })
        .then(() => {
          bot.snake.client.deleteMessages(ctx.chat.id, [ctx.id], {
            revoke: true,
          });
        });
    },
    {
      context: ctx,
    }
  );
});

let desc: string = "Communicate with repo\n";
desc += "\n<code>.cl</code> -> 10 latest changelog";
desc += "\n<code>.update</code> -> Check and update bot";

bot.addHelp("git", desc);

/**
 * by dickymuliafiqri
 *
 * DeadSnake main class, using tgsnake based on gramjs
 */

import packageData from "../package.json";
import si from "systeminformation";
import { Snake } from "tgsnake";
import { getEnv } from "../src/utils/Utilities";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { MessageContext } from "tgsnake/lib/Context/MessageContext";
import { exec } from "child_process";
import simpleGit, { SimpleGit } from "simple-git";

const isTest: boolean = process.argv.includes("--test");

interface WrapperOptionsInterface {
  context: MessageContext;
  out?: boolean;
  mentioned?: boolean;
}

interface HelpInterface {
  [key: string]: string;
}

class DeadSnakeBaseClass {
  __name__: string = packageData.name;
  __version__: string = packageData.version;
  __homepage__: string = packageData.homepage;
  __description__: string = packageData.description;
  __url__: string = packageData.repository.url;
  projectDir: string = process.cwd();
}

export class DeadSnake extends DeadSnakeBaseClass {
  private _bot: Snake = new Snake();
  private _helpList: HelpInterface = {};

  readonly isHeroku: boolean | undefined = !!getEnv("_", false)?.match("heroku");
  readonly herokuAppName: string | undefined = this.isHeroku ? getEnv("HEROKU_APP_NAME") : undefined;
  readonly herokuApiKey: string | undefined = this.isHeroku ? getEnv("HEROKU_API_KEY") : undefined;
  readonly chatLog: number = Number(getEnv("CHAT_LOG"));
  readonly git: SimpleGit = simpleGit({
    baseDir: this.projectDir,
  });

  logger = getEnv("LOGGER", true);
  branch!: string;
  botImg: string | undefined = getEnv("BANNER_IMAGE", false);

  constructor() {
    super();

    // Create folder downloads if not exists
    if (!existsSync("downloads")) mkdirSync("downloads");

    // Initialize error handler
    this._bot.catch(async (err, ctx) => {
      let context: string;

      // Stringify context
      try {
        context = JSON.stringify(ctx, null, 2);
      } catch (err) {
        context = "Failed to parse context!";
      }

      let errorMessage: string = "========== An Error Occurred ==========\n";
      errorMessage += `\n${context}\n`;
      errorMessage += "\n---------- DEAD SNAKE START ----------\n";
      errorMessage += `\n${err.stack}\n`;
      errorMessage += "\n----------- DEAD SNAKE END -----------";

      await this._bot.telegram.sendDocument(
        this.chatLog,
        Buffer.from(errorMessage),
        {
          fileName: "log.txt",
          caption: err?.message,
        }
      );
    });

    // Check bot image/banner
    const defaultImg: string = `${this.projectDir}/docs/images/Banner.png`;
    this.botImg = this.botImg?.match(/http(s)?:\/\//)
      ? this.botImg
      : existsSync(String(this.botImg))
      ? this.botImg
      : existsSync(defaultImg)
      ? defaultImg
      : undefined;

    // Only support 1 branch fot the moment
    // Branch switching isn't supported yet
    this.branch = "main";

    // Send message when bot is connected
    this._bot.on("connected", async () => {
      await this.git.checkIsRepo().then(async (isRepo) => {
        if (!isRepo) {
          console.log("🐍 Configuring repository upstream...");

          await this.git.init().addRemote("origin", this.__url__);
          await this.git.fetch("origin");
          await this.git.branch(["--track", this.branch, "origin/main"]);
          await this.git.checkout(["-B", this.branch, "-f"]);
          await this.git.reset(["--hard", `origin/${this.branch}`]);

          // Configure github email and username
          await this.git.addConfig("user.name", "deadsnake");
          await this.git.addConfig(
            "user.email",
            "deadsnake@users.noreply.github.com"
          );
        }
      });

      let restartId: any = getEnv("RESTART_ID", false) || "";
      if (restartId) {
        console.log("🐍 Successfully restart, sending report...");

        restartId = restartId.split("::");
        const chatId: number = Number(restartId[0]);
        const msgId: number = Number(restartId[1]);
        await this._bot.telegram
          .editMessage(chatId, msgId, "Bot restarted!")
          .then(() => {
            writeFileSync(`${this.projectDir}/temp.env`, "RESTART_ID=''", {
              flag: "w+",
            });
          });
      }

      console.log("🐍 Sending botInfo to CHAT_LOG...");
      await this._bot.client
        .sendMessage(this.chatLog, {
          message: await this.buildBotInfo(),
          file: this.botImg,
          parseMode: "html",
          linkPreview: false,
        })
        .finally(async () => {
          if (isTest) {
            // @ts-ignore
            await import("../test");
          }
        });
    });
  }

  get snake(): Snake {
    return this._bot;
  }

  get helpList(): HelpInterface {
    return this._helpList;
  }

  addHelp(name: string, description: string) {
    if (this._helpList[name])
      console.error(
        `🐍 Description for ${name} is conflict with another module!`
      );
    this._helpList[name] = description;
  }

  async buildBotInfo(): Promise<string> {
    // Build botInfo message
    let botInfo: string = `${this.__name__} ${this.__version__} is Up!`;
    botInfo += `\n<i>An Awesome UserBot by 🔥<b>${
      getEnv("ACCOUNT_NAME", false) || "DeadSnake"
    }</b>🔥</i>\n`;
    botInfo += `\n----------\n`;
    botInfo += "\n<b>Framework Information</b>";
    botInfo += `\n・NodeJS: ${process.version}`;
    botInfo += `\n・GramJS: ${this._bot.client.__version__}`;
    botInfo += `\n・tgSnake: ${this._bot.version}\n`;

    botInfo += "\n<b>Server Information</b>";
    botInfo += "\n⎧";

    // Get OS info
    await si.osInfo((data) => {
      botInfo += `\n⎪- OS`;
      botInfo += `\n⎪\t  └Platform: ${data.platform} ${data.arch}`;
      botInfo += `\n⎪\t    └Codename: ${data.codename}`;
      botInfo += `\n⎪\t    └Build: ${data.build}`;
    });

    // Get CPU info
    await si.cpu((data) => {
      botInfo += `\n⎪- CPU`;
      botInfo += `\n⎪\t  └Manufacture: ${data.manufacturer}`;
      botInfo += `\n⎪\t  └Brand: ${data.brand}`;
      botInfo += `\n⎪\t  └Speed: ${data.speed} GHz`;
      botInfo += `\n⎪\t  └Cores: ${data.cores}`;
    });

    // Get memory info
    await si.mem((data) => {
      botInfo += `\n⎪- Memory`;
      botInfo += `\n⎪\t  └Total: ${(data.total / 1000000).toFixed()} MB`;
      botInfo += `\n⎪\t    └Active: ${(data.active / 1000000).toFixed()} MB`;
      botInfo += `\n⎪\t    └Available: ${(
        data.available / 1000000
      ).toFixed()} MB`;
    });

    // Get memory layout
    await si.memLayout((layoutData) => {
      botInfo += "\n⎪\t  └Layout";
      layoutData.forEach((data) => {
        botInfo += `\n⎪\t    └${data.bank}`;
        botInfo += `\n⎪\t      └Manufacture: ${data.manufacturer}`;
        botInfo += `\n⎪\t      └Type: ${data.type}`;
        botInfo += `\n⎪\t      └C.Speed: ${data.clockSpeed} Mhz`;
        botInfo += `\n⎪\t      └Size: ${(data.size / 1000000).toFixed()} MB`;
      });
    });

    // Get disk layout
    await si.diskLayout((layoutData) => {
      botInfo += `\n⎪- File System`;

      layoutData.forEach((data) => {
        botInfo += `\n⎪\t  └${data.device}`;
        botInfo += `\n⎪\t    └Vendor: ${data.vendor}`;
        botInfo += `\n⎪\t    └Name: ${data.name}`;
        botInfo += `\n⎪\t    └Type: ${data.type}`;
        botInfo += `\n⎪\t    └Size: ${(data.size / 1000000000).toFixed()} GB`;
      });
    });
    botInfo += "\n⎩";

    return botInfo;
  }

  async start(): Promise<Snake> {
    // If STRING_SESSION is not configured
    if (!process.env["STRING_SESSION"]) {
      // Print message and exit app
      console.log(
        "🐍 No STRING_SESSION provided, run generator.js to get one!"
      );
      if (isTest) {
        process.exit(0);
      } else {
        exec("forever stop app/src/index.js");
      }
    }

    // Try to reconnect client when it disconnected
    // setInterval(async () => {
    //   const isUserConnected: boolean | undefined =
    //     this._bot?.client?._sender?._userConnected;
    //   if (isUserConnected === false) {
    //     if (this.logger === "debug") {
    //       this._bot.client._log.error(`Bot disconnected!`);
    //     }
    //     await this._bot.client.connect().then(async () => {
    //       await this._bot.telegram
    //         .sendMessage(this._chatLog, "Bot reconnected!")
    //         .then(() => {
    //           this._bot.client._log.info("Bot reconnected!");
    //         });
    //     });
    //   }
    // }, 1000);

    return (await this._bot.run().then(() => {
      // Configure client
      // this._bot.client.floodSleepThreshold = 60;
      // this._bot.client.setParseMode("html");
    })) as Snake;
  }

  wrapper(handler: CallableFunction, options: WrapperOptionsInterface) {
    // Filters
    if (options.out !== false) {
      if (!options.context.out) return;
    }
    if (options.mentioned) {
      if (!options.context.mentioned) return;
    }

    // Execute handler
    return (
      (async () => {
        try {
          await handler();
        } catch (err: any) {
          await this._bot._handleError(err, err.message);
        }
      }) as CallableFunction
    )();
  }
}

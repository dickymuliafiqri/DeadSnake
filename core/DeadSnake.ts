/**
 * by dickymuliafiqri
 *
 * DeadSnake main class, using tgsnake based on gramjs
 */

import packageData from "../package.json";
import si from "systeminformation";
import { Snake } from "tgsnake";
import { getEnv } from "../src/utils/Utilities";
import { existsSync, writeFileSync } from "fs";
import { MessageContext } from "tgsnake/lib/Context/MessageContext";

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
  projectDir: string = process.cwd();
}

export class DeadSnake extends DeadSnakeBaseClass {
  private _bot: Snake = new Snake();
  private _chatLog: number = Number(getEnv("CHAT_LOG"));
  private _helpList: HelpInterface = {};

  logger = getEnv("LOGGER", true);
  botImg: string = `${process.cwd()}/docs/images/Banner.png`;

  constructor() {
    super();

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
        this._chatLog,
        Buffer.from(errorMessage),
        {
          fileName: "log.txt",
          caption: err?.message,
        }
      );
    });

    // Send message when bot is connected
    this._bot.on("connected", async () => {
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
        .sendMessage(this._chatLog, {
          message: await this.buildBotInfo(),
          file: existsSync(this.botImg) ? this.botImg : undefined,
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
      // Generate one
      await this._bot.generateSession().finally(() => {
        process.exit(0);
      })
    }

    const bot = (await this._bot.run().then(() => {
      // Configure client
      this._bot.client.floodSleepThreshold = 60;
      this._bot.client.setParseMode("html");
    })) as Snake;


    // Try to reconnect client when it disconnected
    setInterval(async () => {
      const isUserConnected: boolean | undefined =
        this._bot?.client?._sender?._userConnected;
      if (isUserConnected === false) {
        if (this.logger === "debug") {
          this._bot.client._log.error(`Bot disconnected!`);
        }
        await this._bot.client.connect().then(async () => {
          await this._bot.telegram
            .sendMessage(this._chatLog, "Bot reconnected!")
            .then(() => {
              this._bot.client._log.info("Bot reconnected!");
            });
        });
      }
    }, 1000);

    return bot;
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

/**
 * Project Name: DeadSnake
 *  |- github: dickymuliafiqri/DeadSnake
 *
 * Programmer: dickymuliafiqri
 *  |- github: dickymuliafiqri
 *  |- telegram: d_fordlalatina
 *
 * Start: Fri 26 November 2021 09:00
 *
 * This software is licensed on MIT
 * Programmer and or other collaborator(s) is not responsible at any type of misused
 * Please read our LICENSE for more details
 */

import { DeadSnake } from "../core/DeadSnake";
import { loadModules } from "./modules";
import { config } from "dotenv";
import { existsSync } from "fs";

const envFile: Array<string> = ["config.env", "temp.env"];

// Load environment if file exists
envFile.forEach(file => {
  const filePath: string = `${process.cwd()}/${file}`;
  if (existsSync(filePath)) {
    config({
      path: filePath
    });
  }
});

const bot = new DeadSnake();

// Run services
(async () => {

  // Load installed modules and start bot
  await loadModules();
  await bot.start();
})();

export { bot };

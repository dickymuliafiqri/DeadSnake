/**
 * by dickymuliafiqri
 *
 * Used to load all installed modules.
 */

import { readdirSync } from "fs";

// List and import all modules
export const loadModules = async () => {
  const moduleList: Array<string> = readdirSync(
    `${process.cwd()}/app/src/modules/`
  );

  const modulesLoaded: Array<string> = await new Promise((resolve) => {
    let modulesLoaded: Array<string> = [];
    moduleList.forEach(async (moduleName) => {
      if (/\.js$/i.exec(moduleName)) {
        if (moduleName === "index.js") return;

        await import(`./${moduleName}`)
          .then(() => {
            if (!(modulesLoaded.length % 3))
              modulesLoaded.push(`\n${moduleName}`);
            else modulesLoaded.push(moduleName);
          })
          .catch((err) => {
            console.error(`Failed to load module ${moduleName}\n`, err);
            process.exit(1);
          });
        resolve(modulesLoaded);
      }
    });
  });

  console.log(
    `🔌 Modules loaded: ${modulesLoaded.length}${modulesLoaded.join(" | ")}`
  );
};

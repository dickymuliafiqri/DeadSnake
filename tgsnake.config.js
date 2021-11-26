/**
 * Config for initialize and run bot properly
 */

const utils = require("./app/src/utils/Utilities");

module.exports = {
  apiHash: utils.getEnv("API_HASH"),
  apiId: utils.getEnv("API_ID"),
  session: utils.getEnv("STRING_SESSION", false) || undefined,
  chatLog: utils.getEnv("CHAT_LOG"),

  //  Use below options to debug/development needs
  logger: utils.getEnv("LOGGER"),
  tgSnakeLog: true,
};

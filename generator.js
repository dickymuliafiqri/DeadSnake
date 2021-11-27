/**
 * by dickymuliafiqri
 *
 * String session generator
 */

const { Snake } = require("tgsnake");
const { config } = require("dotenv");

config({
    path: "config.env"
})
process.env.LOGGER = "info";

const snake = new Snake();

(async () => {
    await snake.generateSession();
})();

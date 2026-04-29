const createPool = require("./createPool");
module.exports = createPool(process.env.DB_USER_DB || "xyon_user_db");
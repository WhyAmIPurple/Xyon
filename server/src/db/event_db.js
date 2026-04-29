const createPool = require("./createPool");
module.exports = createPool(process.env.DB_EVENT_DB || "xyon_event_db");
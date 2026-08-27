const {
  HOST,
  USER,
  PASSWORD,
  DB,
  DB_PORT,
  NODE_ENV,
}= require('./config.js'); 
class DBConfig {
  constructor() {
    this.HOST = HOST

    this.USER = USER
    this.PASSWORD = PASSWORD
    this.DB = DB
    this.PORT = DB_PORT
    this.dialect = "postgres"
    this.ssl = true
    this.pool = {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    };
  }

  getConfig() {
    return {
      HOST: this.HOST,
      USER: this.USER,
      PASSWORD: this.PASSWORD,
      DB: this.DB,
      PORT: this.PORT,
      DATABASE_URL: this.DATABASE_URL,
      dialect: this.dialect,
      ssl: this.ssl,
      rejectUnauthorized: this.rejectUnauthorized,
      pool: this.pool
    };
  }
}

module.exports = new DBConfig().getConfig();

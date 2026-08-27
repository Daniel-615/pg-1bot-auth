const dotenv = require('dotenv');
dotenv.config();
const { PORT } = process.env;
const {
  HOST, USER, DB_PORT, SECRET_JWT_KEY,
  FRONTEND_URL, NODE_ENV,
  DB_PASSWORD, DB

} = process.env;

module.exports = {
  PORT,
  HOST: HOST,
  USER: USER,
  PASSWORD: DB_PASSWORD,
  DB: DB,
  DB_PORT: DB_PORT,
  SALT_ROUNDS: 10,
  SECRET_JWT_KEY,
  FRONTEND_URL,
  NODE_ENV
};

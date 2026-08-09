import mysql from 'mysql2/promise';

export type Database = mysql.Pool;

export function createDatabase(): Database {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'paspas_fuar_teklif', connectionLimit: 10, decimalNumbers: true,
  });
}

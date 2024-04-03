const mysql = require("mysql2");
require("dotenv").config();
const chalk = require("chalk");

// Function to set up the database
const setupDatabase = async () => {
  await new Promise((resolve, reject) => {
    if (process.env.DB_HOST === "localhost") {
      // Create a connection to the MySQL database
      const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PW,
      });

      // Connect to the MySQL server
      connection.connect((err) => {
        if (err) {
          console.log(chalk.red(err));
          reject();
        }
      });

      // Drop the database if it exists
      connection.query(
        `DROP DATABASE IF EXISTS ${process.env.DB_NAME}`,
        (err) => {
          if (err) {
            console.log(chalk.red(err));
            reject();
          }
        }
      );

      // Create the database if it doesn't exist
      connection.query(
        `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
        (err) => {
          if (err) {
            console.log(chalk.red(err));
            reject();
          }
        }
      );

      // Use the database
      connection.query(`USE ${process.env.DB_NAME}`, (err) => {
        if (err) {
          console.log(chalk.red(err));
          reject();
        } else {
          console.log(chalk.green("Database setup successful!"));
          resolve();
        }
      });
    } else {
      console.log(
        chalk.yellow("Remote database detected. Skipping local setup.")
      );
      resolve();
    }
  });
};

module.exports = { setupDatabase };

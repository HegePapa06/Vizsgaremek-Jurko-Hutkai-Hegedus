const {Sequelize} = require("sequelize");

const sequelize = new Sequelize("drivepro", "root", "", {
    host: "localhost",
    dialect: "mysql"
});

module.exports = sequelize;
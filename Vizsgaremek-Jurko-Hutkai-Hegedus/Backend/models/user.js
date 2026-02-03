const { DataTypes } = require("sequelize");
const sequelize = require("../db"); 

const User = sequelize.define("user", {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }, 
    role: {
        type: DataTypes.ENUM("tanulo", "tanar"),
        allowNull: false
    }, 
    county: { 
        type: DataTypes.STRING 
    },
    bio: { 
        type: DataTypes.TEXT 
    },
    phone: {
         type: DataTypes.STRING 
    },
    photo: { 
        type: DataTypes.STRING 
    },
}, {
    tableName: "users",
    timestamps: true
});

module.exports = User;
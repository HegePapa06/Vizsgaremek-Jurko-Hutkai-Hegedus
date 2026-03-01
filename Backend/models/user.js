const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
    city: {
        type: DataTypes.STRING,
        allowNull: false
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
    canRetakeExam: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastExamFailed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    purchasedHours: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    hasLicense: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: "users",
    timestamps: true
});

module.exports = User;
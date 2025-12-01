const { DataTypes } = require("sequelize");
const sequelize = require("./db"); 

const Menu1000Recipe = sequelize.define("Menu1000Recipe", {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  ingredients: { type: DataTypes.JSONB }, 
  totalTime: { type: DataTypes.STRING },
  activeTime: { type: DataTypes.STRING },
  equipment: { type: DataTypes.JSONB },  
  url: { type: DataTypes.STRING, unique: true },
});

module.exports = Menu1000Recipe;

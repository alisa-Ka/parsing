const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Recipe = sequelize.define("Recipe", {
  title: { type: DataTypes.STRING, allowNull: false },
  ingredients: { type: DataTypes.JSONB }, 
  categories: { type: DataTypes.JSONB },  
  cookTime: { type: DataTypes.STRING },
  portions: { type: DataTypes.STRING },
  comments: { type: DataTypes.STRING },
  url: { type: DataTypes.STRING, unique: true }, 
});

module.exports = Recipe;

const { DataTypes } = require("sequelize");
const sequelize = require("./db"); 

const PovarenokRecipe = sequelize.define("PovarenokRecipe", {
  title: { type: DataTypes.STRING, allowNull: false },
  ingredients: { type: DataTypes.JSONB },
  categories: { type: DataTypes.JSONB },
  description: { type: DataTypes.TEXT },
  publishTime: { type: DataTypes.STRING },
  views: { type: DataTypes.STRING },
  url: { type: DataTypes.STRING, unique: true },
});

module.exports = PovarenokRecipe;

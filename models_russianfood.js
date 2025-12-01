const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const RussianFoodRecipe = sequelize.define(
  "russianfood_recipes",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    ingredients: { type: DataTypes.JSONB },
    author: { type: DataTypes.TEXT },
    cookTime: { type: DataTypes.STRING },
    url: { type: DataTypes.TEXT, unique: true },
  },
  {
    tableName: "russianfood_recipes",
    timestamps: false,
  }
);

module.exports = RussianFoodRecipe;

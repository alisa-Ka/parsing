const { DataTypes } = require("sequelize");
const sequelize = require("./db"); 

const GotovimRecipe = sequelize.define("GotovimRecipe", {
  title: { type: DataTypes.STRING, allowNull: false },          
  description: { type: DataTypes.TEXT },     
  ingredients: { type: DataTypes.JSONB },    
  publishDate: { type: DataTypes.STRING },  
  tags: { type: DataTypes.JSONB },  
  url: { type: DataTypes.STRING, unique: true }, 
});

module.exports = GotovimRecipe;

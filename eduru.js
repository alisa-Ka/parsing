const axios = require("axios");
const cheerio = require("cheerio");
const sequelize = require("./db");
const Recipe = require("./models_eduru");

const BASE_URL = "https://eda.ru/recepty";
const PAGES = [1, 2];
const DELAY_MS = 2000;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));


async function fetchRecipeLinks() {
  const allLinks = [];

  for (const page of PAGES) {
    const url = `${BASE_URL}?page=${page}`;

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      $("div.css-1j5xcrd a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("/recepty/")) {
          const fullLink = "https://eda.ru" + href;
          if (!allLinks.includes(fullLink)) {
            allLinks.push(fullLink);
          }
        }
      });

      console.log(`Найдено рецептов на странице ${page}: ${allLinks.length}`);
      await delay(DELAY_MS);
    } catch (err) {
      console.error(`Ошибка при загрузке страницы ${page}:`, err.message);
    }
  }

  console.log(`\nВсего собрано ссылок: ${allLinks.length}`);
  return allLinks.slice(20, 22);
}


async function fetchRecipeData(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $("h1").text().trim();
    const ingredients = $('span[itemprop="recipeIngredient"]')
      .map((i, el) => $(el).text().trim())
      .get();
    const categories = $('ul[itemtype="http://schema.org/BreadcrumbList"] li a')
      .map((i, el) => $(el).text().trim())
      .get();
    const cookTime = $(".css-my9yfq").text().trim();
    const portions = $('span[itemprop="recipeYield"]').text().trim();
    const comments = $("span.css-chopl0").text().trim();

    return {
      title,
      ingredients,
      categories,
      cookTime,
      portions,
      comments,
      url,
    };
  } catch (err) {
    console.error(`Ошибка при загрузке рецепта (${url}):`, err.message);
    return null;
  }
}

async function saveRecipeToDB(recipe) {
  try {
    const [record, created] = await Recipe.findOrCreate({
      where: { url: recipe.url },
      defaults: recipe,
    });

    if (created) {
      console.log(`Сохранён: ${recipe.title}`);
    } else {
      console.log(`Уже есть в базе: ${recipe.title}`);
    }
  } catch (err) {
    console.error("Ошибка при сохранении в БД:", err.message);
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Подключение к PostgreSQL успешно!");

    await sequelize.sync(); 
    console.log("Таблица синхронизирована");

    const links = await fetchRecipeLinks();

    for (const url of links) {
      const recipe = await fetchRecipeData(url);
      if (recipe) {
        await saveRecipeToDB(recipe);
      }
      await delay(DELAY_MS);
    }

    console.log("\nСбор и сохранение данных завершены!");
  } catch (err) {
    console.error("Ошибка:", err.message);
  } finally {
    await sequelize.close();
  }
}

main();

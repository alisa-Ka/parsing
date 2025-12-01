const axios = require("axios");
const cheerio = require("cheerio");
const sequelize = require("./db");
const GotovimRecipe = require("./models_gotovimdoma");

const BASE_URL = "https://gotovim-doma.ru/recipes";
const PAGES = [1, 2,3,4,5];
const DELAY_MS = 2000;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));


async function fetchRecipeLinks() {
  const allLinks = [];

  for (const page of PAGES) {
    const url = `${BASE_URL}?page=${page}`;

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      $("div.span-3.half-box div.recept-item-in h4 a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && !allLinks.includes(href)) {
          allLinks.push(href.startsWith("http") ? href : `https://gotovim-doma.ru${href}`);
        }
      });

      console.log(`Найдено рецептов на странице ${page}: ${allLinks.length}`);
      await delay(DELAY_MS);
    } catch (err) {
      console.error(`Ошибка при загрузке страницы ${page}:`, err.message);
    }
  }

  console.log(`\nВсего собрано ссылок: ${allLinks.length}`);
  return allLinks; 
}


async function fetchRecipeData(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $("h1").text().trim();
    const tags = $("ul.border-tag li a")
      .map((i, el) => $(el).text().trim())
      .get();
    const description = $('p.summary[itemprop="description"]').text().trim();
    const ingredients = $('table.recept-table tr[itemprop="recipeIngredient"] span.name a')
      .map((i, el) => $(el).text().trim())
      .get();
    const publishDate = $("div.article-open-date").text().trim();

    return { title, tags, description, ingredients, publishDate, url };
  } catch (err) {
    console.error(`Ошибка при загрузке рецепта (${url}):`, err.message);
    return null;
  }
}


async function saveRecipeToDB(recipe) {
  try {
    const [record, created] = await GotovimRecipe.findOrCreate({
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

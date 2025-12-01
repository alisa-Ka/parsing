const axios = require("axios");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const RussianFoodRecipe = require("./models_russianfood");
const sequelize = require("./db");

const BASE_URL = "https://www.russianfood.com/recipes/bytype/?fid=12";
const PAGES = [1, 2];
const DELAY_MS = 2000;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));


async function fetchRecipeLinks() {
  const allLinks = [];

  for (const page of PAGES) {
    const url = `${BASE_URL}&page=${page}`;
    try {
      const { data } = await axios.get(url, { responseType: "arraybuffer" });
      const decoded = iconv.decode(data, "windows-1251");
      const $ = cheerio.load(decoded);

      $("div.in_seen a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && !allLinks.includes(href)) {
          allLinks.push(
            href.startsWith("http")
              ? href
              : `https://www.russianfood.com${href}`
          );
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
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    const decoded = iconv.decode(data, "windows-1251");
    const $ = cheerio.load(decoded);

    const title = $("h1").text().trim();
    const description = $("tr td.padding_l.padding_r div p").text().trim();
    const ingredients = $("table.ingr td.padding_l.padding_r span")
      .map((i, el) => $(el).text().trim())
      .get();
    const author = $("div.el.user_date a").text().trim();
    const cookTime = $("span.hl").text().trim();

    return { title, description, ingredients, author, cookTime, url };
  } catch (err) {
    console.error(`Ошибка при загрузке рецепта (${url}):`, err.message);
    return null;
  }
}


async function main() {
  try {
    await sequelize.authenticate();
    console.log("Подключение к PostgreSQL успешно!");
    await RussianFoodRecipe.sync();
    console.log("Таблица russianfood_recipes синхронизирована");

    const links = await fetchRecipeLinks();

    for (const url of links) {
      const recipe = await fetchRecipeData(url);
      if (recipe) {
        const [rec, created] = await RussianFoodRecipe.findOrCreate({
          where: { url: recipe.url },
          defaults: recipe,
        });
        if (created)
          console.log(`Сохранён: ${recipe.title}`);
        else
          console.log(`Уже существует: ${recipe.title}`);
      }
      await delay(DELAY_MS);
    }

    console.log("\nСбор и сохранение данных завершены!");
  } catch (err) {
    console.error("Ошибка при работе:", err.message);
  } finally {
    await sequelize.close();
  }
}

main();

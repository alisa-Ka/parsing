const axios = require("axios");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const sequelize = require("./db");
const PovarenokRecipe = require("./models_povarenok");

const BASE_URL = "https://www.povarenok.ru/recipes/dishes/first/?searchid=1";
const PAGES = [1, 2, 3,4,5];
const DELAY_MS = 2000;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));


async function fetchRecipeLinks() {
  const allLinks = [];

  for (const page of PAGES) {
    let url;
    
    if (page === 1) {
      url = BASE_URL; 
    } else {
      url = BASE_URL.replace('/recipes/dishes/first/', `/recipes/dishes/first/~${page}/`);
    }

    try {
      const { data: rawData } = await axios.get(url, {
        responseType: "arraybuffer",
      });

      const data = iconv.decode(rawData, "windows-1251");
      const $ = cheerio.load(data);

      $("article.item-bl h2 a").each((_, el) => {
        let href = $(el).attr("href");
        if (!href) return;
        href = href.trim();

        if (href.startsWith("/")) href = "https://www.povarenok.ru" + href;

        if (href.includes("/recipes/show/") && !allLinks.includes(href)) {
          allLinks.push(href);
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
    const { data: rawData } = await axios.get(url, { responseType: "arraybuffer" });
    const data = iconv.decode(rawData, "windows-1251");
    const $ = cheerio.load(data);

    const title = $("h1").first().text().trim();
    const ingredients = $('.ingredients-bl [itemprop="recipeIngredient"] span')
      .map((i, el) => $(el).text().trim())
      .get();
    const categories = $('div.article-breadcrumbs span[itemprop="recipeCategory"]')
      .map((i, el) => $(el).text().trim())
      .get();
    const description =
      $('.article-text[itemprop="description"]').text().trim() ||
      $(".recipe-text, .description").text().trim();
    const publishTime = $("li span.i-time, .i-time").first().text().trim();
    const views = $("li span.i-views, .i-views").first().text().trim();

    return { title, ingredients, categories, description, publishTime, views, url };
  } catch (err) {
    console.error("Ошибка при парсинге рецепта:", err.message);
    return null;
  }
}


async function saveRecipeToDB(recipe) {
  try {
    const [record, created] = await PovarenokRecipe.findOrCreate({
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

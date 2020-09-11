const puppeteer = require("puppeteer");
const config = require("./config.json");
const { fetchPosts, connect, markPublished } = require("./fetch.js");

const initPage = async (browser) => {
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.setDefaultNavigationTimeout(0);
  await page.setDefaultTimeout(0);
  await page.setRequestInterception(true);
  await page.setViewport({ width: 1280, height: 720 });
  page.on("request", (req) => {
    if (
      req.resourceType() === "image" ||
      // req.resourceType() === "stylesheet" ||
      req.resourceType() == "font"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
  await page.goto(`https://${config.website}/wp-admin/post-new.php`, {
    waitUntil: "networkidle2",
  });

  return page;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./data",
    args: [
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
  });

  let page = await initPage(browser);
  console.log("Initialized page");

  let address = await page.evaluate(() => window.location.href);

  // await page.waitFor(1000000);

  if (address.includes("login")) {
    await page.type("#user_login", config.login);
    await page.type("#user_pass", config.pass);
    await page.click("#rememberme");
    await page.click("#wp-submit");
    await page.waitForNavigation();
  }
  await page.close();

  let client = await connect();
  const db = client.db("rachael");
  while (true) {
    const posts = await fetchPosts();
    console.log("Looping");
    for (let index = 0; index < posts.length; index += 3) {
      let promises = [];
      for (const post of posts.slice(index, index + 3)) {
        promises.push(createPost(browser, post, db));
      }
      await Promise.all(promises);
    }
  }
  await browser.close();
})();

let createPost = async (browser, post, db) => {
  let page = await initPage(browser);
  try {
    try {
      await page.click("div.components-modal__header > button");
    } catch (error) {}

    await page.evaluate((post) => {
      document.querySelector(".editor-post-text-editor").value = post.content;
    }, post);

    await page.type("textarea", post.title);

    await page.type(".editor-post-text-editor", String.fromCharCode(13));

    await page.click(".editor-post-publish-panel__toggle");
    await page.waitFor(1000);
    await page.click(".editor-post-publish-button");
    await page.waitForSelector(
      ".post-publish-panel__postpublish-header > a:nth-child(1)"
    );
    let value = await page.evaluate(
      () => document.querySelector("textarea").value
    );

    // await page.waitFor(5000);

    await markPublished(db, post);

    return new Promise((resolve, reject) => {
      console.log(post.title);
      resolve(value);
    });
  } catch (error) {
    console.log(error);
  } finally {
    await page.close();
  }
};

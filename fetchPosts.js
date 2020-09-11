const { fetchLinks, addPosts, connect } = require("./fetch.js");
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./data",
  });
  let client = await connect();

  while (true) {
    const links = await fetchLinks();
    for (let i = 0; i < links.length; i += 10) {
      let promises = [];
      for (const l of links.slice(i, i + 10)) {
        link = l._id;
        promises.push(getPost(browser, link));
      }
      let fetchedPosts = await Promise.all(promises);
      await addPosts(client, fetchedPosts);
      console.log("Added " + fetchedPosts.length);
    }
  }
  browser.close();
})();

let getPost = async (browser, link) => {
  const page = await browser.newPage();

  await page.setDefaultTimeout(120000);
  await page.setRequestInterception(true);
  await page.setViewport({ width: 1920, height: 720 });

  page.on("request", (req) => {
    if (
      req.resourceType() === "image" ||
      req.resourceType() === "stylesheet" ||
      req.resourceType() == "font"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
  await page.goto(link);
  try {
    await page.waitForSelector("#main-question p");
    const tSel = "#question-title";
    const cSel = "#main-question p";
    const post = await page.evaluate(
      (tSel, cSel) => ({
        title: document.querySelector(tSel).textContent,
        content: document.querySelector(cSel).parentElement.outerHTML,
        date: Date.parse(
          document.querySelector("time").getAttribute("datetime")
        ),
      }),
      tSel,
      cSel
    );
    post._id = link;

    await page.close();
    return new Promise(async (resolve, reject) => {
      resolve(post);
    });
  } catch (error) {
    await page.close();
  } finally {
  }
};

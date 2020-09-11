const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: "./data",
  });
  const page = await browser.newPage();
  const titleSel = "#post-title-0";
  for (const post of posts) {
    await page.goto("https://bladeresearchinc.com/wp-admin/post-new.php", {
      waitUntil: "networkidle2",
    });

    await page.click("button.components-button");

    await page.type("#block-editor-inserter__search-0", "html");
    await page.click(".block-editor-block-types-list__item-icon");

    await page.evaluate(() => {
      document.querySelector(titleSel).value = post.title;
    });
    await page.type(titleSel, String.fromCharCode(13));

    await page.evaluate(() => {
      document.querySelector(".block-editor-plain-text").value = post.content;
    });
    await page.type(".block-editor-plain-text", String.fromCharCode(13));
    await page.click(".editor-post-publish-panel__toggle");
    await page.click(".editor-post-publish-button");
  }
})();

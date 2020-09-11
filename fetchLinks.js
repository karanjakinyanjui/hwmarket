const puppeteer = require("puppeteer");
const rootURL = "https://www.homeworkmarket.com/";
const { connect } = require("./fetch");
const fields = [
  "applied-sciences",
  "architecture-and-design",
  "biology",
  "business-finance",
  "chemistry",
  "computer-science",
  "earth-science-geography",
  "earth-science-geology",
  "education",
  "engineering",
  "english",
  "environmental-science",
  "foreign-languages-spanish",
  "government",
  "history",
  "human-resource-management",
  "information-systems",
  "law",
  "literature",
  "mathematics",
  "nursing",
  "physics",
  "political-science",
  "psychology",
  "reading",
  "science",
  "social-science",
];

(async () => {
  let client = await connect();
  const browser = await puppeteer.launch({ headless: true });

  let promises = [];
  for (let index = 0; index < fields.length; index += 10) {
    for (const field of fields.slice(index, index + 10)) {
      promises.push(getFieldlinks(client, browser, field));
    }

    let results = await Promise.all(promises);
    let collection = client.db("rachael").collection("links");
    try {
      collection.insertMany(results.flat(), { ordered: false });
    } catch (error) {}
  }
  client.close();
  browser.close();
})();

let getFieldlinks = async (client, browser, field) => {
  const page = await browser.newPage();
  await page.setDefaultTimeout(120000);
  await page.setRequestInterception(true);
  await page.setViewport({ width: 1440, height: 720 });
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
  let url = `${rootURL}fields/${field}`;
  await page.goto(url);
  await page.waitFor(1000);
  return new Promise(async (resolve, reject) => {
    try {
      let links = await page.evaluate((field) => {
        const links = Array.from(
          document.querySelectorAll("li > div > div > a "),
          (i) => ({
            _id: i.href,
            title: i.textContent,
            field: field,
          })
        );
        // TODO
        links.timestamp = "";
        return links.slice(100);
      }, field);
      await page.close();
      resolve(links);
    } catch (error) {
      console.log(error);
    }
  });
};

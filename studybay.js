// document.querySelector("#showBidForm").click();

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./data",
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
  );

  await page.goto("https://studybay.app/order/search");

  await page.waitFor(20000);

  const login = await page.evaluate(() =>
    window.location.href.includes("login")
  );

  if (login) {
    await page.type('input[name="email"]', "saruniturumo3@gmail.com");
    await page.type(
      'input[name="password"]',
      "Simonmaina00" + String.fromCharCode(13)
    );
    await page.waitForNavigation();
    await page.goto("https://studybay.app/order/search", {
      waitUntil: "networkidle2",
    });
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('div[class*="styled__Label"]'))
        .find((i) => i.textContent.includes("Exclude orders with my bids"))
        .parentElement.click();
    });
    await page.waitFor(100);
    await page.click('button[color="green"]');
    await page.waitForNavigation();
  }

  while (true) {
    const orders = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"), (i) => i.href).filter((i) =>
        i.includes("getone")
      )
    );

    const promises = [];

    for (const order of orders) {
      promises.push(bid(browser, order));
    }
    let bidPrices = await Promise.all(promises);
    for (const p of bidPrices) {
      console.log(`Placed bid for ${p}`);
    }
    try {
      await page.click('div[class*="auctionnotify"]');
    } catch (error) {
      //   console.log("No new orders");
      try {
        await page.waitForSelector('div[class*="auctionnotify"]', {
          timeout: 60000,
        });
        await page.click('div[class*="auctionnotify"]');
        await page.waitFor(30000);
      } catch (error) {
        // console.log("Still no new orders");
        await page.goto("https://studybay.app/order/search", {
          waitUntil: "networkidle2",
        });
      }
    }
  }
})();

let bid = async (browser, order) => {
  let newPage = await browser.newPage();

  try {
    await newPage.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );

    await newPage.goto(order);

    await newPage.waitForSelector("#showBidForm");
    await newPage.click("#showBidForm");
    await newPage.waitForSelector("input[datatestid]");
    let timeLeft = await newPage.evaluate(() => {
      let due = Date.parse(
        document.querySelector(".orderFull-item").textContent
      );
      left = (due - Date.parse(Date())) / 3600000;
      return left;
    });

    if (timeLeft > 5) {
      let [_, minBid, maxBid] = await newPage.evaluate(() =>
        Array.from(document.querySelectorAll("span"), (i) => i.textContent)
          .find((i) => i.includes("Betting "))
          .split("$")
          .map((i) => parseInt(i))
      );

      await newPage.type("input[datatestid]", minBid.toString());

      await newPage.click('div[placeholder="Choose a template"]');

      await newPage.evaluate(() => {
        let templates = document.querySelectorAll(
          'div[class*="OptionList"]> div'
        );
        let idx = Math.floor(Math.random() * templates.length);
        templates[idx].click();
      });
      await newPage.waitFor(1000);
      await newPage.click('button[color="green"]');

      await newPage.waitFor(5000);

      let bidPrice = await newPage.evaluate(
        () => document.querySelector("#currentBid").textContent
      );

      await newPage.close();
      return new Promise((resolve, reject) => {
        resolve(bidPrice);
      });
    }
  } catch (error) {
    await newPage.close();
  }
};

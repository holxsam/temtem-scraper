import puppeteer, { Browser, Page } from "puppeteer";
import { clean } from "../utils/formatter";

// freetem selectors
// https://temtem.wiki.gg/wiki/FreeTem!_Organization
// date: h3:nth-child(2)
// table: table#rewards-curr-table
// pictures: table#rewards-curr-table > tbody > tr:nth-child(1) > td > a::attr(href)
// rewards: table#rewards-curr-table > tbody > tr:nth-child(2) > td.textContent
// table#rewards-curr-table > tbody > tr:nth-child(2) > td > a
// releases: table#rewards-curr-table > tbody > tr:nth-child(2) > td > p

interface Freetem {
  date: string;
  rewards: { releases: string; reward: string }[];
}

interface Saipark {
  date: string;
  temOne: {
    name: string;
    area: string;
    encounterRate: string;
    lumaRate: string;
    minSv: string;
    eggTech: string;
    date: string;
  };
}

const freetemUrl = "https://temtem.wiki.gg/wiki/FreeTem!_Organization";
const saiparkUrl = "https://temtem.wiki.gg/wiki/Saipark#Area_1-0";

export const scrapeFreetem = async (
  browser: Browser,
  url: string
): Promise<Freetem> => {
  return new Promise(async (resolve, reject) => {
    const page = await browser.newPage();
    await page.goto(freetemUrl, { waitUntil: "load", timeout: 0 });
    await page.waitForSelector("#rewards-curr-table");

    const rewardsSelector =
      "table#rewards-curr-table > tbody > tr:nth-child(2) > td ";
    const rewards = await page.$$eval(rewardsSelector, (rewardsTable) => {
      return rewardsTable.map((el) => {
        const releases = el.querySelector("p")?.textContent ?? "";
        const rewardsModifier = el.childNodes[0].textContent;
        const rewardsType = el.querySelector("a")?.textContent;
        const reward = rewardsModifier?.trim() + " " + rewardsType;
        return { releases, reward };
      });
    });

    const date = await page.$eval(
      "li.tocsection-4 > a > span.toctext",
      (el) => {
        return el.textContent;
      }
    );

    const data = {
      date: clean(date),
      rewards: rewards.map((el) => {
        return {
          releases: clean(el.releases),
          reward: clean(el.reward),
        };
      }),
    };

    resolve(data);
    await page.close();
  });
};

export const scrapeSaipark = async (
  browser: Browser,
  url: string
): Promise<Saipark> => {
  return new Promise(async (resolve, reject) => {
    const page = await browser.newPage();
    await page.goto(saiparkUrl, { waitUntil: "load", timeout: 0 });
    await page.waitForSelector("table#saipark-featured-temtem-history");

    const temOneSelector =
      "table#saipark-featured-temtem-history > tbody > tr:nth-child(1)";
    const temTwoSelector =
      "table#saipark-featured-temtem-history > tbody > tr:nth-child(2)";

    const temOne = await page.$eval(temOneSelector, (el) => {
      const name =
        el.querySelector("td:nth-child(1) > a")?.textContent ?? "N/A";
      const area = el.querySelector("td:nth-child(2)")?.textContent ?? "N/A";
      const encounterRate =
        el.querySelector("td:nth-child(3)")?.textContent ?? "N/A";
      const lumaRate =
        el.querySelector("td:nth-child(4)")?.textContent ?? "N/A";
      const minSv = el.querySelector("td:nth-child(5)")?.textContent ?? "N/A";
      const eggTech = el.querySelector("td:nth-child(6)")?.textContent ?? "N/A";
      const date = el.querySelector("td:nth-child(7)")?.textContent ?? "N/A";
      return { name, area, encounterRate, lumaRate, minSv, eggTech, date };
    });

    const temTwo = await page.$eval(temTwoSelector, (el) => {
      const name =
        el.querySelector("td:nth-child(1) > a")?.textContent ?? "N/A";
      const area = el.querySelector("td:nth-child(2)")?.textContent ?? "N/A";
      const encounterRate =
        el.querySelector("td:nth-child(3)")?.textContent ?? "N/A";
      const lumaRate =
        el.querySelector("td:nth-child(4)")?.textContent ?? "N/A";
      const minSv = el.querySelector("td:nth-child(5)")?.textContent ?? "N/A";
      const eggTech = el.querySelector("td:nth-child(6)")?.textContent ?? "N/A";
      const date = el.querySelector("td:nth-child(7)")?.textContent ?? "N/A";
      return { name, area, encounterRate, lumaRate, minSv, eggTech, date };
    });

    const data = {
      date: clean(temOne.date),
      temOne: {
        name: clean(temOne.name),
        area: clean(temOne.area),
        encounterRate: clean(temOne.encounterRate),
        lumaRate: clean(temOne.lumaRate),
        minSv: clean(temOne.minSv),
        eggTech: clean(temOne.eggTech),
        date: clean(temOne.date),
      },
      temTwo: {
        name: clean(temTwo.name),
        area: clean(temTwo.area),
        encounterRate: clean(temTwo.encounterRate),
        lumaRate: clean(temTwo.lumaRate),
        minSv: clean(temTwo.minSv),
        eggTech: clean(temTwo.eggTech),
        date: clean(temTwo.date),
      },
    };

    resolve(data);
    await page.close();
  });
};

export const scrapeWeeklies = async () => {
  const browser = await puppeteer.launch();
  const saipark = await scrapeSaipark(browser, saiparkUrl);
  const freetem = await scrapeFreetem(browser, freetemUrl);

  await browser.close();

  return { saipark, freetem };
};

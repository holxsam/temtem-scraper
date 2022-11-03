import puppeteer, { Browser } from "puppeteer";
import { clean } from "../utils/formatter";
import { SpecieData } from "../utils/types";
import { outputToFile } from "../utils/utils";

const specialUrls = [
  "https://temtem.wiki.gg/wiki/Mimit",
  "https://temtem.wiki.gg/wiki/Swali",
  "https://temtem.wiki.gg/wiki/Oree",
  "https://temtem.wiki.gg/wiki/Zaobian",
  "https://temtem.wiki.gg/wiki/Chromeon",
  "https://temtem.wiki.gg/wiki/Koish",
  "https://temtem.wiki.gg/wiki/Arachnyte",
];

export const scrapeSpecieByUrl = (
  browser: Browser,
  url: string
): Promise<SpecieData> =>
  new Promise(async (resolve, reject) => {
    // page initialization:
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 0 });
    await page.waitForSelector(".infobox-table");

    // selectors:
    const nameSelector = ".infobox-table > tbody > tr:nth-child(1) > th";

    // gets the raw data from the selectors:
    const name = await page.$eval(nameSelector, (el) => el.textContent);

    // const traitMatchUps = await scrapeTypeMatchUps(page);

    // clean the raw data:
    const data: SpecieData = {
      name: clean(name),
      // matchups: traitMatchUps,
    };

    // resolve promise by sending back the data:
    resolve(data);
    await page.close();
  });

export const scrapeSpecieLinks = async (browser: Browser) => {
  // const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://temtem.wiki.gg/wiki/Temtem_(creatures)");
  await page.waitForSelector(".temtem-list");

  const linksSelector = ".temtem-list > tbody > tr > td:nth-of-type(2) > a";
  const specieLinks = await page.$$eval(linksSelector, (links) =>
    links.map((el) => (el as HTMLAnchorElement).href ?? "n/a")
  );

  await page.close();

  return specieLinks;

  // const data: SpecieData[] = [];
  // // specieLinks = specialUrls;
  // // specieLinks = specieLinks.slice(6, 8);
  // for (let link of specieLinks) {
  //   const d = await scrapeSpecieByUrl(browser,link);
  //   console.log(d);
  //   data.push(d);
  // }

  // await browser.close();
  // outputToFile(data, "../data.json");
  // console.timeEnd(timerLabel);
};

export const scrapeSpecies = async () => {
  const browser = await puppeteer.launch();

  let specieLinks = await scrapeSpecieLinks(browser);

  const data: SpecieData[] = [];
  // specieLinks = specialUrls;
  // specieLinks = specieLinks.slice(6, 8);
  for (let link of specieLinks) {
    console.log("------------------------");
    console.log("Scraping", link);
    const d = await scrapeSpecieByUrl(browser, link);
    console.log(d);
    data.push(d);
  }

  await browser.close();
  return data;
};

// scrapeSpecieLinks();

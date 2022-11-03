import puppeteer, { Browser, Page } from "puppeteer";

import { clean, cleanTemType } from "../utils/formatter";
import { TemType, TraitMatchUp } from "../utils/types";
import { getEmptyMatchUps } from "../utils/utils";
import { scrapeSpecieLinks } from "./scrape-species";

export const scrapeTypeMatchupsBySpecieUrl = async (
  browser: Browser,
  url: string
): Promise<TraitMatchUp[]> => {
  return new Promise(async (resolve, reject) => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 0 });
    await page.waitForSelector(".type-table");

    // GET RAW DATA IN TABLE FORMAT (header / rows)
    const matchupsRaw = await page.$$eval(
      ".type-table > tbody",
      (matchupTables) => {
        return matchupTables.map((el) => {
          const baseSelector = "tr:not(:last-child)"; // within each type table, select all the rows EXCEPT the last row

          const headers: NodeListOf<HTMLAnchorElement> = el.querySelectorAll(
            `tr:not(:last-child):nth-child(1) > th > a`
          );
          const firstRowData = el.querySelectorAll(
            `tr:not(:last-child):nth-child(2) > td`
          );
          const secondRowData = el.querySelectorAll(
            `tr:not(:last-child):nth-child(3) > td`
          );

          const noTraitsShown = firstRowData.length < 13;

          const headerData: string[] = ["trait"];
          const firstTraitData: string[] = noTraitsShown ? [""] : [];
          const secondTraitData: string[] = noTraitsShown ? [""] : [];

          headers.forEach((el) => {
            headerData.push(el.title);
          });

          firstRowData.forEach((el) => {
            firstTraitData.push(el.textContent ?? "");
          });

          secondRowData.forEach((el) => {
            secondTraitData.push(el.textContent ?? "");
          });

          return {
            header: headerData,
            rows: [firstTraitData, secondTraitData].filter(
              (v) => v.length > 12
            ),
          };
        });
      }
    );

    await page.close();

    // CLEAN RAW TABLE DATA:
    // by turning the various arrays into an object where
    // - the header array contains the keys to the object (ex: ["trait", "neutral", "wind", "fire", ...])
    // - each row array in rows contains the values for the key (ex: ["Thick Skin", "1/2", "2", "1", ...])
    // - order is important cus the raw data was scraped from a table row by row then column by column:
    //   the 1st element is always the "trait" in all arrays
    //   the 2nd element is always a certain type (ex: "neutral")
    //   the 3rd element is always another certain type (ex: "wind")
    //   ...etc
    const data = matchupsRaw.flatMap((el) => {
      // essentially removes the first element (which is the trait label and value):
      const h = el.header.slice(1);

      return el.rows.map((row) => {
        const trait = clean(row[0]);
        const mu = getEmptyMatchUps();
        row.slice(1).forEach((v, i) => {
          const key = cleanTemType(h[i]) as TemType;
          mu[key] = clean(v);
        });

        return { trait, matchupMap: mu };
      });
    });

    resolve(data);
  });
};

export const scrapeTypeMatchups = async () => {
  const browser = await puppeteer.launch();

  let specieLinks = await scrapeSpecieLinks(browser);

  const data: TraitMatchUp[] = [];
  for (let link of specieLinks) {
    console.log("-----------------------------------");
    console.log("Scraping", link);
    const d = await scrapeTypeMatchupsBySpecieUrl(browser, link);
    data.push(...d);
    console.log(d);
  }

  await browser.close();
  return data;
};

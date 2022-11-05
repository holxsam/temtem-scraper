import puppeteer, { Browser, Page } from "puppeteer";
import { clean } from "../utils/formatter";
interface Date {
  day: string;
  month: string;
}
interface Duration {
  year: string;
  startDate: Date;
  endDate: Date;
}
interface Freetem {
  date: Duration;
  rewards: {
    releases: string;
    reward: { quantity: string; type: string; imageUrl: string };
  }[];
}
interface SaiparkData {
  [key: string]: string;
}
interface Saipark {
  [key: string]: SaiparkData;
}

const freetemUrl = "https://temtem.wiki.gg/wiki/FreeTem!_Organization";
const saiparkUrl = "https://temtem.wiki.gg/wiki/Saipark#Area_1-0";

const cleanTemStrNum = (str: string): string => {
  const cleanStr = str.replace("%", "");
  return cleanStr.length < 4 && /^[A-Za-z0-9]*$/.test(cleanStr)
    ? cleanStr.replace("x", "")
    : cleanStr;
};

const cleanMonth = (str: string) => {
  const month = str.toLowerCase();
  const monthMatch: { [key: string]: string } = {
    jan: "january",
    feb: "february",
    mar: "march",
    apr: "april",
    may: "may",
    jun: "june",
    jul: "july",
    aug: "august",
    sep: "september",
    oct: "october",
    nov: "november",
    dec: "december",
  };
  return month in monthMatch ? monthMatch[month] : "n/a";
};

const cleanDate = (str: string) => {
  const dateArr = str.replace("- ", "").split(" ");
  const cleanDate = {
    year: dateArr[4],
    startDate: {
      day: dateArr[0],
      month: cleanMonth(dateArr[1]),
    },
    endDate: {
      day: dateArr[2],
      month: cleanMonth(dateArr[3]),
    },
  };

  return cleanDate;
};

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
        return {
          releases,
          reward: {
            quantity: rewardsModifier,
            type: rewardsType,
            imageUrl: "",
          },
        };
      });
    });

    const date = await page.$eval(
      "li.tocsection-4 > a > span.toctext",
      (el) => {
        return el.textContent;
      }
    );

    const data = {
      date: cleanDate(clean(date)),
      rewards: rewards.map((el) => {
        return {
          releases: clean(el.releases.replace("releases", "")),
          reward: {
            quantity: cleanTemStrNum(clean(el.reward.quantity)),
            type: clean(el.reward.type),
            imageUrl: el.reward.imageUrl,
          },
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

    const temSelector = "table#saipark-featured-temtem-history > tbody";
    const headerSelector =
      "table#saipark-featured-temtem-history > thead > tr > th";

    const headerInfo: (string | null)[] = await page.$$eval(
      headerSelector,
      (els) => {
        return els.map((el) => {
          return el.textContent;
        });
      }
    );

    headerInfo.forEach((header, index) => {
      const cleanHeader = clean(header).replace(".", "");
      headerInfo[index] = cleanHeader[0].toLowerCase() + cleanHeader.slice(1);
    });

    const temData = await page.$eval(
      temSelector,
      (el, headerInfo) => {
        const t1Selector = "tr:nth-child(1)";
        const t2Selector = "tr:nth-child(2)";

        const t1Data: SaiparkData = {};
        const t2Data: SaiparkData = {};

        headerInfo.forEach((header, index) => {
          t1Data[header as string] =
            el.querySelector(t1Selector + ` > td:nth-child(${index + 1})`)
              ?.textContent ?? "";
          t2Data[header as string] =
            el.querySelector(t2Selector + ` > td:nth-child(${index + 1})`)
              ?.textContent ?? "";
        });

        return { t1Data, t2Data };
      },
      headerInfo
    );

    headerInfo.forEach((header) => {
      temData.t1Data[header as string] = cleanTemStrNum(
        clean(temData.t1Data[header as string])
      );
      temData.t2Data[header as string] = cleanTemStrNum(
        clean(temData.t2Data[header as string])
      );
    });
    resolve(temData);
    await page.close();
  });
};

export const scrapeWeeklies = async () => {
  const browser = await puppeteer.launch();
  const saipark = await scrapeSaipark(browser, saiparkUrl);
  const freetem = await scrapeFreetem(browser, freetemUrl);

  await browser.close();

  return {
    saipark: { ...saipark, date: cleanDate(saipark.t1Data.availability) },
    freetem,
  };
};

import puppeteer from "puppeteer";
import { scrapeSpecies } from "./scripts/scrape-species";
import { scrapeTypeMatchups } from "./scripts/scrape-type-matchups";
import { outputToFile } from "./utils/utils";

const startScrape = async () => {
  // const specieData = await scrapeSpecies();
  // const typeMatchups = await scrapeTypeMatchups();
  // outputToFile(typeMatchups, "../output/type-matchups.json");
};

startScrape();

// ==UserScript==
// @name         Ao3 Work Object Class
// @namespace    https://github.com/lavatrout/Userscripts
// @version      0.0.01
// @description  Ao3 Work Object and Metadata Scraper
// @author       Lavatrout
// require			 https://raw.githubusercontent.com/lavatrout/Userscripts/refs/heads/v0.0.01/Ao3/Ao3_Work_Utils.js
// require			 https://raw.githubusercontent.com/lavatrout/Userscripts/refs/heads/v0.0.01/Ao3/Ao3_Work_Error.js
// ==/UserScript==

// define exports
export { Ao3_Work };

// import dependencies
import {
  getWorkId,
  getCurrentChapter,
  getTitle,
  getAuthor,
  getDatePosted,
  getNumChaptersTotal,
  getDateUpdated,
  getNumChaptersCompleted,
  getSummary,
  getIsCollected,
  getIsInSeries,
  getWordCount,
  calcIsHaitus,
  calcReadTime,
  getRemoteHTML,
} from "./Import_Aggragator.js";
import { Ao3_Work_Error } from "./Import_Aggragator.js";

/**
 * Ao3 Work Object Class
 * Used to represent an Ao3 Work and its associated metadata
 */
class Ao3_Work {
  /**
   * Create a new Ao3_Work Object
   * @param {string}  target_url          any url pointing to a chapter in the work
   * @param {int}     haitus_tolerance    number of days before declaring a work in haitus
   * @param {int}     read_speed          number words read per minute
   */
  constructor(target_url, haitus_tolerance, read_speed) {

    // TODO delete me
    console.log("Creating Ao3 Work Object...");

    try {
      // set up the top level pieces of data for the ao3 work
      this.readSpeed = read_speed;
      this.haitusTolerance = haitus_tolerance;
      this.currentUrl = target_url;
      this.currentDoc = document;
      this.currentChapter = getCurrentChapter(this.currentDoc);
      this.workId = getWorkId(this.currentUrl);
      this.baseUrl = "https://archiveofourown.org/works/" + this.workId;

      // initialize default pieces of metadata for the ao3 work
      this.baseDoc = null;
      this.title = "default_title";
      this.author = "default_author";
      this.summary = "default_summary";
      this.isOneShot = false;
      this.datePosted = "default_date_posted";
      this.dateUpdated = "default_date_updated";
      this.numChaptersCompleted = -111;
      this.numChaptersTotal = -111;
      this.isComplete = false;
      this.isHaitus = false;
      this.isCollected = false;
      this.isSeries = false;
      this.wordCount = -111;
      this.readTime = "default_read_time";
    }
    catch (e) {
      throw new Ao3_Work_Error("Error creating Ao3_Work Object", e);
    }

    // TODO delete me
    console.log("Ao3 Work Object Created.");

  }

  /**
   * populates the Ao3 Work Object with metadata scraped from AO3
   */
  async populateAo3MetaData() {

    // TODO delete me
    console.log("Start scraping Ao3 Meta Data...");

    // TODO add error handling using Ao3_Work_Error

    // ------------------------------------------------------------------------------------------------
    // --  Meta Data
    // ------------------------------------------------------------------------------------------------
    // --  Dependent on whether or not the work is a one shot, scrape the data
    // ------------------------------------------------------------------------------------------------

    // get the data available on every chapter of a work
    this.title = getTitle(this.currentDoc);
    this.author = getAuthor(this.currentDoc);
    this.datePosted = getDatePosted(this.currentDoc);

    // check the total number of chapters to see if the work is a one shot or not
    this.numChaptersTotal = getNumChaptersTotal(this.currentDoc);

    // if the work IS a one shot...
    if (this.numChaptersTotal == 1) {
      this.isOneShot = true;
      this.currentChapter = 1;
      this.baseDoc = this.currentDoc;
      this.dateUpdated = this.datePosted;
      this.numChaptersCompleted = 1;
      this.isComplete = true;
    }

    // if the work is NOT a one shot...
    else {
      this.isOneShot = false;
      this.currentChapter = getCurrentChapter(this.currentDoc);

      // if we are already on the first chapter of the work, then there is no point in requesting
      // the base url. if we are not on the first chapter, then we have to request the base url
      // so that the information available on the base is available to the scraper
      if (this.currentChapter == 1) {
        this.baseDoc = this.currentDoc;
      }
      else {
        this.baseDoc = await getRemoteHTML(this.baseUrl);
      }

      this.dateUpdated = getDateUpdated(this.baseDoc);
      this.numChaptersCompleted = getNumChaptersCompleted(this.baseDoc);
      this.isComplete = (this.numChaptersCompleted == this.numChaptersTotal);
    }

    // get the data available only on the first chapter of a work
    this.summary = getSummary(this.baseDoc);
    this.isCollected = getIsCollected(this.baseDoc);
    this.isSeries = getIsInSeries(this.baseDoc);
    this.wordCount = getWordCount(this.baseDoc);

    // TODO delete me
    console.log("Done scraping Ao3 Meta Data.");

    // ------------------------------------------------------------------------------------------------
    // --  Meta Data Scraped
    // ------------------------------------------------------------------------------------------------
    // --  Calculate additional stats
    // ------------------------------------------------------------------------------------------------

    // if the work IS complete
    if (this.isComplete) {
      this.isHaitus = false;
    }
    // if the work is NOT complete
    else {
      this.isHaitus = calcIsHaitus(this.dateUpdated, this.haitusTolerance);
    }

    // calculate estimated read time (in minutes)
    this.readTime = calcReadTime(this.wordCount, this.readSpeed);
  }
}
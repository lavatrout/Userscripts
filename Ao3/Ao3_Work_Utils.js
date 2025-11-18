// ==UserScript==
// @name         Ao3 Work Utilities
// @namespace    https://github.com/lavatrout/Userscripts
// @version      0.0.01
// @description  Utility functions for AO3 works.
// @author       Lavatrout
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @require      https://raw.githubusercontent.com/lavatrout/Userscripts/refs/heads/v0.0.01/Ao3/Ao3_Work_Error.js
// ==/UserScript== 

/**
   * Returns the HTML DOM document of a given URL.
   * @param {string} target_url  The URL of the remote page to get.
   * @returns {Document} The DOM document of the remote URL.
   */
async function getRemoteHTML(target_url) {
    // TODO delete me
    console.log("Fetching Remote HTML Document...");

    // poll GM targetWork until it is deleted
    await GM.deleteValue("targetWork");
    while (await GM.getValue("targetWork") != null) {
        // do nothing
    }

    // Send the GET request for a remote page
    await GM.xmlHttpRequest({
        method: "GET",
        url: target_url,
        headers: {
            "view_adult": 'true'
        },
        onload: (response) => {
            // Inject responseXML into existing Object (only appropriate for XML content).
            if (!response.responseXML) {
                // store the target work in GM
                GM.setValue("targetWork", response.responseText);
            }
        }
    });

    // poll GM targetWork for data
    while (await GM.getValue("targetWork") == null) {
        // do nothing
    }
    let targetDoc = new DOMParser().parseFromString(await GM.getValue("targetWork"), "text/html");

    // poll GM targetWork until it is deleted
    await GM.deleteValue("targetWork");
    while (await GM.getValue("targetWork") != null) {
        // do nothing
    }

    return targetDoc;
}

/**
   * Returns the work id of the given ao3 url.
   * @param {string} target_url The URL of any chapter of the ao3 work.
   * @returns {string} The unique work id used by ao3.
   */
function getWorkId(target_url) {
    var workId = "";
    try {
        workId = (target_url + "/").match(/\/works\/(\d+)[\/\#]/i)[1];
    }
    catch (e) {
        workId = "error";
        throw new Ao3_Work_Error("Error getting AO3 Work ID. Input URL: " + target_url, e);
    }
    return workId;
}

/**
 * Returns the title of the given ao3 work.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {string} The title of the ao3 work.
 */
function getTitle(target_work) {
    var title = "";
    try {
        title = target_work.querySelector("#workskin > .preface .title.heading").textContent.trim();
    }
    catch (e) {
        title = "error";
        throw new Ao3_Work_Error("Error getting AO3 Work Title.", e);
    }
    return title.replace(/\s+/g, " ").trim();
}

/**
  * Returns the author of the given ao3 work.
  * @param {Document} target_work DOM document of the first chapter of the ao3 work.
  * @returns {string} The author of the ao3 work.
  */
function getAuthor(target_work) {
    var author = "";
    try {
        author = target_work.querySelector("#workskin > .preface .byline").textContent.trim();
    }
    catch (e) {
        author = "error";
        throw new Ao3_Work_Error("Error getting AO3 Work Author.", e);
    }
    return author.replace(/\s+/g, " ").trim();
}

/**
  * Returns the summary of the given ao3 work.
  * @param {Document} target_work DOM document of the first chapter of the ao3 work.
  * @returns {string} The summary of the ao3 work.
  */
function getSummary(target_work) {
    var summary = "";
    try {
        summary = target_work.getElementsByClassName("summary")[0]
            .getElementsByClassName("userstuff")[0].innerText;
    }
    catch (e) {
        summary = "error";
        throw new Ao3_Work_Error("Error getting AO3 Work Summary.", e);
    }
    return summary.replace(/\s+/g, " ").trim();
}

/**
 * Returns the total number of chapters in the given ao3 work.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {number} The total number of chapters (-1 for unknown).
 */
function getNumChaptersTotal(target_work) {
    var chapStr = "";
    var totalChaps = -999;

    try {
        // returns the chapter string "x/y" where y is the total number of chapters
        chapStr = target_work.querySelector(
            "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.chapters").innerText;
        chapStr = chapStr.match(/\d+\/(.+)/i)[1];

        // if the total number of chapters is unknown (or ?), then set the total chapters to -1
        if (chapStr == "?") {
            totalChaps = -1;
        }
        // else convert the string to a number
        else {
            totalChaps = Number(chapStr.replace(/[, ]/g, "").trim());
        }
    }
    catch (e) {
        totalChaps = -999;
        throw new Ao3_Work_Error("Error getting AO3 Work Total Number of Chapters.", e);
    }

    return totalChaps;
}

/**
 * Returns the number of completed chapters in the given ao3 work.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {number} The number of completed chapters.
 */
function getNumChaptersCompleted(target_work) {
    var numChaps = -999;
    var chapStr = "";

    try {
        // returns the chapter string "x/y" where x is the number of complete chapters
        chapStr = target_work.querySelector(
            "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.chapters").innerText;
        // extract the number of completed chapters from the string
        chapStr = chapStr.match(/(\d+)\/.+/i)[1];
        numChaps = Number(chapStr.replace(/[, ]/g, "").trim());
    }
    catch (e) {
        numChaps = -999;
        throw new Ao3_Work_Error("Error getting AO3 Work Number of Completed Chapters.", e);
    }

    return numChaps;
}

/**
 * Returns the original publishing date of the given ao3 work.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {string} The original publishing date of the work.
 */
function getDatePosted(target_work) {
    var date = "";

    try {
        // returns the date string yyyy-mm-dd
        date = target_work.querySelector(
            "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.published").innerText;
    }
    catch (e) {
        date = "error";
        throw new Ao3_Work_Error("Error getting AO3 Work Date Posted.", e);
    }

    return date.replace(/\s+/g, " ").trim();
}

/**
 * Returns true if the work is part of at least one collection.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {boolean} True if the work is part of at least one collection.
 */
function getIsCollected(target_work) {
    var isCollected = false;

    try {
        // returns true if there is a collections element in the DOM
        isCollected = (target_work.querySelector("#main div.wrapper dl.work.meta.group dd.collections") != null);
    }
    catch (e) {
        isCollected = false;
        throw new Ao3_Work_Error("Error getting if AO3 Work is in a Collection(s).", e);
    }

    return isCollected;
}

/**
 * Returns true if the work is part of a series.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {boolean} True if the work is part of a series.
 */
function getIsInSeries(target_work) {
    var isInSeries = false;

    try {
        // returns true if there is a series element in the DOM
        isInSeries = (target_work.querySelector("#main div.wrapper dl.work.meta.group dd.series") != null);
    }
    catch (e) {
        isInSeries = false;
        throw new Ao3_Work_Error("Error getting if AO3 Work is in a Series.", e);
    }

    return isInSeries;
}

/**
 * Returns the word count of the given ao3 work.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {number} The word count of the work.
 */
function getWordCount(target_work) {
    var wordCount = -999;
    var wordStr = "";

    try {
        // returns the chapter string "x/y" where x is the number of complete chapters
        wordStr = target_work.querySelector(
            "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.words").innerText;
        wordCount = Number(wordStr.replace(/[, ]/g, "").trim());
    }
    catch (e) {
        wordCount = -999;
        throw new Ao3_Work_Error("Error getting AO3 Work Word Count.", e);
    }

    return wordCount;
}

/**
 * Returns the date the given ao3 work was last updated.
 * @param {Document} target_work DOM document of the first chapter of the ao3 work.
 * @returns {string} The date the work was last updated.
 */
function getDateUpdated(target_work) {
    var date = "";

    try {
        // returns the date string yyyy-mm-dd
        date = target_work.querySelector(
            "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.updated").innerText;
    }
    catch (e) {
        date = "error";
        throw new Ao3_Work_Error("Error getting the date that the AO3 Work was last updated.", e);
    }

    return date.replace(/\s+/g, " ").trim();
}

/**
 * Returns true if the work has not been updated in a long time.
 * @param {string} update_date The date the work was last updated. Expected format: "yyyy-mm-dd".
 * @param {number} day_tolerance Number of days before declaring a work in haitus.
 * @returns {boolean} True if the work was last updated longer ago than the tolerance allows.
 */
function calcIsHaitus(update_date, day_tolerance) {
    var isHaitus = false;

    // TODO consider more accurate date difference calculation
    try {
        const currentDate = new Date();
        var dYear = 0;
        var dMonth = 0;
        var dDay = 0;

        // create date object from update_date string
        const updatedDate = new Date(update_date);

        // calculate difference in years, months, and days
        dYear = currentDate.getFullYear() - updatedDate.getFullYear();
        dMonth = currentDate.getMonth() - updatedDate.getMonth();
        dDay = currentDate.getDay() - updatedDate.getDay();

        // estimate difference in days assuming each year is 364 days and each month is 30 days
        dDay = dDay + (dMonth * 30) + (dYear * 364);

        isHaitus = (dDay >= day_tolerance);
    }
    catch (e) {
        isHaitus = false;
        throw new Ao3_Work_Error("Error calculating if the work is in haitus.", e);
    }

    return isHaitus;
}

/**
 * Calculates estimated read time (in minutes) for the given word count and read speed.
 * @param {number} word_count The word count of the ao3 work.
 * @param {number} read_speed The number of words read per minute.
 * @returns The estimated time (in minutes) required to read the work.
 * @throws Will throw an error if read_speed is less than or equal to zero.
 */
function calcReadTime(word_count, read_speed) {
    var readTime = -999;

    try {
        if (read_speed <= 0) {
            throw ("Read speed must be greater than zero. Input read speed: " + read_speed);
        }
        readTime = word_count / read_speed;
    }
    catch (e) {
        readTime = -999;
        throw new Ao3_Work_Error("Error calculating the estimated read time.", e);
    }

    return readTime;
}

/**
 * Returns the current chapter number of the given ao3 work.
 * @param {Document} target_work DOM document of the current chapter of the ao3 work.
 * @returns {number} The current chapter number.
 */
function getCurrentChapter(target_work) {
    var chap = -999;
    var chapStr = "";

    try {
        // get the current chapter string in the format chapter-x where x is the current chapter number
        chapStr = target_work.querySelector("#chapters div.chapter").getAttribute("id");
        chapStr = chapStr.match(/chapter-(.*)/i)[1];
        chap = Number(chapStr.replace(/[, ]/g, "").trim());
    }
    catch (e) {
        chap = -999;
        throw new Ao3_Work_Error("Error getting the chapter number that the user is currently on.", e);
    }

    return chap;
}

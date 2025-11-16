/**
 * 
 */

/**
 * Create a new Ao3Work Object
 * @param {string}  target_url          any url pointing to a chapter in the work
 * @param {int}     haitus_tolerance    number of days before declaring a work in haitus
 * @param {int}     read_speed          number words read per minute
 */
function Ao3_Work(target_url, haitus_tolerance, read_speed){  
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
  this.numChaptersCompleted = -999;
  this.numChaptersTotal = -999;
  this.isComplete = false;
  this.isHaitus = false;
  this.isCollected = false;
  this.isSeries = false;
  this.wordCount = -999;
  this.readTime = "default_read_time";
}

/****************************************************************************************************
// ao3MetaDataScraper retrieves the metadata of an ao3 work
// --------------------------------------------------------------------------------------------------
// input ao3_work ao3_work ao3_work object to edit
****************************************************************************************************/
async function ao3MetaDataScraper(ao3_work){
 
  console.log("Running Metadata Scraper...");
 
  // ------------------------------------------------------------------------------------------------
  // --  Meta Data
  // ------------------------------------------------------------------------------------------------
  // --  Dependent on whether or not the work is a one shot, scrape the data
  // ------------------------------------------------------------------------------------------------
 
  // get the data available on every chapter of a work
  ao3_work.title = getTitle(ao3_work.currentDoc);
  ao3_work.author = getAuthor(ao3_work.currentDoc);
  ao3_work.datePosted = getDatePosted(ao3_work.currentDoc);
 
  // check the total number of chapters to see if the work is a one shot or not
  ao3_work.numChaptersTotal = getNumChaptersTotal(ao3_work.currentDoc);
 
  // if the work IS a one shot...
  if (ao3_work.numChaptersTotal == 1){
    ao3_work.isOneShot = true;
    ao3_work.currentChapter = 1;
    ao3_work.baseDoc = ao3_work.currentDoc;
    ao3_work.dateUpdated = ao3_work.datePosted;
    ao3_work.numChaptersCompleted = 1;
    ao3_work.isComplete = true;
  }
 
  // if the work is NOT a one shot...
  else {
    ao3_work.isOneShot = false;
    ao3_work.currentChapter = getCurrentChapter(ao3_work.currentDoc);
   
    // if we are already on the first chapter of the work, then there is no point in requesting
    // the base url. if we are not on the first chapter, then we have to request the base url
    // so that the information available on the base is available to the scraper
    if (ao3_work.currentChapter == 1){
      ao3_work.baseDoc = ao3_work.currentDoc;
    }
    else {
      ao3_work.baseDoc = await getRemoteHTML(ao3_work.baseUrl);
    }
   
    ao3_work.dateUpdated = getDateUpdated(ao3_work.baseDoc);
    ao3_work.numChaptersCompleted = getNumChaptersCompleted(ao3_work.baseDoc);
    ao3_work.isComplete = (ao3_work.numChaptersCompleted == ao3_work.numChaptersTotal);
  }

  // get the data available only on the first chapter of a work
  ao3_work.summary = getSummary(ao3_work.baseDoc);
  ao3_work.isCollected = getIsCollected(ao3_work.baseDoc);
  ao3_work.isSeries = getIsInSeries(ao3_work.baseDoc);
  ao3_work.wordCount = getWordCount(ao3_work.baseDoc);

  // ------------------------------------------------------------------------------------------------
  // --  Meta Data Scraped
  // ------------------------------------------------------------------------------------------------
  // --  Calculate additional stats
  // ------------------------------------------------------------------------------------------------
 
  // if the work IS complete
  if(ao3_work.isComplete){
    ao3_work.isHaitus = false;
  }
  // if the work is NOT complete
  else {
    ao3_work.isHaitus = calcIsHaitus(ao3_work.dateUpdated, ao3_work.haitusTolerance);
  }
 
  // calculate estimated read time (in minutes)
  ao3_work.readTime = calcReadTime(ao3_work.wordCount, ao3_work.readSpeed);
 
  console.log("Metadata Scraper Complete.");
}

/****************************************************************************************************
// getRemoteHTML retrieves the HTML of the target url
// --------------------------------------------------------------------------------------------------
// input target_url URL of the HTML desired
// return targetDoc DOM document containing the HTML
****************************************************************************************************/
async function getRemoteHTML(target_url) {
  // poll GM targetWork until it is deleted
  await GM.deleteValue("targetWork");
  while(await GM.getValue("targetWork") != null){
    // do nothing
  }
 
  // Send the GET request for a remote page
await GM.xmlHttpRequest({
    method: "GET",
    url: target_url,
    headers: {
    "view_adult": 'true'
    },
    onload: function(response) {
      // Inject responseXML into existing Object (only appropriate for XML content).
      if (!response.responseXML) {
        // store the target work in GM
        GM.setValue("targetWork", response.responseText);
      }
    }
  });

  // poll GM targetWork for data
  while(await GM.getValue("targetWork") == null){
    // do nothing
  }
  let targetDoc = new DOMParser().parseFromString(await GM.getValue("targetWork"), "text/html");
 
  // poll GM targetWork until it is deleted
  await GM.deleteValue("targetWork");
  while(await GM.getValue("targetWork") != null){
    // do nothing
  }

  return await targetDoc;
}

/****************************************************************************************************
// getWorkId gets the work id of the ao3 url
// --------------------------------------------------------------------------------------------------
// input target_url URL of any chapter of the ao3 work
// return workId the unique work id used by ao3
****************************************************************************************************/
function getWorkId(target_url) {
  return (target_url + "/").match(/\/works\/(\d+)[\/\#]/i) [1];
}

/****************************************************************************************************
// getTitle finds the title of the ao3 work
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return title the work title
****************************************************************************************************/
function getTitle(target_work) {
  var title = "";
  title = target_work.getElementsByClassName("title heading")[0].innerHTML.trim();
  return title.replace(/\s+/g, " ").trim();
}

/****************************************************************************************************
// getAuthor finds the auther of the ao3 work
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return author the work author
****************************************************************************************************/
function getAuthor(target_work) {
  var author = "";
  author = target_work.querySelector("#workskin > .preface .byline").textContent.trim();
  return author.replace(/\s+/g, " ").trim();
}

/****************************************************************************************************
// getSummary finds the summary of the ao3 work
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return summary the work summary
****************************************************************************************************/
function getSummary(target_work) {
  var summary = "";
  summary = target_work.getElementsByClassName("summary")[0].getElementsByClassName("userstuff")[0].innerText;
  return summary.replace(/\s+/g, " ").trim();
}

/****************************************************************************************************
// getNumChaptersTotal finds the total number of chapters
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return totalChaps the total number of chapters (-1 for unknown)
****************************************************************************************************/
function getNumChaptersTotal(target_work) {
  var chapStr = "";
  var totalChaps = -999;
 
  // returns the chapter string "x/y" where y is the total number of chapters
  chapStr = target_work.querySelector(
    "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.chapters").innerText;
  chapStr = chapStr.match(/\d+\/(.+)/i)[1];
 
  // if the total number of chapters is unknown (or ?), then set the total chapters to -1
  if(chapStr == "?"){
    totalChaps = -1;
  }
  // else convert the string to a number
  else {
    totalChaps = Number(chapStr.replace(/[, ]/g, "").trim());
  }
 
  return totalChaps;
}

/****************************************************************************************************
// getNumChaptersCompleted finds the number of complete chapters
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return numChaps the total number of completed chapters
****************************************************************************************************/
function getNumChaptersCompleted(target_work) {
  var numChaps = -999;
  var chapStr = "";
 
  // returns the chapter string "x/y" where x is the number of complete chapters
  chapStr = target_work.querySelector(
    "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.chapters").innerText;
  chapStr = chapStr.match(/(\d+)\/.+/i)[1];
 
  numChaps = Number(chapStr.replace(/[, ]/g, "").trim());

  return numChaps;
}

/****************************************************************************************************
// getDatePosted finds the number of complete chapters
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return date the original publishing date of the work
****************************************************************************************************/
function getDatePosted(target_work) {
  var date = "";
 
  // returns the date string yyyy-mm-dd
  date = target_work.querySelector(
    "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.published").innerText;

  return date.replace(/\s+/g, " ").trim();
}

/****************************************************************************************************
// getIsCollected finds if the work is part of a collection
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return isCollected true if the work is part of at least one collection
****************************************************************************************************/
function getIsCollected(target_work) {
  var colElem = null;
 
  // returns the collection element
  colElem = target_work.querySelector("#main div.wrapper dl.work.meta.group dd.collections");

  return (colElem != null);
}

/****************************************************************************************************
// getIsInSeries finds if the work is part of a series
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return isSeries true if the work is part of a series
****************************************************************************************************/
function getIsInSeries(target_work) {
  var serElem = null;
 
  // returns the series element
  serElem = target_work.querySelector("#main div.wrapper dl.work.meta.group dd.series");

  return (serElem != null);
}

/****************************************************************************************************
// getWordCount finds the current word count of a work
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return wordCount the word count of the work
*
***************************************************************************************************/



/**
 * 
 * @param {*} target_work 
 * @returns 
 */
function getWordCount(target_work) {
  var wordCount = -999;
  var wordStr = "";

  // returns the chapter string "x/y" where x is the number of complete chapters
  wordStr = target_work.querySelector(
    "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.words").innerText;
  wordCount = Number(wordStr.replace(/[, ]/g, "").trim());
 
  return wordCount;
}

/****************************************************************************************************
// getDateUpdated finds the current word count of a work
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the first chapter of the ao3 work
// return date the date the work was last updated
****************************************************************************************************/
function getDateUpdated(target_work) {
  var date = "";
 
  // returns the date string yyyy-mm-dd
  date = target_work.querySelector(
    "#main div.wrapper dl.work.meta.group dd.stats dl.stats dd.status").innerText;

  return date.replace(/\s+/g, " ").trim();
}

/****************************************************************************************************
// getIsHaitus finds if the work has not been updated in a long time
// --------------------------------------------------------------------------------------------------
// input update_date the date that the work was last updated
// input day_tolerance number of days before declaring a work in haitus
// return isHaitus true if the work was last updated longer ago than the tolerance allows
****************************************************************************************************/
function calcIsHaitus(update_date, day_tolerance) {
  var isHaitus = false;
 
  const updatedDate = new Date(update_date);
  const currentDate = new Date();
 
  var dYear = currentDate.getFullYear() - updatedDate.getFullYear();
  var dMonth = currentDate.getMonth() - updatedDate.getMonth();
  var dDay = currentDate.getDay() - updatedDate.getDay();
 
  // estimate difference in days assuming each year is 364 days and each month is 30 days
  dDay = dDay + (dMonth * 30) + (dYear * 364);

  return (dDay >= day_tolerance);
}

/****************************************************************************************************
// calcReadTime calculates an estimated amount of time to read a work
// --------------------------------------------------------------------------------------------------
// input word_count the word count of the ao3 work
// input read_speed words read per minute
// return readTime the estimated minutes required to read a work
****************************************************************************************************/
function calcReadTime(word_count, read_speed) {
  var readTime = -999;
 
  readTime = word_count / read_speed;

  return readTime;
}

/****************************************************************************************************
// getCurrentChapter finds the current word count of a work
// --------------------------------------------------------------------------------------------------
// input target_work DOM document of the current chapter of the ao3 work
// return chap the chapter that the reader is currently on
****************************************************************************************************/
function getCurrentChapter(target_work) {
  var chap = -999;
  var chapStr = "";
 
  try {
    // get the current chapter string in the format chapter-x where x is the current chapter number
    chapStr = target_work.querySelector("#chapters div.chapter").getAttribute("id");
    chapStr = chapStr.match(/chapter-(.*)/i)[1];

    chap = Number(chapStr.replace(/[, ]/g, "").trim());
  }
  catch {
    chap = -1;
  }

  return chap;
}
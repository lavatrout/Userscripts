// ==UserScript==
// @name      AO3 Bookmark Autofill
// @author    Lavatrout
// @version   0.01
// @run-at    document-end
// @namespace https://github.com/lavatrout/Userscripts
// @include   */archiveofourown.org/*works/*
// @require   "https://github.com/lavatrout/Userscripts/tree/c51018e8f5778fc493f33d221fa78da9678b9a6a/Ao3/Ao3_Work.js";
// ==/UserScript==

(async () => {
  console.log("Running GreaseMonkey Script: " + GM.info.script.name + " ...");

  window.onload = async function () {
    const ao3Work = new Ao3_Work(document.URL, 364, 200);
    // const ao3Work = new Ao3_Work(
    //   "https://archiveofourown.org/works/45181255/chapters/113661682",
    //   364,
    //   200
    // );
    await ao3Work.ao3MetaDataScraper();
    console.log(ao3Work);
  };
})();

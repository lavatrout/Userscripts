// ==UserScript==
// @name      Ao3 Test Driver
// @author    Lavatrout
// @version   0.0.01
// @run-at    document-end
// @namespace https://github.com/lavatrout/Userscripts
// @include   */archiveofourown.org/*works/*
// @require   "https://github.com/lavatrout/Userscripts/raw/refs/heads/v0.0.01/Ao3/Ao3_Work.js";
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

// ==UserScript==
// @name      AO3 Bookmark Autofill
// @author    Lavatrout
// @version   0.01
// @run-at    document-end
// @include   */archiveofourown.org/*works/*
// @require   https://
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

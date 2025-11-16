// ==UserScript==
// @name AO3 Bookmark Autofill
// @author Lavatrout
// @version 0.01
// @grant GM.xmlHttpRequest
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.deleteValue
// @grant GM.listValues
// @grant GM.info
// @run-at    document-end
// @include   */archiveofourown.org/*works/*
//
// ==/UserScript==

// =============================================================================================
// =============================================================================================
// == MAIN
// =============================================================================================
// =============================================================================================
(async () => {
  console.log("Running GreaseMonkey Script: " + GM.info.script.name + " ...");
 
    window.onload = async function(){
    
        const ao3Work = new ao3_work(document.URL, 364, 200);
        await ao3MetaDataScraper(ao3Work);
        console.log(ao3Work);

    };
 
})();
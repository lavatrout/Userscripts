/**
 * Used to aggragate all imports from the common directory in one place
 */

export { Ao3_Work } from "./Ao3_Work.js";
export { Ao3_Work_Error } from "./Ao3_Work_Error.js";
export {
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
} from "./Ao3_Work_Utils.js";
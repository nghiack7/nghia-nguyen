import {
  getSiteMetricsRow,
  getSiteStats,
  isGithubStarCacheStale,
  touchSiteGithubStarsChecked,
  updateSiteGithubStars
} from "./db.js";
import { fetchGithubStarCount } from "./github.js";

async function getHydratedSiteStats(db, { visitorToken, fetcher = fetch } = {}) {
  let metrics = await getSiteMetricsRow(db);

  if (isGithubStarCacheStale(metrics)) {
    try {
      const starCount = await fetchGithubStarCount(fetcher);
      await updateSiteGithubStars(db, { starCount });
    } catch {
      await touchSiteGithubStarsChecked(db);
      // Keep local engagement stats available even if GitHub rate limits or times out.
    }
  }

  return getSiteStats(db, { visitorToken });
}

export { getHydratedSiteStats };

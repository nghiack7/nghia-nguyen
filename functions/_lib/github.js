const GITHUB_USER = "nghiack7";
const MAX_REPO_PAGES = 5;

async function fetchGithubStarCount(fetcher = fetch) {
  let total = 0;

  for (let page = 1; page <= MAX_REPO_PAGES; page++) {
    const response = await fetcher(
      `https://api.github.com/users/${GITHUB_USER}/repos?type=owner&per_page=100&page=${page}`,
      {
        headers: {
          accept: "application/vnd.github+json",
          "user-agent": "nghia-nguyen-portfolio"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`github repos request failed with status ${response.status}`);
    }

    const repos = await response.json();
    if (!Array.isArray(repos)) {
      throw new Error("github repos response was not a list");
    }

    total += repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0);

    if (repos.length < 100) {
      break;
    }
  }

  return total;
}

export { fetchGithubStarCount };

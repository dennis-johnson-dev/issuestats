const lastPageRegex = /\&page=(\d+)/;

export const buildRemaingPageLinks = (owner, repo, lastPage) => {
  let links = [];
  for (let i = lastPage; i > 1; i--) {
    links.push({
      headers: {
        "Authorization": `token ${process.env.ISSUE_STATS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "user-agent": "IssueStats"
      },
      method: 'GET',
      url: `https://api.github.com/repos/${owner}/${repo}/issues?page=${i}&per_page=100&sort=created&state=all`
    });
  }

  return links;
};
export const getLastPageLink = (link) => {
  const links = link.split(', ');
  const lastPage = links[links.length - 1].match(lastPageRegex);
  return lastPage[1];
};

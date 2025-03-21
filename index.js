const core = require('@actions/core');
const github = require('@actions/github');

const main = async () => {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { required: true });
    const token = core.getInput('token', { required: true });
    const ref = core.getInput('ref', { required: true });

    const pullRequestNumber = parseInt(pr_number, 10);

    console.log("owner", owner);
    console.log("repo", repo);
    console.log("pr_number", pr_number);
    console.log("token", token);
    console.log("ref", ref);

    /**
     * Now we need to create an instance of Octokit which will use to call
     * GitHub's REST API endpoints.
     * We will pass the token as an argument to the constructor. This token
     * will be used to authenticate our requests.
     * You can find all the information about how to use Octokit here:
     * https://octokit.github.io/rest.js/v18
     **/
    // console.log("octokit", octokit);

    const octokit = new github.getOctokit(token);
    // Get the list of tags sorted by date
    // const branches = await octokit.paginate(octokit.rest.repos.listBranches, { owner, repo, per_page: 100 })
    // console.log("branches", branches);
    let prCommits = [];
    let tagsForRepo = [];
    let tagTable = "";

    try {
        const { data: repoTags } = await octokit.rest.repos.listTags({ owner, repo });
        const { data: commits} = await octokit.rest.pulls.listCommits({ owner, repo, pull_number: pullRequestNumber });
        console.log("repoTags", repoTags);
        // console.log("commits", commits);

        const tagsWithDates = await Promise.all(repoTags.map(async (tag) => {
            const commitData = await octokit.request(`GET /repos/{owner}/{repo}/commits/{commit_sha}`, {
                owner,
                repo,
                commit_sha: tag.commit.sha
            });

            return {
                name: tag.name,
                sha: tag.commit.sha,
                date: commitData.data.commit.author.date
            };
        }));
        tagsWithDates.sort((a, b) => new Date(b.date) - new Date(a.date));
        tagsForRepo = tagsWithDates.map((tag) => {
            const tagCommit = commits.find((commit) => commit.sha === tag.sha);
            return {
                ...tag,
                isInPullRequest: !!tagCommit,
                date: tag.date
            };
        });
        tagTable = tagsForRepo.reduce((acc, tag, ind) => {
            if (tag.isInPullRequest) {
                return acc + `| (new) **${tag.name}** | **${tag.date}** |\n`;
            }
            return acc + `| ${tag.name} | ${tag.commit.author.date} |\n`;
        }, "| Release Tag | Date Tagged |\n|-----|---------------|\n");
    } catch (e) {
        console.error('Error fetching tags for pull request:', e.message);
        throw e;
    }

    console.log('Tags associated with the repo:', tagTable);

    async function leaveComment(owner, repo, pullNumber, commentBody) {
        try {
            // Add a comment to the pull request
            const response = await octokit.rest.issues.createComment({
                owner: owner,          // Repository owner username or organization name
                repo: repo,            // Repository name
                issue_number: pullNumber, // Pull request number (treated as issue number)
                body: commentBody      // The comment to leave on the pull request
            });

            console.log("Comment created: ", response.data.html_url);
        } catch (error) {
            console.error("Error creating comment: ", error);
        }
    }

    // Example usage:
    await leaveComment(
        owner,             // Repository owner
        repo,         // Repository name
        pullRequestNumber,                    // Pull request number
        tagTable
    );
}

main();
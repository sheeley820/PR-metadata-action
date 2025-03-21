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
    let prCommitShas = [];
    let tagsForPullRequest = [];

    try {
        const { data: tags } = await octokit.rest.repos.listTags({ owner, repo });
        const { data: commits} = await octokit.rest.pulls.listCommits({ owner, repo, pull_number: pullRequestNumber });
        console.log("tags", tags);
        console.log("commits", commits);

        prCommitShas = commits?.map((commit) => commit.sha);
        tagsForPullRequest = tags.filter((tag) =>
            prCommitShas.includes(tag.commit.sha)
        );
    } catch (e) {
        console.error('Error fetching tags for pull request:', e.message);
        throw e;
    }

    console.log('Tags associated with the pull request:', tagsForPullRequest);
}

main();
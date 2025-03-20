const core = require('@actions/core');
const github = require('@actions/github');

const main = async () => {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { required: true });
    const token = core.getInput('token', { required: true });
    const ref = core.getInput('ref', { required: true });

    /**
     * Now we need to create an instance of Octokit which will use to call
     * GitHub's REST API endpoints.
     * We will pass the token as an argument to the constructor. This token
     * will be used to authenticate our requests.
     * You can find all the information about how to use Octokit here:
     * https://octokit.github.io/rest.js/v18
     **/
    const octokit = new github.getOctokit(token);
    // Get the list of tags sorted by date

    const branches = await this.octokit.paginate(this.octokit.rest.repos.listBranches, { owner, repo, per_page: 100 })
    console.log("branches", branches);
    // const { data: tags } = await octokit.repos.listTags({ owner, repo });
    // console.log("data", data);
    // let commits = [];
    // let currentTag;
    // let previousTag;
    //
    // if (tags.length < 2) {
    //     console.log("Not enough tags to compare.");
    //     commits = this.getCommits(owner, repo, ref);
    //     currentTag = tags[0].name;
    //     previousTag = commits[0].name;
    // } else {
    //     currentTag = tags[0].name;
    //     previousTag = tags[1].name;
    // }
    //
    // console.log(`Comparing commits between ${previousTag} and ${currentTag}`);
    //
    // // Get the commits between the two tags
    // const { data: comparison } = await octokit.repos.compareCommits({
    //     owner,
    //     repo,
    //     base: previousTag,
    //     head: currentTag
    // });
    // console.log("commits", commits);
    //
    // console.log("Commits:", comparison.commits.map(commit => commit.commit.message));
}

async function getBranches(owner, repo) {
    if (!this.octokit) throw new Error('No API key found')

    const branches = await this.octokit.paginate(this.octokit.rest.repos.listBranches, { owner, repo, per_page: 100 })

    return branches.map(branch => branch.name)
}

async function getCommits(owner, repo, ref) {
    if (!this.octokit) throw new Error('No API key found')

    const commits = await this.octokit.paginate(this.octokit.rest.repos.listCommits, { owner, repo, sha: ref || 'main', per_page: 100 })
        
    return commits
}

async function getTags(owner, repo) {
    if (!this.octokit) throw new Error('No API key found')

    const tags = await this.octokit.paginate(this.octokit.rest.repos.listTags, { owner, repo, per_page: 100 })

    return tags.map(tag => tag.name)
}

async function getFile(owner, repo, path, ref) {
    if (!this.octokit) throw new Error('No API key found')

    const { data } = await this.octokit.request(`GET /repos/${owner}/${repo}/contents/${path}?ref=${ref || 'main'}`)

    return Buffer.from(data.content, 'base64').toString()
}

async function  getYAML(owner, repo, path, ref) {
    if (!this.octokit) throw new Error('No API key found')

    return YAML.parse(await this.getFile(owner, repo, path, ref))
}

// Call the main function to run the action
main();
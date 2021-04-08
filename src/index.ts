import assert from "assert";
import { Toolkit } from "actions-toolkit";

type Inputs = {
  require_issue: string;
  skip_authors: string;
  title_prefixes: string;
};

Toolkit.run<Inputs>(
  async (tools) => {
    const { context, github, inputs } = tools;

    let requireIssue = false;
    if (inputs.require_issue) {
      try {
        requireIssue = JSON.parse(inputs.require_issue);
        assert.ok(
          typeof requireIssue === "boolean",
          "parsed type is not boolean"
        );
      } catch (err) {
        tools.log(`inputs.require_issue malformed`, err);
      }
    }

    const skipAuthors = new Set(
      inputs.skip_authors
        ?.split(",")
        .map((text) => text?.trim())
        .filter((text) => text) ?? []
    );

    const titlePrefixes = inputs.title_prefixes
      ?.split(",")
      .map((text) => text?.trim())
      .filter((text) => text);

    const { number: pull_number } = context.payload.pull_request ?? {};
    assert.ok(pull_number != null, "pull_request.number missing");

    const pr = await github.pulls.get({
      owner: context.repo.owner,
      pull_number,
      repo: context.repo.owner,
    });
    assert.ok(pr, "pr undefined");

    const {
      _links: { issue: linkedIssue },
      body: prBody,
      title: prTitle,
      user: prAuthor,
    } = pr.data;

    if (skipAuthors.has(prAuthor.login)) {
      tools.log(`skipping for author ${prAuthor.login}`);
      return;
    }

    if (titlePrefixes.length) {
      assert.ok(
        titlePrefixes.some((prefix) => prTitle.startsWith(prefix)),
        `PR title must start with one of ${titlePrefixes.join(", ")}`
      );
    }

    if (requireIssue && !linkedIssue) {
      assert.ok(
        prBody.includes("#minor"),
        'PR must be linked to an issue or include the text "#minor"'
      );
    }
  },
  {
    event: [
      "pull_request.opened",
      "pull_request.edited",
      "pull_request.synchronize",
    ],
  }
);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const actions_toolkit_1 = require("actions-toolkit");
actions_toolkit_1.Toolkit.run(async (tools) => {
    var _a, _b, _c, _d;
    const { context, github, inputs } = tools;
    let requireIssue = false;
    if (inputs.require_issue) {
        try {
            requireIssue = JSON.parse(inputs.require_issue);
            assert_1.default.ok(typeof requireIssue === "boolean", "parsed type is not boolean");
        }
        catch (err) {
            tools.log(`inputs.require_issue malformed`, err);
        }
    }
    const skipAuthors = new Set((_b = (_a = inputs.skip_authors) === null || _a === void 0 ? void 0 : _a.split(",").map((text) => text === null || text === void 0 ? void 0 : text.trim()).filter((text) => text)) !== null && _b !== void 0 ? _b : []);
    const titlePrefixes = (_c = inputs.title_prefixes) === null || _c === void 0 ? void 0 : _c.split(",").map((text) => text === null || text === void 0 ? void 0 : text.trim()).filter((text) => text);
    const { number: pull_number } = (_d = context.payload.pull_request) !== null && _d !== void 0 ? _d : {};
    assert_1.default.ok(pull_number != null, "pull_request.number missing");
    const pr = await github.pulls.get({
        owner: context.repo.owner,
        pull_number,
        repo: context.repo.owner,
    });
    assert_1.default.ok(pr, "pr undefined");
    const { _links: { issue: linkedIssue }, body: prBody, title: prTitle, user: prAuthor, } = pr.data;
    if (skipAuthors.has(prAuthor.login)) {
        tools.log(`skipping for author ${prAuthor.login}`);
        return;
    }
    if (titlePrefixes.length) {
        assert_1.default.ok(titlePrefixes.some((prefix) => prTitle.startsWith(prefix)), `PR title must start with one of ${titlePrefixes.join(", ")}`);
    }
    if (requireIssue && !linkedIssue) {
        assert_1.default.ok(prBody.includes("#minor"), 'PR must be linked to an issue or include the text "#minor"');
    }
}, {
    event: [
        "pull_request.opened",
        "pull_request.edited",
        "pull_request.synchronize",
    ],
});

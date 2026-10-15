const {
  detectPlatform,
  filterQuestions,
  isValidProgressStatus,
} = require("./utils");

describe("detectPlatform", () => {
  test.each([
    ["https://leetcode.com/problems/two-sum", "LeetCode"],
    ["https://codeforces.com/problemset/problem/1/A", "Codeforces"],
    ["https://www.hackerrank.com/challenges", "HackerRank"],
    ["https://www.codechef.com/problems", "CodeChef"],
    ["https://atcoder.jp/contests", "AtCoder"],
    ["https://www.geeksforgeeks.org/problems", "GeeksforGeeks"],
  ])("detects %s as %s", (url, platform) => {
    expect(detectPlatform(url)).toBe(platform);
  });

  test("returns Other for an unknown site", () => {
    expect(detectPlatform("https://example.com/problem")).toBe("Other");
  });

  test("returns Other for an invalid URL", () => {
    expect(detectPlatform("not a url")).toBe("Other");
  });
});

describe("filterQuestions", () => {
  const questions = [
    {
      title: "Two Sum",
      topics: ["Arrays"],
      difficulty: "Easy",
      platform: "LeetCode",
      status: "solved",
    },
    {
      title: "Graph Paths",
      topics: ["Graphs"],
      difficulty: "Hard",
      platform: "Codeforces",
      status: "in-progress",
    },
    {
      title: "Binary Search",
      topics: ["Arrays", "Searching"],
      difficulty: "Medium",
      platform: "AtCoder",
      status: "unsolved",
    },
  ];

  test("filters by topic tag", () => {
    expect(filterQuestions(questions, { tag: "Graphs" })).toEqual([questions[1]]);
  });

  test("filters by difficulty", () => {
    expect(filterQuestions(questions, { difficulty: "Hard" })).toEqual([questions[1]]);
  });

  test("filters by platform", () => {
    expect(filterQuestions(questions, { platform: "AtCoder" })).toEqual([questions[2]]);
  });

  test("filters by progress status", () => {
    expect(filterQuestions(questions, { status: "solved" })).toEqual([questions[0]]);
  });

  test("combines filters with AND", () => {
    expect(filterQuestions(questions, {
      tag: "Arrays",
      difficulty: "Easy",
      platform: "LeetCode",
      status: "solved",
      q: "two",
    })).toEqual([questions[0]]);
  });

  test("searches titles case-insensitively", () => {
    expect(filterQuestions(questions, { q: "bInArY" })).toEqual([questions[2]]);
  });

  test("returns no matches when nothing satisfies the filters", () => {
    expect(filterQuestions(questions, { tag: "Graphs", difficulty: "Easy" })).toEqual([]);
  });

  test("returns every question when filters are empty", () => {
    expect(filterQuestions(questions, {})).toEqual(questions);
  });
});

describe("isValidProgressStatus", () => {
  test.each(["unsolved", "in-progress", "solved"])("accepts %s", (status) => {
    expect(isValidProgressStatus(status)).toBe(true);
  });

  test.each(["", "done", "Solved", null, undefined])("rejects %s", (status) => {
    expect(isValidProgressStatus(status)).toBe(false);
  });
});

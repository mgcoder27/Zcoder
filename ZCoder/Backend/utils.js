const progressStatuses = ["unsolved", "in-progress", "solved"];

const isValidProgressStatus = (status) => progressStatuses.includes(status);

const detectPlatform = (url) => {
  let hostname;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "Other";
    }
    hostname = parsedUrl.hostname.toLowerCase();
  } catch {
    return "Other";
  }

  const platforms = {
    "leetcode.com": "LeetCode",
    "codeforces.com": "Codeforces",
    "hackerrank.com": "HackerRank",
    "codechef.com": "CodeChef",
    "atcoder.jp": "AtCoder",
    "geeksforgeeks.org": "GeeksforGeeks",
  };
  const matchedDomain = Object.keys(platforms).find(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  return matchedDomain ? platforms[matchedDomain] : "Other";
};

const filterQuestions = (
  questions,
  { tag, difficulty, platform, status, q } = {}
) => {
  const normalizedTag = tag?.trim().toLowerCase();
  const normalizedDifficulty = difficulty?.trim().toLowerCase();
  const normalizedPlatform = platform?.trim().toLowerCase();
  const normalizedStatus = status?.trim().toLowerCase();
  const normalizedQuery = q?.trim().toLowerCase();

  return questions.filter((question) => {
    const topics = question.topics || [];
    return (
      (!normalizedTag ||
        topics.some((topic) => topic.toLowerCase() === normalizedTag)) &&
      (!normalizedDifficulty ||
        question.difficulty?.toLowerCase() === normalizedDifficulty) &&
      (!normalizedPlatform ||
        question.platform?.toLowerCase() === normalizedPlatform) &&
      (!normalizedStatus ||
        (question.status || "unsolved").toLowerCase() === normalizedStatus) &&
      (!normalizedQuery ||
        question.title?.toLowerCase().includes(normalizedQuery))
    );
  });
};

module.exports = {
  detectPlatform,
  filterQuestions,
  isValidProgressStatus,
};

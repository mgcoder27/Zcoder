const { User, Question } = require("./memoryStore");

beforeEach(() => {
  User.clear();
  Question.clear();
});

describe("in-memory models", () => {
  test("stores and finds a user by id and email", async () => {
    const user = new User({ email: "player@example.com", userhandle: "player" });
    await user.save();

    expect(await User.findById(user._id)).toBe(user);
    expect(await User.findOne({ email: "player@example.com" })).toBe(user);
  });

  test("rejects duplicate user emails and handles", async () => {
    await new User({ email: "player@example.com", userhandle: "player" }).save();

    await expect(
      new User({ email: "player@example.com", userhandle: "another" }).save()
    ).rejects.toMatchObject({ code: 11000 });
    await expect(
      new User({ email: "another@example.com", userhandle: "player" }).save()
    ).rejects.toMatchObject({ code: 11000 });
  });

  test("stores map fields as objects in API JSON", async () => {
    const user = new User({
      email: "player@example.com",
      userhandle: "player",
      handles: { github: "player" },
      progress: { question: "solved" },
    });
    await user.save();

    expect(JSON.parse(JSON.stringify(user))).toMatchObject({
      handles: { github: "player" },
      progress: { question: "solved" },
    });
  });

  test("finds questions by id and id-in filters", async () => {
    const question = new Question({ link: "https://example.com/problem" });
    await question.save();

    expect(await Question.findById(question._id)).toBe(question);
    expect(await Question.find({ _id: { $in: [question._id] } })).toEqual([question]);
  });

  test("rejects duplicate question links", async () => {
    await new Question({ link: "https://example.com/problem" }).save();

    await expect(
      new Question({ link: "https://example.com/problem" }).save()
    ).rejects.toMatchObject({ code: 11000 });
  });
});

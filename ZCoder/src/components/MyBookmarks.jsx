import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { toast } from 'react-toastify';
import { API_URL } from '../constants/api';

const MyBookmarks = () => {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({
    tag: '',
    difficulty: '',
    platform: '',
    status: '',
    q: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState('');
  const [openSolution, setOpenSolution] = useState(null); // NEW STATE
  const tagOptions = ['Arrays', 'Linked List', 'Dynamic Programming', 'Graphs', 'Trees', 'Sorting and Searching'];
  const platforms = ['LeetCode', 'Codeforces', 'HackerRank', 'CodeChef', 'AtCoder', 'GeeksforGeeks', 'Other'];

  useEffect(() => {
    if (localStorage.getItem('success')) {
      const user = JSON.parse(localStorage.getItem('user'));
      setUser(user.email);
    }
  }, []);
  useEffect(() => {
    const fetchBookmarkedQuestions = async () => {
      if (!user) return;
      try {
        const query = new URLSearchParams({ email: user });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) query.set(key, value);
        });
        const response = await fetch(`${API_URL}/bookmarkquestions?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch bookmarked questions');
        }

        const data = await response.json();
        setQuestions(data.bookmarkedQuestions);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedQuestions();
  }, [user, filters]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const updateProgress = async (questionId, status) => {
    try {
      const response = await fetch(`${API_URL}/progress/${questionId}/${encodeURIComponent(user)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update question status');
      }
      setQuestions((currentQuestions) => currentQuestions.map((question) => (
        question._id === questionId ? { ...question, status: data.status } : question
      )));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const deleteBookmark = async (question) => {
    try {
      const response = await fetch(`${API_URL}/unbookmark/${question}/${user}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete bookmark');
      }

      setQuestions((prevQuestions) => prevQuestions.filter((q) => q._id !== question));
      toast.success('Bookmark deleted successfully');
      await response.json();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSolutionToggle = (idx) => {
    setOpenSolution(openSolution === idx ? null : idx);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-white">Bookmarked Questions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <input
          type="search"
          name="q"
          value={filters.q}
          onChange={updateFilter}
          placeholder="Search title"
          aria-label="Search by title"
          className="px-3 py-2 bg-gray-700 text-white rounded-md"
        />
        <select name="tag" value={filters.tag} onChange={updateFilter} aria-label="Filter by topic" className="px-3 py-2 bg-gray-700 text-white rounded-md">
          <option value="">All topics</option>
          {tagOptions.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <select name="difficulty" value={filters.difficulty} onChange={updateFilter} aria-label="Filter by difficulty" className="px-3 py-2 bg-gray-700 text-white rounded-md">
          <option value="">All difficulties</option>
          {['Easy', 'Medium', 'Hard'].map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
        </select>
        <select name="platform" value={filters.platform} onChange={updateFilter} aria-label="Filter by platform" className="px-3 py-2 bg-gray-700 text-white rounded-md">
          <option value="">All platforms</option>
          {platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={updateFilter} aria-label="Filter by status" className="px-3 py-2 bg-gray-700 text-white rounded-md">
          <option value="">All statuses</option>
          {['unsolved', 'in-progress', 'solved'].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="text-red-400 mb-4">{error}</p>}
      <div id="questions-container" className="space-y-4">
        {questions.map((question, idx) => (
          <div key={question._id} className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition duration-300 ease-in-out">
            <div className="flex space-x-4">
              <h3 className="text-xl font-semibold text-blue-400 mb-2">{question.title}</h3>
              <button
                type="button"
                onClick={() => deleteBookmark(question._id)}
                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
              >
                Delete
              </button>
            </div>
            <a href={question.link} target='_blank' className="text-blue-300 underline hover:text-blue-500 mb-2 block">Link to the Problem</a>
            <p className="text-gray-400 mb-2"><strong>Topics:</strong> {(question.topics || []).join(", ")}</p>
            <p className="text-gray-400 mb-2"><strong>Difficulty:</strong> {question.difficulty || 'Medium'} · <strong>Platform:</strong> {question.platform || 'Other'}</p>
            <label htmlFor={`status-${question._id}`} className="text-gray-300 mr-2">Status</label>
            <select
              id={`status-${question._id}`}
              value={question.status || 'unsolved'}
              onChange={(event) => updateProgress(question._id, event.target.value)}
              className="px-3 py-1 mb-3 bg-gray-700 text-white rounded-md"
            >
              <option value="unsolved">Unsolved</option>
              <option value="in-progress">In progress</option>
              <option value="solved">Solved</option>
            </select>
            {/* DROPDOWN FOR SOLUTION */}
            <div>
              <button
                onClick={() => handleSolutionToggle(idx)}
                className="text-white bg-gray-700 hover:bg-gray-600 font-medium rounded px-3 py-1 mb-2"
              >
                {openSolution === idx ? "Hide Solution" : "Show Solution"}
              </button>
              {openSolution === idx && (
                <div className="mt-2">
                  <SyntaxHighlighter language="cpp" showLineNumbers>
                    {question.solution}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookmarks
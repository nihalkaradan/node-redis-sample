const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

//cache middleware
function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) res.json(err);
    if (data !== null) {
      res.json({
        username,
        data,
      });
    } else {
      next();
    }
  });
}

//Make request to github
const getRepos = async (req, res, next) => {
  try {
    console.log("Fetching");
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    const repos = data.public_repos;
    client.setex(username, 3600, repos);
    res.json({
      username: username,
      repos: repos,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`listening at PORT: ${PORT}`);
});

var axios = require('axios');
const router = require('express').Router();
const path = require('path');
//const apiRoutes = require('./api');

//router.use('/api', apiRoutes);

const id = '3e42b7b6df8bc63f3cb4';
const sec = '977293076eb46d2f70ab6270c60157860be8b34e';

const params = `?client_id=${id}&client_secret=${sec}`;
const latest = `${params}&order=asc&sort=updated`;

router.get('/api/:username', (req, res) => {
    console.log(`GET /api/${req.params.username}`);
    getManuel(req.params.username)
    .then(profile => {
        res.json(profile);
    });
});

router.get('/api/commits/:username', (req, res) => {
    console.log(`GET /api/commits/${req.params.username}`);
    getCommits(req.params.username)
    .then(commits => {
        res.json(commits);
    });
});

router.get('/api/repos/:username', (req, res) => {
    console.log(`GET /api/repos/${req.params.username}`);
    getUserRepos(req.params.username)
    .then(repos => {
        res.json(repos);
    });
});

router.get('/api/:username1?/:username2?/:username3?', (req, res) => {
  axios.all(
    [
        getManuel(req.params.username1), 
        getManuel(req.params.username2),
        getManuel(req.params.username3)
    ]
  ).then(axios.spread((profile1, profile2, profile3) => {
    res.json([profile1, profile2, profile3]);
  }));
});

    
    // this is for production use only, if no API routes are hit then serve up the React frontend
router.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});


function getUserRepos(username) {
  return axios
    .get(`http://api.github.com/users/${username}/repos${latest}`)
    .then(user => user.data);
}

function getProfile(username) {
  return axios
    .get(`http://api.github.com/users/${username}${params}`)
    .then(user => {
      return user.data;
    });
}

function getCommits(username) {
  return axios
    .get(`https://github-contributions-api.now.sh/v1/${username}`)
    .then(user => {
      console.log(user.data.years[0].total);
      return user.data.years[0].total;
    });
}

function getManuel(username) {
    return axios.all(
        [
            getProfile(username), 
            getUserRepos(username),
            getCommits(username)
        ]
    )
      .then(axios.spread((profile, repos, commits) => {
          let manuel = {};

          manuel.created_at = profile.created_at;
          manuel.avatar_url = profile.avatar_url;
          manuel.login = profile.login;
          manuel.html_url = profile.html_url;
          manuel.login = profile.login;
          manuel.name = profile.name;
          manuel.location = profile.location;
          manuel.company = profile.company;
          manuel.bio = profile.bio;
          manuel.blog = profile.blog;
          manuel.public_repos = profile.public_repos;
          manuel.public_gists = profile.public_gists;
          manuel.followers = profile.followers;
          manuel.following = profile.following;
          manuel.commits = commits;

          manuel.repos = [];

          repos.forEach(repo => {
            let kevin = {};
            kevin.name = repo.name;
            kevin.html_url = repo.html_url;
            kevin.description = repo.description;
            kevin.stargazers_count = repo.stargazers_count;
            kevin.forks_count = repo.forks_count;
            kevin.language = repo.language;
            manuel.repos.push(kevin);
          });
        //   manuel.repos = repos;

          //console.log(manuel);
          return manuel;
      }))
}

function getRepos(username, quantity = 100) {
  return axios.get(
    `http://api.github.com/users/${username}/repos${params}&per_page=${quantity}`
  );
}

function battle(players) {
  return axios
    .all(players.map(getUserData))
    .then(sortPlayers)
    .catch(handleError);
}

function getStarCount(repos) {
  return repos.data.reduce((count, repo) => {
    return count + repo.stargazers_count;
  }, 0);
}

function calculateScore(profile, repos, username) {
  let followers = profile.followers;
  let totalStars = getStarCount(repos);
  let repos2 = profile.public_repos;

  return (followers * 1.5) * 10 + (totalStars * 0.75) * 10 + (repos2 * 0.4) * 10
}

function handleError(error) {
  console.warn(error);
  return null;
}

function getUserData(player) {
  return axios.all([getManuel(player)]).then(function (data) {
    console.log(data)

    return {
      profile: profile,
      score: calculateScore(data)
    };
  });
}

function sortPlayers(players) {
  return players.sort((a, b) => {
    return b.score - a.score;
  });
}

module.exports = router;
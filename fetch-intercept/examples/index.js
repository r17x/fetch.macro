const fetchIntercept = require("../fetch-intercept");

fetchIntercept.register({
  onRequest: (r) => {
    console.log(`Requesting ${r.url}`);
  },
  onResponse: (r) => {
    console.log(`Response for ${r.url}`);
  },
});

const identity = (x) => x;

const log = (msg) => (x) => {
  console.log(msg, x);
  return x;
};

const Pok =
  (predicate, handleResponse = identity) =>
  (res) =>
    predicate(res) ? handleResponse(res) : Promise.reject(res);

const is200 = (res) => res.ok && res.status === 200;

const resJSON = (res) => res.json();

const data = (json) =>
  Promise.all([json.followers_url, json.repos_url].map((url) => fetch(url).then(Pok(is200, resJSON)))).then(
    ([followersList, reposList]) => ({
      ...json,
      followersList,
      reposList,
    }),
  );

fetch("https://api.github.com/users/r17x")
  .then(Pok(is200, resJSON))
  .then(log("Response:"))
  .then(data)
  .then(({ followersList, reposList }) => {
    console.log({ followersList, reposList });
  });

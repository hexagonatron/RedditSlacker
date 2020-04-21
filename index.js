const fetch = require("node-fetch");
const btoa = require('btoa');
require('dotenv').config();
const FormData = require("form-data");

const REDDIT_APP_ID = process.env.REDDIT_APP_ID;
const REDDIT_APP_SECRET = process.env.REDDIT_APP_SECRET;
const SLACK_TOKEN = process.env.SLACK_TOKEN;

const body = new FormData();
body.append("grant_type", "client_credentials");

console.log(body);

fetch("https://www.reddit.com/api/v1/access_token",{
    method: "POST",
    headers: {
        'Authorization': 'Basic ' + btoa(`${REDDIT_APP_ID}:${REDDIT_APP_SECRET}`),
        "User-Agent": "Script slackbot by hexagonatron",
    },
    body: body
})
.then(response => {
    console.log(response.headers);
    return response.json();
})
.then(json => {
    console.log(json);

    const access_token = json.access_token;

    return fetch("https://oauth.reddit.com/r/ProgrammerHumor/top",{
        method:"GET",
        headers: {
            "Authorization": "bearer "+ access_token
        }
    });
})
.then(response => {
    return response.json();
})
.then(subRedditJson => {
    const imgURL = subRedditJson.data.children[0].data.url;

    fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            "Content-type":"application/json; charset=utf-8",
            "Authorization": "Bearer "+ SLACK_TOKEN
        },
        body:JSON.stringify({
            channel: "#appdev",
            text: "Sending from NodeJS =D",
            blocks: `[{
                "type": "image",
                "image_url": "${imgURL}",
                "alt_text": "An image"
            }]`
        })
    })
    .then(response=> {
        return response.json()
    })
    .then(json => {
        console.log(json);
    })

})
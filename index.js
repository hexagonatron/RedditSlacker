const fetch = require("node-fetch");
const btoa = require('btoa');
require('dotenv').config();
const FormData = require("form-data");
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");

const REDDIT_APP_ID = process.env.REDDIT_APP_ID;
const REDDIT_APP_SECRET = process.env.REDDIT_APP_SECRET;
const SLACK_TOKEN = process.env.SLACK_TOKEN;

const PORT = 3000;

const app = express();

//Logging FN
const logRequest = (req) => {
    const date = new Date().toISOString();
    const logStr = `${date}: ${req.method} request for "${req.originalUrl}" from ${req.ip}\n`;
    const filePath = "./log/log.txt";

    fs.appendFile(filePath, logStr, (err) => {
        if(err) console.log(err);
    });
}

app.listen(PORT, ()=> {
    console.log(`Server started on ${PORT}`);
});

app.get("/", (req, res) => {
    console.log(req.headers.host);
    logRequest(req);
    res.status("200").send();
})

app.post("/subreddit", (req, res) => {
    res.status("200").send();
    console.log(req.body);
    fs.writeFile("./log/request.txt", JSON.stringify(req), (err)=> {
        if(err) console.log(err);
    });

});

// const body = new FormData();
// body.append("grant_type", "client_credentials");


/* fetch("https://www.reddit.com/api/v1/access_token",{
    method: "POST",
    headers: {
        'Authorization': 'Basic ' + btoa(`${REDDIT_APP_ID}:${REDDIT_APP_SECRET}`),
        "User-Agent": "Script slackbot by hexagonatron",
    },
    body: body
})
.then(response => {
    return response.json();
})
.then(json => {
    const access_token = json.access_token;

    return fetch("https://oauth.reddit.com/r/tifu/top",{
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

    console.log(subRedditJson.data.children[0].data.title);
    console.log(subRedditJson.data.children[0].data.selftext);
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

}) */
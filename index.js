const fetch = require("node-fetch");
const btoa = require('btoa');
require('dotenv').config();
const FormData = require("form-data");
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const bodyParser = require("body-parser");

const REDDIT_APP_ID = process.env.REDDIT_APP_ID;
const REDDIT_APP_SECRET = process.env.REDDIT_APP_SECRET;
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const PORT = 3000;

const app = express();

const rawParser = bodyParser.text({type: "*/*"});

//Logging FN
const logRequest = (req) => {
    const date = new Date().toISOString();
    const logStr = `${date}: ${req.method} request for "${req.originalUrl}" from ${req.ip}\n`;
    const filePath = "./log/log.txt";

    fs.appendFile(filePath, logStr, (err) => {
        if(err) console.log(err);
    });
}

const verifyRequest = ({body, headers}) => {
    console.log(body);
    console.log(headers);

    const reqTimestamp = headers['x-slack-request-timestamp'];
    const reqSig = headers['x-slack-signature'];
    const baseStr = `v0:${reqTimestamp}:${body}`;
    
    const timeDiff = new Date().getTime() / 1000 - reqTimestamp;

    //If request is more than 5 mins old could be replay attack so do nothing
    if(timeDiff > (60*5)) return false
    

    const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET);
    hmac.update(baseStr);
    console.log("v0="+hmac.digest('hex'));
    console.log(reqSig);
    
}

app.listen(PORT, ()=> {
    console.log(`Server started on ${PORT}`);
});

app.get("/", (req, res) => {
    console.log(req.headers.host);
    logRequest(req);
    res.status("200").send();
})

app.post("/subreddit", rawParser, (req, res) => {
    res.status("200").send();
    if(verifyRequest(req)){

    }
})

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
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

const jsonParser = express.urlencoded({ extended: true, type: "*/*" });

//Logging FN
const logRequest = (req) => {
    const date = new Date().toISOString();
    const logStr = `${date}: ${req.method} request for "${req.originalUrl}" from ${req.ip}\n`;
    const filePath = "./log/log.txt";

    fs.appendFile(filePath, logStr, (err) => {
        if (err) console.log(err);
    });
}

const verifyRequest = ({ body, headers }) => {

    const bodyStr = new URLSearchParams(body).toString();

    const reqTimestamp = headers['x-slack-request-timestamp'];
    const reqSig = headers['x-slack-signature'];
    const baseStr = `v0:${reqTimestamp}:${bodyStr}`;

    const timeDiff = new Date().getTime() / 1000 - reqTimestamp;

    //If request is more than 5 mins old could be replay attack so do nothing
    if (timeDiff > (60 * 5)) return false

    //Calculate signed secret and compare to received sig returns true if the same
    const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET);
    hmac.update(baseStr);
    hmacDigest = "v0=" + hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmacDigest), Buffer.from(reqSig));
}

const getRedditToken = () => {
    const body = new FormData();
    body.append("grant_type", "client_credentials");

    return fetch("https://www.reddit.com/api/v1/access_token", {
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
            return json.access_token;
        });
}

const queryReddit = (subreddit, timeFrame = "day") => {
    return new Promise((res, rej) => {
        getRedditToken()
            .then(token => {

                const url = `https://oauth.reddit.com/r/${subreddit}/top/?sort=top&t=${timeFrame}`

                return fetch(url, {
                    method: "GET",
                    headers: {
                        "Authorization": "bearer " + token
                    }
                });
            })
            .then(response => {
                return response.json();
            })
            .then(json => {
                console.log(json);
                if (json.data.children.length) res(json.data.children);
                else rej("Cannot find any posts in your subreddit for the provided timeframe");
            })
            .catch(err => {
                rej(err);
            });
    });
}

const createResponse = (post, userID) => {
    // console.log(post);

    //If it's a text post format response for text
    if (post.is_self){

        return JSON.stringify([
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*${post.title}*`
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": post.selftext.slice(0, 3000)
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": `Bot called by <@${userID}>`
                        }
                    ]
                }
            ]);
    


    } else {
        //Gfycat decoder
        post.url = /(^https:\/\/gfycat\.com\/(.*))/gm.exec(post.url)?post.media.oembed.thumbnail_url:post.url;

        //imgur decoder
        post.url = /^(https:\/\/i\.imgur\.com\/.*\.gif)v$/g.exec(post.url)?/^(https:\/\/i\.imgur\.com\/.*\.gif)v$/g.exec(post.url)[1]:post.url;

        //if it's an image link format for an image
        if(/(\.jpg|\.gif|\.png)$/gim.test(post.url)){

            return `[
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*${post.title}*"
                        }
                    },
                    {
                        "type": "image",
                        "image_url": "${post.url}",
                        "alt_text": "image1"
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "mrkdwn",
                                "text": "Bot called by <@${userID}>"
                            }
                        ]
                    }
                ]`
        } else {
            //if not an image just return the link
            return `[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*${post.title}*"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "${post.url}"
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "Bot called by <@${userID}>"
                        }
                    ]
                }
            ]`
        }
    }
}

const createError = (error, userID) => {
    return JSON.stringify([
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": error
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Bot called by <@${userID}>`
                }
            ]
        }
    ]);
}

const postToSlack = (block, channel) => {
    fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=utf-8",
            "Authorization": "Bearer " + SLACK_TOKEN
        },
        body: JSON.stringify({
            channel: channel,
            text: "Sending from NodeJS =D",
            blocks: block
        })
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            console.log(json);
        })
}

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});

// app.get("/", (req, res) => {
//     console.log(req.headers.host);
//     logRequest(req);
//     res.status("200").send();
// })

app.post("/subreddit", jsonParser, (req, res) => {
    res.status("200").send();

    //if not a valid request then do nothing.
    if (!verifyRequest(req)) {
        return
    }

    const { body } = req;

    const optionsArray = body.text.split(' ');
    const subreddit = optionsArray[0]?optionsArray[0]: "funny" ;
    const timeFrame = optionsArray[1]? optionsArray[1]: "day";

    queryReddit(subreddit, timeFrame)
        .then(posts => {
            console.log(`Count: ${posts.length}`);
            const randPost = posts[Math.floor(Math.random() * posts.length )];
            console.log(randPost);
            const slackResponse = createResponse(randPost.data, body.user_id);
            
            console.log(slackResponse);

            postToSlack(slackResponse, body.channel_id);
        })
        .catch(error => {
            const slackResponse = createError(error, body.user_id);
            console.log(slackResponse);

            postToSlack(slackResponse, body.channel_id);
        });

});
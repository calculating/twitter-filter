function processTweet(element) {
    if (element.className.includes("cloned-modal-tweet")) return;
    const hasText = !!element.querySelector("div[data-testid='tweetText']")
    const tweetText = hasText ? element.querySelector("div[data-testid='tweetText']").textContent : ""
    const author = element.querySelector("div[data-testid='User-Name']").textContent
    const postText = tweetText + "\n\n - " + author
    const hasImage = !!element.querySelector("div[data-testid='tweetPhoto']") // also grabs videos.
    // const imageUrl = hasImage ? element.querySelector("div[data-testid='tweetPhoto']").querySelector("img").src : null

    stylizeTweet(element, postText, hasImage)
    saveTweet(element)
    filterTweet(element, postText, hasImage)
}


function stylizeTweet(element, postText, hasImage) {
    // check if the tweet already has 'button' elements, if so pass
    if (element.querySelector("button")) return;

    const twitterIconColor = "#536471"

    let row = element.querySelector('[role="group"]')
    let plusSVG = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="feedback-button-icon">
            <circle cx="12" cy="12" r="10" stroke="${twitterIconColor}" stroke-width="2"/>
            <line x1="12" y1="6" x2="12" y2="18" stroke="${twitterIconColor}" stroke-width="2" stroke-linecap="round" />
            <line x1="6" y1="12" x2="18" y2="12" stroke="${twitterIconColor}" stroke-width="2" stroke-linecap="round" />
        </svg>`;

    let plusButton = document.createElement('button');
    plusButton.className = "feedback-button"
    plusButton.innerHTML = plusSVG;

    // SVG for minus button
    let minusSVG = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="feedback-button-icon">
            <circle cx="12" cy="12" r="10" stroke="${twitterIconColor}" stroke-width="2"/>
            <line x1="6" y1="12" x2="18" y2="12" stroke="${twitterIconColor}" stroke-width="2"/>
        </svg>`;

    let minusButton = document.createElement('button');
    minusButton.className = "feedback-button"
    minusButton.innerHTML = minusSVG;

    // marginleft of minus should be like 24 - (padding = 8 + 8 = 16) = 8
    // plus: 16
    plusButton.style.marginLeft = "16px";
    minusButton.style.marginLeft = "8px";

    // Function to replace buttons with an input box
    function replaceWithInput(operation) {
        row.removeChild(plusButton);
        row.removeChild(minusButton);

        let inputBox = document.createElement('input');
        inputBox.type = 'text';

        // Add event listener for the 'keydown' event
        inputBox.addEventListener('keydown', function (event) {
            // Check if the pressed key was "Enter"
            if (event.key === "Enter") {
                const feedbackPrefix = operation === "minus" ? `- Marked : BLOCK` : `- Marked PASS: `;
                feedback("\n\n" + feedbackPrefix + `"` + inputBox.value + `"` + "\n" + "```\n" + postText + "\n```");

                // remove the feedback box
                row.removeChild(inputBox);
            }
        });

        row.appendChild(inputBox);
    }

    function minused() {
        replaceWithInput("minus");
        // addMultishotPrompt([
        //     {
        //         "role": "user",
        //         "content": postText
        //     },
        //     {
        //         "role": "assistant",
        //         "content": "block"
        //     },
        // ], false)

    }
    function plussed() {
        replaceWithInput("plus");
        // addMultishotPrompt([
        //     {
        //         "role": "user",
        //         "content": postText
        //     },
        //     {
        //         "role": "assistant",
        //         "content": "pass"
        //     },
        // ], false)
    }

    // Add event listeners to the buttons
    plusButton.addEventListener('click', plussed);
    minusButton.addEventListener('click', minused);

    // Append buttons to the container
    row.appendChild(plusButton);
    row.appendChild(minusButton);
}



function saveTweet(element) {
    // Save tweet to database of spyware :))
    fetch(`${HOST}/api/tweet`, {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': JSON.stringify({ 'raw_text': element.innerText, 'username': getUsername() }),
    }).catch((e) => {
        console.error('Save tweet', e)
    });
}

function filterTweet(element, postText, hasImage) {
    if (Object.keys(checkedTweets).includes(postText)) {
        if (checkedTweets[postText] === "block") {
            markTweetAsBlocked(element)
        } else if (checkedTweets[postText] === "pass") {
            markTweetAsPassed(element)
        } else if (checkedTweets[postText] === "pending") {
            markTweetAsPending(element)
        } else if (checkedTweets[postText] === "unsure" || checkedTweets[postText] === "bad-gpt-response") {
            markTweetAsUnsure(element);
        } else {
            console.warn(`The following tweet is stored as neither ${gptOptions.map(x => `"${x}"`).join(" nor ")}:\n`, postText)
        }
        return;
    }

    checkedTweets[postText] = "pending"
    markTweetAsPending(element)

    const withImage = postText + (hasImage ? '\n\n[IMAGE]' : '')
    const userPrompt = `\`\`\`${withImage}\`\`\` \n\n\nFirst check against user preferences, then respond with either \"pass\", \"block, or \"unsure\". Match user labels for repeated posts.`

    const prompt = [
        { "role": "system", "content": systemPrompt },
        ...multishotPrompt,
        { 'role': 'user', 'content': userPrompt }
    ]

    // for debugging
    // console.log("Prompt: ", prompt)

    response = fetch(`${HOST}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'model': 'gpt-3.5-turbo',
            'messages': prompt,
            'temperature': 0,
            'logit_bias': { 13271: -50 },
        })
    }).then(response => response.json()).then(
        data => {
            if (!data.choices) {
                console.log("The API returned no data, probably 429 rate limit.")
                return;
            }
            const reply = data.choices[0].message.content

            // for debugging
            // console.log("GPT response: ", reply, "\n\n Tweet: ", postText)

            if (reply.match(/block/i)) {
                markTweetAsBlocked(element);
                checkedTweets[postText] = "block";
            } else if (reply.match(/pass/i)) {
                markTweetAsPassed(element)
                checkedTweets[postText] = "pass";
            } else if (reply.match(/unsure/i)) {
                markTweetAsUnsure(element);
                checkedTweets[postText] = "unsure";
            } else {
                console.error(`For the following tweet, GPT gave the response "${reply}" : \n`, postText);
                markTweetAsUnsure(element);
                checkedTweets[postText] = "bad-gpt-response";
            }
        }
    ).catch((error) => {
        console.error('Error:', error);
    });
}

function markTweetAsPassed(tweetHTMLElement) {
    // unblur
    tweetHTMLElement.style.filter = "blur(0px)";
    tweetHTMLElement.style.borderLeft = "8px solid " + BLUE;
    tweetHTMLElement.style.height = "auto";
}

function markTweetAsPending(tweetHTMLElement) {
    // blur the element
    tweetHTMLElement.style.filter = "blur(5px)";
    // tweetHTMLElement.style.height = "5px";
}

function markTweetAsUnsure(tweetHTMLElement) {
    tweetHTMLElement.style.filter = "blur(0px)";
    tweetHTMLElement.style.borderLeft = "8px solid " + YELLOW;
    tweetHTMLElement.style.height = "auto";
}

function markTweetAsBlocked(tweetHTMLElement) {
    tweetHTMLElement.style.filter = "blur(0px)";
    tweetHTMLElement.style.borderLeft = "8px solid " + RED;

    // uncomment following lines for testing: hover over the tweet to see the full text.
    // element.onmouseover = () => {
    //     element.style.height = "auto";
    // }
    // element.onmouseleave = () => {
    //     element.style.height = "5px";
    // }

    // comment out the following line for testing (not delete filtered tweets just make them red)
    tweetHTMLElement.style.height = '5px';
}

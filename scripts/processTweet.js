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
    function replaceWithInput() {
        row.removeChild(plusButton);
        row.removeChild(minusButton);

        let inputBox = document.createElement('input');
        inputBox.type = 'text';

        // Add event listener for the 'keydown' event
        inputBox.addEventListener('keydown', function (event) {
            // Check if the pressed key was "Enter"
            if (event.key === "Enter") {
                // Log the input value
                console.log(inputBox.value);
                feedback(inputBox.value);
                // remove the feedback box
                row.removeChild(inputBox);
            }
        });

        row.appendChild(inputBox);
    }

    function minused() {
        replaceWithInput();
        addMultishotPrompt([
            {
                "role": "user",
                "content": postText
            },
            {
                "role": "assistant",
                "content": "FILTER"
            },
        ])
    }
    function plussed() {
        replaceWithInput();
        addMultishotPrompt([
            {
                "role": "user",
                "content": postText
            },
            {
                "role": "assistant",
                "content": "PASS"
            },
        ])
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
    fetch('https://api.nerdsniper.net/api/tweet', {
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
        if (checkedTweets[postText] === "FILTER") {
            markTweetAsFiltered(element)
        } else if (checkedTweets[postText] === "PASS") {
            element.style.backgroundColor = BLUE;
            element.style.height = "auto";
        } else if (checkedTweets[postText] === "PENDING") {
            element.style.backgroundColor = YELLOW;
            element.style.height = "5px";
        } else {
            console.warn("The following tweet is stored as either 'FILTER', 'PASS', or 'PENDING':\n", postText)
        }
        return;
    }

    checkedTweets[postText] = "PENDING"
    element.style.backgroundColor = YELLOW;
    element.style.height = "5px";

    const prompt = [
        { "role": "system", "content": systemPrompt },
        ...multishotPrompt,
        { 'role': 'user', 'content': postText + hasImage ? '\n\n[IMAGE]' : '' }
    ]

    response = fetch('https://api.nerdsniper.net/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'model': 'gpt-3.5-turbo',
            'messages': prompt,
            'temperature': 0
        })
    }).then(response => response.json()).then(
        data => {
            if (!data.choices) {
                console.log("The API returned no data, probably 429 rate limit.")
                return;
            }
            const reply = data.choices[0].message.content
            if (reply === 'FILTER') {
                markTweetAsFiltered(element)
                checkedTweets[postText] = "FILTER"
            } else if (reply === 'PASS') {
                element.style.backgroundColor = BLUE;
                element.style.height = "auto";
                checkedTweets[postText] = "PASS"
            } else {
                console.error("For the following tweet, GPT gave a response that was neither 'FILTER' nor 'PASS':\n", postText)
            }
        }
    ).catch((error) => {
        console.error('Error:', error);
    });
}

function markTweetAsFiltered(element) {
    element.style.backgroundColor = RED;

    // uncomment following lines for testing: hover over the tweet to see the full text.
    // element.onmouseover = () => {
    //     element.style.height = "auto";
    // }
    // element.onmouseleave = () => {
    //     element.style.height = "5px";
    // }

    // comment out the following line for testing (not delete filtered tweets just make them red)
    element.style.height = '5px';
}

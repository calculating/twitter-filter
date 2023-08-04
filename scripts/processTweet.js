function processTweet(element) {
    const hasText = !!element.querySelector("div[data-testid='tweetText']")
    const tweetText = hasText ? element.querySelector("div[data-testid='tweetText']").textContent : ""
    const author = element.querySelector("div[data-testid='User-Name']").textContent
    const postText = tweetText + "\n\n - " + author
    const hasImage = !!element.querySelector("div[data-testid='tweetPhoto']") // also grabs videos.
    // const imageUrl = hasImage ? element.querySelector("div[data-testid='tweetPhoto']").querySelector("img").src : null

    stylizeTweet(element, postText)
    saveTweet(element)
    filterTweet(element, postText, hasImage)
}

function stylizeTweet(element, postText) {
    const elementClone = element.innerHTML

    // when you hover over each tweet, there is a button that u can press to enter feedback.
    const b = document.createElement("button")
    b.style.display = "none"
    b.className = "feedback-button"
    b.innerHTML = xIcon

    b.onclick = (event) => {
        checkedTweets[postText] = "FILTER"
        markTweetAsFiltered(element)

        // open the feedback modal if shift is not pressed.
        if (!event.shiftKey) createFeedbackModal(elementClone)

        // add the tweet to the multishot prompt as a filtered tweet.
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

    element.appendChild(b)
    element.onmouseover = () => b.style.display = "block"
    element.onmouseleave = () => b.style.display = "none"
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
        } else if (checkedTweets[postText] === "PENDING") {
            element.style.backgroundColor = YELLOW;
        } else {
            console.warn("The following tweet is stored as either 'FILTER', 'PASS', or 'PENDING':\n", postText)
        }
        return;
    }

    checkedTweets[postText] = "PENDING"
    element.style.backgroundColor = YELLOW;

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
            'temperature': 0.7
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
                checkedTweets[postText] = "PASS"
            } else {
                console.warn("For the following tweet, GPT gave a response that was neither 'FILTER' nor 'PASS':\n", postText)
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

function createFeedbackModal(tweetInnerHTML) {
    const modalWrapper = document.createElement("div")
    const modal = document.createElement("div")
    modalWrapper.className = "modalWrapper"
    modal.className = "modal"
    modalWrapper.appendChild(modal)

    modal.innerHTML = `<h1 class="feedback-title">What's wrong with this tweet?</h1>`
    modal.innerHTML += `<p class="feedback-description">[chrome extension] will remember your preferences and won't show tweets like this in the future.</p>`
    modal.innerHTML += `<p class="feedback-description">To avoid this dialogue, hold down shift when deleting tweets</p>`

    modal.innerHTML += `<div class="feedback-tweet">${tweetInnerHTML}</div>`

    const input = document.createElement("textarea")
    input.className = "feedback-input"
    const id = "feedback-input-lskdfjslkd"
    input.id = id
    input.placeholder = "i dislike nearly anything cryptocurrency related, unless it's particularly interesting from a mathematics or cryptography perspective"

    function closeModal() {
        document.body.removeChild(modalWrapper)
        document.body.removeChild(overlay)
        document.removeEventListener("click", closeModalOnClickingBody)
    }

    function handleSubmit(feedbackValue) {
        feedback(feedbackValue);
        closeModal()
    }

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmit(this.value)
        } else if (e.key === "Escape") {
            closeModal()
        }
    });

    modal.appendChild(input)
    modal.innerHTML += `<p class="feedback-description">Ctrl+enter to submit</p>`

    document.body.appendChild(modalWrapper)

    const overlay = document.createElement("div")
    overlay.className = "overlay"
    document.body.appendChild(overlay)

    const closeModalOnClickingBody = (event) => {
        // if not clicking the modal or a child of the modal, close the modal.
        if (!modal.contains(event.target)) {
            closeModal()
        }
    }

    waitForAndFocusElement("#" + id)
    setTimeout(() => document.addEventListener("click", closeModalOnClickingBody), 100)
}

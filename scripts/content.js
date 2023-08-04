if (localStorage.getItem('systemprompt') == null) {
    // create dialogue that asks the user for a system prompt.
    localStorage.setItem('systemprompt', `Given the following preferences, mark Tweets as either PASS or FILTER, where filtered Tweets will be removed from the user's feed.\n\nPreferences:\n- like: big news about physics\n- dislike: non-substantive content, opinions/questions\n- like: posts sharing ai research papers\n- dislike: nearly anything cryptocurrency related, unless it's particularly interesting from a mathematics or cryptography perspective\n- err on the side of passing posts that don't have enough context\n- filter posts that are social in essence, about someone's personal life\n- in general, if you don't learn anything new about actual things in the world from a tweet, it should be filtered. For example, "this is going to be the most chaotic decade in human history" doesn't actually contain any substative information.\n- No rhetorical question tweets.\n- no promotional tweets\n- nothing that seems like a clickbaity list, i.e. "THESE 5 SIMPLE TRICKS WILL MAKE YOU LITTERALLY MAGIC"`);
}

system_prompt = localStorage.getItem('systemprompt');

var isLightMode = document.head.querySelector("[name~=theme-color][content]").content === "#FFFFFF"
var red = isLightMode ? "#ff9999" : "#660000"
var yellow = isLightMode ? "#fffdb5" : "#4B4901"
var blue = isLightMode ? "#b5e9ff" : "#00354B"
let checked_tweets = {};

var i = 0; // number of reqs, for debugging

var multishotPrompt = []

const get_username = () =>
    document.querySelector('nav[aria-label="Primary"] a:nth-child(9)').href.match(/\w*$/)[0]


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
    input.placeholder = "i dislike nearly anything cryptocurrency related, unless it's particularly interesting from a mathematics or cryptography perspective"

    function handleSubmit(feedbackValue) {
        feedback(feedbackValue);
        document.body.removeChild(modalWrapper)
        document.body.removeChild(overlay)
    }

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmit(this.value)
        }
    });

    modal.appendChild(input)
    modal.innerHTML += `<p class="feedback-description">Ctrl+enter to submit</p>`

    document.body.appendChild(modalWrapper)

    const overlay = document.createElement("div")
    overlay.className = "overlay"
    document.body.appendChild(overlay)

    // const closeModalOnClickingBody = (event) => {
    //     console.log("clicked body.")
    //     // if not clicking the modal or a child of the modal, close the modal.
    //     if (!modal.contains(event.target)) {
    //         document.body.removeChild(modalWrapper)
    //         document.body.removeChild(overlay)
    //         document.removeEventListener("click", closeModalOnClickingBody)
    //     }
    // }

    // document.addEventListener("click", closeModalOnClickingBody)
}


// svg from heroicons.com
const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" />
</svg>
`

function gpt_filter(element) {
    const post_text = element.innerText.split('\n').slice(0, -4).join('\n');
    const elementClone = element.innerHTML

    // element.querySelector("div[data-testid='tweetText']").textContent -> get tweet text
    const hasImage = !!element.querySelector("div[data-testid='tweetPhoto']") // also grabs videos.

    // if we want to do fancy things with the image later. (like getting what text is on it or save to database)
    // const imageUrl = hasImage ? element.querySelector("div[data-testid='tweetPhoto']").querySelector("img").src : null
    i++;

    // when you hover over each tweet, there is a button that u can press to enter feedback.
    const b = document.createElement("button")
    b.style.display = "none"
    b.className = "feedback-button"
    b.innerHTML = xIcon

    b.onclick = (event) => {
        checked_tweets[post_text] = "FILTER"
        element.style.backgroundColor = red;
        element.style.height = "5px";

        // open the feedback modal if shift is not pressed.
        if (!event.shiftKey) createFeedbackModal(elementClone)

        // add the tweet to the multishot prompt as a filtered tweet.
        multishotPrompt.concat([
            {
                "role": "user",
                "content": post_text
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


    // Save tweet to database of spyware :))
    fetch('https://api.nerdsniper.net/api/tweet', {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': JSON.stringify({'raw_text': element.innerText, 'username': get_username()}),
    }).catch((e) => {
        console.error('Save tweet', e)
    });

    if (Object.keys(checked_tweets).includes(post_text)) {
        if (checked_tweets[post_text] === "FILTER") {
            element.style.backgroundColor = red;
            element.style.height = "5px";
        } else if (checked_tweets[post_text] === "PASS") {
            element.style.backgroundColor = blue;
        } else if (checked_tweets[post_text] === "PENDING") {
            element.style.backgroundColor = yellow;   
        }
        else {
            console.log("bad. checked tweet is not 'FILTER' or 'PASS' or 'PENDING'")
        }
        return;
    }
    checked_tweets[post_text] = "PENDING"

    element.style.backgroundColor = yellow;

    response = fetch('https://api.nerdsniper.net/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'model': 'gpt-3.5-turbo',
            'messages': [{"role": "system", "content": system_prompt}].concat(multishotPrompt).concat([{'role': 'user', 'content': post_text + hasImage ? '\n\n[IMAGE]' : ''}]),
            'temperature': 0.7
        })
    }).then(response => response.json()).then(
        data => {
            if (data.choices[0].message.content == 'FILTER') {
                element.style.backgroundColor = red;
                // comment out the following line for test mode (not delete filtered tweets just make them red)
                element.style.height = '5px';
                checked_tweets[post_text] = "FILTER"
            } else {
                element.style.backgroundColor = blue;
                checked_tweets[post_text] = "PASS"
            }
        }
    ).catch((error) => {
        console.error('Error:', error);
    });
}


let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (!location.href.match(/home\/?$/)) {
                    return;
                }
                let articles = node.querySelectorAll('[role="article"]');
                if (node.getAttribute('role') === 'article') {
                    articles = [node, ...articles];
                }

                articles.forEach((article) => {
                    gpt_filter(article);
                });
            }
        });
    });
});

let config = {
    attributes: false,
    childList: true,
    subtree: true,  // Will watch all descendants of the target
};

let targetNode = document.querySelector('body');

observer.observe(targetNode, config);

function checkall() {
    checked_tweets = {}
    document.querySelectorAll('[role="article"]').forEach((article) => {
        article.style.backgroundColor = '';
        gpt_filter(article);
    });
}

function feedback(newpref) {
    system_prompt += '\n- ' + newpref;
    localStorage.setItem('systemprompt', system_prompt);
    checkall();
}

function start() {
    let input = document.createElement("input");
    input.style.position = 'fixed';
    input.style.bottom = '0px';
    input.style.right = '0px';
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            feedback(this.value);
            this.value = '';
        }
    });
    document.body.appendChild(input);

    checkall();
}

start();

// let elements = document.querySelectorAll('[role="menuitem"]');
// for(let i = 0; i < elements.length; i++) {
//   if(elements[i].innerText.includes("Not interested in this post")) {
//     elements[i].style.backgroundColor = 'red';
//   }
// }

// document.querySelectorAll('[role="article"]')[11].querySelector('[data-testid="caret"]').click()

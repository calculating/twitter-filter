const SYSTEM_PROMPT_KEY = "system-prompt";
const MULTISHOT_PROMPT_KEY = "multishot-prompt";

const DEFAULT_SYSTEM_PROMPT = `
Given preferences by the user, mark new Tweets as either "block", "pass", or "unsure". Default to "pass" unless there is a specific reason to block based on preferences provided by the user. Use "unsure" only if a Tweet may fit a blocking criteria but there is ambiguity. Respond only with "block", "pass", or "unsure", with no additional text.

Preferences:

- Marked block: "no gaming content"
\`\`\` 
Elon Musk

@elonmusk
·
27m
Diablo IV is a great game. Nice work by the 
@Blizzard_Ent
 team!
\`\`\` 

- General preference: I only want to see tweets that keep me informed about current events or teach me something new.`

const gptOptions = ["block", "pass", "unsure"];

function start() {
    if (localStorage.getItem(SYSTEM_PROMPT_KEY) == null) {
        localStorage.setItem(SYSTEM_PROMPT_KEY, DEFAULT_SYSTEM_PROMPT)
    }

    if (localStorage.getItem(MULTISHOT_PROMPT_KEY) == null) {
        localStorage.setItem(MULTISHOT_PROMPT_KEY, JSON.stringify([]));
    }

    // INITIATE GLOBAL VARIABLES
    systemPrompt = localStorage.getItem(SYSTEM_PROMPT_KEY);
    multishotPrompt = JSON.parse(localStorage.getItem(MULTISHOT_PROMPT_KEY))

    IS_LIGHT_MODE = document.head.querySelector("[name~=theme-color][content]").content === "#FFFFFF"
    // IS_LIGHT_MODE = false
    RED = IS_LIGHT_MODE ? "#ff9999" : "#660000"
    YELLOW = IS_LIGHT_MODE ? "#fffdb5" : "#4B4901"
    BLUE = IS_LIGHT_MODE ? "#b5e9ff" : "#00354B"

    checkedTweets = {};
    // END GLOBAL VARIABLES

    // set up the mutation observer
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (!location.href.match(/home\/?$/)) {
                        return;
                    }
                    let articles = node.querySelectorAll('[data-testid="tweet"]');
                    if (node.getAttribute('role') === 'article') {
                        articles = [node, ...articles];
                    }

                    articles.forEach((article) => {
                        processTweet(article);
                    });
                }
            });
        });
    });

    const config = {
        attributes: false,
        childList: true,
        subtree: true,  // Will watch all descendants of the target
    };

    const targetNode = document.querySelector("body");

    observer.observe(targetNode, config);

    // add reset button
    const resetButton = document.createElement("button")
    // maybe have an alert are u sure
    // this is also why. if the user resets their preferences the preference should still exist on the server for our data collection
    resetButton.onclick = () => {
        multishotPrompt = []
        localStorage.setItem(MULTISHOT_PROMPT_KEY, JSON.stringify(multishotPrompt));
        systemPrompt = DEFAULT_SYSTEM_PROMPT;
        localStorage.setItem(SYSTEM_PROMPT_KEY, systemPrompt);
        checkall();
    }
    resetButton.className = "reset-button"
    resetButton.innerHTML = "reset all preferences"
    document.body.appendChild(resetButton)

    // check all tweets on page load
    checkall();
}

start();

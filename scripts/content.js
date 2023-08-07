const SYSTEM_PROMPT_KEY = "system-prompt";
const MULTISHOT_PROMPT_KEY = "multishot-prompt";

const DEFAULT_SYSTEM_PROMPT = `Given the following preferences, mark Tweets as either PASS or FILTER, where filtered Tweets will be removed from the user's feed.\n\nPreferences:\n- like: big news about physics\n- dislike: non-substantive content, opinions/questions\n- like: posts sharing ai research papers\n- dislike: nearly anything cryptocurrency related, unless it's particularly interesting from a mathematics or cryptography perspective\n- err on the side of passing posts that don't have enough context\n- filter posts that are social in essence, about someone's personal life\n- in general, if you don't learn anything new about actual things in the world from a tweet, it should be filtered. For example, "this is going to be the most chaotic decade in human history" doesn't actually contain any substative information.\n- No rhetorical question tweets.\n- no promotional tweets\n- nothing that seems like a clickbaity list, i.e. "THESE 5 SIMPLE TRICKS WILL MAKE YOU LITTERALLY MAGIC"`;

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
    }
    resetButton.className = "reset-button"
    resetButton.innerHTML = "reset all preferences"
    document.body.appendChild(resetButton)

    // check all tweets on page load
    checkall();
}

start();

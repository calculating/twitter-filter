function checkall() {
    checkedTweets = {}
    document.querySelectorAll('[role="article"]').forEach((article) => {
        article.style.backgroundColor = '';
        processTweet(article);
    });
}

function feedback(newpref) {
    systemPrompt += '\n- ' + newpref;
    localStorage.setItem('systemprompt', systemPrompt);
    checkall();
}

function addMultishotPrompt(newpref) {
    multishotPrompt.push(newpref)
    localStorage.setItem('multishotprompt', JSON.stringify(multishotPrompt));
    checkall();
}

function waitForAndFocusElement(querySelector) {
    const input = document.querySelector(querySelector);
    if (input) {
        input.focus();
    } else {
        setTimeout(function () {
            waitForAndFocusElement(querySelector);
        }, 100);
    }
};

const getUsername = () => document.querySelector('nav[aria-label="Primary"] a:nth-child(9)').href.match(/\w*$/)[0]

// svg from heroicons.com
const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" />
</svg>`

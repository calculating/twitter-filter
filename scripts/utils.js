function waitForAndFocusElement(querySelector) {
    const input = document.querySelector(querySelector);
    if (input) {
        input.focus();
    } else {
        setTimeout(function() {
            waitForAndFocusElement(querySelector);
        }, 100);
    }
};
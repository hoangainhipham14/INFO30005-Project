/* displays an animation at the end of waitString() while waiting for an event
 * Assign the output of start() to a variable
 * When that event has occured, call end() with that variable
 */

const start = (waitString) => {
    let anim = ['|', '/', '-', '\\'];
    let i = 0;  // anim counter

    return setInterval(() => {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        i = (i + 1) % 4;
        process.stdout.write(waitString + anim[i]);  // write text
    }, 300);
}

const end = (animation) => {
    clearInterval(animation);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
}

module.exports = {
    start,
    end
}

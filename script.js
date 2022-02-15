let [targetWords, dictionary] = [[], []];

document.addEventListener("DOMContentLoaded", async function () {
  targetWords = await fetch("./data/targetWords.json").then((res) =>
    res.json()
  );
  dictionary = await fetch("./data/dictionary.json").then((res) => res.json());

  // default 1 word length
  const WORD_LENGTH = 5;

  // default flip animation duration
  const FLIP_ANIMATION_DURATION = 500;

  // default dance animation duration
  const DANCE_ANIMATION_DURATION = 500;

  // keyboard dom
  const keyboard = document.querySelector("[data-keyboard]");

  // alert container dom
  const alertContainer = document.querySelector("[data-alert-container]");

  // guess grid dom
  const guessGrid = document.querySelector("[data-guess-grid]");

  // get/set new target word everyday
  const offsetFromDate = new Date(2022, 0, 1);
  const msOffset = Date.now() - offsetFromDate;
  const dayOffset = msOffset / 1000 / 60 / 60 / 24;
  const targetWord = targetWords[Math.floor(dayOffset)];

  // calling start interaction
  startInteraction();

  // start interaction
  function startInteraction() {
    document.addEventListener("click", handleMouseClick);
    document.addEventListener("keydown", handleKeyPress);
  }

  // stop interaction
  function stopInteraction() {
    document.removeEventListener("click", handleMouseClick);
    document.removeEventListener("keydown", handleKeyPress);
  }

  // mouse click handler
  function handleMouseClick(e) {
    // a-z
    if (e.target.matches("[data-key]")) {
      pressKey(e.target.dataset.key);
      return;
    }

    // enter key
    if (e.target.matches("[data-enter]")) {
      submitGuess();
      return;
    }

    // delete key
    if (e.target.matches("[data-delete]")) {
      deleteKey();
      return;
    }
  }

  // keyboard press handler
  function handleKeyPress(e) {
    // enter keypress
    if (e.key === "Enter") {
      submitGuess();
      return;
    }

    // backspace or delete keypress
    if (e.key === "Backspace" || e.key === "Delete") {
      deleteKey();
      return;
    }

    // a-z keypress
    if (e.key.match(/^[a-z]/)) {
      pressKey(e.key);
      return;
    }
  }

  // a-z press handler
  function pressKey(key) {
    const activeTiles = getActiveTiles();
    if (activeTiles.length >= WORD_LENGTH) return;
    const nextTile = guessGrid.querySelector(":not([data-letter])");
    nextTile.dataset.letter = key.toLowerCase();
    nextTile.textContent = key;
    nextTile.dataset.state = "active";
  }

  // delete handler
  function deleteKey() {
    const activeTiles = getActiveTiles();
    const lastTile = activeTiles[activeTiles.length - 1];
    if (lastTile == null) return;
    lastTile.textContent = "";
    delete lastTile.dataset.state;
    delete lastTile.dataset.letter;
  }

  // enter handler
  function submitGuess() {
    const activeTiles = [...getActiveTiles()];
    if (activeTiles.length !== WORD_LENGTH) {
      showAlert("Not enough letters", 700);
      shakeTiles(activeTiles);
      return;
    }

    // guess handler
    const guess = activeTiles.reduce((word, tile) => {
      return word + tile.dataset.letter;
    }, "");

    if (!dictionary.includes(guess)) {
      showAlert("Not in word list");
      shakeTiles(activeTiles);
      return;
    }

    stopInteraction();
    activeTiles.forEach((...params) => flipTile(...params, guess));
  }

  function flipTile(tile, index, array, guess) {
    const letter = tile.dataset.letter;
    const key = keyboard.querySelector(`[data-key="${letter}"i]`);
    setTimeout(() => {
      tile.classList.add("flip");
    }, (index * FLIP_ANIMATION_DURATION) / 2);

    tile.addEventListener(
      "transitionend",
      () => {
        tile.classList.remove("flip");
        if (targetWord[index] === letter) {
          tile.dataset.state = "correct";
          key.classList.add("correct");
        } else if (targetWord.includes(letter)) {
          tile.dataset.state = "wrong-location";
          key.classList.add("wrong-location");
        } else {
          tile.dataset.state = "wrong";
          key.classList.add("wrong");
        }

        if (index === array.length - 1) {
          tile.addEventListener(
            "transitionend",
            () => {
              startInteraction();
              checkWinLose(guess, array);
            },
            { once: true }
          );
        }
      },
      { once: true }
    );
  }

  // count entered letters
  function getActiveTiles() {
    return guessGrid.querySelectorAll('[data-state="active"]');
  }

  // show alert if word length is not appropriate
  function showAlert(message, duration = 1000) {
    const alert = document.createElement("div");
    alert.textContent = message;
    alert.classList.add("alert");
    alertContainer.prepend(alert);

    if (duration == null) return;
    setTimeout(() => {
      alert.classList.add("hide");
      alert.addEventListener("transitionend", () => {
        alert.remove();
      });
    }, duration);
  }

  // shake tiles if word length not match
  function shakeTiles(tiles) {
    tiles.forEach((tile) => {
      tile.classList.add("shake");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("shake");
        },
        { once: true }
      );
    });
  }

  function checkWinLose(guess, tiles) {
    if (guess === targetWord) {
      showAlert("You win!", 5000);
      danceTiles(tiles);
      stopInteraction();
      return;
    }

    const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
    if (remainingTiles.length === 0) {
      showAlert(targetWord.toUpperCase(), null);
      stopInteraction();
    }
  }

  function danceTiles(tiles) {
    tiles.forEach((tile, index) => {
      setTimeout(() => {
        tile.classList.add("dance");
        tile.addEventListener(
          "animationend",
          () => {
            tile.classList.remove("dance");
          },
          { once: true }
        );
      }, (index * DANCE_ANIMATION_DURATION) / 5);
    });
  }
});

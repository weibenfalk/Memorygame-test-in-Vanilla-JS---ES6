// vanilla Javascript Memory Game v 0.5
// by Thomas Weibenfalk - 2018

/**
 * Class that manages the file selection for the images that are used for the memory cards.
 */
class ImageSelector {

   /**
    * Create a new image selector component. The created is a HTMLElement that can be added     * to the DOM-tree.
    *
    * @param {function} listener a listener function that will be called when images has been
    * selected.
    * @return {HTMLElement} the created image selector.
    */

    static createImageSelector(listener) {
        let imageSelector = new ImageSelector(listener);
        return imageSelector.createSelectorButton();
    }

    //////////////////////////////////////////////////////////////////////////////
    // "Private" methods.
    //////////////////////////////////////////////////////////////////////////////

   /**
    * Constructor.
    *
    * @param {function} listener a listener function that will be called when images has been
    * selected.
    */

    constructor(listener) {
        this.imageArray = [];
        this.listener = listener;
    }

   /**
    * Create an image selector.
    *
    * @return {HTMLElement} the created image selector.
    */
    createSelectorButton () {
        return ViewManager.createView('input', ['fileselect'], [['type', 'file'],
        ['multiple', 'true'], ['accept', 'image/*']], undefined, true, 'change',
        (e) => this.onImagesSelected(e));
    }

   /**
    * Called when the user has selected one or more files.
    *
    * @param {Event} e the generated event containing the files.
    */
    onImagesSelected(e) {
         let files = e.target.files;
        if (files && files[0]) {
            for (let i = 0; i < files.length; i++) {
                // This check should not be neccessary as only images are accepted, but why not.
                if (!files[i].type.startsWith('image/')) continue;
                    this.imageArray[i] = this.imagesToArray(files[i], i);
            }
            Promise.all(this.imageArray).then( values => {
                // Notify the client that images has been selected.
                this.listener(values);
            });
        }
    }

   /**
    * Read the images and add them into an array.
    *
    * @param {File} file the file input.
    * @param {number} count the number of files.
    *
    * @return {Promise<object>} a promise of the read images.
    */
    imagesToArray(file, count) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.addEventListener("loadend", (e) => {
                resolve(e.target.result);
            });
            reader.onerror = error => reject(error);
        });
    }
}

/**
 * Class for every individual Memory card
 */
class MemoryCard {
    constructor() {
        this.id = '';
        this.imagePath = '';
        this.matchId = '';
        this.status = 0; // 0=hidden, 1=shown, 2=match
    }
}

/**
 * The memory game class
 */
class Memory {
    constructor(){
        this.imageSelect = new ImageSelector(this.fillCardsArray, this);
        this.cards = [];
        this.container = document.querySelector('.memory');
        this.cardDeckWrapper = document.querySelector('.cards');
        this.clickable = true;
        this.showTime = 1 // Secs the cards will be shown
        this.turn = 0;

        // To implement: Reset everything when game won, Timer, Select between own images or use default
    }

   /**
    * Start the memory game.
    */
    start() {
        this.turn = 0;
        this.imageSelector = ImageSelector.createImageSelector(res => {
            this.imageSelector.remove();
            this.fillCardsArray(res);
        });
        document.querySelector('.file-upload').appendChild(this.imageSelector);
    }

   /**
    * Fill up the card Array
    * @property {id} string the generated unique card ID.
    * @property {imagePath} string the image URL
    * @property {matchID} string the matching card ID
    * @property {status} integer 0 = hidden card, 1 = shown card, 2 = paired card
    */
    fillCardsArray(cards) {
        let cardId = 0;
        for (let i = 0; i < cards.length; i++) {
            // Double up the cards as we need pairs
            for (let j = 0; j < 2; j++){
                let card = new MemoryCard();
                card.id = 'card' + cardId;
                card.imagePath = cards[i];
                card.matchId = (j === 0) ? 'card' + (cardId + 1) : 'card' + (cardId - 1);
                card.status = 0;

                this.cards.push(card);
                cardId++;
            }
        }
        this.initCardBoard(this.cards);
    }

   /**
    * Initialize the card board.
    *
    * @param {Array} imageArray an image array.
    */
    initCardBoard(imageArray) {
        document.querySelector('.file-upload').remove();
        // Shuffle the cards
        //let shuffledCards = cards.sort(() => Math.random() - 0.5);
        let shuffledCards = shuffleArray(imageArray);

        for (let i = 0; i < shuffledCards.length; i++) {
            let bootstrapWrapper = ViewManager.createView('div', ['col-md-3']);
            let cardContainer = ViewManager.createView('div', ['cardcontainer']);
            ViewManager.createView('img', [`${shuffledCards[i].id}`, `card`, `back`], [['src', shuffledCards[i].imagePath], ['draggable', false]], cardContainer);
            ViewManager.createView('img', [`${shuffledCards[i].id}`, `card`, `front`], [['src', 'img/sw_card_back.jpg'], ['draggable', false]], cardContainer);

            bootstrapWrapper.appendChild(cardContainer);
            this.cardDeckWrapper.appendChild(bootstrapWrapper);
        }

        this.cardDeckWrapper.addEventListener('click', (e) => {this.onCardClicked(e)});
    }

   /**
    * Called when an card has been clicked.
    *
    * @param {Event} e the click event.
    */
    onCardClicked(e) {
        if  (e.target.classList.contains('card')) {
            this.gameState(e.target);
        }
    }

   /**
    * Update the game state.
    *
    * @param {HTMLElement} card the card element.
    */
    gameState(card) {
        // Get the classname of the clicked card - aka ID
        let cardId = card.className.split(' ')[0];

        // Find the clicked card in the card array
        let activeCard = this.cards.find( card => card.id === cardId);

        if (this.clickable && activeCard.status !== 2) {

            // Flip the card
            this.flipCard(cardId);

            // Check if any other card is shown
            let matchCard = this.cards.find( card => card.status === 1);

            // If another card is shown - means we are at turn 2
            if (matchCard) {
                // Matching pair
                if (matchCard.matchId === cardId){
                    activeCard.status = 2;
                    matchCard.status = 2;
                // No matching pair. Reset the cards status and hide them
                } else {
                    activeCard.status = 0;
                    matchCard.status = 0;
                    this.clickable = false;
                    setTimeout( () => {
                        this.flipCard(cardId);
                        this.flipCard(matchCard.id);
                        this.clickable = true;
                    }, this.showTime * 1000);
                }

                // Update turn
                this.turn++;
                this.updateTurn(this.turn);

                // Check if all pairs is matched and the game is won
                if (this.cards.every( card => card.status === 2)) {
                    console.log('the end');
                }

            // No other card has status 1 shown - means we are at turn 1
            } else {
                activeCard.status = 1;
            }
        }
    }

   /**
    * Update the turn display
    *
    * @param {integer} turn the current turn.
    */
    updateTurn(turn) {
        let turnDisplay = document.querySelector('.turn');
        turnDisplay.innerHTML = `Turn: ${turn}`;
    }

   /**
    * Flip the card back and forth
    *
    * @param {cardclass} card The current card that is being flipped
    */
    flipCard(card) {
        let cards = document.querySelectorAll(`.${card}`);

        for (let card of cards) {
            card.classList.toggle('flipped');
        }
    }
}

/**
 * View manager used for interacting with DOM tree.
 *
 * TODO Move more of the view manipulation here.
 */
class ViewManager {

  /**
   * Create a new view. If a parent is provided, the view will be appended as a child
   * to that parent.
   *
   * @param {*} type TODO Add description here
   * @param {*} classNames TODO Add description here
   * @param {*} attributes TODO Add description here
   * @param {*} parent TODO Add description here
   * @param {*} eventlistener TODO Add description here
   * @param {*} eventtype TODO Add description here
   * @param {*} eventcallback TODO Add description here
   *
   * @return the created UI element or the parent if such was provided.
   */
    static createView(type, classNames, attributes, parent, eventlistener, eventtype,
        eventcallback) {
        let element = document.createElement(type);

        if (classNames) {
            for (let cls of classNames) {
                element.classList.add(cls);
            }
        }
        if (attributes) {
            for (let attr of attributes) {
                element.setAttribute(attr[0], attr[1]);
            }
        }
        if (eventlistener) {
            element.addEventListener(eventtype, eventcallback);
        }
        if (parent) {
            parent.appendChild(element);
        } else {
            return element;
        }
    }
}

// fully random by @BetonMAN
function shuffleArray (arr) {
        return arr
          .map(a => [Math.random(), a])
          .sort((a, b) => a[0] - b[0])
          .map(a => a[1]);
}

// Start the game here
document.addEventListener("DOMContentLoaded", () => {
    let memory = new Memory();
    memory.start();
});
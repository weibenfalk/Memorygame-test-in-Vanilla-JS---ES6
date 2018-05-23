// vanilla Javascript Memory Game v 0.2
// by Thomas Weibenfalk - 2018

class SelectImages {
    constructor(callback, caller) {
        this.imageArray = [];
        this.callback = callback;
        this.caller = caller;
    }

    makeSelectButton () {
        return createUIElement('input',['fileselect'], [['type', 'file'], ['multiple', 'true']],
        '', true, 'change', (e) => this.selectedImages(e));
    }

    selectedImages(e) {
         let files = e.target.files;
        if (files && files[0]) {
            for (let i = 0; i < files.length; i++) {
                // If not an image skip this iteration.
                if (!files[i].type.startsWith('image/')) continue;
                    this.imageArray[i] = this.imagesToArray(files[i], i);
            }
            Promise.all(this.imageArray).then( values => {
                this.callback(values, this.caller);
            });
        }
    }

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

class MemoryCard {
    constructor() {
        this.id = '';
        this.imagePath = '';
        this.matchId = '';
        this.status = 0; // 0=hidden, 1=shown, 2=match
    }
}

class Memory {
    constructor(){
        this.imageSelect = new SelectImages(this.fillCardsArray, this);
        this.uiUpdate = new MemoryUI();
        this.cards = [];
        this.memoryWrapper = document.querySelector('.memory');
        this.clickable = true;
        this.showTime = 1 // Secs the cards will be shown
        this.turn = 0;

        // To implement: Reset everything when game won, Timer, Select between own images or use default
    }

    start() {
        this.turn = 0;
        let inputBtn = this.imageSelect.makeSelectButton();
        document.querySelector('.file-upload').appendChild(inputBtn);
    }

    fillCardsArray(cards, caller) {
        let cardId = 0;
        for (let i = 0; i < cards.length; i++) {
            // Double up the cards as we need pairs
            for (let j = 0; j < 2; j++){
                let card = new MemoryCard();
                card.id = 'card' + cardId;
                card.imagePath = cards[i];
                card.matchId = (j === 0) ? 'card' + (cardId + 1) : 'card' + (cardId - 1);
                card.status = 0;

                caller.cards.push(card);
                cardId++;
            }
        }
        caller.uiUpdate.initCardBoard(caller.cards, caller);
    }

    imgClick(e) {
        // Do something when clicked on a card, nothing else
        if  (e.target.classList.contains('card')) {
            this.gameState(e.target);
        }
    }

    gameState(clickedCard) {
        // Get the classname of the clicked card - aka ID
        let cardId = clickedCard.className.split(' ')[0];

        // Find the clicked card in the card array
        let activeCard = this.cards.find( card => card.id === cardId);

        if (this.clickable && activeCard.status !== 2) {

            // Flip the card
            this.uiUpdate.flipCard(cardId);

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
                        this.uiUpdate.flipCard(cardId);
                        this.uiUpdate.flipCard(matchCard.id);
                        this.clickable = true;
                    }, this.showTime * 1000);
                }

                // Update turn
                this.turn++;
                this.uiUpdate.updateTurn(this.turn);

                // Check if all pair is matched and the game is won
                if (this.cards.every( card => card.status === 2)) {
                    console.log('the end');
                }

            // No other card has status 1 shown - means we are at turn 1
            } else {
                activeCard.status = 1;
            }
        }
    }
}

class MemoryUI {
    constructor() {
        this.cardDeckWrapper = document.querySelector('.cards');
    }

    initCardBoard(cards, caller) {
        document.querySelector('.fileselect').remove();
        // Shuffle the cards
        let shuffledCards = cards.sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffledCards.length; i++) {
            let bootstrapWrapper = createUIElement('div', ['col-md-3']);
            let cardContainer = createUIElement('div', ['cardcontainer']);
            createUIElement('img', [`${shuffledCards[i].id}`, `card`, `back`], [['src', shuffledCards[i].imagePath], ['draggable', false]], cardContainer);
            createUIElement('img', [`${shuffledCards[i].id}`, `card`, `front`], [['src', 'img/sw_card_back.jpg'], ['draggable', false]], cardContainer);

            bootstrapWrapper.appendChild(cardContainer);
            this.cardDeckWrapper.appendChild(bootstrapWrapper);
        }

        this.cardDeckWrapper.addEventListener('click', (e) => {caller.imgClick(e)});
    }

    updateTurn(turn) {
        let turnDisplay = document.querySelector('.turn');
        turnDisplay.innerHTML = `Turn: ${turn}`;
    }

    flipCard(card) {
        let cards = document.querySelectorAll(`.${card}`);

        for (let card of cards) {
            card.classList.toggle('flipped');
        }
    }
}

// Helper functions
function createUIElement(type, classNames, attributes, container, eventlistener, eventtype, eventcallback) {
    let element = document.createElement(type);
    if (classNames) {
        for (let cls of classNames) {
            element.classList.add(cls);
        }
    }
    if (attributes) {
        for (attr of attributes) {
            element.setAttribute(attr[0], attr[1]);
        }
    }
    if (eventlistener) {
        element.addEventListener(eventtype, eventcallback);
    }
    if (container) {
        container.appendChild(element);
    } else {
        return element;
    }
}

// Start the game here
let memory = new Memory();
memory.start();
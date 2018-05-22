
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
    }

    start() {
        let inputBtn = this.imageSelect.makeSelectButton();
        this.memoryWrapper.appendChild(inputBtn);
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
        if (this.clickable) {
            this.gameState(e.target);
        }
    }

    gameState(clickedCard) {
        let cardId = clickedCard.className.split(' ')[0];
        this.uiUpdate.fadeOutCard(`.${cardId}`);

        // Find the clicked card in the card array
        let activeCard = this.cards.find( (card) => card.id === cardId);

        // Check if any other card is shown
        let matchCard = this.cards.find( (card) => card.status === 1);

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
                    this.uiUpdate.fadeInCard([`.${cardId}`, `.${matchCard.id}`]);
                    this.clickable = true;
                }, this.showTime * 1000);

            }
        // No other card has status 1 shown - means we are at turn 1
        } else {
            activeCard.status = 1;
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
            let cardContainer = createUIElement('div', ['cardcontainer', 'col-md-3']);
            createUIElement('img', [`${shuffledCards[i].id}`], [['src', shuffledCards[i].imagePath]], cardContainer);
            createUIElement('img', [`${shuffledCards[i].id}`, `cardback`], [['src', 'img/sw_card_back.jpg']], cardContainer);
            this.cardDeckWrapper.appendChild(cardContainer);
        }

        this.cardDeckWrapper.addEventListener('click', (e) => {caller.imgClick(e)});
    }

    fadeOutCard(card) {
        document.querySelector(`${card}.cardback`).style.opacity = 0;
    }

    fadeInCard(cards) {
        console.log(cards);
        for ( let card of cards) {
            document.querySelector(`${card}.cardback`).style.opacity = 1;
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

class SelectImages {
    constructor(callback) {
        this.imageArray = [];
        this.container = document.querySelector('.memory');
        this.callback = callback;
    }

    makeSelectButton () {
        let inputBtn =  createUIElement('input',['fileselect'], [['type', 'file'], ['multiple', 'true']],
        this.container, true, 'change', (e) => this.selectedImages(e));
    }

    selectedImages(e) {
         let files = e.target.files;
        if (files && files[0]) {
            for (let i = 0; i < files.length; i++) {
                if (!files[i].type.startsWith('image/')) continue; // If not an image skip this iteration.
                    this.imageArray[i] = this.imagesToArray(files[i], i);
            }
            Promise.all(this.imageArray).then( values => {
                this.callback(values); // Send the images to the class that draws the cardboard
            });
        }
    }

    imagesToArray(file, count) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.addEventListener("loadend", (e) => {
                resolve({img: e.target.result, pair: `pair${count}`});
            });
            reader.onerror = error => reject(error);
        });
    }

    get imgArray() {
        return this.imageArray;
    }
}

class Memory {
    constructor() {
        this.imageSelect = new SelectImages(this.initCardBoard);

        this.container = document.querySelector('.cards');

        this.activeCard = "";
        this.pairShowTime = 1; // in seconds
        this.turn = 0;
		//this._pairCount = this._cardWrapper.children().length / 2;
		this.clickable = true;
    }

    start() {
        this.imageSelect.makeSelectButton();
    }

    imgClick(e) {
        if(this.clickable && this.activeCard !== e.target &&
        e.target.classList.contains('cardback') && !e.target.classList.contains('matched')) {
            console.log('Clicking');
            this.fadeOutCard(e.target);
            this.calcGameState(e.target);
        }
    }

    calcGameState(card) {
        if (this.turn === 2) {
            // We have a mathing pair
            if (card.className === this.activeCard.className) {
                console.log('Turn 2 - Matching pair!');
                this.activeCard.classList.add('matched'); // For not possible to click on mathed pairs.
                card.classList.add('matched');
                this.activeCard = '';
            } else {
                console.log('Turn 2 - No match!');
                this.clickable = false;
                setTimeout( () => {
                    this.fadeInCard([card, this.activeCard]);
                    this.activeCard = '';
                    this.clickable = true;
                    console.log('timeout');
                }, this.pairShowTime * 1000);
            }
            this.turn = 1;
        } else {
            this.activeCard = card;
            this.turn = 2;
        }
    }

    initCardBoard(imageArray) {
        // Double up as we need pairs
        let arrayLength = imageArray.length;
        for(let i = 0; i < arrayLength; i++) {
            imageArray.push(imageArray[i]);
        }
        // Shuffle the images
        imageArray.sort(() => Math.random() - 0.5);

        document.querySelector('.fileselect').remove();
        for (let i = 0; i < imageArray.length; i++) {
            let cardContainer = createUIElement('div', ['cardcontainer', 'col-md-3']);
            createUIElement('img', [`${imageArray[i].pair}`], [['src', imageArray[i].img]], cardContainer);
            createUIElement('img', [`${imageArray[i].pair}`, `cardback`], [['src', 'img/sw_card_back.jpg']], cardContainer);
            this.container.appendChild(cardContainer);
        }

        this.container.addEventListener('click', (e) => {memory.imgClick(e)});
    }

    fadeOutCard(card) {
        card.style.opacity = 0;
    }

    fadeInCard(cards) {
        for ( let card of cards) {
            card.style.opacity = 1;
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


// ============================================
// KENT STOP ONLINE
// app.js — Card Dealing Version
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// ============================================
// FIREBASE
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyBXjRjAV1o_zBf64ej_sTvJDiQs70bUx4I",
    authDomain: "kentstop.firebaseapp.com",
    databaseURL: "https://kentstop-default-rtdb.firebaseio.com/",
    projectId: "kentstop",
    storageBucket: "kentstop.firebasestorage.app",
    messagingSenderId: "441294086154",
    appId: "1:441294086154:web:a8cb923eb81a969baafff3",
    measurementId: "G-TCTYQQYM4P"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log("🔥 Kent Stop Firebase-ը միացված է");


// ============================================
// DOM
// ============================================

const homePage = document.getElementById("homePage");
const lobbyPage = document.getElementById("lobbyPage");
const gamePage = document.getElementById("gamePage");

const nicknameInput = document.getElementById("nickname");
const roomCodeInput = document.getElementById("roomCode");

const createGameBtn = document.getElementById("createGameBtn");
const joinGameBtn = document.getElementById("joinGameBtn");

const errorMessage = document.getElementById("errorMessage");

const displayRoomCode =
    document.getElementById("displayRoomCode");

const gameRoomCode =
    document.getElementById("gameRoomCode");

const playersList =
    document.getElementById("playersList");

const playerCount =
    document.getElementById("playerCount");

const copyCodeBtn =
    document.getElementById("copyCodeBtn");

const startGameBtn =
    document.getElementById("startGameBtn");

const leaveGameBtn =
    document.getElementById("leaveGameBtn");

const lobbyMessage =
    document.getElementById("lobbyMessage");

const myPlayerName =
    document.getElementById("myPlayerName");

const cardsArea =
    document.getElementById("cardsArea");


// ============================================
// GAME VARIABLES
// ============================================

let currentRoomCode = "";
let currentPlayerId = "";
let currentPlayerName = "";

let unsubscribeRoom = null;


// ============================================
// CARD DECK
// ============================================

const suits = [
    "♠",
    "♥",
    "♦",
    "♣"
];

const values = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K"
];


function createDeck() {

    const deck = [];

    for (const suit of suits) {

        for (const value of values) {

            deck.push({
                id: `${value}${suit}`,
                suit: suit,
                value: value
            });

        }
    }

    return deck;
}


// ============================================
// SHUFFLE
// ============================================

function shuffleDeck(deck) {

    const shuffled = [...deck];

    for (
        let i = shuffled.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            shuffled[i],
            shuffled[j]
        ] = [
            shuffled[j],
            shuffled[i]
        ];
    }

    return shuffled;
}


// ============================================
// GENERATE PLAYER ID
// ============================================

function generatePlayerId() {

    return (
        "player_" +
        crypto.randomUUID()
    );
}


// ============================================
// GENERATE ROOM CODE
// ============================================

function generateRoomCode() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code += chars[
            Math.floor(
                Math.random() *
                chars.length
            )
        ];

    }

    return code;
}


// ============================================
// PAGE
// ============================================

function showPage(page) {

    homePage.classList.add("hidden");
    lobbyPage.classList.add("hidden");
    gamePage.classList.add("hidden");

    page.classList.remove("hidden");
}


// ============================================
// ERROR
// ============================================

function showError(message) {

    errorMessage.textContent =
        message;
}


function clearError() {

    errorMessage.textContent = "";
}


// ============================================
// NICKNAME
// ============================================

function getNickname() {

    const nickname =
        nicknameInput.value.trim();

    if (!nickname) {

        showError(
            "Գրիր քո մականունը։"
        );

        nicknameInput.focus();

        return null;
    }

    if (nickname.length < 2) {

        showError(
            "Մականունը պետք է լինի առնվազն 2 նիշ։"
        );

        return null;
    }

    return nickname;
}


// ============================================
// SAVE SESSION
// ============================================

function saveSession() {

    localStorage.setItem(
        "kentStopRoomCode",
        currentRoomCode
    );

    localStorage.setItem(
        "kentStopPlayerId",
        currentPlayerId
    );

    localStorage.setItem(
        "kentStopPlayerName",
        currentPlayerName
    );
}


// ============================================
// CREATE GAME
// ============================================

async function createGame() {

    clearError();

    const nickname =
        getNickname();

    if (!nickname) return;

    createGameBtn.disabled = true;
    createGameBtn.textContent =
        "⏳ Ստեղծվում է...";

    try {

        let roomCode = "";

        for (let i = 0; i < 10; i++) {

            const testCode =
                generateRoomCode();

            const snapshot =
                await get(
                    ref(
                        database,
                        `rooms/${testCode}`
                    )
                );

            if (!snapshot.exists()) {

                roomCode = testCode;

                break;
            }
        }

        if (!roomCode) {
            throw new Error(
                "Room code creation failed"
            );
        }


        currentRoomCode =
            roomCode;

        currentPlayerId =
            generatePlayerId();

        currentPlayerName =
            nickname;


        const roomData = {

            status: "waiting",

            hostId:
                currentPlayerId,

            createdAt:
                Date.now(),

            players: {

                [currentPlayerId]: {

                    id:
                        currentPlayerId,

                    name:
                        currentPlayerName,

                    ready:
                        true,

                    joinedAt:
                        Date.now()

                }

            }

        };


        await set(
            ref(
                database,
                `rooms/${roomCode}`
            ),
            roomData
        );


        saveSession();

        openLobby();

    } catch (error) {

        console.error(
            "Create game error:",
            error
        );

        showError(
            "Խաղը ստեղծել չհաջողվեց։"
        );

    } finally {

        createGameBtn.disabled =
            false;

        createGameBtn.textContent =
            "🏠 Ստեղծել խաղ";
    }
}


// ============================================
// JOIN GAME
// ============================================

async function joinGame() {

    clearError();

    const nickname =
        getNickname();

    if (!nickname) return;


    const roomCode =
        roomCodeInput.value
            .trim()
            .toUpperCase();


    if (roomCode.length !== 6) {

        showError(
            "Գրիր 6 նիշանոց խաղի կոդը։"
        );

        return;
    }


    joinGameBtn.disabled = true;

    joinGameBtn.textContent =
        "⏳ Միանում է...";


    try {

        const roomRef =
            ref(
                database,
                `rooms/${roomCode}`
            );


        const snapshot =
            await get(roomRef);


        if (!snapshot.exists()) {

            showError(
                "❌ Այդ խաղը չի գտնվել։"
            );

            return;
        }


        const room =
            snapshot.val();


        if (room.status !== "waiting") {

            showError(
                "❌ Խաղն արդեն սկսվել է։"
            );

            return;
        }


        const players =
            Object.values(
                room.players || {}
            );


        if (players.length >= 4) {

            showError(
                "❌ Խաղը լիքն է։"
            );

            return;
        }


        currentRoomCode =
            roomCode;

        currentPlayerId =
            generatePlayerId();

        currentPlayerName =
            nickname;


        await set(
            ref(
                database,
                `rooms/${roomCode}/players/${currentPlayerId}`
            ),
            {

                id:
                    currentPlayerId,

                name:
                    currentPlayerName,

                ready:
                    true,

                joinedAt:
                    Date.now()

            }
        );


        saveSession();

        openLobby();

    } catch (error) {

        console.error(
            "Join game error:",
            error
        );

        showError(
            "Միանալ չհաջողվեց։"
        );

    } finally {

        joinGameBtn.disabled =
            false;

        joinGameBtn.textContent =
            "🔑 Միանալ խաղին";
    }
}


// ============================================
// OPEN LOBBY
// ============================================

function openLobby() {

    showPage(lobbyPage);

    displayRoomCode.textContent =
        currentRoomCode;

    gameRoomCode.textContent =
        currentRoomCode;

    myPlayerName.textContent =
        currentPlayerName;

    listenToRoom();
}


// ============================================
// LISTEN ROOM
// ============================================

function listenToRoom() {

    if (unsubscribeRoom) {
        unsubscribeRoom();
    }


    const roomRef =
        ref(
            database,
            `rooms/${currentRoomCode}`
        );


    unsubscribeRoom =
        onValue(
            roomRef,
            snapshot => {

                if (!snapshot.exists()) {

                    showPage(homePage);

                    showError(
                        "Խաղասենյակը փակվել է։"
                    );

                    return;
                }


                const room =
                    snapshot.val();


                updateLobby(room);


                if (
                    room.status ===
                    "playing"
                ) {

                    showGame(room);
                }

            }
        );
}


// ============================================
// UPDATE LOBBY
// ============================================

function updateLobby(room) {

    const players =
        Object.values(
            room.players || {}
        );


    playerCount.textContent =
        `${players.length}/4`;


    playersList.innerHTML =
        "";


    players.forEach(
        (player, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "player-card";


            const avatar =
                document.createElement(
                    "div"
                );

            avatar.className =
                "player-avatar";

            avatar.textContent =
                index === 0
                    ? "👑"
                    : "👤";


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "player-info";


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "player-name";

            name.textContent =
                player.name;


            const status =
                document.createElement(
                    "div"
                );

            status.className =
                "player-status";

            status.textContent =
                index === 0
                    ? "Ստեղծող"
                    : "Միացած է";


            info.appendChild(name);
            info.appendChild(status);

            card.appendChild(avatar);
            card.appendChild(info);

            playersList.appendChild(card);

        }
    );


    const isHost =
        room.hostId ===
        currentPlayerId;


    startGameBtn.style.display =
        isHost
            ? "block"
            : "none";


    if (players.length < 4) {

        lobbyMessage.textContent =
            `Սպասում ենք խաղացողներին... ${players.length}/4`;

        startGameBtn.disabled =
            true;

    } else {

        lobbyMessage.textContent =
            "🔥 Բոլոր 4 խաղացողները միացել են։";

        startGameBtn.disabled =
            false;
    }
}


// ============================================
// DEAL CARDS
// ============================================

async function dealCards(room) {

    const players =
        Object.values(
            room.players || {}
        );


    if (players.length !== 4) {

        console.log(
            "Քարտերը չեն բաժանվել․ պետք է 4 խաղացող։"
        );

        return;
    }


    /*
     * Միայն host-ն է բաժանում քարտերը։
     */

    if (
        room.hostId !==
        currentPlayerId
    ) {

        return;
    }


    /*
     * Եթե քարտերը արդեն բաժանված են,
     * նորից չենք բաժանում։
     */

    if (room.hands) {

        return;
    }


    const deck =
        shuffleDeck(
            createDeck()
        );


    const hands = {};


    players.forEach(
        (player, index) => {

            hands[player.id] =
                deck.slice(
                    index * 4,
                    index * 4 + 4
                );

        }
    );


    /*
     * Պահում ենք քարտերը Firebase-ում։
     */

    await update(
        ref(
            database,
            `rooms/${currentRoomCode}`
        ),
        {
            hands: hands,
            deckRemaining:
                deck.slice(16),
            cardsDealtAt:
                Date.now()
        }
    );


    console.log(
        "🃏 Քարտերը բաժանվեցին!"
    );
}


// ============================================
// START GAME
// ============================================

async function startGame() {

    try {

        const roomRef =
            ref(
                database,
                `rooms/${currentRoomCode}`
            );


        const snapshot =
            await get(roomRef);


        if (!snapshot.exists()) {
            return;
        }


        const room =
            snapshot.val();


        const players =
            Object.values(
                room.players || {}
            );


        if (room.hostId !== currentPlayerId) {

            alert(
                "Միայն ստեղծողը կարող է սկսել խաղը։"
            );

            return;
        }


        if (players.length !== 4) {

            alert(
                "Պետք է լինի 4 խաղացող։"
            );

            return;
        }


        /*
         * Նախ բաժանում ենք քարտերը։
         */

        await dealCards(room);


        /*
         * Հետո փոխում ենք խաղի վիճակը։
         */

        await update(
            roomRef,
            {
                status:
                    "playing"
            }
        );


    } catch (error) {

        console.error(
            "Start game error:",
            error
        );

        alert(
            "Խաղը սկսել չհաջողվեց։"
        );
    }
}


// ============================================
// SHOW GAME
// ============================================

function showGame(room) {

    showPage(gamePage);

    gameRoomCode.textContent =
        currentRoomCode;

    myPlayerName.textContent =
        currentPlayerName;


    /*
     * Գտնում ենք մեր քարտերը։
     */

    const myCards =
        room.hands &&
        room.hands[currentPlayerId];


    renderCards(
        myCards || []
    );
}


// ============================================
// RENDER CARDS
// ============================================

function renderCards(cards) {

    cardsArea.innerHTML = "";


    if (!cards.length) {

        cardsArea.innerHTML = `
            <div style="
                color:#aaa;
                text-align:center;
                padding:20px;
            ">
                Քարտերը բեռնվում են...
            </div>
        `;

        return;
    }


    cards.forEach(card => {

        const cardElement =
            document.createElement(
                "div"
            );


        cardElement.className =
            "game-card";


        /*
         * Սրտերը և խաչերը կարմիր։
         */

        if (
            card.suit === "♥" ||
            card.suit === "♦"
        ) {

            cardElement.style.color =
                "#e53950";

        }


        cardElement.innerHTML = `
            <div style="
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                gap:3px;
                width:100%;
                height:100%;
            ">
                <strong>${card.value}</strong>
                <span>${card.suit}</span>
            </div>
        `;


        cardsArea.appendChild(
            cardElement
        );

    });
}


// ============================================
// COPY CODE
// ============================================

async function copyRoomCode() {

    try {

        await navigator.clipboard.writeText(
            currentRoomCode
        );


        copyCodeBtn.textContent =
            "✅ Պատճենվեց";


        setTimeout(() => {

            copyCodeBtn.textContent =
                "📋 Պատճենել";

        }, 1500);

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );
    }
}


// ============================================
// LEAVE
// ============================================

async function leaveGame() {

    try {

        if (
            currentRoomCode &&
            currentPlayerId
        ) {

            await remove(
                ref(
                    database,
                    `rooms/${currentRoomCode}/players/${currentPlayerId}`
                )
            );
        }

    } catch (error) {

        console.error(
            "Leave error:",
            error
        );
    }


    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }


    localStorage.removeItem(
        "kentStopRoomCode"
    );

    localStorage.removeItem(
        "kentStopPlayerId"
    );

    localStorage.removeItem(
        "kentStopPlayerName"
    );


    currentRoomCode = "";
    currentPlayerId = "";
    currentPlayerName = "";


    showPage(homePage);
}


// ============================================
// BUTTONS
// ============================================

createGameBtn.addEventListener(
    "click",
    createGame
);

joinGameBtn.addEventListener(
    "click",
    joinGame
);

startGameBtn.addEventListener(
    "click",
    startGame
);

leaveGameBtn.addEventListener(
    "click",
    leaveGame
);

copyCodeBtn.addEventListener(
    "click",
    copyRoomCode
);


// ============================================
// ENTER
// ============================================

nicknameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            createGame();
        }

    }
);


roomCodeInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            joinGame();
        }

    }
);


// ============================================
// ROOM CODE INPUT
// ============================================

roomCodeInput.addEventListener(
    "input",
    () => {

        roomCodeInput.value =
            roomCodeInput.value
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ""
                )
                .slice(0, 6);

    }
);


// ============================================
// START
// ============================================

showPage(homePage);

console.log(
    "🎮 Kent Stop Online պատրաստ է!"
);

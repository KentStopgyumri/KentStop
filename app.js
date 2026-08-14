import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
    remove,
    onValue
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


/* ================= FIREBASE ================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyBXjRjAV1o_zBf64ej_sTvJDiQs70bUx4I",

    authDomain:
        "kentstop.firebaseapp.com",

    databaseURL:
        "https://kentstop-default-rtdb.firebaseio.com/",

    projectId:
        "kentstop",

    storageBucket:
        "kentstop.firebasestorage.app",

    messagingSenderId:
        "441294086154",

    appId:
        "1:441294086154:web:a8cb923eb81a969baafff3",

    measurementId:
        "G-TCTYQQYM4P"
};


const app =
    initializeApp(firebaseConfig);

const database =
    getDatabase(app);

console.log("🔥 Firebase connected");


/* ================= DOM ================= */

const homePage =
    document.getElementById("homePage");

const lobbyPage =
    document.getElementById("lobbyPage");

const gamePage =
    document.getElementById("gamePage");


const nickname =
    document.getElementById("nickname");

const roomCode =
    document.getElementById("roomCode");


const createBtn =
    document.getElementById("createGameBtn");

const joinBtn =
    document.getElementById("joinGameBtn");

const startBtn =
    document.getElementById("startGameBtn");

const copyBtn =
    document.getElementById("copyCodeBtn");

const leaveBtn =
    document.getElementById("leaveGameBtn");

const gameLeaveBtn =
    document.getElementById("gameLeaveBtn");


const error =
    document.getElementById("errorMessage");

const displayRoom =
    document.getElementById("displayRoomCode");

const headerRoom =
    document.getElementById("headerRoom");

const gameRoom =
    document.getElementById("gameRoomCode");

const playerName =
    document.getElementById("myPlayerName");

const playerList =
    document.getElementById("playersList");

const playerCount =
    document.getElementById("playerCount");

const lobbyMessage =
    document.getElementById("lobbyMessage");

const cardsArea =
    document.getElementById("cardsArea");

const gamePlayers =
    document.getElementById("gamePlayers");

const tableMessage =
    document.getElementById("tableMessage");

const turnMessage =
    document.getElementById("turnMessage");

const kentBtn =
    document.getElementById("kentBtn");

const stopBtn =
    document.getElementById("stopBtn");


/* ================= STATE ================= */

let currentRoom = "";
let currentPlayer = "";
let currentName = "";

let roomListener = null;

let selectedCard = null;


/* ================= DECK ================= */

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
                id: value + suit,
                value,
                suit
            });

        }
    }

    return deck;
}


function shuffle(deck) {

    const arr =
        [...deck];

    for (
        let i = arr.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            arr[i],
            arr[j]
        ] =
        [
            arr[j],
            arr[i]
        ];
    }

    return arr;
}


/* ================= HELPERS ================= */

function page(page) {

    homePage.classList.add("hidden");
    lobbyPage.classList.add("hidden");
    gamePage.classList.add("hidden");

    page.classList.remove("hidden");
}


function showError(text) {

    error.textContent = text;
}


function clearError() {

    error.textContent = "";
}


function playerId() {

    return (
        "p_" +
        crypto.randomUUID()
    );
}


function roomId() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];
    }

    return code;
}


/* ================= CREATE ================= */

async function createGame() {

    clearError();

    const name =
        nickname.value.trim();

    if (name.length < 2) {

        showError(
            "Գրիր քո անունը։"
        );

        return;
    }


    createBtn.disabled = true;

    try {

        let code = "";

        for (let i = 0; i < 10; i++) {

            const test =
                roomId();

            const snap =
                await get(
                    ref(
                        database,
                        "rooms/" + test
                    )
                );

            if (!snap.exists()) {

                code = test;

                break;
            }
        }


        if (!code) {
            throw new Error(
                "No room"
            );
        }


        currentRoom = code;
        currentPlayer = playerId();
        currentName = name;


        await set(
            ref(
                database,
                "rooms/" + code
            ),
            {

                status: "waiting",

                hostId:
                    currentPlayer,

                createdAt:
                    Date.now(),

                turn: null,

                players: {

                    [currentPlayer]: {

                        id:
                            currentPlayer,

                        name:
                            currentName,

                        joinedAt:
                            Date.now()

                    }

                }

            }
        );


        openLobby();

    } catch (e) {

        console.error(e);

        showError(
            "Խաղը ստեղծել չհաջողվեց։"
        );

    } finally {

        createBtn.disabled =
            false;
    }
}


/* ================= JOIN ================= */

async function joinGame() {

    clearError();

    const name =
        nickname.value.trim();

    const code =
        roomCode.value
            .trim()
            .toUpperCase();


    if (name.length < 2) {

        showError(
            "Գրիր քո անունը։"
        );

        return;
    }


    if (code.length !== 6) {

        showError(
            "Գրիր 6 նիշանոց կոդը։"
        );

        return;
    }


    joinBtn.disabled = true;

    try {

        const roomRef =
            ref(
                database,
                "rooms/" + code
            );


        const snap =
            await get(roomRef);


        if (!snap.exists()) {

            showError(
                "Այդ խաղը չի գտնվել։"
            );

            return;
        }


        const room =
            snap.val();


        const players =
            Object.values(
                room.players || {}
            );


        if (
            room.status !==
            "waiting"
        ) {

            showError(
                "Խաղն արդեն սկսվել է։"
            );

            return;
        }


        if (
            players.length >= 4
        ) {

            showError(
                "Խաղը լիքն է։"
            );

            return;
        }


        currentRoom = code;
        currentPlayer = playerId();
        currentName = name;


        await set(
            ref(
                database,
                `rooms/${code}/players/${currentPlayer}`
            ),
            {

                id:
                    currentPlayer,

                name:
                    currentName,

                joinedAt:
                    Date.now()

            }
        );


        openLobby();

    } catch (e) {

        console.error(e);

        showError(
            "Միանալ չհաջողվեց։"
        );

    } finally {

        joinBtn.disabled =
            false;
    }
}


/* ================= LOBBY ================= */

function openLobby() {

    page(lobbyPage);

    displayRoom.textContent =
        currentRoom;

    headerRoom.textContent =
        currentRoom;

    listenRoom();
}


function listenRoom() {

    if (roomListener) {
        roomListener();
    }


    const roomRef =
        ref(
            database,
            "rooms/" + currentRoom
        );


    roomListener =
        onValue(
            roomRef,
            snap => {

                if (!snap.exists()) {

                    page(homePage);

                    return;
                }


                const room =
                    snap.val();


                renderLobby(room);


                if (
                    room.status ===
                    "playing"
                ) {

                    renderGame(room);
                }

            }
        );
}


/* ================= LOBBY RENDER ================= */

function renderLobby(room) {

    const players =
        Object.values(
            room.players || {}
        );


    playerCount.textContent =
        players.length + "/4";


    playerList.innerHTML =
        "";


    players.forEach(
        (p, index) => {

            playerList.innerHTML += `

                <div class="player-card">

                    <div class="player-avatar">
                        ${index === 0 ? "👑" : "👤"}
                    </div>

                    <div>

                        <div class="player-name">
                            ${escapeHtml(p.name)}
                        </div>

                        <div class="player-status">
                            ${index === 0
                                ? "Խաղի ստեղծող"
                                : "Պատրաստ"}
                        </div>

                    </div>

                </div>

            `;
        }
    );


    const host =
        room.hostId ===
        currentPlayer;


    startBtn.style.display =
        host
            ? "block"
            : "none";


    if (
        players.length < 4
    ) {

        lobbyMessage.textContent =
            `Սպասում ենք խաղացողներին... ${players.length}/4`;

        startBtn.disabled =
            true;

    } else {

        lobbyMessage.textContent =
            "🔥 4 խաղացող պատրաստ են։";

        startBtn.disabled =
            false;
    }
}


/* ================= START ================= */

async function startGame() {

    const snap =
        await get(
            ref(
                database,
                "rooms/" + currentRoom
            )
        );


    if (!snap.exists()) {
        return;
    }


    const room =
        snap.val();


    if (
        room.hostId !==
        currentPlayer
    ) {

        return;
    }


    const players =
        Object.values(
            room.players || {}
        );


    if (players.length !== 4) {

        alert(
            "Պետք է լինի 4 խաղացող։"
        );

        return;
    }


    const deck =
        shuffle(
            createDeck()
        );


    const hands = {};


    players.forEach(
        (p, index) => {

            hands[p.id] =
                deck.slice(
                    index * 4,
                    index * 4 + 4
                );

        }
    );


    /*
     * Առաջին խաղացողը սկսում է։
     */

    const firstPlayer =
        players[0].id;


    await update(
        ref(
            database,
            "rooms/" + currentRoom
        ),
        {

            status:
                "playing",

            hands:
                hands,

            deck:
                deck.slice(16),

            turn:
                firstPlayer,

            startedAt:
                Date.now()

        }
    );


    console.log(
        "🎮 GAME STARTED"
    );
}


/* ================= GAME ================= */

function renderGame(room) {

    page(gamePage);


    gameRoom.textContent =
        currentRoom;

    headerRoom.textContent =
        currentRoom;

    playerName.textContent =
        currentName;


    renderGamePlayers(room);

    renderCards(
        room.hands?.[currentPlayer] ||
        []
    );


    const myTurn =
        room.turn ===
        currentPlayer;


    if (myTurn) {

        tableMessage.textContent =
            "🎴 Քո հերթն է";

        turnMessage.textContent =
            "Ընտրիր քարտ";

    } else {

        const current =
            room.players?.[room.turn];

        tableMessage.textContent =
            "⏳ Խաղը շարունակվում է";

        turnMessage.textContent =
            current
                ? `${current.name}-ի հերթն է`
                : "Սպասում ենք...";
    }
}


/* ================= PLAYERS ================= */

function renderGamePlayers(room) {

    const players =
        Object.values(
            room.players || {}
        );


    gamePlayers.innerHTML =
        "";


    players.forEach(
        p => {

            const active =
                room.turn === p.id
                    ? "active"
                    : "";


            gamePlayers.innerHTML += `

                <div class="game-player ${active}">

                    <div class="game-player-avatar">
                        ${p.id === currentPlayer
                            ? "🙂"
                            : "👤"}
                    </div>

                    <div class="game-player-name">
                        ${escapeHtml(p.name)}
                    </div>

                    ${
                        room.turn === p.id
                            ? `<div class="game-player-turn">
                                ● ՀԵՐԹ
                              </div>`
                            : ""
                    }

                </div>

            `;
        }
    );
}


/* ================= CARDS ================= */

function renderCards(cards) {

    cardsArea.innerHTML =
        "";

    selectedCard = null;


    cards.forEach(
        (card, index) => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "game-card";


            if (
                card.suit === "♥" ||
                card.suit === "♦"
            ) {

                element.style.color =
                    "#e63950";
            }


            element.innerHTML = `

                <div>
                    <strong>
                        ${card.value}
                    </strong>

                    <br>

                    ${card.suit}
                </div>

            `;


            element.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".game-card"
                        )
                        .forEach(
                            c =>
                                c.classList.remove(
                                    "selected"
                                )
                        );


                    element.classList.add(
                        "selected"
                    );


                    selectedCard =
                        card;


                    console.log(
                        "Selected:",
                        card
                    );

                }
            );


            cardsArea.appendChild(
                element
            );

        }
    );
}


/* ================= KENT ================= */

kentBtn.addEventListener(
    "click",
    async () => {

        if (!selectedCard) {

            alert(
                "Նախ ընտրիր քարտ։"
            );

            return;
        }


        const snap =
            await get(
                ref(
                    database,
                    "rooms/" + currentRoom
                )
            );


        if (!snap.exists()) {
            return;
        }


        const room =
            snap.val();


        if (
            room.turn !==
            currentPlayer
        ) {

            alert(
                "Հիմա քո հերթը չէ։"
            );

            return;
        }


        tableMessage.textContent =
            "KENT! 🎉";


        turnMessage.textContent =
            "Հայտարարվեց KENT";


        console.log(
            "KENT:",
            selectedCard
        );
    }
);


/* ================= STOP ================= */

stopBtn.addEventListener(
    "click",
    async () => {

        const snap =
            await get(
                ref(
                    database,
                    "rooms/" + currentRoom
                )
            );


        if (!snap.exists()) {
            return;
        }


        const room =
            snap.val();


        if (
            room.turn ===
            currentPlayer
        ) {

            alert(
                "Քո հերթին STOP չես անում։"
            );

            return;
        }


        tableMessage.textContent =
            "STOP! 🛑";


        turnMessage.textContent =
            "STOP հայտարարվեց";


        console.log(
            "STOP"
        );
    }
);


/* ================= COPY ================= */

copyBtn.addEventListener(
    "click",
    async () => {

        await navigator.clipboard.writeText(
            currentRoom
        );


        copyBtn.textContent =
            "✅ Պատճենվեց";


        setTimeout(
            () => {

                copyBtn.textContent =
                    "📋 Պատճենել";

            },
            1500
        );
    }
);


/* ================= LEAVE ================= */

async function leaveGame() {

    if (
        currentRoom &&
        currentPlayer
    ) {

        await remove(
            ref(
                database,
                `rooms/${currentRoom}/players/${currentPlayer}`
            )
        );
    }


    if (roomListener) {
        roomListener();
        roomListener = null;
    }


    currentRoom = "";
    currentPlayer = "";
    currentName = "";


    page(homePage);
}


leaveBtn.addEventListener(
    "click",
    leaveGame
);


gameLeaveBtn.addEventListener(
    "click",
    leaveGame
);


/* ================= INPUT ================= */

roomCode.addEventListener(
    "input",
    () => {

        roomCode.value =
            roomCode.value
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ""
                )
                .slice(0, 6);
    }
);


nickname.addEventListener(
    "keydown",
    e => {

        if (e.key === "Enter") {
            createGame();
        }

    }
);


roomCode.addEventListener(
    "keydown",
    e => {

        if (e.key === "Enter") {
            joinGame();
        }

    }
);


/* ================= BUTTONS ================= */

createBtn.addEventListener(
    "click",
    createGame
);

joinBtn.addEventListener(
    "click",
    joinGame
);

startBtn.addEventListener(
    "click",
    startGame
);


/* ================= SECURITY ================= */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


/* ================= INIT ================= */

page(homePage);

console.log(
    "🎮 KENT STOP ONLINE READY"
);

// ============================================
// KENT STOP ONLINE
// app.js
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

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

console.log("🔥 Kent Stop Firebase-ը միացված է!");


// ============================================
// ELEMENTS
// ============================================

const homePage = document.getElementById("homePage");
const lobbyPage = document.getElementById("lobbyPage");
const gamePage = document.getElementById("gamePage");

const nicknameInput = document.getElementById("nickname");
const roomCodeInput = document.getElementById("roomCode");

const createGameBtn = document.getElementById("createGameBtn");
const joinGameBtn = document.getElementById("joinGameBtn");

const errorMessage = document.getElementById("errorMessage");

const displayRoomCode = document.getElementById("displayRoomCode");
const gameRoomCode = document.getElementById("gameRoomCode");

const playersList = document.getElementById("playersList");
const playerCount = document.getElementById("playerCount");

const copyCodeBtn = document.getElementById("copyCodeBtn");
const startGameBtn = document.getElementById("startGameBtn");
const leaveGameBtn = document.getElementById("leaveGameBtn");

const lobbyMessage = document.getElementById("lobbyMessage");
const myPlayerName = document.getElementById("myPlayerName");


// ============================================
// GAME VARIABLES
// ============================================

let currentRoomCode = "";
let currentPlayerId = "";
let currentPlayerName = "";

let unsubscribeRoom = null;


// ============================================
// HELPERS
// ============================================

function showPage(page) {
    homePage.classList.add("hidden");
    lobbyPage.classList.add("hidden");
    gamePage.classList.add("hidden");

    page.classList.remove("hidden");
}


function showError(message) {
    errorMessage.textContent = message;
}


function clearError() {
    errorMessage.textContent = "";
}


function generatePlayerId() {
    return "player_" + crypto.randomUUID();
}


function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}


function getNickname() {
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
        showError("Գրիր քո մականունը։");
        nicknameInput.focus();
        return null;
    }

    if (nickname.length < 2) {
        showError("Մականունը պետք է լինի առնվազն 2 նիշ։");
        return null;
    }

    return nickname;
}


// ============================================
// CREATE GAME
// ============================================

async function createGame() {

    clearError();

    const nickname = getNickname();

    if (!nickname) return;

    createGameBtn.disabled = true;
    createGameBtn.textContent = "⏳ Ստեղծվում է...";

    try {

        let roomCode = "";

        // Գտնում ենք ազատ room code
        for (let i = 0; i < 10; i++) {

            const testCode = generateRoomCode();

            const roomSnapshot = await get(
                ref(database, `rooms/${testCode}`)
            );

            if (!roomSnapshot.exists()) {
                roomCode = testCode;
                break;
            }
        }

        if (!roomCode) {
            throw new Error("Չհաջողվեց ստեղծել room code");
        }


        currentRoomCode = roomCode;
        currentPlayerId = generatePlayerId();
        currentPlayerName = nickname;


        const roomData = {
            status: "waiting",
            hostId: currentPlayerId,
            createdAt: Date.now(),

            players: {
                [currentPlayerId]: {
                    id: currentPlayerId,
                    name: currentPlayerName,
                    ready: true,
                    joinedAt: Date.now()
                }
            }
        };


        await set(
            ref(database, `rooms/${roomCode}`),
            roomData
        );


        saveSession();

        console.log("✅ Խաղը ստեղծվեց:", roomCode);

        openLobby();

    } catch (error) {

        console.error("❌ Create Game Error:", error);

        showError(
            "Խաղը ստեղծել չհաջողվեց։ Ստուգիր Firebase Database Rules-ը։"
        );

    } finally {

        createGameBtn.disabled = false;
        createGameBtn.textContent = "🏠 Ստեղծել խաղ";
    }
}


// ============================================
// JOIN GAME
// ============================================

async function joinGame() {

    clearError();

    const nickname = getNickname();

    if (!nickname) return;


    const roomCode = roomCodeInput.value
        .trim()
        .toUpperCase();


    if (roomCode.length !== 6) {

        showError("Գրիր ճիշտ 6 նիշանոց խաղի կոդը։");

        roomCodeInput.focus();

        return;
    }


    joinGameBtn.disabled = true;
    joinGameBtn.textContent = "⏳ Միանում է...";


    try {

        const roomRef =
            ref(database, `rooms/${roomCode}`);

        const snapshot =
            await get(roomRef);


        if (!snapshot.exists()) {

            showError("❌ Այդ կոդով խաղ չի գտնվել։");

            return;
        }


        const room = snapshot.val();


        if (room.status !== "waiting") {

            showError("❌ Այս խաղն արդեն սկսվել է։");

            return;
        }


        const players =
            room.players || {};

        const playerArray =
            Object.values(players);


        if (playerArray.length >= 4) {

            showError("❌ Խաղասենյակը լիքն է։");

            return;
        }


        currentRoomCode = roomCode;
        currentPlayerId = generatePlayerId();
        currentPlayerName = nickname;


        await set(
            ref(
                database,
                `rooms/${roomCode}/players/${currentPlayerId}`
            ),
            {
                id: currentPlayerId,
                name: currentPlayerName,
                ready: true,
                joinedAt: Date.now()
            }
        );


        saveSession();

        console.log("✅ Միացանք խաղին:", roomCode);

        openLobby();


    } catch (error) {

        console.error("❌ Join Game Error:", error);

        showError(
            "Միանալ չհաջողվեց։ Ստուգիր Firebase Database Rules-ը։"
        );

    } finally {

        joinGameBtn.disabled = false;
        joinGameBtn.textContent = "🔑 Միանալ խաղին";
    }
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
// LISTEN TO ROOM
// ============================================

function listenToRoom() {

    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }


    const roomRef =
        ref(database, `rooms/${currentRoomCode}`);


    unsubscribeRoom = onValue(
        roomRef,
        (snapshot) => {

            if (!snapshot.exists()) {

                if (unsubscribeRoom) {
                    unsubscribeRoom();
                }

                showPage(homePage);

                showError("Խաղասենյակը փակվել է։");

                return;
            }


            const room = snapshot.val();

            updateLobby(room);


            if (room.status === "playing") {
                openGame();
            }

        },
        (error) => {

            console.error(
                "❌ Firebase listener error:",
                error
            );

        }
    );
}


// ============================================
// UPDATE LOBBY
// ============================================

function updateLobby(room) {

    const players =
        room.players || {};

    const playerArray =
        Object.values(players);


    playerCount.textContent =
        `${playerArray.length}/4`;


    playersList.innerHTML = "";


    playerArray.forEach((player, index) => {

        const card =
            document.createElement("div");

        card.className = "player-card";


        const avatar =
            document.createElement("div");

        avatar.className = "player-avatar";

        avatar.textContent =
            index === 0 ? "👑" : "👤";


        const info =
            document.createElement("div");

        info.className = "player-info";


        const name =
            document.createElement("div");

        name.className = "player-name";

        name.textContent = player.name;


        const status =
            document.createElement("div");

        status.className = "player-status";

        status.textContent =
            index === 0
                ? "Ստեղծող"
                : "Միացած է";


        info.appendChild(name);
        info.appendChild(status);

        card.appendChild(avatar);
        card.appendChild(info);

        playersList.appendChild(card);

    });


    const isHost =
        room.hostId === currentPlayerId;


    startGameBtn.style.display =
        isHost ? "block" : "none";


    if (playerArray.length < 4) {

        lobbyMessage.textContent =
            `Սպասում ենք խաղացողներին... ${playerArray.length}/4`;

        startGameBtn.disabled = true;

    } else {

        lobbyMessage.textContent =
            "🔥 Բոլոր 4 խաղացողները պատրաստ են։";

        startGameBtn.disabled = false;

    }
}


// ============================================
// START GAME
// ============================================

async function startGame() {

    try {

        const roomRef =
            ref(database, `rooms/${currentRoomCode}`);


        const snapshot =
            await get(roomRef);


        if (!snapshot.exists()) {
            return;
        }


        const room = snapshot.val();


        if (room.hostId !== currentPlayerId) {

            alert(
                "Միայն խաղի ստեղծողը կարող է սկսել խաղը։"
            );

            return;
        }


        const players =
            Object.values(room.players || {});


        if (players.length !== 4) {

            alert(
                "Խաղը սկսելու համար պետք է 4 խաղացող։"
            );

            return;
        }


        await update(
            roomRef,
            {
                status: "playing",
                startedAt: Date.now()
            }
        );


        console.log("🎮 Խաղը սկսվեց!");

    } catch (error) {

        console.error(
            "❌ Start Game Error:",
            error
        );

        alert(
            "Խաղը սկսել չհաջողվեց։"
        );
    }
}


// ============================================
// OPEN GAME
// ============================================

function openGame() {

    showPage(gamePage);

    gameRoomCode.textContent =
        currentRoomCode;

    myPlayerName.textContent =
        currentPlayerName;
}


// ============================================
// COPY ROOM CODE
// ============================================

async function copyRoomCode() {

    if (!currentRoomCode) return;


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
// LEAVE GAME
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

    clearError();
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
// ENTER KEY
// ============================================

nicknameInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            createGame();
        }

    }
);


roomCodeInput.addEventListener(
    "keydown",
    (event) => {

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
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 6);

    }
);


// ============================================
// INITIAL STATE
// ============================================

showPage(homePage);

console.log(
    "🎮 Kent Stop Online պատրաստ է!"
);
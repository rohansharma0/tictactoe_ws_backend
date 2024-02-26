"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const Player_1 = require("./types/Player");
const Room_1 = require("./types/Room");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: (_a = process.env.HOST) !== null && _a !== void 0 ? _a : "http://localhost:5173",
    }
});
let roomList = [];
const getRoomIfPresent = (roomId) => {
    let roomObj = null;
    let roomIdx = -1;
    roomList.forEach((room, idx) => {
        if (room.id == roomId) {
            roomObj = room;
            roomIdx = idx;
        }
    });
    return [roomObj, roomIdx];
};
const isRoomFull = (room, id) => {
    return (room.id !== null && room.player1 !== null && room.player1.id !== id && room.player2 !== null && room.player2.id !== id);
};
io.on('connection', (socket) => {
    console.log('Socket connection established: ' + socket.id);
    socket.on("join_room", (data) => {
        socket.join(data);
    });
    socket.on('request_to_play', (data) => {
        var _a, _b, _c, _d, _e, _f;
        const roomId = data.roomId;
        const [room] = getRoomIfPresent(roomId);
        if (!room || isRoomFull(room, data === null || data === void 0 ? void 0 : data.playerId)) {
            socket === null || socket === void 0 ? void 0 : socket.emit("game_status", Room_1.GAME_STATUS.ROOM_FULL_INVALID);
            return;
        }
        let turn;
        if (room.player1) {
            const p2PlayingAs = (room === null || room === void 0 ? void 0 : room.player1.playingAs) === 'CIRCLE' ? "CROSS" : "CIRCLE";
            room.player2 = new Player_1.Player(socket, data === null || data === void 0 ? void 0 : data.playerId, data === null || data === void 0 ? void 0 : data.playerName, p2PlayingAs);
            turn = room.player1.id;
        }
        else if (room.player2) {
            const p1PlayingAs = (room === null || room === void 0 ? void 0 : room.player2.playingAs) === 'CIRCLE' ? "CROSS" : "CIRCLE";
            room.player1 = new Player_1.Player(socket, data === null || data === void 0 ? void 0 : data.playerId, data === null || data === void 0 ? void 0 : data.playerName, p1PlayingAs);
            turn = room.player2.id;
        }
        socket.join(roomId);
        io === null || io === void 0 ? void 0 : io.to(roomId).emit("game_status", Room_1.GAME_STATUS.STARTED);
        io === null || io === void 0 ? void 0 : io.to(roomId).emit("room_info", {
            roomId: room.id,
            player1: {
                id: (_a = room === null || room === void 0 ? void 0 : room.player1) === null || _a === void 0 ? void 0 : _a.id,
                name: (_b = room === null || room === void 0 ? void 0 : room.player1) === null || _b === void 0 ? void 0 : _b.name,
                playingAs: (_c = room === null || room === void 0 ? void 0 : room.player1) === null || _c === void 0 ? void 0 : _c.playingAs,
            },
            player2: {
                id: (_d = room === null || room === void 0 ? void 0 : room.player2) === null || _d === void 0 ? void 0 : _d.id,
                name: (_e = room === null || room === void 0 ? void 0 : room.player2) === null || _e === void 0 ? void 0 : _e.name,
                playingAs: (_f = room === null || room === void 0 ? void 0 : room.player2) === null || _f === void 0 ? void 0 : _f.playingAs,
            },
            turn: turn,
        });
    });
    socket.on("turn", (data) => {
        var _a, _b, _c;
        const [room] = getRoomIfPresent(data.roomId);
        if (data.currentTurn.socketId === ((_a = room === null || room === void 0 ? void 0 : room.player1) === null || _a === void 0 ? void 0 : _a.id)) {
            io === null || io === void 0 ? void 0 : io.to(data.roomId).emit("game_turn", (_b = room === null || room === void 0 ? void 0 : room.player2) === null || _b === void 0 ? void 0 : _b.id);
        }
        else {
            io === null || io === void 0 ? void 0 : io.to(data.roomId).emit("game_turn", (_c = room === null || room === void 0 ? void 0 : room.player1) === null || _c === void 0 ? void 0 : _c.id);
        }
        io === null || io === void 0 ? void 0 : io.to(data.roomId).emit("game_board", data.board);
    });
    socket.on("reset", (data) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const [room] = getRoomIfPresent(data === null || data === void 0 ? void 0 : data.roomId);
        let turn;
        if (room) {
            if ((data === null || data === void 0 ? void 0 : data.previousMatchTurn) === ((_a = room === null || room === void 0 ? void 0 : room.player1) === null || _a === void 0 ? void 0 : _a.id)) {
                turn = (_b = room === null || room === void 0 ? void 0 : room.player2) === null || _b === void 0 ? void 0 : _b.id;
            }
            else {
                turn = (_c = room === null || room === void 0 ? void 0 : room.player1) === null || _c === void 0 ? void 0 : _c.id;
            }
            io === null || io === void 0 ? void 0 : io.to(data === null || data === void 0 ? void 0 : data.roomId).emit("room_info", {
                roomId: room.id,
                player1: {
                    id: (_d = room === null || room === void 0 ? void 0 : room.player1) === null || _d === void 0 ? void 0 : _d.id,
                    name: (_e = room === null || room === void 0 ? void 0 : room.player1) === null || _e === void 0 ? void 0 : _e.name,
                    playingAs: (data === null || data === void 0 ? void 0 : data.currentPlayerPlayingAs) === "CIRCLE" ? "CROSS" : "CIRCLE",
                },
                player2: {
                    id: (_f = room === null || room === void 0 ? void 0 : room.player2) === null || _f === void 0 ? void 0 : _f.id,
                    name: (_g = room === null || room === void 0 ? void 0 : room.player2) === null || _g === void 0 ? void 0 : _g.name,
                    playingAs: (data === null || data === void 0 ? void 0 : data.opponentPlayerPlayingAs) === "CIRCLE" ? "CROSS" : "CIRCLE",
                },
                turn: turn,
            });
        }
    });
    socket.on("leave_room", (data) => {
        var _a, _b, _c, _d, _e, _f;
        const roomId = data === null || data === void 0 ? void 0 : data.roomId;
        const [room, idx] = getRoomIfPresent(roomId);
        if (room) {
            const p1 = (_a = room === null || room === void 0 ? void 0 : room.player1) === null || _a === void 0 ? void 0 : _a.id;
            const p2 = (_b = room === null || room === void 0 ? void 0 : room.player2) === null || _b === void 0 ? void 0 : _b.id;
            if (p1 !== null && p1 === socket.id) {
                roomList[idx].player1 = null;
            }
            else if (p2 !== null && p2 === socket.id) {
                roomList[idx].player2 = null;
            }
            socket.leave(roomId);
            socket === null || socket === void 0 ? void 0 : socket.emit("game_status", Room_1.GAME_STATUS.NOT_STARTED);
            io === null || io === void 0 ? void 0 : io.to(roomId).emit("game_status", Room_1.GAME_STATUS.WAITING);
            io === null || io === void 0 ? void 0 : io.to(roomId).emit("room_info", {
                roomId: roomList[idx].id,
                player1: {
                    id: (_c = roomList[idx].player1) === null || _c === void 0 ? void 0 : _c.id,
                    name: (_d = roomList[idx].player1) === null || _d === void 0 ? void 0 : _d.name,
                },
                player2: {
                    id: (_e = roomList[idx].player2) === null || _e === void 0 ? void 0 : _e.id,
                    name: (_f = roomList[idx].player2) === null || _f === void 0 ? void 0 : _f.name,
                }
            });
        }
    });
    socket.on('create_room', (data) => {
        const roomId = data === null || data === void 0 ? void 0 : data.roomId;
        const [room] = getRoomIfPresent(roomId);
        if (!room) {
            roomList.push({
                id: roomId,
                player1: new Player_1.Player(socket, data === null || data === void 0 ? void 0 : data.playerId, data === null || data === void 0 ? void 0 : data.playerName, data === null || data === void 0 ? void 0 : data.playingAs),
                player2: null,
            });
        }
        socket.join(roomId);
        io === null || io === void 0 ? void 0 : io.to(roomId).emit("game_status", Room_1.GAME_STATUS.WAITING);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
httpServer.listen((_b = process.env.PORT) !== null && _b !== void 0 ? _b : 4000);

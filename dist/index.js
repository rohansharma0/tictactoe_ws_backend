"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const Player_1 = require("./types/Player");
const Room_1 = require("./types/Room");
const io = new socket_io_1.Server({
    cors: {
        origin: "http://localhost:5173"
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
        var _a, _b, _c, _d;
        const roomId = data.roomId;
        const [room] = getRoomIfPresent(roomId);
        if (!room || isRoomFull(room, data === null || data === void 0 ? void 0 : data.playerId)) {
            socket === null || socket === void 0 ? void 0 : socket.emit("game_status", Room_1.GAME_STATUS.ROOM_FULL_INVALID);
            return;
        }
        if (room.player1) {
            room.player2 = new Player_1.Player(socket, data === null || data === void 0 ? void 0 : data.playerId, data === null || data === void 0 ? void 0 : data.playerName, true);
        }
        else {
            room.player1 = new Player_1.Player(socket, data === null || data === void 0 ? void 0 : data.playerId, data === null || data === void 0 ? void 0 : data.playerName, true);
        }
        socket.join(roomId);
        io === null || io === void 0 ? void 0 : io.to(roomId).emit("game_status", Room_1.GAME_STATUS.STARTED);
        io === null || io === void 0 ? void 0 : io.to(roomId).emit("room_info", {
            roomId: room.id,
            player1: {
                id: (_a = room === null || room === void 0 ? void 0 : room.player1) === null || _a === void 0 ? void 0 : _a.id,
                name: (_b = room === null || room === void 0 ? void 0 : room.player1) === null || _b === void 0 ? void 0 : _b.name,
                playingAs: "CROSS",
            },
            player2: {
                id: (_c = room === null || room === void 0 ? void 0 : room.player2) === null || _c === void 0 ? void 0 : _c.id,
                name: (_d = room === null || room === void 0 ? void 0 : room.player2) === null || _d === void 0 ? void 0 : _d.name,
                playingAs: "CIRCLE",
            }
        });
        io === null || io === void 0 ? void 0 : io.to(roomId).emit("game_turn", room.player1.id);
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
                player1: new Player_1.Player(socket, data === null || data === void 0 ? void 0 : data.playerId, data === null || data === void 0 ? void 0 : data.playerName, true),
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
io.listen(3000);

import { Server } from "socket.io";
import express from "express";
import { createServer } from "http";
import { Player } from "./types/Player";
import { GAME_STATUS, Room } from "./types/Room";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.HOST ?? "http://localhost:5173",
    }
});

let roomList: Room[] = [];

const getRoomIfPresent = (roomId: string): [Room | null, number] => {
    let roomObj: Room | null = null;
    let roomIdx = -1;
    roomList.forEach((room, idx) => {
        if (room.id == roomId) {
            roomObj = room;
            roomIdx = idx;
        }
    })
    return [roomObj, roomIdx];
}

const isRoomFull = (room: Room, id: string): boolean => {
    return (room.id !== null && room.player1 !== null && room.player1.id !== id && room.player2 !== null && room.player2.id !== id);
}

io.on('connection', (socket) => {
    console.log('Socket connection established: ' + socket.id);

    socket.on("join_room", (data) => {
        socket.join(data);
    })

    socket.on('request_to_play', (data) => {
        const roomId = data.roomId;
        const [room] = getRoomIfPresent(roomId);
        if (!room || isRoomFull(room, data?.playerId)) {
            socket?.emit("game_status", GAME_STATUS.ROOM_FULL_INVALID);
            return;
        }
        let turn;
        if (room.player1) {
            const p2PlayingAs = room?.player1.playingAs === 'CIRCLE' ? "CROSS" : "CIRCLE";
            room.player2 = new Player(socket, data?.playerId, data?.playerName, p2PlayingAs);
            turn = room.player1.id;
        } else if (room.player2) {
            const p1PlayingAs = room?.player2.playingAs === 'CIRCLE' ? "CROSS" : "CIRCLE";
            room.player1 = new Player(socket, data?.playerId, data?.playerName, p1PlayingAs);
            turn = room.player2.id;
        }
        socket.join(roomId);
        io?.to(roomId).emit("game_status", GAME_STATUS.STARTED);
        io?.to(roomId).emit("room_info",
            {
                roomId: room.id,
                player1: {
                    id: room?.player1?.id,
                    name: room?.player1?.name,
                    playingAs: room?.player1?.playingAs,
                },
                player2: {
                    id: room?.player2?.id,
                    name: room?.player2?.name,
                    playingAs: room?.player2?.playingAs,
                },
                turn: turn,
            });
    });

    socket.on("turn", (data) => {
        const [room] = getRoomIfPresent(data.roomId);
        if (data.currentTurn.socketId === room?.player1?.id) {
            io?.to(data.roomId).emit("game_turn", room?.player2?.id);
        } else {
            io?.to(data.roomId).emit("game_turn", room?.player1?.id);
        }
        io?.to(data.roomId).emit("game_board", data.board);
    })

    socket.on("reset", (data) => {
        const [room] = getRoomIfPresent(data?.roomId);
        let turn;
        if (room) {
            if (data?.previousMatchTurn === room?.player1?.id) {
                turn = room?.player2?.id;
            } else {
                turn = room?.player1?.id;
            }
            io?.to(data?.roomId).emit("room_info",
                {
                    roomId: room.id,
                    player1: {
                        id: room?.player1?.id,
                        name: room?.player1?.name,
                        playingAs: data?.currentPlayerPlayingAs === "CIRCLE" ? "CROSS" : "CIRCLE",
                    },
                    player2: {
                        id: room?.player2?.id,
                        name: room?.player2?.name,
                        playingAs: data?.opponentPlayerPlayingAs === "CIRCLE" ? "CROSS" : "CIRCLE",
                    },
                    turn: turn,
                });
        }
    })

    socket.on("leave_room", (data) => {
        const roomId = data?.roomId;
        const [room, idx] = getRoomIfPresent(roomId);
        if (room) {
            const p1 = room?.player1?.id;
            const p2 = room?.player2?.id;
            if (p1 !== null && p1 === socket.id) {
                roomList[idx].player1 = null;
            } else if (p2 !== null && p2 === socket.id) {
                roomList[idx].player2 = null;
            }
            socket.leave(roomId);
            socket?.emit("game_status", GAME_STATUS.NOT_STARTED);
            io?.to(roomId).emit("game_status", GAME_STATUS.WAITING);
            io?.to(roomId).emit("room_info",
                {
                    roomId: roomList[idx].id,
                    player1: {
                        id: roomList[idx].player1?.id,
                        name: roomList[idx].player1?.name,
                    },
                    player2: {
                        id: roomList[idx].player2?.id,
                        name: roomList[idx].player2?.name,
                    }
                });
        }
    })

    socket.on('create_room', (data) => {
        const roomId = data?.roomId;
        const [room] = getRoomIfPresent(roomId);
        if (!room) {
            roomList.push({
                id: roomId,
                player1: new Player(socket, data?.playerId, data?.playerName, data?.playingAs),
                player2: null,
            })
        }
        socket.join(roomId);
        io?.to(roomId).emit("game_status", GAME_STATUS.WAITING);
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');

    });
});

httpServer.listen(process.env.PORT ?? 4000);
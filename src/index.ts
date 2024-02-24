import { Server } from "socket.io";
import { Player } from "./types/Player";
import { GAME_STATUS, Room } from "./types/Room";

const io = new Server({
    cors: {
        origin: "http://localhost:5173"
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
        if (room.player1) {
            room.player2 = new Player(socket, data?.playerId, data?.playerName, true);
        } else {
            room.player1 = new Player(socket, data?.playerId, data?.playerName, true);
        }
        socket.join(roomId);
        io?.to(roomId).emit("game_status", GAME_STATUS.STARTED);
        io?.to(roomId).emit("room_info",
            {
                roomId: room.id,
                player1: {
                    id: room?.player1?.id,
                    name: room?.player1?.name,
                    playingAs: "CROSS",
                },
                player2: {
                    id: room?.player2?.id,
                    name: room?.player2?.name,
                    playingAs: "CIRCLE",
                }
            });
        io?.to(roomId).emit("game_turn", room.player1.id);
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
                player1: new Player(socket, data?.playerId, data?.playerName, true),
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

io.listen(3000);
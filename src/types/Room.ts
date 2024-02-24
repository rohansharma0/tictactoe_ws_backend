import { Player } from "./Player";

export interface Room {
    id: string,
    player1: Player | null,
    player2: Player | null,
}

export enum GAME_STATUS {
    ROOM_FULL_INVALID = "ROOM_FULL_INVALID",
    STARTED = "STARTED",
    NOT_STARTED = "NOT_STARTED",
    WAITING = "WAITING"
}
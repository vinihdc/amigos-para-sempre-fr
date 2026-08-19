export type PlayerType="MENSALISTA"|"AVULSO";
export type Position="Goleiro"|"Zagueiro"|"Lateral"|"Volante"|"Meio-campo"|"Ponta"|"Atacante"|"Flexível";
export interface Player{id:string;name:string;nickname?:string;overall:number;type:PlayerType;positions:Position[];isGoalkeeper:boolean;active:boolean;isAdmin?:boolean;phone?:string}
export interface Team{id:string;name:string;players:Player[];goalkeeper?:Player}

export type GameStatus="ABERTO"|"FECHADO"|"TIMES_MONTADOS"|"FINALIZADO"|"CANCELADO";
export type ConfirmationStatus="VOU"|"NÃO VOU"|"TALVEZ";

export interface Game{
  id:string;
  date:string;
  time:string;
  location:string;
  status:GameStatus;
}

export interface ConfirmationCounts{
  vou:number;
  naoVou:number;
  talvez:number;
}

/** Sessão de autenticação vinculada a um jogador (telefone + PIN). */
export interface AuthSession{
  userId:string;
  playerId:string;
  isAdmin:boolean;
}

export type AuthStatus="loading"|"authenticated"|"unauthenticated";

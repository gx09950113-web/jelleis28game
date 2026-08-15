import {
  getPlayer,
  savePlayer
}
from "./player.js";


export function getBalance() {
  const player =
    getPlayer();

  return player?.balance ?? 0;
}


export function addBalance(
  amount
) {
  const player =
    getPlayer();

  if (!player) {
    return false;
  }

  player.balance +=
    Math.floor(amount);

  savePlayer(player);

  return true;
}


export function subtractBalance(
  amount
) {
  const player =
    getPlayer();

  if (!player) {
    return false;
  }

  amount =
    Math.floor(amount);

  if (
    amount <= 0
    ||
    player.balance < amount
  ) {
    return false;
  }

  player.balance -=
    amount;

  savePlayer(player);

  return true;
}


export function canAfford(
  amount
) {
  return (
    getBalance()
    >=
    amount
  );
}

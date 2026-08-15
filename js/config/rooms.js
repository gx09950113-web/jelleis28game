export const ROOM_CONFIG = {
  "1.8": {
    id: "1.8",
    name: "1.8倍場",
    multiplier: 1.8,

    rebateEnabled: false,

    refundRules: {
      hasZero: false,
      pair: false,
      leopard: false,
      sum13or14: false
    },

    image: "./assets/images/room-18.webp",
    bgm: "./assets/sounds/room-18.mp3"
  },

  "2.0": {
    id: "2.0",
    name: "2.0倍場",
    multiplier: 2.0,

    rebateEnabled: true,

    refundRules: {
      hasZero: true,
      pair: true,
      leopard: true,
      sum13or14: true
    },

    image: "./assets/images/room-20.webp",
    bgm: "./assets/sounds/room-20.mp3"
  },

  "2.8": {
    id: "2.8",
    name: "2.8倍場",
    multiplier: 2.8,

    rebateEnabled: true,

    refundRules: {
      hasZero: true,
      pair: true,
      leopard: true,
      sum13or14: true
    },

    image: "./assets/images/room-28.webp",
    bgm: "./assets/sounds/room-28.mp3"
  },

  "3.2": {
    id: "3.2",
    name: "3.2倍場",
    multiplier: 3.2,

    rebateEnabled: true,

    refundRules: {
      hasZero: false,
      pair: false,
      leopard: false,
      sum13or14: false
    },

    image: "./assets/images/room-32.webp",
    bgm: "./assets/sounds/room-32.mp3"
  }
};

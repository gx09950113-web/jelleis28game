export const REBATE_CONFIG = {
  eligibleRooms: [
    "2.0",
    "2.8",
    "3.2"
  ],

  lossTiers: [
    {
      min: 3000,
      rate: 0.005
    },

    {
      min: 6000,
      rate: 0.01
    },

    {
      min: 10000,
      rate: 0.015
    },

    {
      min: 20000,
      rate: 0.02
    }
  ],

  profitTiers: [
    {
      min: 15000,
      rate: 0.003
    },

    {
      min: 30000,
      rate: 0.006
    },

    {
      min: 50000,
      rate: 0.009
    },

    {
      min: 100000,
      rate: 0.012
    }
  ],

  lossRebateCapRatio: 0.5
};

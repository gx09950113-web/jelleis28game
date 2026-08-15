# 28 GAME LAB

一個使用純前端技術製作的 28 類遊戲模擬網站。

本專案主要用於讓朋友體驗 28 類遊戲的玩法、倍場、開獎、下注與結算機制。網站使用 HTML、CSS 與 JavaScript 製作，並預計透過 GitHub Pages 部署。

所有遊戲代幣皆為虛擬點數，不具任何現金價值。本專案不提供儲值、提領、兌現、轉帳或任何 Echtgeld／เงินจริง交易功能。

---

## 專案狀態

目前仍在開發中。

預計實作：

- 玩家本機資料
- 初始代幣
- 每日登入獎勵
- 七日連續登入獎勵
- 1.8 倍場
- 2.0 倍場
- 2.8 倍場
- 3.2 倍場
- 28 類遊戲開獎
- 大／小
- 單／雙
- 特殊開獎組合
- 下注系統
- 結算系統
- 每日盈虧統計
- 有效下注統計
- 隔日反水
- 開獎歷史紀錄
- 遊戲規則頁面

---

# 技術架構

本專案採用純前端架構。

使用：

- HTML5
- CSS3
- Vanilla JavaScript
- ES Modules
- localStorage
- GitHub Pages

不使用：

- Node.js
- npm
- 前端 Framework
- 後端伺服器
- SQL／NoSQL 資料庫
- 真實會員帳號
- Echtgeld／เงินจริง支付系統

玩家資料會儲存在瀏覽器的 `localStorage`。

因此清除瀏覽器網站資料、使用其他瀏覽器或更換裝置後，原本的遊戲進度不會同步。

---

# 專案結構

```text
28-game/
│
├── index.html
├── game.html
├── rules.html
│
├── css/
│   ├── common.css
│   ├── index.css
│   └── game.css
│
├── js/
│   ├── config/
│   │   ├── economy.js
│   │   ├── rooms.js
│   │   └── rebate.js
│   │
│   ├── core/
│   │   ├── storage.js
│   │   ├── player.js
│   │   ├── wallet.js
│   │   └── date.js
│   │
│   ├── game/
│   │   ├── draw.js
│   │   ├── rules.js
│   │   ├── betting.js
│   │   ├── settlement.js
│   │   └── statistics.js
│   │
│   ├── pages/
│   │   ├── index.js
│   │   ├── game.js
│   │   └── rules.js
│   │
│   └── utils/
│       └── format.js
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── sounds/
│
└── README.md

// 設定遊戲狀態 - 當成狀態機，定義了所有的遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardMatchFailed: "CardMatchFailed",
  CardMatched: "CardMatchFailed",
  GameFinished: "GameFinished",
};

// 花色圖片
const Symbols = [
  "https://image.flaticon.com/icons/svg/105/105223.svg", // 0-12：黑桃 1-13
  "https://image.flaticon.com/icons/svg/105/105220.svg", // 13-25：愛心 1-13
  "https://image.flaticon.com/icons/svg/105/105212.svg", // 26-38：方塊 1-13
  "https://image.flaticon.com/icons/svg/105/105219.svg", // 39-51：梅花 1-13
];

// 畫面顯示
const view = {
  // 負責生成卡片內容，包括花色和數字
  getCardContent(index) {
    // 數字
    const number = this.transformNumber((index % 13) + 1);
    // 花色: 根據index來計算現在是哪一個花色
    const symbol = Symbols[Math.floor(index / 13)];
    return `
            <p>${number}</p>
            <img src="${symbol}">
            <p>${number}</p>
        `;
  },
  getCardElement(index) {
    // 透過data-set將index綁在牌背的template裡。使用者點擊卡片時，讓JS取得index number來進一步運算
    return `
        <div data-index="${index}" class="card back"></div>
        `;
  },
  transformNumber(number) {
    switch (number) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K";
      default:
        return number;
    }
  },
  // 將已經打亂的陣列傳進去，單純做顯示的動作
  displayCards(indexes) {
    // 選出#cards + 抽換內容
    const rootElement = document.querySelector("#cards");
    rootElement.innerHTML = indexes
      .map((index) => this.getCardElement(index)) //map: 迭代陣列，並依序將數字丟進view.getCardElement()，會變成有52卡片的陣列
      .join(""); // 把陣列合併成一個大字串，才能當HTML template使用
  },
  // 有時候翻一張或兩張牌 = 傳給flipCard參數有可能是1個數字或含有2個數字的陣列
  /// ... 把值搜集起來變成陣列
  // 用map來迭代
  flipCards(...cards) {
    cards.map((card) => {
      // 點擊覆蓋的卡片
      if (card.classList.contains("back")) {
        // 回傳牌面內容(數字與花色)
        card.classList.remove("back");
        // HTML回傳是字串，要轉換成數字
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        return;
      }
      // 點擊一張翻開的卡片 -> 重新覆蓋卡片: 回傳背面
      card.classList.add("back");
      // 牌面內容清除: 牌背不會有數字跟花色
      card.innerHTML = null;
    });
  },

  pairCards(...cards) {
    cards.map((card) => {
      card.classList.add("paired");
    });
  },

  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`;
  },

  renderTriedTimes(times) {
    document.querySelector(
      ".tried"
    ).textContent = `You've tried ${times} times`;
  },

  // 為卡面加入.wrong，一但加入就會開始跑動畫
  // 監聽器綁定animationed(動畫結束事件)，一旦動畫跑完一輪，就把.wrong class拿掉
  appendWrongAnimation(...cards) {
    cards.map((card) => {
      card.classList.add("wrong");
      card.addEventListener(
        "animationend",
        (event) => event.target.classList.remove("wrong"),
        { once: true } // 在事情執行一次之後，就要卸載這個監聽器。因為同一張卡片可能會被點錯好幾次，每一次都需要動態地掛上一個新的監聽器，並且用完就要卸載
      );
    });
  },

  showGameFinished() {
    const div = document.createElement("div");
    div.classList.add("completed");
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `;
    const header = document.querySelector("#header");
    header.before(div);
  },
};

// model: 集中資料管理的地方
const model = {
  revealedCards: [], // 代表被翻開的卡片; 暫存牌組 - 使用者每次翻牌時，就先把卡片丟進這個牌組，集滿2張牌時就要檢查配對是否成功。檢查完後，這個暫存牌組就需要清空
  // 檢查是否配對成功
  isRevealedCardsMatched() {
    // 提取revealedCards陣列中暫存的2個值，並用 === 比對是否相等，若相等就回傳true，反之則為false
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    );
  },
  score: 0,
  triedTimes: 0,
};

// controller: 會依遊戲狀態來分配動作
// 所有動作應該由controller統一發派，view或model等其他元件只有在被controller呼叫時，才會有所動作

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  // game start function，請controller呼叫洗牌function
  generateCards() {
    // Array.from: 類似陣列來建立陣列 + Array(52).keys()迭代器生成連續數字陣列
    view.displayCards(utility.getRandomNumberArray(52));
  },
  // 依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    // 非牌背狀態的卡片，即時點擊也不執行動作
    if (!card.classList.contains("back")) {
      return;
    }
    // 統一發派任務給view & model
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card);
        model.revealedCards.push(card);
        this.currentState = GAME_STATE.SecondCardAwaits;
        break;
      case GAME_STATE.SecondCardAwaits:
        // 只要切換至SecondCardAwaits，嘗試次數就要 +1
        view.renderTriedTimes(++model.triedTimes);
        view.flipCards(card);
        model.revealedCards.push(card);
        // 判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          // 配對正確
          // 翻了兩張牌以後，如果配對成功，分數就要 +10
          view.renderScore(model.score += 10);
          this.currentState = GAME_STATE.CardMatched;
          // 讓卡片在牌桌上維持翻開，改變卡片底色樣式
          // 其實只要不去呼叫 flipCard，卡片就會維持翻開
          // 若傳入陣列，先用...展開成個別值。再傳進pairCards時，又被...變成陣列
          view.pairCards(...model.revealedCards);
          // 清空暫存卡片牌組
          model.revealedCards = [];
          if (model.score === 260) {
            this.currentState = GAME_STATE.GameFinished;
            view.showGameFinished();
            return;
          }
          this.currentState = GAME_STATE.FirstCardAwaits;
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardMatchFailed;
          view.appendWrongAnimation(...model.revealedCards);
          setTimeout(this.resetCards, 1000);
        }
        break;
    }
    console.log("this.currentState:", this.currentState);
    console.log(
      "revealedCards:",
      model.revealedCards.map((card) => card.dataset.index)
    );
  },
  resetCards() {
    view.flipCards(...model.revealedCards);
    model.revealedCards = [];
    // 把resetCards當成參數傳給setTimeout時，this的對象變成了setTimeout
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
};

const utility = {
  // 洗牌演算法: fisher-yates shuffle
  // 從最底部的卡牌開始，將它抽出來與前面的隨機一張牌交換，直到頂部的第二張牌為止
  getRandomNumberArray(count) {
    // 生成一個長度為count的連續數字陣列
    const number = Array.from(Array(count).keys());
    // index = number.length - 1: 取出最後一項
    for (let index = number.length - 1; index > 0; index--) {
      // 找到一個隨機項目(決定好這張牌要跟前面的哪張牌交換)
      let randomIndex = Math.floor(Math.random() * (index + 1));
      // 目前是最後一張, 被挑中準備要交換的那張牌 - 交換陣列元素
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index],
      ];
    }
    return number;
  },
};

controller.generateCards();

// querySelectorAll抓到與.card匹配的元素，回傳array-like的node list
// 再用forEach迭代，為每張卡片加上監聽器
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", (event) => {
    // 點擊卡牌時，呼叫flipCard(card)
    controller.dispatchCardAction(card);
  });
});

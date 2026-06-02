/**
 * QuizGame (问答游戏)
 * 限时选择题，答对N题即可通关
 */
class QuizGame extends BaseGameModule {
  init() {
    this.questionCount = this.config.questionCount || 10;
    this.timePerQuestion = this.config.timePerQuestion || 10;
    this.questions = this._getQuestions();
    this.currentQ = 0;
    this.correctAnswers = 0;
    this.questionTimer = 0;
    this.frameId = null;

    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.padding = '20px';
    this.container.style.gap = '12px';
    this.container.style.background = 'linear-gradient(180deg, #1a1a2e, #16213e)';
    this.container.style.overflow = 'auto';

    // Progress
    this.progressText = this._createElement('div', {
      fontSize: '14px', color: '#aaa', fontWeight: '600',
    }, this.container);
    this.progressText.textContent = '第 1 / ' + this.questions.length + ' 题';

    // Timer bar
    this.timerBg = this._createElement('div', {
      width: '100%', maxWidth: '400px', height: '6px',
      background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden',
    }, this.container);
    this.timerFill = this._createElement('div', {
      width: '100%', height: '100%', background: 'linear-gradient(90deg, #e94560, #ff6b35)',
      borderRadius: '3px', transition: 'width 0.1s linear',
    }, this.timerBg);

    // Question
    this.questionEl = this._createElement('div', {
      fontSize: '20px', fontWeight: '700', textAlign: 'center',
      padding: '20px', maxWidth: '400px', lineHeight: '1.5',
    }, this.container);

    // Options
    this.optionsContainer = this._createElement('div', {
      display: 'flex', flexDirection: 'column', gap: '10px',
      width: '100%', maxWidth: '400px',
    }, this.container);

    this._renderQuestion();
  }

  _getQuestions() {
    // 内置搞笑/整蛊题库
    const all = [
      { q: '如果你的室友半夜开始说梦话，你应该？', opts: ['录音明天放给他听', '叫醒他', '陪他聊', '默默离开'], correct: 0 },
      { q: '老板说"这个需求很简单"的真实意思是？', opts: ['确实简单', '我也不会你自己看着办', '给你加薪', '马上就能做完'], correct: 1 },
      { q: '早八的课，几点起床最合适？', opts: ['7:50', '7:00', '6:30', '永远不去'], correct: 0 },
      { q: '什么动物最容易emo？', opts: ['猫', '狗', '鱼', '刺猬——因为浑身是刺'], correct: 3 },
      { q: '周一最正确的打开方式是？', opts: ['元气满满', '请假', '把闹钟按掉继续睡', '假装周五'], correct: 2 },
      { q: '打工人最怕听到的三个字？', opts: ['涨工资', '辛苦了', '在吗？', '放假了'], correct: 2 },
      { q: '午饭点什么外卖，最能让同事羡慕？', opts: ['麻辣烫', '黄焖鸡', '什么都不点装作减肥', '偷偷点大餐然后说"随便吃吃"'], correct: 3 },
      { q: '微信消息已读不回，最可能的原因？', opts: ['在忙', '忘了', '不想回', '以上皆是'], correct: 3 },
      { q: '以下哪种方式最可能让甲方满意？', opts: ['认真做', '做三个方案', '第一版故意做得烂', '五彩斑斓的黑'], correct: 2 },
      { q: '星期五下午5点，领导叫你开会，你的第一反应是？', opts: ['兴奋', '心如死灰', '假装没看到消息', '准备辞职信'], correct: 2 },
      { q: '当代年轻人的"养生"指的是？', opts: ['早睡早起', '吃保健品', '啤酒泡枸杞熬夜', '去健身房'], correct: 2 },
      { q: '什么样的人最容易单身？', opts: ['宅男', '要求太高的人', '社恐', '正在做这道题的你'], correct: 3 },
      { q: '室友的闹钟响了10分钟他还没醒，你应该？', opts: ['叫醒他', '关掉闹钟', '拿手机录像', '换宿舍'], correct: 2 },
      { q: '考试时发现一道题都不会，最优解是？', opts: ['瞎蒙', '偷看', '睡觉', '三长一短选最短'], correct: 3 },
      { q: '食堂阿姨手抖是因为？', opts: ['年纪大了', '太累了', '精准控量', '看你太瘦了需要减肥'], correct: 2 },
      { q: '你朋友说"我就蹭蹭不进去"指的是？', opts: ['蹭饭', '蹭车', '蹭网', '别想歪了就是字面意思'], correct: 2 },
    ];
    // Shuffle and pick
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, this.questionCount);
  }

  _renderQuestion() {
    if (this.currentQ >= this.questions.length) {
      this.score = this.correctAnswers * 100;
      const passed = this.correctAnswers >= Math.ceil(this.questions.length * 0.6);
      this.endGame(passed ? 'win' : 'lose', this.score);
      return;
    }

    const q = this.questions[this.currentQ];
    this.progressText.textContent = '第 ' + (this.currentQ + 1) + ' / ' + this.questions.length + ' 题';
    this.questionEl.textContent = q.q;
    this.optionsContainer.innerHTML = '';

    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      Object.assign(btn.style, {
        width: '100%', padding: '14px 20px', border: '2px solid rgba(255,255,255,0.15)',
        borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff',
        fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
      });
      btn.textContent = ['A', 'B', 'C', 'D'][i] + '. ' + opt;
      btn.addEventListener('click', () => this._selectAnswer(i, btn));
      this.optionsContainer.appendChild(btn);
      this._elements.push(btn);
    });

    this.questionTimer = this.timePerQuestion;
    this.timerFill.style.width = '100%';
    this.timerFill.style.background = 'linear-gradient(90deg, #e94560, #ff6b35)';
  }

  _selectAnswer(index, btn) {
    if (this.state !== 'playing') return;
    const correct = this.questions[this.currentQ].correct;

    // Highlight correct/wrong
    const allBtns = this.optionsContainer.children;
    for (let i = 0; i < allBtns.length; i++) {
      allBtns[i].style.pointerEvents = 'none';
      if (i === correct) {
        allBtns[i].style.background = 'rgba(56,239,125,0.2)';
        allBtns[i].style.borderColor = '#38ef7d';
      }
    }
    if (index !== correct) {
      btn.style.background = 'rgba(255,68,68,0.2)';
      btn.style.borderColor = '#ff4444';
    } else {
      this.correctAnswers++;
    }

    this._setTimeout(() => {
      this.currentQ++;
      this._renderQuestion();
    }, 800);
  }

  start() {
    super.start();
    this._gameLoop();
  }

  _gameLoop() {
    if (this.state !== 'playing') return;
    this.questionTimer -= 0.1;

    const pct = Math.max(0, this.questionTimer / this.timePerQuestion * 100);
    this.timerFill.style.width = pct + '%';
    if (this.questionTimer < 3) {
      this.timerFill.style.background = '#ff4444';
    }

    if (this.questionTimer <= 0) {
      // Time's up for this question
      this.currentQ++;
      if (this.currentQ >= this.questions.length) {
        this.score = this.correctAnswers * 100;
        const passed = this.correctAnswers >= Math.ceil(this.questions.length * 0.6);
        this.endGame(passed ? 'win' : 'lose', this.score);
        return;
      }
      this._renderQuestion();
    }

    this.frameId = requestAnimationFrame(() => this._gameLoop());
  }

  destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    super.destroy();
  }
}

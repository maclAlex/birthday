import React, { useEffect, useRef, useState } from 'react';

type EndingId = 'wish' | 'song' | 'bite' | 'share' | 'party' | 'reply';

const ENDINGS: Record<EndingId, { title: string; lines: string[]; art: string; line: string }> = {
  wish: {
    title: '愿望只说给自己',
    art: 'kitchen',
    lines: [
      '你没有说出很大的事。只希望这一岁，累的时候有处可歇，高兴的时候有人接住。',
      '烛火灭了。烟轻轻上升，像把这句话带走。房间还是暖的。',
    ],
    line: '生日快乐。第一支火，是你自己点的，也是你自己吹灭的。',
  },
  song: {
    title: '生日歌先唱给你自己',
    art: 'room',
    lines: [
      '旋律一出来，你跟着哼。唱到「祝你生日快乐」时，声音比刚才稳。',
      '没有听众也没关系。这首歌今天的听众就是你。',
    ],
    line: '生日快乐。这一岁的第一首歌，是唱给你的。',
  },
  bite: {
    title: '第一口留给自己',
    art: 'shop',
    lines: [
      '奶油上的「生日快乐」被你小心地避开，又忍不住先尝了靠近字的那一角。',
      '甜得刚刚好。你对着空盘子笑了一下，像是收到了自己的礼物。',
    ],
    line: '生日快乐。蛋糕的第一口，被你认真吃掉了。',
  },
  share: {
    title: '这一刀一起落下',
    art: 'cafe',
    lines: [
      '人到齐之前，蛋糕就在灯下等着。门开时，先听见的是生日快乐，然后才是脚步。',
      '你们手叠着手切下去。盘子传了一圈，每个人的嘴里都是同一块甜。',
    ],
    line: '生日快乐。这一刀，是大家一起帮你落下的。',
  },
  party: {
    title: '蜡烛被很多人围住',
    art: 'cafe',
    lines: [
      '灯关掉的时候，只剩你面前那几支火。生日歌有点不齐，但每一声都在叫你。',
      '你吹灭它们。掌声先于灯光回来。有人把最大的那块推到你面前。',
    ],
    line: '生日快乐。这一岁，是被一圈人一起点亮的。',
  },
  reply: {
    title: '感谢比蜡烛先点完',
    art: 'phone',
    lines: [
      '你一封封回。有的只写「收到啦」，有的多说了几句近况。每发出去一句，生日就更完整一点。',
      '屏幕安静下来时，那些祝你生日快乐的话还亮着，像一小排没有灭的灯。',
    ],
    line: '生日快乐。人没有全部到场，祝愿已经到齐了。',
  },
};

const LETTERS = [
  { from: '一直记得你的人', text: '生日快乐。不用变得更耀眼，今天这样就已经很好。' },
  { from: '会一起笑的人', text: '蛋糕我可以晚点到，祝福不能晚点。生日快乐。' },
  { from: '突然想起你的人', text: '看到日期才发觉，今天是你的生日。愿你被温柔对待。' },
];

const BIRTHDAY_NOTES: Array<[number, number]> = [
  [262, 0.32], [262, 0.2], [294, 0.5], [262, 0.5], [349, 0.5], [330, 0.9],
  [262, 0.32], [262, 0.2], [294, 0.5], [262, 0.5], [392, 0.5], [349, 0.9],
  [262, 0.32], [262, 0.2], [523, 0.5], [440, 0.5], [349, 0.5], [330, 0.5], [294, 0.9],
  [466, 0.32], [466, 0.2], [440, 0.5], [349, 0.5], [392, 0.5], [349, 1.1],
];

function createPlayer() {
  let ctx: AudioContext | null = null;
  let timer = 0;
  let playing = false;
  const playNote = (frequency: number, when: number, duration: number) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.05, when + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  };
  const loop = () => {
    if (!playing || !ctx) return;
    let when = ctx.currentTime + 0.06;
    BIRTHDAY_NOTES.forEach(([frequency, duration]) => {
      playNote(frequency, when, duration * 0.9);
      when += duration;
    });
    timer = window.setTimeout(loop, Math.max(300, (when - ctx.currentTime) * 1000 - 60));
  };
  return {
    async start() {
      if (!ctx) ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      if (playing) return;
      playing = true;
      loop();
    },
    stop() {
      playing = false;
      window.clearTimeout(timer);
    },
  };
}

type Phase = 'wake' | 'candles' | 'cake' | 'letters' | 'ending';

const ALBUM_KEY = 'birthday-endings';

function loadAlbum(): EndingId[] {
  try {
    const raw = localStorage.getItem(ALBUM_KEY);
    const parsed = raw ? (JSON.parse(raw) as EndingId[]) : [];
    return parsed.filter((id) => id in ENDINGS);
  } catch {
    return [];
  }
}

const Rebirth: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('wake');
  const [lit, setLit] = useState(0);
  const [blown, setBlown] = useState(false);
  const [hold, setHold] = useState(0);
  const [cakeStep, setCakeStep] = useState(0);
  const [opened, setOpened] = useState<number[]>([]);
  const [ending, setEnding] = useState<EndingId | null>(null);
  const [album, setAlbum] = useState<EndingId[]>([]);
  const [musicOn, setMusicOn] = useState(false);
  const [notice, setNotice] = useState('新收集到一种生日');
  const holdFrame = useRef(0);
  const playerRef = useRef<ReturnType<typeof createPlayer> | null>(null);
  if (!playerRef.current) playerRef.current = createPlayer();

  useEffect(() => {
    setAlbum(loadAlbum());
  }, []);

  const finish = (id: EndingId) => {
    setEnding(id);
    setPhase('ending');
    setAlbum((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem(ALBUM_KEY, JSON.stringify(next));
      setNotice(prev.includes(id) ? '这种生日你已经收进相册' : '新收集到一种生日');
      return next;
    });
  };

  const restart = () => {
    setPhase('wake');
    setLit(0);
    setBlown(false);
    setHold(0);
    setCakeStep(0);
    setOpened([]);
    setEnding(null);
  };

  const toggleMusic = async () => {
    const player = playerRef.current;
    if (!player) return;
    if (musicOn) {
      player.stop();
      setMusicOn(false);
      return;
    }
    await player.start();
    setMusicOn(true);
  };

  const startHold = () => {
    const begun = performance.now();
    const step = (now: number) => {
      const ratio = Math.min(1, (now - begun) / 900);
      setHold(ratio);
      if (ratio >= 1) {
        setBlown(true);
        return;
      }
      holdFrame.current = requestAnimationFrame(step);
    };
    holdFrame.current = requestAnimationFrame(step);
  };

  const cancelHold = () => {
    cancelAnimationFrame(holdFrame.current);
    if (!blown) setHold(0);
  };

  const art =
    phase === 'wake' ? 'dawn' :
    phase === 'candles' ? 'blanket' :
    phase === 'cake' ? 'shop' :
    phase === 'letters' ? 'phone' :
    ENDINGS[ending || 'wish'].art;

  const total = Object.keys(ENDINGS).length;

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-[#0c1418] text-[#f3eadc]">
      <div className={`scene scene-${art}`} aria-hidden="true" />
      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.35em] text-[#e7c98a]">十月十六 · 你的生日</p>
            <p className="mt-2 text-xs text-white/55">相册 {album.length} / {total}</p>
          </div>
          <button
            type="button"
            onClick={toggleMusic}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs tracking-widest ${
              musicOn ? 'border-[#e7c98a] bg-[#e7c98a] text-[#1b140c]' : 'border-white/20 bg-black/30'
            }`}
          >
            {musicOn ? '关闭音乐' : '背景音乐'}
          </button>
        </header>

        {phase === 'wake' && (
          <section className="scene-card">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">这一岁，想怎么开始</h1>
            <p className="mt-4 leading-8 text-[#f6efe4]/90">蜡烛、蛋糕、还有那些想对你说生日快乐的人，都在等你先走一步。选哪条都可以，最后都会被好好庆祝。</p>
            <div className="mt-6 grid gap-3">
              <Choice text="在家里，先点起蜡烛" onClick={() => setPhase('candles')} />
              <Choice text="出门，把生日蛋糕抱回来" onClick={() => setPhase('cake')} />
              <Choice text="先拆开别人写下的祝福" onClick={() => setPhase('letters')} />
            </div>
          </section>
        )}

        {phase === 'candles' && (
          <section className="scene-card">
            <h1 className="font-serif text-4xl leading-tight">三支只为你亮的蜡烛</h1>
            <p className="mt-4 leading-8">点一下，亮一支。三支都亮了，再按住把它们吹灭。火会灭，暖还在。</p>
            <div className="mt-6 flex justify-center gap-6">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  type="button"
                  disabled={blown || index !== lit}
                  onClick={() => setLit((value) => Math.min(3, value + 1))}
                  className="flex flex-col items-center gap-2 disabled:opacity-100"
                >
                  <span className={`flame ${index < lit && !blown ? 'is-on' : ''} ${blown ? 'is-out' : ''}`} />
                  <span className="h-10 w-2 rounded-sm bg-[#f6edd9]" />
                </button>
              ))}
            </div>
            {lit < 3 && !blown && <p className="mt-4 text-center text-sm text-[#e7c98a]">还差 {3 - lit} 支</p>}
            {lit === 3 && !blown && (
              <button
                type="button"
                onPointerDown={startHold}
                onPointerUp={cancelHold}
                onPointerCancel={cancelHold}
                className="relative mt-6 w-full overflow-hidden rounded-2xl border border-[#e7c98a]/50 px-4 py-4"
              >
                <span className="absolute inset-y-0 left-0 bg-[#e7c98a]/30" style={{ width: `${hold * 100}%` }} />
                <span className="relative">按住，吹灭蜡烛</span>
              </button>
            )}
            {blown && (
              <div className="mt-6 grid gap-3">
                <p className="text-center text-[#e7c98a]">灭了。这一岁的光留在亮处。</p>
                <Choice text="把愿望轻轻说完" onClick={() => finish('wish')} />
                <Choice text="跟着生日歌唱完一遍" onClick={() => finish('song')} />
              </div>
            )}
          </section>
        )}

        {phase === 'cake' && (
          <section className="scene-card">
            <h1 className="font-serif text-4xl leading-tight">把生日蛋糕准备好</h1>
            <p className="mt-4 leading-8">店员已经说了生日快乐。接下来由你亲手完成它，每一步都可以慢慢来。</p>
            <ol className="mt-6 grid gap-3">
              {['打开盒子', '看清奶油上的字', '插上蜡烛', '切下第一角'].map((label, index) => (
                <li key={label}>
                  <button
                    type="button"
                    disabled={cakeStep !== index}
                    onClick={() => setCakeStep(index + 1)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left ${
                      cakeStep > index
                        ? 'border-[#e7c98a] bg-[#e7c98a]/15'
                        : 'border-white/15 bg-black/35 disabled:opacity-50'
                    }`}
                  >
                    {cakeStep > index ? '完成 · ' : ''}{label}
                    {index === 1 && cakeStep > 1 && <span className="mt-2 block text-sm text-[#e7c98a]">上面写着：生日快乐</span>}
                  </button>
                </li>
              ))}
            </ol>
            {cakeStep >= 4 && (
              <div className="mt-6 grid gap-3">
                <Choice text="第一口自己尝" onClick={() => finish('bite')} />
                <Choice text="等会一起笑的人来切" onClick={() => finish('share')} />
              </div>
            )}
          </section>
        )}

        {phase === 'letters' && (
          <section className="scene-card">
            <h1 className="font-serif text-4xl leading-tight">三封还没拆的祝福</h1>
            <p className="mt-4 leading-8">点开它们。每一封都是有人记得，今天是你的生日。</p>
            <div className="mt-6 grid gap-3">
              {LETTERS.map((letter, index) => {
                const isOpen = opened.includes(index);
                return (
                  <button
                    key={letter.from}
                    type="button"
                    onClick={() => setOpened((prev) => (prev.includes(index) ? prev : [...prev, index]))}
                    className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-left"
                  >
                    <span className="text-xs tracking-[0.2em] text-[#e7c98a]">{letter.from}</span>
                    <span className="mt-2 block leading-7">{isOpen ? letter.text : '点开这封生日快乐'}</span>
                  </button>
                );
              })}
            </div>
            {opened.length === LETTERS.length && (
              <div className="mt-6 grid gap-3">
                <Choice text="请他们今晚来吹蜡烛" onClick={() => finish('party')} />
                <Choice text="一封封把感谢回过去" onClick={() => finish('reply')} />
              </div>
            )}
          </section>
        )}

        {phase === 'ending' && ending && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">{notice}</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight">{ENDINGS[ending].title}</h1>
            {ENDINGS[ending].lines.map((line) => (
              <p key={line} className="mt-4 leading-8">{line}</p>
            ))}
            <p className="mt-6 border-t border-[#e7c98a]/40 pt-4 text-lg text-[#e7c98a]">{ENDINGS[ending].line}</p>
            <button type="button" onClick={restart} className="mt-6 w-full rounded-2xl bg-[#e7c98a] px-4 py-4 text-[#1b140c]">
              再过一次这个生日
            </button>
          </section>
        )}

        <section className="mt-8">
          <p className="text-xs tracking-[0.28em] text-white/45">生日相册</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.keys(ENDINGS) as EndingId[]).map((id) => (
              <div key={id} className={`rounded-xl border px-3 py-3 text-sm ${album.includes(id) ? 'border-[#e7c98a]/60 text-[#f6efe4]' : 'border-white/10 text-white/35'}`}>
                {album.includes(id) ? ENDINGS[id].title : '还没走过'}
              </div>
            ))}
          </div>
        </section>
      </main>
      <style>{`
        .font-serif { font-family: "Songti SC", "Noto Serif SC", "STSong", serif; }
        .scene { position: fixed; inset: 0; pointer-events: none; }
        .scene::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(12,20,24,0.12), rgba(12,20,24,0.78) 58%, #0c1418); }
        .scene-dawn { background: radial-gradient(circle at 50% 18%, #f0c27a, #c45c4a 30%, #102028 72%); }
        .scene-blanket { background: radial-gradient(circle at 50% 30%, #ffd7a1, #8c4b32 42%, #1a1412 76%); }
        .scene-kitchen, .scene-shop { background: radial-gradient(circle at 70% 28%, #ffe0a3, #e07a3d 36%, #24160f 74%); }
        .scene-room { background: radial-gradient(circle at 40% 30%, #f7d7e8, #6d4b7a 40%, #15141c 75%); }
        .scene-cafe { background: radial-gradient(circle at 40% 35%, #f6d7a8, #a8643a 40%, #23160f 74%); }
        .scene-phone { background: radial-gradient(circle at 50% 40%, #f7f1e4, #8a5a3a 34%, #101820 74%); }
        .scene-card { animation: rise 0.45s ease; }
        .flame { width: 18px; height: 28px; border-radius: 50% 50% 45% 45%; background: transparent; }
        .flame.is-on { background: radial-gradient(circle at 50% 70%, #fff6dc, #ffb15a 40%, #ff5d32 72%, transparent 74%); filter: drop-shadow(0 0 8px #ffb15a); }
        .flame.is-out { opacity: 0.15; background: #888; }
        @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
};

function Choice({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-left text-base leading-7 backdrop-blur-md hover:border-[#e7c98a]/70"
    >
      {text}
    </button>
  );
}

export default Rebirth;

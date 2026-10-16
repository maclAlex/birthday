import React, { useEffect, useRef, useState } from 'react';

type EndingId = 'wish' | 'song' | 'heard' | 'met' | 'street' | 'flower' | 'bite' | 'share' | 'party' | 'reply';

const ENDINGS: Record<EndingId, { title: string; art: string; lines: string[]; line: string }> = {
  wish: {
    title: '愿望留在烛台上',
    art: 'kitchen',
    lines: [
      '你把那句话留在还温着的烛台边，没有急着出门。光已经灭了，句子还在。',
      '下午有风从窗进来。你给自己热了一杯东西，慢慢喝完。生日不一定要热闹，被自己记住也算过完。',
      '天色暗下来时，你又看了一眼那张卡片。上面的愿望还是很小，小得刚刚能装进这一岁。',
    ],
    line: '生日快乐。第一支火是你点的，第一句话也是你对自己说的。',
  },
  song: {
    title: '这一遍只唱给自己',
    art: 'room',
    lines: [
      '最后一个音落下以后，房间安静了一小会儿。你没有把录音发出去。',
      '这首歌今天的听众就是你。唱到第二遍时，你已经会在该笑的地方笑了。',
      '夜里你把旋律又哼了一遍。没有人鼓掌，可蜡烛的味道还在，像有人在旁边坐着。',
    ],
    line: '生日快乐。这一岁的第一首歌，是唱给你的。',
  },
  heard: {
    title: '电话那头接上了',
    art: 'phone',
    lines: [
      '你把刚唱完的那句又哼了一遍。对面安静了两秒，然后一起接上「祝你生日快乐」。',
      '两个人的声音都有点不齐。不齐也没关系，齐的是那句想把今天交给你的心意。',
      '挂掉之前对方说，蛋糕可以下次补，这句话不能下次。你握着手机，手心是热的。',
    ],
    line: '生日快乐。有人隔着距离，还是把歌给你唱完了。',
  },
  met: {
    title: '愿望被接住了',
    art: 'cafe',
    lines: [
      '你把很小的那个愿望说出来。对方没有觉得它小，只是把杯子往你这边推了推。',
      '后来你们一起点了蜡烛。火苗晃的时候，你发现自己说出口的话，真的有人在听。',
      '回家的路上你还记得对方的那句：这一岁，高兴的时候我在。',
    ],
    line: '生日快乐。你许下的事，被会一起笑的人接住了。',
  },
  street: {
    title: '路上的一句生日快乐',
    art: 'street',
    lines: [
      '你没有特意找谁。阳光落在手上，经过花店时，有人抬头说了句生日快乐，声音不大。',
      '你点了点头。那句话跟着你又走了两条街，像口袋里多了一颗很轻的糖。',
      '回到家，烛台上的烟已经散了。你还是觉得今天被好好叫过一次名字，虽然对方只是说了你的日子。',
    ],
    line: '生日快乐。世界没有围过来，也还是对你说了那句话。',
  },
  flower: {
    title: '花回到烛台旁边',
    art: 'flower',
    lines: [
      '你把那枝花放在刚熄灭的蜡烛旁边。花比火长久一点，刚好够陪过今天。',
      '你给花换了水，又把愿望卡片压在花瓶底下，免得被风吹走。',
      '晚上灯开得很柔。花还在，句子还在，这一岁就从这么小的桌上开始了。',
    ],
    line: '生日快乐。光灭了，花还在你身边。',
  },
  bite: {
    title: '第一口留给自己',
    art: 'shop',
    lines: [
      '你把蛋糕放在最亮的地方，看清奶油上的字，才肯切。字是「生日快乐」，一笔一画都给你。',
      '第一口你吃得很慢。甜得刚刚好，像有人提前知道你今天需要被这样对待。',
      '剩下的你用盒子盖好。不是舍不得分，是想让这个味道在今天多停留一会儿。',
    ],
    line: '生日快乐。蛋糕的第一口，被你认真吃掉了。',
  },
  share: {
    title: '这一刀一起落下',
    art: 'cafe',
    lines: [
      '人还没到齐，蛋糕已经在灯下等着。门开时，先听见的是生日快乐，然后才是脚步。',
      '你们手叠着手切下去。盘子传了一圈，每个人嘴里都是同一块甜。',
      '有人把最大的那块推回你面前，说今天可以自私一点。你收下了。',
    ],
    line: '生日快乐。这一刀，是大家一起帮你落下的。',
  },
  party: {
    title: '蜡烛被很多人围住',
    art: 'cafe',
    lines: [
      '灯关掉的时候，只剩你面前那几支火。生日歌有点不齐，但每一声都在叫你。',
      '你吹灭它们。掌声先于灯光回来。有人笑着说烟熏到眼了，其实是高兴。',
      '散场以后桌上还有蜡油和花。你知道这一岁，是被一圈人一起点亮的。',
    ],
    line: '生日快乐。这一夜的光，是大家帮你护着的。',
  },
  reply: {
    title: '感谢比蜡烛先到',
    art: 'phone',
    lines: [
      '你一封封回。有的只写「收到啦」，有的多说了几句近况。每发出去一句，生日就更完整一点。',
      '有人秒回了一个蛋糕表情，有人过了很久才回，说刚看到，生日快乐。你都收下了。',
      '屏幕安静下来时，那些祝你生日快乐的话还亮着，像一小排没有灭的灯。',
    ],
    line: '生日快乐。人没有全部到场，祝愿已经到齐了。',
  },
};

const LETTERS = [
  { from: '一直记得你的人', text: '生日快乐。不用变得更耀眼，今天这样就已经很好。想你的时候，就会希望你正在被温柔对待。' },
  { from: '会一起笑的人', text: '蛋糕我可以晚点到，祝福不能晚点。生日快乐。今晚要是想被人围着，我就在。' },
  { from: '忽然想起你的人', text: '看到日期才发觉，今天是你的生日。愿你这一岁吃到甜的，遇到软的，累了有地方靠。' },
];

const WISHES = ['这一岁，累了有地方歇', '这一岁，高兴时有人接住', '这一岁，记得对自己好一点'];

const LYRICS = ['祝你生日快乐', '祝你生日快乐', '祝你生日快乐', '祝你永远快乐'];

const photoUrl = `${(import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'}birthday.jpg`;

const TRACKS = [
  { id: 'serenade', name: '生日小夜曲', file: 'a-birthday-serenade.mp3' },
  { id: 'box', name: '八音盒', file: 'music-box-birthday.mp3' },
  { id: 'breeze', name: '海边微风', file: 'bayside-breeze.mp3' },
];

function createPlayer() {
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0.45;
  let current = '';
  const load = (file: string) => {
    if (current === file) return;
    current = file;
    audio.src = `${base}${file}`;
  };
  load(TRACKS[0].file);
  return {
    async start() {
      await audio.play();
    },
    stop() {
      audio.pause();
    },
    async use(file: string) {
      const playing = !audio.paused;
      load(file);
      if (playing) await audio.play();
    },
  };
}

type Story = {
  time: string;
  title: string;
  art: string;
  lines: string[];
  choices: Array<{ text: string; to: string }>;
};

const STORIES: Record<string, Story> = {
  wake: {
    time: '清晨',
    title: '这一岁，想怎么开始',
    art: 'dawn',
    lines: [
      '十月十六。你睁开眼，生日已经放在今天里了。',
      '蜡烛、蛋糕，还有那些想对你说生日快乐的人，都在等你先走一步。慢慢来，每条路最后都会被好好庆祝。',
    ],
    choices: [
      { text: '在家里，先点起蜡烛', to: 'candles' },
      { text: '出门，把生日蛋糕抱回来', to: 'cake' },
      { text: '先拆开别人写下的祝福', to: 'letters' },
    ],
  },
  'after-candles': {
    time: '清晨',
    title: '火灭了，房间还亮着',
    art: 'blanket',
    lines: [
      '烟往上走。你还闻得到一点点蜡，甜甜的，像刚被叫过生日快乐。',
      '窗外的天已经完全亮了。生日才走了第一步，后面还可以许愿，也可以先唱歌。',
    ],
    choices: [
      { text: '把愿望说给这一岁听', to: 'wish' },
      { text: '先把生日歌唱出来', to: 'lyrics' },
    ],
  },
  'after-wish': {
    time: '上午',
    title: '愿望已经说完',
    art: 'kitchen',
    lines: [
      '那句话不大。你说完以后，自己先相信了一点。',
      '卡片还温着。你可以把它留在烛台边，也可以揣着它去见人。',
    ],
    choices: [
      { text: '揣着愿望，去找会一起笑的人', to: 'meet' },
      { text: '自己走到外面，让风吹一吹', to: 'walk' },
      { text: '把卡片留在烛台上，今天就在家里过', to: 'end:wish' },
    ],
  },
  meet: {
    time: '午后',
    title: '门开的时候先是笑',
    art: 'cafe',
    lines: [
      '对方看见你，第一句就是生日快乐。桌上已经留了位置，像是早就知道你会来。',
      '你口袋里那句很小的愿望，忽然有了听众。茶是热的，话也可以慢慢说。',
    ],
    choices: [
      { text: '把愿望告诉对方', to: 'end:met' },
      { text: '今晚一起把蜡烛再点一次', to: 'together:party' },
    ],
  },
  walk: {
    time: '午后',
    title: '路是暖的',
    art: 'street',
    lines: [
      '你沿着熟悉的路走。没有人催你，生日跟着脚步，一点一点展开。',
      '经过花店时，店里的人抬头看了你一眼，很轻地说了句生日快乐。',
    ],
    choices: [
      { text: '对那句祝福点点头，继续走', to: 'bench' },
      { text: '买一枝花，带回烛台旁边', to: 'end:flower' },
    ],
  },
  bench: {
    time: '傍晚',
    title: '在长椅上把今天坐完',
    art: 'park',
    lines: [
      '你坐下来，把白天的愿望又在心里说了一遍。风把树叶翻过去，像在替你鼓掌。',
      '手机震了一下。有人发来一句迟到的生日快乐，后面跟着一个很小的蛋糕。',
    ],
    choices: [
      { text: '回一句谢谢，然后慢慢回家', to: 'end:street' },
      { text: '请那个人晚上来家里坐坐', to: 'together:party' },
    ],
  },
  'after-lyrics': {
    time: '上午',
    title: '歌已经唱完一遍',
    art: 'room',
    lines: [
      '最后一个音落下时，房间里还留着旋律。你忽然很想让某个人也听见。',
      '也可以不发给任何人。今天这首歌，本来就可以只属于你。',
    ],
    choices: [
      { text: '打给会接住你的人，再唱一遍', to: 'call' },
      { text: '这一遍只留给自己', to: 'end:song' },
    ],
  },
  call: {
    time: '午后',
    title: '电话接通了',
    art: 'phone',
    lines: [
      '你还没说完来意，对方先笑了一下，问是不是要过生日。',
      '你把刚才那四句又哼了一遍。对面跟着你，一句一句补上。',
    ],
    choices: [
      { text: '就这样隔着电话，把歌听完', to: 'end:heard' },
      { text: '约在今晚，当面再吹一次蜡烛', to: 'together:party' },
    ],
  },
  'after-cake': {
    time: '午后',
    title: '蛋糕已经在手里',
    art: 'shop',
    lines: [
      '盒子有一点沉。店员把「生日快乐」说得很认真，像这四个字今天只给你。',
      '奶油还凉着。你可以再配一点花和蜡烛，也可以先回家把桌子空出来。',
    ],
    choices: [
      { text: '再配一支蜡烛和一朵花', to: 'florist' },
      { text: '先回家，把最亮的位置留出来', to: 'table' },
    ],
  },
  florist: {
    time: '午后',
    title: '花和蜡烛一起',
    art: 'flower',
    lines: [
      '花店的人问你写给谁。你说，写给我自己的生日。对方把丝带打得很仔细。',
      '你抱着蛋糕和花站在路边，忽然觉得今天已经很完整，也还可以再完整一点。',
    ],
    choices: [
      { text: '找一张长椅，先自己尝一口', to: 'taste' },
      { text: '带回家，等一个会一起来的人', to: 'wait' },
    ],
  },
  taste: {
    time: '傍晚',
    title: '路边的第一口',
    art: 'park',
    lines: [
      '你小心地掀开一角。奶油上的字还在，你避开那四个字，先尝了旁边。',
      '甜意化开的时候，有风，有晚霞，还有一句你自己对自己说的生日快乐。',
    ],
    choices: [
      { text: '剩下的带回家，慢慢吃完', to: 'end:bite' },
      { text: '分一半给刚好路过、也对你说了生日快乐的人', to: 'end:share' },
    ],
  },
  wait: {
    time: '傍晚',
    title: '桌子已经摆好',
    art: 'vase',
    lines: [
      '花插在蛋糕旁边。蜡烛还没点，门也还没响。你把盘子擦了一遍，又擦了一遍。',
      '消息发出去不久，回复就来了：马上到。生日快乐先放在这里。',
    ],
    choices: [
      { text: '等他们进门，一起切', to: 'end:share' },
      { text: '人来了再一起吹蜡烛', to: 'together:party' },
    ],
  },
  table: {
    time: '傍晚',
    title: '最亮的位置留给蛋糕',
    art: 'kitchen',
    lines: [
      '你把盒子打开，看清上面的字，才肯决定下一步。字是生日快乐，一笔一画都安稳。',
      '屋子里只有你。这不是冷清，是生日把第一段时间交还给你自己。',
    ],
    choices: [
      { text: '自己切下第一刀', to: 'end:bite' },
      { text: '发一句：蛋糕好了，来一起过生日', to: 'invite' },
    ],
  },
  invite: {
    time: '夜里',
    title: '回复来得很快',
    art: 'phone',
    lines: [
      '「马上到。」后面跟着三个感叹号，和一句被你看了两遍的生日快乐。',
      '你把多余的盘子拿出来。门还没开，屋子已经像有人在路上了。',
    ],
    choices: [
      { text: '等他们进门，手叠着手切', to: 'end:share' },
      { text: '先把蜡烛点上，等人来了一起吹', to: 'together:party' },
    ],
  },
  'after-letters': {
    time: '上午',
    title: '三封都拆开了',
    art: 'phone',
    lines: [
      '你知道今天有人记得你。记得的方式不一样，温度是一样的。',
      '屏幕亮着。你可以先回最想回的那封，也可以直接把晚上约出来。',
    ],
    choices: [
      { text: '先回那封最想回的', to: 'pick' },
      { text: '直接约大家晚上见', to: 'plan' },
    ],
  },
  pick: {
    time: '上午',
    title: '选一封先回',
    art: 'phone',
    lines: [
      '不必每封都写很长。你先把最想送达的那句感谢送出去。',
      '发出去之后，你盯着对话框看了一会儿，像是在等一个已经知道会来的拥抱。',
    ],
    choices: LETTERS.map((letter, index) => ({ text: `回给${letter.from}`, to: `answered:${index}` })),
  },
  plan: {
    time: '午后',
    title: '晚上的地方定好了',
    art: 'cafe',
    lines: [
      '你选了一个不用赶路的地方。灯到时候会暗下来，只留蜡烛。',
      '每个人都回了「在」。有人还问要不要带第二份甜的。你说，人到了就好。',
    ],
    choices: [
      { text: '今晚就这样被围着吹蜡烛', to: 'together:party' },
      { text: '让每个人留下一句只对你说的话', to: 'notes' },
    ],
  },
  notes: {
    time: '傍晚',
    title: '一句一句交给你',
    art: 'book',
    lines: [
      '有人写「今天可以什么都不做」。有人写「我在」。还有人写了很长，长到你要读两遍。',
      '你把这些话折好，放进今天。它们比蜡烛先到，也会比蜡烛留得久一点。',
    ],
    choices: [
      { text: '读完，再请大家围过来吹蜡烛', to: 'together:party' },
      { text: '先把感谢一封封回完', to: 'end:reply' },
    ],
  },
};

function answeredStory(index: number): Story {
  const letter = LETTERS[index];
  return {
    time: '午后',
    title: '对方回你了',
    art: 'phone',
    lines: [
      `${letter.from}很快回了一句：收到你的谢谢，生日快乐要再说一次。`,
      '对话框安静下来之前，对方问你，今晚想被人围着，还是就这样隔空把生日过完。',
    ],
    choices: [
      { text: '请对方今晚来，一起吹蜡烛', to: 'together:party' },
      { text: '把感谢写完整，隔空庆祝', to: 'end:reply' },
    ],
  };
}

const ALBUM_KEY = 'birthday-endings-v2';

function loadAlbum(): EndingId[] {
  try {
    const raw = localStorage.getItem(ALBUM_KEY);
    const parsed = raw ? (JSON.parse(raw) as EndingId[]) : [];
    return parsed.filter((id) => id in ENDINGS);
  } catch {
    return [];
  }
}

type Play = 'candles' | 'cake' | 'letters' | 'wish' | 'lyrics' | 'together' | null;

const Rebirth: React.FC = () => {
  const [storyId, setStoryId] = useState('wake');
  const [play, setPlay] = useState<Play>(null);
  const [ending, setEnding] = useState<EndingId | null>(null);
  const [lit, setLit] = useState(0);
  const [blown, setBlown] = useState(false);
  const [hold, setHold] = useState(0);
  const [cakeStep, setCakeStep] = useState(0);
  const [opened, setOpened] = useState<number[]>([]);
  const [sung, setSung] = useState(0);
  const [wish, setWish] = useState('');
  const [keeps, setKeeps] = useState<string[]>([]);
  const [album, setAlbum] = useState<EndingId[]>(() => loadAlbum());
  const [steps, setSteps] = useState(1);
  const [musicOn, setMusicOn] = useState(false);
  const [trackId, setTrackId] = useState(TRACKS[0].id);
  const [notice, setNotice] = useState('');
  const [impatient, setImpatient] = useState(false);
  const photoRef = useRef<HTMLElement | null>(null);
  const totalEndings = Object.keys(ENDINGS).length;
  const showPhoto = impatient || album.length >= totalEndings;
  const musicBlock = useRef(false);
  const holdFrame = useRef(0);
  const playerRef = useRef<ReturnType<typeof createPlayer> | null>(null);
  if (!playerRef.current) playerRef.current = createPlayer();

  useEffect(() => {
    if (showPhoto) photoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [showPhoto]);

  const story = storyId.startsWith('answered:')
    ? answeredStory(Number(storyId.split(':')[1]))
    : STORIES[storyId];

  const addKeep = (label: string) => {
    setKeeps((prev) => (prev.includes(label) ? prev : [...prev, label]));
  };

  const ensureMusic = async () => {
    if (musicBlock.current || musicOn) return;
    await playerRef.current?.start();
    setMusicOn(true);
  };

  const goStory = (id: string) => {
    setPlay(null);
    setEnding(null);
    setStoryId(id);
    setSteps((value) => value + 1);
  };

  const finish = (id: EndingId) => {
    setPlay(null);
    setEnding(id);
    setSteps((value) => value + 1);
    setAlbum((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem(ALBUM_KEY, JSON.stringify(next));
      setNotice(prev.includes(id) ? '这种生日已经在相册里' : '新收进相册的一种生日');
      return next;
    });
  };

  const travel = async (to: string) => {
    await ensureMusic();
    if (to.startsWith('end:')) {
      finish(to.slice(4) as EndingId);
      return;
    }
    if (to.startsWith('together:')) {
      setEnding(to.slice(9) as EndingId);
      setPlay('together');
      setBlown(false);
      setHold(0);
      setLit(0);
      setSteps((value) => value + 1);
      return;
    }
    if (to === 'candles' || to === 'cake' || to === 'letters' || to === 'wish' || to === 'lyrics') {
      setPlay(to);
      setSteps((value) => value + 1);
      return;
    }
    goStory(to);
  };

  const restart = () => {
    setStoryId('wake');
    setPlay(null);
    setEnding(null);
    setLit(0);
    setBlown(false);
    setHold(0);
    setCakeStep(0);
    setOpened([]);
    setSung(0);
    setWish('');
    setKeeps([]);
    setSteps(1);
    setNotice('');
  };

  const toggleMusic = async () => {
    if (musicOn) {
      playerRef.current?.stop();
      musicBlock.current = true;
      setMusicOn(false);
      return;
    }
    musicBlock.current = false;
    await playerRef.current?.start();
    setMusicOn(true);
  };

  const chooseTrack = async (id: string, file: string) => {
    setTrackId(id);
    musicBlock.current = false;
    await playerRef.current?.use(file);
    await playerRef.current?.start();
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

  const art = ending && !play ? ENDINGS[ending].art : play === 'candles' || play === 'together' ? 'blanket' : play === 'cake' ? 'shop' : play === 'letters' || play === 'lyrics' ? 'phone' : play === 'wish' ? 'kitchen' : story.art;

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-[#0c1418] text-[#f3eadc]">
      <div className={`scene scene-${art}`} aria-hidden="true" />
      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.35em] text-[#e7c98a]">十月十六 · 你的生日</p>
            <p className="mt-2 text-xs text-white/55">第 {steps} 幕 · 相册 {album.length} / {totalEndings}</p>
          </div>
          <button
            type="button"
            onClick={toggleMusic}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs tracking-widest ${
              musicOn ? 'border-[#e7c98a] bg-[#e7c98a] text-[#1b140c]' : 'border-white/20 bg-black/30'
            }`}
          >
            {musicOn ? '音乐开着' : '打开音乐'}
          </button>
        </header>
        <div className="mb-4 flex flex-wrap gap-2">
          {TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => chooseTrack(track.id, track.file)}
              className={`rounded-full border px-3 py-2 text-xs ${
                trackId === track.id && musicOn
                  ? 'border-[#e7c98a] bg-[#e7c98a]/20 text-[#e7c98a]'
                  : 'border-white/15 bg-black/30 text-white/70'
              }`}
            >
              {track.name}
            </button>
          ))}
        </div>

        {keeps.length > 0 && (
          <p className="mb-4 text-xs leading-6 text-[#e7c98a]/80">今天带着：{keeps.join(' · ')}</p>
        )}

        {!play && !ending && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">{story.time}</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{story.title}</h1>
            {wish && storyId === 'after-wish' && <p className="mt-4 text-[#e7c98a]">你说的是：{wish}</p>}
            {story.lines.map((line) => (
              <p key={line} className="mt-4 leading-8 text-[#f6efe4]/90">{line}</p>
            ))}
            <div className="mt-6 grid gap-3">
              {story.choices.map((choice) => (
                <Choice key={choice.text} text={choice.text} onClick={() => travel(choice.to)} />
              ))}
            </div>
          </section>
        )}

        {play === 'candles' && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">清晨</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">三支只为你亮的蜡烛</h1>
            <p className="mt-4 leading-8">点一下，亮一支。三支都亮了，再按住把它们吹灭。火会灭，这一岁的暖还在。</p>
            <div className="mt-6 flex justify-center gap-6">
              {[0, 1, 2].map((index) => (
                <button key={index} type="button" disabled={blown || index !== lit} onClick={() => { void ensureMusic(); setLit((value) => Math.min(3, value + 1)); }} className="flex flex-col items-center gap-2">
                  <span className={`flame ${index < lit && !blown ? 'is-on' : ''} ${blown ? 'is-out' : ''}`} />
                  <span className="h-10 w-2 rounded-sm bg-[#f6edd9]" />
                </button>
              ))}
            </div>
            {lit < 3 && <p className="mt-4 text-center text-sm text-[#e7c98a]">还差 {3 - lit} 支</p>}
            {lit === 3 && !blown && (
              <button type="button" onPointerDown={startHold} onPointerUp={cancelHold} onPointerCancel={cancelHold} className="relative mt-6 w-full overflow-hidden rounded-2xl border border-[#e7c98a]/50 px-4 py-4">
                <span className="absolute inset-y-0 left-0 bg-[#e7c98a]/30" style={{ width: `${hold * 100}%` }} />
                <span className="relative">按住，吹灭蜡烛</span>
              </button>
            )}
            {blown && (
              <div className="mt-6">
                <Choice text="看着余烟，把这一步收下" onClick={() => { addKeep('自己点的蜡烛'); goStory('after-candles'); }} />
              </div>
            )}
          </section>
        )}

        {play === 'cake' && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">午后</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">把生日蛋糕准备好</h1>
            <p className="mt-4 leading-8">店员已经说了生日快乐。接下来由你亲手完成它，每一步都可以慢慢来。</p>
            <ol className="mt-6 grid gap-3">
              {['打开盒子', '看清奶油上的字', '插上蜡烛', '把丝带重新系好'].map((label, index) => (
                <li key={label}>
                  <button type="button" disabled={cakeStep !== index} onClick={() => { void ensureMusic(); setCakeStep(index + 1); }} className={`w-full rounded-2xl border px-4 py-4 text-left ${cakeStep > index ? 'border-[#e7c98a] bg-[#e7c98a]/15' : 'border-white/15 bg-black/35 disabled:opacity-50'}`}>
                    {cakeStep > index ? '完成 · ' : ''}{label}
                    {index === 1 && cakeStep > 1 && <span className="mt-2 block text-sm text-[#e7c98a]">上面写着：生日快乐</span>}
                  </button>
                </li>
              ))}
            </ol>
            {cakeStep >= 4 && (
              <div className="mt-6">
                <Choice text="抱起盒子，往下走" onClick={() => { addKeep('写着生日快乐的蛋糕'); goStory('after-cake'); }} />
              </div>
            )}
          </section>
        )}

        {play === 'letters' && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">上午</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">三封还没拆的祝福</h1>
            <p className="mt-4 leading-8">点开它们。每一封都是有人记得，今天是你的生日。</p>
            <div className="mt-6 grid gap-3">
              {LETTERS.map((letter, index) => {
                const isOpen = opened.includes(index);
                return (
                  <button key={letter.from} type="button" onClick={() => { void ensureMusic(); setOpened((prev) => (prev.includes(index) ? prev : [...prev, index])); }} className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-left">
                    <span className="text-xs tracking-[0.2em] text-[#e7c98a]">{letter.from}</span>
                    <span className="mt-2 block leading-7">{isOpen ? letter.text : '点开这封生日快乐'}</span>
                  </button>
                );
              })}
            </div>
            {opened.length === LETTERS.length && (
              <div className="mt-6">
                <Choice text="把这些话先放在心口" onClick={() => { addKeep('三封祝福'); goStory('after-letters'); }} />
              </div>
            )}
          </section>
        )}

        {play === 'wish' && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">清晨</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">许一个很小的愿</h1>
            <p className="mt-4 leading-8">不必很大。挑一句你今天愿意相信的话。说出来，这一岁就会朝那边靠一点。</p>
            <div className="mt-6 grid gap-3">
              {WISHES.map((item) => (
                <Choice key={item} text={item} onClick={() => { setWish(item); addKeep(item); goStory('after-wish'); }} />
              ))}
            </div>
          </section>
        )}

        {play === 'lyrics' && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">上午</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">把生日歌唱完</h1>
            <p className="mt-4 leading-8">点一句，唱一句。背景里的旋律会跟着你。唱完这四句，歌就是你的了。</p>
            <div className="mt-6 grid gap-3">
              {LYRICS.map((line, index) => (
                <button key={line + index} type="button" disabled={sung !== index} onClick={() => { void ensureMusic(); setSung(index + 1); }} className={`rounded-2xl border px-4 py-4 text-left ${sung > index ? 'border-[#e7c98a] text-[#e7c98a]' : 'border-white/15 disabled:opacity-40'}`}>
                  {sung > index ? line : '点一下，唱出这一句'}
                </button>
              ))}
            </div>
            {sung >= LYRICS.length && (
              <div className="mt-6">
                <Choice text="最后一个音也收下" onClick={() => { addKeep('唱给自己的生日歌'); goStory('after-lyrics'); }} />
              </div>
            )}
          </section>
        )}

        {play === 'together' && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">夜里</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">灯关掉了</h1>
            <p className="mt-4 leading-8">大家围着你。先把五支蜡烛点亮，再按住，替这一岁把火吹灭。歌会有点不齐，心意是齐的。</p>
            <div className="mt-6 flex justify-center gap-3">
              {[0, 1, 2, 3, 4].map((index) => (
                <button key={index} type="button" disabled={blown || index !== lit} onClick={() => setLit((value) => Math.min(5, value + 1))} className="flex flex-col items-center gap-2">
                  <span className={`flame ${index < lit && !blown ? 'is-on' : ''} ${blown ? 'is-out' : ''}`} />
                  <span className="h-8 w-1.5 rounded-sm bg-[#f6edd9]" />
                </button>
              ))}
            </div>
            {lit === 5 && !blown && (
              <button type="button" onPointerDown={startHold} onPointerUp={cancelHold} onPointerCancel={cancelHold} className="relative mt-6 w-full overflow-hidden rounded-2xl border border-[#e7c98a]/50 px-4 py-4">
                <span className="absolute inset-y-0 left-0 bg-[#e7c98a]/30" style={{ width: `${hold * 100}%` }} />
                <span className="relative">按住，和大家一起吹</span>
              </button>
            )}
            {blown && ending && (
              <div className="mt-6">
                <Choice text="在掌声里睁开眼" onClick={() => { addKeep('一起吹灭的蜡烛'); finish(ending); }} />
              </div>
            )}
          </section>
        )}

        {ending && !play && (
          <section className="scene-card">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">{notice}</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight">{ENDINGS[ending].title}</h1>
            {wish && <p className="mt-4 text-sm text-[#e7c98a]">你今天许过：{wish}</p>}
            {ENDINGS[ending].lines.map((line) => (
              <p key={line} className="mt-4 leading-8">{line}</p>
            ))}
            <p className="mt-6 border-t border-[#e7c98a]/40 pt-4 text-lg text-[#e7c98a]">{ENDINGS[ending].line}</p>
            <button type="button" onClick={restart} className="mt-6 w-full rounded-2xl bg-[#e7c98a] px-4 py-4 text-[#1b140c]">
              再过一次这个生日
            </button>
          </section>
        )}

        {showPhoto && (
          <section ref={photoRef} className="scene-card mt-8">
            <p className="text-xs tracking-[0.28em] text-[#e7c98a]">给你的一张</p>
            <h2 className="mt-2 font-serif text-3xl">生日快乐</h2>
            <p className="mt-3 leading-8 text-[#f6efe4]/90">
              {album.length >= totalEndings ? '十种生日都走过了。这张照片，留给今天的你。' : '先看这张。剩下的生日，还可以慢慢过。'}
            </p>
            <img src={photoUrl} alt="生日快乐" className="mt-5 w-full rounded-2xl" />
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs tracking-[0.28em] text-white/45">生日相册</p>
            {!showPhoto && (
              <button type="button" onClick={() => setImpatient(true)} className="rounded-full border border-white/20 px-3 py-2 text-xs text-[#e7c98a]">
                没耐心，直接看
              </button>
            )}
          </div>
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
        .scene-room, .scene-phone { background: radial-gradient(circle at 50% 40%, #f7f1e4, #8a5a3a 34%, #101820 74%); }
        .scene-cafe { background: radial-gradient(circle at 40% 35%, #f6d7a8, #a8643a 40%, #23160f 74%); }
        .scene-street { background: radial-gradient(circle at 50% 10%, #fff1c9, #7ea0b8 32%, #1b2830 70%); }
        .scene-park { background: radial-gradient(circle at 50% 20%, #fff4d2, #6f8f62 36%, #142018 72%); }
        .scene-flower, .scene-vase { background: radial-gradient(circle at 50% 45%, #ffe7a8, #e07a78 36%, #1c2420 72%); }
        .scene-book { background: radial-gradient(circle at 35% 40%, #f4e7cf, #8d6244 42%, #1a1410 76%); }
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
    <button type="button" onClick={onClick} className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-left text-base leading-7 backdrop-blur-md hover:border-[#e7c98a]/70">
      {text}
    </button>
  );
}

export default Rebirth;

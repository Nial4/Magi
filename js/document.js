let device = String(navigator.userAgent.match(/steam|macos/i)).toLowerCase();

if (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
) device = 'ios';

document.documentElement.setAttribute('data-device', device);

// =================== 工具函数 ====================
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const finalVoteStatusEl = $('.final-vote-status');
const casperEl = $('.casper');
const items = $$('.magi-item');
const bodyEl = document.body;

const randAll = _ => {
    $('.code').innerHTML = 100 + Math.floor(Math.random() * 600);
};

let sound = true;
const soundEl = $('.sound');
soundEl.onclick = e => {
    e.stopPropagation();
    sound = !sound;
    soundEl.setAttribute('data-text', sound ? 'ON' : 'OFF');
};
soundEl.setAttribute('data-text', sound ? 'ON' : 'OFF');

// =================== Web Audio 部分 ====================
let play = _ => {
    startWebAudio();
    play();
};
let stopAll = _ => {};
let playOscillator = _ => {};

let audioCtx;
let osc;
let lfo;    
let VCO;
let carrierVolume;

// 兼容性处理
AudioContext = (window.AudioContext || window.webkitAudioContext);

let load = _ => {
    audioCtx = new AudioContext();

    audioCtx.addEventListener('close', e => {
        console.log('close');
    });

    // 创建一个增益节点，设置基础音量为 0.1
    carrierVolume = audioCtx.createGain();
    carrierVolume.gain.value = 0.1;
    carrierVolume.connect(audioCtx.destination);
};

let startWebAudio = _ => {
    play = function () {
        if (!audioCtx) {
            load();
        }
        // 创建主振荡器
        osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 2080;

        // 创建 LFO 振荡器，用于调制
        lfo = audioCtx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.value = exMode ? 30 : 10;

        // 新建一个增益节点，用来控制 LFO 的调制深度（例如设置为 0.05）
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.05;
        lfo.connect(lfoGain);
        lfoGain.connect(carrierVolume.gain);

        // 将主振荡器接入 carrierVolume 节点
        osc.connect(carrierVolume);

        lfo.start(0);
        osc.start(0);
    };

    // 用于播放短促音效（例如根据投票结果播放不同频率的音调）
    playOscillator = (hz = 3400) => {
        if (!audioCtx) {
            load();
        }
    
        VCO = audioCtx.createOscillator();
        VCO.frequency.value = hz;
        VCO.connect(carrierVolume);
        VCO.start(0);
        VCO.stop(audioCtx.currentTime + 0.8);
    };

    // 停止所有振荡器
    stopAll = _ => {
        try {
            osc.stop(0);
            lfo.stop(0);
        } catch (e) {}
        try {
            VCO.stop(audioCtx.currentTime);
        } catch (e) {}
    };
};

document.addEventListener('visibilitychange', e => {
    if (document.hidden) {
        stopAll();
        try {
            audioCtx.close();
            audioCtx = null;
        } catch (e) {}
    }
});

// 如果浏览器不支持 AudioContext，则提示错误
if (!AudioContext) {
    soundEl.setAttribute('data-text', 'ERR');
}

// =================== 其它逻辑 ====================
let volume = 66;
let reject;

randAll();
window.onkeydown = e => {
    const { keyCode } = e;
    if (keyCode === 32) {
        one();
    }
};

const voteButton = $('#myButton');
const inputField = $('#myInput');

function startVoting() {
    bodyEl.setAttribute('data-status', 'voting');
    finalVoteStatusEl.setAttribute('data-status', 'pending');
    play(); // 开始播放声音
}

function updateVotingResult(role, result) {
    const item = $(`.${role.toLowerCase()}`);
    if (item) {
        const status = result === "0" ? 'reject' : 'resolve';
        item.setAttribute('data-status', status);
        console.log(`Updated ${role} to ${status}`);
    } else {
        console.error(`Element for ${role} not found. Tried to select .${role.toLowerCase()}`);
    }
}

function stopVoting(results) {
    bodyEl.setAttribute('data-status', 'voted');
    console.log("Voting results:", results);

    let resolveCount = 0;
    let rejectCount = 0;

    for (const [role, result] of Object.entries(results)) {
        updateVotingResult(role, result);
        if (result === "0") {
            rejectCount++;
        } else {
            resolveCount++;
        }
    }

    let finalReject = rejectCount > resolveCount;

    if (finalReject) {
        finalVoteStatusEl.setAttribute('data-status', 'reject');
    } else {
        finalVoteStatusEl.setAttribute('data-status', 'resolve');
    }

    bodyEl.setAttribute('data-vote-status', finalReject ? 'reject' : 'resolve');

    stopAll(); // 停止所有声音
    playOscillator(finalReject ? 3400 : 2000); // 根据投票结果播放音效
}

// 模拟 API 调用，随机返回 "0" 或 "1"
function simulateApiCall(role) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const result = Math.random() < 0.5 ? "0" : "1";
            console.log(`Simulated result for ${role}: ${result}`);
            resolve(result);
        }, 1500); // 1.5秒延迟
    });
}

// 点击投票按钮时触发
voteButton.onclick = function() {
    console.log("Starting vote");
    startVoting();
    const action = inputField.value;
    const roles = ['MELCHIOR', 'BALTHASAR', 'CASPER'];
    const results = {};

    let requests = roles.map(role => 
        simulateApiCall(role)
            .then(result => {
                results[role] = result;
                console.log(`Result for ${role}: ${result}`);
                updateVotingResult(role, result);
                return [role, result];
            })
    );

    Promise.all(requests).then(() => {
        stopVoting(results);
    });
};

const one = () => {};

$('.reset').onclick = e => {
    e.stopPropagation();
    bodyEl.removeAttribute('data-status');
};

$('footer').onclick = e => e.stopPropagation();

// ex mode
let exMode = false;
const exModeEl = $('.ex-mode');
exModeEl.onclick = e => {
    e.stopPropagation();
    exMode = !exMode;
    bodyEl.setAttribute('data-ex-mode', exMode);
    exModeEl.setAttribute('data-text', exMode ? 'ON' : 'OFF');
};
exModeEl.setAttribute('data-text', exMode ? 'ON' : 'OFF');

// input file
const fileEl = $('.file');
fileEl.onclick = e => {
    e.stopPropagation();
    fileEl.innerText = prompt('INPUT FILE', fileEl.innerText) || 'MAGI_SYS';
};

// volume
const volumeEl = $('.volume');
const volumes = [
    1,
    10,
    33,
    50,
    66,
    90,
    65535,
];
volumeEl.onclick = e => {
    e.stopPropagation();
    const index = volumes.indexOf(volume);
    let nextIndex = index + 1;
    if (nextIndex >= volumes.length) {
        nextIndex = 0;
    }
    volume = volumes[nextIndex];
    volumeEl.setAttribute('data-text', volume);
};

// priority
const priorityEl = $('.priority');
let priority = 'A';
const prioritys = [
    'E',
    '+++',
    'A',
    'AA',
    'AAA',
];
priorityEl.onclick = e => {
    e.stopPropagation();
    const index = prioritys.indexOf(priority);
    let nextIndex = index + 1;
    if (nextIndex >= prioritys.length) {
        nextIndex = 0;
    }
    priority = prioritys[nextIndex];
    priorityEl.setAttribute('data-text', priority);
};

setTimeout(_ => {
    bodyEl.removeAttribute('data-loading');
}, 1000);

window._hmt = [];
window.dataLayer = [
    ['js', new Date()],
    ['config', 'G-13BQC1VDD8']
];
window.gtag = function() { dataLayer.push(arguments); };

const headEl = $('head');
const loadScript = (src, cb = _ => {}, el) => {
    el = document.createElement('script');
    el.src = src;
    el.onload = cb;
    headEl.appendChild(el);
};

setTimeout(_ => {
    loadScript('//hm.baidu.com/hm.js?f4e477c61adf5c145ce938a05611d5f0');
    loadScript('//www.googletagmanager.com/gtag/js?id=G-13BQC1VDD8');
}, 400);

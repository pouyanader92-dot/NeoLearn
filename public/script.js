// --- Sound System ---
let audioCtx = null;
let soundEnabled = localStorage.getItem('sound_enabled') !== 'false';

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('sound_enabled', soundEnabled);
    document.getElementById('sound-toggle').classList.toggle('active', soundEnabled);
    if(soundEnabled) playSound('click');
}

function playSound(type) {
    if(!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'level') {
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'click') {
            osc.frequency.value = 400;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
        }
    } catch(e) { console.log("Sound error", e); }
}

const DB = {
    data: null,
    async init() {
        try {
            const res = await fetch('/api/db');
            this.data = await res.json();
            if(!this.data.users) this.data.users = [];
            if(!this.data.messages) this.data.messages = [];
            if(!this.data.posts) this.data.posts = [];
            if(!this.data.poll) {
                this.data.poll = { q: "بهترین زمان برای مطالعه شما کِیه؟", opts: ["صبح زود", "ظهر", "عصر", "شب‌بیداری"], votes: [0, 0, 0, 0] };
            }
            this.data.users.forEach(u => {
                if(!u.tasks) u.tasks = [];
                if(!u.notes) u.notes = {};
                if(u.coins === undefined) u.coins = 0;
                if(!u.subscription) u.subscription = 'free';
                if(!u.streak) u.streak = 0;
                if(!u.lastActive) u.lastActive = null;
                if(!u.favoriteGame) u.favoriteGame = null;
                if(!u.pollVotes) u.pollVotes = [];
                if(!u.following) u.following = [];
                if(!u.achievements) u.achievements = [];
            });
        } catch (e) { console.error(e); this.data = { users: [], messages: [], posts: [], ownerPassword: "owner123", poll: { q: "بهترین زمان برای مطالعه شما کِیه؟", opts: ["صبح زود", "ظهر", "عصر", "شب‌بیداری"], votes: [0, 0, 0, 0] } }; }
    },
    async save() { await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.data) }); },
    getUser(u) { return this.data.users.find(x => x.username === u); },
    updateUser(u, d) { let i = this.data.users.findIndex(x => x.username === u); if(i !== -1) { Object.assign(this.data.users[i], d); this.save(); } },
    addUser(u) { this.data.users.push(u); this.save(); },
    removeUser(u) { this.data.users = this.data.users.filter(x => x.username !== u); this.save(); }
};

const METHODS = [
    { id: 1, name: "خواندن فعال", xp: 10, coins: 5, lvl: 1, icon: "book-open", desc: "خواندن با تمرکز کامل.", tool: "check" },
    { id: 2, name: "یادداشت‌برداری", xp: 10, coins: 5, lvl: 1, icon: "pen-line", desc: "نوشتن نکات کلیدی.", tool: "note" },
    { id: 3, name: "خلاصه‌نویسی", xp: 15, coins: 8, lvl: 2, icon: "file-text", desc: "خلاصه کردن مفاهیم.", tool: "note" },
    { id: 4, name: "فلش‌کارت", xp: 20, coins: 10, lvl: 2, icon: "layers", desc: "ساخت کارت سوال/جواب.", tool: "flashcard" },
    { id: 5, name: "نقشه ذهنی", xp: 25, coins: 12, lvl: 3, icon: "network", desc: "رسم نمودار درختی.", tool: "note" },
    { id: 6, name: "تکنیک پومودورو", xp: 15, coins: 8, lvl: 3, icon: "timer", desc: "۲۵ دقیقه مطالعه.", tool: "pomodoro", time: 25 },
    { id: 7, name: "یادگیری فعال", xp: 30, coins: 15, lvl: 4, icon: "zap", desc: "یادآوری از حافظه.", tool: "tap" },
    { id: 8, name: "تکنیک فاینمن", xp: 40, coins: 20, lvl: 4, icon: "user-check", desc: "آموزش ساده به دیگری.", tool: "note" },
    { id: 9, name: "تکرار فاصله‌دار", xp: 35, coins: 18, lvl: 5, icon: "repeat", desc: "مرور در زمان افزایشی.", tool: "check" },
    { id: 10, name: "روش SQ3R", xp: 35, coins: 18, lvl: 5, icon: "list-checks", desc: "پیمایش و مرور.", tool: "check" },
    { id: 11, name: "درهم‌آمیزی", xp: 40, coins: 20, lvl: 6, icon: "shuffle", desc: "ترکیب موضوعات.", tool: "challenge" },
    { id: 12, name: "دسته‌بندی", xp: 40, coins: 20, lvl: 6, icon: "box", desc: "تقسیم به قطعات.", tool: "note" },
    { id: 13, name: "تست‌سازی شخصی", xp: 45, coins: 22, lvl: 7, icon: "file-question", desc: "طراحی سوال.", tool: "math" },
    { id: 14, name: "تصویرسازی ذهنی", xp: 45, coins: 22, lvl: 7, icon: "image", desc: "تبدیل به تصویر.", tool: "speed" },
    { id: 15, name: "ارتباط معنایی", xp: 50, coins: 25, lvl: 8, icon: "link", desc: "ربط به دانش قبلی.", tool: "note" },
    { id: 16, name: "مثال‌سازی", xp: 50, coins: 25, lvl: 8, icon: "lightbulb", desc: "مثال عینی سازی.", tool: "note" },
    { id: 17, name: "روش کورنل", xp: 55, coins: 28, lvl: 9, icon: "layout-grid", desc: "بخش‌بندی برگه.", tool: "note" },
    { id: 18, name: "طوفان فکری", xp: 55, coins: 28, lvl: 9, icon: "cloud-lightning", desc: "ایده‌پردازی.", tool: "note" },
    { id: 19, name: "آموزش همکار", xp: 60, coins: 30, lvl: 10, icon: "users", desc: "یاد دادن به دوست.", tool: "check" },
    { id: 20, name: "خواب استراتژیک", xp: 30, coins: 15, lvl: 10, icon: "moon", desc: "استراحت مغز.", tool: "check" },
    { id: 21, name: "قانون دو دقیقه", xp: 15, coins: 5, lvl: 1, icon: "timer-start", desc: "شروع کار با فقط ۲ دقیقه تمرکز.", tool: "pomodoro", time: 2 },
    { id: 22, name: "ذهن‌آگاهی ۱ دقیقه", xp: 10, coins: 5, lvl: 2, icon: "brain", desc: "یک دقیقه تنفس و آرامش قبل از مطالعه.", tool: "pomodoro", time: 1 },
    { id: 23, name: "مرور سریع ۱۰ دقیقه", xp: 20, coins: 10, lvl: 3, icon: "fast-forward", desc: "مرور سریع نکات در ۱۰ دقیقه.", tool: "pomodoro", time: 10 },
    { id: 24, name: "خواندن عمیق ۱۵ دقیقه", xp: 25, coins: 12, lvl: 4, icon: "book-marked", desc: "۱۵ دقیقه مطالعه بدون حواس‌پرتی.", tool: "pomodoro", time: 15 },
    { id: 25, name: "قانون پارکینسون", xp: 40, coins: 20, lvl: 5, icon: "rocket", desc: "تمرین را در ۲۰ دقیقه تمام کن!", tool: "pomodoro", time: 20 },
    { id: 26, name: "استراحت فعال ۵ دقیقه", xp: 15, coins: 8, lvl: 6, icon: "coffee", desc: "۵ دقیقه استراحت برای بازشارژ مغز.", tool: "pomodoro", time: 5 },
    { id: 27, name: "تکنیک ۳۰/۳۰", xp: 50, coins: 25, lvl: 7, icon: "repeat-clock", desc: "۳۰ دقیقه مطالعه، ۳۰ دقیقه استراحت.", tool: "pomodoro", time: 30 },
    { id: 28, name: "بلوک زمانی ۴۵ دقیقه", xp: 55, coins: 28, lvl: 8, icon: "layers-3", desc: "۴۵ دقیقه تمرکز عمیق روی یک مبحث.", tool: "pomodoro", time: 45 },
    { id: 29, name: "قانون ۵۲/۱۷", xp: 65, coins: 30, lvl: 9, icon: "hourglass", desc: "۵۲ دقیقه کار، ۱۷ دقیقه استراحت.", tool: "pomodoro", time: 52 },
    { id: 30, name: "تمرکز اولترادین ۹۰ دقیقه", xp: 80, coins: 40, lvl: 10, icon: "infinity", desc: "۹۰ دقیقه تمرکز نهایی (ریتم طبیعی مغز).", tool: "pomodoro", time: 90 }
];

const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

const ACHIEVEMENTS = [
    { id: 'first_step', name: 'اولین قدم', desc: 'تکمیل اولین متد', icon: 'shoe-prints', check: (u) => Object.keys(u.notes || {}).length > 0 || u.xp > 10 },
    { id: 'social', name: 'اجتماعی', desc: 'اولین پست در نیوگرام', icon: 'megaphone', check: (u) => DB.data.posts.some(p => p.author === u.username) },
    { id: 'level5', name: 'پیشرفت کرده', desc: 'رسیدن به سطح ۵', icon: 'trending-up', check: (u) => getLevel(u.xp) >= 5 },
    { id: 'rich', name: 'ثروتمند', desc: 'داشتن ۱۰۰ سکه', icon: 'coins', check: (u) => u.coins >= 100 },
    { id: 'streak7', name: 'پایدار', desc: '۷ روز ورود پیاپی', icon: 'flame', check: (u) => u.streak >= 7 },
    { id: 'premium', name: 'ویژه', desc: 'خرید اشتراک پلاس', icon: 'crown', check: (u) => u.subscription === 'plus' }
];

let currentUser = null;
let isOwner = false;
let authMode = 'login';
let currentMethodId = null;
let pomodoroInterval = null;
let challengeInterval = null;
let speedInterval = null;
let tapCount = 0;

function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3000); }
function showAuthModal() { document.getElementById('auth-modal').classList.remove('hidden'); document.getElementById('auth-modal').classList.add('flex'); }
function hideAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }
function toggleAuthMode(mode) {
    authMode = mode;
    document.getElementById('auth-title').textContent = mode === 'login' ? 'ورود به نئولرن' : 'ثبت‌نام در نئولرن';
    document.getElementById('auth-btn').textContent = mode === 'login' ? 'ورود' : 'ثبت‌نام';
    document.getElementById('auth-switch').innerHTML = mode === 'login' ? 'حساب ندارید؟ <a class="text-indigo-600 cursor-pointer hover:underline" onclick="toggleAuthMode(\'register\')">ثبت‌نام کنید</a>' : 'حساب دارید؟ <a class="text-indigo-600 cursor-pointer hover:underline" onclick="toggleAuthMode(\'login\')">وارد شوید</a>';
}

async function doAuth() {
    const u = document.getElementById('auth-username').value.trim().toLowerCase();
    const p = document.getElementById('auth-password').value;
    if(!u || !p) return showToast('نام کاربری و رمز را وارد کنید');
    if(u === 'owner') {
        if(p === DB.data.ownerPassword) { isOwner = true; hideAuthModal(); initApp(); showToast('به کنسول ادمین خوش آمدید'); playSound('success'); } 
        else { showToast('رمز ادمین اشتباه است'); }
        return;
    }
    if(authMode === 'login') {
        const user = DB.getUser(u);
        if(!user || user.password !== p) return showToast('نام کاربری یا رمز اشتباه است');
        currentUser = u;
    } else {
        if(DB.getUser(u)) return showToast('این کاربر وجود دارد');
        DB.addUser({ username: u, password: p, xp: 0, coins: 0, level: 1, theme: 'indigo', tasks: [], notes: {}, subscription: 'free', streak: 0, lastActive: null, favoriteGame: null, pollVotes: [], following: [], achievements: [] });
        currentUser = u;
        playSound('success');
    }
    hideAuthModal();
    initApp();
}

function logout() { currentUser = null; isOwner = false; document.getElementById('app').classList.add('hidden'); showAuthModal(); }
function getLevel(xp) { for(let i = XP_THRESHOLDS.length-1; i >= 0; i--) { if(xp >= XP_THRESHOLDS[i]) return i+1; } return 1; }

function getSubMult(user) { if(user.subscription === 'plus') return 1.5; if(user.subscription === 'eco') return 1.2; return 1; }
function getStreakMult(user) { return user.streak >= 3 ? 1.1 : 1.0; }

function initApp() { 
    document.getElementById('app').classList.remove('hidden'); 
    updateUI(); 
    navigate('home'); 
    lucide.createIcons(); 
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function navigate(section) {
    ['home', 'tasks', 'methods', 'store', 'community', 'neogram', 'panel', 'about'].forEach(s => document.getElementById('section-'+s).classList.add('hidden'));
    document.getElementById('section-'+section).classList.remove('hidden');
    document.getElementById('mobile-menu').classList.add('hidden');
    if(section === 'methods') renderMethods();
    if(section === 'panel') renderPanel();
    if(section === 'home') { renderPath(); renderLeaderboard(); renderAchievements(); }
    if(section === 'tasks') renderTasks();
    if(section === 'community') renderCommunity();
    if(section === 'neogram') renderNeogram();
    lucide.createIcons();
}

function checkAchievements() {
    const user = DB.getUser(currentUser);
    if(!user) return;
    let newAchievement = false;
    ACHIEVEMENTS.forEach(a => {
        if(!user.achievements.includes(a.id) && a.check(user)) {
            user.achievements.push(a.id);
            newAchievement = true;
            showToast(`🏆 دستاورد جدید: ${a.name}`);
            playSound('level');
        }
    });
    if(newAchievement) DB.updateUser(currentUser, { achievements: user.achievements });
}

function renderAchievements() {
    const user = isOwner ? { achievements: ACHIEVEMENTS.map(a=>a.id) } : DB.getUser(currentUser);
    const html = ACHIEVEMENTS.map(a => {
        const unlocked = user.achievements && user.achievements.includes(a.id);
        return `
        <div class="flex flex-col items-center text-center p-2 rounded-xl ${unlocked ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200 badge-locked'} transition-all">
            <i data-lucide="${a.icon}" class="w-6 h-6 mb-1 ${unlocked ? 'text-amber-500' : 'text-slate-400'}"></i>
            <span class="text-[10px] md:text-xs font-medium ${unlocked ? 'text-amber-700' : 'text-slate-400'}">${a.name}</span>
        </div>`;
    }).join('');
    document.getElementById('achievements-container').innerHTML = html;
    lucide.createIcons();
}

function updateUI() {
    if(isOwner) {
        document.getElementById('welcome-name').textContent = 'ادمین';
        document.getElementById('nav-level').textContent = 'Max';
        document.getElementById('nav-xp-bar').style.width = '100%';
        document.getElementById('nav-coins').textContent = '∞';
        document.getElementById('nav-streak').textContent = '∞';
        if(document.getElementById('nav-coins-m')) document.getElementById('nav-coins-m').textContent = '∞';
        if(document.getElementById('nav-streak-m')) document.getElementById('nav-streak-m').textContent = '∞';
        document.getElementById('stat-level').textContent = 'Max';
        document.getElementById('stat-coins').textContent = '∞';
        document.getElementById('stat-unlocked').textContent = '30/30';
        return;
    }
    const user = DB.getUser(currentUser);
    if(!user) return logout();
    
    const today = new Date().toDateString();
    if(user.lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if(user.lastActive === yesterday) {
            user.streak = (user.streak || 0) + 1;
        } else {
            user.streak = 1;
        }
        user.lastActive = today;
        DB.updateUser(currentUser, { streak: user.streak, lastActive: user.lastActive });
    }

    const lvl = getLevel(user.xp);
    user.level = lvl;
    document.getElementById('welcome-name').textContent = currentUser;
    document.getElementById('nav-level').textContent = lvl;
    document.getElementById('nav-coins').textContent = user.coins;
    document.getElementById('nav-streak').textContent = user.streak || 0;
    
    if(document.getElementById('nav-coins-m')) document.getElementById('nav-coins-m').textContent = user.coins;
    if(document.getElementById('nav-streak-m')) document.getElementById('nav-streak-m').textContent = user.streak || 0;
    
    document.getElementById('stat-level').textContent = lvl;
    document.getElementById('stat-coins').textContent = user.coins;
    const nextXp = XP_THRESHOLDS[lvl] || XP_THRESHOLDS[XP_THRESHOLDS.length-1];
    const prevXp = XP_THRESHOLDS[lvl-1] || 0;
    document.getElementById('nav-xp-bar').style.width = Math.min(100, ((user.xp - prevXp) / (nextXp - prevXp)) * 100) + '%';
    document.getElementById('stat-unlocked').textContent = METHODS.filter(m => m.lvl <= lvl).length + '/30';
    setTheme(user.theme || 'indigo');
    
    document.getElementById('sound-toggle').classList.toggle('active', soundEnabled);
}

function renderPath() {
    const user = isOwner ? { level: 10 } : DB.getUser(currentUser);
    let html = '';
    for(let i=1; i<=10; i++) {
        const unlocked = user.level >= i;
        html += `<div class="flex flex-col items-center gap-2 z-10"><div class="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold ${unlocked ? 'btn-brand' : 'bg-slate-200 text-slate-400'}">${unlocked ? i : '<i data-lucide="lock" class="w-3 h-3 md:w-4 md:h-4"></i>'}</div></div>`;
    }
    document.getElementById('progress-path').innerHTML = html;
    lucide.createIcons();
}

function renderLeaderboard() {
    const sortedUsers = [...DB.data.users].sort((a, b) => b.xp - a.xp).slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    document.getElementById('leaderboard-list').innerHTML = sortedUsers.map((u, i) => `
        <div class="flex items-center justify-between p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div class="flex items-center gap-2 md:gap-3">
                <span class="text-lg md:text-xl">${medals[i]}</span>
                <span class="text-sm md:text-base font-bold text-slate-800">${u.username}</span>
            </div>
            <div class="flex items-center gap-1 text-xs md:text-sm font-bold text-indigo-600">
                <i data-lucide="star" class="w-4 h-4"></i>
                ${u.xp} XP
            </div>
        </div>
    `).join('') || '<p class="text-xs text-slate-400 text-center py-4">هنوز نخبه‌ای ثبت نشده است</p>';
    lucide.createIcons();
}

function renderMethods() {
    const user = isOwner ? { level: 100 } : DB.getUser(currentUser);
    const subMult = getSubMult(user);
    const streakMult = getStreakMult(user);
    document.getElementById('methods-grid').innerHTML = METHODS.map(m => {
        const locked = m.lvl > user.level;
        const finalXp = Math.floor(m.xp * subMult * streakMult);
        const finalCoins = Math.floor(m.coins * subMult * streakMult);
        return `
        <div class="card p-4 md:p-6 flex flex-col justify-between ${locked ? 'opacity-50 pointer-events-none' : ''}">
            <div>
                <div class="flex justify-between items-start mb-3 md:mb-4">
                    <div class="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-indigo-50 flex items-center justify-center"><i data-lucide="${m.icon}" class="w-5 h-5 md:w-6 md:h-6 text-indigo-600"></i></div>
                    <span class="level-badge">Lv.${m.lvl}</span>
                </div>
                <h3 class="text-base md:text-lg font-bold mb-1 md:mb-2 text-slate-800">${m.name}</h3>
                <p class="text-xs md:text-sm text-slate-500 mb-4 md:mb-6 min-h-[40px]">${m.desc}</p>
            </div>
            <div class="flex items-center justify-between">
                <div class="flex gap-2 text-xs font-bold">
                    <span class="text-indigo-600">+${finalXp} XP</span>
                    <span class="text-amber-500">+${finalCoins} سکه</span>
                </div>
                <button onclick="openWorkspace(${m.id})" class="btn-brand px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1"><i data-lucide="play" class="w-4 h-4"></i> استفاده</button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function renderCommunity() {
    const user = DB.getUser(currentUser);
    const select = document.getElementById('game-select');
    if(user.favoriteGame) {
        select.value = user.favoriteGame;
        document.getElementById('game-status').textContent = "از قبل ثبت شده‌ای!";
    }
    renderPoll();
}

function saveGame() {
    const val = document.getElementById('game-select').value;
    if(!val) return;
    const user = DB.getUser(currentUser);
    if(!user.favoriteGame) {
        user.coins += 10;
        DB.updateUser(currentUser, { favoriteGame: val, coins: user.coins });
        updateUI();
        showToast('+۱۰ سکه دریافت کردی!');
        playSound('success');
    } else {
        DB.updateUser(currentUser, { favoriteGame: val });
        showToast('بازی محبوب آپدیت شد.');
    }
    document.getElementById('game-status').textContent = "ثبت شد!";
}

function renderPoll() {
    const user = DB.getUser(currentUser);
    const poll = DB.data.poll;
    const hasVoted = user.pollVotes && user.pollVotes.includes(poll.q);
    
    let html = `<p class="font-bold text-slate-800 mb-4 text-sm md:text-base">${poll.q}</p>`;
    
    if(!hasVoted) {
        html += `<div class="space-y-2 md:space-y-3">`;
        poll.opts.forEach((opt, i) => {
            html += `<button onclick="vote(${i})" class="w-full text-right p-2 md:p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 text-sm md:text-base">${opt}</button>`;
        });
        html += `</div>`;
    } else {
        const totalVotes = poll.votes.reduce((a, b) => a + b, 0) || 1;
        html += `<div class="space-y-3 md:space-y-4">`;
        poll.opts.forEach((opt, i) => {
            const percentage = Math.round((poll.votes[i] / totalVotes) * 100);
            html += `
            <div>
                <div class="flex justify-between text-xs md:text-sm font-medium text-slate-700 mb-1">
                    <span>${opt}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5">
                    <div class="poll-bar bg-indigo-600 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>`;
        });
        html += `</div><p class="text-xs text-slate-400 mt-4 text-center">مجموع آرا: ${totalVotes}</p>`;
    }
    document.getElementById('poll-content').innerHTML = html;
}

function vote(index) {
    const user = DB.getUser(currentUser);
    const poll = DB.data.poll;
    if(!user.pollVotes.includes(poll.q)) {
        poll.votes[index]++;
        user.pollVotes.push(poll.q);
        DB.updateUser(currentUser, { pollVotes: user.pollVotes });
        DB.data.poll = poll;
        DB.save();
        showToast('رای شما ثبت شد!');
        playSound('click');
    }
    renderPoll();
}

// Neogram Logic
function renderNeogram() {
    const posts = DB.data.posts || [];
    const user = DB.getUser(currentUser);
    
    if(posts.length === 0) {
        document.getElementById('neogram-feed').innerHTML = '<p class="text-slate-400 text-center py-8">هنوز پستی وجود ندارد. اولین نفر باش!</p>';
        return;
    }

    document.getElementById('neogram-feed').innerHTML = posts.slice().reverse().map(p => {
        const liked = p.likes.includes(currentUser);
        const isFollowing = user.following && user.following.includes(p.author);
        const isOwnPost = p.author === currentUser;

        let commentsHtml = p.comments.map(c => `
            <div class="bg-slate-50 p-2 md:p-3 rounded-lg text-xs md:text-sm">
                <b class="text-indigo-600">${c.author}</b>: <span class="text-slate-700">${c.text}</span>
            </div>
        `).join('');

        return `
        <div class="card p-4 md:p-6 anim-pop">
            <div class="flex items-center justify-between mb-3 md:mb-4">
                <div class="flex items-center gap-2 md:gap-3">
                    <div class="w-8 h-8 md:w-10 md:h-10 rounded-full btn-brand flex items-center justify-center text-sm md:text-base font-bold">${p.author.charAt(0).toUpperCase()}</div>
                    <div>
                        <h3 class="font-bold text-sm md:text-base text-slate-800">${p.author}</h3>
                        <span class="text-[10px] md:text-xs text-slate-400">${p.timestamp}</span>
                    </div>
                </div>
                ${!isOwnPost ? `<button onclick="toggleFollow('${p.author}')" class="text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-lg ${isFollowing ? 'bg-slate-100 text-slate-500' : 'btn-brand'}">${isFollowing ? 'دنبال شده' : 'دنبال کردن'}</button>` : ''}
            </div>
            <p class="text-slate-700 mb-3 md:mb-4 whitespace-pre-wrap text-sm md:text-base">${p.text}</p>
            <div class="flex items-center gap-4 md:gap-6 border-t border-slate-100 pt-3 md:pt-4">
                <button onclick="likeNeogram(${p.id})" class="flex items-center gap-2 text-xs md:text-sm font-medium ${liked ? 'text-rose-500' : 'text-slate-500'} hover:text-rose-500 transition">
                    <i data-lucide="heart" class="w-4 h-4 md:w-5 md:h-5" fill="${liked ? 'currentColor' : 'none'}"></i> ${p.likes.length}
                </button>
                <button onclick="document.getElementById('comments-${p.id}').classList.toggle('hidden')" class="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
                    <i data-lucide="message-circle" class="w-4 h-4 md:w-5 md:h-5"></i> ${p.comments.length} کامنت
                </button>
            </div>
            <div id="comments-${p.id}" class="hidden mt-3 md:mt-4 space-y-2 md:space-y-3">
                ${commentsHtml}
                <div class="flex gap-2 mt-2 md:mt-3">
                    <input id="comment-input-${p.id}" type="text" class="flex-1 min-h-[40px] text-sm" placeholder="کامنت بنویس...">
                    <button onclick="addNeogramComment(${p.id})" class="btn-brand px-3 py-2 rounded-lg text-xs md:text-sm">ارسال</button>
                </div>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function postNeogram() {
    const text = document.getElementById('neogram-input').value.trim();
    if(!text) return showToast('پست نمی‌تواند خالی باشد');
    
    const newPost = {
        id: Date.now(),
        author: currentUser,
        text: text,
        likes: [],
        comments: [],
        timestamp: new Date().toLocaleString('fa-IR')
    };
    DB.data.posts.push(newPost);
    DB.save();
    
    const user = DB.getUser(currentUser);
    user.xp += 5;
    DB.updateUser(currentUser, { xp: user.xp, level: getLevel(user.xp) });
    
    document.getElementById('neogram-input').value = '';
    renderNeogram();
    updateUI();
    checkAchievements();
    showToast('پست شما در نیوگرام منتشر شد! +۵ XP');
    playSound('success');
}

function likeNeogram(postId) {
    const post = DB.data.posts.find(p => p.id === postId);
    if(!post) return;
    
    const index = post.likes.indexOf(currentUser);
    if(index > -1) {
        post.likes.splice(index, 1);
    } else {
        post.likes.push(currentUser);
        playSound('click');
    }
    DB.save();
    renderNeogram();
}

function addNeogramComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if(!text) return;
    
    const post = DB.data.posts.find(p => p.id === postId);
    if(post) {
        post.comments.push({ id: Date.now(), author: currentUser, text: text });
        DB.save();
        renderNeogram();
        document.getElementById(`comments-${postId}`).classList.remove('hidden');
        playSound('click');
    }
}

function toggleFollow(username) {
    const user = DB.getUser(currentUser);
    if(!user) return;
    
    if(!user.following) user.following = [];
    const index = user.following.indexOf(username);
    if(index > -1) {
        user.following.splice(index, 1);
        showToast(`${username} دیگر دنبال نمی‌شود`);
    } else {
        user.following.push(username);
        showToast(`${username} دنبال شد`);
    }
    DB.updateUser(currentUser, { following: user.following });
    renderNeogram();
}

// Workspace Logic
function openWorkspace(id) {
    if(isOwner) return;
    const user = DB.getUser(currentUser);
    const method = METHODS.find(m => m.id === id);
    if(method.lvl > user.level) return;
    
    currentMethodId = id;
    document.getElementById('ws-title').textContent = method.name;
    document.getElementById('ws-desc').textContent = method.desc;
    document.getElementById('ws-icon').innerHTML = `<i data-lucide="${method.icon}" class="w-5 h-5 md:w-6 md:h-6 text-white"></i>`;
    
    const content = document.getElementById('ws-content');
    const completeBtn = document.getElementById('ws-complete-btn');
    completeBtn.disabled = true;
    
    const userNotes = user.notes && user.notes[id] ? user.notes[id] : '';
    
    if(method.tool === 'note') {
        content.innerHTML = `<p class="text-xs md:text-sm text-slate-500 mb-3">یادداشت‌های خود را ثبت کنید (حداقل ۱۰ کاراکتر):</p>
        <textarea id="ws-textarea" class="w-full h-40 md:h-48 bg-slate-50 p-3 md:p-4 text-sm" placeholder="یادداشت‌های شما..." oninput="checkNoteValidity()">${userNotes}</textarea>`;
        checkNoteValidity();
    } else if(method.tool === 'check') {
        content.innerHTML = `<p class="text-xs md:text-sm text-slate-500 mb-4">آیا این مرحله را با موفقیت انجام دادید؟</p>
        <label class="flex items-center gap-3 cursor-pointer bg-slate-50 p-3 md:p-4 rounded-lg border border-slate-200">
            <input type="checkbox" id="ws-check-confirm" class="w-5 h-5" onchange="document.getElementById('ws-complete-btn').disabled = !this.checked">
            <span class="text-xs md:text-sm font-medium text-slate-700">بله، تمرین را کامل کردم.</span>
        </label>`;
    } else if(method.tool === 'pomodoro') {
        const mins = method.time || 25;
        const displayMins = mins < 10 ? '0' + mins : mins;
        content.innerHTML = `<div class="text-center">
            <p class="text-xs md:text-sm text-slate-500 mb-4">تایمر را شروع کن و تا پایان آن زمان تمرکز کن!</p>
            <div id="pomodoro-display" class="text-4xl md:text-5xl font-bold text-indigo-600 my-6 md:my-8 tracking-wider">${displayMins}:00</div>
            <button onclick="startPomodoro(${mins})" id="pomo-btn" class="btn-brand px-6 py-2 md:px-8 md:py-3 rounded-lg font-bold text-sm">شروع تایمر</button>
        </div>`;
    } else if(method.tool === 'flashcard') {
        content.innerHTML = `<div class="space-y-2 md:space-y-3">
            <input id="fc-q" type="text" placeholder="سوال..." class="text-sm">
            <input id="fc-a" type="text" placeholder="جواب..." class="text-sm">
            <button onclick="addFlashcard()" class="btn-outline px-4 py-2 rounded-lg text-sm">افزودن کارت</button>
            <div id="fc-list" class="mt-4 space-y-2"></div>
        </div>`;
    } else if(method.tool === 'tap') {
        tapCount = 0;
        content.innerHTML = `<p class="text-xs md:text-sm text-slate-500 mb-4 text-center">برای فعال‌سازی حافظه کوتاه‌مدت، روی دایره زیر ۱۰ بار کلیک کن!</p>
        <div class="flex flex-col items-center gap-4 mt-6">
            <div id="tap-circle" onclick="handleTap()" class="w-20 h-20 md:w-24 md:h-24 rounded-full btn-brand flex items-center justify-center text-2xl md:text-3xl font-bold cursor-pointer transition-transform active:scale-90">0</div>
        </div>`;
    } else if(method.tool === 'challenge') {
        content.innerHTML = `<div class="text-center">
            <p class="text-xs md:text-sm text-slate-500 mb-4">آماده‌ای؟ روی دکمه بزن تا ۶۰ ثانیه تمرکزت رو شروع کنی!</p>
            <div id="challenge-display" class="text-4xl md:text-5xl font-bold text-indigo-600 my-6 tracking-wider">01:00</div>
            <button onclick="startChallenge()" id="ch-btn" class="btn-brand px-6 py-2 md:px-8 md:py-3 rounded-lg font-bold text-sm">شروع چالش</button>
        </div>`;
    } 
    else if(method.tool === 'math') {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        window.mathAnswer = a + b;
        content.innerHTML = `<p class="text-xs md:text-sm text-slate-500 mb-4 text-center">حافظه کاری خود را تست کن! حاصل جمع زیر چنده؟</p>
        <div class="bg-indigo-50 p-3 md:p-4 rounded-lg text-center font-bold text-2xl md:text-3xl text-indigo-700 mb-4">${a} + ${b} = ?</div>
        <input id="math-input" type="number" class="w-full text-center text-xl md:text-2xl font-bold" placeholder="جواب..." oninput="checkMath()">
        <div id="math-result" class="text-center font-bold mt-2 text-sm"></div>`;
    } else if(method.tool === 'speed') {
        const targetText = "یادگیری کلید موفقیت در زندگی است";
        content.innerHTML = `<p class="text-xs md:text-sm text-slate-500 mb-4 text-center">جمله زیر را در کمتر از ۱۰ ثانیه دقیق تایپ کن:</p>
        <div class="bg-indigo-50 p-3 md:p-4 rounded-lg text-center font-bold text-base md:text-lg text-indigo-700 mb-4">${targetText}</div>
        <textarea id="speed-input" class="w-full h-20 md:h-24 bg-slate-50 p-3 md:p-4 text-sm" placeholder="اینجا تایپ کن..." oninput="checkSpeed('${targetText}')"></textarea>
        <div id="speed-timer" class="text-center text-amber-500 font-bold mt-2 text-sm">۱۰ ثانیه</div>`;
        startSpeedTimer();
    }
    
    document.getElementById('workspace-modal').style.display = 'flex';
    lucide.createIcons();
}

function checkMath() {
    const val = parseInt(document.getElementById('math-input').value);
    const res = document.getElementById('math-result');
    if(val === window.mathAnswer) {
        res.textContent = 'آفرین! درست بود.';
        res.style.color = '#10b981';
        document.getElementById('ws-complete-btn').disabled = false;
        playSound('click');
    } else {
        res.textContent = 'دقت کن!';
        res.style.color = '#ef4444';
        document.getElementById('ws-complete-btn').disabled = true;
    }
}

function startSpeedTimer() {
    let time = 10;
    if(speedInterval) clearInterval(speedInterval);
    speedInterval = setInterval(() => {
        time--;
        document.getElementById('speed-timer').textContent = `${time} ثانیه`;
        if(time <= 0) {
            clearInterval(speedInterval);
            document.getElementById('speed-input').disabled = true;
            document.getElementById('speed-timer').textContent = "زمان تمام شد!";
            document.getElementById('speed-timer').style.color = "#ef4444";
            document.getElementById('ws-complete-btn').disabled = true;
        }
    }, 1000);
}

function checkSpeed(target) {
    const val = document.getElementById('speed-input').value.trim();
    if(val === target) {
        clearInterval(speedInterval);
        document.getElementById('speed-timer').textContent = "عالی بود!";
        document.getElementById('speed-timer').style.color = "#10b981";
        document.getElementById('ws-complete-btn').disabled = false;
        playSound('success');
    }
}

function handleTap() {
    tapCount++;
    const circle = document.getElementById('tap-circle');
    if(circle) {
        circle.textContent = tapCount;
        if(tapCount >= 10) {
            circle.style.background = '#10b981';
            circle.textContent = '✓';
            document.getElementById('ws-complete-btn').disabled = false;
            showToast('آفرین! حافظه‌ات فعال شد.');
            playSound('success');
        } else {
            playSound('click');
        }
    }
}

function startChallenge() {
    let time = 60;
    const btn = document.getElementById('ch-btn');
    btn.disabled = true;
    if(challengeInterval) clearInterval(challengeInterval);
    challengeInterval = setInterval(() => {
        time--;
        let m = Math.floor(time / 60);
        let s = time % 60;
        document.getElementById('challenge-display').textContent = `00:${s < 10 ? '0' + s : s}`;
        if(time <= 0) {
            clearInterval(challengeInterval);
            document.getElementById('challenge-display').textContent = "آفرین!";
            document.getElementById('ws-complete-btn').disabled = false;
            btn.textContent = "تکمیل شد";
            btn.disabled = false;
            playSound('success');
        }
    }, 1000);
}

function checkNoteValidity() {
    const text = document.getElementById('ws-textarea').value;
    document.getElementById('ws-complete-btn').disabled = text.trim().length < 10;
}

function closeWorkspace() {
    if(currentMethodId) {
        const method = METHODS.find(m => m.id === currentMethodId);
        if(method.tool === 'note') {
            const text = document.getElementById('ws-textarea').value;
            const user = DB.getUser(currentUser);
            if(!user.notes) user.notes = {};
            user.notes[currentMethodId] = text;
            DB.updateUser(currentUser, { notes: user.notes });
        }
    }
    if(pomodoroInterval) clearInterval(pomodoroInterval);
    if(challengeInterval) clearInterval(challengeInterval);
    if(speedInterval) clearInterval(speedInterval);
    document.getElementById('workspace-modal').style.display = 'none';
    currentMethodId = null;
}

function completeWorkspace() {
    const method = METHODS.find(m => m.id === currentMethodId);
    if(!method) return;
    
    const user = DB.getUser(currentUser);
    
    const subMult = getSubMult(user);
    const streakMult = getStreakMult(user);
    
    const xpReward = Math.floor(method.xp * subMult * streakMult);
    const coinReward = Math.floor(method.coins * subMult * streakMult);
    
    user.xp += xpReward;
    user.coins += coinReward;
    const oldLvl = user.level;
    const newLvl = getLevel(user.xp);
    
    DB.updateUser(currentUser, { xp: user.xp, coins: user.coins, level: newLvl });
    
    if(method.tool === 'note') {
        const text = document.getElementById('ws-textarea').value;
        if(!user.notes) user.notes = {};
        user.notes[currentMethodId] = text;
        DB.updateUser(currentUser, { notes: user.notes });
    }
    
    updateUI();
    renderPath();
    renderLeaderboard();
    checkAchievements();
    closeWorkspace();
    
    if(newLvl > oldLvl) {
        showToast(`🎉 سطح بالا رفت! سطح ${newLvl}`);
        playSound('level');
    } else {
        showToast(`+${xpReward} XP و +${coinReward} سکه کسب کردید!`);
        playSound('success');
    }
}

function startPomodoro(minutes = 25) {
    let time = minutes * 60;
    const btn = document.getElementById('pomo-btn');
    btn.disabled = true;
    if(pomodoroInterval) clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(() => {
        time--;
        let m = Math.floor(time / 60);
        let s = time % 60;
        document.getElementById('pomodoro-display').textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        if(time <= 0) {
            clearInterval(pomodoroInterval);
            document.getElementById('pomodoro-display').textContent = "پایان!";
            document.getElementById('ws-complete-btn').disabled = false;
            btn.textContent = "تکمیل شد";
            btn.disabled = false;
            playSound('success');
        }
    }, 1000);
}

let flashcards = [];
function addFlashcard() {
    const q = document.getElementById('fc-q').value.trim();
    const a = document.getElementById('fc-a').value.trim();
    if(!q || !a) return;
    flashcards.push({q, a});
    document.getElementById('fc-list').innerHTML += `<div class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm"><b>سوال:</b> ${q}<br><b>جواب:</b> ${a}</div>`;
    document.getElementById('fc-q').value = '';
    document.getElementById('fc-a').value = '';
    document.getElementById('ws-complete-btn').disabled = false;
    playSound('click');
}

async function addTask() {
    const user = DB.getUser(currentUser);
    const text = document.getElementById('task-input').value.trim();
    const type = document.getElementById('task-type').value;
    if(!text) return;
    user.tasks.push({ id: Date.now(), text, type, done: false });
    DB.updateUser(currentUser, { tasks: user.tasks });
    document.getElementById('task-input').value = '';
    renderTasks();
    playSound('click');
}

async function toggleTask(id) {
    const user = DB.getUser(currentUser);
    const task = user.tasks.find(t => t.id === id);
    if(task.done) return; 
    
    task.done = !task.done;
    
    if(task.done) { 
        const subMult = getSubMult(user);
        const streakMult = getStreakMult(user);
        user.xp += Math.floor(15 * subMult * streakMult); 
        user.coins += Math.floor(5 * subMult * streakMult); 
        DB.updateUser(currentUser, { tasks: user.tasks, xp: user.xp, coins: user.coins, level: getLevel(user.xp) }); 
        updateUI(); renderPath(); renderLeaderboard(); checkAchievements(); showToast('تسک انجام شد! پاداش گرفتید'); 
        playSound('success');
    } else { 
        DB.updateUser(currentUser, { tasks: user.tasks }); 
    }
    renderTasks();
}

function deleteTask(id) { const user = DB.getUser(currentUser); user.tasks = user.tasks.filter(t => t.id !== id); DB.updateUser(currentUser, { tasks: user.tasks }); renderTasks(); playSound('click'); }

function renderTasks() {
    const user = DB.getUser(currentUser);
    const daily = user.tasks.filter(t => t.type === 'daily');
    const weekly = user.tasks.filter(t => t.type === 'weekly');
    const renderList = (tasks) => tasks.length === 0 ? '<p class="text-slate-400 text-xs md:text-sm text-center py-4">تسکی ثبت نشده است</p>' : tasks.map(t => `
        <div class="task-item ${t.done ? 'done' : ''} bg-slate-50 p-2 md:p-3 rounded-lg flex items-center justify-between border border-slate-200">
            <div class="flex items-center gap-2 md:gap-3 flex-1 cursor-pointer" onclick="toggleTask(${t.id})">
                <div class="task-checkbox ${t.done ? 'done' : ''}">${t.done ? '<i data-lucide="check" class="w-4 h-4 text-white"></i>' : ''}</div>
                <span class="text-xs md:text-sm text-slate-700">${t.text}</span>
            </div>
            <button onclick="deleteTask(${t.id})" class="text-slate-300 hover:text-red-500 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>`).join('');
    document.getElementById('daily-tasks').innerHTML = renderList(daily);
    document.getElementById('weekly-tasks').innerHTML = renderList(weekly);
    lucide.createIcons();
}

function buySub(type) {
    const user = DB.getUser(currentUser);
    const prices = { eco: 100, plus: 250 };
    if(user.subscription === type) return showToast('این اشتراک را دارید');
    if(type === 'eco' && user.subscription === 'plus') return showToast('اشتراک فعلی بهتر است');
    if(user.coins < prices[type]) return showToast('سکه کافی ندارید');
    
    DB.updateUser(currentUser, { coins: user.coins - prices[type], subscription: type });
    updateUI();
    checkAchievements();
    showToast('اشتراک با موفقیت فعال شد!');
    playSound('level');
}

function sendSupport() {
    const text = document.getElementById('support-msg').value.trim();
    if(!text) return;
    DB.data.messages.push({ id: Date.now(), from: currentUser, text: text });
    DB.save();
    document.getElementById('support-msg').value = '';
    showToast('پیام شما ارسال شد');
    playSound('click');
}

function setTheme(theme) {
    const colors = { indigo: '#4f46e5', emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b' };
    document.documentElement.style.setProperty('--brand-color', colors[theme]);
    
    const style = document.querySelector('style#dynamic-style');
    style.innerHTML = `
        :root { --brand-color: ${colors[theme]}; }
        * { font-family: 'Vazirmatn', sans-serif; box-sizing: border-box; }
        body { background-color: #f8fafc; color: #1e293b; margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .btn-brand { background: ${colors[theme]}; color: #fff; transition: 0.2s; border: none; cursor: pointer; }
        .btn-brand:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-brand:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }
        .btn-outline { background: transparent; border: 1px solid #cbd5e1; color: ${colors[theme]}; transition: 0.2s; cursor: pointer; }
        .btn-outline:hover { background: #f1f5f9; }
        input, select, textarea { background: #fff; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.75rem; color: #1e293b; width: 100%; transition: 0.2s; font-size: 1rem; min-height: 48px; }
        input:focus, select:focus, textarea:focus { border-color: ${colors[theme]}; outline: none; box-shadow: 0 0 0 3px ${colors[theme]}20; }
        input::placeholder { color: #94a3b8; }
        .level-badge { background: ${colors[theme]}20; color: ${colors[theme]}; padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 700; }
        .xp-bar { height: 8px; background: #e2e8f0; border-radius: 0.25rem; overflow: hidden; }
        .xp-fill { height: 100%; background: ${colors[theme]}; transition: width 1s ease-in-out; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .anim-pop { animation: fadeInUp 0.4s ease-out forwards; }
        .task-checkbox { width: 24px; height: 24px; border-radius: 0.375rem; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; background: #fff; }
        .task-checkbox.done { background: ${colors[theme]}; border-color: ${colors[theme]}; }
        .task-item.done span { text-decoration: line-through; color: #94a3b8; }
        .modal-overlay { display: none; position: fixed; inset: 0; z-index: 60; align-items: center; justify-content: center; padding: 1rem; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); }
        .poll-bar { transition: width 0.5s ease-in-out; }
        .badge-locked { opacity: 0.2; filter: grayscale(100%); }
        .toggle-switch { width: 40px; height: 22px; background: #cbd5e1; border-radius: 11px; position: relative; cursor: pointer; transition: background 0.3s; }
        .toggle-switch.active { background: ${colors[theme]}; }
        .toggle-dot { width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 2px; right: 2px; transition: right 0.3s; }
        .toggle-switch.active .toggle-dot { right: 20px; }
    `;

    if(currentUser) DB.updateUser(currentUser, { theme: theme });
}

function renderPanel() {
    document.getElementById('owner-panel').classList.toggle('hidden', !isOwner);
    document.getElementById('sound-toggle').classList.toggle('active', soundEnabled);
    if(isOwner) {
        document.getElementById('admin-user-list').innerHTML = DB.data.users.map(u => `
            <div class="flex justify-between items-center bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-200">
                <div><span class="text-xs md:text-sm font-medium text-slate-800">${u.username}</span> <span class="text-[10px] md:text-xs text-indigo-600 mr-2">سطح ${u.level}</span></div>
                <button onclick="deleteUser('${u.username}')" class="text-red-500 text-[10px] md:text-xs hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded">حذف</button>
            </div>`).join('') || '<p class="text-xs text-slate-400 text-center py-4">کاربری ثبت‌نام نکرده است</p>';
            
        document.getElementById('admin-msg-list').innerHTML = DB.data.messages.map(m => `
            <div class="bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-200">
                <b class="text-xs md:text-sm text-slate-800">${m.from}:</b>
                <p class="text-xs md:text-sm text-slate-600 mt-1">${m.text}</p>
            </div>
        `).join('') || '<p class="text-xs text-slate-400 text-center py-4">پیامی وجود ندارد</p>';
    }
}
function deleteUser(u) { if(!confirm(`حذف ${u}؟`)) return; DB.removeUser(u); renderPanel(); showToast('کاربر حذف شد'); }

window.onload = async function() { await DB.init(); showAuthModal(); lucide.createIcons(); };

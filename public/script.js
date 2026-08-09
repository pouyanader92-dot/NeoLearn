const DB = {
    data: null,
    async init() {
        try {
            const res = await fetch('/api/db');
            this.data = await res.json();
            if(!this.data.users) this.data.users = [];
            // Migration for existing users
            this.data.users.forEach(u => {
                if(!u.tasks) u.tasks = [];
            });
        } catch (e) { console.error(e); this.data = { users: [], ownerPassword: "owner123" }; }
    },
    async save() {
        await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.data) });
    },
    getUser(u) { return this.data.users.find(x => x.username === u); },
    updateUser(u, d) {
        let i = this.data.users.findIndex(x => x.username === u);
        if(i !== -1) { Object.assign(this.data.users[i], d); this.save(); }
    },
    addUser(u) { this.data.users.push(u); this.save(); },
    removeUser(u) { this.data.users = this.data.users.filter(x => x.username !== u); this.save(); }
};

const METHODS = [
    { id: 1, name: "خواندن فعال", xp: 10, lvl: 1, icon: "book-open", desc: "خواندن با تمرکز کامل و درگیر شدن با متن." },
    { id: 2, name: "یادداشت‌برداری خطی", xp: 10, lvl: 1, icon: "pen-line", desc: "نوشتن نکات کلیدی به صورت خط به خط." },
    { id: 3, name: "خلاصه‌نویسی", xp: 15, lvl: 2, icon: "file-text", desc: "خلاصه کردن مفاهیم longo در چند جمله." },
    { id: 4, name: "فلش‌کارت", xp: 20, lvl: 2, icon: "layers", desc: "ساخت کارت‌های سوال و جواب برای مرور سریع." },
    { id: 5, name: "نقشه ذهنی", xp: 25, lvl: 3, icon: "network", desc: "رسم نمودار درختی برای ارتباط مفاهیم." },
    { id: 6, name: "تکنیک پومودورو", xp: 15, lvl: 3, icon: "timer", desc: "مطالعه ۲۵ دقیقه‌ای با استراحت‌های کوتاه." },
    { id: 7, name: "یادگیری فعال", xp: 30, lvl: 4, icon: "zap", desc: "یادآوری اطلاعات از حافظه بدون نگاه به متن." },
    { id: 8, name: "تکنیک فاینمن", xp: 40, lvl: 4, icon: "user-check", desc: "آموزش مفهوم به صورت ساده به دیگری." },
    { id: 9, name: "تکرار فاصله‌دار", xp: 35, lvl: 5, icon: "repeat", desc: "مرور اطلاعات در فاصله‌های زمانی افزایشی." },
    { id: 10, name: "روش SQ3R", xp: 35, lvl: 5, icon: "list-checks", desc: "پیمایش، سوال، خواندن، حفظ کردن و مرور." },
    { id: 11, name: "درهم‌آمیزی", xp: 40, lvl: 6, icon: "shuffle", desc: "ترکیب موضوعات مختلف در یک جلسه مطالعه." },
    { id: 12, name: "دسته‌بندی", xp: 40, lvl: 6, icon: "box", desc: "تقسیم اطلاعات بزرگ به قطعات کوچک‌تر." },
    { id: 13, name: "تست‌سازی شخصی", xp: 45, lvl: 7, icon: "file-question", desc: "طراحی سوال آزمایی برای خودتان." },
    { id: 14, name: "تصویرسازی ذهنی", xp: 45, lvl: 7, icon: "image", desc: "تبدیل مفاهیم به تصاویر در ذهن." },
    { id: 15, name: "ارتباط معنایی", xp: 50, lvl: 8, icon: "link", desc: "ربط دادن اطلاعات جدید به دانش قبلی." },
    { id: 16, name: "مثال‌سازی", xp: 50, lvl: 8, icon: "lightbulb", desc: "طراحی مثال‌های عینی برای مفاهیم انتزاعی." },
    { id: 17, name: "روش کورنل", xp: 55, lvl: 9, icon: "layout-grid", desc: "تقسیم برگه به بخش‌های سوال، یادداشت و خلاصه." },
    { id: 18, name: "طوفان فکری", xp: 55, lvl: 9, icon: "cloud-lightning", desc: "نوشتن تمام ایده‌های مرتبط بدون فیلتر." },
    { id: 19, name: "آموزش همکار", xp: 60, lvl: 10, icon: "users", desc: "یاد دادن مطلب به یک دوست هم‌کلاسی." },
    { id: 20, name: "خواب استراتژیک", xp: 30, lvl: 10, icon: "moon", desc: "خواب کافی برای تثبیت حافظه." }
];

const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
let currentUser = null;
let isOwner = false;
let authMode = 'login';

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function showAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('auth-modal').classList.add('flex');
}
function hideAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}
function toggleAuthMode(mode) {
    authMode = mode;
    document.getElementById('auth-title').textContent = mode === 'login' ? 'ورود به نئولرن' : 'ثبت‌نام در نئولرن';
    document.getElementById('auth-btn').textContent = mode === 'login' ? 'ورود' : 'ثبت‌نام';
    document.getElementById('auth-switch').innerHTML = mode === 'login' ? 'حساب ندارید؟ <a class="text-cyan-400 cursor-pointer hover:text-cyan-300" onclick="toggleAuthMode(\'register\')">ثبت‌نام کنید</a>' : 'حساب دارید؟ <a class="text-cyan-400 cursor-pointer hover:text-cyan-300" onclick="toggleAuthMode(\'login\')">وارد شوید</a>';
}

async function doAuth() {
    const u = document.getElementById('auth-username').value.trim().toLowerCase();
    const p = document.getElementById('auth-password').value;
    if(!u || !p) return showToast('نام کاربری و رمز را وارد کنید');

    if(u === 'owner') {
        if(p === DB.data.ownerPassword) {
            isOwner = true;
            hideAuthModal();
            initApp();
            showToast('به کنسول ادمین خوش آمدید');
        } else { showToast('رمز ادمین اشتباه است'); }
        return;
    }

    if(authMode === 'login') {
        const user = DB.getUser(u);
        if(!user || user.password !== p) return showToast('نام کاربری یا رمز اشتباه است');
        currentUser = u;
    } else {
        if(DB.getUser(u)) return showToast('این کاربر وجود دارد');
        DB.addUser({ username: u, password: p, xp: 0, level: 1, theme: 'default', tasks: [] });
        currentUser = u;
    }
    hideAuthModal();
    initApp();
}

function logout() {
    currentUser = null;
    isOwner = false;
    document.getElementById('app').classList.add('hidden');
    showAuthModal();
}

function getLevel(xp) {
    for(let i = XP_THRESHOLDS.length-1; i >= 0; i--) { if(xp >= XP_THRESHOLDS[i]) return i+1; }
    return 1;
}

function initApp() {
    document.getElementById('app').classList.remove('hidden');
    updateUI();
    navigate('home');
    lucide.createIcons();
}

function navigate(section) {
    ['home', 'tasks', 'methods', 'panel'].forEach(s => document.getElementById('section-'+s).classList.add('hidden'));
    document.getElementById('section-'+section).classList.remove('hidden');
    document.getElementById('section-'+section).classList.add('anim-pop');
    if(section === 'methods') renderMethods();
    if(section === 'panel') renderPanel();
    if(section === 'home') renderPath();
    if(section === 'tasks') renderTasks();
}

function updateUI() {
    if(isOwner) {
        document.getElementById('welcome-name').textContent = 'ادمین';
        document.getElementById('nav-level').textContent = 'Max';
        document.getElementById('nav-xp-bar').style.width = '100%';
        document.getElementById('stat-level').textContent = 'Max';
        document.getElementById('stat-xp').textContent = '∞';
        document.getElementById('stat-unlocked').textContent = '20/20';
        return;
    }

    const user = DB.getUser(currentUser);
    if(!user) return logout();

    const lvl = getLevel(user.xp);
    user.level = lvl;
    
    document.getElementById('welcome-name').textContent = currentUser;
    document.getElementById('nav-level').textContent = lvl;
    document.getElementById('stat-level').textContent = lvl;
    document.getElementById('stat-xp').textContent = user.xp;
    
    const nextXp = XP_THRESHOLDS[lvl] || XP_THRESHOLDS[XP_THRESHOLDS.length-1];
    const prevXp = XP_THRESHOLDS[lvl-1] || 0;
    const pct = Math.min(100, ((user.xp - prevXp) / (nextXp - prevXp)) * 100);
    document.getElementById('nav-xp-bar').style.width = pct + '%';
    
    const unlocked = METHODS.filter(m => m.lvl <= lvl).length;
    document.getElementById('stat-unlocked').textContent = unlocked + '/20';

    setTheme(user.theme || 'default');
}

function renderPath() {
    const user = isOwner ? { level: 10 } : DB.getUser(currentUser);
    const path = document.getElementById('progress-path');
    let html = '';
    for(let i=1; i<=10; i++) {
        const unlocked = user.level >= i;
        html += `
            <div class="flex flex-col items-center gap-2 z-10">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold ${unlocked ? 'btn-brand' : 'bg-neutral-800 text-neutral-500'}">
                    ${unlocked ? i : '<i data-lucide="lock" class="w-4 h-4"></i>'}
                </div>
            </div>
        `;
    }
    path.innerHTML = html;
    lucide.createIcons();
}

function renderMethods() {
    const user = isOwner ? { level: 100 } : DB.getUser(currentUser);
    const grid = document.getElementById('methods-grid');
    grid.innerHTML = METHODS.map(m => {
        const locked = m.lvl > user.level;
        return `
        <div class="method-card glass p-6 flex flex-col justify-between ${locked ? 'locked' : ''}">
            <div>
                <div class="flex justify-between items-start mb-4">
                    <div class="w-14 h-14 rounded-xl ${locked ? 'bg-red-500/10' : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20'} flex items-center justify-center">
                        <i data-lucide="${locked ? 'lock' : m.icon}" class="w-7 h-7 ${locked ? 'lock-icon text-red-400' : 'text-cyan-400'}"></i>
                    </div>
                    <span class="level-badge">Lv.${m.lvl}</span>
                </div>
                <h3 class="text-xl font-bold mb-2">${m.name}</h3>
                <p class="text-sm text-neutral-400 mb-6 min-h-[40px]">${m.desc}</p>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-purple-400">+${m.xp} XP</span>
                <button onclick="useMethod(${m.id})" class="btn-brand px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                    <i data-lucide="play" class="w-4 h-4"></i> استفاده
                </button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

async function useMethod(id) {
    if(isOwner) return showToast('ادمین نیازی به XP ندارد');
    const user = DB.getUser(currentUser);
    const method = METHODS.find(m => m.id === id);
    if(method.lvl > user.level) return showToast('سطح شما کافی نیست');

    user.xp += method.xp;
    const oldLvl = user.level;
    const newLvl = getLevel(user.xp);
    
    DB.updateUser(currentUser, { xp: user.xp, level: newLvl });
    updateUI();
    renderPath();

    if(newLvl > oldLvl) {
        showToast(`🎉 سطح بالا رفت! اکنون سطح ${newLvl} هستید!`);
    } else {
        showToast(`+${method.xp} XP کسب کردید!`);
    }
}

// Task Manager Logic
async function addTask() {
    if(isOwner) return;
    const user = DB.getUser(currentUser);
    const text = document.getElementById('task-input').value.trim();
    const type = document.getElementById('task-type').value;
    if(!text) return showToast('متن تسک را بنویسید');

    user.tasks.push({ id: Date.now(), text, type, done: false });
    DB.updateUser(currentUser, { tasks: user.tasks });
    document.getElementById('task-input').value = '';
    renderTasks();
    showToast('تسک اضافه شد!');
}

async function toggleTask(id) {
    if(isOwner) return;
    const user = DB.getUser(currentUser);
    const task = user.tasks.find(t => t.id === id);
    if(!task) return;

    task.done = !task.done;
    
    if(task.done) {
        user.xp += 15; // XP reward for task
        const newLvl = getLevel(user.xp);
        DB.updateUser(currentUser, { tasks: user.tasks, xp: user.xp, level: newLvl });
        updateUI();
        renderPath();
        showToast('+15 XP برای انجام تسک!');
    } else {
        DB.updateUser(currentUser, { tasks: user.tasks });
    }
    renderTasks();
}

async function deleteTask(id) {
    const user = DB.getUser(currentUser);
    user.tasks = user.tasks.filter(t => t.id !== id);
    DB.updateUser(currentUser, { tasks: user.tasks });
    renderTasks();
}

function renderTasks() {
    if(isOwner) return;
    const user = DB.getUser(currentUser);
    const daily = user.tasks.filter(t => t.type === 'daily');
    const weekly = user.tasks.filter(t => t.type === 'weekly');
    
    const renderList = (tasks) => tasks.length === 0 ? '<p class="text-neutral-500 text-sm text-center py-4">تسکی ثبت نشده است</p>' : tasks.map(t => `
        <div class="task-item ${t.done ? 'done' : ''} glass-light p-3 rounded-xl flex items-center justify-between border border-white/5">
            <div class="flex items-center gap-3 flex-1 cursor-pointer" onclick="toggleTask(${t.id})">
                <div class="task-checkbox ${t.done ? 'done' : ''}">
                    ${t.done ? '<i data-lucide="check" class="w-4 h-4 text-black"></i>' : ''}
                </div>
                <span class="text-sm">${t.text}</span>
            </div>
            <button onclick="deleteTask(${t.id})" class="text-red-400/50 hover:text-red-400 transition-colors p-1">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');

    document.getElementById('daily-tasks').innerHTML = renderList(daily);
    document.getElementById('weekly-tasks').innerHTML = renderList(weekly);
    lucide.createIcons();
}

function setTheme(theme) {
    document.body.classList.remove('theme-default', 'theme-matrix', 'theme-amber', 'theme-cyber');
    document.body.classList.add('theme-' + theme);
    
    if(theme === 'matrix') {
        document.documentElement.style.setProperty('--neon-purple', '#0aff00');
        document.documentElement.style.setProperty('--neon-cyan', '#0aff00');
    } else if(theme === 'amber') {
        document.documentElement.style.setProperty('--neon-purple', '#f59e0b');
        document.documentElement.style.setProperty('--neon-cyan', '#fbbf24');
    } else if(theme === 'cyber') {
        document.documentElement.style.setProperty('--neon-purple', '#00ffff');
        document.documentElement.style.setProperty('--neon-cyan', '#00ffff');
    } else {
        document.documentElement.style.setProperty('--neon-purple', '#bc13fe');
        document.documentElement.style.setProperty('--neon-cyan', '#00ffff');
    }

    if(currentUser) DB.updateUser(currentUser, { theme: theme });
}

function renderPanel() {
    document.getElementById('owner-panel').classList.toggle('hidden', !isOwner);
    if(isOwner) {
        const list = document.getElementById('admin-user-list');
        list.innerHTML = DB.data.users.map(u => `
            <div class="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                    <span class="font-medium">${u.username}</span>
                    <span class="text-xs text-purple-400 mr-2">سطح ${u.level}</span>
                </div>
                <button onclick="deleteUser('${u.username}')" class="text-red-400 text-xs hover:text-red-300 transition-colors px-2 py-1 hover:bg-red-500/10 rounded">حذف</button>
            </div>
        `).join('') || '<p class="text-xs text-neutral-500 text-center py-4">کاربری ثبت‌نام نکرده است</p>';
    }
}

function deleteUser(u) {
    if(!confirm(`حذف ${u}؟`)) return;
    DB.removeUser(u);
    renderPanel();
    showToast('کاربر حذف شد');
}

window.onload = async function() {
    await DB.init();
    showAuthModal();
    lucide.createIcons();
};

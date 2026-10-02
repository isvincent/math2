const { createApp, ref, computed, onMounted, watch } = Vue;

// Web Audio API for simple synthesized sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration, vol=0.1) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const app = createApp({
    setup() {
        // ---- Settings & State ----
        const currentTab = ref('learn');
        const showSettings = ref(false);
        const kValue = ref(0);
        let animationFrameId = null;

        const settings = ref({
            fullscreen: false,
            sound: true,
            device: 'auto',
            layout: 'auto',
            language: 'zh',
            fontSize: 'standard',
            theme: 'system'
        });

        // Load settings from local storage if any
        const savedSettings = localStorage.getItem('lp_settings');
        if (savedSettings) {
            Object.assign(settings.value, JSON.parse(savedSettings));
        }

        watch(settings, (newVal) => {
            localStorage.setItem('lp_settings', JSON.stringify(newVal));
            applyTheme();
        }, { deep: true });

        // ---- i18n ----
        const i18n = {
            title: { zh: '線性規劃互動學習', en: 'Linear Programming Interactive Learning' },
            settings: { zh: '設定', en: 'Settings' },
            learn_title: { zh: '學習線性規劃', en: 'Learn Linear Programming' },
            learn_intro: { zh: '本章將介紹如何利用數學方法，在有限的資源與限制條件下，尋求最佳解（最大值或最小值）。這廣泛應用於商業利潤最大化或成本最小化等領域。', en: 'Learn how to use mathematical methods to find optimal solutions under given constraints.' },
            practice_title: { zh: '反覆演練', en: 'Practice' },
            practice_intro: { zh: '透過練習題，加深對頂點法與平行線法的熟練度。', en: 'Practice finding optimal solutions.' },
            quiz_title: { zh: '觀念測驗', en: 'Concept Quiz' },
            history_title: { zh: '學習歷程紀錄', en: 'Learning History' },
        };

        const tabs = [
            { id: 'learn', name: { zh: '學習區', en: 'Learn' }, icon: 'fas fa-book-open' },
            { id: 'textbook', name: { zh: '課本題庫', en: 'Textbook' }, icon: 'fas fa-book' },
            { id: 'practice', name: { zh: '練習區', en: 'Practice' }, icon: 'fas fa-pencil-alt' },
            { id: 'quiz', name: { zh: '測驗區', en: 'Quiz' }, icon: 'fas fa-clipboard-check' },
            { id: 'advanced', name: { zh: '進階與延伸', en: 'Advanced' }, icon: 'fas fa-rocket' },
            { id: 'history', name: { zh: '歷程紀錄', en: 'History' }, icon: 'fas fa-chart-bar' }
        ];

        // ---- Textbook Problems ----
        const textbookProblems = ref([
            { showAnswer: false, type: '例題 1', title: '平行直線系 (平移)', content: '設 $L_0$ 的方程式為 $x-y=0$，將直線 $L_0$ 分別向右平移 $1$ 單位、$2$ 單位、$3$ 單位，得直線 $L_1$、$L_2$、$L_3$，試求其方程式。', solution: '$L_1: x-y=1$<br>$L_2: x-y=2$<br>$L_3: x-y=3$' },
            { showAnswer: false, type: '隨堂練習', title: '平行直線系 (平移)', content: '承例題 1，將直線 $L_0$ 分別向左平移 $1$ 單位、$2$ 單位、$3$ 單位，得直線 $L_4, L_5, L_6$，試求其方程式。', solution: '$L_4: x-y=-1$<br>$L_5: x-y=-2$<br>$L_6: x-y=-3$' },
            { showAnswer: false, type: '例題 2', title: '平行直線系 (交點)', content: '已知坐標平面上有三直線 $L_1: 2x+y=2$, $L_2: 2x+y=4$, $L_3: 2x+y=6$。設直線 $L_1, L_2, L_3$ 與 $x$ 軸的交點分別為 $(a_1, 0), (a_2, 0), (a_3, 0)$，試比較 $a_1, a_2, a_3$ 的大小關係。', solution: '$a_1 = 1, a_2 = 2, a_3 = 3$，故 $a_1 < a_2 < a_3$。' },
            { showAnswer: false, type: '例題 3', title: '二元一次不等式圖形', content: '試畫出聯立不等式 $\\begin{cases} x-2y+2 \\le 0 \\\\ x+y+2 > 0 \\end{cases}$ 的圖形。', solution: '圖形為直線 $x-2y+2=0$ 左上方的半平面（含邊界實線），以及與直線 $x+y+2=0$ 右上方（不含邊界虛線）的重疊區域。' },
            { showAnswer: false, type: '例題 4', title: '求目標函數的極值', content: '在 $\\begin{cases} x+2y \\le 6 \\\\ 2x+y \\le 6 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ 的可行解區域中，試求目標函數 $x+3y$ 的最大值及最小值。', solution: '可行解區域頂點為 $(0,0), (3,0), (2,2), (0,3)$。代入 $x+3y$ 得 $0, 3, 8, 9$。最大值為 $9$，最小值為 $0$。' },
            { showAnswer: false, type: '隨堂練習', title: '求目標函數的極值', content: '在 $\\begin{cases} x+y \\ge 10 \\\\ x-y \\le 0 \\\\ y \\le 10 \\end{cases}$ 的可行解區域中，試求目標函數 $2x+y$ 的最大值及最小值。', solution: '頂點為 $(5,5), (0,10), (10,10)$。代入 $2x+y$ 得 $15, 10, 30$。最大值為 $30$，最小值為 $10$。' },
            { showAnswer: false, type: '例題 5', title: '線性規劃應用：精油提煉', content: '原料 $A$ 和 $B$ 分別可提煉精油 $25$ 公斤和 $12$ 公斤，產生廢棄物 $75$ 公斤和 $25$ 公斤。每公噸成本分別為 $15$ 萬元和 $12$ 萬元。若希望成本不超過 $240$ 萬元，廢棄物不超過 $750$ 公斤，最多可提煉多少精油？', solution: '設 $A, B$ 各 $x, y$ 公噸。最大化 $P=25x+12y$。限制條件：$15x+12y \\le 240$, $75x+25y \\le 750$, $x \\ge 0, y \\ge 0$。最佳解在交點 $(\\frac{40}{7}, \\frac{90}{7})$，最多可提煉 $\\frac{2080}{7} \\approx 297.14$ 公斤。' },
            { showAnswer: false, type: '例題 6', title: '線性規劃應用：合金成本最小化', content: '甲工廠合金含 $A$ $2g$、$B$ $6g$，成本 $60000$ 元；乙工廠含 $A$ $4g$、$B$ $3g$，成本 $40000$ 元。訂單需 $A$ 金屬 $16g$、$B$ 金屬 $30g$。兩工廠各生產多少百公克能使成本最低？', solution: '設甲 $x$、乙 $y$ 百公克。最小化 $60000x+40000y$。限制：$2x+4y \\ge 16$, $6x+3y \\ge 30$, $x \\ge 0, y \\ge 0$。交點 $(4,2)$ 時有最小值 $320000$ 元。' },
            { showAnswer: false, type: '習題 5', title: '整數解問題', content: '已知 $x, y$ 為整數，試求滿足 $\\begin{cases} 3x+2y \\le 6 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ 的 $(x,y)$ 共有幾組？', solution: '$x=0 \\implies y=0,1,2,3$<br>$x=1 \\implies y=0,1$<br>$x=2 \\implies y=0$<br>共有 $4+2+1 = 7$ 組。' },
            { showAnswer: false, type: '習題 9', title: '多重最佳解', content: '目標函數為 $x+ky$，在可行解區域有最大值發生在 $(5,3)$ 與 $(7,7)$ 兩點。求 $k$ 值為何？', solution: '這代表目標函數平行於通過 $(5,3)$ 與 $(7,7)$ 的直線。該直線斜率 $m = \\frac{7-3}{7-5} = 2$。目標函數 $x+ky=c$ 的斜率為 $-\\frac{1}{k} = 2 \\implies k = -\\frac{1}{2}$。' }
        ]);

        const renderMath = (text) => {
            if (!window.katex) return text;
            // A simple regex to replace $...$ with katex rendered HTML.
            return text.replace(/\$\$(.*?)\$\$/g, (match, math) => {
                try { return katex.renderToString(math, { displayMode: true }); }
                catch(e) { return match; }
            }).replace(/\$(.*?)\$/g, (match, math) => {
                try { return katex.renderToString(math, { displayMode: false }); }
                catch(e) { return match; }
            });
        };

        // ---- History ----
        const history = ref([]);
        const savedHistory = localStorage.getItem('lp_history');
        if (savedHistory) history.value = JSON.parse(savedHistory);

        const addHistory = (type, detail, result, correct = true) => {
            const time = new Date().toLocaleString('zh-TW');
            history.value.push({ time, type, detail, result, correct });
            localStorage.setItem('lp_history', JSON.stringify(history.value));
        };

        const downloadHistory = () => {
            playSound('click');
            if (history.value.length === 0) {
                Swal.fire('提示', '目前尚無歷程可下載', 'info');
                return;
            }
            let csv = '時間,活動類型,詳細內容,結果/分數\n';
            history.value.forEach(r => {
                csv += `"${r.time}","${r.type}","${r.detail}","${r.result}"\n`;
            });
            const blob = new Blob(["\ufeff"+csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "學習歷程.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // ---- Audio ----
        const playSound = (type) => {
            if (!settings.value.sound) return;
            if (type === 'click') playTone(400, 'sine', 0.1);
            else if (type === 'success') {
                playTone(523.25, 'triangle', 0.1); // C5
                setTimeout(() => playTone(659.25, 'triangle', 0.1), 100); // E5
                setTimeout(() => playTone(783.99, 'triangle', 0.2), 200); // G5
            } else if (type === 'fail') {
                playTone(300, 'sawtooth', 0.2);
                setTimeout(() => playTone(250, 'sawtooth', 0.3), 200);
            } else if (type === 'tick') {
                playTone(800, 'sine', 0.05, 0.02);
            }
        };

        const changeTab = (id) => {
            currentTab.value = id;
            playSound('click');
            if(id === 'learn') {
                setTimeout(() => {
                    drawCanvas();
                    drawLineCanvas();
                }, 100);
            }
        };

        // ---- Parallel Lines Canvas Logic (lineCanvas) ----
        const lineKValue = ref(0);
        const drawLineCanvas = () => {
            const canvas = document.getElementById('lineCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            
            // Clear
            ctx.clearRect(0, 0, w, h);
            
            // Map logical (-5 to 5) to canvas (300x300)
            const mapX = (x) => w/2 + x * 25;
            const mapY = (y) => h/2 - y * 25;

            // Draw Grid
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            for(let i = -5; i <= 5; i++) {
                ctx.beginPath(); ctx.moveTo(mapX(i), mapY(-5)); ctx.lineTo(mapX(i), mapY(5)); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(mapX(-5), mapY(i)); ctx.lineTo(mapX(5), mapY(i)); ctx.stroke();
            }

            // Draw Axes
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(mapX(-5), mapY(0)); ctx.lineTo(mapX(5), mapY(0)); ctx.stroke(); // X
            ctx.beginPath(); ctx.moveTo(mapX(0), mapY(-5)); ctx.lineTo(mapX(0), mapY(5)); ctx.stroke(); // Y

            // Draw Line: x - y = k  => y = x - k
            let k = lineKValue.value;
            ctx.strokeStyle = '#9333ea'; // Purple
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            let x1 = -6, y1 = x1 - k;
            let x2 = 6, y2 = x2 - k;
            
            ctx.moveTo(mapX(x1), mapY(y1));
            ctx.lineTo(mapX(x2), mapY(y2));
            ctx.stroke();

            // Highlight intercepts
            ctx.fillStyle = '#9333ea';
            // x-intercept (k, 0)
            ctx.beginPath(); ctx.arc(mapX(k), mapY(0), 5, 0, Math.PI*2); ctx.fill();
            // y-intercept (0, -k)
            ctx.beginPath(); ctx.arc(mapX(0), mapY(-k), 5, 0, Math.PI*2); ctx.fill();
        };

        // ---- Canvas Logic ----
        const drawCanvas = () => {
            const canvas = document.getElementById('mathCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            
            // Clear
            ctx.clearRect(0, 0, w, h);
            
            // Map logical coordinates (0-8) to canvas (400x400)
            const mapX = (x) => 40 + x * 40;
            const mapY = (y) => h - 40 - y * 40;

            // Draw Grid
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            for(let i = 0; i <= 8; i++) {
                ctx.beginPath(); ctx.moveTo(mapX(i), mapY(0)); ctx.lineTo(mapX(i), mapY(8)); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(mapX(0), mapY(i)); ctx.lineTo(mapX(8), mapY(i)); ctx.stroke();
            }

            // Feasible Region Polygon: (0,0), (3,0), (2,2), (0,3)
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue semi-transparent
            ctx.beginPath();
            ctx.moveTo(mapX(0), mapY(0));
            ctx.lineTo(mapX(3), mapY(0));
            ctx.lineTo(mapX(2), mapY(2));
            ctx.lineTo(mapX(0), mapY(3));
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Boundary lines (extended)
            // x+2y=6 -> (6,0) to (0,3)
            ctx.strokeStyle = '#9ca3af';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(mapX(6), mapY(0));
            ctx.lineTo(mapX(0), mapY(3));
            ctx.stroke();
            // 2x+y=6 -> (3,0) to (0,6)
            ctx.beginPath();
            ctx.moveTo(mapX(3), mapY(0));
            ctx.lineTo(mapX(0), mapY(6));
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw Vertices
            const vertices = [[0,0], [3,0], [2,2], [0,3]];
            ctx.fillStyle = 'black';
            vertices.forEach(v => {
                ctx.beginPath();
                ctx.arc(mapX(v[0]), mapY(v[1]), 4, 0, Math.PI*2);
                ctx.fill();
                ctx.fillText(`(${v[0]}, ${v[1]})`, mapX(v[0]) + 5, mapY(v[1]) - 5);
            });

            // Draw Axes
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            // X axis
            ctx.beginPath(); ctx.moveTo(20, mapY(0)); ctx.lineTo(w-20, mapY(0)); ctx.stroke();
            ctx.fillText('x', w-15, mapY(0)-5);
            // Y axis
            ctx.beginPath(); ctx.moveTo(mapX(0), h-20); ctx.lineTo(mapX(0), 20); ctx.stroke();
            ctx.fillText('y', mapX(0)+5, 15);

            // Draw Objective Line: x + 3y = k
            // Passes through (k, 0) and (0, k/3)
            let k = kValue.value;
            ctx.strokeStyle = '#ef4444'; // Red
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // To make line longer, calculate endpoints based on x range
            let x1 = -1, y1 = (k - x1)/3;
            let x2 = 9, y2 = (k - x2)/3;
            
            ctx.moveTo(mapX(x1), mapY(y1));
            ctx.lineTo(mapX(x2), mapY(y2));
            ctx.stroke();
            
            // Check if hitting a vertex
            let hitVertex = vertices.find(v => Math.abs((v[0] + 3*v[1]) - k) < 0.1);
            if (hitVertex) {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(mapX(hitVertex[0]), mapY(hitVertex[1]), 8, 0, Math.PI*2);
                ctx.fill();
            }
        };

        const autoPlay = () => {
            playSound('click');
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            kValue.value = 0;
            let dir = 0.05;
            const animate = () => {
                kValue.value += dir;
                if (kValue.value >= 12 || kValue.value <= 0) {
                    cancelAnimationFrame(animationFrameId);
                    return;
                }
                drawCanvas();
                // Play tick sound when hitting vertices
                [0, 3, 8, 9].forEach(targetK => {
                    if (Math.abs(kValue.value - targetK) < 0.05) playSound('tick');
                });
                animationFrameId = requestAnimationFrame(animate);
            };
            animate();
        };

        // ---- Practice Logic ----
        const practiceAnswer = ref('');
        const currentPractice = ref(null);
        
        const practicePool = [
            {
                conditions: ['x + y \u2264 4', 'x \u2265 0, y \u2265 0'],
                objective: '3x + 2y',
                type: 'max',
                answer: 12,
                vertices: [[0,0], [4,0], [0,4]]
            },
            {
                conditions: ['2x + y \u2264 8', 'x + 2y \u2264 7', 'x \u2265 0, y \u2265 0'],
                objective: '4x + 3y',
                type: 'max',
                answer: 18, 
            },
            {
                conditions: ['x + 2y \u2265 6', 'x - y \u2264 2', 'y \u2264 4'],
                objective: 'x + y',
                type: 'max',
                answer: 10, 
            },
            {
                conditions: ['3x + 2y \u2264 6', 'x \u2265 0, y \u2265 0', 'x, y 皆為非負整數'],
                objective: '滿足條件的(x,y)組數',
                type: 'count',
                answer: 7, 
            },
            {
                conditions: ['x + 2y \u2264 6', '2x + y \u2264 6', 'x \u2265 0, y \u2265 0'],
                objective: '2x + 2y',
                type: 'max',
                answer: 8, 
            },
            {
                conditions: ['x + 2y \u2265 8', '2x + y \u2265 10', 'x \u2265 0, y \u2265 0'],
                objective: '20x + 15y',
                type: 'min',
                answer: 110, 
            }
        ];

        const generatePractice = () => {
            playSound('click');
            const idx = Math.floor(Math.random() * practicePool.length);
            currentPractice.value = practicePool[idx];
            practiceAnswer.value = '';
        };

        const checkPracticeAnswer = () => {
            if (practiceAnswer.value === '' || isNaN(practiceAnswer.value)) {
                Swal.fire('錯誤', '請輸入有效的數字', 'warning');
                return;
            }
            const correct = Number(practiceAnswer.value) === currentPractice.value.answer;
            if (correct) {
                playSound('success');
                Swal.fire('正確！', '你找到最佳解了！', 'success');
                addHistory('練習', `目標: ${currentPractice.value.objective} (${currentPractice.value.type})`, '正確', true);
            } else {
                playSound('fail');
                Swal.fire('不正確', '請再試一次。提示：試著找出各個頂點並代入目標函數！', 'error');
                addHistory('練習', `目標: ${currentPractice.value.objective} (${currentPractice.value.type})`, '錯誤', false);
            }
        };

        // ---- Quiz Logic ----
        const quizStarted = ref(false);
        const quizFinished = ref(false);
        const quizCurrentIndex = ref(0);
        const quizScore = ref(0);
        const userAnswers = ref([]);

        const quizQuestions = [
            {
                q: '可行解區域是指什麼？',
                options: ['A. 滿足目標函數的點', 'B. 滿足所有限制條件的點所成的區域', 'C. 坐標平面上的第一象限', 'D. 只包含整數解的區域'],
                ans: 1
            },
            {
                q: '在線性規劃中，若最佳解存在，它通常會出現在可行解區域的哪裡？',
                options: ['A. 區域的正中心', 'B. 區域的頂點或邊界上', 'C. 原點 (0,0)', 'D. 第一象限的任意點'],
                ans: 1
            },
            {
                q: '若我們以「平行線法」求極值，平行移動的直線是根據什麼決定的？',
                options: ['A. X 軸與 Y 軸', 'B. 限制條件的邊界', 'C. 目標函數的係數', 'D. 原點的位置'],
                ans: 2
            },
            {
                q: '下列哪個不等式代表一條直線及其左下方的半平面？（假設係數皆正）',
                options: ['A. ax + by \u2264 c', 'B. ax + by \u2265 c', 'C. ax + by = c', 'D. ax - by = c'],
                ans: 0
            },
            {
                q: '當目標函數的平行線移動時，若 k 值愈大，代表直線往哪個方向平移？(假設係數為正)',
                options: ['A. 左下方', 'B. 右上方', 'C. 垂直向上', 'D. 水平向左'],
                ans: 1
            },
            {
                q: '當目標函數直線與可行解區域的某個邊界完全重疊時，最佳解會有多少個？',
                options: ['A. 0個', 'B. 1個', 'C. 2個', 'D. 無限多個'],
                ans: 3
            },
            {
                q: '若題目要求的是「生產的汽車數量」，則變數 x, y 除了要滿足不等式，還必須具備什麼特性？',
                options: ['A. 必須大於等於零', 'B. 必須是整數', 'C. 必須是非負整數', 'D. 必須小於 100'],
                ans: 2
            },
            {
                q: '在解題時，若將兩個相鄰的頂點代入目標函數都得到相同的最大值 100，這代表什麼？',
                options: ['A. 只有這兩個點是最佳解', 'B. 連接這兩點的線段上所有點都能得到最大值 100', 'C. 計算錯誤，不可能發生', 'D. 整個可行解區域的最大值都是 100'],
                ans: 1
            },
            {
                q: '線性規劃最早起源於哪一個年代？',
                options: ['A. 1820~1830 年代', 'B. 1920~1930 年代', 'C. 1980~1990 年代', 'D. 2000 年代以後'],
                ans: 1
            },
            {
                q: '如果不等式為 x + y < 2，在畫圖時該如何表示這條界線？',
                options: ['A. 粗實線', 'B. 細實線', 'C. 虛線', 'D. 不必畫出界線'],
                ans: 2
            }
        ];

        const startQuiz = () => {
            playSound('click');
            quizStarted.value = true;
            quizFinished.value = false;
            quizCurrentIndex.value = 0;
            quizScore.value = 0;
            userAnswers.value = [];
        };

        const selectQuizOption = (idx) => {
            if (idx === quizQuestions[quizCurrentIndex.value].ans) {
                quizScore.value += 10;
                playSound('success');
            } else {
                playSound('fail');
            }
            
            quizCurrentIndex.value++;
            if (quizCurrentIndex.value >= quizQuestions.length) {
                quizFinished.value = true;
                addHistory('測驗', '完成觀念測驗', `${quizScore.value} 分`, quizScore.value >= 60);
                if (quizScore.value === 100) {
                    Swal.fire('太棒了！', '你獲得了滿分！', 'success');
                }
            }
        };

        // ---- UI Settings Helpers ----
        const toggleFullscreen = () => {
            playSound('click');
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error("Error attempting to enable fullscreen:", err);
                });
            } else {
                document.exitFullscreen();
            }
        };

        const deviceClass = computed(() => {
            if (settings.value.device === 'phone') return 'device-phone';
            if (settings.value.device === 'tablet') return 'device-tablet';
            if (settings.value.device === 'desktop') return 'device-desktop';
            return 'w-full';
        });

        const layoutClass = computed(() => {
            if (settings.value.layout === 'landscape') return 'layout-landscape';
            if (settings.value.layout === 'portrait') return 'layout-portrait';
            return 'flex-col lg:flex-row'; // auto
        });

        const fontClass = computed(() => {
            return `font-${settings.value.fontSize}`;
        });

        const themeClass = computed(() => {
            // Handled via body class in applyTheme
            return '';
        });

        const applyTheme = () => {
            const body = document.getElementById('app-body');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (settings.value.theme === 'dark' || (settings.value.theme === 'system' && prefersDark)) {
                body.classList.add('dark-mode');
                body.classList.add('dark'); // for tailwind
            } else {
                body.classList.remove('dark-mode');
                body.classList.remove('dark');
            }
            
            // Re-draw canvas for theme colors if needed (optional)
            if (currentTab.value === 'learn') drawCanvas();
        };

        const setTheme = (t) => {
            settings.value.theme = t;
            applyTheme();
        };

        onMounted(() => {
            generatePractice();
            applyTheme();
            setTimeout(() => {
                drawCanvas();
                drawLineCanvas();
            }, 200);
            
            // Handle fullscreen change externally (e.g. esc key)
            document.addEventListener('fullscreenchange', () => {
                settings.value.fullscreen = !!document.fullscreenElement;
            });
            
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (settings.value.theme === 'system') applyTheme();
            });
        });

        return {
            currentTab, tabs, changeTab,
            showSettings, settings, i18n,
            deviceClass, layoutClass, fontClass, themeClass,
            toggleFullscreen, playSound, setTheme,
            kValue, drawCanvas, autoPlay,
            lineKValue, drawLineCanvas,
            textbookProblems, renderMath,
            practiceAnswer, currentPractice, generatePractice, checkPracticeAnswer,
            quizStarted, quizFinished, quizCurrentIndex, quizScore, quizQuestions, startQuiz, selectQuizOption,
            history, downloadHistory
        };
    }
});

app.mount('#app');

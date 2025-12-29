// --- AI Configuration ---
// خيار 1: ضع مفتاحك هنا مباشرة (سهل ولكن قد يتم إيقافه من قبل جوجل إذا نشرت الكود)
// في ملف app.js السطر رقم 3
const HARDCODED_KEY = "AIzaSyCJBQ_JVAgiBSQjSldkrdFMF9xqFw7A9Xk";

// خيار 2: إذا تركت الخيار الأول فارغاً، سيطلب منك التطبيق المفتاح مرة واحدة ويحفظه في المتصفح
function getApiKey() {
    if (HARDCODED_KEY.trim() !== "") return HARDCODED_KEY.trim();
    return localStorage.getItem('GEMINI_API_KEY');
}

function setApiKey(key) {
    if (key) localStorage.setItem('GEMINI_API_KEY', key.trim());
}

const SYSTEM_PROMPT = `أنت "رفيق"، معلم ذكي، صبور، ومرح جداً للأطفال (عمر 6-12 سنة).
مهمتك هي مساعدتهم على فهم الرياضيات والعلوم بطريقة مبسطة.
- تحدث دائماً باللغة العربية بلهجة ودودة.
- استخدم الرموز التعبيرية (Emojis).
- لا تعطِ الإجابة مباشرة، بل وجه الطالب بالتفكير (مثلاً: "تخيل لو معك 3 حبات حلوى...").
- شجع الطالب دائماً بكلمات مثل "يا بطل"، "يا ذكي"، "رائع".
- ركز على تشخيص نقاط الضعف التي تظهر في نتائج الطالب المذكورة في سياق المحادثة.`;

let chatMessages = [];
let typingInterval, controller;

// --- Data Configuration ---
const quizData = [
    { id: 1, question: "إذا كان معك 5 تفاحات وأعطاك صديقك 3 تفاحات أخرى، كم تفاحة معك الآن؟", category: "addition", options: ["7", "8", "9", "5"], correct: 1 },
    { id: 2, question: "ما هو ناتج طرح 15 من 20؟", category: "subtraction", options: ["5", "10", "15", "2"], correct: 0 },
    { id: 3, question: "أي من الكسور التالية يمثل النصف؟", category: "fractions", options: ["1/3", "1/4", "1/2", "2/3"], correct: 2 },
    { id: 4, question: "ناتج عملية الضرب 4 × 3 هو:", category: "multiplication", options: ["7", "10", "12", "16"], correct: 2 },
    { id: 5, question: "ما هو الكسر المساوي لـ 2/4؟", category: "fractions", options: ["1/2", "1/3", "1/4", "3/4"], correct: 0 },
    { id: 6, question: "ما هو ناتج جمع 12 + 15؟", category: "addition", options: ["25", "27", "30", "22"], correct: 1 },
    { id: 7, question: "إذا كان معك 50 قرشاً وصرفت 20 قرشاً، كم تبقى معك؟", category: "subtraction", options: ["20", "25", "30", "35"], correct: 2 },
    { id: 8, question: "كم يساوي 5 × 5؟", category: "multiplication", options: ["20", "25", "30", "15"], correct: 1 },
    { id: 9, question: "ما هو ناتج قسمة 10 على 2؟", category: "division", options: ["2", "4", "5", "6"], correct: 2 },
    { id: 10, question: "كم عدد أضلاع المربع؟", category: "geometry", options: ["3", "4", "5", "6"], correct: 1 },
    { id: 11, question: "ما هو ناتج جمع 100 + 200؟", category: "addition", options: ["300", "400", "500", "250"], correct: 0 },
    { id: 12, question: "أي شكل له 3 أضلاع؟", category: "geometry", options: ["مربع", "مستطيل", "مثلث", "دائرة"], correct: 2 },
    { id: 13, question: "ما هو ناتج 12 ÷ 3؟", category: "division", options: ["2", "3", "4", "5"], correct: 2 },
    { id: 14, question: "كم دقيقة في الساعة الواحدة؟", category: "logic", options: ["30", "50", "60", "100"], correct: 2 },
    { id: 15, question: "إذا كان اليوم هو الأحد، فما هو يوم غد؟", category: "logic", options: ["السبت", "الاثنين", "الثلاثاء", "الاربعاء"], correct: 1 },
    { id: 16, question: "ما هو ناتج 9 × 2؟", category: "multiplication", options: ["11", "18", "20", "15"], correct: 1 },
    { id: 17, question: "ما هو ناتج طرح 100 من 150؟", category: "subtraction", options: ["50", "60", "40", "100"], correct: 0 },
    { id: 18, question: "ما هو ضعف العدد 7؟", category: "addition", options: ["10", "14", "21", "12"], correct: 1 },
    { id: 19, question: "كم هو 20 ÷ 4؟", category: "division", options: ["4", "5", "6", "10"], correct: 1 },
    { id: 20, question: "ما هو اسم الشكل الذي ليس له أضلاع؟", category: "geometry", options: ["مثلث", "مربع", "دائرة", "خماسي"], correct: 2 }
];

const lessonsData = {
    addition: { title: "إتقان الجمع البسيط", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", tips: ["تخيل الأرقام كأشياء حقيقية", "استخدم أصابعك أو الرسم"] },
    subtraction: { title: "سر الطرح السريع", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", tips: ["الطرح هو عكس الجمع", "فكر في النقصان"] },
    fractions: { title: "فهم الكسور بسهولة", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", tips: ["الكسر هو جزء من كل", "تخيل تقطيع البيتزا"] },
    multiplication: { title: "عجائب الضرب", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", tips: ["الضرب هو جمع متكرر", "احفظ الجداول بالتدريج"] },
    division: { title: "أسرار القسمة", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", tips: ["القسمة هي توزيع بالتساوي", "فكر في الضرب بالعكس"] },
    geometry: { title: "عالم الأشكال", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", tips: ["لاحظ الأشكال من حولك", "عد الأضلاع والزوايا"] },
    logic: { title: "التفكير الذكي", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", tips: ["فكر قبل الإجابة", "استخدم المنطق لحل الألغاز"] }
};

// --- State Management ---
let currentState = {
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    xp: 0,
    weaknesses: [],
    badges: []
};

// --- DOM Elements ---
const heroSection = document.getElementById('hero');
const quizSection = document.getElementById('quiz-section');
const dashboardSection = document.getElementById('dashboard');
const quizContainer = document.getElementById('quiz-container');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const startBtn = document.getElementById('start-quiz-btn');
const rescuePlanContainer = document.getElementById('rescue-plan-container');
const chatBuddy = document.getElementById('chat-buddy');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const progressBar = document.getElementById('quiz-progress-bar');
const xpValDisplay = document.getElementById('xp-val');
const toggleChatBtn = document.getElementById('toggle-chat-btn');

// --- Initialization ---
if (startBtn) {
    startBtn.addEventListener('click', () => {
        heroSection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        chatBuddy.classList.add('active');
        loadQuestion();
    });
}

if (toggleChatBtn) {
    toggleChatBtn.addEventListener('click', () => {
        chatBuddy.classList.toggle('minimized');
    });
}

function loadQuestion() {
    const q = quizData[currentState.currentQuestionIndex];
    questionText.innerText = q.question;
    optionsContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerText = opt;
        btn.onclick = () => selectOption(idx);
        optionsContainer.appendChild(btn);
    });
    updateProgressBar();
    addBotMessage(`هيا يا بطل! السؤال ${currentState.currentQuestionIndex + 1} عن ${getCategoryNameInArabic(q.category)}.`);
}

function updateProgressBar() {
    const progress = (currentState.currentQuestionIndex / quizData.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function selectOption(index) {
    const q = quizData[currentState.currentQuestionIndex];
    const isCorrect = index === q.correct;
    currentState.answers.push({ category: q.category, correct: isCorrect });
    if (isCorrect) currentState.score += 20;
    currentState.currentQuestionIndex++;
    if (currentState.currentQuestionIndex < quizData.length) {
        loadQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    quizSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    currentState.xp = currentState.answers.filter(a => a.correct).length * 50;
    analyzeResults();
    checkBadges();
    renderDashboard();
    renderBadges();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#2DD4BF', '#FDE047', '#F43F5E'] });
    addBotMessage(`رائع! لقد انتهينا. حصلت على ${currentState.xp} نقطة خبرة (XP)! لقد صممت لك خطة مخصصة.`);
}

function checkBadges() {
    const correctCount = currentState.answers.filter(a => a.correct).length;
    if (correctCount === quizData.length) currentState.badges.push({ name: "العبقري الكامل", icon: "💎" });
    if (currentState.score >= 100) currentState.badges.push({ name: "بطل الرياضيات", icon: "🏆" });
    if (currentState.answers.length >= 10) currentState.badges.push({ name: "المثابر", icon: "🔥" });
}

function renderBadges() {
    const badgesList = document.getElementById('badges-list');
    if (!badgesList) return;
    badgesList.innerHTML = '';
    currentState.badges.forEach(badge => {
        const div = document.createElement('div');
        div.className = 'badge-item';
        div.innerHTML = `<span class="badge-icon">${badge.icon}</span><span class="badge-name">${badge.name}</span>`;
        badgesList.appendChild(div);
    });
}

function analyzeResults() {
    const categories = [...new Set(quizData.map(q => q.category))];
    currentState.weaknesses = [];
    categories.forEach(cat => {
        const catQuestions = currentState.answers.filter(a => a.category === cat);
        const correctCount = catQuestions.filter(a => a.correct).length;
        if ((correctCount / catQuestions.length) * 100 < 70) currentState.weaknesses.push(cat);
    });
}

function renderDashboard() {
    document.getElementById('score-val').innerText = currentState.score;
    document.getElementById('xp-val').innerText = currentState.xp;
    document.getElementById('rank-val').innerText = currentState.score > 80 ? "عبقري" : (currentState.score > 40 ? "مجتهد" : "مكافح");
    rescuePlanContainer.innerHTML = '';
    if (currentState.weaknesses.length === 0) {
        rescuePlanContainer.innerHTML = `<div class="glass" style="grid-column: 1/-1; padding: 2rem; text-align: center;"><h3>أنت مذهل! 🌟</h3><p>أجبت على كل شيء بشكل صحيح.</p></div>`;
        return;
    }
    currentState.weaknesses.forEach(weak => {
        const lesson = lessonsData[weak];
        const card = document.createElement('div');
        card.className = 'glass lesson-card';
        card.style.padding = '1.5rem';
        card.innerHTML = `<h4 style="color: var(--primary); margin-bottom: 1rem;">${lesson.title}</h4><ul style="padding-right: 20px; color: var(--text-muted);">${lesson.tips.map(t => `<li style="margin-bottom: 0.5rem;">${t}</li>`).join('')}</ul>`;
        rescuePlanContainer.appendChild(card);
    });
}

function getCategoryNameInArabic(cat) {
    const names = { addition: "الجمع", subtraction: "الطرح", fractions: "الكسور", multiplication: "الضرب", division: "القسمة", geometry: "الهندسة", logic: "المنطق" };
    return names[cat] || cat;
}

// --- AI Logic Enhancements (Typing Effect & Abort) ---
function typingEffect(text, textElement, botMsgDiv) {
    textElement.textContent = "";
    const words = text.split(" ");
    let wordIndex = 0;

    typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
            textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
            chatBody.scrollTop = chatBody.scrollHeight;
        } else {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.getElementById('stop-response-btn').style.display = 'none';
        }
    }, 40);
}

document.getElementById('stop-response-btn')?.addEventListener('click', () => {
    controller?.abort();
    clearInterval(typingInterval);
    const lastBotMsg = chatBody.querySelector('.msg-bot.loading');
    if (lastBotMsg) {
        lastBotMsg.classList.remove('loading');
        const textEl = lastBotMsg.querySelector('.bot-text');
        if (textEl) textEl.innerText += " (تم الإيقاف)";
    }
    document.getElementById('stop-response-btn').style.display = 'none';
});

// --- Suggestions Handler ---
document.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
        chatInput.value = item.innerText;
        handleUserMessage();
    });
});

sendChatBtn.addEventListener('click', handleUserMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserMessage(); });

async function handleUserMessage() {
    let currentKey = getApiKey();
    if (!currentKey) {
        currentKey = prompt("من فضلك أدخل مفتاح Gemini API الخاص بك للاستمرار (يمكنك الحصول عليه من Google AI Studio):");
        if (currentKey) {
            setApiKey(currentKey);
        } else {
            addBotMessage("عذراً، أحتاج إلى مفتاح API لكي أتمكن من الرد عليك. يرجى تحديث الصفحة وإدخاله.");
            return;
        }
    }

    const text = chatInput.value.trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = '';

    // Create bot message placeholder with loading state
    const botMsgDiv = document.createElement('div');
    botMsgDiv.className = 'message msg-bot loading';

    const avatar = document.createElement('span');
    avatar.innerText = "🤖";
    avatar.style.marginLeft = "8px";

    const textElement = document.createElement('span');
    textElement.className = "bot-text";
    textElement.innerText = "... رفيق يفكر ...";

    botMsgDiv.appendChild(avatar);
    botMsgDiv.appendChild(textElement);
    chatBody.appendChild(botMsgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Show stop button
    document.getElementById('stop-response-btn').style.display = 'block';

    // Setup AbortController
    controller = new AbortController();

    // Prepare message history
    if (chatMessages.length === 0) {
        chatMessages.push({ role: "user", parts: [{ text: `التعليمات: ${SYSTEM_PROMPT}\n\nرسالتي الأولى هي: ${text}` }] });
    } else {
        chatMessages.push({ role: "user", parts: [{ text: text }] });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getApiKey()}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: chatMessages,
                generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `Status: ${response.status}`;
            const technicalError = new Error(errorMessage);
            technicalError.geminiError = errorMessage;
            technicalError.status = response.status;
            throw technicalError;
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text.trim();

        // Use typing effect for the response
        textElement.innerText = ""; // Clear the loading text
        typingEffect(responseText, textElement, botMsgDiv);

        chatMessages.push({ role: "model", parts: [{ text: responseText }] });

    } catch (error) {
        console.error("Gemini Connection Error:", error);
        botMsgDiv.classList.remove("loading");

        if (error.name === "AbortError") {
            textElement.innerText = "تم إيقاف التفكير.";
            textElement.style.color = "#d92939";
            document.getElementById('stop-response-btn').style.display = 'none';
            return;
        }

        let errorMsg = "عذراً يا بطل، حدثت مشكلة في الاتصال بالمساعد الذكي.";
        let detailedError = error.message;

        document.getElementById('stop-response-btn').style.display = 'none';

        if (error.geminiError) {
            detailedError = `Gemini Error: ${error.geminiError}\nStatus: ${error.status}`;
            if (error.status === 400 || error.status === 401) {
                localStorage.removeItem('GEMINI_API_KEY');
                detailedError += "\n\n⚠️ يبدو أن المفتاح غير صالح. تم مسحه من الذاكرة، يرجى المحاولة مرة أخرى بمفتاح جديد.";
            }
        }

        textElement.innerHTML = `<strong>${errorMsg}</strong><br><small>🔍 التفاصيل الفنية:<br>${detailedError}</small>`;
        textElement.style.color = "#d92939";
    }
}

function addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message msg-user';
    msg.innerText = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function addBotMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message msg-bot';
    msg.innerText = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
}

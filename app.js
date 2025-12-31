const API_KEY = "AIzaSyCoELFbmkZU8vTKa1Hn_FdpsUZ1HDNLpuE";




const typingEffect = (text, textElement, botMsgDiv) => {
    textElement.textContent = "";
    const words = text.split(" ");
    let wordIndex = 0;

    typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
            textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
            scrollToBottom();
        } else {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
            stopResponseBtn.style.display = 'none';
        }
    }, 40);
}


const SYSTEM_PROMPT = `أنت "رفيق"، معلم ذكي، صبور، ومرح جداً للأطفال (عمر 6-12 سنة).
مهمتك هي مساعدتهم على فهم الرياضيات والعلوم بطريقة مبسطة.
- تحدث دائماً باللغة العربية بلهجة ودودة.
- استخدم الرموز التعبيرية (Emojis).
- لا تعطِ الإجابة مباشرة، بل وجه الطالب بالتفكير (مثلاً: "تخيل لو معك 3 حبات حلوى...").
- شجع الطالب دائماً بكلمات مثل "يا بطل"، "يا ذكي"، "رائع".
- ركز على تشخيص نقاط الضعف التي تظهر في نتائج الطالب المذكورة في سياق المحادثة.`;



// --- State Management ---
const chatHistory = [];
const userData = { message: "", file: {} };
let typingInterval, controller;

let currentState = {
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    xp: 0,
    weaknesses: [],
    badges: []
};

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

// --- DOM Elements ---
let heroSection, quizSection, dashboardSection, quizContainer, questionText, optionsContainer,
    startBtn, rescuePlanContainer, chatBuddy, chatBody, chatInput, sendChatBtn,
    progressBar, xpValDisplay, toggleChatBtn, themeToggle, fileInput, addFileBtn,
    cancelFileBtn, fileUploadWrapper, filePreview, stopResponseBtn;

const scrollToBottom = () => chatBody?.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

// --- Helpers ---
const createMsgElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// --- AI Core ---
const generateResponse = async (botMsgDiv, currentMessage, currentFile) => {
    const textElement = botMsgDiv.querySelector(".bot-text");
    controller = new AbortController();

    // Context preparation: Add persona and current message/file
    const currentParts = [{ text: (chatHistory.length === 0 ? `التعليمات: ${SYSTEM_PROMPT} \n\n ${currentMessage}` : currentMessage) }];
    if (currentFile.data) {
        currentParts.push({ inline_data: { data: currentFile.data, mime_type: currentFile.mime_type } });
    }

    chatHistory.push({ role: "user", parts: currentParts });

    const models = [
        { name: "gemini-2.5-flash", versions: ["v1beta"] },
        { name: "gemini-2.5-flash-lite", versions: ["v1beta"] },
        { name: "gemini-2.0-flash", versions: ["v1beta"] },
        { name: "gemini-2.0-flash-exp", versions: ["v1beta"] },
        { name: "gemini-1.5-flash", versions: ["v1beta", "v1"] },
        { name: "gemini-1.5-pro", versions: ["v1beta", "v1"] }
    ];

    let lastError = null;

    for (const model of models) {
        for (const version of model.versions) {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model.name}:generateContent?key=${API_KEY}`;
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: chatHistory }),
                    signal: controller.signal
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 429) {
                        console.warn(`Model ${model.name} (${version}) rate limited. Waiting...`);
                        lastError = new Error("تم الوصول للحد الأقصى للطلبات (429).");
                        await new Promise(r => setTimeout(r, 4000));
                        continue;
                    }
                    if (response.status === 404) {
                        console.warn(`Model ${model.name} not found on ${version}. Skipping...`);
                        continue;
                    }
                    throw new Error(data.error?.message || "مشكلة في الخادم.");
                }

                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    const responseText = data.candidates[0].content.parts[0].text.trim();
                    typingEffect(responseText, textElement, botMsgDiv);
                    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
                    return; // Success!
                }
                throw new Error("تلقيت رداً غير مكتمل.");

            } catch (error) {
                lastError = error;
                if (error.name === "AbortError") break;
                console.error(`Attempt with ${model.name} (${version}) failed:`, error.message);
                continue;
            }
        }
    }



    // If we get here, all models failed or was aborted
    textElement.style.color = "#d92939";
    textElement.textContent = lastError?.name === "AbortError" ? "تم توقيف التفكير." : `عذراً يا بطل! واجهتني مشكلة: ${lastError?.message}`;
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    stopResponseBtn.style.display = 'none';
    userData.file = {};
}



// --- Event Handlers ---
const handleUserMessage = () => {
    const text = chatInput.value.trim();
    if (!text || document.body.classList.contains("bot-responding")) return;

    // CAPTURE state immediately
    const capturedMessage = text;
    const capturedFile = { ...userData.file };

    // Reset UI and global state immediately
    chatInput.value = "";
    userData.message = "";
    userData.file = { data: null, mime_type: null };
    document.body.classList.add("bot-responding");
    fileUploadWrapper.classList.remove("active");
    if (filePreview) filePreview.classList.remove("active");
    if (cancelFileBtn) cancelFileBtn.click();

    // Add user message to UI
    const userMsgHTML = `<span>${capturedMessage}</span>${capturedFile.data ? `<img src="data:${capturedFile.mime_type};base64,${capturedFile.data}" class="img-attachment"/>` : ""}`;
    const userMsgDiv = createMsgElement(userMsgHTML, "msg-user");
    chatBody.appendChild(userMsgDiv);
    scrollToBottom();

    // Add bot loading placeholder
    setTimeout(() => {
        const botMsgHTML = `<span>🤖</span><span class="bot-text">... رفيق يفكر ...</span>`;
        const botMsgDiv = createMsgElement(botMsgHTML, "msg-bot", "loading");
        chatBody.appendChild(botMsgDiv);
        stopResponseBtn.style.display = 'block';
        scrollToBottom();
        generateResponse(botMsgDiv, capturedMessage, capturedFile);
    }, 600);
}

// --- Initialize Application ---
function initApp() {
    console.log("إطلاق رفيق... 🚀");

    // Select Elements
    heroSection = document.getElementById('hero');
    quizSection = document.getElementById('quiz-section');
    dashboardSection = document.getElementById('dashboard');
    quizContainer = document.getElementById('quiz-container');
    questionText = document.getElementById('question-text');
    optionsContainer = document.getElementById('options-container');
    startBtn = document.getElementById('start-quiz-btn');
    rescuePlanContainer = document.getElementById('rescue-plan-container');
    chatBuddy = document.getElementById('chat-buddy');
    chatBody = document.getElementById('chat-body');
    chatInput = document.getElementById('chat-input');
    sendChatBtn = document.getElementById('send-chat-btn');
    progressBar = document.getElementById('quiz-progress-bar');
    xpValDisplay = document.getElementById('xp-val');
    toggleChatBtn = document.getElementById('toggle-chat-btn');
    themeToggle = document.getElementById('theme-toggle-btn');
    fileInput = document.getElementById('file-input');
    addFileBtn = document.getElementById('add-file-btn');
    cancelFileBtn = document.getElementById('cancel-file-btn');
    fileUploadWrapper = document.querySelector('.file-upload-wrapper');
    filePreview = document.querySelector('.file-preview');
    stopResponseBtn = document.getElementById('stop-response-btn');

    // Chat Listeners
    sendChatBtn?.addEventListener('click', handleUserMessage);
    chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserMessage(); });

    fileInput?.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const base64String = e.target.result.split(",")[1];
            if (filePreview) filePreview.src = e.target.result;
            fileUploadWrapper?.classList.add("active");
            userData.file = { data: base64String, mime_type: file.type };
        }
    });

    cancelFileBtn?.addEventListener('click', () => {
        userData.file = {};
        fileUploadWrapper?.classList.remove("active");
    });

    addFileBtn?.addEventListener('click', () => fileInput?.click());

    stopResponseBtn?.addEventListener('click', () => {
        controller?.abort();
        clearInterval(typingInterval);
        const lastBotMsg = chatBody?.lastElementChild;
        if (lastBotMsg && lastBotMsg.classList.contains("loading")) {
            lastBotMsg.classList.remove("loading");
            const textEl = lastBotMsg.querySelector(".bot-text");
            if (textEl) textEl.innerText += " (تم الإيقاف)";
        }
        document.body.classList.remove("bot-responding");
        if (stopResponseBtn) stopResponseBtn.style.display = 'none';
    });



    themeToggle?.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        if (themeToggle) themeToggle.innerText = isLight ? '☀️' : '🌙';
    });

    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggle) themeToggle.innerText = '☀️';
    }

    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            if (chatInput) {
                chatInput.value = item.innerText;
                handleUserMessage();
            }
        });
    });

    // Quiz Listeners
    startBtn?.addEventListener('click', () => {
        heroSection?.classList.add('hidden');
        quizSection?.classList.remove('hidden');
        chatBuddy?.classList.add('active');
        loadQuestion();
    });

    toggleChatBtn?.addEventListener('click', () => {
        chatBuddy?.classList.toggle('minimized');
    });
}


// Safe Loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
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


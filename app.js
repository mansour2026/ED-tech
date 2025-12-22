import OpenAI from "openai";

// --- AI Configuration ---
// IMPORTANT: Paste your OpenAI API Key here
// Note: This is a client-side implementation for demo purposes. In production, use a backend proxy.
const API_KEY = "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";

const openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true // Required for client-side usage
});

const SYSTEM_PROMPT = `أنت "رفيق"، معلم ذكي، صبور، ومرح جداً للأطفال (عمر 6-12 سنة).
مهمتك هي مساعدتهم على فهم الرياضيات والعلوم بطريقة مبسطة.
- تحدث دائماً باللغة العربية بلهجة ودودة.
- استخدم الرموز التعبيرية (Emojis).
- لا تعطِ الإجابة مباشرة، بل وجه الطالب بالتفكير (مثلاً: "تخيل لو معك 3 حبات حلوى...").
- شجع الطالب دائماً بكلمات مثل "يا بطل"، "يا ذكي"، "رائع".
- ركز على تشخيص نقاط الضعف التي تظهر في نتائج الطالب المذكورة في سياق المحادثة.`;

let chatHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];


// --- Data Configuration ---
const quizData = [
    {
        id: 1,
        question: "إذا كان معك 5 تفاحات وأعطاك صديقك 3 تفاحات أخرى، كم تفاحة معك الآن؟",
        category: "addition",
        options: ["7", "8", "9", "5"],
        correct: 1
    },
    {
        id: 2,
        question: "ما هو ناتج طرح 15 من 20؟",
        category: "subtraction",
        options: ["5", "10", "15", "2"],
        correct: 0
    },
    {
        id: 3,
        question: "أي من الكسور التالية يمثل النصف؟",
        category: "fractions",
        options: ["1/3", "1/4", "1/2", "2/3"],
        correct: 2
    },
    {
        id: 4,
        question: "ناتج عملية الضرب 4 × 3 هو:",
        category: "multiplication",
        options: ["7", "10", "12", "16"],
        correct: 2
    },
    {
        id: 5,
        question: "ما هو الكسر المساوي لـ 2/4؟",
        category: "fractions",
        options: ["1/2", "1/3", "1/4", "3/4"],
        correct: 0
    }
];

const lessonsData = {
    addition: {
        title: "إتقان الجمع البسيط",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
        tips: ["تخيل الأرقام كأشياء حقيقية", "استخدم أصابعك أو الرسم"]
    },
    subtraction: {
        title: "سر الطرح السريع",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        tips: ["الطرح هو عكس الجمع", "فكر في النقصان"]
    },
    fractions: {
        title: "فهم الكسور بسهولة",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        tips: ["الكسر هو جزء من كل", "تخيل تقطيع البيتزا"]
    },
    multiplication: {
        title: "عجائب الضرب",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        tips: ["الضرب هو جمع متكرر", "احفظ الجداول بالتدريج"]
    }
};

// --- State Management ---
let currentState = {
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    xp: 0,
    weaknesses: []
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

// --- Initialization ---
startBtn.addEventListener('click', () => {
    heroSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    chatBuddy.classList.add('active');
    loadQuestion();
});

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

    currentState.answers.push({
        category: q.category,
        correct: isCorrect
    });

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

    // Calculate XP
    currentState.xp = currentState.answers.filter(a => a.correct).length * 50;

    analyzeResults();
    renderDashboard();
    addBotMessage(`رائع! لقد انتهينا. لقد حصلت على ${currentState.xp} نقطة خبرة (XP)! لقد صممت لك خطة تدريب مخصصة.`);
}

function analyzeResults() {
    const categories = [...new Set(quizData.map(q => q.category))];
    const categoryScores = {};
    currentState.weaknesses = []; // Reset weaknesses

    categories.forEach(cat => {
        const catQuestions = currentState.answers.filter(a => a.category === cat);
        const correctCount = catQuestions.filter(a => a.correct).length;
        categoryScores[cat] = (correctCount / catQuestions.length) * 100;

        if (categoryScores[cat] < 70) {
            currentState.weaknesses.push(cat);
        }
    });
}

function renderDashboard() {
    document.getElementById('score-val').innerText = currentState.score;
    document.getElementById('xp-val').innerText = currentState.xp;
    document.getElementById('rank-val').innerText = currentState.score > 80 ? "عبقري" : (currentState.score > 40 ? "مجتهد" : "مكافح");

    rescuePlanContainer.innerHTML = '';

    if (currentState.weaknesses.length === 0) {
        rescuePlanContainer.innerHTML = `<div class="glass" style="grid-column: 1/-1; padding: 2rem; text-align: center;">
            <h3>أنت مذهل! 🌟</h3>
            <p>لقد أجبت على كل شيء بشكل صحيح. جرب تحديات أكثر صعوبة!</p>
        </div>`;
        return;
    }

    currentState.weaknesses.forEach(weak => {
        const lesson = lessonsData[weak];
        const card = document.createElement('div');
        card.className = 'glass lesson-card';
        card.style.padding = '1.5rem';
        card.style.borderRadius = 'var(--radius)';
        card.innerHTML = `
            <h4 style="color: var(--primary); margin-bottom: 10px;">${lesson.title}</h4>
            <div style="aspect-ratio: 16/9; background: #eee; border-radius: 10px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <iframe width="100%" height="100%" src="${lesson.video}" frameborder="0" allowfullscreen></iframe>
            </div>
            <ul style="padding-right: 20px; font-size: 0.9rem; color: var(--text-muted);">
                ${lesson.tips.map(t => `<li>${t}</li>`).join('')}
            </ul>
        `;
        rescuePlanContainer.appendChild(card);
    });
}

// --- Helper Functions ---
function getCategoryNameInArabic(cat) {
    const names = {
        addition: "الجمع",
        subtraction: "الطرح",
        fractions: "الكسور",
        multiplication: "الضرب"
    };
    return names[cat] || cat;
}

// --- Chat Interaction ---
sendChatBtn.addEventListener('click', handleUserMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserMessage();
});

async function handleUserMessage() {
    const text = chatInput.value.trim();

    // Check if API key is still the placeholder or looks invalid
    const isPlaceholder = API_KEY === "YOUR_OPENAI_API_KEY_HERE";

    if (!text) return;

    if (isPlaceholder) {
        addBotMessage("أهلاً بك! يبدو أن مفتاح OpenAI API غير مضبوط بشكل صحيح. يرجى التأكد من وضعه في ملف app.js.");
        chatInput.value = '';
        return;
    }

    addUserMessage(text);
    chatInput.value = '';

    // Show typing indicator
    const tempMsg = document.createElement('div');
    tempMsg.className = 'message msg-bot';
    tempMsg.innerText = "... رفيق يفكر ...";
    chatBody.appendChild(tempMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Add user message to history
    chatHistory.push({ role: "user", content: text });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Optimized model
            messages: chatHistory,
        });

        const botResponse = response.choices[0].message.content;

        // Add bot response to history
        chatHistory.push({ role: "assistant", content: botResponse });

        tempMsg.remove();
        addBotMessage(botResponse);
    } catch (error) {
        console.error("OpenAI Error Details:", error);
        tempMsg.remove();

        let errorMessage = "عذراً، حدث خطأ في التواصل مع OpenAI.";
        if (error.status === 401) {
            errorMessage = "🔑 عذراً، مفتاح API غير صالح. تأكد من وضعه بشكل صحيح.";
        } else if (error.status === 429) {
            errorMessage = "⏳ تم تجاوز حد الطلبات المسموح به. يرجى المحاولة لاحقاً.";
        } else if (error.status === 500) {
            errorMessage = "🌐 حدث خطأ في خوادم OpenAI. يرجى المحاولة لاحقاً.";
        }

        addBotMessage(errorMessage);
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
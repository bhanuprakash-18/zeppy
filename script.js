// Chat Widget Controls
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing chat controls...');
    const chatButton = document.getElementById('chatButton');
    const chatWidget = document.getElementById('chatWidget');
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChat = document.getElementById('closeChat');

    console.log('Chat elements found:', {
        chatButton: !!chatButton,
        chatWidget: !!chatWidget,
        chatOverlay: !!chatOverlay,
        closeChat: !!closeChat
    });

    // Open chat widget
    if (chatButton) {
        chatButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Chat button clicked!');
            
            if (chatWidget && chatOverlay) {
                chatWidget.classList.add('active');
                chatOverlay.classList.add('active');
                chatButton.style.display = 'none';
                
                // Focus on input after opening
                setTimeout(() => {
                    const messageInput = document.getElementById('messageInput');
                    if (messageInput) {
                        messageInput.focus();
                    }
                }, 300);
            } else {
                console.error('Chat widget or overlay not found!');
            }
        });
    } else {
        console.error('Chat button not found!');
    }

    // Close chat widget
    function closeChatWidget() {
        chatWidget.classList.remove('active');
        chatOverlay.classList.remove('active');
        chatButton.style.display = 'flex';
    }

    closeChat.addEventListener('click', closeChatWidget);
    chatOverlay.addEventListener('click', closeChatWidget);

    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && chatWidget.classList.contains('active')) {
            closeChatWidget();
        }
    });
});

class ZeppelinChatbot {
    constructor() {
        this.jobs = [];
        this.faqs = [];
        this.handbook = {};
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        
        // Conversation state management
        this.conversationState = {
            lastTopic: null,
            lastQuestion: null,
            expectingFollowUp: false,
            context: {}
        };
        
        // Job pagination state
        this.currentJobSet = [];
        this.currentJobPage = 0;
        
        this.initializeEventListeners();
        this.loadData();
        this.setInitialTime();
        
        // Make chatbot globally accessible for button clicks
        window.chatbot = this;
    }

    setInitialTime() {
        const timeElement = document.getElementById('initialTime');
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Prevent empty messages
        this.messageInput.addEventListener('input', () => {
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendButton.disabled = !hasText;
        });
    }

    async loadData() {
        try {
            // Load all JSON data
            const [jobsResponse, faqsResponse, handbookResponse] = await Promise.all([
                fetch('jobs.json'),
                fetch('faq.json'),
                fetch('handbook.json')
            ]);

            this.jobs = (await jobsResponse.json()).jobs;
            this.faqs = (await faqsResponse.json()).faqs;
            this.handbook = (await handbookResponse.json()).company;

            console.log('Data loaded successfully:', {
                jobs: this.jobs.length,
                faqs: this.faqs.length,
                handbook: !!this.handbook
            });
        } catch (error) {
            console.error('Error loading data:', error);
            this.addBotMessage('Sorry, I\'m having trouble accessing my knowledge base. Please try refreshing the page.');
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message
        this.addUserMessage(message);
        this.messageInput.value = '';
        this.sendButton.disabled = true;

        // Show typing indicator
        this.showTypingIndicator();

        // Process and respond after a short delay
        setTimeout(() => {
            this.hideTypingIndicator();
            this.processMessage(message);
        }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store reference to the last user message for later scrolling
        this.lastUserMessage = messageDiv;
    }

    addBotMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                ${content}
            </div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToNewMessage(messageDiv);
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    Typing<div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for too vague/unclear messages
        if (this.isMessageTooVague(message)) {
            this.addBotMessage(`
                <p>I'd be happy to help! Could you please be more specific about what you'd like to know?</p>
                <p>You can ask me about:</p>
                <ul>
                    <li>Application process and requirements</li>
                    <li>Job opportunities and positions</li>
                    <li>Company information and culture</li>
                    <li>Benefits and working conditions</li>
                    <li>Training and development opportunities</li>
                </ul>
                <br>
                <p>I hope I was able to help you! Would you like to apply now or find out more?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="chatbot.askSpecific('show me available jobs')">Apply now</button>
                    <button class="option-btn" onclick="chatbot.resetToMainMenu()">Ask more questions</button>
                    <button class="option-btn" onclick="chatbot.askSpecific('contact recruiting team')">Get in touch</button>
                </div>
            `);
            return;
        }
        
        // Handle conversation flow for simple responses
        if (this.conversationState.expectingFollowUp) {
            return this.handleFollowUpResponse(lowerMessage);
        }
        
        // Handle yes/no responses based on context
        if (this.isSimpleResponse(lowerMessage)) {
            return this.handleSimpleResponse(lowerMessage);
        }
        
        // PRIORITY 1: Handle application process questions (before job search)
        if (this.isApplicationQuestion(lowerMessage)) {
            const faqMatches = this.findFAQMatches(lowerMessage);
            if (faqMatches.length > 0) {
                this.setConversationState('faq', faqMatches[0].question);
                this.respondWithFAQ(faqMatches[0]);
                return;
            }
        }
        
        // PRIORITY 2: Handle contact requests
        if (lowerMessage.includes('contact') || lowerMessage.includes('recruiting team') || lowerMessage.includes('get in touch')) {
            this.setConversationState('contact', 'contact_info');
            this.addBotMessage(`
                <p>You can contact our recruiting team in several ways:</p>
                <ul>
                    <li><strong>Email:</strong> careers@jobs.com</li>
                    <li><strong>Phone:</strong> +49 00 123-4567 (Hamburg HQ)</li>
                    <li><strong>Application Portal:</strong> Visit our website's career section</li>
                    <li><strong>LinkedIn:</strong> Follow us @ZeppelinPowerSystems</li>
                </ul>
                <p>Our recruiting team is available Monday-Friday, 9:00 AM - 5:00 PM CET.</p>
                <p>Would you like to apply for a position, or do you have more questions?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Apply for positions</button>
                    <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Application questions</button>
                    <button class="option-btn" onclick="chatbot.handleQuickOption('company')">Company information</button>
                    <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to main menu</button>
                </div>
            `);
            return;
        }
        
        // PRIORITY 3: Handle job search queries (only if not application-related)
        const jobMatches = this.findJobMatches(lowerMessage);
        if (this.isJobSearchQuery(lowerMessage) && !this.isApplicationQuestion(lowerMessage)) {
            this.setConversationState('jobs', 'job_search');
            
            if (jobMatches.length > 0) {
                this.respondWithJobs(jobMatches, false, true); // true for isSearchResult
            } else {
                this.respondWithNoJobs(lowerMessage);
            }
            return;
        }

        // PRIORITY 4: Handle specific company info requests (locations, culture, etc.) before general FAQ
        if (lowerMessage.includes('location') || lowerMessage.includes('office') || 
            lowerMessage.includes('culture') || lowerMessage.includes('environment') ||
            lowerMessage.includes('mission') || lowerMessage.includes('vision') || lowerMessage.includes('values')) {
            const companyInfo = this.findCompanyInfo(lowerMessage);
            if (companyInfo) {
                this.setConversationState('company', 'company_info');
                this.addBotMessage(companyInfo);
                this.addCompanyInfoOptions();
                return;
            }
        }

        // PRIORITY 5: Handle other FAQ matches
        const faqMatches = this.findFAQMatches(lowerMessage);
        if (faqMatches.length > 0) {
            this.setConversationState('faq', faqMatches[0].question);
            this.respondWithFAQ(faqMatches[0]);
            return;
        }

        // PRIORITY 6: Handle general company info matches
        const companyInfo = this.findCompanyInfo(lowerMessage);
        if (companyInfo) {
            this.setConversationState('company', 'company_info');
            this.addBotMessage(companyInfo);
            this.addCompanyInfoOptions();
            return;
        }

        // Default response with dialog tree options
        this.addBotMessage(`
            <p>Hmm, I'm not quite sure about that one! 🤔 But no worries - I'm Zeppy, and I'm here to help you find exactly what you need! ✨</p>
            <div class="quick-options">
                <button class="option-btn" onclick="window.chatbot.handleQuickOption('application')">Application & documents</button>
                <button class="option-btn" onclick="window.chatbot.handleQuickOption('jobs')">Job advertisements & requirements</button>
                <button class="option-btn" onclick="window.chatbot.handleQuickOption('company')">Company & working time models</button>
                <button class="option-btn" onclick="window.chatbot.handleQuickOption('benefits')">Benefits & corporate culture</button>
                <button class="option-btn" onclick="window.chatbot.askSpecific('contact recruiting team')">Contact recruiting team</button>
            </div>
            <p>Or feel free to rephrase your question - I love helping people find their perfect career path! 😊🚁</p>
        `);
    }

    isMessageTooVague(message) {
        const trimmedMessage = message.trim().toLowerCase();
        
        // Check for single words that are too vague
        const vagueSingleWords = ['what', 'how', 'when', 'where', 'why', 'who', 'tell', 'info', 'help', 'hi', 'hello', 'hey'];
        if (vagueSingleWords.includes(trimmedMessage)) {
            return true;
        }
        
        // Check for very short messages (less than 3 characters)
        if (trimmedMessage.length < 3) {
            return true;
        }
        
        // Check for other vague patterns - only truly incomplete questions without objects
        const vaguePatterns = [
            'what?', 'how?', 'tell me', 'i want to know', 'information',
            'what is', 'what are', 'how do', 'how can', 'tell me about',
            'what about', 'how about', 'what does'
        ];
        
        return vaguePatterns.some(pattern => trimmedMessage === pattern);
    }

    isApplicationQuestion(message) {
        // Check if the message is asking about the application process rather than job listings
        const applicationKeywords = [
            'how to apply', 'how can i apply', 'how do i apply', 'application process',
            'apply for', 'applying for', 'submit application', 'send application',
            'application requirements', 'what do i need', 'documents required',
            'application documents', 'how long', 'response time', 'feedback'
        ];
        
        return applicationKeywords.some(keyword => message.includes(keyword));
    }

    isSimpleResponse(message) {
        const simpleResponses = ['yes', 'no', 'yeah', 'yep', 'nope', 'ok', 'okay', 'sure', 'thanks', 'thank you'];
        return simpleResponses.some(response => message.trim() === response);
    }

    setConversationState(topic, question) {
        this.conversationState.lastTopic = topic;
        this.conversationState.lastQuestion = question;
    }

    setExpectingFollowUp(expecting) {
        this.conversationState.expectingFollowUp = expecting;
    }

    handleSimpleResponse(message) {
        if (this.conversationState.lastTopic) {
            return this.handleContextualResponse(message);
        }
        
        // If no context, treat as agreement to help
        if (['yes', 'yeah', 'yep', 'sure', 'ok', 'okay'].includes(message.trim())) {
            this.addBotMessage(`
                <p>Awesome! 🎉 I'm so excited to help you explore opportunities at Zeppelin Power Systems! What would you like to know about?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="window.chatbot.handleQuickOption('application')">Application Process</button>
                    <button class="option-btn" onclick="window.chatbot.handleQuickOption('jobs')">Available Jobs</button>
                    <button class="option-btn" onclick="window.chatbot.handleQuickOption('company')">Company Information</button>
                    <button class="option-btn" onclick="window.chatbot.handleQuickOption('benefits')">Benefits & Culture</button>
                </div>
            `);
            return;
        }
        
        if (['no', 'nope'].includes(message.trim())) {
            this.addBotMessage(`
                <p>No worries at all! 😊 If you change your mind or have any questions about Zeppelin Power Systems, I'm here for you!</p>
                <p>Feel free to ask me anything about jobs, applications, company culture, or benefits. I love helping people discover their next adventure! 🚁✨</p>
            `);
            return;
        }
        
        // Handle thanks
        if (['thanks', 'thank you'].includes(message.trim())) {
            this.addBotMessage(`
                <p>Aww, you're so welcome! 😊 It's my pleasure to help! Is there anything else I can do for you today?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="window.chatbot.handleQuickOption('jobs')">Browse Jobs</button>
                    <button class="option-btn" onclick="window.chatbot.askSpecific('contact recruiting team')">Contact Us</button>
                    <button class="option-btn" onclick="window.chatbot.resetToMainMenu()">Main Menu</button>
                </div>
            `);
            return;
        }
    }

    handleContextualResponse(message) {
        const isPositive = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay'].includes(message.trim());
        const isNegative = ['no', 'nope'].includes(message.trim());
        
        if (this.conversationState.lastTopic === 'jobs') {
            if (isPositive) {
                this.addBotMessage(`
                    <p>Excellent! Let me show you more job opportunities or help you with the application process.</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.askSpecific('show me more jobs')">Show More Jobs</button>
                        <button class="option-btn" onclick="window.chatbot.handleQuickOption('application')">Application Process</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('contact recruiting team')">Contact Recruiting</button>
                    </div>
                `);
            } else if (isNegative) {
                this.addBotMessage(`
                    <p>No problem! Let me help you with something else.</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.handleQuickOption('company')">Learn About Company</button>
                        <button class="option-btn" onclick="window.chatbot.handleQuickOption('benefits')">Benefits & Culture</button>
                        <button class="option-btn" onclick="window.chatbot.resetToMainMenu()">Main Menu</button>
                    </div>
                `);
            }
            return;
        }
        
        if (this.conversationState.lastTopic === 'company') {
            if (isPositive) {
                this.addBotMessage(`
                    <p>Great! What aspect of our company would you like to explore?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.askSpecific('company culture')">Company Culture</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What does Z COLOURFUL mean?')">Diversity (Z COLOURFUL)</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What is Z FIT?')">Wellness (Z FIT)</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('show me available jobs')">See Job Opportunities</button>
                    </div>
                `);
            } else if (isNegative) {
                this.addBotMessage(`
                    <p>That's fine! Would you like to explore job opportunities instead?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="chatbot.askSpecific('show me available jobs')">Browse Jobs</button>
                        <button class="option-btn" onclick="chatbot.handleQuickOption('benefits')">Benefits & Salary</button>
                        <button class="option-btn" onclick="chatbot.resetToMainMenu()">Main Menu</button>
                    </div>
                `);
            }
            return;
        }
        
        if (this.conversationState.lastTopic === 'contact') {
            if (isPositive) {
                this.addBotMessage(`
                    <p>Perfect! What would you like help with?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Application & documents</button>
                        <button class="option-btn" onclick="chatbot.askSpecific('show me available jobs')">Browse current jobs</button>
                        <button class="option-btn" onclick="chatbot.askSpecific('Can I send an unsolicited application?')">Unsolicited application</button>
                    </div>
                `);
            } else if (isNegative) {
                this.addBotMessage(`
                    <p>Alright! I'm here if you need any information. What can I help you with?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Job advertisements & requirements</button>
                        <button class="option-btn" onclick="chatbot.handleQuickOption('company')">Company & working time models</button>
                        <button class="option-btn" onclick="chatbot.resetToMainMenu()">Main menu</button>
                    </div>
                `);
            }
            return;
        }
        
        // Default contextual response
        if (isPositive) {
            this.addBotMessage(`
                <p>Great! Let me help you further. What would you like to know more about?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Job advertisements & requirements</button>
                    <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Application Process</button>
                    <button class="option-btn" onclick="chatbot.handleQuickOption('benefits')">Benefits & Culture</button>
                </div>
            `);
        } else if (isNegative) {
            this.addBotMessage(`
                <p>No problem! Is there something else I can help you with?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to Main Menu</button>
                    <button class="option-btn" onclick="chatbot.askSpecific('contact recruiting team')">Contact Us</button>
                </div>
            `);
        }
    }

    handleFollowUpResponse(message) {
        this.setExpectingFollowUp(false);
        this.processMessage(message); // Process the follow-up normally
    }

    findJobMatches(message) {
        // Step 1: Correct spelling mistakes
        const correctedQuery = this.correctSpelling(message);
        
        // Step 2: Extract search criteria from natural language
        const searchCriteria = this.extractSearchCriteria(correctedQuery);
        
        // Step 3: Filter and rank jobs
        const rankedJobs = this.searchAndRankJobs(searchCriteria);
        
        // Step 4: Return all matching jobs (pagination handled in display)
        return rankedJobs;
    }

    correctSpelling(query) {
        // Common spelling corrections for job search terms
        const spellCorrections = {
            // Job titles
            'sofware': 'software',
            'enginer': 'engineer',
            'engeneer': 'engineer',
            'enginere': 'engineer',
            'devloper': 'developer',
            'develper': 'developer',
            'maneger': 'manager',
            'managr': 'manager',
            'technicin': 'technician',
            'technican': 'technician',
            'specilist': 'specialist',
            'specalist': 'specialist',
            'markting': 'marketing',
            'marktng': 'marketing',
            'salse': 'sales',
            'slaes': 'sales',
            
            // Locations
            'berln': 'berlin',
            'berline': 'berlin',
            'hambrg': 'hamburg',
            'hambourg': 'hamburg',
            'munic': 'munich',
            'munchen': 'munich',
            'münchen': 'munich',
            'stutgart': 'stuttgart',
            'stuttgrt': 'stuttgart',
            'bremn': 'bremen',
            'bremem': 'bremen',
            
            // Skills and technologies
            'pythn': 'python',
            'pythno': 'python',
            'javascrpt': 'javascript',
            'javascritp': 'javascript',
            'javscript': 'javascript',
            'reactjs': 'react',
            'nodejs': 'node',
            'angulr': 'angular',
            'angualr': 'angular',
            
            // Experience levels
            'senor': 'senior',
            'senir': 'senior',
            'junor': 'junior',
            'juinor': 'junior',
            'experinced': 'experienced',
            'experianced': 'experienced',
            'fresher': 'entry level',
            'freshers': 'entry level',
            'beginer': 'beginner',
            'beginr': 'beginner',
            
            // Common words
            'loking': 'looking',
            'serch': 'search',
            'availble': 'available',
            'opportunty': 'opportunity',
            'postion': 'position',
            'requirments': 'requirements'
        };

        let correctedQuery = query.toLowerCase();
        
        // Apply spell corrections
        Object.keys(spellCorrections).forEach(misspelled => {
            const pattern = new RegExp(`\\b${misspelled}\\b`, 'gi');
            correctedQuery = correctedQuery.replace(pattern, spellCorrections[misspelled]);
        });

        return correctedQuery;
    }

    extractSearchCriteria(query) {
        const criteria = {
            jobTitles: [],
            skills: [],
            locations: [],
            experience: '',
            departments: [],
            jobTypes: [],
            keywords: []
        };

        // Enhanced synonym mapping
        const synonyms = {
            jobTitles: {
                'software engineer': ['software engineer', 'software developer', 'programmer', 'developer', 'software dev'],
                'electrical engineer': ['electrical engineer', 'electrical', 'power engineer', 'electronics engineer'],
                'hr business partner': ['hr business partner', 'hr partner', 'human resources partner', 'hr bp'],
                'marketing manager': ['marketing manager', 'marketing lead', 'marketing director'],
                'sales manager': ['sales manager', 'sales lead', 'sales director', 'business development'],
                'project manager': ['project manager', 'pm', 'project lead'],
                'data scientist': ['data scientist', 'data analyst', 'ml engineer', 'machine learning'],
                'technician': ['technician', 'tech', 'maintenance technician', 'field technician'],
                'quality engineer': ['quality engineer', 'qa engineer', 'quality assurance', 'test engineer'],
                'flight engineer': ['flight engineer', 'aviation engineer', 'aerospace engineer']
            },
            
            skills: {
                'python': ['python', 'py'],
                'javascript': ['javascript', 'js', 'node.js', 'nodejs'],
                'java': ['java'],
                'react': ['react', 'reactjs', 'react.js'],
                'angular': ['angular', 'angularjs'],
                'sql': ['sql', 'mysql', 'postgresql', 'database'],
                'aws': ['aws', 'amazon web services', 'cloud'],
                'docker': ['docker', 'containerization'],
                'kubernetes': ['kubernetes', 'k8s'],
                'machine learning': ['machine learning', 'ml', 'ai', 'artificial intelligence']
            },
            
            locations: {
                'berlin': ['berlin', 'berlín'],
                'hamburg': ['hamburg', 'hambourg'],
                'munich': ['munich', 'münchen', 'muenchen'],
                'stuttgart': ['stuttgart'],
                'bremen': ['bremen'],
                'frankfurt': ['frankfurt'],
                'cologne': ['cologne', 'köln', 'koeln'],
                'düsseldorf': ['düsseldorf', 'dusseldorf', 'duesseldorf']
            },
            
            experience: {
                'senior': ['senior', 'experienced', '5+ years', 'lead', 'principal'],
                'mid level': ['mid level', 'intermediate', '2-5 years', '3+ years'],
                'junior': ['junior', 'entry level', 'graduate', 'fresher', 'beginner', '0-2 years'],
                'intern': ['intern', 'internship', 'trainee']
            },
            
            departments: {
                'engineering': ['engineering', 'development', 'technical', 'software'],
                'human resources': ['human resources', 'hr', 'people'],
                'marketing': ['marketing', 'communications', 'digital marketing'],
                'sales': ['sales', 'business development', 'account management'],
                'production': ['production', 'manufacturing', 'operations'],
                'quality': ['quality', 'testing', 'qa', 'quality assurance'],
                'research': ['research', 'r&d', 'innovation']
            },
            
            jobTypes: {
                'full-time': ['full-time', 'fulltime', 'permanent', 'full time'],
                'part-time': ['part-time', 'parttime', 'part time'],
                'contract': ['contract', 'contractor', 'freelance'],
                'remote': ['remote', 'work from home', 'wfh', 'telecommute'],
                'hybrid': ['hybrid', 'flexible']
            }
        };

        // Extract criteria using enhanced matching
        Object.keys(synonyms).forEach(category => {
            Object.keys(synonyms[category]).forEach(key => {
                synonyms[category][key].forEach(synonym => {
                    if (query.toLowerCase().includes(synonym.toLowerCase())) {
                        switch(category) {
                            case 'jobTitles':
                                if (!criteria.jobTitles.includes(key)) {
                                    criteria.jobTitles.push(key);
                                }
                                break;
                            case 'skills':
                                if (!criteria.skills.includes(key)) {
                                    criteria.skills.push(key);
                                }
                                break;
                            case 'locations':
                                if (!criteria.locations.includes(key)) {
                                    criteria.locations.push(key);
                                }
                                break;
                            case 'experience':
                                criteria.experience = key;
                                break;
                            case 'departments':
                                if (!criteria.departments.includes(key)) {
                                    criteria.departments.push(key);
                                }
                                break;
                            case 'jobTypes':
                                if (!criteria.jobTypes.includes(key)) {
                                    criteria.jobTypes.push(key);
                                }
                                break;
                        }
                    }
                });
            });
        });

        // Remove duplicates
        Object.keys(criteria).forEach(key => {
            if (Array.isArray(criteria[key])) {
                criteria[key] = [...new Set(criteria[key])];
            }
        });

        // Extract additional keywords
        const words = query.split(/\s+/).filter(word => word.length > 2);
        criteria.keywords = words;

        return criteria;
    }

    searchAndRankJobs(criteria) {
        // Filter jobs based on criteria
        let filteredJobs = this.jobs.filter(job => this.matchesJobCriteria(job, criteria));
        
        // If no matches with strict criteria, try fuzzy matching
        if (filteredJobs.length === 0) {
            filteredJobs = this.jobs.filter(job => this.fuzzyMatchJob(job, criteria));
        }
        
        // Additional fallback for location-based searches
        if (filteredJobs.length === 0 && criteria.locations.length > 0) {
            filteredJobs = this.jobs.filter(job => 
                criteria.locations.some(location => 
                    job.location.toLowerCase().includes(location.toLowerCase()) ||
                    location.toLowerCase().includes(job.location.toLowerCase())
                )
            );
        }
        
        // Rank by relevance
        const rankedJobs = filteredJobs.map(job => ({
            ...job,
            relevanceScore: this.calculateRelevanceScore(job, criteria)
        }));
        
        // Sort by relevance score (highest first)
        rankedJobs.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        return rankedJobs;
    }

    // Debug function - can be called from console
    testLocationSearch(query) {
        console.log('=== Testing Location Search ===');
        console.log('Query:', query);
        const corrected = this.correctSpelling(query);
        console.log('Corrected:', corrected);
        const criteria = this.extractSearchCriteria(corrected);
        console.log('Criteria:', criteria);
        const results = this.searchAndRankJobs(criteria);
        console.log('Results:', results.length, results);
        return results;
    }

    matchesJobCriteria(job, criteria) {
        let matches = 0;
        let totalCriteria = 0;

        // Check job title
        if (criteria.jobTitles.length > 0) {
            totalCriteria++;
            if (criteria.jobTitles.some(title => 
                job.title.toLowerCase().includes(title) || 
                title.split(' ').every(word => job.title.toLowerCase().includes(word))
            )) {
                matches++;
            }
        }

        // Check location
        if (criteria.locations.length > 0) {
            totalCriteria++;
            if (criteria.locations.some(location => 
                job.location.toLowerCase() === location.toLowerCase()
            )) {
                matches++;
            }
        }

        // Check department
        if (criteria.departments.length > 0) {
            totalCriteria++;
            if (criteria.departments.some(dept => 
                job.department.toLowerCase().includes(dept.toLowerCase())
            )) {
                matches++;
            }
        }

        // Check job type
        if (criteria.jobTypes.length > 0) {
            totalCriteria++;
            if (criteria.jobTypes.some(type => 
                job.type.toLowerCase().includes(type.toLowerCase())
            )) {
                matches++;
            }
        }

        // Check skills in job description/requirements
        if (criteria.skills.length > 0) {
            totalCriteria++;
            const jobText = (job.description + ' ' + job.requirements.join(' ')).toLowerCase();
            if (criteria.skills.some(skill => jobText.includes(skill))) {
                matches++;
            }
        }

        // Check keywords
        if (criteria.keywords.length > 0) {
            totalCriteria++;
            const jobText = (job.title + ' ' + job.description + ' ' + job.requirements.join(' ')).toLowerCase();
            if (criteria.keywords.some(keyword => jobText.includes(keyword))) {
                matches++;
            }
        }

        // Return true if at least 50% of criteria match, or if no specific criteria (general search)
        return totalCriteria === 0 || (matches / totalCriteria) >= 0.5;
    }

    fuzzyMatchJob(job, criteria) {
        // More lenient matching for when strict criteria don't work
        const jobText = (job.title + ' ' + job.description + ' ' + job.department + ' ' + job.location + ' ' + job.requirements.join(' ')).toLowerCase();
        
        // Check if any of the search terms appear in the job
        const allTerms = [
            ...criteria.jobTitles,
            ...criteria.skills,
            ...criteria.locations,
            ...criteria.departments,
            ...criteria.jobTypes,
            ...criteria.keywords
        ];

        // Also check for direct location matching as a fallback
        const hasLocationMatch = criteria.locations.length > 0 && 
            criteria.locations.some(location => 
                job.location.toLowerCase().includes(location.toLowerCase())
            );

        return hasLocationMatch || allTerms.some(term => jobText.includes(term.toLowerCase()));
    }

    calculateRelevanceScore(job, criteria) {
        let score = 0;
        
        // Job title relevance (highest weight)
        if (criteria.jobTitles.length > 0) {
            criteria.jobTitles.forEach(title => {
                if (job.title.toLowerCase() === title.toLowerCase()) {
                    score += 100; // Exact match
                } else if (job.title.toLowerCase().includes(title)) {
                    score += 75; // Partial match
                } else if (title.split(' ').some(word => job.title.toLowerCase().includes(word))) {
                    score += 50; // Word match
                }
            });
        }

        // Location relevance
        if (criteria.locations.length > 0) {
            criteria.locations.forEach(location => {
                if (job.location.toLowerCase() === location.toLowerCase()) {
                    score += 50;
                }
            });
        }

        // Department relevance
        if (criteria.departments.length > 0) {
            criteria.departments.forEach(dept => {
                if (job.department.toLowerCase().includes(dept.toLowerCase())) {
                    score += 30;
                }
            });
        }

        // Skills relevance
        if (criteria.skills.length > 0) {
            const jobText = (job.description + ' ' + job.requirements.join(' ')).toLowerCase();
            criteria.skills.forEach(skill => {
                if (jobText.includes(skill)) {
                    score += 25;
                }
            });
        }

        // Job type relevance
        if (criteria.jobTypes.length > 0) {
            criteria.jobTypes.forEach(type => {
                if (job.type.toLowerCase().includes(type.toLowerCase())) {
                    score += 20;
                }
            });
        }

        // Keyword relevance
        if (criteria.keywords.length > 0) {
            const jobText = (job.title + ' ' + job.description + ' ' + job.requirements.join(' ')).toLowerCase();
            criteria.keywords.forEach(keyword => {
                const occurrences = (jobText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
                score += occurrences * 5;
            });
        }

        return score;
    }

    parseJobFilters(message, synonyms) {
        const filters = {
            locations: [],
            jobTypes: [],
            departments: [],
            hasSpecificCriteria: false
        };

        // Check for location matches
        Object.keys(synonyms.locations).forEach(location => {
            synonyms.locations[location].forEach(synonym => {
                if (message.includes(synonym.toLowerCase())) {
                    filters.locations.push(location);
                    filters.hasSpecificCriteria = true;
                }
            });
        });

        // Check for job type matches
        Object.keys(synonyms.jobTypes).forEach(jobType => {
            synonyms.jobTypes[jobType].forEach(synonym => {
                if (message.includes(synonym.toLowerCase())) {
                    filters.jobTypes.push(jobType);
                    filters.hasSpecificCriteria = true;
                }
            });
        });

        // Check for department matches
        Object.keys(synonyms.departments).forEach(department => {
            synonyms.departments[department].forEach(synonym => {
                if (message.includes(synonym.toLowerCase())) {
                    filters.departments.push(department);
                    filters.hasSpecificCriteria = true;
                }
            });
        });

        // Remove duplicates
        filters.locations = [...new Set(filters.locations)];
        filters.jobTypes = [...new Set(filters.jobTypes)];
        filters.departments = [...new Set(filters.departments)];

        return filters;
    }

    filterJobs(filters) {
        let filteredJobs = [...this.jobs];

        // Filter by location
        if (filters.locations.length > 0) {
            filteredJobs = filteredJobs.filter(job => 
                filters.locations.some(location => 
                    job.location.toLowerCase() === location.toLowerCase()
                )
            );
        }

        // Filter by job type (check title and keywords)
        if (filters.jobTypes.length > 0) {
            filteredJobs = filteredJobs.filter(job => {
                const jobTitle = job.title.toLowerCase();
                const jobKeywords = job.keywords.map(k => k.toLowerCase());
                
                return filters.jobTypes.some(jobType => {
                    // Check if job type matches title or keywords
                    return jobTitle.includes(jobType) || 
                           jobKeywords.some(keyword => keyword.includes(jobType)) ||
                           jobKeywords.some(keyword => jobType.includes(keyword));
                });
            });
        }

        // Filter by department
        if (filters.departments.length > 0) {
            filteredJobs = filteredJobs.filter(job => 
                filters.departments.some(dept => 
                    job.department.toLowerCase().includes(dept.toLowerCase())
                )
            );
        }

        // Score and sort remaining jobs for relevance
        const scoredJobs = filteredJobs.map(job => ({
            job,
            score: this.calculateJobRelevanceScore(job, filters)
        }));

        return scoredJobs
            .sort((a, b) => b.score - a.score)
            .map(item => item.job);
    }

    calculateJobRelevanceScore(job, filters) {
        let score = 0;
        
        // Higher score for exact location matches
        if (filters.locations.length > 0) {
            if (filters.locations.includes(job.location.toLowerCase())) {
                score += 10;
            }
        }
        
        // Score for job type matches
        if (filters.jobTypes.length > 0) {
            const jobTitle = job.title.toLowerCase();
            filters.jobTypes.forEach(jobType => {
                if (jobTitle.includes(jobType)) {
                    score += 8;
                }
                // Check keywords
                job.keywords.forEach(keyword => {
                    if (keyword.toLowerCase().includes(jobType)) {
                        score += 5;
                    }
                });
            });
        }
        
        // Score for department matches
        if (filters.departments.length > 0) {
            filters.departments.forEach(dept => {
                if (job.department.toLowerCase().includes(dept)) {
                    score += 6;
                }
            });
        }
        
        return score;
    }

    findFAQMatches(message) {
        const matches = [];
        
        this.faqs.forEach(faq => {
            let score = 0;
            
            // Check keywords with higher weight for multi-word exact matches
            faq.keywords.forEach(keyword => {
                const lowerKeyword = keyword.toLowerCase();
                if (message.includes(lowerKeyword)) {
                    // Give higher score for longer, more specific keywords
                    if (lowerKeyword.split(' ').length > 1) {
                        score += 5; // Multi-word keywords get higher priority
                    } else {
                        score += 2; // Single word keywords
                    }
                }
            });
            
            // Check question content (reduced weight)
            const questionWords = faq.question.toLowerCase().split(' ');
            questionWords.forEach(word => {
                if (word.length > 3 && message.includes(word)) {
                    score += 0.5; // Reduced weight for question word matches
                }
            });
            
            if (score > 2) { // Only include matches with meaningful scores
                matches.push({ faq, score });
            }
        });
        
        return matches
            .sort((a, b) => b.score - a.score)
            .map(match => match.faq);
    }

    findCompanyInfo(message) {
        const companyKeywords = this.handbook.keywords || [];
        let hasCompanyKeyword = false;
        
        companyKeywords.forEach(keyword => {
            if (message.includes(keyword.toLowerCase())) {
                hasCompanyKeyword = true;
            }
        });
        
        // Also trigger for specific queries even without general company keywords
        const specificQueries = ['location', 'office', 'culture', 'environment', 'mission', 'vision', 'values'];
        const hasSpecificQuery = specificQueries.some(query => message.includes(query));
        
        if (!hasCompanyKeyword && !hasSpecificQuery) return null;
        
        // Check what specific info they want
        if (message.includes('mission')) {
            return `<p><strong>Our Mission:</strong> ${this.handbook.mission}</p>`;
        }
        
        if (message.includes('vision')) {
            return `<p><strong>Our Vision:</strong> ${this.handbook.vision}</p>`;
        }
        
        if (message.includes('values')) {
            const valuesList = this.handbook.values.map(value => `<li>${value}</li>`).join('');
            return `<p><strong>Our Values:</strong></p><ul>${valuesList}</ul>`;
        }
        
        if (message.includes('culture') || message.includes('environment')) {
            return `
                <p><strong>Company Culture at Zeppelin Power Systems:</strong></p>
                <p><strong>Work Environment:</strong> ${this.handbook.culture.work_environment}</p>
                <p><strong>Team Spirit:</strong> ${this.handbook.culture.team_spirit}</p>
                <p><strong>Growth Opportunities:</strong> ${this.handbook.culture.growth_opportunities}</p>
                <p><strong>Work-Life Balance:</strong> ${this.handbook.culture.work_life_balance}</p>
            `;
        }
        
        if (message.includes('location') || message.includes('office') || message.includes('where') || 
            message.includes('addresses') || message.includes('branches') || message.includes('sites')) {
            const locationsList = this.handbook.locations
                .map(loc => `<li><strong>${loc.city}</strong> - ${loc.type}: ${loc.focus}</li>`)
                .join('');
            return `<p><strong>Our Locations:</strong></p><ul>${locationsList}</ul>`;
        }
        
        // General company info
        return `
            <p><strong>About Zeppelin Power Systems:</strong></p>
            <p>${this.handbook.description}</p>
            <p><strong>Founded:</strong> ${this.handbook.founded}</p>
            <p><strong>Headquarters:</strong> ${this.handbook.headquarters}</p>
            <p><strong>Mission:</strong> ${this.handbook.mission}</p>
        `;
    }

    respondWithJobs(jobs, showAll = false, isSearchResult = false) {
        if (jobs.length === 0) {
            // This should be handled by respondWithNoJobs now
            return;
        }
        
        // Reset pagination for new job set
        if (!showAll) {
            this.currentJobSet = jobs;
            this.currentJobPage = 0;
        }

        if (jobs.length === 1) {
            const jobCard = isSearchResult ? this.formatSearchResultCard(jobs[0]) : this.formatJobCard(jobs[0]);
            this.addBotMessage(`
                <p>Great news! 🎉 I found 1 perfect position for you:</p>
                ${jobCard}
                <p>This looks like an exciting opportunity! Would you like me to tell you more about the application process or show you similar positions? I'm here to help! ✨</p>
                <p>What would you like to do next?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Learn about applying</button>
                    <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Search more jobs</button>
                    <button class="option-btn" onclick="chatbot.askSpecific('contact recruiting team')">Contact recruiting</button>
                    <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to main menu</button>
                </div>
            `);
        } else {
            const displayJobs = showAll ? jobs : jobs.slice(0, 4);
            const jobCards = displayJobs.map(job => 
                isSearchResult ? this.formatSearchResultCard(job) : this.formatJobCard(job)
            ).join('');
            
            let viewMoreButton = '';
            if (!showAll && jobs.length > 4) {
                const remainingJobs = jobs.length - 4;
                viewMoreButton = `
                    <div class="view-more-container">
                        <button class="view-more-btn" onclick="window.chatbot.showMoreJobs()">
                            View ${Math.min(4, remainingJobs)} More Jobs (${remainingJobs} remaining)
                        </button>
                    </div>
                `;
            }
            
            this.addBotMessage(`
                <p>Fantastic! 🚀 I found ${jobs.length} amazing positions that match what you're looking for:</p>
                ${jobCards}
                ${viewMoreButton}
                <p>Wow, so many great opportunities! 😊 Do any of these catch your eye? I'd love to help you learn more about them or guide you through the application process!</p>
                <p>What would you like to do next?</p>
                <div class="quick-options">
                    <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Learn about applying</button>
                    <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Search more jobs</button>
                    <button class="option-btn" onclick="chatbot.askSpecific('contact recruiting team')">Contact recruiting</button>
                    <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to main menu</button>
                </div>
            `);
        }
    }

    respondWithFAQ(faq) {
        this.addBotMessage(`
            <p><strong>Q: ${faq.question}</strong></p>
            <p>${faq.answer}</p>
            <br>
            <p>I hope I was able to help you! Would you like to:</p>
            <div class="quick-options">
                <button class="option-btn" onclick="window.chatbot.handleQuickOption('application')">Ask about applications</button>
                <button class="option-btn" onclick="window.chatbot.handleQuickOption('jobs')">See available jobs</button>
                <button class="option-btn" onclick="window.chatbot.askSpecific('contact recruiting team')">Get in touch with recruiting</button>
                <button class="option-btn" onclick="window.chatbot.resetToMainMenu()">Back to main menu</button>
            </div>
        `);
        // Don't set expectingFollowUp since we already included the options
    }

    formatJobCard(job) {
        return `
            <div class="job-card">
                <h3>${job.title}</h3>
                <div class="job-location">📍 ${job.location}</div>
                <div class="job-type">🏢 ${job.type}</div>
                <div class="job-actions">
                    <button class="view-details-btn large" onclick="window.chatbot.showJobDetails(${job.id})">View Details</button>
                </div>
            </div>
        `;
    }

    formatSearchResultCard(job) {
        const company = "Zeppelin Power Systems"; // Since all jobs are from this company
        
        return `
            <div class="job-card search-result">
                <h3>${job.title}</h3>
                <div class="job-meta-info">
                    <div class="job-company">🏢 ${company}</div>
                    <div class="job-location">📍 ${job.location}</div>
                    <div class="job-type">⏰ ${job.type}</div>
                </div>
                <div class="job-actions">
                    <button class="view-details-btn large" onclick="window.chatbot.showJobDetails(${job.id})">View Details</button>
                </div>
            </div>
        `;
    }

    extractExperienceLevel(job) {
        const requirements = job.requirements.join(' ').toLowerCase();
        
        // Check for specific experience mentions
        if (requirements.includes('5+ years') || requirements.includes('senior') || requirements.includes('lead') || requirements.includes('principal')) {
            return 'Senior Level';
        } else if (requirements.includes('3+ years') || requirements.includes('3-5 years') || requirements.includes('mid level')) {
            return 'Mid Level';
        } else if (requirements.includes('entry level') || requirements.includes('junior') || requirements.includes('graduate') || requirements.includes('0-2 years')) {
            return 'Entry Level';
        } else if (requirements.includes('intern') || requirements.includes('trainee')) {
            return 'Internship';
        } else if (requirements.includes('master') || requirements.includes('bachelor') || requirements.includes('degree')) {
            return 'Graduate Level';
        } else {
            return 'All Levels';
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    scrollToNewMessage(messageElement) {
        // Add a small delay to ensure the message is fully rendered
        setTimeout(() => {
            if (messageElement) {
                // Scroll to the new message smoothly
                messageElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start', // Align to the top of the message
                    inline: 'nearest'
                });
                
                // Alternative: Use container scroll for more control
                // const messageTop = messageElement.offsetTop;
                // const containerHeight = this.chatMessages.clientHeight;
                // const targetScroll = messageTop - 50; // 50px padding from top
                // this.chatMessages.scrollTo({
                //     top: targetScroll,
                //     behavior: 'smooth'
                // });
            }
        }, 100); // Small delay to ensure content is rendered
    }

    // Enhanced scroll function for specific content within messages
    scrollToElement(elementId) {
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, 150);
    }

    handleQuickOption(option) {
        // Reset conversation state when using quick options
        this.conversationState = {
            lastTopic: option,
            lastQuestion: null,
            expectingFollowUp: false,
            context: {}
        };
        
        // Add user message showing their choice
        this.addUserMessage(this.getOptionDisplayText(option));
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Respond based on option after delay
        setTimeout(() => {
            this.hideTypingIndicator();
            this.respondToQuickOption(option);
        }, 1000 + Math.random() * 1000);
    }

    getOptionDisplayText(option) {
        const optionTexts = {
            'application': 'Application & documents',
            'jobs': 'Job advertisements & requirements',
            'company': 'Company & working time models',
            'career': 'Career & development',
            'benefits': 'Benefits & corporate culture',
            'other': 'Ask something else'
        };
        return optionTexts[option] || option;
    }

    respondToQuickOption(option) {
        switch(option) {
            case 'application':
                this.addBotMessage(`
                    <p>You want to know more about the application - what exactly is it about?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What do I need to submit?')">What do I need to submit?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('How does the process work?')">How does the process work?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('Can I send an unsolicited application?')">Can I send an unsolicited application?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('Can I change my application?')">Can I change my application?</button>
                    </div>
                `);
                break;
                
            case 'jobs':
                this.addBotMessage(`
                    <p>Are you interested in a specific position?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.askSpecific('Where can I find the requirements?')">Where can I find the requirements?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('I don\\'t meet all requirements - should I apply anyway?')">I don't meet all requirements - should I apply anyway?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('Is the position suitable for young professionals?')">Is the position suitable for young professionals?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('show me available jobs')">Show me available jobs</button>
                    </div>
                `);
                break;
                
            case 'company':
                this.addBotMessage(`
                    <p>What would you like to know about Zeppelin Power Systems?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What exactly do you do?')">What exactly do you do?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What are the working hours like?')">What are the working hours like?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('Do you work from home?')">Do you work from home?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('company locations')">Office locations</button>
                    </div>
                `);
                break;
                
            case 'career':
                this.addBotMessage(`
                    <p>You want to develop yourself further - here are our offers:</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What further training opportunities are there?')">What further training opportunities are there?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('Are there internal training courses?')">Are there internal training courses?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('How safe is my job?')">How safe is my job?</button>
                    </div>
                `);
                break;
                
            case 'benefits':
                this.addBotMessage(`
                    <p>Our benefits and values - what interests you?</p>
                    <div class="quick-options">
                        <button class="option-btn" onclick="window.chatbot.askSpecific('How many vacation days do I have?')">How many vacation days do I have?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('Is there a job ticket?')">Is there a job ticket?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What is Z FIT?')">What is Z FIT?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What does Z COLOURFUL mean?')">What does Z COLOURFUL mean?</button>
                        <button class="option-btn" onclick="window.chatbot.askSpecific('What do you do for sustainability?')">What do you do for sustainability?</button>
                    </div>
                `);
                break;
                
            case 'other':
                this.addBotMessage(`
                    <p>Feel free to ask me your question - I'll try to help or pass you on. If I can't answer, you can always contact our recruiting team.</p>
                `);
                break;
        }
    }

    askSpecific(question) {
        // Handle special cases
        if (question === 'show me all available jobs' || question === 'show me available jobs') {
            this.addUserMessage('Show me all available jobs');
            this.showTypingIndicator();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.setConversationState('jobs', 'all_jobs');
                this.respondWithJobs(this.jobs);
            }, 1000);
            return;
        }
        
        if (question === 'jobs in other locations') {
            this.addUserMessage('What jobs are available in other locations?');
            this.showTypingIndicator();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.showLocationBasedJobs();
            }, 1000);
            return;
        }
        
        // Add the question as user message and process it normally
        this.addUserMessage(question);
        this.showTypingIndicator();
        
        // Check if this is a FAQ question
        const lowerQuestion = question.toLowerCase();
        const isFAQQuestion = this.findFAQMatches(lowerQuestion).length > 0;
        
        setTimeout(() => {
            this.hideTypingIndicator();
            this.processMessage(question);
            
            // Only add follow-up options if it's NOT a FAQ question (since FAQs already include them)
            if (!isFAQQuestion) {
                setTimeout(() => {
                    this.addFollowUpOptions();
                }, 1000);
            }
        }, 1000 + Math.random() * 1000);
    }

    showLocationBasedJobs() {
        // Group jobs by location
        const jobsByLocation = {};
        this.jobs.forEach(job => {
            if (!jobsByLocation[job.location]) {
                jobsByLocation[job.location] = [];
            }
            jobsByLocation[job.location].push(job);
        });
        
        let response = '<p>Here are our available positions by location:</p>';
        
        Object.keys(jobsByLocation).forEach(location => {
            const jobs = jobsByLocation[location];
            response += `
                <div class="location-section">
                    <h3>🏢 ${location} (${jobs.length} positions)</h3>
                    <div class="location-jobs">
            `;
            
            jobs.forEach(job => {
                response += `
                    <div class="mini-job-card">
                        <strong>${job.title}</strong>
                        <div class="mini-job-location">📍 ${job.location}</div>
                        <div class="mini-job-type">🏢 ${job.type}</div>
                        <div class="mini-job-actions">
                            <button class="mini-apply-btn" onclick="window.chatbot.showJobDetails(${job.id})">View Details</button>
                        </div>
                    </div>
                `;
            });
            
            response += `
                    </div>
                </div>
            `;
        });
        
        response += `
            <p>Would you like more details about any specific position or location?</p>
        `;
        
        this.addBotMessage(response);
        this.setExpectingFollowUp(true);
    }

    addFollowUpOptions() {
        this.addBotMessage(`
            <p>I hope I was able to help you! Would you like to apply now or find out more?</p>
            <div class="quick-options">
                <button class="option-btn" onclick="chatbot.askSpecific('show me available jobs')">Apply now</button>
                <button class="option-btn" onclick="chatbot.resetToMainMenu()">Ask more questions</button>
                <button class="option-btn" onclick="chatbot.askSpecific('contact recruiting team')">Get in touch</button>
            </div>
        `);
    }

    addCompanyInfoOptions() {
        this.addBotMessage(`
            <p>Would you like to know more about our company, or are you interested in exploring opportunities?</p>
            <div class="quick-options">
                <button class="option-btn" onclick="chatbot.handleQuickOption('company')">More company info</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">See available jobs</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('benefits')">Benefits & culture</button>
                <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to main menu</button>
            </div>
        `);
    }

    addContactOptions() {
        this.addBotMessage(`
            <p>Would you like to apply for a position, or do you have more questions?</p>
            <div class="quick-options">
                <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Apply for positions</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Application questions</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('company')">Company information</button>
                <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to main menu</button>
            </div>
        `);
    }

    addJobSearchOptions() {
        this.addBotMessage(`
            <p>What would you like to do next?</p>
            <div class="quick-options">
                <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Learn about applying</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Search more jobs</button>
                <button class="option-btn" onclick="chatbot.askSpecific('contact recruiting team')">Contact recruiting</button>
                <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to main menu</button>
            </div>
        `);
    }

    resetToMainMenu() {
        this.addBotMessage(`
            <p>Hello and welcome back! What are you interested in right now?</p>
            <div class="quick-options">
                <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Application & documents</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Job advertisements & requirements</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('company')">Company & working time models</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('career')">Career & development</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('benefits')">Benefits & corporate culture</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('other')">Ask something else</button>
            </div>
        `);
    }

    showJobDetails(jobId) {
        console.log('showJobDetails called with jobId:', jobId);
        console.log('Screen width:', window.innerWidth);
        const job = this.jobs.find(j => j.id === jobId);
        console.log('Found job:', job);
        if (!job) {
            console.error('Job not found for ID:', jobId);
            return;
        }

        const requirements = job.requirements.map(req => `<li>${req}</li>`).join('');
        
        const popup = `
            <div class="job-popup-overlay" id="jobPopup">
                <div class="job-popup-content" onclick="event.stopPropagation()">
                    <div class="popup-header">
                        <h2>${job.title}</h2>
                        <button class="close-btn" onclick="window.chatbot.closePopup()">×</button>
                    </div>
                    <div class="popup-body">
                        <div class="job-meta">
                            <div class="meta-item">
                                <strong>📍 Location:</strong> ${job.location}
                            </div>
                            <div class="meta-item">
                                <strong>🏢 Department:</strong> ${job.department}
                            </div>
                            <div class="meta-item">
                                <strong>⏰ Type:</strong> ${job.type}
                            </div>
                            <div class="meta-item">
                                <strong>💰 Salary:</strong> ${job.salary}
                            </div>
                        </div>
                        
                        <div class="job-section">
                            <h3>Job Description</h3>
                            <p>${job.description}</p>
                        </div>
                        
                        <div class="job-section">
                            <h3>Requirements</h3>
                            <ul>${requirements}</ul>
                        </div>
                        
                        <div class="job-section">
                            <h3>What We Offer</h3>
                            <ul>
                                <li>30 days paid vacation</li>
                                <li>Flexible working hours with flexitime</li>
                                <li>Mobile and remote work options</li>
                                <li>Capital-forming benefits and company pension</li>
                                <li>Z FIT wellness program with company bikes</li>
                                <li>Z COLOURFUL diversity and inclusion initiatives</li>
                                <li>Extensive training and development opportunities</li>
                                <li>Permanent employment contract</li>
                            </ul>
                        </div>
                    </div>
                    <div class="popup-footer">
                        <button class="apply-btn" onclick="window.chatbot.closePopup()">Close</button>
                        <button class="apply-btn primary" onclick="window.chatbot.showApplicationForm(${job.id})">Apply for This Position</button>
                    </div>
                </div>
            </div>
        `;
        
        console.log('Creating popup HTML...');
        document.body.insertAdjacentHTML('beforeend', popup);
        console.log('Popup added to DOM');
    }

    showApplicationForm(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        // Close any existing popup first
        this.closePopup();

        const popup = `
            <div class="job-popup-overlay" id="applicationPopup">
                <div class="application-popup-content" onclick="event.stopPropagation()">
                    <div class="popup-header">
                        <h2>Apply for ${job.title}</h2>
                        <button class="close-btn" onclick="window.chatbot.closePopup()">×</button>
                    </div>
                    <div class="popup-body">
                        <div class="application-info">
                            <h3>Application Process</h3>
                            <p>To apply for this position at Zeppelin Power Systems:</p>
                            
                            <div class="process-steps">
                                <div class="step">
                                    <strong>1. Required Documents:</strong>
                                    <ul>
                                        <li>✅ CV/Resume (mandatory)</li>
                                        <li>📄 Cover letter (optional)</li>
                                        <li>📋 References (optional)</li>
                                    </ul>
                                </div>
                                
                                <div class="step">
                                    <strong>2. Application Method:</strong>
                                    <p>Please apply online via our application portal</p>
                                </div>
                                
                                <div class="step">
                                    <strong>3. Response Time:</strong>
                                    <p>You will receive initial feedback within 7 days</p>
                                </div>
                                
                                <div class="step">
                                    <strong>4. Interview Process:</strong>
                                    <p>Initial interview followed by further steps depending on the position</p>
                                </div>
                            </div>
                            
                            <div class="contact-info">
                                <h4>Need Help?</h4>
                                <p>Contact our recruiting team:</p>
                                <ul>
                                    <li>📧 careers@zeppelin-power.com</li>
                                    <li>📞 +49 40 123-4567</li>
                                    <li>🕒 Monday-Friday, 9:00 AM - 5:00 PM CET</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="popup-footer">
                        <button class="apply-btn" onclick="window.chatbot.closePopup()">Close</button>
                        <button class="apply-btn primary" onclick="window.chatbot.openApplicationPortal('${job.title}')">Go to Application Portal</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', popup);
    }

    openApplicationPortal(jobTitle) {
        this.closePopup();
        this.addBotMessage(`
            <p>Great! You're interested in applying for <strong>${jobTitle}</strong>.</p>
            <p>You will now be redirected to our application portal where you can submit your application.</p>
            <p>Do you have any other questions about the application process or our company?</p>
            <p>What would you like to do next?</p>
            <div class="quick-options">
                <button class="option-btn" onclick="chatbot.handleQuickOption('application')">Learn about applying</button>
                <button class="option-btn" onclick="chatbot.handleQuickOption('jobs')">Search more jobs</button>
                <button class="option-btn" onclick="chatbot.askSpecific('contact recruiting team')">Contact recruiting</button>
                <button class="option-btn" onclick="chatbot.resetToMainMenu()">Back to main menu</button>
            </div>
        `);
    }

    closePopup() {
        console.log('closePopup called');
        const popups = document.querySelectorAll('.job-popup-overlay');
        console.log('Found popups to close:', popups.length);
        popups.forEach(popup => popup.remove());
    }

    isJobSearchQuery(message) {
        // Check if the message is clearly asking for job listings
        const jobSearchKeywords = [
            'jobs', 'positions', 'vacancies', 'openings', 'roles', 'careers',
            'job in', 'position in', 'work in', 'employment in',
            'engineer', 'developer', 'manager', 'technician', 'specialist',
            'berlin', 'hamburg', 'munich', 'bremen', 'stuttgart',
            'engineering', 'production', 'marketing', 'hr', 'testing'
        ];
        
        return jobSearchKeywords.some(keyword => message.includes(keyword));
    }

    respondWithNoJobs(originalMessage) {
        // Provide the requested friendly message
        let response = `<p>No jobs found matching your search. Try checking your spelling or broadening your criteria. 😊</p>`;
        
        // Extract what they were looking for to provide helpful suggestions
        const searchTerms = this.extractSearchTerms(originalMessage);
        
        if (searchTerms.locations.length > 0 || searchTerms.jobTypes.length > 0) {
            response += `<p>I searched for`;
            
            if (searchTerms.jobTypes.length > 0) {
                response += ` <strong>${searchTerms.jobTypes.join(', ')}</strong>`;
            }
            
            if (searchTerms.locations.length > 0) {
                response += ` in <strong>${searchTerms.locations.join(', ')}</strong>`;
            }
            
            response += ` but couldn't find exact matches.</p>`;
        }
        
        // Suggest alternatives
        response += `
            <p>Here are some suggestions to help you find opportunities:</p>
            <div class="quick-options">
                <button class="option-btn" onclick="chatbot.askSpecific('show me all available jobs')">View All Jobs</button>
                <button class="option-btn" onclick="chatbot.askSpecific('jobs in other locations')">Different Locations</button>
                <button class="option-btn" onclick="chatbot.askSpecific('similar positions')">Similar Positions</button>
            </div>
        `;
        
        // Show available options
        const availableLocations = [...new Set(this.jobs.map(job => job.location))];
        const availableDepartments = [...new Set(this.jobs.map(job => job.department))];
        
        response += `
            <p><strong>📍 We have positions in:</strong> ${availableLocations.join(', ')}</p>
            <p><strong>🏢 Available departments:</strong> ${availableDepartments.join(', ')}</p>
            <p>Try searching with different keywords or ask me about specific roles! 🚀</p>
        `;
        
        this.addBotMessage(response);
        this.setExpectingFollowUp(true);
    }

    extractSearchTerms(message) {
        const synonyms = {
            locations: {
                'berlin': ['berlin', 'berlín'],
                'hamburg': ['hamburg', 'hambourg'],
                'munich': ['munich', 'münchen', 'muenchen'],
                'stuttgart': ['stuttgart'],
                'bremen': ['bremen'],
                'frankfurt': ['frankfurt'],
                'cologne': ['cologne', 'köln', 'koeln'],
                'düsseldorf': ['düsseldorf', 'dusseldorf', 'duesseldorf']
            },
            jobTypes: {
                'engineer': ['engineer', 'engineering', 'technical', 'dev', 'developer'],
                'software': ['software', 'programming', 'coding', 'development'],
                'manager': ['manager', 'management', 'lead'],
                'technician': ['technician', 'tech'],
                'specialist': ['specialist', 'expert'],
                'hr': ['hr', 'human resources', 'people'],
                'marketing': ['marketing', 'promotion'],
                'flight': ['flight', 'aviation', 'aerospace']
            }
        };
        
        const terms = {
            locations: [],
            jobTypes: []
        };
        
        // Extract locations
        Object.keys(synonyms.locations).forEach(location => {
            synonyms.locations[location].forEach(synonym => {
                if (message.includes(synonym.toLowerCase())) {
                    terms.locations.push(location.charAt(0).toUpperCase() + location.slice(1));
                }
            });
        });
        
        // Extract job types
        Object.keys(synonyms.jobTypes).forEach(jobType => {
            synonyms.jobTypes[jobType].forEach(synonym => {
                if (message.includes(synonym.toLowerCase())) {
                    terms.jobTypes.push(jobType.charAt(0).toUpperCase() + jobType.slice(1));
                }
            });
        });
        
        // Remove duplicates
        terms.locations = [...new Set(terms.locations)];
        terms.jobTypes = [...new Set(terms.jobTypes)];
        
        return terms;
    }

    // Function to set Zeppy's image using data URI
    setZeppyImage(imageDataURI) {
        const zeppyImage = document.querySelector('.zeppy-image');
        if (zeppyImage && imageDataURI) {
            zeppyImage.src = imageDataURI;
            zeppyImage.style.display = 'block';
            zeppyImage.nextElementSibling.style.display = 'none';
        }
    }

    showMoreJobs() {
        if (this.currentJobSet.length === 0) return;
        
        this.currentJobPage++;
        const startIndex = this.currentJobPage * 4;
        const endIndex = startIndex + 4;
        const nextJobs = this.currentJobSet.slice(startIndex, endIndex);
        
        if (nextJobs.length === 0) return;
        
        const jobCards = nextJobs.map(job => this.formatJobCard(job)).join('');
        const remainingJobs = this.currentJobSet.length - (this.currentJobPage + 1) * 4;
        
        let viewMoreButton = '';
        if (remainingJobs > 0) {
            viewMoreButton = `
                <div class="view-more-container">
                    <button class="view-more-btn" onclick="window.chatbot.showMoreJobs()">
                        View ${Math.min(4, remainingJobs)} More Jobs (${remainingJobs} remaining)
                    </button>
                </div>
            `;
        }

        // Add a unique ID to the new jobs message for precise scrolling
        const messageId = `new-jobs-${Date.now()}`;
        this.addBotMessage(`
            <div id="${messageId}">
                <p>Here are the next ${nextJobs.length} positions:</p>
                ${jobCards}
                ${viewMoreButton}
                ${remainingJobs === 0 ? '<p>That\'s all the available positions! 🎉 Any of these look interesting to you?</p>' : ''}
            </div>
        `);
        
        // Scroll specifically to the new jobs section
        setTimeout(() => {
            const newJobsElement = document.getElementById(messageId);
            if (newJobsElement) {
                newJobsElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, 150);
    }

    showAllJobs(jobIds) {
        const jobs = jobIds.map(id => this.jobs.find(j => j.id === id)).filter(Boolean);
        this.respondWithJobs(jobs, true);
    }

    showJobDetailsAndApply(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        const requirements = job.requirements.map(req => `<li>${req}</li>`).join('');
        
        const popup = `
            <div class="job-popup-overlay" id="jobDetailsApplyPopup" onclick="window.chatbot.closePopup()">
                <div class="job-popup-content" onclick="event.stopPropagation()">
                    <div class="popup-header">
                        <h2>${job.title}</h2>
                        <button class="close-btn" onclick="window.chatbot.closePopup()">×</button>
                    </div>
                    <div class="popup-body">
                        <div class="job-meta">
                            <div class="meta-item">
                                <strong>📍 Location:</strong> ${job.location}
                            </div>
                            <div class="meta-item">
                                <strong>🏢 Department:</strong> ${job.department}
                            </div>
                            <div class="meta-item">
                                <strong>⏰ Type:</strong> ${job.type}
                            </div>
                            <div class="meta-item">
                                <strong>💰 Salary:</strong> ${job.salary}
                            </div>
                        </div>
                        
                        <div class="job-section">
                            <h3>Job Description</h3>
                            <p>${job.description}</p>
                        </div>
                        
                        <div class="job-section">
                            <h3>Requirements</h3>
                            <ul>${requirements}</ul>
                        </div>
                        
                        <div class="job-section">
                            <h3>What We Offer</h3>
                            <ul>
                                <li>30 days paid vacation</li>
                                <li>Flexible working hours with flexitime</li>
                                <li>Mobile and remote work options</li>
                                <li>Capital-forming benefits and company pension</li>
                                <li>Z FIT wellness program with company bikes</li>
                                <li>Z COLOURFUL diversity and inclusion initiatives</li>
                                <li>Extensive training and development opportunities</li>
                                <li>Permanent employment contract</li>
                            </ul>
                        </div>
                        
                        <div class="job-section application-section">
                            <h3>🚀 Ready to Apply?</h3>
                            <div class="application-info">
                                <p>To apply for this position at Zeppelin Power Systems:</p>
                                
                                <div class="process-steps">
                                    <div class="step">
                                        <strong>1. Required Documents:</strong>
                                        <ul>
                                            <li>✅ CV/Resume (mandatory)</li>
                                            <li>📄 Cover letter (optional)</li>
                                            <li>📋 References (optional)</li>
                                        </ul>
                                    </div>
                                    
                                    <div class="step">
                                        <strong>2. Application Method:</strong>
                                        <p>Apply online via our application portal</p>
                                    </div>
                                    
                                    <div class="step">
                                        <strong>3. Response Time:</strong>
                                        <p>You will receive initial feedback within 7 days</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="popup-footer">
                        <button class="apply-btn" onclick="window.chatbot.closePopup()">Close</button>
                        <button class="apply-btn primary" onclick="window.chatbot.redirectToApplicationPortal('${job.title}', ${job.id})">Go to Application Portal</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', popup);
    }

    redirectToApplicationPortal(jobTitle, jobId) {
        this.closePopup();
        
        // Create application portal URL (you can modify this to your actual portal URL)
        const applicationPortalUrl = `https://careers.zeppelin-power.com/apply?job=${encodeURIComponent(jobTitle)}&id=${jobId}`;
        
        // Show confirmation message
        this.addBotMessage(`
            <p>Redirecting you to our application portal for <strong>${jobTitle}</strong>...</p>
            <p>If the redirect doesn't work automatically, please click the link below:</p>
            <p><a href="${applicationPortalUrl}" target="_blank" class="portal-link">🔗 Open Application Portal</a></p>
        `);
        
        // Attempt to redirect after a short delay
        setTimeout(() => {
            try {
                window.open(applicationPortalUrl, '_blank');
            } catch (error) {
                console.error('Redirect failed:', error);
                this.addBotMessage(`
                    <p>⚠️ Automatic redirect failed. Please click the link above to access the application portal.</p>
                    <p>Alternatively, you can:</p>
                    <ul>
                        <li>📧 Send your CV to: <strong>careers@zeppelin-power.com</strong></li>
                        <li>📋 Subject line: "Application for ${jobTitle}"</li>
                    </ul>
                `);
            }
        }, 1500);
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ZeppelinChatbot();
});

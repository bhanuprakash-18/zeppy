# Zeppelin Power Systems - HR Chatbot

## Overview
A simple, working chatbot prototype for Zeppelin Power Systems that helps users with job inquiries, company information, and HR policies. The chatbot runs 100% locally without requiring any API keys or internet connection.

## Features
- **Job Search**: Find positions across German cities (Hamburg, Berlin, Bremen, Munich, Stuttgart)
- **Company Information**: Learn about mission, values, culture, and locations
- **FAQ Support**: Get answers to common HR questions about benefits, working hours, application process
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Chat Interface**: Interactive chat with typing indicators and smooth animations

## Technologies Used
- **Frontend**: HTML5, CSS3 (with modern gradients and animations), Vanilla JavaScript
- **Data Storage**: Local JSON files
- **Styling**: Black and yellow theme with professional appearance
- **No Dependencies**: Runs entirely in the browser without external libraries

## File Structure
```
Chat_Bot/
├── index.html          # Main chat interface
├── styles.css          # Styling with black/yellow theme
├── script.js           # Chatbot logic and keyword matching
├── jobs.json           # Job listings data
├── faq.json            # Frequently asked questions
├── handbook.json       # Company information and culture
└── README.md           # This file
```

## How to Run

### Method 1: Direct Browser (Recommended)
1. Open `index.html` directly in your web browser
2. Start chatting with the HR assistant

### Method 2: Local Server (if needed for file loading)
If your browser blocks local file loading, serve the files with Python:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

## Usage Examples

Try asking the chatbot:

### Job Queries
- "Show me engineer jobs"
- "Positions in Berlin"
- "Software developer openings"
- "Jobs in Hamburg"

### Company Information
- "Tell me about the company"
- "What is your mission?"
- "Company culture"
- "Office locations"

### HR Questions
- "What are the working hours?"
- "Benefits"
- "How to apply?"
- "Vacation days"
- "Probation period"

## Data Structure

### Jobs (jobs.json)
- 6 realistic job positions across 5 German cities
- Includes salary ranges, requirements, and keywords for matching
- Covers various departments: Engineering, HR, Production, Testing, Marketing

### FAQ (faq.json)
- 8 common HR questions with detailed answers
- Topics: working hours, benefits, application process, culture, relocation
- Keyword-based matching system

### Company Handbook (handbook.json)
- Complete company profile with mission, vision, values
- Detailed culture information
- Office locations with specific focus areas

## Customization

### Adding New Jobs
Edit `jobs.json` and add keywords for better matching:
```json
{
  "title": "New Position",
  "location": "City",
  "keywords": ["keyword1", "keyword2", "city"]
}
```

### Modifying Responses
Update FAQ answers in `faq.json` or company info in `handbook.json`

### Styling Changes
Modify `styles.css` - current theme uses:
- Primary: Black (#000000)
- Accent: Gold (#ffd700)
- Background: Dark gradients
- Modern chat bubble design

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Future Enhancements
- Multi-language support (German translations)
- More sophisticated NLP matching
- Admin panel for content management
- Integration with applicant tracking systems
- Voice input/output capabilities

## License
© 2025 Zeppelin Power Systems - Educational/Prototype Use

---

**Note**: This is a prototype with sample data. All company information, job listings, and policies are fictional and created for demonstration purposes only.

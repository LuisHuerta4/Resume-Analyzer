# AI Resume Analyzer

Resume Radar is a web application that helps job seekers improve their resumes by providing **AI-powered, job-specific feedback**. Users can upload their resumes, enter job details, and instantly receive **ATS scores, strengths, weaknesses, and tailored suggestions** for improvement.  

--- 

## Built With
[![React][react-shield]][react-url]
[![TypeScript][typescript-shield]][typescript-url]
[![React Router][reactrouter-shield]][reactrouter-url]
[![Node.js][node-shield]][node-url]
[![TailwindCSS][tailwind-shield]][tailwind-url]
[![Zustand][zustand-shield]][zustand-url]
[![JavaScript][javascript-shield]][javascript-url]
[![Puter][puter-shield]][puter-url]

---

## Features

- **User Authentication** with Puter  
- **Upload Resumes**  
- **Automatic PDF Preview Thumbnails**  
- **AI-Powered Feedback**:
  - ATS score  
  - Strengths & weaknesses  
  - Suggestions for improvement  
  - Breakdown of tone, style, content, and skills  
- **Interactive Visualization**:
  - Score gauges  
  - Badges for improvement areas  
  - Accordion-style expandable details  
- **Persistent Resume History**:
  - Track past uploads and feedback  
  - View ATS scores at a glance  

---

## How It Works

1. **Authentication**  
   - Users sign in through the **Puter API** for secure login.  
   - Session management is handled client-side

<img src="public\images\Screens\Login-Page.png" width="auto" height="600">

3. **Resume Upload**  
   - Users upload resumes in **PDF format**.  
   - Resumes are stored via **Puter File System**.  
   - A **PDF-to-image converter** generates preview thumbnails for quick visual reference.  

4. **Job Details Input**  
   - Users provide information such as:  
     - Job Title  
     - Company  
     - Location  
     - Job Description

<img src="public\images\Screens\Upload-Page.png" width="auto" height="600">

5. **AI Feedback Generation**  
   - Job details + the uploaded resume are sent to **Puter’s AI service**.  
   - The AI analyzes resumes for:  
     - ATS Score  
     - Strengths  
     - Weaknesses  
     - Suggestions for improvement  
     - Detailed breakdown of **tone, content, structure, and skills**

<img src="public\images\Screens\Feedback-Page.png" width="auto" height="600">
<img src="public\images\Screens\Details-Page.png" width="auto" height="600">

6. **Dashboard & Feedback Display**  
   - Home page displays all uploaded resumes with quick ATS score summaries.  
   - Each resume can be clicked to view **in-depth analysis**:  
     - ATS score with visual gauge  
     - Strengths and weaknesses  
     - Suggestions for improvement  
     - Breakdown of **tone, style, structure, and skills** with expandable accordions
    
<img src="public\images\Screens\Home-Page.png" width="auto" height="600">

---
<!-- Badge References -->
[puter-shield]: https://img.shields.io/badge/Puter-API-000000?style=for-the-badge&logo=puter&logoColor=white
[puter-url]: https://developer.puter.com/

[react-shield]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev/

[typescript-shield]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/

[reactrouter-shield]: https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white
[reactrouter-url]: https://reactrouter.com/

[node-shield]: https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white
[node-url]: https://nodejs.org/


[tailwind-shield]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[tailwind-url]: https://tailwindcss.com/

[zustand-shield]: https://img.shields.io/badge/Zustand-323330?style=for-the-badge&logo=react&logoColor=white
[zustand-url]: https://github.com/pmndrs/zustand

[javascript-shield]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[javascript-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript

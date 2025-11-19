# AI Usage Declaration Form - Assignment 1

**Student Information:**

- **Name:** [NG Yu Ham Baldwin]
- **Student ID:** [S24510598]
- **Group Number:** [11]
- **Submission Date:** [19/11/2025]

## Declaration

I hereby declare that I have used AI tools in the development of this assignment. I understand that:

- AI assistance must be properly documented
- I must understand any AI-generated code I use
- I must be able to explain and modify any AI-generated code
- All AI-generated code must be integrated and adapted by me
- Failure to declare AI usage may result in academic penalties
- This form is mandatory for submission

## AI Tool Usage Summary

**Did you use any AI tools for this assignment?** [✔️] Yes [ ] No

If yes, please provide a brief summary of your AI usage:

### AI Tools Used

1. **Claude (Anthropic)** - Primary AI assistant for code generation and learning
2. **ChatGPT (OpenAI)** - Secondary reference for debugging and concept clarification
3. **GitHub Copilot** - Code completion and IntelliSense

### Summary of AI Assistance

**What did you use AI for?** (e.g., debugging, learning concepts, generating boilerplate code, code review)

```
[I used AI tools extensively throughout the development process.
These tools assisted with learning concepts, generating code, debugging errors, modifying documentation, and applying best practices.]
```

**What percentage of your code was AI-generated?**

- [ ] Less than 10%
- [ ] 10-25%
- [ ] 25-50%
- [ ] 50-75%
- [✔️] More than 75%

**How did you modify and integrate AI-generated code?**

```
[I adapted AI suggestions to align with my preferences and existing conventions. 
This included reorganising the file structure, adjusting API endpoint paths, modifying variable naming, correcting file path handling, refining frontend integration, enhancing error messages, and simplifying import statements.]
```

**Understanding Check:**
**Can you explain how the AI-generated code works?** (e.g., what each function does, how the logic flows, what the key concepts are)

```
[The `database.js` establishes a SQLite connection with schema from `schema.sql` then wraps callback-based operations in Promises for async/await compatibility.
It uses `executeQuery()` for SELECT and `executeModification()` for INSERT/UPDATE/DELETE.

The `server.js`, `images.js` and `labels.js` are RESTful endpoints, `server.js` is the API and the others are routers.
They use `multer` middleware to intercept file uploads before the route handler runs.
They have functions with parameterised queries to call database.
Uses JOIN queries to combine data and CASCADE DELETE to remove related annotations when an image or label is deleted.
Images and labels have a many-to-many relationship and `annotations` table is a junction table that links them.

Frontend page is `index.html` and `index.js` fetches data from backend endpoints and displays images with their labels.
It uses Fetch API to make HTTP requests to the backend.
It handles responses with `.then()` chains or async/await, and updates the DOM with `document.getElementById()` and `createElement()` to show images and labels.
It also updates the UI dynamically when new images or labels are added or deleted. (AJAX pattern)]
```

**Modification Evidence:**
**What changes did you make to the AI-generated code?** (e.g., variable names, logic adjustments, integration with your existing code)

```
[Changed all `/api/` routes to `/API/` to maintain consistency with my other project (Pour Rice restaurant app).
Changed some function parameters to match my coding style (e.g., `req/res` → `request/response`).

Modified the image upload route to store web-friendly relative paths:
   (images.js)
   // AI suggested:
   file.path
   // I changed to:
   path.posix.join('uploads/images', file.filename)

   Simplified the label display logic because my API returns label names as strings, not objects:
   (index.js)
   // AI suggested:
   image.labels.map(label => label.labelName)
   
   // I changed to:
   image.labels.map(labelName => labelName)
]
```

---

## Additional External Assistance

**Online Resources Used:**

https://inloop.github.io/sqlite-viewer/ - For checking and validating SQLite database content.

**Group Discussion Contributions:**

This is an individual project (Group of 1), so no group discussions occurred.

## Learning Reflection

**What did you learn from using AI tools?**

```
[I learned how the evolution from callbacks → Promises → async/await and why I need these patterns for I/O operations.
I also learned the evolution from callbacks → Promises → async/await and why we need these patterns for I/O operations.]
```

**What challenges did you face when integrating AI-generated code?**

```
[AI used OS-specific path separators (`\` on Windows) but web URLs need forward slashes. Fixed by using `path.posix.join()`.
AI's schema initialisation ran asynchronously, causing race conditions. And I fixed it by using `sqlite3` command manually.
I also had to manually fix all import statements after reorganising file structure.]
```

**How did you ensure the final code was your own work?**

```
[I tested every endpoint multiple times with different scenarios.
I forced myself to understand each line of code by reading comments AI generated and Googled concepts I was unfamiliar with.
I connected all the pieces myself, ensuring the frontend wire to the backend, vice versa.
]
```

## Declaration of Originality

I declare that:

- [✔️] I have properly documented all AI assistance used in this project
- [✔️] All AI-generated code has been modified and integrated by me
- [✔️] I understand the concepts and can explain the code I submitted
- [✔️] The final submission represents my own understanding and implementation
- [ ] I have not copied code directly from AI tools without modification (Only the CSS is copied directly)
- [✔️] I have not used AI tools to generate the entire assignment

**Student Signature:** [NG Yu Ham Baldwin]  
**Date:** [19/11/2025]

---

## Grading Impact

Based on your AI usage, you will receive:

- [ ] **Full Credit (100%)**: Minimal AI assistance with proper documentation
- [ ] **Reduced Credit (70%)**: Significant AI assistance with proper documentation
- [ ] **Penalty (50%)**: AI assistance without proper documentation
- [ ] **Academic Misconduct (0%)**: Undisclosed AI usage or plagiarism

**Note:** This form will be reviewed by the lecturer to determine the appropriate grading level for your submission.

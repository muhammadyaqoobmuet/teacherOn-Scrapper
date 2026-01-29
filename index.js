import { chromium } from "playwright";
import * as cheerio from "cheerio";
import fs from "fs";

// Main URL to scrape
const BASE_URL = "https://www.teacheron.com/tutor-jobs";


const CS_KEYWORDS = [
  //  CORE COMPUTER SCIENCE
  "computer science", "computer programming", "software", "coding", "code",
  "computer", "computing", "informatics", "cs ",

  //  OPERATING SYSTEMS
  "operating system", "os", "linux", "unix", "windows", "macos", "ubuntu",
  "debian", "fedora", "centos", "red hat", "kali", "shell scripting", "bash",
  "powershell", "terminal", "command line", "cli",

  //  PROGRAMMING FUNDAMENTALS
  "programming", "programming fundamentals", "programming basics",
  , "object oriented", "functional programming",
  "procedural programming","arrays",

  //  DATA STRUCTURES
  "data structure", "array", "linked list", "stack", "queue", "tree",
  "binary tree", "heap", "hash", "graph", "trie",



  // === PROGRAMMING LANGUAGES ===
  "python", "javascript", "java", "c++", "c programming", "c#", "c sharp",
  "typescript", "golang", "go lang", "rust", "swift", "kotlin", "scala",
  "ruby", "perl", "php", "r programming", "matlab", "julia", "dart",
  "objective-c", "assembly", "fortran", "cobol", "haskell", "erlang",
  "elixir", "clojure", "f#", "vb.net", "visual basic", "lua", "groovy",

  // === WEB DEVELOPMENT - FRONTEND ===
  "web development", "web design", "web application", "frontend", "front-end",
  "front end", "html", "css", "sass", "scss", "less", "bootstrap", "tailwind",
  "tailwindcss", "material ui", "chakra ui", "ant design",
  "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs",
  "vue.js", "svelte", "next.js", "nextjs", "nuxt", "gatsby", "remix",
  "jquery", "dom", "responsive design", "responsive web",

  // === WEB DEVELOPMENT - BACKEND ===
  "backend",
  "node.js", "nodejs", "express", "expressjs", "express.js",
  "django", "flask", "fastapi", "spring", "spring boot", "springboot",
  "laravel", "symfony", "codeigniter", "ruby on rails", "rails",
  "asp.net", "asp net", ".net", "dotnet", ".net core",
  "nestjs", "nest.js", "koa", "hapi", "fastify",

  //  FULL STACK
  "full stack", "fullstack", "full-stack", "mern", "mean",

  //  MOBILE DEVELOPMENT
  "mobile development", "mobile app",  "app development",
  "flutter", "react native", "kotlin", "swift",  "expo",

  //  DATABASES
  "database", "sql", "mysql", "postgresql", "postgres", "sqlite", "oracle",
  "sql server", "mssql", "mariadb", "nosql", "mongodb", "mongoose",
  "cassandra", "couchdb", "dynamodb", "firebase", "firestore",
  "redis",  "elasticsearch", "neo4j", "graph database",
  "database design", "database management", "dbms", "rdbms",
  "stored procedure", "trigger", "indexing", "normalization",

  //  API & WEB SERVICES
  "api", "rest api", "restful", "graphql", "grpc", "soap", "websocket",
  "webhook", "microservices", "micro services", "json", "xml",
  "postman", "swagger", "openapi",

  //  CLOUD & DEVOPS
  "cloud", "cloud computing", "aws", "amazon web services",
  "azure", "microsoft azure",  "google cloud", "digitalocean",
  "heroku", "vercel", "netlify", "railway", "render",
  "devops", "ci/cd", "ci cd", "continuous integration",

  //  VERSION CONTROL
  "git", "github", "gitlab", "bitbucket",

  //  NETWORKING
  "networking", "network", "http", "https",
   "vpn", "firewall", "routing", "switching", "ip address",
 "osi model", "network security", "load balancer",
  "nginx", "apache", "iis", "proxy", "reverse proxy",
  "cisco", "ccna", "ccnp", "comptia network", "network+",

  //  CYBERSECURITY
  "cyber security", "cybersecurity"

  //  DATA SCIENCE & AI/ML
  "data science", "data analysis", "data analytics", "big data",
  "machine learning", "deep learning", "artificial intelligence", "ai",
  "statistics",  "regression", "classification",
  "clustering", "reinforcement learning", "generative ai", "llm",
  "chatgpt", "openai", "langchain", "hugging face", "transformers",
  "agentic ai", "prompt engineering",

  //  TESTING & QA
   "software testing", "automation testing", "qa",
  "quality assurance", "unit testing", "integration testing", "api testing",

  //  SOFTWARE ENGINEERING
  "software engineering", "software development", "sdlc",
  "agile", "scrum", "kanban", "waterfall", "sprint",
  "design patterns", "solid principles", "clean code",
  "code review", "refactoring", "debugging", "troubleshooting",
  "uml", "system design", "architecture", "microservice architecture",

  //  SPECIFIC TECHNOLOGIES & FRAMEWORKS
  "wordpress", "shopify", "woocommerce", "magento", "drupal", "joomla",
  "strapi", "contentful", "headless cms", "sanity",
  "graphql", "apollo", "prisma", "sequelize", "typeorm",
  "socket.io", "rabbitmq", "kafka", "celery", "message queue",
  "electron", "tauri", "pwa", "progressive web app",

  //  EMBEDDED & HARDWARE
  "embedded systems", "embedded programming", "arduino", "raspberry pi",
  "iot"

  //  GAME DEVELOPMENT
  "game development", "game programming", "unity", "unreal engine",


  //  BLOCKCHAIN
  "blockchain",

  //  PROJECT MANAGEMENT
  "jira", "trello", "asana", "confluence",
  "pmp", "itil", "servicenow",

  //  SPECIFIC TOOLS
  "vscode", "visual studio", "intellij", "pycharm", "eclipse",
   "vim", "emacs", "xcode", "android studio",
  "figma", "adobe xd", "sketch",

  //  ACADEMIC CS SUBJECTS (PRACTICAL)
  "computer network", "computer architecture", "compiler",



];

// Keywords to EXCLUDE (theory/non-practical subjects)
const EXCLUDE_KEYWORDS = [
  "discrete mathematics", "discrete structure", "discrete math",
  "theory of computation", "automata theory", "formal language",
  "mathematical logic", "set theory", "propositional logic",
  "predicate logic", "proof", "theorem",
];


function isCSRelated(job) {
  const searchText = `${job.title} ${job.subjects.join(" ")} ${job.description}`.toLowerCase();

  // Checking for  keywords first
  for (const exclude of EXCLUDE_KEYWORDS) {
    if (searchText.includes(exclude.toLowerCase())) {
      return false;
    }
  }

  // Check for CS keywords
  return CS_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
}

// extract that data form card basic deatiles
function extractBasicJobData($, jobElement) {
  const $job = $(jobElement);

  // Check for wifi icon online availability)
  const wifiIcon = $job.find("i.fas.fa-wifi");
  const wifiParent = wifiIcon.closest("li");
  const hasWifiIcon = wifiIcon.length > 0;
  const isGreyedOut = wifiParent.attr("style")?.includes("opacity") ||
                      wifiIcon.hasClass("color-grey");

  if (!hasWifiIcon || isGreyedOut) {
    return null;
  }


  const titleLink = $job.find("h3 a");
  const title = titleLink.text().trim();
  const url = titleLink.attr("href") || "";


  const subjects = [];
  $job.find(".subjectTags a").each((i, el) => {
    subjects.push($(el).text().trim());
  });


  const description = $job.find(".job-description").text().trim();


  let location = "";
  $job.find(".down-ul li").each((i, el) => {
    const $li = $(el);
    if ($li.find(".fa-map-marker-alt").length > 0) {
      location = $li.find("span span").last().text().trim();
    }
  });

  // Price/Rate
  let price = "";
  $job.find(".down-ul li").each((i, el) => {
    const $li = $(el);
    if ($li.find(".currencyDisplay").length > 0) {
      price = $li.text().trim().replace(/\s+/g, " ");
    }
  });

  return {
    title,
    url,
    subjects,
    description,
    location,
    price,
  };
}


async function extractDetailedJobInfo(page, jobUrl) {
  try {
    await page.goto(jobUrl, { waitUntil: "networkidle", timeout: 60000 });

    try {
      await page.waitForSelector(".job-description", { timeout: 10000 });
    } catch (e) {
      return null;
    }

    const html = await page.content();
    const $ = cheerio.load(html);


    const title = $("h3.no-margin-top-").first().text().trim();


    const subjects = [];
    $(".tags-v2 a.searchLean").each((i, el) => {
      subjects.push($(el).text().trim());
    });


    let location = "";
    $(".down-ul li").each((i, el) => {
      const $li = $(el);
      if ($li.find(".fa-map-marker-alt").length > 0) {
        location = $li.find("span").last().text().trim();
      }
    });


    let postedTime = "";
    $(".down-ul li").each((i, el) => {
      const $li = $(el);
      if ($li.find(".fa-calendar-alt").length > 0) {
        postedTime = $li.text().replace("Posted :", "").trim();
      }
    });


    let jobType = "";
    $(".down-ul li").each((i, el) => {
      const $li = $(el);
      if ($li.text().includes("Requires :")) {
        jobType = $li.text().replace("Requires :", "").trim();
      }
    });


    let postedBy = "";
    let posterType = "";
    $(".down-ul li").each((i, el) => {
      const $li = $(el);
      const text = $li.text();
      if (text.includes("Posted by :")) {
        postedBy = text.replace("Posted by :", "").trim().split("(")[0].trim();
        const match = text.match(/\(([^)]+)\)/);
        if (match) posterType = match[1].trim();
      }
    });

    const phoneVerified = $(".down-ul li").text().includes("Phone verified");

    let genderPreference = "";
    $(".down-ul li").each((i, el) => {
      const $li = $(el);
      if ($li.text().includes("Gender Preference :")) {
        genderPreference = $li.text().replace("Gender Preference :", "").trim();
      }
    });

    const onlineAvailable = $(".down-ul li").text().includes("Available online");
    const homeTutoring = !$(".down-ul li").text().includes("Not available for home tutoring");
    const canTravel = !$(".down-ul li").text().includes("Can not travel");

    let languages = "";
    $(".down-ul li").each((i, el) => {
      const $li = $(el);
      if ($li.text().includes("Can communicate in :")) {
        languages = $li.text().replace("Can communicate in :", "").trim();
      }
    });

    const description = $("p.job-description").text().trim();

    return {
      title,
      subjects,
      location,
      postedTime,
      jobType,
      postedBy,
      posterType,
      phoneVerified,
      genderPreference,
      onlineAvailable,
      homeTutoring,
      canTravel,
      languages,
      description,
    };
  } catch (e) {
    console.log(`      Error: ${e.message.substring(0, 50)}`);
    return null;
  }
}


async function scrapePage(page, url) {
  console.log(`  Page: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  } catch (e) {
    console.log(`    Failed: ${e.message}`);
    return [];
  }

  try {
    await page.waitForSelector(".highlightDivOnHover", { timeout: 15000 });
  } catch (e) {
    console.log(`    No listings`);
    return [];
  }

  const html = await page.content();
  const $ = cheerio.load(html);

  const jobs = [];
  $(".highlightDivOnHover").each((i, el) => {
    const jobData = extractBasicJobData($, el);
    if (jobData && jobData.title) {
      jobs.push(jobData);
    }
  });

  console.log(`    Found ${jobs.length} online jobs`);
  return jobs;
}


async function scrapeAllPages(page, maxPages = 100) {
  const allJobs = [];
  let pageNum = 1;
  let consecutiveEmptyPages = 0;

  while (consecutiveEmptyPages < 2 && pageNum <= maxPages) {
    const url = pageNum === 1 ? BASE_URL : `${BASE_URL}?p=${pageNum}`;
    const jobs = await scrapePage(page, url);

    if (jobs.length === 0) {
      consecutiveEmptyPages++;
    } else {
      consecutiveEmptyPages = 0;
      allJobs.push(...jobs);
    }

    pageNum++;
  }

  return allJobs;
}


async function scrapeCSJobs() {
  console.log("=".repeat(60));
  console.log("TeacherOn CS Jobs Scraper - COMPREHENSIVE");
  console.log("=".repeat(60));
  console.log(`\nUsing ${CS_KEYWORDS.length} CS keywords`);
  console.log(`Excluding ${EXCLUDE_KEYWORDS.length} theory keywords`);
  console.log("Only jobs with wifi icon (online available)\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Step 1: Scraping job listings...\n");
    const allJobs = await scrapeAllPages(page);

    console.log(`\nStep 2: Filtering for CS jobs...`);

    let csJobs = allJobs.filter(job => isCSRelated(job));


    const seenUrls = new Set();
    csJobs = csJobs.filter(job => {
      if (seenUrls.has(job.url)) return false;
      seenUrls.add(job.url);
      return true;
    });

    console.log(`Found ${csJobs.length} unique CS jobs\n`);

    console.log("Step 3: Fetching detailed info...\n");

    const detailedJobs = [];
    for (let i = 0; i < csJobs.length; i++) {
      const job = csJobs[i];
      process.stdout.write(`  [${i + 1}/${csJobs.length}] Fetching details...\r`);

      const details = await extractDetailedJobInfo(page, job.url);

      if (details) {
        detailedJobs.push({
          url: job.url,
          ...details,
          price: job.price,
        });
      } else {
        detailedJobs.push({
          ...job,
          phoneVerified: false,
          genderPreference: "",
          onlineAvailable: true,
          homeTutoring: false,
          canTravel: false,
          languages: "",
          postedTime: "",
          jobType: "",
          postedBy: "",
          posterType: "",
        });
      }
    }

    console.log("\n\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total online jobs scraped: ${allJobs.length}`);
    console.log(`CS-related jobs: ${detailedJobs.length}`);

    const output = {
      scrapedAt: new Date().toISOString(),
      totalCSJobs: detailedJobs.length,
      jobs: detailedJobs,
    };

    fs.writeFileSync("cs_jobs_detailed.json", JSON.stringify(output, null, 2));
    console.log(`\nSaved to cs_jobs_detailed.json`);

    return detailedJobs;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeCSJobs()
  .then((jobs) => {
    console.log(`\nDone! ${jobs.length} CS jobs with details.`);
  })
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });

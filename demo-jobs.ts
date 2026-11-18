```ts
const locations = [
  "Pune",
  "Hinjawadi",
  "Baner",
  "Wakad",
  "Kharadi",
  "Hadapsar",
  "Magarpatta",
  "Pimpri",
  "Chinchwad",
  "Bhosari",
  "Chakan",
  "Talegaon",
  "Talawade",
  "Akurdi",
  "Nigdi",
];

const roles = [
  { title: "Frontend Developer", industry: "Technology", skills: ["React", "TypeScript", "CSS"], min: 300000, max: 900000 },
  { title: "Backend Developer", industry: "Technology", skills: ["Node.js", "PostgreSQL", "APIs"], min: 400000, max: 1100000 },
  { title: "Full Stack Developer", industry: "Technology", skills: ["Next.js", "React", "SQL"], min: 450000, max: 1200000 },
  { title: "Python Developer", industry: "Technology", skills: ["Python", "Django", "SQL"], min: 350000, max: 950000 },
  { title: "Java Developer", industry: "Technology", skills: ["Java", "Spring Boot", "REST APIs"], min: 400000, max: 1100000 },
  { title: "QA Engineer", industry: "Technology", skills: ["Testing", "Selenium", "Automation"], min: 300000, max: 800000 },
  { title: "UI UX Designer", industry: "Design", skills: ["Figma", "Prototyping", "User Research"], min: 300000, max: 850000 },
  { title: "Data Analyst", industry: "Technology", skills: ["SQL", "Excel", "Power BI"], min: 350000, max: 900000 },
  { title: "DevOps Engineer", industry: "Technology", skills: ["AWS", "Docker", "CI/CD"], min: 500000, max: 1400000 },
  { title: "Cybersecurity Analyst", industry: "Technology", skills: ["Networking", "Security", "Linux"], min: 400000, max: 1100000 },

  { title: "Mechanical Engineer", industry: "Automotive", skills: ["AutoCAD", "Manufacturing", "Design"], min: 300000, max: 750000 },
  { title: "Automotive Design Engineer", industry: "Automotive", skills: ["CATIA", "CAD", "Product Design"], min: 400000, max: 1000000 },
  { title: "Quality Engineer", industry: "Manufacturing", skills: ["Quality Control", "ISO", "Inspection"], min: 280000, max: 700000 },
  { title: "Production Engineer", industry: "Manufacturing", skills: ["Production", "Lean Manufacturing", "Planning"], min: 300000, max: 750000 },
  { title: "Electrical Engineer", industry: "Engineering", skills: ["Electrical Systems", "PLC", "Maintenance"], min: 300000, max: 800000 },
  { title: "EV Systems Engineer", industry: "Automotive", skills: ["EV Systems", "Battery Technology", "Testing"], min: 450000, max: 1100000 },

  { title: "Clinical Research Associate", industry: "Healthcare", skills: ["Clinical Research", "Documentation", "GCP"], min: 350000, max: 850000 },
  { title: "Pharmacist", industry: "Healthcare", skills: ["Pharmacy", "Medication Safety", "Patient Care"], min: 220000, max: 500000 },
  { title: "Medical Representative", industry: "Healthcare", skills: ["Communication", "Sales", "Healthcare"], min: 250000, max: 600000 },

  { title: "Supply Chain Analyst", industry: "Logistics", skills: ["Excel", "Inventory", "Analytics"], min: 300000, max: 750000 },
  { title: "Logistics Coordinator", industry: "Logistics", skills: ["Logistics", "Planning", "Communication"], min: 240000, max: 550000 },

  { title: "Financial Analyst", industry: "Finance", skills: ["Excel", "Financial Analysis", "Reporting"], min: 350000, max: 900000 },
  { title: "Accountant", industry: "Finance", skills: ["Accounting", "GST", "Tally"], min: 240000, max: 550000 },

  { title: "Digital Marketing Executive", industry: "Marketing", skills: ["SEO", "Social Media", "Analytics"], min: 240000, max: 600000 },
  { title: "Sales Executive", industry: "Sales", skills: ["Sales", "Communication", "CRM"], min: 220000, max: 550000 },

  { title: "HR Executive", industry: "Human Resources", skills: ["Recruitment", "HR Operations", "Communication"], min: 240000, max: 600000 },
  { title: "Talent Acquisition Specialist", industry: "Human Resources", skills: ["Hiring", "Sourcing", "Interviewing"], min: 300000, max: 750000 },

  { title: "Business Development Executive", industry: "Business", skills: ["Business Development", "CRM", "Negotiation"], min: 250000, max: 650000 },
  { title: "Customer Support Executive", industry: "Customer Service", skills: ["Communication", "Problem Solving", "CRM"], min: 200000, max: 450000 },

  { title: "School Teacher", industry: "Education", skills: ["Teaching", "Communication", "Lesson Planning"], min: 220000, max: 500000 },
  { title: "Training Coordinator", industry: "Education", skills: ["Training", "Coordination", "Communication"], min: 250000, max: 600000 },
];

const companies = [
  "Northstar Labs",
  "Pune Digital Works",
  "Western Tech Solutions",
  "BluePeak Systems",
  "Vertex Engineering Studio",
  "Deccan Manufacturing Group",
  "GreenMotion Mobility",
  "Pioneer Industrial Works",
  "BrightPath Healthcare",
  "Summit Logistics Network",
  "SilverOak Financial Services",
  "UrbanEdge Consulting",
  "NextWave Technologies",
  "Cobalt Innovation Labs",
  "Aster Business Solutions",
  "Meridian Design Works",
  "Evergreen Learning Centre",
  "PrimeRoute Supply Chain",
  "NovaCore Systems",
  "Crestline Services",
];

const workModes = ["ONSITE", "HYBRID", "REMOTE"] as const;

const employmentTypes = ["FULL_TIME", "CONTRACT", "PART_TIME"] as const;

export const demoJobs = Array.from({ length: 200 }, (_, index) => {
  const role = roles[index % roles.length];
  const location = locations[index % locations.length];
  const company = companies[index % companies.length];

  return {
    id: `demo-job-${index + 1}`,
    title: role.title,
    description:
      `DEMO VACANCY ${index + 1}: ${company} is showcasing a sample ${role.title} position in ${location}, Pune region. This fictional listing demonstrates how employers can describe responsibilities, required experience, skills and job expectations on RecruitAI. This is not a verified vacancy.`,
    location,
    workMode: workModes[index % workModes.length],
    salaryMin: role.min,
    salaryMax: role.max,
    experienceMinYears: index % 4,
    experienceMaxYears: (index % 4) + 3,
    employmentType: employmentTypes[index % employmentTypes.length],
    industry: role.industry,
    skills: role.skills,
    maxNoticePeriodDays: 60,
    postedAt: new Date(Date.now() - index * 3600000).toISOString(),
    company: {
      id: `demo-company-${(index % companies.length) + 1}`,
      name: `Demo company · ${company}`,
      industry: role.industry,
      city: location,
    },
    demoLabel: "DEMO DATA · NOT A REAL OPENING",
    saved: false,
  };
});
```

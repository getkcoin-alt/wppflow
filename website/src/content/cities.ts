export type City = {
  slug: string;
  name: string;
  country: "UAE" | "India";
  region: string;
  /** Business districts named on the page (local relevance, not addresses). */
  hubs: string[];
  industries: string[];
  local: string;
  geo: { lat: number; lng: number };
};

export const CITIES: City[] = [
  // United Arab Emirates
  {
    slug: "dubai", name: "Dubai", country: "UAE", region: "Dubai",
    hubs: ["Business Bay", "DIFC", "JLT", "Dubai Marina", "Deira", "Dubai Silicon Oasis"],
    industries: ["real-estate", "travel-agencies", "automobile-dealers", "clinics-and-healthcare"],
    local: "Dubai runs on WhatsApp. Brokers, clinics and car showrooms answer customers in English, Arabic, Hindi and Urdu, often late into the evening. Teams here need a shared view because one enquiry can pass through three people before it closes.",
    geo: { lat: 25.2048, lng: 55.2708 },
  },
  {
    slug: "abu-dhabi", name: "Abu Dhabi", country: "UAE", region: "Abu Dhabi",
    hubs: ["Al Maryah Island", "Khalifa City", "Mussafah", "Al Reem Island"],
    industries: ["real-estate", "clinics-and-healthcare", "education-and-coaching", "insurance-and-finance"],
    local: "Abu Dhabi companies tend to have larger, more structured teams and care about oversight. Roles, an audit log and staff who only see their own chats matter here.",
    geo: { lat: 24.4539, lng: 54.3773 },
  },
  {
    slug: "sharjah", name: "Sharjah", country: "UAE", region: "Sharjah",
    hubs: ["Al Majaz", "Al Nahda", "Industrial Area", "Muwaileh"],
    industries: ["ecommerce-and-d2c", "education-and-coaching", "automobile-dealers", "jewellery-and-retail"],
    local: "Sharjah's traders, schools and showrooms serve customers across the northern emirates, many of whom commute to Dubai. WhatsApp is how they book, confirm and follow up.",
    geo: { lat: 25.3463, lng: 55.4209 },
  },
  {
    slug: "ajman", name: "Ajman", country: "UAE", region: "Ajman",
    hubs: ["Ajman Free Zone", "Al Nuaimiya", "Al Jurf"],
    industries: ["ecommerce-and-d2c", "real-estate", "jewellery-and-retail"],
    local: "Ajman is home to many free-zone trading companies with small teams handling big volumes. A shared inbox stops one busy phone from becoming a bottleneck.",
    geo: { lat: 25.4052, lng: 55.5136 },
  },
  {
    slug: "ras-al-khaimah", name: "Ras Al Khaimah", country: "UAE", region: "Ras Al Khaimah",
    hubs: ["Al Hamra", "RAKEZ", "Al Nakheel"],
    industries: ["travel-agencies", "real-estate", "clinics-and-healthcare"],
    local: "Ras Al Khaimah's hospitality, property and free-zone businesses deal with visitors and investors who expect a fast reply on WhatsApp.",
    geo: { lat: 25.8007, lng: 55.9762 },
  },
  // India
  {
    slug: "mumbai", name: "Mumbai", country: "India", region: "Maharashtra",
    hubs: ["Bandra Kurla Complex", "Andheri", "Lower Parel", "Powai", "Navi Mumbai"],
    industries: ["real-estate", "ecommerce-and-d2c", "jewellery-and-retail", "insurance-and-finance"],
    local: "Mumbai's brokers, D2C brands and jewellers do business on WhatsApp first. Sales teams are mobile, and managers need to see every lead without taking anyone's phone.",
    geo: { lat: 19.076, lng: 72.8777 },
  },
  {
    slug: "delhi-ncr", name: "Delhi NCR", country: "India", region: "Delhi, Gurugram and Noida",
    hubs: ["Connaught Place", "Gurugram Cyber City", "Noida Sector 62", "Okhla"],
    industries: ["education-and-coaching", "real-estate", "automobile-dealers", "travel-agencies"],
    local: "Across Delhi, Gurugram and Noida, coaching institutes, builders and dealers manage huge enquiry volumes on WhatsApp. Assignment and clear ownership keep leads from going cold.",
    geo: { lat: 28.6139, lng: 77.209 },
  },
  {
    slug: "bengaluru", name: "Bengaluru", country: "India", region: "Karnataka",
    hubs: ["Koramangala", "HSR Layout", "Whitefield", "Indiranagar", "Electronic City"],
    industries: ["ecommerce-and-d2c", "education-and-coaching", "clinics-and-healthcare"],
    local: "Bengaluru's startups want WhatsApp to plug into the rest of their stack. Scoped API keys, signed webhooks and an API tester inside the product make that straightforward.",
    geo: { lat: 12.9716, lng: 77.5946 },
  },
  {
    slug: "hyderabad", name: "Hyderabad", country: "India", region: "Telangana",
    hubs: ["HITEC City", "Gachibowli", "Banjara Hills", "Kondapur"],
    industries: ["real-estate", "clinics-and-healthcare", "education-and-coaching"],
    local: "Hyderabad's hospitals, builders and training institutes handle enquiries in English, Telugu and Hindi. A shared inbox keeps every conversation visible to the team lead.",
    geo: { lat: 17.385, lng: 78.4867 },
  },
  {
    slug: "chennai", name: "Chennai", country: "India", region: "Tamil Nadu",
    hubs: ["T. Nagar", "OMR", "Guindy", "Anna Nagar"],
    industries: ["jewellery-and-retail", "automobile-dealers", "clinics-and-healthcare"],
    local: "Chennai's jewellers, auto dealers and clinics rely on long-standing customer relationships. Scriwo keeps those relationships with the business, not one person's phone.",
    geo: { lat: 13.0827, lng: 80.2707 },
  },
  {
    slug: "pune", name: "Pune", country: "India", region: "Maharashtra",
    hubs: ["Hinjewadi", "Baner", "Kharadi", "Viman Nagar"],
    industries: ["education-and-coaching", "real-estate", "automobile-dealers"],
    local: "Pune's education hub and fast-growing housing market mean heavy seasonal WhatsApp traffic. Teams need to scale up counsellors and agents quickly, each on their own number.",
    geo: { lat: 18.5204, lng: 73.8567 },
  },
  {
    slug: "ahmedabad", name: "Ahmedabad", country: "India", region: "Gujarat",
    hubs: ["SG Highway", "Prahlad Nagar", "GIFT City", "Navrangpura"],
    industries: ["ecommerce-and-d2c", "jewellery-and-retail", "insurance-and-finance"],
    local: "Ahmedabad's traders and manufacturers sell to dealers and customers over WhatsApp every day. CSV import, broadcasts to opted-in buyers and quick replies save hours.",
    geo: { lat: 23.0225, lng: 72.5714 },
  },
  {
    slug: "surat", name: "Surat", country: "India", region: "Gujarat",
    hubs: ["Ring Road textile markets", "Varachha", "Adajan", "Vesu"],
    industries: ["ecommerce-and-d2c", "jewellery-and-retail"],
    local: "Surat's textile and diamond businesses share catalogues and close orders on WhatsApp. Owners want to see every salesperson's chats and keep buyers when staff change.",
    geo: { lat: 21.1702, lng: 72.8311 },
  },
  {
    slug: "jaipur", name: "Jaipur", country: "India", region: "Rajasthan",
    hubs: ["C-Scheme", "Malviya Nagar", "Vaishali Nagar", "Sitapura"],
    industries: ["travel-agencies", "jewellery-and-retail", "education-and-coaching"],
    local: "Jaipur's tour operators, gem and jewellery exporters and coaching centres serve customers across India and the Gulf on WhatsApp.",
    geo: { lat: 26.9124, lng: 75.7873 },
  },
  {
    slug: "udaipur", name: "Udaipur", country: "India", region: "Rajasthan",
    hubs: ["Hiran Magri", "Fatehpura", "City Palace area", "Madri"],
    industries: ["travel-agencies", "jewellery-and-retail"],
    local: "Udaipur's taxi operators, wedding planners and hotels live on WhatsApp in peak season. A shared inbox lets the office see every driver's and planner's guest conversations.",
    geo: { lat: 24.5854, lng: 73.7125 },
  },
  {
    slug: "kolkata", name: "Kolkata", country: "India", region: "West Bengal",
    hubs: ["Salt Lake Sector V", "Park Street", "New Town"],
    industries: ["education-and-coaching", "clinics-and-healthcare", "jewellery-and-retail"],
    local: "Kolkata's institutes, clinics and jewellers serve families who expect a personal reply. Scriwo keeps that personal touch while giving the owner oversight.",
    geo: { lat: 22.5726, lng: 88.3639 },
  },
];

export const cityBySlug = (slug: string) => CITIES.find((c) => c.slug === slug);

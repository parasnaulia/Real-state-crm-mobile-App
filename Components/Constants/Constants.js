export const Url = "http://192.168.29.193:8000/api/";

export const emailUrl = "http://192.168.29.193:3000";

export const ImageUrl = "http://192.168.29.193:8000/Image/";
export const webSocketUrl = "http://192.168.29.193:8000";

// export const Url = "http://localhost:8000/api/";
// export const ImageUrl = "http://localhost:8000/Image/";

// export const webSocketUrl = "http://localhost:8000";

export const options = [
  { label: "Proposal Sent", value: "Proposal Sent" },
  { label: "Interested", value: "Interested" },
  { label: "Negotiation", value: "Negotiation" },
  { label: "Qualified", value: "Qualified" },
  { label: "Closed Won-Converted", value: "Closed Won-Converted" },
  { label: "Closed Won-not Converted", value: "Closed Won-not Converted" },
];

export const enquirySources = [
  { label: "Select Source of Enquiry", value: "" },
  { label: "Website", value: "Website" },
  { label: "Referral", value: "Referral" },
  { label: "Advertisement", value: "Advertisement" },
  { label: "Cold Call", value: "Cold Call" },
];
export const Periode = [
  { label: "Periode", value: "" },
  { label: "Monthly", value: "Monthly" },
  { label: "Quarterly", value: "Quarterly" },
  { label: "Yearly", value: "Yearly" },
];

const currentYear = 2025;

export const Years = Array.from(
  { length: currentYear - 2020 + 1 },
  (_, i) => currentYear - i
);

export const Quater = [
  { label: "Q1 (Jan - Mar)", value: 1 },
  { label: "Q2 (Apr - Jun)", value: 2 },
  { label: "Q3 (Jul - Sep)", value: 3 },
  { label: "Q4 (Oct - Dec)", value: 4 },
];

export const Month = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

export const chartConfig = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0.5,
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false, // optional
};

export const ProjectStatus = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Planning", value: "Planning" },
];
export const locationData = [
  {
    country: "United States",
    states: [
      {
        state: "California",
        cities: ["Los Angeles", "San Francisco", "San Diego"],
      },
      {
        state: "Texas",
        cities: ["Houston", "Dallas", "Austin"],
      },
    ],
  },
  {
    country: "India",
    states: [
      {
        state: "Maharashtra",
        cities: ["Mumbai", "Pune", "Nagpur"],
      },
      {
        state: "Karnataka",
        cities: ["Bengaluru", "Mysuru", "Hubli"],
      },
    ],
  },
  {
    country: "Canada",
    states: [
      {
        state: "Ontario",
        cities: ["Toronto", "Ottawa", "Mississauga"],
      },
      {
        state: "British Columbia",
        cities: ["Vancouver", "Victoria", "Richmond"],
      },
    ],
  },
];

// export const Url = "http://localhost:8000/api/";
// export const ImageUrl = "http://localhost:8000/Image/";

// export const webSocketUrl = "http://localhost:8000";

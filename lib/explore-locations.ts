export type ExploreLocation = {
  id: string;
  label: string;
  category: string;
  description: string;
  image: string;
  x: number;
  y: number;
};

export const EXPLORE_LOCATIONS: ExploreLocation[] = [
  {
    id: "01",
    label: "Location 01",
    category: "Commercial",
    description: "Commercial intersection at Flatbush Ave and Glenwood Rd",
    image: "/explore/location-1.jpg",
    x: 45.9,
    y: 30.9,
  },
  {
    id: "02",
    label: "Location 02",
    category: "Commercial/Transit",
    description: "Exit street for the 2 and 5 MTA Stations",
    image: "/explore/location-2.jpg",
    x: 65.1,
    y: 24.3,
  },
  {
    id: "03",
    label: "Location 03",
    category: "Commercial/Residential",
    description: "Heavy transit intersection at the Junction area",
    image: "/explore/location-3.jpg",
    x: 77,
    y: 27.3,
  },
  {
    id: "04",
    label: "Location 04",
    category: "Commercial/Public",
    description: "Hillel Place closed off street for public recreation",
    image: "/explore/location-4.jpg",
    x: 67.5,
    y: 31.8,
  },
  {
    id: "05",
    label: "Location 05",
    category: "Residential/Student",
    description: "Student co-op housing zone on Campus Rd",
    image: "/explore/location-5.jpg",
    x: 59.1,
    y: 38.2,
  },
  {
    id: "06",
    label: "Location 06",
    category: "Education Hub",
    description: "Main street running through Brooklyn College",
    image: "/explore/location-6.jpg",
    x: 43.1,
    y: 50.7,
  },
  {
    id: "07",
    label: "Location 07",
    category: "Residential",
    description: "Dead end street south of the IBX line",
    image: "/explore/location-7.jpg",
    x: 58.7,
    y: 77.8,
  },
  {
    id: "08",
    label: "Location 08",
    category: "Residential",
    description: "Southern neighborhood typical residential streets along Avenue I",
    image: "/explore/location-8.jpg",
    x: 59,
    y: 88.3,
  },
];

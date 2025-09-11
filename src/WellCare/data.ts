export interface WellCareCustomer {
  agent_name: string;         // always "Maya" (from your screenshot)
  plan_name: string;          // e.g., "Wellcare of Alabama"
  practitioner_name: string;  // e.g., "JENNIFER NELSON"
  office_phone: string;       // digits only
  address: string;            // line 1
  practice_name: string;      // clinic/practice
}

export const wellCareCustomers: WellCareCustomer[] = [
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Alabama",
    practitioner_name: "TIMOTHY WHALEN",
    office_phone: "2563252627",
    address: "600 SUN TEMPLE DR",
    practice_name: "INTEGRATED BEHAVIORAL HEALTH",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Alabama",
    practitioner_name: "JENNIFER NELSON",
    office_phone: "2056189899",
    address: "109 FOOTHILLS PKWY",
    practice_name: "KOLBE CLINIC LLC",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Alabama",
    practitioner_name: "JONATHAN TODD",
    office_phone: "2516628000",
    address: "2419 GORDON SMITH DR",
    practice_name: "ALTAPOINTE HEALTH SYSTEMS INC",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Alabama",
    practitioner_name: "GEORGE MELNYK",
    office_phone: "2568453150",
    address: "600 SUN TEMPLE DR",
    practice_name: "INTEGRATED BEHAVIORAL HEALTH",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Alabama",
    practitioner_name: "RACHEL HOADLEY-CLAUSEN",
    office_phone: "2516335125",
    address: "6720 GRELOT RD",
    practice_name: "KOPP MEDICAL LLC",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Alabama",
    practitioner_name: "HARRISON PEARL",
    office_phone: "2519526659",
    address: "1711 N MCKENZIE ST",
    practice_name: "FOLEY CLINC CORP",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Connecticut",
    practitioner_name: "KATHERINE ZAMECKI VEDDER",
    office_phone: "2032644002",
    address: "1449 OLD WATERBURY RD",
    practice_name: "DANBURY EYE PHYSICIANS SURGEON",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Arkansas",
    practitioner_name: "ANDREA STILLWELL",
    office_phone: "5012364110",
    address: "110 PEARSON",
    practice_name: "COUNSELING CLINIC INC",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Arkansas",
    practitioner_name: "BALAGOPALAN NAIR",
    office_phone: "5019063000",
    address: "1601 N WEST AVE",
    practice_name: "CENTRAL ARKANSAS RADIATION THE",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Arkansas",
    practitioner_name: "RICHARD WHITE",
    office_phone: "8705805280",
    address: "639 HOSPITAL DR",
    practice_name: "HIGHLANDS ONCOLOGY GROUP PA",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Arkansas",
    practitioner_name: "DAVID PRUITT",
    office_phone: "5016222100",
    address: "1455 HIGDON FERRY RD",
    practice_name: "HOT SPRINGS RADIATION ONCOLOGY",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Arkansas",
    practitioner_name: "ANURADHA KUNTHUR",
    office_phone: "5016868000",
    address: "4301 W MARKHAM ST 783",
    practice_name: "THE UNIVERSITY OF ARKANSAS FOR",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Arizona",
    practitioner_name: "AHINOAM CHAVEZ",
    office_phone: "4806411165",
    address: "7565 E EAGLE CREST DR",
    practice_name: "LIFELINE PROFESSIONAL COUNSELI",
  },
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Arizona",
    practitioner_name: "PATRICK OUZTS",
    office_phone: "5209016350",
    address: "1521 E TANGERINE RD STE 315",
    practice_name: "NORTHWEST ALLIED PHYSICIANS",
  },
  // 15th entry to make a full 15. Replace with a real row if you add more.
  {
    agent_name: "Maya",
    plan_name: "Wellcare of Alabama",
    practitioner_name: "SAMPLE PRACTITIONER",
    office_phone: "9999999999",
    address: "100 MAIN ST",
    practice_name: "SAMPLE PRACTICE LLC",
  },
];
